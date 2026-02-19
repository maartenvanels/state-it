import type { CanvasNode, TransitionEdge } from '../types/canvas';
import type { Variable } from '../types/variable';
import type { GeneratedProject, GeneratedFile } from '../types/codegen';
import { buildModel } from './model-builder';
import { validateModel } from './validator';
import { generateC } from './c-generator';
import { generateSCL } from './scl-generator';

export type CodeGenTarget = 'c' | 'scl' | 'both';

export interface ProjectGeneratorInput {
  nodes: CanvasNode[];
  edges: TransitionEdge[];
  variables: Variable[];
  projectName: string;
  target: CodeGenTarget;
}

/**
 * Generate all output files for a project.
 * Wraps the individual C/SCL generators into a unified GeneratedProject structure.
 * In Phase B this will iterate over multiple charts; for now it handles a single chart.
 */
export function generateProject(input: ProjectGeneratorInput): GeneratedProject {
  const { nodes, edges, variables, projectName, target } = input;

  const stateNodes = nodes.filter((n) => n.type === 'stateNode');
  if (stateNodes.length === 0) {
    return { files: [], messages: [] };
  }

  const model = buildModel(nodes, edges, variables, projectName);
  const messages = validateModel(model);
  const safeName = model.name.toLowerCase();
  const files: GeneratedFile[] = [];

  if (target === 'c' || target === 'both') {
    const { header, source } = generateC(model);
    files.push({
      filename: `${safeName}.h`,
      content: header,
      language: 'c',
      category: 'header',
    });
    files.push({
      filename: `${safeName}.c`,
      content: source,
      language: 'c',
      category: 'source',
    });
  }

  if (target === 'scl' || target === 'both') {
    const scl = generateSCL(model);
    files.push({
      filename: `${safeName}.scl`,
      content: scl,
      language: 'scl',
      category: 'scl',
    });
  }

  return { files, messages };
}
