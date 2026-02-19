import type { DataType, Variable } from './variable';
import type { StateBlock } from './state';
import type { Transition } from './transition';
import type { AnnotationData } from './project';

export interface Port {
  id: string;
  name: string;
  direction: 'input' | 'output';
  dataType: DataType;
  defaultValue: string;
}

export interface Chart {
  id: string;
  name: string;
  description: string;
  ports: Port[];
  states: StateBlock[];
  transitions: Transition[];
  variables: Variable[];
  annotations: AnnotationData[];
  viewport?: { x: number; y: number; zoom: number };
}
