'use client';

import { useCallback, useRef, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  ConnectionMode,
  SelectionMode,
  useReactFlow,
  type Connection,
  type NodeMouseHandler,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useCanvasStore } from '@/lib/store/canvas-store';
import { useUIStore } from '@/lib/store/ui-store';
import { useProjectStore } from '@/lib/store/project-store';
import { useNavigationStore } from '@/lib/store/navigation-store';
import { StateNode } from './state-node';
import { TransitionEdge } from './transition-edge';
import { DefaultTransitionNode } from './default-transition-node';
import { AnnotationNode } from './annotation-node';
import { ChartBlockNode } from './chart-block-node';
import { SourceBlockNode } from './source-block-node';
import { SinkBlockNode } from './sink-block-node';
import { SystemWireEdge } from './system-wire-edge';
import { CanvasContextMenu } from './canvas-context-menu';
import type { TransitionEdge as TransitionEdgeType, CanvasNode } from '@/lib/types/canvas';
import { snapToGrid, isDescendantOf, getNodeSize } from '@/lib/utils/geometry';
import { SimulationToolbar } from './simulation-toolbar';
import { SystemSimulationToolbar } from './system-simulation-toolbar';
import { generateId } from '@/lib/utils/id-generator';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nodeTypes: Record<string, any> = {
  stateNode: StateNode,
  defaultTransition: DefaultTransitionNode,
  annotationNode: AnnotationNode,
  chartBlock: ChartBlockNode,
  sourceBlock: SourceBlockNode,
  sinkBlock: SinkBlockNode,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const edgeTypes: Record<string, any> = {
  transition: TransitionEdge,
  systemWire: SystemWireEdge,
};

const chartEdgeOptions = {
  type: 'transition',
};

const systemEdgeOptions = {
  type: 'systemWire',
};

export function StateCanvas() {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const onNodesChange = useCanvasStore((s) => s.onNodesChange);
  const onEdgesChange = useCanvasStore((s) => s.onEdgesChange);
  const onConnect = useCanvasStore((s) => s.onConnect);
  const onReconnect = useCanvasStore((s) => s.onReconnect);
  const addStateNode = useCanvasStore((s) => s.addStateNode);
  const removeNodes = useCanvasStore((s) => s.removeNodes);
  const removeEdges = useCanvasStore((s) => s.removeEdges);
  const setViewport = useCanvasStore((s) => s.setViewport);
  const nestNode = useCanvasStore((s) => s.nestNode);
  const unnestNode = useCanvasStore((s) => s.unnestNode);

  const interactionMode = useUIStore((s) => s.interactionMode);
  const setInteractionMode = useUIStore((s) => s.setInteractionMode);
  const setSelection = useUIStore((s) => s.setSelection);
  const selectedNodeIds = useUIStore((s) => s.selectedNodeIds);
  const selectedEdgeIds = useUIStore((s) => s.selectedEdgeIds);
  const setDragHighlights = useUIStore((s) => s.setDragHighlights);
  const clearDragHighlights = useUIStore((s) => s.clearDragHighlights);
  const setIsConnecting = useUIStore((s) => s.setIsConnecting);

  const activeView = useNavigationStore((s) => s.activeView);
  const isSystemView = activeView.type === 'system';

  const settings = useProjectStore((s) => s.currentProject?.settings);
  const gridSize = settings?.gridSize ?? 20;
  const showGrid = settings?.showGrid ?? true;
  const snapEnabled = settings?.snapToGrid ?? true;

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, zoomIn, zoomOut, fitView, getIntersectingNodes } = useReactFlow();

  const handlePaneClick = useCallback(
    (event: React.MouseEvent) => {
      if (!isSystemView && interactionMode === 'addState') {
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
        const snapped = snapEnabled
          ? snapToGrid(position, gridSize)
          : position;
        const newId = addStateNode(null, snapped);
        setSelection([newId], []);
        setInteractionMode('select');
      } else {
        setSelection([], []);
      }
    },
    [
      interactionMode,
      isSystemView,
      screenToFlowPosition,
      snapEnabled,
      gridSize,
      addStateNode,
      setSelection,
      setInteractionMode,
    ]
  );

  const handleSelectionChange = useCallback(
    ({
      nodes: selectedNodes,
      edges: selectedEdges,
    }: {
      nodes: { id: string }[];
      edges: { id: string }[];
    }) => {
      setSelection(
        selectedNodes.map((n) => n.id),
        selectedEdges.map((e) => e.id)
      );
    },
    [setSelection]
  );

  // Track the current drop target during drag
  const dropTargetRef = useRef<string | null>(null);

  const handleNodeDrag: NodeMouseHandler = useCallback(
    (_event, draggedNode) => {
      if (draggedNode.type !== 'stateNode') return;

      // Skip nesting logic when multiple nodes are selected
      if (selectedNodeIds.length > 1) {
        clearDragHighlights();
        return;
      }

      const intersecting = getIntersectingNodes(draggedNode as Node);
      const draggedSize = getNodeSize(draggedNode as CanvasNode);

      // Find valid parent candidates (larger stateNodes, not descendants)
      const validParents = intersecting.filter((n) => {
        if (n.type !== 'stateNode') return false;
        if (n.id === draggedNode.id) return false;
        // Can't nest into own descendant
        if (isDescendantOf(n.id, draggedNode.id, nodes)) return false;
        // Must be larger than the dragged node
        const nSize = getNodeSize(n as CanvasNode);
        return nSize.width > draggedSize.width && nSize.height > draggedSize.height;
      });

      // Pick the smallest valid parent (most deeply nested)
      const bestParent =
        validParents.length > 0
          ? validParents.reduce((best, curr) => {
              const bSize = getNodeSize(best as CanvasNode);
              const cSize = getNodeSize(curr as CanvasNode);
              return cSize.width * cSize.height < bSize.width * bSize.height
                ? curr
                : best;
            })
          : null;

      // Detect sibling collisions
      const currentParentId = bestParent?.id ?? draggedNode.parentId ?? null;
      const collidingIds: string[] = [];
      const siblings = intersecting.filter((n) => {
        if (n.type !== 'stateNode') return false;
        if (n.id === draggedNode.id) return false;
        if (n.id === bestParent?.id) return false;
        // Same parent = siblings
        return (n.parentId ?? null) === currentParentId;
      });
      for (const sibling of siblings) {
        collidingIds.push(sibling.id);
      }
      if (collidingIds.length > 0) {
        collidingIds.push(draggedNode.id);
      }

      dropTargetRef.current = bestParent?.id ?? null;
      setDragHighlights(bestParent?.id ?? null, collidingIds);
    },
    [nodes, getIntersectingNodes, setDragHighlights, selectedNodeIds, clearDragHighlights]
  );

  const handleNodeDragStop: NodeMouseHandler = useCallback(
    (_event, draggedNode) => {
      const targetId = dropTargetRef.current;
      clearDragHighlights();
      dropTargetRef.current = null;

      // Skip nesting logic when multiple nodes are dragged
      if (selectedNodeIds.length > 1) {
        useProjectStore.getState().markDirty();
        return;
      }

      if (draggedNode.type !== 'stateNode') {
        useProjectStore.getState().markDirty();
        return;
      }

      const currentParentId = draggedNode.parentId ?? null;

      if (targetId && targetId !== currentParentId) {
        // Nest into new parent
        nestNode(draggedNode.id, targetId);
      } else if (!targetId && currentParentId) {
        // Dragged out of parent — unnest
        unnestNode(draggedNode.id);
      }

      useProjectStore.getState().markDirty();
    },
    [nestNode, unnestNode, clearDragHighlights, selectedNodeIds]
  );

  const handleConnectStart = useCallback(() => {
    setIsConnecting(true);
  }, [setIsConnecting]);

  const handleConnectEnd = useCallback(() => {
    setIsConnecting(false);
  }, [setIsConnecting]);

  // System view: handle onConnect by adding system wire
  const handleSystemConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      const wireId = generateId();
      useProjectStore.getState().addSystemWire({
        sourceBlockId: connection.source,
        sourcePortId: connection.sourceHandle ?? '',
        targetBlockId: connection.target,
        targetPortId: connection.targetHandle ?? '',
      });
      // Also add the edge to the canvas for immediate display
      const newEdge = {
        id: `wire-${wireId}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        type: 'systemWire',
        data: { wireId },
      };
      useCanvasStore.getState().setEdges([
        ...useCanvasStore.getState().edges,
        newEdge as unknown as TransitionEdgeType,
      ]);
    },
    []
  );

  const isValidConnection = useCallback(
    (connection: Connection | TransitionEdgeType) => {
      const source = 'source' in connection ? connection.source : null;
      const target = 'target' in connection ? connection.target : null;
      if (!source || !target) return false;
      if (source === target) return false;
      const targetNode = nodes.find((n) => n.id === target);
      if (!targetNode) return false;
      if (isSystemView) {
        // System view: target must be a block with an input handle
        return targetNode.type === 'chartBlock' || targetNode.type === 'sinkBlock';
      }
      if (targetNode.type !== 'stateNode') return false;
      return true;
    },
    [nodes, isSystemView]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if typing in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Delete selected items
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (isSystemView) {
          // System view: remove blocks + wires from project store
          if (selectedNodeIds.length > 0) {
            for (const nodeId of selectedNodeIds) {
              const node = nodes.find((n) => n.id === nodeId);
              if (node?.type === 'chartBlock') {
                // Find the chart block's chartId and remove the chart
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const chartId = (node.data as any)?.chartId;
                if (chartId) useProjectStore.getState().removeChart(chartId);
              } else {
                useProjectStore.getState().removeSystemBlock(nodeId);
              }
            }
            removeNodes(selectedNodeIds);
          }
          if (selectedEdgeIds.length > 0) {
            // Extract wire IDs from edge data
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
            removeEdges(selectedEdgeIds);
          }
          setSelection([], []);
        } else {
          if (selectedNodeIds.length > 0) {
            removeNodes(selectedNodeIds);
            setSelection([], []);
          }
          if (selectedEdgeIds.length > 0) {
            removeEdges(selectedEdgeIds);
            setSelection([], []);
          }
        }
      }

      // V = select mode
      if (e.key === 'v' || e.key === 'V') {
        setInteractionMode('select');
      }

      // S = add state mode (chart view only)
      if (e.key === 's' && !e.ctrlKey && !e.metaKey && !isSystemView) {
        setInteractionMode('addState');
      }

      // Escape = back to select mode, deselect
      if (e.key === 'Escape') {
        setInteractionMode('select');
        setSelection([], []);
      }

      // Ctrl+Z = undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useCanvasStore.temporal.getState().undo();
      }

      // Ctrl+Y or Ctrl+Shift+Z = redo
      if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
      ) {
        e.preventDefault();
        useCanvasStore.temporal.getState().redo();
      }

      // Ctrl+A = select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        const allNodes = useCanvasStore.getState().nodes;
        const allEdges = useCanvasStore.getState().edges;
        setSelection(
          allNodes.map((n) => n.id),
          allEdges.map((e) => e.id)
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedNodeIds,
    selectedEdgeIds,
    removeNodes,
    removeEdges,
    setSelection,
    setInteractionMode,
    isSystemView,
    nodes,
    edges,
  ]);

  // Wire zoom buttons
  useEffect(() => {
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const fitViewBtn = document.getElementById('fit-view-btn');

    const handleZoomIn = () => zoomIn();
    const handleZoomOut = () => zoomOut();
    const handleFitView = () => fitView({ padding: 0.2 });

    zoomInBtn?.addEventListener('click', handleZoomIn);
    zoomOutBtn?.addEventListener('click', handleZoomOut);
    fitViewBtn?.addEventListener('click', handleFitView);

    return () => {
      zoomInBtn?.removeEventListener('click', handleZoomIn);
      zoomOutBtn?.removeEventListener('click', handleZoomOut);
      fitViewBtn?.removeEventListener('click', handleFitView);
    };
  }, [zoomIn, zoomOut, fitView]);

  const isSelectMode = interactionMode === 'select';
  const cursorClass =
    interactionMode === 'addState' ? 'cursor-crosshair' : '';

  const svgDefs = useMemo(
    () => (
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="10"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path
              d="M 0 0 L 10 5 L 0 10 z"
              fill="var(--foreground)"
            />
          </marker>
        </defs>
      </svg>
    ),
    []
  );

  return (
    <CanvasContextMenu>
      <div ref={reactFlowWrapper} className={`h-full w-full ${cursorClass} relative`}>
        {svgDefs}
        {!isSystemView && <SimulationToolbar />}
        {isSystemView && <SystemSimulationToolbar />}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={isSystemView ? handleSystemConnect : onConnect}
          onReconnect={isSystemView ? undefined : onReconnect}
          onReconnectStart={handleConnectStart}
          onReconnectEnd={handleConnectEnd}
          onConnectStart={handleConnectStart}
          onConnectEnd={handleConnectEnd}
          onPaneClick={handlePaneClick}
          onSelectionChange={handleSelectionChange}
          onNodeDrag={handleNodeDrag}
          onNodeDragStop={handleNodeDragStop}
          onViewportChange={setViewport}
          isValidConnection={isValidConnection}
          connectionMode={ConnectionMode.Loose}
          connectionRadius={40}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={isSystemView ? systemEdgeOptions : chartEdgeOptions}
          snapToGrid={snapEnabled}
          snapGrid={[gridSize, gridSize]}
          fitView
          selectNodesOnDrag={false}
          selectionOnDrag={isSelectMode}
          panOnDrag={isSelectMode ? [1, 2] : true}
          selectionMode={SelectionMode.Partial}
          nodeDragThreshold={2}
          deleteKeyCode={null}
          zIndexMode="auto"
          elevateNodesOnSelect={false}
          proOptions={{ hideAttribution: true }}
        >
          {showGrid && (
            <Background
              variant={BackgroundVariant.Dots}
              gap={gridSize}
              size={1.5}
              color="color-mix(in oklch, var(--muted-foreground) 50%, transparent)"
            />
          )}
          <Controls
            showInteractive={false}
            className="!bg-background !border-border !shadow-sm [&>button]:!bg-background [&>button]:!border-border [&>button]:!text-foreground"
          />
          <MiniMap
            className="!bg-background !border-border"
            nodeColor={(node) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const data = node.data as any;
              if (node.type === 'stateNode' && data?.stateBlock?.color) {
                return data.stateBlock.color;
              }
              if (node.type === 'annotationNode') {
                return data?.color ?? '#fef08a';
              }
              if (node.type === 'chartBlock') {
                return 'var(--primary)';
              }
              if (node.type === 'sourceBlock') {
                return '#10b981'; // emerald
              }
              if (node.type === 'sinkBlock') {
                return '#8b5cf6'; // violet
              }
              return 'var(--muted)';
            }}
            maskColor="color-mix(in oklch, var(--background) 70%, transparent)"
            pannable
            zoomable
          />
        </ReactFlow>
      </div>
    </CanvasContextMenu>
  );
}
