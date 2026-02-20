import type { StateMachineModel } from '../types/codegen';
import type { Chart } from '../types/chart';
import type { SystemBlock, SystemWire, ConstantConfig, SignalGeneratorConfig, ScopeConfig } from '../types/system';
import { evaluateStep, createSimulationContext, type SimulationContext } from './simulator';
import { buildModel } from './model-builder';
import { deserializeChartToCanvas } from '../persistence/serializer';

// ─── Types ─────────────────────────────────────────────────────

/** Maps blockId -> portId -> numeric value */
export type PortValueMap = Map<string, Map<string, number>>;

/** Per-chart block simulation state */
export interface ChartSimState {
  chartId: string;
  model: StateMachineModel;
  simCtx: SimulationContext;
  activeStateId: string;
}

/** Single scope data sample */
export interface ScopeSample {
  tick: number;
  value: number;
}

/** Full system simulation context (mutable, lives in useRef) */
export interface SystemSimContext {
  chartStates: Map<string, ChartSimState>;
  portValues: PortValueMap;
  scopeData: Map<string, ScopeSample[]>;
  displayValues: Map<string, number>;
  tickCount: number;
}

// ─── Execution Order ───────────────────────────────────────────

/**
 * Build topological execution order: sources → charts (topo-sorted) → sinks.
 */
export function buildExecutionOrder(
  blocks: SystemBlock[],
  wires: SystemWire[]
): string[] {
  const sources = blocks.filter(
    (b) => b.type === 'constant' || b.type === 'signalGenerator'
  );
  const charts = blocks.filter((b) => b.type === 'chart');
  const sinks = blocks.filter(
    (b) => b.type === 'scope' || b.type === 'display'
  );

  // Kahn's algorithm for chart-to-chart dependencies
  const chartIds = new Set(charts.map((c) => c.id));
  const inDegree = new Map<string, number>();
  const adjList = new Map<string, string[]>();

  for (const c of charts) {
    inDegree.set(c.id, 0);
    adjList.set(c.id, []);
  }

  for (const wire of wires) {
    if (chartIds.has(wire.sourceBlockId) && chartIds.has(wire.targetBlockId)) {
      adjList.get(wire.sourceBlockId)!.push(wire.targetBlockId);
      inDegree.set(
        wire.targetBlockId,
        (inDegree.get(wire.targetBlockId) ?? 0) + 1
      );
    }
  }

  const queue = charts
    .filter((c) => (inDegree.get(c.id) ?? 0) === 0)
    .map((c) => c.id);
  const sortedCharts: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    sortedCharts.push(current);
    for (const neighbor of adjList.get(current) ?? []) {
      const newDeg = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  // Append any remaining charts (cycles — best-effort for v1)
  for (const c of charts) {
    if (!sortedCharts.includes(c.id)) {
      sortedCharts.push(c.id);
    }
  }

  return [
    ...sources.map((s) => s.id),
    ...sortedCharts,
    ...sinks.map((s) => s.id),
  ];
}

// ─── Initialization ────────────────────────────────────────────

/**
 * Create a fresh system simulation context.
 */
export function createSystemSimContext(
  blocks: SystemBlock[],
  wires: SystemWire[],
  charts: Chart[]
): SystemSimContext {
  const chartStates = new Map<string, ChartSimState>();
  const portValues: PortValueMap = new Map();
  const scopeData = new Map<string, ScopeSample[]>();
  const displayValues = new Map<string, number>();

  for (const block of blocks) {
    // Initialize port value map for every block
    portValues.set(block.id, new Map());

    if (block.type === 'chart' && block.chartId) {
      const chart = charts.find((c) => c.id === block.chartId);
      if (chart) {
        const { nodes, edges } = deserializeChartToCanvas(chart);
        const model = buildModel(nodes, edges, chart.variables, chart.name);
        const simCtx = createSimulationContext(model);

        // Initialize port variables from chart's port defaults (both input AND output)
        for (const port of chart.ports) {
          const defaultVal = Number(port.defaultValue) || 0;
          simCtx.eval.variables[port.name] = defaultVal;
        }

        // Always create ChartSimState so the block participates in simulation.
        // Without a defaultStateId the state machine won't step, but port
        // mapping (input → variable → output) still runs every tick.
        chartStates.set(block.id, {
          chartId: chart.id,
          model,
          simCtx,
          activeStateId: model.defaultStateId ?? '',
        });
      }
    } else if (block.type === 'constant') {
      const config = block.config as unknown as ConstantConfig;
      portValues.get(block.id)!.set('output', config.value);
    } else if (block.type === 'signalGenerator') {
      portValues.get(block.id)!.set('output', 0);
    } else if (block.type === 'scope') {
      scopeData.set(block.id, []);
    } else if (block.type === 'display') {
      displayValues.set(block.id, 0);
    }
  }

  return { chartStates, portValues, scopeData, displayValues, tickCount: 0 };
}

// ─── Tick Execution ────────────────────────────────────────────

/**
 * Execute one tick of the entire system. Mutates ctx in place.
 */
export function executeSystemTick(
  ctx: SystemSimContext,
  blocks: SystemBlock[],
  wires: SystemWire[],
  charts: Chart[],
  executionOrder: string[]
): void {
  ctx.tickCount++;

  for (const blockId of executionOrder) {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) continue;

    switch (block.type) {
      case 'constant':
        executeConstant(block, ctx);
        break;
      case 'signalGenerator':
        executeSignalGenerator(block, ctx);
        break;
      case 'chart':
        executeChartBlock(block, ctx, charts);
        break;
      case 'scope':
        executeScopeBlock(block, ctx);
        break;
      case 'display':
        executeDisplayBlock(block, ctx);
        break;
    }

    // After block produces outputs, propagate via wires
    propagateWires(ctx, wires, blockId);
  }
}

