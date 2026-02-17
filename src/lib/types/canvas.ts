import type { Node, Edge } from '@xyflow/react';
import type { StateBlock } from './state';
import type { TransitionLabel } from './transition';

export interface StateNodeData {
  stateBlock: StateBlock;
  isHighlighted: boolean;
  isDropTarget: boolean;
  validationErrors: string[];
  [key: string]: unknown;
}

export interface TransitionEdgeData {
  transitionId: string;
  label: TransitionLabel;
  priority: number;
  isDefault: boolean;
  labelOffsetX: number;
  labelOffsetY: number;
  [key: string]: unknown;
}

export interface DefaultTransitionNodeData {
  targetStateId: string;
  [key: string]: unknown;
}

export type StateNode = Node<StateNodeData, 'stateNode'>;
export type DefaultTransitionNode = Node<DefaultTransitionNodeData, 'defaultTransition'>;
export type TransitionEdge = Edge<TransitionEdgeData>;

export type CanvasNode = StateNode | DefaultTransitionNode;

export const NODE_TYPES = {
  stateNode: 'stateNode',
  defaultTransition: 'defaultTransition',
} as const;

export const EDGE_TYPES = {
  transition: 'transition',
} as const;
