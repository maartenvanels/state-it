'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProjectStore } from '@/lib/store/project-store';
import { useCanvasStore } from '@/lib/store/canvas-store';
import { useNavigationStore } from '@/lib/store/navigation-store';
import { saveProject } from '@/lib/persistence/storage';
import { deserializeSystemToCanvas } from '@/lib/persistence/serializer';

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewProjectDialog({ open, onOpenChange }: NewProjectDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const createProject = useProjectStore((s) => s.createProject);
  const currentProject = useProjectStore((s) => s.currentProject);

  const handleCreate = () => {
    // Warn about unsaved changes
    const isDirty = useProjectStore.getState().isDirty;
    if (isDirty) {
      const confirmed = window.confirm(
        'You have unsaved changes. Create a new project anyway?'
      );
      if (!confirmed) return;
    }

    const projectName = name.trim() || 'Untitled Project';

    // Flush and save current project before switching
    if (currentProject) {
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
    }

    // Reset canvas
    useCanvasStore.getState().reset();

    // Create new project and load system view
    const project = createProject(projectName, description.trim());
    saveProject(project);

    const { nodes, edges } = deserializeSystemToCanvas(project);
    useCanvasStore.getState().setNodes(nodes);
    useCanvasStore.getState().setEdges(edges);
    useNavigationStore.setState({ activeView: { type: 'system' } });
    useCanvasStore.temporal.getState().clear();

    setName('');
    setDescription('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My State Machine"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="project-desc">Description (optional)</Label>
            <Input
              id="project-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
