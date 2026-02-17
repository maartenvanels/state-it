'use client';

import { useEffect, useRef } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { useProjectStore } from '@/lib/store/project-store';
import { useCanvasStore } from '@/lib/store/canvas-store';
import {
  getLastProjectId,
  loadProject,
  saveProject,
} from '@/lib/persistence/storage';
import {
  deserializeProjectToCanvas,
  serializeCanvasToProject,
} from '@/lib/persistence/serializer';

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialized = useRef(false);

  // Load last project from localStorage on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const lastId = getLastProjectId();
    if (lastId) {
      const project = loadProject(lastId);
      if (project) {
        const { nodes, edges } = deserializeProjectToCanvas(project);
        useCanvasStore.getState().setNodes(nodes);
        useCanvasStore.getState().setEdges(edges);
        useProjectStore.getState().setCurrentProject(project);
        return;
      }
    }
    // No saved project — create a default one
    useProjectStore.getState().createProject('Untitled Project');
  }, []);

  // Auto-save periodically
  useEffect(() => {
    const timer = setInterval(() => {
      const { currentProject, isDirty, markClean } =
        useProjectStore.getState();
      if (!isDirty || !currentProject) return;
      const { nodes, edges } = useCanvasStore.getState();
      const saved = serializeCanvasToProject(currentProject, nodes, edges);
      saveProject(saved);
      markClean();
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <ReactFlowProvider>
      <div className="flex h-screen w-screen flex-col overflow-hidden">
        {children}
      </div>
    </ReactFlowProvider>
  );
}
