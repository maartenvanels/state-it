import type { Project, ProjectMeta } from '../types/project';

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
 * Load a project by ID from localStorage
 */
export function loadProject(id: string): Project | null {
  const projects = loadAllProjects();
  return projects.find((p) => p.id === id) ?? null;
}

/**
 * Load all projects from localStorage
 */
export function loadAllProjects(): Project[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Project[];
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
      stateCount: p.states.length,
      transitionCount: p.transitions.length,
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
