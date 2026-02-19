'use client';

import { useEffect, useRef } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { useProjectStore } from '@/lib/store/project-store';
import { useCanvasStore } from '@/lib/store/canvas-store';
import { useNavigationStore } from '@/lib/store/navigation-store';
import {
  getLastProjectId,
  loadProject,
  saveProject,
} from '@/lib/persistence/storage';
import { deserializeSystemToCanvas } from '@/lib/persistence/serializer';

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
        useProjectStore.getState().setCurrentProject(project);

        // Default to system view
        const { nodes, edges } = deserializeSystemToCanvas(project);
        useCanvasStore.getState().setNodes(nodes);
        useCanvasStore.getState().setEdges(edges);
        if (project.systemViewport) {
          useCanvasStore.getState().setViewport(project.systemViewport);
        }
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

      // Flush active canvas back to project before saving
      const activeView = useNavigationStore.getState().activeView;
      const canvasState = useCanvasStore.getState();
      if (activeView.type === 'chart') {
        useProjectStore.getState().flushCanvasToChart(
          activeView.chartId,
          canvasState.nodes,
          canvasState.edges,
          canvasState.viewport
        );
      } else {
        useProjectStore.getState().flushCanvasToSystem(
          canvasState.nodes,
          canvasState.edges,
          canvasState.viewport
        );
      }

      // Save the flushed project
      const flushedProject = useProjectStore.getState().currentProject;
      if (flushedProject) {
        saveProject(flushedProject);
      }
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
