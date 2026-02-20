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
  Copy,
  CopyPlus,
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
  FlipHorizontal,
  FlipVertical,
  RotateCw,
  RotateCcw,
  LayoutGrid,
  Hash,
  Activity,
  LineChart,
  Monitor,
} from 'lucide-react';
import { useCanvasStore } from '@/lib/store/canvas-store';
import { useUIStore } from '@/lib/store/ui-store';
import { useProjectStore } from '@/lib/store/project-store';
import { useNavigationStore } from '@/lib/store/navigation-store';
import { useReactFlow } from '@xyflow/react';
import { snapToGrid } from '@/lib/utils/geometry';
import { useCallback, useRef } from 'react';
import type { AlignDirection, DistributeAxis, MatchDimension, FlipAxis, RotateDirection } from '@/lib/utils/geometry';
import { hasClipboard } from '@/lib/utils/clipboard';
import { deserializeSystemToCanvas } from '@/lib/persistence/serializer';
import type { SystemBlockType } from '@/lib/types/system';
import { getAllCategories, getBlocksByCategory } from '@/lib/blocks/registry';
import { CATEGORY_LABELS } from '@/lib/types/function-block';
import '@/lib/blocks';

export function CanvasContextMenu({
  children,
}: {
  children: React.ReactNode;
}) {
  const addStateNode = useCanvasStore((s) => s.addStateNode);
  const addAnnotationNode = useCanvasStore((s) => s.addAnnotationNode);
  const removeNodes = useCanvasStore((s) => s.removeNodes);
  const removeEdges = useCanvasStore((s) => s.removeEdges);
  const edges = useCanvasStore((s) => s.edges);
  const alignNodes = useCanvasStore((s) => s.alignNodes);
  const distributeNodes = useCanvasStore((s) => s.distributeNodes);
  const matchNodeSizes = useCanvasStore((s) => s.matchNodeSizes);
  const groupNodesIntoState = useCanvasStore((s) => s.groupNodesIntoState);
  const flipNodes = useCanvasStore((s) => s.flipNodes);
  const rotateNodes = useCanvasStore((s) => s.rotateNodes);
  const copySelectedNodes = useCanvasStore((s) => s.copySelectedNodes);
  const pasteNodes = useCanvasStore((s) => s.pasteNodes);
  const duplicateNodes = useCanvasStore((s) => s.duplicateNodes);
  const nodes = useCanvasStore((s) => s.nodes);

  const selectedNodeIds = useUIStore((s) => s.selectedNodeIds);
  const selectedEdgeIds = useUIStore((s) => s.selectedEdgeIds);
  const setSelection = useUIStore((s) => s.setSelection);

  const activeView = useNavigationStore((s) => s.activeView);
  const isSystemView = activeView.type === 'system';

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

  // ─── Chart view handlers ─────────────────────────────────

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

  // ─── System view handlers ────────────────────────────────

  const reloadSystemCanvas = useCallback(() => {
    const project = useProjectStore.getState().currentProject;
    if (!project) return;
    const { nodes: newNodes, edges: newEdges } = deserializeSystemToCanvas(project);
    useCanvasStore.getState().setNodes(newNodes);
    useCanvasStore.getState().setEdges(newEdges);
  }, []);

  const handleAddChart = useCallback(() => {
    const addChart = useProjectStore.getState().addChart;
    addChart(`Chart_${Date.now() % 1000}`);
    reloadSystemCanvas();
  }, [reloadSystemCanvas]);

  const handleAddSystemBlock = useCallback(
    (type: SystemBlockType, baseName: string) => {
      const store = useProjectStore.getState();
      const blockCount = store.currentProject?.systemBlocks.filter(
        (b) => b.type === type
      ).length ?? 0;
      const position = screenToFlowPosition(contextPosition.current);
      store.addSystemBlock(type, `${baseName}_${blockCount + 1}`, position);
      reloadSystemCanvas();
    },
    [screenToFlowPosition, reloadSystemCanvas]
  );

  const handleAddFunctionBlock = useCallback(
    (defType: string, name: string) => {
      const store = useProjectStore.getState();
      const blockCount = store.currentProject?.systemBlocks.filter(
        (b) => b.type === 'functionBlock'
      ).length ?? 0;
      const position = screenToFlowPosition(contextPosition.current);
      store.addFunctionBlock(defType, `${name}_${blockCount + 1}`, position);
      reloadSystemCanvas();
    },
    [screenToFlowPosition, reloadSystemCanvas]
  );

  // ─── Shared handlers ─────────────────────────────────────

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
      if (isSystemView) {
        for (const nodeId of selectedNodeIds) {
          const node = nodes.find((n) => n.id === nodeId);
          if (node?.type === 'chartBlock') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const chartId = (node.data as any)?.chartId;
            if (chartId) useProjectStore.getState().removeChart(chartId);
          } else {
            useProjectStore.getState().removeSystemBlock(nodeId);
          }
        }
      }
      removeNodes(selectedNodeIds);
    }
    if (selectedEdgeIds.length > 0) {
      if (isSystemView) {
        const wireIds = selectedEdgeIds
          .map((edgeId) => {
            const edge = edges.find((e) => e.id === edgeId);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (edge?.data as any)?.wireId as string | undefined;
          })
          .filter(Boolean) as string[];
        if (wireIds.length > 0) {
          useProjectStore.getState().removeSystemWires(wireIds);
        }
      }
      removeEdges(selectedEdgeIds);
    }
    setSelection([], []);
  }, [selectedNodeIds, selectedEdgeIds, removeNodes, removeEdges, edges, nodes, isSystemView, setSelection]);

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

  const handleFlip = useCallback(
    (axis: FlipAxis) => {
      flipNodes(selectedNodeIds, axis);
    },
    [selectedNodeIds, flipNodes]
  );

  const handleRotate = useCallback(
    (direction: RotateDirection) => {
      rotateNodes(selectedNodeIds, direction);
    },
    [selectedNodeIds, rotateNodes]
  );

  const handleCopy = useCallback(() => {
    copySelectedNodes(selectedNodeIds);
  }, [selectedNodeIds, copySelectedNodes]);

  const handlePaste = useCallback(() => {
    const position = screenToFlowPosition(contextPosition.current);
    const newIds = pasteNodes(position);
    if (newIds.length > 0) {
      setSelection(newIds, []);
      useProjectStore.getState().markDirty();
    }
  }, [screenToFlowPosition, pasteNodes, setSelection]);

  const handleDuplicate = useCallback(() => {
    const newIds = duplicateNodes(selectedNodeIds);
    if (newIds.length > 0) {
      setSelection(newIds, []);
      useProjectStore.getState().markDirty();
    }
  }, [selectedNodeIds, duplicateNodes, setSelection]);

  return (
    <ContextMenu>
      <ContextMenuTrigger onContextMenu={handleContextMenu} asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        {isSystemView ? (
          <>
            {/* System view items */}
            <ContextMenuItem onClick={handleAddChart}>
              <LayoutGrid className="mr-2 h-4 w-4" />
              Add Chart
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => handleAddSystemBlock('constant', 'Const')}>
              <Hash className="mr-2 h-4 w-4" />
              Add Constant
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleAddSystemBlock('signalGenerator', 'SigGen')}>
              <Activity className="mr-2 h-4 w-4" />
              Add Signal Generator
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => handleAddSystemBlock('scope', 'Scope')}>
              <LineChart className="mr-2 h-4 w-4" />
              Add Scope
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleAddSystemBlock('display', 'Display')}>
              <Monitor className="mr-2 h-4 w-4" />
              Add Display
            </ContextMenuItem>
            <ContextMenuSeparator />
            {getAllCategories().map((cat) => (
              <ContextMenuSub key={cat}>
                <ContextMenuSubTrigger>
                  {CATEGORY_LABELS[cat]}
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-48">
                  {getBlocksByCategory(cat).map((block) => (
                    <ContextMenuItem
                      key={block.type}
                      onClick={() => handleAddFunctionBlock(block.type, block.name)}
                    >
                      <span className="mr-2 w-5 text-center font-bold text-xs">{block.symbol}</span>
                      {block.name}
                    </ContextMenuItem>
                  ))}
                </ContextMenuSubContent>
              </ContextMenuSub>
            ))}
          </>
        ) : (
          <>
            {/* Chart view items */}
            <ContextMenuItem onClick={handleAddState}>
              <Plus className="mr-2 h-4 w-4" />
              Add State
            </ContextMenuItem>
            <ContextMenuItem onClick={handleAddAnnotation}>
              <StickyNote className="mr-2 h-4 w-4" />
              Add Annotation
            </ContextMenuItem>
          </>
        )}

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

        {hasSelection && (
          <>
            <ContextMenuItem onClick={handleCopy}>
              <Copy className="mr-2 h-4 w-4" />
              Copy
              <span className="ml-auto text-xs text-muted-foreground">Ctrl+C</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={handleDuplicate}>
              <CopyPlus className="mr-2 h-4 w-4" />
              Duplicate
              <span className="ml-auto text-xs text-muted-foreground">Ctrl+D</span>
            </ContextMenuItem>
          </>
        )}
        <ContextMenuItem disabled={!hasClipboard()} onClick={handlePaste}>
          <Clipboard className="mr-2 h-4 w-4" />
          Paste
          <span className="ml-auto text-xs text-muted-foreground">Ctrl+V</span>
        </ContextMenuItem>

        {/* -- Multi-selection actions (chart view only, ≥2 nodes) -- */}
        {!isSystemView && hasMultiSelection && (
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

            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <FlipHorizontal className="mr-2 h-4 w-4" />
                Flip
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-48">
                <ContextMenuItem onClick={() => handleFlip('horizontal')}>
                  <FlipHorizontal className="mr-2 h-4 w-4" />
                  Horizontal
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleFlip('vertical')}>
                  <FlipVertical className="mr-2 h-4 w-4" />
                  Vertical
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>

            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <RotateCw className="mr-2 h-4 w-4" />
                Rotate
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-48">
                <ContextMenuItem onClick={() => handleRotate('cw')}>
                  <RotateCw className="mr-2 h-4 w-4" />
                  90° Clockwise
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleRotate('ccw')}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  90° Counter-clockwise
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
