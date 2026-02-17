'use client';

import { create } from 'zustand';
import { temporal } from 'zundo';
import type {
  Connection,
  NodeChange,
  EdgeChange,
  Viewport,
} from '@xyflow/react';
import { applyNodeChanges, applyEdgeChanges, reconnectEdge } from '@xyflow/react';
import type {
  StateNode,
  TransitionEdge,
  CanvasNode,
  StateNodeData,
  TransitionEdgeData,
  DefaultTransitionNode,
} from '../types/canvas';
import { EMPTY_TRANSITION_LABEL } from '../types/transition';
import { DEFAULT_STATE_ACTIONS, DEFAULT_STATE_SIZE } from '../types/state';
import { generateId } from '../utils/id-generator';

interface CanvasState {
  nodes: CanvasNode[];
  edges: TransitionEdge[];
  viewport: Viewport;
}

interface CanvasActions {
  addStateNode: (
    parentId: string | null,
    position: { x: number; y: number }
  ) => string;
  updateStateNodeData: (
    nodeId: string,
    updates: Partial<StateNodeData>
  ) => void;
  removeNodes: (nodeIds: string[]) => void;
  resizeNode: (
    nodeId: string,
    size: { width: number; height: number }
  ) => void;
  nestNode: (childId: string, parentId: string) => void;
  unnestNode: (childId: string) => void;

  addTransitionEdge: (connection: Connection) => string;
  updateTransitionEdge: (
    edgeId: string,
    updates: Partial<TransitionEdgeData>
  ) => void;
  removeEdges: (edgeIds: string[]) => void;
  addDefaultTransitionNode: (
    targetStateId: string,
    position: { x: number; y: number }
  ) => void;

