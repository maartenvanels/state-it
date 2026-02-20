'use client';

import { create } from 'zustand';
import type { Project, ProjectMeta, ProjectSettings } from '../types/project';
import { DEFAULT_PROJECT_SETTINGS } from '../types/project';
import type { Chart, Port } from '../types/chart';
import type { SystemBlock, SystemBlockType, SystemWire } from '../types/system';
import { DEFAULT_BLOCK_CONFIGS, DEFAULT_BLOCK_SIZES } from '../types/system';
import type { Variable } from '../types/variable';
import type { CanvasNode, TransitionEdge } from '../types/canvas';
import { generateId } from '../utils/id-generator';
import { getBlockDef } from '../blocks/registry';
import '../blocks'; // ensure built-in blocks are registered
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
  syncPortVariables: (chartId: string) => void;

  // System block management
  addSystemBlock: (type: SystemBlockType, name: string, position: { x: number; y: number }) => string;
  addFunctionBlock: (defType: string, name: string, position: { x: number; y: number }) => string;
  removeSystemBlock: (blockId: string) => void;
  updateSystemBlock: (blockId: string, updates: Partial<SystemBlock>) => void;

  // System wire management
  addSystemWire: (wire: Omit<SystemWire, 'id'>) => string;
  removeSystemWire: (wireId: string) => void;
  removeSystemWires: (wireIds: string[]) => void;

  // Flush canvas state back into project data
  flushCanvasToChart: (
    chartId: string,
    nodes: CanvasNode[],
    edges: TransitionEdge[],
    viewport?: { x: number; y: number; zoom: number }
  ) => void;
  flushCanvasToSystem: (
    nodes: CanvasNode[],
    edges: TransitionEdge[],
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
      get().syncPortVariables(chartId);
    },

    getChart: (chartId) => {
      return get().currentProject?.charts.find((c) => c.id === chartId);
    },

    // ─── Chart-scoped Variable CRUD ───────────────────────────

    addVariable: (chartId, variable) => {
      const current = get().currentProject;
      if (!current) return '';
      const id = generateId();
      const chart = current.charts.find((c) => c.id === chartId);
      if (!chart) return '';

      const isIO = variable.scope === 'input' || variable.scope === 'output';
      let portId: string | undefined;
      let ports = chart.ports;

      // Auto-create port for input/output variables
      if (isIO && !variable.portId) {
        const newPortId = generateId();
        portId = newPortId;
        ports = [
          ...ports,
          {
            id: newPortId,
            name: variable.name,
            direction: variable.scope as 'input' | 'output',
            dataType: variable.dataType,
            defaultValue: variable.initialValue || '0',
          },
        ];
      }

      set({
        currentProject: {
          ...current,
          charts: current.charts.map((c) =>
            c.id === chartId
              ? {
                  ...c,
                  variables: [...c.variables, { ...variable, id, ...(portId ? { portId } : {}) }],
                  ports,
                }
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
      const chart = current.charts.find((c) => c.id === chartId);
      if (!chart) return;
      const variable = chart.variables.find((v) => v.id === varId);
      if (!variable) return;

      const merged = { ...variable, ...updates };
      const wasIO = variable.scope === 'input' || variable.scope === 'output';
      const isIO = merged.scope === 'input' || merged.scope === 'output';
      let ports = chart.ports;
      let portId = variable.portId;

      if (isIO && !wasIO) {
        // Scope changed TO input/output → create port
        const newPortId = generateId();
        portId = newPortId;
        ports = [
          ...ports,
          {
            id: newPortId,
            name: merged.name,
            direction: merged.scope as 'input' | 'output',
            dataType: merged.dataType,
            defaultValue: merged.initialValue || '0',
          },
        ];
      } else if (!isIO && wasIO && variable.portId) {
        // Scope changed FROM input/output → remove port
        ports = ports.filter((p) => p.id !== variable.portId);
        portId = undefined;
      } else if (isIO && variable.portId) {
        // Still IO with port — sync name/type/direction to port
        ports = ports.map((p) =>
          p.id === variable.portId
            ? {
                ...p,
                name: merged.name,
                direction: merged.scope as 'input' | 'output',
                dataType: merged.dataType,
              }
            : p
        );
      }

      set({
        currentProject: {
          ...current,
          charts: current.charts.map((c) =>
            c.id === chartId
              ? {
                  ...c,
                  variables: c.variables.map((v) =>
                    v.id === varId ? { ...merged, portId } : v
                  ),
                  ports,
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
      const chart = current.charts.find((c) => c.id === chartId);
      if (!chart) return;
      const variable = chart.variables.find((v) => v.id === varId);

      // Also remove the linked port
      const ports = variable?.portId
        ? chart.ports.filter((p) => p.id !== variable.portId)
        : chart.ports;

      set({
        currentProject: {
          ...current,
          charts: current.charts.map((c) =>
            c.id === chartId
              ? { ...c, variables: c.variables.filter((v) => v.id !== varId), ports }
              : c
          ),
          updatedAt: new Date().toISOString(),
        },
        isDirty: true,
      });
    },

    syncPortVariables: (chartId) => {
      const current = get().currentProject;
      if (!current) return;
      const chart = current.charts.find((c) => c.id === chartId);
      if (!chart) return;

      const portIds = new Set(chart.ports.map((p) => p.id));
      let variables = [...chart.variables];
      let changed = false;

      // Update or create variables for each port
      for (const port of chart.ports) {
        const existing = variables.find((v) => v.portId === port.id);
        if (existing) {
          // Update if port properties changed
          const scope = port.direction as 'input' | 'output';
          if (
            existing.name !== port.name ||
            existing.scope !== scope ||
            existing.dataType !== port.dataType
          ) {
            variables = variables.map((v) =>
              v.portId === port.id
                ? { ...v, name: port.name, scope, dataType: port.dataType }
                : v
            );
            changed = true;
          }
        } else {
          // Create new variable for this port
          variables.push({
            id: generateId(),
            name: port.name,
            scope: port.direction,
            dataType: port.dataType,
            initialValue: port.defaultValue || '0',
            description: '',
            portId: port.id,
          });
          changed = true;
        }
      }

      // Remove variables whose port no longer exists
      const before = variables.length;
      variables = variables.filter((v) => !v.portId || portIds.has(v.portId));
      if (variables.length !== before) changed = true;

      if (changed) {
        set({
          currentProject: {
            ...current,
            charts: current.charts.map((c) =>
              c.id === chartId ? { ...c, variables } : c
            ),
            updatedAt: new Date().toISOString(),
          },
          isDirty: true,
        });
      }
    },

    // ─── System Block Management ──────────────────────────────

    addSystemBlock: (type, name, position) => {
      const current = get().currentProject;
      if (!current) return '';
      const id = generateId();
      const block: SystemBlock = {
        id,
        type,
        name,
        chartId: null,
        position,
        size: { ...DEFAULT_BLOCK_SIZES[type] },
        config: { ...DEFAULT_BLOCK_CONFIGS[type] },
      };
      set({
        currentProject: {
          ...current,
          systemBlocks: [...current.systemBlocks, block],
          updatedAt: new Date().toISOString(),
        },
        isDirty: true,
      });
      return id;
    },

    addFunctionBlock: (defType, name, position) => {
      const current = get().currentProject;
      if (!current) return '';
      const id = generateId();
      const def = getBlockDef(defType);
      const params: Record<string, number | string | boolean> = {};
      for (const p of def?.params ?? []) params[p.id] = p.defaultValue;
      const size = def?.defaultSize ?? { width: 120, height: 80 };
      const block: SystemBlock = {
        id,
        type: 'functionBlock',
        name,
        chartId: null,
        position,
        size: { ...size },
        config: { defType, params } as unknown as Record<string, unknown>,
      };
      set({
        currentProject: {
          ...current,
          systemBlocks: [...current.systemBlocks, block],
          updatedAt: new Date().toISOString(),
        },
        isDirty: true,
      });
      return id;
    },

    removeSystemBlock: (blockId) => {
      const current = get().currentProject;
      if (!current) return;
      // Also remove any wires connected to this block
      set({
        currentProject: {
          ...current,
          systemBlocks: current.systemBlocks.filter((b) => b.id !== blockId),
          systemWires: current.systemWires.filter(
            (w) => w.sourceBlockId !== blockId && w.targetBlockId !== blockId
          ),
          updatedAt: new Date().toISOString(),
        },
        isDirty: true,
      });
    },

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

    // ─── System Wire Management ────────────────────────────────

    addSystemWire: (wire) => {
      const current = get().currentProject;
      if (!current) return '';
      const id = generateId();
      set({
        currentProject: {
          ...current,
          systemWires: [...current.systemWires, { ...wire, id }],
          updatedAt: new Date().toISOString(),
        },
        isDirty: true,
      });
      return id;
    },

    removeSystemWire: (wireId) => {
      const current = get().currentProject;
      if (!current) return;
      set({
        currentProject: {
          ...current,
          systemWires: current.systemWires.filter((w) => w.id !== wireId),
          updatedAt: new Date().toISOString(),
        },
        isDirty: true,
      });
    },

    removeSystemWires: (wireIds) => {
      const current = get().currentProject;
      if (!current) return;
      const idSet = new Set(wireIds);
      set({
        currentProject: {
          ...current,
          systemWires: current.systemWires.filter((w) => !idSet.has(w.id)),
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

    flushCanvasToSystem: (nodes, edges, viewport) => {
      const current = get().currentProject;
      if (!current) return;

      const { blocks, wires } = serializeSystemCanvas(
        current.systemBlocks,
        current.systemWires,
        nodes,
        edges
      );
      set({
        currentProject: {
          ...current,
          systemBlocks: blocks,
          systemWires: wires,
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
