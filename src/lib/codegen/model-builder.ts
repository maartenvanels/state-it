import type { CanvasNode, TransitionEdge } from '../types/canvas';
import type { Variable } from '../types/variable';
import type { StateMachineModel, ModelState, ModelTransition } from '../types/codegen';

/**
 * Convert a C-unsafe name to a safe identifier
 */
function toSafeName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/^(\d)/, '_$1')
    .replace(/_+/g, '_')
    .toUpperCase();
}

/**
 * Build a StateMachineModel from canvas nodes, edges, and variables
 */
export function buildModel(
  nodes: CanvasNode[],
  edges: TransitionEdge[],
  variables: Variable[],
  projectName: string = 'StateMachine'
): StateMachineModel {
  const stateNodes = nodes.filter((n) => n.type === 'stateNode');
  const defaultTransitionNodes = nodes.filter((n) => n.type === 'defaultTransition');

  // Build states
  const states: ModelState[] = stateNodes.map((node) => {
    const block = node.data.stateBlock;
    const childIds = stateNodes
      .filter((n) => n.data.stateBlock.parentId === node.id)
      .map((n) => n.id);

    return {
      id: node.id,
      name: block.name,
      safeName: toSafeName(block.name),
      parentId: block.parentId,
      decomposition: block.decomposition,
      isDefault: block.isDefault,
      childIds,
      actions: {
        entry: block.actions.entry
          .sort((a, b) => a.order - b.order)
          .map((a) => a.code)
          .filter((c) => c.trim()),
        during: block.actions.during
          .sort((a, b) => a.order - b.order)
          .map((a) => a.code)
          .filter((c) => c.trim()),
        exit: block.actions.exit
          .sort((a, b) => a.order - b.order)
          .map((a) => a.code)
          .filter((c) => c.trim()),
      },
    };
  });

  // Build transitions
  const transitions: ModelTransition[] = edges.map((edge) => {
    // For default transitions, the source is a dot node
    const isDefault = edge.data?.isDefault ?? false;
    const sourceNode = nodes.find((n) => n.id === edge.source);
    let sourceId = edge.source;

    if (sourceNode?.type === 'defaultTransition') {
      // The source of a default transition is really the parent context
      sourceId = edge.source; // Keep as-is, validator will handle
    }

    return {
      id: edge.id,
      sourceId,
      targetId: edge.target,
      event: edge.data?.label.event ?? null,
      condition: edge.data?.label.condition ?? null,
      conditionAction: edge.data?.label.conditionAction ?? null,
      transitionAction: edge.data?.label.transitionAction ?? null,
      priority: edge.data?.priority ?? 0,
      isDefault,
    };
  });

  // Sort transitions by priority
  transitions.sort((a, b) => a.priority - b.priority);

  // Find root states (no parent)
  const rootStateIds = states
    .filter((s) => s.parentId === null)
    .map((s) => s.id);

  // Find the default state (via default transition or isDefault flag)
  let defaultStateId: string | null = null;

  // First check for default transitions pointing to root states
  const defaultTransitions = transitions.filter((t) => t.isDefault);
  for (const dt of defaultTransitions) {
    const targetState = states.find((s) => s.id === dt.targetId);
    if (targetState && targetState.parentId === null) {
      defaultStateId = targetState.id;
      break;
    }
  }

  // Fallback: check isDefault flag
  if (!defaultStateId) {
    const defaultState = states.find((s) => s.isDefault && s.parentId === null);
    if (defaultState) {
      defaultStateId = defaultState.id;
    }
  }

  // Fallback: first root state
  if (!defaultStateId && rootStateIds.length > 0) {
    defaultStateId = rootStateIds[0];
  }

  return {
    name: toSafeName(projectName),
    states,
    transitions,
    variables,
    rootStateIds,
    defaultStateId,
  };
}