// ─── Block Executors ───────────────────────────────────────────

function executeConstant(block: SystemBlock, ctx: SystemSimContext): void {
  const config = block.config as unknown as ConstantConfig;
  setPortValue(ctx, block.id, 'output', config.value);
}

function executeSignalGenerator(
  block: SystemBlock,
  ctx: SystemSimContext
): void {
  const cfg = block.config as unknown as SignalGeneratorConfig;
  const t = ctx.tickCount;
  const phase = 2 * Math.PI * cfg.frequency * t * 0.01 + (cfg.phase ?? 0);
  let value: number;

  switch (cfg.waveform) {
    case 'sine':
      value = cfg.amplitude * Math.sin(phase) + cfg.offset;
      break;
    case 'square':
      value = cfg.amplitude * (Math.sin(phase) >= 0 ? 1 : -1) + cfg.offset;
      break;
    case 'triangle':
      value =
        cfg.amplitude * ((2 / Math.PI) * Math.asin(Math.sin(phase))) +
        cfg.offset;
      break;
    case 'sawtooth':
      value =
        cfg.amplitude *
          (2 * ((cfg.frequency * t * 0.01 + (cfg.phase ?? 0) / (2 * Math.PI)) % 1) - 1) +
        cfg.offset;
      break;
    default:
      value = cfg.offset;
  }

  setPortValue(ctx, block.id, 'output', value);
}

function executeChartBlock(
  block: SystemBlock,
  ctx: SystemSimContext,
  charts: Chart[]
): void {
  const chartState = ctx.chartStates.get(block.id);
  if (!chartState) return;

  const chart = charts.find((c) => c.id === chartState.chartId);
  if (!chart) return;

  // 1. Map input port values → eval context variables
  for (const port of chart.ports) {
    if (port.direction === 'input') {
      const handleId = `in-${port.id}`;
      const inputValue = getPortValue(ctx, block.id, handleId);
      chartState.simCtx.eval.variables[port.name] = inputValue;
    }
  }

  // 2. Run one state machine step (only if a valid active state exists)
  if (chartState.activeStateId) {
    const result = evaluateStep(
      chartState.model,
      chartState.activeStateId,
      null,
      ctx.tickCount,
      chartState.simCtx
    );

    if (result && result.toStateId) {
      chartState.activeStateId = result.toStateId;
    }
  }

  // 3. Always map output variables → port output values
  //    This ensures data flows through the chart even when no transition fires.
  for (const port of chart.ports) {
    if (port.direction === 'output') {
      const handleId = `out-${port.id}`;
      const value = chartState.simCtx.eval.variables[port.name];
      setPortValue(ctx, block.id, handleId, Number(value) || 0);
    }
  }
}

function executeScopeBlock(block: SystemBlock, ctx: SystemSimContext): void {
  const inputValue = getPortValue(ctx, block.id, 'input');
  const samples = ctx.scopeData.get(block.id) ?? [];
  samples.push({ tick: ctx.tickCount, value: inputValue });

  // Trim to reasonable buffer size
  const cfg = block.config as unknown as ScopeConfig;
  const maxSamples = Math.max(Math.round(cfg.timeWindow * 10), 200);
  if (samples.length > maxSamples) {
    samples.splice(0, samples.length - maxSamples);
  }

  ctx.scopeData.set(block.id, samples);
}

function executeDisplayBlock(block: SystemBlock, ctx: SystemSimContext): void {
  const inputValue = getPortValue(ctx, block.id, 'input');
  ctx.displayValues.set(block.id, inputValue);
}

// ─── Wire Propagation ──────────────────────────────────────────

function propagateWires(
  ctx: SystemSimContext,
  wires: SystemWire[],
  sourceBlockId: string
): void {
  for (const wire of wires) {
    if (wire.sourceBlockId !== sourceBlockId) continue;
    const value = getPortValue(ctx, wire.sourceBlockId, wire.sourcePortId);
    setPortValue(ctx, wire.targetBlockId, wire.targetPortId, value);
  }
}

// ─── Port Value Helpers ────────────────────────────────────────

function getPortValue(
  ctx: SystemSimContext,
  blockId: string,
  portId: string
): number {
  return ctx.portValues.get(blockId)?.get(portId) ?? 0;
}

function setPortValue(
  ctx: SystemSimContext,
  blockId: string,
  portId: string,
  value: number
): void {
  if (!ctx.portValues.has(blockId)) {
    ctx.portValues.set(blockId, new Map());
  }
  ctx.portValues.get(blockId)!.set(portId, value);
}
