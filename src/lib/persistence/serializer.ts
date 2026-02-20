import type { Project, AnnotationData } from '../types/project';
import type { Chart } from '../types/chart';
import type { StateBlock } from '../types/state';
import type { Transition } from '../types/transition';
import type {
  CanvasNode,
  TransitionEdge,
  StateNode,
  DefaultTransitionNode,
  AnnotationNode,
  ChartBlockNode,
  SourceBlockNode,
  SinkBlockNode,
  FunctionBlockNode,
  SystemWireEdge,
} from '../types/canvas';
import type { FunctionBlockConfig } from '../types/function-block';
import type { SystemBlock, SystemWire } from '../types/system';
import { DEFAULT_STATE_SIZE } from '../types/state';
import { EMPTY_TRANSITION_LABEL } from '../types/transition';
import { DEFAULT_ANNOTATION_SIZE } from '../utils/constants';

// ─── Chart Serialization ────────────────────────────────────────

/**
 * Serialize canvas state (nodes + edges) back into a Chart's data
 */
export function serializeCanvasToChart(
  chart: Chart,
  nodes: CanvasNode[],
  edges: TransitionEdge[],
  viewport?: { x: number; y: number; zoom: number }
): Chart {
  const states: StateBlock[] = [];
  const transitions: Transition[] = [];
  const annotations: AnnotationData[] = [];

  for (const node of nodes) {
    if (node.type === 'stateNode') {
      states.push({
        ...node.data.stateBlock,
        position: node.position,
        size: {
          width: (node.style?.width as number) ?? DEFAULT_STATE_SIZE.width,
          height: (node.style?.height as number) ?? DEFAULT_STATE_SIZE.height,
        },
      });
    } else if (node.type === 'annotationNode') {
      annotations.push({
        id: node.id,
        content: node.data.content,
        position: node.position,
        size: {
          width: (node.style?.width as number) ?? DEFAULT_ANNOTATION_SIZE.width,
          height: (node.style?.height as number) ?? DEFAULT_ANNOTATION_SIZE.height,
        },
        color: node.data.color,
        image: node.data.image,
        fontSize: node.data.fontSize ?? 14,
      });
    }
  }

  for (const edge of edges) {
    transitions.push({
      id: edge.id,
      sourceStateId: edge.source,
      targetStateId: edge.target,
      sourceHandle: edge.sourceHandle ?? '',
      targetHandle: edge.targetHandle ?? '',
      label: edge.data?.label ?? { ...EMPTY_TRANSITION_LABEL },
      priority: edge.data?.priority ?? 0,
      isDefault: edge.data?.isDefault ?? false,
    });
  }

  return {
    ...chart,
    states,
    transitions,
    annotations,
    ...(viewport ? { viewport } : {}),
  };
}

/**
 * Deserialize a Chart into canvas nodes and edges
 */
export function deserializeChartToCanvas(chart: Chart): {
  nodes: CanvasNode[];
  edges: TransitionEdge[];
} {
  const nodes: CanvasNode[] = [];
  const edges: TransitionEdge[] = [];

  for (const state of chart.states) {
    const stateNode: StateNode = {
      id: state.id,
      type: 'stateNode',
      position: state.position,
      ...(state.parentId
        ? { parentId: state.parentId, extent: 'parent' as const }
        : {}),
      data: {
        stateBlock: state,
        isHighlighted: false,
        isDropTarget: false,
        validationErrors: [],
      },
      style: {
        width: state.size.width,
        height: state.size.height,
      },
    };
    nodes.push(stateNode);
  }

  for (const transition of chart.transitions) {
    if (transition.isDefault) {
      const sourceExists = chart.states.some(
        (s) => s.id === transition.sourceStateId
      );
      if (!sourceExists) {
        const targetState = chart.states.find(
          (s) => s.id === transition.targetStateId
        );
        if (targetState) {
          const nodeWidth = targetState.size.width;
          const dotNode: DefaultTransitionNode = {
            id: transition.sourceStateId,
            type: 'defaultTransition',
            position: {
              x: targetState.position.x + nodeWidth / 2 - 8,
              y: targetState.position.y - 40,
            },
            ...(targetState.parentId
              ? { parentId: targetState.parentId, extent: 'parent' as const }
              : {}),
            data: { targetStateId: transition.targetStateId },
            style: { width: 16, height: 16 },
          };
          nodes.push(dotNode);
        }
      }
    }

    const edge: TransitionEdge = {
      id: transition.id,
      source: transition.sourceStateId,
      target: transition.targetStateId,
      sourceHandle: transition.sourceHandle || (transition.isDefault ? 'default-source' : undefined),
      targetHandle: transition.targetHandle || (transition.isDefault ? 'top-3' : undefined),
      type: 'transition',
      data: {
        transitionId: transition.id,
        label: transition.label ?? { ...EMPTY_TRANSITION_LABEL },
        priority: transition.priority,
        isDefault: transition.isDefault,
        labelOffsetX: 0,
        labelOffsetY: 0,
      },
    };
    edges.push(edge);
  }

  if (chart.annotations) {
    for (const anno of chart.annotations) {
      const annotationNode: AnnotationNode = {
        id: anno.id,
        type: 'annotationNode',
        position: anno.position,
        data: {
          content: anno.content,
          color: anno.color,
          image: anno.image,
          fontSize: anno.fontSize ?? 14,
        },
        style: {
          width: anno.size.width,
          height: anno.size.height,
        },
      };
      nodes.push(annotationNode);
    }
  }

  return { nodes, edges };
}

