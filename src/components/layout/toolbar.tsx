'use client';

import {
  Plus,
  MousePointer2,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  CircleDot,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useUIStore } from '@/lib/store/ui-store';
import { useCanvasStore } from '@/lib/store/canvas-store';

export function Toolbar() {
  const interactionMode = useUIStore((s) => s.interactionMode);
  const setInteractionMode = useUIStore((s) => s.setInteractionMode);
  const selectedNodeIds = useUIStore((s) => s.selectedNodeIds);
  const nodes = useCanvasStore((s) => s.nodes);
  const addDefaultTransitionNode = useCanvasStore((s) => s.addDefaultTransitionNode);

  const selectedStateNode = selectedNodeIds.length === 1
    ? nodes.find((n) => n.id === selectedNodeIds[0] && n.type === 'stateNode')
    : undefined;

  const handleAddDefaultTransition = () => {
    if (!selectedStateNode) return;
    const nodeWidth = (selectedStateNode.style?.width as number) ?? 200;
    addDefaultTransitionNode(
      selectedStateNode.id,
      {
        x: selectedStateNode.position.x + nodeWidth / 2 - 8,
        y: selectedStateNode.position.y - 40,
      },
      selectedStateNode.parentId ?? null
    );
  };

  return (
    <div className="flex h-10 items-center gap-1 border-b bg-background px-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={interactionMode === 'select' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setInteractionMode('select')}
          >
            <MousePointer2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Select (V)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={interactionMode === 'addState' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setInteractionMode('addState')}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Add State (S)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={!selectedStateNode}
            onClick={handleAddDefaultTransition}
          >
            <CircleDot className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Add Default Transition</TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => useCanvasStore.temporal.getState().undo()}
          >
            <Undo2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => useCanvasStore.temporal.getState().redo()}
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" id="zoom-in-btn">
            <ZoomIn className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Zoom In</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" id="zoom-out-btn">
            <ZoomOut className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Zoom Out</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" id="fit-view-btn">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Fit View</TooltipContent>
      </Tooltip>
    </div>
  );
}
