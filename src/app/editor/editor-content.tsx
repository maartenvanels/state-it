'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import type { PanelImperativeHandle, PanelSize } from 'react-resizable-panels';
import { GripVerticalIcon } from 'lucide-react';
import { MenubarNav } from '@/components/layout/menubar-nav';
import { Toolbar } from '@/components/layout/toolbar';
import { BreadcrumbNav } from '@/components/layout/breadcrumb-nav';
import { Sidebar } from '@/components/layout/sidebar';
import { StatusBar } from '@/components/layout/status-bar';
import { StateCanvas } from '@/components/canvas/state-canvas';
import { PropertiesPanel } from '@/components/panels/properties-panel';
import { CodePreviewPanel } from '@/components/panels/code-preview-panel';
import { useUIStore } from '@/lib/store/ui-store';

function Handle({ vertical = false }: { vertical?: boolean }) {
  return (
    <Separator
      className={`
        relative flex items-center justify-center bg-border
        ${vertical ? 'h-1' : 'w-1'}
        hover:bg-blue-500 active:bg-blue-500 transition-colors
        after:absolute after:inset-0
        ${vertical ? 'after:h-4 after:-translate-y-1/2 after:top-1/2' : 'after:w-4 after:-translate-x-1/2 after:left-1/2'}
      `}
    >
      <div
        className={`bg-border z-10 flex items-center justify-center rounded-sm border ${
          vertical ? 'h-4 w-6' : 'h-6 w-4'
        }`}
      >
        <GripVerticalIcon
          className={`size-3 ${vertical ? 'rotate-90' : ''}`}
        />
      </div>
    </Separator>
  );
}

export default function EditorContent() {
  const leftPanelOpen = useUIStore((s) => s.leftPanelOpen);
  const rightPanelOpen = useUIStore((s) => s.rightPanelOpen);
  const bottomPanelOpen = useUIStore((s) => s.bottomPanelOpen);
  const setPanelOpen = useUIStore((s) => s.setPanelOpen);

  const leftRef = useRef<PanelImperativeHandle>(null);
  const rightRef = useRef<PanelImperativeHandle>(null);
  const bottomRef = useRef<PanelImperativeHandle>(null);

  // Sync store → panels
  useEffect(() => {
    if (leftPanelOpen) leftRef.current?.expand();
    else leftRef.current?.collapse();
  }, [leftPanelOpen]);

  useEffect(() => {
    if (rightPanelOpen) rightRef.current?.expand();
    else rightRef.current?.collapse();
  }, [rightPanelOpen]);

  useEffect(() => {
    if (bottomPanelOpen) bottomRef.current?.expand();
    else bottomRef.current?.collapse();
  }, [bottomPanelOpen]);

  // Sync panels → store (when user drags to collapse/expand)
  const onLeftResize = useCallback(
    (size: PanelSize) => {
      const collapsed = size.asPercentage === 0;
      if (collapsed !== !leftPanelOpen) {
        setPanelOpen('left', !collapsed);
      }
    },
    [leftPanelOpen, setPanelOpen]
  );

  const onRightResize = useCallback(
    (size: PanelSize) => {
      const collapsed = size.asPercentage === 0;
      if (collapsed !== !rightPanelOpen) {
        setPanelOpen('right', !collapsed);
      }
    },
    [rightPanelOpen, setPanelOpen]
  );

  const onBottomResize = useCallback(
    (size: PanelSize) => {
      const collapsed = size.asPercentage === 0;
      if (collapsed !== !bottomPanelOpen) {
        setPanelOpen('bottom', !collapsed);
      }
    },
    [bottomPanelOpen, setPanelOpen]
  );

  return (
    <>
      <MenubarNav />
      <Toolbar />
      <BreadcrumbNav />

      <div className="flex-1 overflow-hidden">
        <Group
          orientation="horizontal"
          className="flex h-full w-full"
        >
          <Panel
            panelRef={leftRef}
            defaultSize={15}
            minSize="270px"
            collapsible
            collapsedSize={0}
            onResize={onLeftResize}
            className="bg-background"
          >
            <Sidebar />
          </Panel>
          <Handle />

          <Panel defaultSize={65} minSize="300px">
            <Group
              orientation="vertical"
              className="flex h-full w-full flex-col"
            >
              <Panel defaultSize={75} minSize="150px">
                <StateCanvas />
              </Panel>
              <Handle vertical />
              <Panel
                panelRef={bottomRef}
                defaultSize={25}
                minSize="120px"
                collapsible
                collapsedSize={0}
                onResize={onBottomResize}
                className="bg-background"
              >
                <CodePreviewPanel />
              </Panel>
            </Group>
          </Panel>
          <Handle />

          <Panel
            panelRef={rightRef}
            defaultSize={20}
            minSize="300px"
            collapsible
            collapsedSize={0}
            onResize={onRightResize}
            className="bg-background border-l"
          >
            <PropertiesPanel />
          </Panel>
        </Group>
      </div>

      <StatusBar />
    </>
  );
}
