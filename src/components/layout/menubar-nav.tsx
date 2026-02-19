'use client';

import { useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from '@/components/ui/menubar';
import { useUIStore } from '@/lib/store/ui-store';
import { useProjectStore } from '@/lib/store/project-store';
import { useCanvasStore } from '@/lib/store/canvas-store';
import { useNavigationStore } from '@/lib/store/navigation-store';
import { useShallow } from 'zustand/react/shallow';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { saveProject } from '@/lib/persistence/storage';

const NewProjectDialog = dynamic(() => import('@/components/dialogs/new-project-dialog').then(mod => mod.NewProjectDialog));
const OpenProjectDialog = dynamic(() => import('@/components/dialogs/open-project-dialog').then(mod => mod.OpenProjectDialog));
const ExportDialog = dynamic(() => import('@/components/dialogs/export-dialog').then(mod => mod.ExportDialog), { ssr: false });
const SettingsDialog = dynamic(() => import('@/components/dialogs/settings-dialog').then(mod => mod.SettingsDialog));
const AboutDialog = dynamic(() => import('@/components/dialogs/about-dialog').then(mod => mod.AboutDialog));
const ShortcutsDialog = dynamic(() => import('@/components/dialogs/shortcuts-dialog').then(mod => mod.ShortcutsDialog));

export function MenubarNav() {
  const { activeDialog, openDialog, closeDialog, togglePanel } = useUIStore(
    useShallow((s) => ({
      activeDialog: s.activeDialog,
      openDialog: s.openDialog,
      closeDialog: s.closeDialog,
      togglePanel: s.togglePanel,
    }))
  );
  const { projectName, isDirty } = useProjectStore(
    useShallow((s) => ({
      projectName: s.currentProject?.name,
      isDirty: s.isDirty,
    }))
  );

  const handleSave = useCallback(() => {
    const project = useProjectStore.getState().currentProject;
    if (!project) return;

    // Flush active canvas back to project
    const canvasState = useCanvasStore.getState();
    const activeView = useNavigationStore.getState().activeView;
    if (activeView.type === 'chart') {
      useProjectStore.getState().flushCanvasToChart(
        activeView.chartId, canvasState.nodes, canvasState.edges, canvasState.viewport
      );
    } else {
      useProjectStore.getState().flushCanvasToSystem(canvasState.nodes, canvasState.edges, canvasState.viewport);
    }

    const flushedProject = useProjectStore.getState().currentProject;
    if (flushedProject) saveProject(flushedProject);
    useProjectStore.getState().markClean();
  }, []);

  const handleDelete = useCallback(() => {
    const { selectedNodeIds, selectedEdgeIds } = useUIStore.getState();
    const canvasStore = useCanvasStore.getState();
    if (selectedNodeIds.length > 0) {
      canvasStore.removeNodes(selectedNodeIds);
    }
    if (selectedEdgeIds.length > 0) {
      canvasStore.removeEdges(selectedEdgeIds);
    }
    useUIStore.getState().setSelection([], []);
  }, []);

  const handleSelectAll = useCallback(() => {
    const { nodes, edges } = useCanvasStore.getState();
    useUIStore.getState().setSelection(
      nodes.map((n) => n.id),
      edges.map((e) => e.id)
    );
  }, []);

  // Ctrl+S to save, Ctrl+N to new, Ctrl+O to open, Ctrl+/ for shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        openDialog('newProject');
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        openDialog('openProject');
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        openDialog('shortcuts');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, openDialog]);

  return (
    <>
      <div className="flex h-10 items-center border-b bg-background px-2">
        <div className="flex items-center gap-2 mr-4">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-bold">
            S
          </div>
          <span className="text-sm font-semibold">
            {projectName ?? 'State It'}
            {isDirty && ' *'}
          </span>
        </div>

        <Menubar className="border-none bg-transparent shadow-none">
          <MenubarMenu>
            <MenubarTrigger className="text-sm">File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={() => openDialog('newProject')}>
                New Project <MenubarShortcut>Ctrl+N</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onClick={() => openDialog('openProject')}>
                Open Project <MenubarShortcut>Ctrl+O</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onClick={handleSave}>
                Save <MenubarShortcut>Ctrl+S</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onClick={() => openDialog('export')}>
                Export Code...
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger className="text-sm">Edit</MenubarTrigger>
            <MenubarContent>
              <MenubarItem
                onClick={() => useCanvasStore.temporal.getState().undo()}
              >
                Undo <MenubarShortcut>Ctrl+Z</MenubarShortcut>
              </MenubarItem>
              <MenubarItem
                onClick={() => useCanvasStore.temporal.getState().redo()}
              >
                Redo <MenubarShortcut>Ctrl+Y</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onClick={handleSelectAll}>
                Select All <MenubarShortcut>Ctrl+A</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onClick={handleDelete}>
                Delete <MenubarShortcut>Del</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger className="text-sm">View</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={() => togglePanel('left')}>
                Toggle Sidebar
              </MenubarItem>
              <MenubarItem onClick={() => togglePanel('right')}>
                Toggle Properties
              </MenubarItem>
              <MenubarItem onClick={() => togglePanel('bottom')}>
                Toggle Code Preview
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onClick={() => openDialog('settings')}>
                Settings...
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger className="text-sm">Help</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={() => openDialog('shortcuts')}>
                Keyboard Shortcuts <MenubarShortcut>Ctrl+/</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onClick={() => openDialog('about')}>
                About State It
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>

        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>

      {/* Dialogs */}
      {activeDialog === 'newProject' && (
        <NewProjectDialog
          open={true}
          onOpenChange={(open) => !open && closeDialog()}
        />
      )}
      {activeDialog === 'openProject' && (
        <OpenProjectDialog
          open={true}
          onOpenChange={(open) => !open && closeDialog()}
        />
      )}
      {activeDialog === 'export' && (
        <ExportDialog
          open={true}
          onOpenChange={(open) => !open && closeDialog()}
        />
      )}
      {activeDialog === 'settings' && (
        <SettingsDialog
          open={true}
          onOpenChange={(open) => !open && closeDialog()}
        />
      )}
      {activeDialog === 'about' && (
        <AboutDialog
          open={true}
          onOpenChange={(open) => !open && closeDialog()}
        />
      )}
      {activeDialog === 'shortcuts' && (
        <ShortcutsDialog
          open={true}
          onOpenChange={(open) => !open && closeDialog()}
        />
      )}
    </>
  );
}
