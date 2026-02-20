export type SystemBlockType = 'chart' | 'constant' | 'signalGenerator' | 'scope' | 'display' | 'functionBlock';

export interface SystemBlock {
  id: string;
  type: SystemBlockType;
  name: string;
  chartId: string | null;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: Record<string, unknown>;
}

export interface SystemWire {
  id: string;
  sourceBlockId: string;
  sourcePortId: string;
  targetBlockId: string;
  targetPortId: string;
}

// ─── Block Config Types ─────────────────────────────────────────

export interface ConstantConfig {
  value: number;
  dataType: 'BOOL' | 'INT' | 'REAL';
}

export interface SignalGeneratorConfig {
  waveform: 'sine' | 'square' | 'triangle' | 'sawtooth';
  amplitude: number;
  frequency: number;
  offset: number;
  phase: number;
}

export interface ScopeConfig {
  timeWindow: number;
  yMin: number;
  yMax: number;
  autoScale: boolean;
}

export interface DisplayConfig {
  format: 'decimal' | 'hex' | 'binary' | 'boolean';
  label: string;
}

// ─── Default Configs ────────────────────────────────────────────

export const DEFAULT_BLOCK_CONFIGS: Record<SystemBlockType, Record<string, unknown>> = {
  chart: {},
  constant: { value: 0, dataType: 'REAL' } satisfies ConstantConfig as unknown as Record<string, unknown>,
  signalGenerator: { waveform: 'sine', amplitude: 1, frequency: 1, offset: 0, phase: 0 } satisfies SignalGeneratorConfig as unknown as Record<string, unknown>,
  scope: { timeWindow: 10, yMin: -1, yMax: 1, autoScale: true } satisfies ScopeConfig as unknown as Record<string, unknown>,
  display: { format: 'decimal', label: '' } satisfies DisplayConfig as unknown as Record<string, unknown>,
  functionBlock: { defType: 'math.add', params: {} } as Record<string, unknown>,
};

export const DEFAULT_BLOCK_SIZES: Record<SystemBlockType, { width: number; height: number }> = {
  chart: { width: 200, height: 120 },
  constant: { width: 140, height: 80 },
  signalGenerator: { width: 180, height: 100 },
  scope: { width: 240, height: 160 },
  display: { width: 140, height: 80 },
  functionBlock: { width: 120, height: 80 },
};
