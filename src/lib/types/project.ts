import type { StateBlock } from './state';
import type { Transition } from './transition';
import type { Variable } from './variable';

export interface AnnotationData {
  id: string;
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  color: string | null;
  image: string | null;
  fontSize: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  settings: ProjectSettings;
  states: StateBlock[];
  transitions: Transition[];
  variables: Variable[];
  annotations?: AnnotationData[];
}

export interface ProjectSettings {
  gridSize: number;
  snapToGrid: boolean;
  showGrid: boolean;
  codeGenTarget: 'c' | 'scl' | 'both';
  autoSaveInterval: number;
  theme: 'light' | 'dark' | 'system';
}

export interface ProjectMeta {
  id: string;
  name: string;
  updatedAt: string;
  stateCount: number;
  transitionCount: number;
}

export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  gridSize: 20,
  snapToGrid: true,
  showGrid: true,
  codeGenTarget: 'both',
  autoSaveInterval: 30000,
  theme: 'system',
};