// ─── System Serialization ───────────────────────────────────────

/**
 * Serialize the system canvas back into system blocks + wires
 * Updates positions/sizes from the canvas nodes, wires from edges
 */
export function serializeSystemCanvas(
  currentBlocks: SystemBlock[],
  currentWires: SystemWire[],
  nodes: CanvasNode[],
  edges: TransitionEdge[]
): { blocks: SystemBlock[]; wires: SystemWire[] } {
  const blocks = currentBlocks.map((block) => {
    const node = nodes.find((n) => n.id === block.id);
    if (!node) return block;
    return {
      ...block,
      position: node.position,
      size: {
        width: (node.style?.width as number) ?? block.size.width,
        height: (node.style?.height as number) ?? block.size.height,
      },
    };
  });

  // Serialize wire edges back to SystemWire data
  const wires: SystemWire[] = [];
  for (const edge of edges) {
    if (edge.type === 'systemWire' && edge.data) {
      const wireData = edge.data as unknown as { wireId: string };
      wires.push({
        id: wireData.wireId ?? edge.id,
        sourceBlockId: edge.source,
        sourcePortId: edge.sourceHandle ?? '',
        targetBlockId: edge.target,
        targetPortId: edge.targetHandle ?? '',
      });
    }
  }

  return { blocks, wires };
}

/**
 * Deserialize system blocks + wires into canvas nodes and edges
 */
export function deserializeSystemToCanvas(project: Project): {
  nodes: CanvasNode[];
  edges: TransitionEdge[];
} {
  const nodes: CanvasNode[] = [];
  const edges: TransitionEdge[] = [];

  for (const block of project.systemBlocks) {
    if (block.type === 'chart') {
      const chart = project.charts.find((c) => c.id === block.chartId);
      const chartNode: ChartBlockNode = {
        id: block.id,
        type: 'chartBlock',
        position: block.position,
        data: {
          chartId: block.chartId ?? '',
          chartName: chart?.name ?? block.name,
          ports: chart?.ports ?? [],
        },
        style: {
          width: block.size.width,
          height: block.size.height,
        },
      };
      nodes.push(chartNode);
    } else if (block.type === 'constant' || block.type === 'signalGenerator') {
      const sourceNode: SourceBlockNode = {
        id: block.id,
        type: 'sourceBlock',
        position: block.position,
        data: {
          blockType: block.type,
          name: block.name,
          config: { ...block.config },
        },
        style: {
          width: block.size.width,
          height: block.size.height,
        },
      };
      nodes.push(sourceNode);
    } else if (block.type === 'scope' || block.type === 'display') {
      const sinkNode: SinkBlockNode = {
        id: block.id,
        type: 'sinkBlock',
        position: block.position,
        data: {
          blockType: block.type,
          name: block.name,
          config: { ...block.config },
        },
        style: {
          width: block.size.width,
          height: block.size.height,
        },
      };
      nodes.push(sinkNode);
    } else if (block.type === 'functionBlock') {
      const config = block.config as unknown as FunctionBlockConfig;
      const fbNode: FunctionBlockNode = {
        id: block.id,
        type: 'functionBlock',
        position: block.position,
        data: {
          defType: config.defType ?? 'math.add',
          name: block.name,
          params: config.params ?? {},
        },
        style: {
          width: block.size.width,
          height: block.size.height,
        },
      };
      nodes.push(fbNode);
    }
  }

  // Deserialize system wires as edges
  for (const wire of project.systemWires) {
    const wireEdge: SystemWireEdge = {
      id: `wire-${wire.id}`,
      source: wire.sourceBlockId,
      target: wire.targetBlockId,
      sourceHandle: wire.sourcePortId || undefined,
      targetHandle: wire.targetPortId || undefined,
      type: 'systemWire',
      data: {
        wireId: wire.id,
      },
    };
    // Cast to TransitionEdge for canvas store compatibility
    edges.push(wireEdge as unknown as TransitionEdge);
  }

  return { nodes, edges };
}

// ─── Legacy Compat (wraps new functions) ────────────────────────

/**
 * @deprecated Use serializeCanvasToChart + serializeSystemCanvas instead.
 * Kept for backward compatibility during transition.
 */
export function serializeCanvasToProject(
  project: Project,
  nodes: CanvasNode[],
  edges: TransitionEdge[]
): Project {
  // This should not be called in the new architecture,
  // but if it is, we return the project as-is with updated timestamp
  return {
    ...project,
    updatedAt: new Date().toISOString(),
  };
}
