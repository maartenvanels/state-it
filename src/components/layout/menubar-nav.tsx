'use client';

import { useCallback, useEffect } from 'react';
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
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { saveProject } from '@/lib/persistence/storage';
import { NewProjectDialog } from '@/components/dialogs/new-project-dialog';
import { OpenProjectDialog } from '@/components/dialogs/open-project-dialog';
import { ExportDialog } from '@/components/dialogs/export-dialog';
import { SettingsDialog } from '@/components/dialogs/settings-dialog';
import { AboutDialog } from '@/components/dialogs/about-dialog';

export function MenubarNav() {
  const activeDialog = useUIStore((s) => s.activeDialog);
  const openDialog = useUIStore((s) => s.openDialog);
  const closeDialog = useUIStore((s) => s.closeDialog);
  const togglePanel = useUIStore((s) => s.togglePanel);
  const projectName = useProjectStore((s) => s.currentProject?.name);
  const isDirty = useProjectStore((s) => s.isDirty);

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
      useProjectStore.getState().flushCanvasToSystem(canvasState.nodes, canvasState.viewport);
    }

    const flushedProject = useProjectStore.getState().currentProject;
    if (flushedProject) saveProject(flushedProject);
    useProjectStore.getState().markClean();
  }, []);

  // Ctrl+S to save, Ctrl+N to new, Ctrl+O to open
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
              <MenubarItem>
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
      <NewProjectDialog
        open={activeDialog === 'newProject'}
        onOpenChange={(open) => !open && closeDialog()}
      />
      <OpenProjectDialog
        open={activeDialog === 'openProject'}
        onOpenChange={(open) => !open && closeDialog()}
      />
      <ExportDialog
        open={activeDialog === 'export'}
        onOpenChange={(open) => !open && closeDialog()}
      />
      <SettingsDialog
        open={activeDialog === 'settings'}
        onOpenChange={(open) => !open && closeDialog()}
      />
      <AboutDialog
        open={activeDialog === 'about'}
        onOpenChange={(open) => !open && closeDialog()}
      />
    </>
  );
}
