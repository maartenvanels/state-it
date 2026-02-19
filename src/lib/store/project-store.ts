'use client';

import { create } from 'zustand';
import type { Project, ProjectMeta, ProjectSettings } from '../types/project';
import { DEFAULT_PROJECT_SETTINGS } from '../types/project';
import type { Chart, Port } from '../types/chart';
import type { SystemBlock } from '../types/system';
import type { Variable } from '../types/variable';
import type { CanvasNode, TransitionEdge } from '../types/canvas';
import { generateId } from '../utils/id-generator';
import { serializeCanvasToChart, serializeSystemCanvas } from '../persistence/serializer';

interface ProjectState {
  currentProject: Project | null;
  recentProjects: ProjectMeta[];
  isDirty: boolean;
}

interface ProjectActions {
  createProject: (name: string, description?: string) => Project;
  setCurrentProject: (project: Project) => void;
  updateProjectMeta: (
    updates: Partial<Pick<Project, 'name' | 'description' | 'settings'>>
  ) => void;
  updateSettings: (updates: Partial<ProjectSettings>) => void;

  // Chart CRUD
  addChart: (name: string) => string;
  removeChart: (chartId: string) => void;
  renameChart: (chartId: string, name: string) => void;
  updateChartPorts: (chartId: string, ports: Port[]) => void;
  getChart: (chartId: string) => Chart | undefined;

  // Chart-scoped variable CRUD
  addVariable: (chartId: string, variable: Omit<Variable, 'id'>) => string;
  updateVariable: (chartId: string, varId: string, updates: Partial<Variable>) => void;
  removeVariable: (chartId: string, varId: string) => void;

  // System block management
  updateSystemBlock: (blockId: string, updates: Partial<SystemBlock>) => void;

  // Flush canvas state back into project data
  flushCanvasToChart: (
    chartId: string,
    nodes: CanvasNode[],
    edges: TransitionEdge[],
    viewport?: { x: number; y: number; zoom: number }
  ) => void;
  flushCanvasToSystem: (
    nodes: CanvasNode[],
    viewport?: { x: number; y: number; zoom: number }
  ) => void;

  markDirty: () => void;
  markClean: () => void;
  setRecentProjects: (projects: ProjectMeta[]) => void;
}

