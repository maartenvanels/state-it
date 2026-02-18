import type { Project, AnnotationData } from '../types/project';
import type { StateBlock } from '../types/state';
import type { Transition } from '../types/transition';
import type {
  CanvasNode,
  TransitionEdge,
  StateNode,
  DefaultTransitionNode,
  AnnotationNode,
} from '../types/canvas';
import { DEFAULT_STATE_SIZE } from '../types/state';
import { EMPTY_TRANSITION_LABEL } from '../types/transition';
import { DEFAULT_ANNOTATION_SIZE } from '../utils/constants';

/**
 * Serialize canvas state (nodes + edges) into a Project for storage
 */
export function serializeCanvasToProject(
  project: Project,
  nodes: CanvasNode[],
  edges: TransitionEdge[]
): Project {
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
    ...project,
    states,
    transitions,
    annotations,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Deserialize a Project into canvas nodes and edges
 */
export function deserializeProjectToCanvas(project: Project): {
  nodes: CanvasNode[];
  edges: TransitionEdge[];
} {
  const nodes: CanvasNode[] = [];
  const edges: TransitionEdge[] = [];

  for (const state of project.states) {
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

  for (const transition of project.transitions) {
    // Check if this is a default transition (source is a dot node)
    if (transition.isDefault) {
      // Check if the source dot node already exists in states
      const sourceExists = project.states.some(
        (s) => s.id === transition.sourceStateId
      );
      if (!sourceExists) {
        // Recreate the default transition dot node
        const targetState = project.states.find(
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
        label: transition.label,
        priority: transition.priority,
        isDefault: transition.isDefault,
        labelOffsetX: 0,
        labelOffsetY: 0,
      },
    };
    edges.push(edge);
  }

  // Deserialize annotations
  if (project.annotations) {
    for (const anno of project.annotations) {
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
