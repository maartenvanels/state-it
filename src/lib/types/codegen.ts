import type { Variable } from './variable';

export interface StateMachineModel {
  name: string;
  states: ModelState[];
  transitions: ModelTransition[];
  variables: Variable[];
  rootStateIds: string[];
  defaultStateId: string | null;
}

export interface ModelState {
  id: string;
  name: string;
  safeName: string; // C-identifier safe version
  parentId: string | null;
  decomposition: 'exclusive' | 'parallel';
  isDefault: boolean;
  childIds: string[];
  actions: {
    entry: string[];
    during: string[];
    exit: string[];
  };
}

export interface ModelTransition {
  id: string;
  sourceId: string;
  targetId: string;
  event: string | null;
  condition: string | null;
  conditionAction: string | null;
  transitionAction: string | null;
  priority: number;
  isDefault: boolean;
}

export interface ValidationMessage {
  level: 'error' | 'warning';
  message: string;
  stateId?: string;
  transitionId?: string;
}

export interface GeneratedCode {
  header: string;
  source: string;
}

export interface GeneratedFile {
  filename: string;
  content: string;
  language: 'c' | 'scl';
  category?: 'header' | 'source' | 'types' | 'system' | 'scl';
}

export interface GeneratedProject {
  files: GeneratedFile[];
  messages: ValidationMessage[];
}
