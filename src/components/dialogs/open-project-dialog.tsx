'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProjectStore } from '@/lib/store/project-store';
import { useCanvasStore } from '@/lib/store/canvas-store';
import { useNavigationStore } from '@/lib/store/navigation-store';
import {
  getProjectMetaList,
  loadProject,
  deleteProject,
  saveProject,
} from '@/lib/persistence/storage';
import { deserializeSystemToCanvas } from '@/lib/persistence/serializer';
import { importProjectJSON } from '@/lib/persistence/exporter';
import { Trash2, Upload, FileJson } from 'lucide-react';
import type { ProjectMeta } from '@/lib/types/project';

interface OpenProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OpenProjectDialog({
  open,
  onOpenChange,
}: OpenProjectDialogProps) {
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setCurrentProject = useProjectStore((s) => s.setCurrentProject);
  const currentProject = useProjectStore((s) => s.currentProject);

  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setProjects(getProjectMetaList());
      setSelectedId(null);
    }
  }

  const flushAndSaveCurrent = () => {
    if (!currentProject) return;
    const canvasState = useCanvasStore.getState();
    const activeView = useNavigationStore.getState().activeView;
    if (activeView.type === 'chart') {
      useProjectStore.getState().flushCanvasToChart(
        activeView.chartId, canvasState.nodes, canvasState.edges, canvasState.viewport
      );
    } else {
      useProjectStore.getState().flushCanvasToSystem(canvasState.nodes, canvasState.edges, canvasState.viewport);
    }
    const flushed = useProjectStore.getState().currentProject;
    if (flushed) saveProject(flushed);
  };

  const handleOpen = () => {
    if (!selectedId) return;

    // Warn about unsaved changes
    const isDirty = useProjectStore.getState().isDirty;
    if (isDirty) {
      const confirmed = window.confirm(
        'You have unsaved changes. Open a different project anyway?'
      );
      if (!confirmed) return;
    }

    const project = loadProject(selectedId);
    if (!project) return;

    // Save current project
    flushAndSaveCurrent();

    // Load the selected project at system view
    const { nodes, edges } = deserializeSystemToCanvas(project);
    useCanvasStore.getState().setNodes(nodes);
    useCanvasStore.getState().setEdges(edges);
    setCurrentProject(project);
    useNavigationStore.setState({ activeView: { type: 'system' } });
    useCanvasStore.temporal.getState().clear();

    onOpenChange(false);
  };

  const handleDelete = (id: string) => {
    deleteProject(id);
    setProjects(getProjectMetaList());
    if (selectedId === id) setSelectedId(null);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const project = await importProjectJSON(file);

      // Save current project
      flushAndSaveCurrent();

      // Load imported project at system view
      saveProject(project);
      const { nodes, edges } = deserializeSystemToCanvas(project);
      useCanvasStore.getState().setNodes(nodes);
      useCanvasStore.getState().setEdges(edges);
      setCurrentProject(project);
      useNavigationStore.setState({ activeView: { type: 'system' } });
      useCanvasStore.temporal.getState().clear();

      onOpenChange(false);
    } catch {
      // Could show an error toast here
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Open Project</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-64">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground">
              <FileJson className="mb-2 h-8 w-8 opacity-50" />
              <p>No saved projects</p>
            </div>
          ) : (
            <div className="space-y-1 pr-4">
              {projects.map((p) => (
                <button
                  key={p.id}
                  className={`w-full flex items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${selectedId === p.id
                    ? 'bg-accent text-accent-foreground'
                    : ''
                    }`}
                  onClick={() => setSelectedId(p.id)}
                  onDoubleClick={() => {
                    setSelectedId(p.id);
                    handleOpen();
                  }}
                >
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.chartCount} chart{p.chartCount !== 1 ? 's' : ''}
                      <span className="mx-1">&middot;</span>
                      {new Date(p.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    className="p-1 rounded hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(p.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              Import JSON
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleOpen} disabled={!selectedId}>
              Open
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
