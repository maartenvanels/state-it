import type { Node, Edge } from '@xyflow/react';
import type { StateBlock } from './state';
import type { TransitionLabel } from './transition';
import type { Port } from './chart';

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

export interface AnnotationNodeData {
  content: string;
  color: string | null;
  image: string | null;
  fontSize: number;
  [key: string]: unknown;
}

export interface ChartBlockNodeData {
  chartId: string;
  chartName: string;
  ports: Port[];
  [key: string]: unknown;
}

export interface SourceBlockNodeData {
  blockType: 'constant' | 'signalGenerator';
  name: string;
  config: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SinkBlockNodeData {
  blockType: 'scope' | 'display';
  name: string;
  config: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SystemWireEdgeData {
  wireId: string;
  [key: string]: unknown;
}

export type StateNode = Node<StateNodeData, 'stateNode'>;
export type DefaultTransitionNode = Node<DefaultTransitionNodeData, 'defaultTransition'>;
export type AnnotationNode = Node<AnnotationNodeData, 'annotationNode'>;
export type ChartBlockNode = Node<ChartBlockNodeData, 'chartBlock'>;
export type SourceBlockNode = Node<SourceBlockNodeData, 'sourceBlock'>;
export type SinkBlockNode = Node<SinkBlockNodeData, 'sinkBlock'>;
export type TransitionEdge = Edge<TransitionEdgeData>;
export type SystemWireEdge = Edge<SystemWireEdgeData>;

export type CanvasNode = StateNode | DefaultTransitionNode | AnnotationNode | ChartBlockNode | SourceBlockNode | SinkBlockNode;

export const NODE_TYPES = {
  stateNode: 'stateNode',
  defaultTransition: 'defaultTransition',
  annotationNode: 'annotationNode',
  chartBlock: 'chartBlock',
  sourceBlock: 'sourceBlock',
  sinkBlock: 'sinkBlock',
} as const;

export const EDGE_TYPES = {
  transition: 'transition',
  systemWire: 'systemWire',
} as const;
