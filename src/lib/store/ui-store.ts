'use client';

import { create } from 'zustand';

export type DialogType =
  | 'newProject'
  | 'openProject'
  | 'export'
  | 'settings'
  | 'variable'
  | 'about';

export type InteractionMode =
  | 'select'
  | 'addState'
  | 'addTransition'
  | 'addDefaultTransition';

interface UIState {
  selectedNodeIds: string[];
  selectedEdgeIds: string[];

  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  bottomPanelOpen: boolean;

  leftPanelTab: 'hierarchy' | 'data';
  codePreviewLanguage: 'c' | 'scl';

  activeDialog: DialogType | null;
  dialogProps: Record<string, unknown>;

  interactionMode: InteractionMode;

  contextMenu: {
    type: 'canvas' | 'node' | 'edge' | null;
    position: { x: number; y: number };
    targetId: string | null;
  };

  // Drag highlights (transient, not in undo history)
  dropTargetNodeId: string | null;
  collidingNodeIds: string[];

  // Connection dragging state
  isConnecting: boolean;
}

interface UIActions {
  setSelection: (nodeIds: string[], edgeIds: string[]) => void;
  togglePanel: (panel: 'left' | 'right' | 'bottom') => void;
  setPanelOpen: (panel: 'left' | 'right' | 'bottom', open: boolean) => void;
  setLeftPanelTab: (tab: 'hierarchy' | 'data') => void;
  setCodePreviewLanguage: (lang: 'c' | 'scl') => void;
  setInteractionMode: (mode: InteractionMode) => void;
  openDialog: (type: DialogType, props?: Record<string, unknown>) => void;
  closeDialog: () => void;
  openContextMenu: (
    type: 'canvas' | 'node' | 'edge',
    position: { x: number; y: number },
    targetId?: string
  ) => void;
  closeContextMenu: () => void;
  setDragHighlights: (
    dropTargetId: string | null,
    collidingIds: string[]
  ) => void;
  clearDragHighlights: () => void;
  setIsConnecting: (connecting: boolean) => void;
}

export const useUIStore = create<UIState & UIActions>()((set) => ({
  selectedNodeIds: [],
  selectedEdgeIds: [],

  leftPanelOpen: true,
  rightPanelOpen: true,
  bottomPanelOpen: true,

  leftPanelTab: 'hierarchy',
  codePreviewLanguage: 'c',

  activeDialog: null,
  dialogProps: {},

  interactionMode: 'select',

  contextMenu: {
    type: null,
    position: { x: 0, y: 0 },
    targetId: null,
  },

  dropTargetNodeId: null,
  collidingNodeIds: [],
  isConnecting: false,

  setSelection: (nodeIds, edgeIds) =>
    set({ selectedNodeIds: nodeIds, selectedEdgeIds: edgeIds }),

  togglePanel: (panel) =>
    set((state) => {
      switch (panel) {
        case 'left':
          return { leftPanelOpen: !state.leftPanelOpen };
        case 'right':
          return { rightPanelOpen: !state.rightPanelOpen };
        case 'bottom':
          return { bottomPanelOpen: !state.bottomPanelOpen };
      }
    }),

  setPanelOpen: (panel, open) =>
    set(() => {
      switch (panel) {
        case 'left':
          return { leftPanelOpen: open };
        case 'right':
          return { rightPanelOpen: open };
        case 'bottom':
          return { bottomPanelOpen: open };
      }
    }),

  setLeftPanelTab: (tab) => set({ leftPanelTab: tab }),
  setCodePreviewLanguage: (lang) => set({ codePreviewLanguage: lang }),

  setInteractionMode: (mode) => set({ interactionMode: mode }),

  openDialog: (type, props = {}) =>
    set({ activeDialog: type, dialogProps: props }),

  closeDialog: () => set({ activeDialog: null, dialogProps: {} }),

  openContextMenu: (type, position, targetId) =>
    set({
      contextMenu: { type, position, targetId: targetId ?? null },
    }),

  closeContextMenu: () =>
    set({
      contextMenu: { type: null, position: { x: 0, y: 0 }, targetId: null },
    }),

  setDragHighlights: (dropTargetId, collidingIds) =>
    set({ dropTargetNodeId: dropTargetId, collidingNodeIds: collidingIds }),

  clearDragHighlights: () =>
    set({ dropTargetNodeId: null, collidingNodeIds: [] }),

  setIsConnecting: (connecting) => set({ isConnecting: connecting }),
}));