export const useProjectStore = create<ProjectState & ProjectActions>()(
  (set, get) => ({
    currentProject: null,
    recentProjects: [],
    isDirty: false,

    createProject: (name, description = '') => {
      const now = new Date().toISOString();
      const chartId = generateId();
      const blockId = generateId();

      const defaultChart: Chart = {
        id: chartId,
        name: 'Chart_1',
        description: '',
        ports: [],
        states: [],
        transitions: [],
        variables: [],
        annotations: [],
      };

      const defaultBlock: SystemBlock = {
        id: blockId,
        type: 'chart',
        name: 'Chart_1',
        chartId,
        position: { x: 100, y: 100 },
        size: { width: 200, height: 120 },
        config: {},
      };

      const project: Project = {
        id: generateId(),
        name,
        description,
        version: '2.0.0',
        createdAt: now,
        updatedAt: now,
        settings: { ...DEFAULT_PROJECT_SETTINGS },
        charts: [defaultChart],
        systemBlocks: [defaultBlock],
        systemWires: [],
      };
      set({ currentProject: project, isDirty: false });
      return project;
    },

    setCurrentProject: (project) =>
      set({ currentProject: project, isDirty: false }),

    updateProjectMeta: (updates) => {
      const current = get().currentProject;
      if (!current) return;
      set({
        currentProject: {
          ...current,
          ...updates,
          updatedAt: new Date().toISOString(),
        },
        isDirty: true,
      });
    },

    updateSettings: (updates) => {
      const current = get().currentProject;
      if (!current) return;
      set({
        currentProject: {
          ...current,
          settings: { ...current.settings, ...updates },
          updatedAt: new Date().toISOString(),
        },
        isDirty: true,
      });
    },

    // ─── Chart CRUD ───────────────────────────────────────────

    addChart: (name) => {
      const current = get().currentProject;
      if (!current) return '';
      const chartId = generateId();
      const blockId = generateId();

      const chart: Chart = {
        id: chartId,
        name,
        description: '',
        ports: [],
        states: [],
        transitions: [],
        variables: [],
        annotations: [],
      };

      const block: SystemBlock = {
        id: blockId,
        type: 'chart',
        name,
        chartId,
        position: { x: 100 + current.systemBlocks.length * 250, y: 100 },
        size: { width: 200, height: 120 },
        config: {},
      };

      set({
        currentProject: {
          ...current,
          charts: [...current.charts, chart],
          systemBlocks: [...current.systemBlocks, block],
          updatedAt: new Date().toISOString(),
        },
        isDirty: true,
      });
      return chartId;
    },

    removeChart: (chartId) => {
      const current = get().currentProject;
      if (!current) return;
      set({
        currentProject: {
          ...current,
          charts: current.charts.filter((c) => c.id !== chartId),
          systemBlocks: current.systemBlocks.filter((b) => b.chartId !== chartId),
          updatedAt: new Date().toISOString(),
        },
        isDirty: true,
      });
    },

    renameChart: (chartId, name) => {
      const current = get().currentProject;
      if (!current) return;
      set({
        currentProject: {
          ...current,
          charts: current.charts.map((c) =>
            c.id === chartId ? { ...c, name } : c
          ),
          systemBlocks: current.systemBlocks.map((b) =>
            b.chartId === chartId ? { ...b, name } : b
          ),
          updatedAt: new Date().toISOString(),
        },
        isDirty: true,
      });
    },

    updateChartPorts: (chartId, ports) => {
      const current = get().currentProject;
      if (!current) return;
      set({
        currentProject: {
          ...current,
          charts: current.charts.map((c) =>
            c.id === chartId ? { ...c, ports } : c
          ),
          updatedAt: new Date().toISOString(),
        },
        isDirty: true,
      });
    },

    getChart: (chartId) => {
      return get().currentProject?.charts.find((c) => c.id === chartId);
    },

    // ─── Chart-scoped Variable CRUD ───────────────────────────

    addVariable: (chartId, variable) => {
      const current = get().currentProject;
      if (!current) return '';
      const id = generateId();
      set({
        currentProject: {
          ...current,
          charts: current.charts.map((c) =>
            c.id === chartId
              ? { ...c, variables: [...c.variables, { ...variable, id }] }
              : c
          ),
          updatedAt: new Date().toISOString(),
        },
        isDirty: true,
      });
      return id;
    },

    updateVariable: (chartId, varId, updates) => {
      const current = get().currentProject;
      if (!current) return;
      set({
        currentProject: {
          ...current,
          charts: current.charts.map((c) =>
            c.id === chartId
              ? {
                  ...c,
                  variables: c.variables.map((v) =>
                    v.id === varId ? { ...v, ...updates } : v
                  ),
                }
              : c
          ),
          updatedAt: new Date().toISOString(),
        },
        isDirty: true,
      });
    },

    removeVariable: (chartId, varId) => {
      const current = get().currentProject;
      if (!current) return;
      set({
        currentProject: {
          ...current,
          charts: current.charts.map((c) =>
            c.id === chartId
              ? { ...c, variables: c.variables.filter((v) => v.id !== varId) }
              : c
          ),
          updatedAt: new Date().toISOString(),
        },
        isDirty: true,
      });
    },

    // ─── System Block Management ──────────────────────────────

    updateSystemBlock: (blockId, updates) => {
      const current = get().currentProject;
      if (!current) return;
      set({
        currentProject: {
          ...current,
          systemBlocks: current.systemBlocks.map((b) =>
            b.id === blockId ? { ...b, ...updates } : b
          ),
          updatedAt: new Date().toISOString(),
        },
        isDirty: true,
      });
    },

    // ─── Flush Canvas → Project ───────────────────────────────

    flushCanvasToChart: (chartId, nodes, edges, viewport) => {
      const current = get().currentProject;
      if (!current) return;
      const chart = current.charts.find((c) => c.id === chartId);
      if (!chart) return;

      const updatedChart = serializeCanvasToChart(chart, nodes, edges, viewport);
      set({
        currentProject: {
          ...current,
          charts: current.charts.map((c) =>
            c.id === chartId ? updatedChart : c
          ),
          updatedAt: new Date().toISOString(),
        },
        isDirty: true,
      });
    },

    flushCanvasToSystem: (nodes, viewport) => {
      const current = get().currentProject;
      if (!current) return;

      const updatedBlocks = serializeSystemCanvas(current.systemBlocks, nodes);
      set({
        currentProject: {
          ...current,
          systemBlocks: updatedBlocks,
          ...(viewport ? { systemViewport: viewport } : {}),
          updatedAt: new Date().toISOString(),
        },
        isDirty: true,
      });
    },

    markDirty: () => set({ isDirty: true }),
    markClean: () => set({ isDirty: false }),
    setRecentProjects: (projects) => set({ recentProjects: projects }),
  })
);
