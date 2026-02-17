export type DecompositionType = 'exclusive' | 'parallel';

export interface StateBlock {
  id: string;
  name: string;
  parentId: string | null;
  decomposition: DecompositionType;
  position: { x: number; y: number };
  size: { width: number; height: number };
  actions: StateActions;
  isDefault: boolean;
  executionOrder: number;
  color: string | null;
}

export interface StateActions {
  entry: ActionBlock[];
  during: ActionBlock[];
  exit: ActionBlock[];
}

export interface ActionBlock {
  id: string;
  code: string;
  order: number;
}

export const DEFAULT_STATE_SIZE = { width: 200, height: 150 };

export const DEFAULT_STATE_ACTIONS: StateActions = {
  entry: [],
  during: [],
  exit: [],
};