  onNodesChange: (changes: NodeChange<CanvasNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<TransitionEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  onReconnect: (oldEdge: TransitionEdge, newConnection: Connection) => void;

  setViewport: (viewport: Viewport) => void;

  setNodes: (nodes: CanvasNode[]) => void;
  setEdges: (edges: TransitionEdge[]) => void;
  reset: () => void;
}

const initialState: CanvasState = {
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
};

export const useCanvasStore = create<CanvasState & CanvasActions>()(
  temporal(
    (set, get) => ({
      ...initialState,

      addStateNode: (parentId, position) => {
        const id = generateId();
        const stateCount = get().nodes.filter(
          (n) => n.type === 'stateNode'
        ).length;

        const newNode: StateNode = {
          id,
          type: 'stateNode',
          position,
          ...(parentId
            ? { parentId, extent: 'parent' as const }
            : {}),
          data: {
            stateBlock: {
              id,
              name: `State_${stateCount + 1}`,
              parentId,
              decomposition: 'exclusive',
              position,
              size: DEFAULT_STATE_SIZE,
              actions: { ...DEFAULT_STATE_ACTIONS },
              isDefault: false,
              executionOrder: 0,
              color: null,
            },
            isHighlighted: false,
            isDropTarget: false,
            validationErrors: [],
          },
          style: {
            width: DEFAULT_STATE_SIZE.width,
            height: DEFAULT_STATE_SIZE.height,
          },
        };

        set({ nodes: [...get().nodes, newNode] });
        return id;
      },

      updateStateNodeData: (nodeId, updates) => {
        set({
          nodes: get().nodes.map((node) => {
            if (node.id === nodeId && node.type === 'stateNode') {
              return {
                ...node,
                data: { ...node.data, ...updates },
              } as StateNode;
            }
            return node;
          }),
        });
      },

      removeNodes: (nodeIds) => {
        const nodeIdSet = new Set(nodeIds);
        set({
          nodes: get().nodes.filter((n) => !nodeIdSet.has(n.id)),
          edges: get().edges.filter(
            (e) => !nodeIdSet.has(e.source) && !nodeIdSet.has(e.target)
          ),
        });
      },

      resizeNode: (nodeId, size) => {
        set({
          nodes: get().nodes.map((node) => {
            if (node.id !== nodeId) return node;
            if (node.type === 'stateNode') {
              return {
                ...node,
                style: { ...node.style, width: size.width, height: size.height },
                data: {
                  ...node.data,
                  stateBlock: { ...node.data.stateBlock, size },
                },
              } as StateNode;
            }
            return {
              ...node,
              style: { ...node.style, width: size.width, height: size.height },
            } as CanvasNode;
          }),
        });
      },

      nestNode: (childId, parentId) => {
        const child = get().nodes.find((n) => n.id === childId);
        const parent = get().nodes.find((n) => n.id === parentId);
        if (!child || !parent) return;

        const relativePosition = {
          x: child.position.x - parent.position.x,
          y: child.position.y - parent.position.y,
        };

        // Ensure child position is within parent bounds (with padding)
        const PADDING = 10;
        const HEADER_HEIGHT = 32;
        const childW = (child.style?.width as number) ?? DEFAULT_STATE_SIZE.width;
        const childH = (child.style?.height as number) ?? DEFAULT_STATE_SIZE.height;
        const parentW = (parent.style?.width as number) ?? DEFAULT_STATE_SIZE.width;
        const parentH = (parent.style?.height as number) ?? DEFAULT_STATE_SIZE.height;

        // Clamp child position inside parent
        relativePosition.x = Math.max(PADDING, Math.min(relativePosition.x, parentW - childW - PADDING));
        relativePosition.y = Math.max(HEADER_HEIGHT + PADDING, Math.min(relativePosition.y, parentH - childH - PADDING));

        // Auto-expand parent if child doesn't fit
        const neededW = relativePosition.x + childW + PADDING;
        const neededH = relativePosition.y + childH + PADDING;
        const newParentW = Math.max(parentW, neededW);
        const newParentH = Math.max(parentH, neededH);

        set({
          nodes: get().nodes.map((node) => {
            // Update parent size if needed
            if (node.id === parentId && (newParentW > parentW || newParentH > parentH)) {
              if (node.type === 'stateNode') {
                return {
                  ...node,
                  style: { ...node.style, width: newParentW, height: newParentH },
                  data: {
                    ...node.data,
                    stateBlock: {
                      ...node.data.stateBlock,
                      size: { width: newParentW, height: newParentH },
                    },
                  },
                } as StateNode;
              }
            }
            // Update child
            if (node.id !== childId) return node;
            if (node.type === 'stateNode') {
              return {
                ...node,
                parentId,
                extent: 'parent' as const,
                position: relativePosition,
                data: {
                  ...node.data,
                  stateBlock: {
                    ...node.data.stateBlock,
                    parentId,
                    position: relativePosition,
                  },
                },
              } as StateNode;
            }
            return {
              ...node,
              parentId,
              extent: 'parent' as const,
              position: relativePosition,
            } as CanvasNode;
          }),
        });
      },

      unnestNode: (childId) => {
        const node = get().nodes.find((n) => n.id === childId);
        if (!node || !node.parentId) return;

        const parent = get().nodes.find((n) => n.id === node.parentId);
        const absolutePosition = parent
          ? {
              x: node.position.x + parent.position.x,
              y: node.position.y + parent.position.y,
            }
          : node.position;

        set({
          nodes: get().nodes.map((n) => {
            if (n.id !== childId) return n;
            if (n.type === 'stateNode') {
              return {
                ...n,
                parentId: undefined,
                extent: undefined,
                position: absolutePosition,
                data: {
                  ...n.data,
                  stateBlock: {
                    ...n.data.stateBlock,
                    parentId: null,
                    position: absolutePosition,
                  },
                },
              } as StateNode;
            }
            return {
              ...n,
              parentId: undefined,
              extent: undefined,
              position: absolutePosition,
            } as CanvasNode;
          }),
        });
      },

      addTransitionEdge: (connection) => {
        const id = generateId();
        const sourceId = connection.source!;
        // Priority per source state: count existing outgoing transitions from same source
        const outgoingCount = get().edges.filter(
          (e) => e.source === sourceId && e.data && !e.data.isDefault
        ).length;

        const newEdge: TransitionEdge = {
          id,
          source: sourceId,
          target: connection.target!,
          sourceHandle: connection.sourceHandle ?? undefined,
          targetHandle: connection.targetHandle ?? undefined,
          type: 'transition',
          data: {
            transitionId: id,
            label: { ...EMPTY_TRANSITION_LABEL },
            priority: outgoingCount + 1,
            isDefault: false,
          },
        };

        set({ edges: [...get().edges, newEdge] });
        return id;
      },

      updateTransitionEdge: (edgeId, updates) => {
        set({
          edges: get().edges.map((edge) => {
            if (edge.id === edgeId) {
              return {
                ...edge,
                data: { ...edge.data, ...updates },
              } as TransitionEdge;
            }
            return edge;
          }),
        });
      },

      addDefaultTransitionNode: (targetStateId, position) => {
        const dotId = generateId();
        const edgeId = generateId();

        const dotNode: DefaultTransitionNode = {
          id: dotId,
          type: 'defaultTransition',
          position,
          data: { targetStateId },
          style: { width: 16, height: 16 },
        };

        const edge: TransitionEdge = {
          id: edgeId,
          source: dotId,
          target: targetStateId,
          type: 'transition',
          data: {
            transitionId: edgeId,
            label: { event: null, condition: null, conditionAction: null, transitionAction: null },
            priority: 0,
            isDefault: true,
          },
        };

        set({
          nodes: [...get().nodes, dotNode],
          edges: [...get().edges, edge],
        });
      },

      removeEdges: (edgeIds) => {
        const edgeIdSet = new Set(edgeIds);
        set({
          edges: get().edges.filter((e) => !edgeIdSet.has(e.id)),
        });
      },

      onNodesChange: (changes) => {
        set({
          nodes: applyNodeChanges(changes, get().nodes) as CanvasNode[],
        });
      },

      onEdgesChange: (changes) => {
        set({
          edges: applyEdgeChanges(changes, get().edges) as TransitionEdge[],
        });
      },

      onConnect: (connection) => {
        get().addTransitionEdge(connection);
      },

      onReconnect: (oldEdge, newConnection) => {
        set({
          edges: reconnectEdge(
            oldEdge,
            newConnection,
            get().edges
          ) as TransitionEdge[],
        });
      },

      setViewport: (viewport) => set({ viewport }),

      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),
      reset: () => set(initialState),
    }),
    {
      limit: 50,
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
      }),
    }
  )
);
