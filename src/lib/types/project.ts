import type { Chart } from './chart';
import type { SystemBlock, SystemWire } from './system';

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
  charts: Chart[];
  systemBlocks: SystemBlock[];
  systemWires: SystemWire[];
  systemViewport?: { x: number; y: number; zoom: number };
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
  chartCount: number;
}

export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  gridSize: 20,
  snapToGrid: true,
  showGrid: true,
  codeGenTarget: 'both',
  autoSaveInterval: 30000,
  theme: 'system',
};
