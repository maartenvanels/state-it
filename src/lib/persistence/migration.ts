import { nanoid } from 'nanoid';
import type { Project } from '../types/project';
import type { Chart } from '../types/chart';
import type { SystemBlock } from '../types/system';

/**
 * Legacy project format (v1) — states/transitions/variables at root level
 */
interface LegacyProject {
  id: string;
  name: string;
  description: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  settings: Project['settings'];
  states?: unknown[];
  transitions?: unknown[];
  variables?: unknown[];
  annotations?: unknown[];
}

/**
 * Check if a project needs migration from v1 to v2 format
 */
export function needsMigration(project: unknown): boolean {
  const p = project as Record<string, unknown>;
  return Array.isArray(p.states) && !Array.isArray(p.charts);
}

/**
 * Migrate a v1 project (flat states/transitions/variables) to v2 format (charts + system)
 */
export function migrateProjectV1toV2(oldProject: LegacyProject): Project {
  const chartId = nanoid();
  const blockId = nanoid();

  const chart: Chart = {
    id: chartId,
    name: oldProject.name,
    description: oldProject.description || '',
    ports: [],
    states: (oldProject.states ?? []) as Chart['states'],
    transitions: (oldProject.transitions ?? []) as Chart['transitions'],
    variables: (oldProject.variables ?? []) as Chart['variables'],
    annotations: (oldProject.annotations ?? []) as Chart['annotations'],
  };

  const systemBlock: SystemBlock = {
    id: blockId,
    type: 'chart',
    name: oldProject.name,
    chartId,
    position: { x: 100, y: 100 },
    size: { width: 200, height: 120 },
    config: {},
  };

  return {
    id: oldProject.id,
    name: oldProject.name,
    description: oldProject.description,
    version: '2.0.0',
    createdAt: oldProject.createdAt,
    updatedAt: oldProject.updatedAt,
    settings: oldProject.settings,
    charts: [chart],
    systemBlocks: [systemBlock],
    systemWires: [],
  };
}
