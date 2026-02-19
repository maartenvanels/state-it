'use client';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Plus,
  StickyNote,
  Clipboard,
  Maximize2,
  BoxSelect,
  Trash2,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  AlignHorizontalSpaceAround,
  AlignVerticalSpaceAround,
  ArrowLeftRight,
  ArrowUpDown,
  Maximize,
  Group,
  AlignLeft,
  GalleryVerticalEnd,
} from 'lucide-react';
import { useCanvasStore } from '@/lib/store/canvas-store';
import { useUIStore } from '@/lib/store/ui-store';
import { useReactFlow } from '@xyflow/react';
import { snapToGrid } from '@/lib/utils/geometry';
import { useCallback, useRef } from 'react';
import type { AlignDirection, DistributeAxis, MatchDimension } from '@/lib/utils/geometry';

export function CanvasContextMenu({
  children,
}: {
  children: React.ReactNode;
}) {
  const addStateNode = useCanvasStore((s) => s.addStateNode);
  const addAnnotationNode = useCanvasStore((s) => s.addAnnotationNode);
  const removeNodes = useCanvasStore((s) => s.removeNodes);
  const alignNodes = useCanvasStore((s) => s.alignNodes);
  const distributeNodes = useCanvasStore((s) => s.distributeNodes);
  const matchNodeSizes = useCanvasStore((s) => s.matchNodeSizes);
  const groupNodesIntoState = useCanvasStore((s) => s.groupNodesIntoState);
  const nodes = useCanvasStore((s) => s.nodes);

  const selectedNodeIds = useUIStore((s) => s.selectedNodeIds);
  const selectedEdgeIds = useUIStore((s) => s.selectedEdgeIds);
  const setSelection = useUIStore((s) => s.setSelection);

  const { screenToFlowPosition, fitView } = useReactFlow();
  const contextPosition = useRef({ x: 0, y: 0 });

  const hasSelection = selectedNodeIds.length > 0 || selectedEdgeIds.length > 0;
  const hasMultiSelection = selectedNodeIds.length >= 2;
  const canDistribute = selectedNodeIds.length >= 3;

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

  const handleSelectAll = useCallback(() => {
    setSelection(
      nodes.map((n) => n.id),
      []
    );
  }, [nodes, setSelection]);

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2 });
  }, [fitView]);

  const handleDelete = useCallback(() => {
    if (selectedNodeIds.length > 0) {
      removeNodes(selectedNodeIds);
    }
    setSelection([], []);
  }, [selectedNodeIds, removeNodes, setSelection]);

  const handleAlign = useCallback(
    (direction: AlignDirection) => {
      alignNodes(selectedNodeIds, direction);
    },
    [selectedNodeIds, alignNodes]
  );

  const handleDistribute = useCallback(
    (axis: DistributeAxis) => {
      distributeNodes(selectedNodeIds, axis);
    },
    [selectedNodeIds, distributeNodes]
  );

  const handleMatchSize = useCallback(
    (dimension: MatchDimension) => {
      matchNodeSizes(selectedNodeIds, dimension);
    },
    [selectedNodeIds, matchNodeSizes]
  );

  const handleGroup = useCallback(() => {
    const groupId = groupNodesIntoState(selectedNodeIds);
    if (groupId) {
      setSelection([groupId], []);
    }
  }, [selectedNodeIds, groupNodesIntoState, setSelection]);

  return (
    <ContextMenu>
      <ContextMenuTrigger onContextMenu={handleContextMenu} asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        {/* -- Always visible -- */}
        <ContextMenuItem onClick={handleAddState}>
          <Plus className="mr-2 h-4 w-4" />
          Add State
        </ContextMenuItem>
        <ContextMenuItem onClick={handleAddAnnotation}>
          <StickyNote className="mr-2 h-4 w-4" />
          Add Annotation
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem onClick={handleSelectAll}>
          <BoxSelect className="mr-2 h-4 w-4" />
          Select All
        </ContextMenuItem>
        <ContextMenuItem onClick={handleFitView}>
          <Maximize2 className="mr-2 h-4 w-4" />
          Fit View
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem disabled>
          <Clipboard className="mr-2 h-4 w-4" />
          Paste
        </ContextMenuItem>

        {/* -- Multi-selection actions (≥2 nodes) -- */}
        {hasMultiSelection && (
          <>
            <ContextMenuSeparator />

            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <AlignLeft className="mr-2 h-4 w-4" />
                Align
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-48">
                <ContextMenuItem onClick={() => handleAlign('left')}>
                  <AlignStartVertical className="mr-2 h-4 w-4" />
                  Left
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleAlign('center')}>
                  <AlignCenterVertical className="mr-2 h-4 w-4" />
                  Center
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleAlign('right')}>
                  <AlignEndVertical className="mr-2 h-4 w-4" />
                  Right
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={() => handleAlign('top')}>
                  <AlignStartHorizontal className="mr-2 h-4 w-4" />
                  Top
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleAlign('middle')}>
                  <AlignCenterHorizontal className="mr-2 h-4 w-4" />
                  Middle
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleAlign('bottom')}>
                  <AlignEndHorizontal className="mr-2 h-4 w-4" />
                  Bottom
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>

            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <GalleryVerticalEnd className="mr-2 h-4 w-4" />
                Distribute
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-48">
                <ContextMenuItem
                  onClick={() => handleDistribute('horizontal')}
                  disabled={!canDistribute}
                >
                  <AlignHorizontalSpaceAround className="mr-2 h-4 w-4" />
                  Horizontal
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => handleDistribute('vertical')}
                  disabled={!canDistribute}
                >
                  <AlignVerticalSpaceAround className="mr-2 h-4 w-4" />
                  Vertical
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>

            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <Maximize className="mr-2 h-4 w-4" />
                Match Size
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-48">
                <ContextMenuItem onClick={() => handleMatchSize('width')}>
                  <ArrowLeftRight className="mr-2 h-4 w-4" />
                  Width
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleMatchSize('height')}>
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  Height
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleMatchSize('both')}>
                  <Maximize className="mr-2 h-4 w-4" />
                  Both
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>

            <ContextMenuSeparator />

            <ContextMenuItem onClick={handleGroup}>
              <Group className="mr-2 h-4 w-4" />
              Group into State
            </ContextMenuItem>
          </>
        )}

        {/* -- Selection actions (≥1 nodes) -- */}
        {hasSelection && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
