import type { Project } from '../types/project';
import type { CanvasNode, TransitionEdge } from '../types/canvas';
import { serializeCanvasToProject } from './serializer';
import { buildModel } from '../codegen/model-builder';
import { generateC } from '../codegen/c-generator';
import { generateSCL } from '../codegen/scl-generator';

/**
 * Download a string as a file
 */
function downloadFile(content: string, filename: string, mimeType: string) {
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
 * Export project as JSON
 */
export function exportProjectJSON(
  project: Project,
  nodes: CanvasNode[],
  edges: TransitionEdge[]
) {
  const fullProject = serializeCanvasToProject(project, nodes, edges);
  const json = JSON.stringify(fullProject, null, 2);
  downloadFile(json, `${project.name}.states.json`, 'application/json');
}

/**
 * Export generated C code
 */
export function exportCCode(
  project: Project,
  nodes: CanvasNode[],
  edges: TransitionEdge[]
) {
  const model = buildModel(nodes, edges, project.variables, project.name);
  const { header, source } = generateC(model);
  const safeName = model.name.toLowerCase();

  downloadFile(header, `${safeName}.h`, 'text/x-c');
  downloadFile(source, `${safeName}.c`, 'text/x-c');
}

/**
 * Export generated SCL code
 */
export function exportSCLCode(
  project: Project,
  nodes: CanvasNode[],
  edges: TransitionEdge[]
) {
  const model = buildModel(nodes, edges, project.variables, project.name);
  const scl = generateSCL(model);
  const safeName = model.name.toLowerCase();

  downloadFile(scl, `${safeName}.scl`, 'text/plain');
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
