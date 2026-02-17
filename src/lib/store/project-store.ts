'use client';

import { create } from 'zustand';
import type { Project, ProjectMeta, ProjectSettings } from '../types/project';
import { DEFAULT_PROJECT_SETTINGS } from '../types/project';
import type { Variable } from '../types/variable';
import { generateId } from '../utils/id-generator';

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

  addVariable: (variable: Omit<Variable, 'id'>) => string;
  updateVariable: (id: string, updates: Partial<Variable>) => void;
  removeVariable: (id: string) => void;

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
      const project: Project = {
        id: generateId(),
        name,
        description,
        version: '1.0.0',
        createdAt: now,
        updatedAt: now,
        settings: { ...DEFAULT_PROJECT_SETTINGS },
        states: [],
        transitions: [],
        variables: [],
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

    addVariable: (variable) => {
      const current = get().currentProject;
      if (!current) return '';
      const id = generateId();
      set({
        currentProject: {
          ...current,
          variables: [...current.variables, { ...variable, id }],
          updatedAt: new Date().toISOString(),
        },
        isDirty: true,
      });
      return id;
    },

    updateVariable: (id, updates) => {
      const current = get().currentProject;
      if (!current) return;
      set({
        currentProject: {
          ...current,
          variables: current.variables.map((v) =>
            v.id === id ? { ...v, ...updates } : v
          ),
          updatedAt: new Date().toISOString(),
        },
        isDirty: true,
      });
    },

    removeVariable: (id) => {
      const current = get().currentProject;
      if (!current) return;
      set({
        currentProject: {
          ...current,
          variables: current.variables.filter((v) => v.id !== id),
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
