'use client';

import { useCanvasStore } from '@/lib/store/canvas-store';
import { useUIStore } from '@/lib/store/ui-store';
import { useProjectStore } from '@/lib/store/project-store';
import { useMemo } from 'react';
import { buildModel } from '@/lib/codegen/model-builder';
import { validateModel } from '@/lib/codegen/validator';

export function StatusBar() {
  const viewport = useCanvasStore((s) => s.viewport);
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const selectedNodeIds = useUIStore((s) => s.selectedNodeIds);
  const selectedEdgeIds = useUIStore((s) => s.selectedEdgeIds);
  const interactionMode = useUIStore((s) => s.interactionMode);
  const isDirty = useProjectStore((s) => s.isDirty);
  const variables = useProjectStore((s) => s.currentProject?.variables ?? []);
  const projectName = useProjectStore((s) => s.currentProject?.name ?? '');

  const stateCount = nodes.filter((n) => n.type === 'stateNode').length;
  const zoom = Math.round(viewport.zoom * 100);
  const selectionCount = selectedNodeIds.length + selectedEdgeIds.length;

  const validationSummary = useMemo(() => {
    if (stateCount === 0) return { errors: 0, warnings: 0 };
    const model = buildModel(nodes, edges, variables, projectName);
    const messages = validateModel(model);
    return {
      errors: messages.filter((m) => m.level === 'error').length,
      warnings: messages.filter((m) => m.level === 'warning').length,
    };
  }, [nodes, edges, variables, projectName, stateCount]);

  return (
    <div className="flex h-6 items-center justify-between border-t bg-background px-3 text-xs text-muted-foreground">
      <div className="flex items-center gap-4">
        <span>
          {stateCount} state{stateCount !== 1 ? 's' : ''} · {edges.length}{' '}
          transition{edges.length !== 1 ? 's' : ''}
          {variables.length > 0 && ` · ${variables.length} var${variables.length !== 1 ? 's' : ''}`}
        </span>
        {selectionCount > 0 && <span>{selectionCount} selected</span>}
        {validationSummary.errors > 0 && (
          <span className="text-destructive">
            {validationSummary.errors} error{validationSummary.errors !== 1 ? 's' : ''}
          </span>
        )}
        {validationSummary.warnings > 0 && (
          <span className="text-yellow-500">
            {validationSummary.warnings} warning{validationSummary.warnings !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div className="flex items-center gap-4">
        {isDirty && (
          <span className="text-muted-foreground/60">Unsaved</span>
        )}
        {interactionMode !== 'select' && (
          <span className="rounded bg-primary/10 px-2 py-0.5 text-primary">
            {interactionMode === 'addState' ? 'Add State' : interactionMode}
          </span>
        )}
        <span>{zoom}%</span>
      </div>
    </div>
  );
}
