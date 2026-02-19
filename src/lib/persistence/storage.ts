import type { Project, ProjectMeta } from '../types/project';
import { needsMigration, migrateProjectV1toV2 } from './migration';

const PROJECTS_KEY = 'states_projects';
const CURRENT_PROJECT_KEY = 'states_current_project_id';

/**
 * Save a project to localStorage
 */
export function saveProject(project: Project): void {
  const projects = loadAllProjects();
  const index = projects.findIndex((p) => p.id === project.id);
  if (index >= 0) {
    projects[index] = project;
  } else {
    projects.push(project);
  }
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  localStorage.setItem(CURRENT_PROJECT_KEY, project.id);
}

/**
 * Load a project by ID from localStorage (auto-migrates v1 format)
 */
export function loadProject(id: string): Project | null {
  const projects = loadAllProjectsRaw();
  const raw = projects.find((p: Record<string, unknown>) => p.id === id);
  if (!raw) return null;

  if (needsMigration(raw)) {
    const migrated = migrateProjectV1toV2(raw as never);
    // Save migrated version back
    saveProject(migrated);
    return migrated;
  }

  return raw as unknown as Project;
}

/**
 * Load all projects from localStorage (with auto-migration)
 */
export function loadAllProjects(): Project[] {
  const rawProjects = loadAllProjectsRaw();
  return rawProjects.map((raw) => {
    if (needsMigration(raw)) {
      return migrateProjectV1toV2(raw as never);
    }
    return raw as unknown as Project;
  });
}

/**
 * Load raw projects without type checking
 */
function loadAllProjectsRaw(): Record<string, unknown>[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Get project metadata list (for the open dialog)
 */
export function getProjectMetaList(): ProjectMeta[] {
  const projects = loadAllProjects();
  return projects
    .map((p) => ({
      id: p.id,
      name: p.name,
      updatedAt: p.updatedAt,
      chartCount: p.charts.length,
    }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/**
 * Delete a project from localStorage
 */
export function deleteProject(id: string): void {
  const projects = loadAllProjects().filter((p) => p.id !== id);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

/**
 * Get the last opened project ID
 */
export function getLastProjectId(): string | null {
  return localStorage.getItem(CURRENT_PROJECT_KEY);
}
