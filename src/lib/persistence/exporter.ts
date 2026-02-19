import type { Project } from '../types/project';
import type { Variable } from '../types/variable';
import type { CanvasNode, TransitionEdge } from '../types/canvas';
import { generateProject } from '../codegen/project-generator';

/**
 * Download a string as a file
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export project as JSON (full project — should be flushed before calling)
 */
export function exportProjectJSON(project: Project) {
  const json = JSON.stringify(project, null, 2);
  downloadFile(json, `${project.name}.states.json`, 'application/json');
}

/**
 * Export generated C code for a single chart
 */
export function exportCCode(
  chartName: string,
  variables: Variable[],
  nodes: CanvasNode[],
  edges: TransitionEdge[]
) {
  const generated = generateProject({
    nodes,
    edges,
    variables,
    projectName: chartName,
    target: 'c',
  });
  for (const file of generated.files) {
    downloadFile(file.content, file.filename, 'text/x-c');
  }
}

/**
 * Export generated SCL code for a single chart
 */
export function exportSCLCode(
  chartName: string,
  variables: Variable[],
  nodes: CanvasNode[],
  edges: TransitionEdge[]
) {
  const generated = generateProject({
    nodes,
    edges,
    variables,
    projectName: chartName,
    target: 'scl',
  });
  for (const file of generated.files) {
    downloadFile(file.content, file.filename, 'text/plain');
  }
}

/**
 * Export all generated code files (C + SCL) for a single chart
 */
export function exportAllCode(
  chartName: string,
  variables: Variable[],
  nodes: CanvasNode[],
  edges: TransitionEdge[]
) {
  const generated = generateProject({
    nodes,
    edges,
    variables,
    projectName: chartName,
    target: 'both',
  });
  for (const file of generated.files) {
    const mime = file.language === 'c' ? 'text/x-c' : 'text/plain';
    downloadFile(file.content, file.filename, mime);
  }
}

/**
 * Import a project from JSON file
 */
export function importProjectJSON(file: File): Promise<Project> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        resolve(json as Project);
      } catch {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
