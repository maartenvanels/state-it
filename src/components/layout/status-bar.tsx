'use client';

import { useCanvasStore } from '@/lib/store/canvas-store';
import { useUIStore } from '@/lib/store/ui-store';
import { useProjectStore } from '@/lib/store/project-store';
import { useNavigationStore } from '@/lib/store/navigation-store';
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
  const activeView = useNavigationStore((s) => s.activeView);
  const chartId = activeView.type === 'chart' ? activeView.chartId : null;
  const variables = useProjectStore((s) => {
    if (!chartId || !s.currentProject) return [];
    const chart = s.currentProject.charts.find((c) => c.id === chartId);
    return chart?.variables ?? [];
  });
  const projectName = useProjectStore((s) => s.currentProject?.name ?? '');
  const viewLabel = useProjectStore((s) => {
    if (activeView.type === 'system') return 'System';
    const chart = s.currentProject?.charts.find((c) => c.id === chartId);
    return chart?.name ?? 'Chart';
  });

  const isSystemView = activeView.type === 'system';
  const stateCount = nodes.filter((n) => n.type === 'stateNode').length;
  const blockCount = useProjectStore((s) => s.currentProject?.systemBlocks.length ?? 0);
  const wireCount = useProjectStore((s) => s.currentProject?.systemWires.length ?? 0);
  const zoom = Math.round(viewport.zoom * 100);
  const selectionCount = selectedNodeIds.length + selectedEdgeIds.length;

  const validationSummary = useMemo(() => {
    if (isSystemView || stateCount === 0) return { errors: 0, warnings: 0 };
    const model = buildModel(nodes, edges, variables, projectName);
    const messages = validateModel(model);
    return {
      errors: messages.filter((m) => m.level === 'error').length,
      warnings: messages.filter((m) => m.level === 'warning').length,
    };
  }, [nodes, edges, variables, projectName, stateCount, isSystemView]);

  return (
    <div className="flex h-6 items-center justify-between border-t bg-background px-3 text-xs text-muted-foreground">
      <div className="flex items-center gap-4">
        {isSystemView ? (
          <span>
            {blockCount} block{blockCount !== 1 ? 's' : ''} · {wireCount} wire{wireCount !== 1 ? 's' : ''}
          </span>
        ) : (
          <span>
            {stateCount} state{stateCount !== 1 ? 's' : ''} · {edges.length}{' '}
            transition{edges.length !== 1 ? 's' : ''}
            {variables.length > 0 && ` · ${variables.length} var${variables.length !== 1 ? 's' : ''}`}
          </span>
        )}
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
        <span className="text-muted-foreground/60">{viewLabel}</span>
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
