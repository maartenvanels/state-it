'use client';

import { create } from 'zustand';
import { useCanvasStore } from './canvas-store';
import { useProjectStore } from './project-store';
import { deserializeChartToCanvas, deserializeSystemToCanvas } from '../persistence/serializer';

export type ActiveView =
  | { type: 'system' }
  | { type: 'chart'; chartId: string };

interface NavigationState {
  activeView: ActiveView;
}

interface NavigationActions {
  navigateToSystem: () => void;
  navigateToChart: (chartId: string) => void;
  getActiveChartId: () => string | null;
}

export const useNavigationStore = create<NavigationState & NavigationActions>()(
  (set, get) => ({
    activeView: { type: 'system' },

    navigateToSystem: () => {
      const currentView = get().activeView;
      if (currentView.type === 'system') return;

      const canvasStore = useCanvasStore.getState();
      const projectStore = useProjectStore.getState();

      // Flush current chart canvas back to project
      if (currentView.type === 'chart') {
        projectStore.flushCanvasToChart(
          currentView.chartId,
          canvasStore.nodes,
          canvasStore.edges,
          canvasStore.viewport
        );
      }

      // Load system canvas
      const project = useProjectStore.getState().currentProject;
      if (!project) return;

      const { nodes, edges } = deserializeSystemToCanvas(project);
      canvasStore.setNodes(nodes);
      canvasStore.setEdges(edges);

      // Restore system viewport
      if (project.systemViewport) {
        canvasStore.setViewport(project.systemViewport);
      }

      // Clear undo history
      useCanvasStore.temporal.getState().clear();

      set({ activeView: { type: 'system' } });
    },

    navigateToChart: (chartId: string) => {
      const currentView = get().activeView;
      const canvasStore = useCanvasStore.getState();
      const projectStore = useProjectStore.getState();
      const project = projectStore.currentProject;
      if (!project) return;

      // Flush current canvas
      if (currentView.type === 'system') {
        projectStore.flushCanvasToSystem(
          canvasStore.nodes,
          canvasStore.viewport
        );
      } else if (currentView.type === 'chart' && currentView.chartId !== chartId) {
        projectStore.flushCanvasToChart(
          currentView.chartId,
          canvasStore.nodes,
          canvasStore.edges,
          canvasStore.viewport
        );
      }

      // Load chart canvas
      // Re-read project after flush
      const updatedProject = useProjectStore.getState().currentProject;
      const chart = updatedProject?.charts.find((c) => c.id === chartId);
      if (!chart) return;

      const { nodes, edges } = deserializeChartToCanvas(chart);
      canvasStore.setNodes(nodes);
      canvasStore.setEdges(edges);

      // Restore chart viewport
      if (chart.viewport) {
        canvasStore.setViewport(chart.viewport);
      }

      // Clear undo history
      useCanvasStore.temporal.getState().clear();

      set({ activeView: { type: 'chart', chartId } });
    },

    getActiveChartId: () => {
      const view = get().activeView;
      return view.type === 'chart' ? view.chartId : null;
    },
  })
);
