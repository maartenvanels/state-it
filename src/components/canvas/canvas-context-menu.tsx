'use client';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Plus, StickyNote, Clipboard } from 'lucide-react';
import { useCanvasStore } from '@/lib/store/canvas-store';
import { useUIStore } from '@/lib/store/ui-store';
import { useReactFlow } from '@xyflow/react';
import { snapToGrid } from '@/lib/utils/geometry';
import { useCallback, useRef } from 'react';

export function CanvasContextMenu({
  children,
}: {
  children: React.ReactNode;
}) {
  const addStateNode = useCanvasStore((s) => s.addStateNode);
  const addAnnotationNode = useCanvasStore((s) => s.addAnnotationNode);
  const setSelection = useUIStore((s) => s.setSelection);
  const { screenToFlowPosition } = useReactFlow();
  const contextPosition = useRef({ x: 0, y: 0 });

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      contextPosition.current = { x: e.clientX, y: e.clientY };
    },
    []
  );

  const handleAddState = useCallback(() => {
    const position = screenToFlowPosition(contextPosition.current);
    const snapped = snapToGrid(position);
    const newId = addStateNode(null, snapped);
    setSelection([newId], []);
  }, [screenToFlowPosition, addStateNode, setSelection]);

  const handleAddAnnotation = useCallback(() => {
    const position = screenToFlowPosition(contextPosition.current);
    const snapped = snapToGrid(position);
    const newId = addAnnotationNode(snapped);
    setSelection([newId], []);
  }, [screenToFlowPosition, addAnnotationNode, setSelection]);

  return (
    <ContextMenu>
      <ContextMenuTrigger onContextMenu={handleContextMenu} asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={handleAddState}>
          <Plus className="mr-2 h-4 w-4" />
          Add State
        </ContextMenuItem>
        <ContextMenuItem onClick={handleAddAnnotation}>
          <StickyNote className="mr-2 h-4 w-4" />
          Add Annotation
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem disabled>
          <Clipboard className="mr-2 h-4 w-4" />
          Paste
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
