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
  ChevronDown,
  LayoutGrid,
  Hash,
  Activity,
  LineChart,
  Monitor,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  AlignHorizontalSpaceAround,
  AlignVerticalSpaceAround,
  FlipHorizontal,
  FlipVertical,
  RotateCw,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUIStore } from '@/lib/store/ui-store';
import { useCanvasStore } from '@/lib/store/canvas-store';
import { useProjectStore } from '@/lib/store/project-store';
import { useNavigationStore } from '@/lib/store/navigation-store';
import { deserializeSystemToCanvas } from '@/lib/persistence/serializer';
import type { SystemBlockType } from '@/lib/types/system';
import { getAllCategories, getBlocksByCategory } from '@/lib/blocks/registry';
import { CATEGORY_LABELS } from '@/lib/types/function-block';
import '@/lib/blocks';

export function Toolbar() {
  const interactionMode = useUIStore((s) => s.interactionMode);
  const setInteractionMode = useUIStore((s) => s.setInteractionMode);
  const selectedNodeIds = useUIStore((s) => s.selectedNodeIds);
  const nodes = useCanvasStore((s) => s.nodes);
  const addDefaultTransitionNode = useCanvasStore((s) => s.addDefaultTransitionNode);
  const alignNodes = useCanvasStore((s) => s.alignNodes);
  const distributeNodes = useCanvasStore((s) => s.distributeNodes);
  const flipNodes = useCanvasStore((s) => s.flipNodes);
  const rotateNodes = useCanvasStore((s) => s.rotateNodes);
  const activeView = useNavigationStore((s) => s.activeView);
  const isSystemView = activeView.type === 'system';
  const addChart = useProjectStore((s) => s.addChart);
  const addSystemBlock = useProjectStore((s) => s.addSystemBlock);
  const addFunctionBlock = useProjectStore((s) => s.addFunctionBlock);

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

  const reloadSystemCanvas = () => {
    const project = useProjectStore.getState().currentProject;
    if (!project) return;
    const { nodes: newNodes, edges: newEdges } = deserializeSystemToCanvas(project);
    useCanvasStore.getState().setNodes(newNodes);
    useCanvasStore.getState().setEdges(newEdges);
  };

  const handleAddChart = () => {
    const chartId = addChart(`Chart_${Date.now() % 1000}`);
    if (chartId) reloadSystemCanvas();
  };

  const handleAddBlock = (type: SystemBlockType, name: string) => {
    const blockCount = useProjectStore.getState().currentProject?.systemBlocks.filter(
      (b) => b.type === type
    ).length ?? 0;
    addSystemBlock(
      type,
      `${name}_${blockCount + 1}`,
      { x: 100 + blockCount * 200, y: 300 }
    );
    reloadSystemCanvas();
  };

  const handleAddFB = (defType: string, name: string) => {
    const blockCount = useProjectStore.getState().currentProject?.systemBlocks.filter(
      (b) => b.type === 'functionBlock'
    ).length ?? 0;
    addFunctionBlock(
      defType,
      `${name}_${blockCount + 1}`,
      { x: 100 + blockCount * 150, y: 400 }
    );
    reloadSystemCanvas();
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

      {isSystemView ? (
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1 px-2">
                  <Plus className="h-4 w-4" />
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Add Block</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={handleAddChart}>
              <LayoutGrid className="mr-2 h-4 w-4" />
              Chart
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleAddBlock('constant', 'Const')}>
              <Hash className="mr-2 h-4 w-4" />
              Constant
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddBlock('signalGenerator', 'SigGen')}>
              <Activity className="mr-2 h-4 w-4" />
              Signal Generator
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleAddBlock('scope', 'Scope')}>
              <LineChart className="mr-2 h-4 w-4" />
              Scope
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddBlock('display', 'Display')}>
              <Monitor className="mr-2 h-4 w-4" />
              Display
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {getAllCategories().map((cat) => (
              <DropdownMenuSub key={cat}>
                <DropdownMenuSubTrigger>
                  {CATEGORY_LABELS[cat]}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {getBlocksByCategory(cat).map((block) => (
                    <DropdownMenuItem
                      key={block.type}
                      onClick={() => handleAddFB(block.type, block.name)}
                    >
                      <span className="mr-2 w-5 text-center font-bold text-xs">{block.symbol}</span>
                      {block.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <>
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
        </>
      )}

      {selectedNodeIds.length >= 2 && (
        <>
          <Separator orientation="vertical" className="mx-1 h-6" />

          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 gap-1 px-2">
                    <AlignStartVertical className="h-4 w-4" />
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Align &amp; Transform</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => alignNodes(selectedNodeIds, 'left')}>
                <AlignStartVertical className="mr-2 h-4 w-4" /> Align Left
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => alignNodes(selectedNodeIds, 'center')}>
                <AlignCenterVertical className="mr-2 h-4 w-4" /> Align Center
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => alignNodes(selectedNodeIds, 'right')}>
                <AlignEndVertical className="mr-2 h-4 w-4" /> Align Right
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => alignNodes(selectedNodeIds, 'top')}>
                <AlignStartHorizontal className="mr-2 h-4 w-4" /> Align Top
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => alignNodes(selectedNodeIds, 'middle')}>
                <AlignCenterHorizontal className="mr-2 h-4 w-4" /> Align Middle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => alignNodes(selectedNodeIds, 'bottom')}>
                <AlignEndHorizontal className="mr-2 h-4 w-4" /> Align Bottom
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={selectedNodeIds.length < 3}
                onClick={() => distributeNodes(selectedNodeIds, 'horizontal')}
              >
                <AlignHorizontalSpaceAround className="mr-2 h-4 w-4" /> Distribute Horizontal
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={selectedNodeIds.length < 3}
                onClick={() => distributeNodes(selectedNodeIds, 'vertical')}
              >
                <AlignVerticalSpaceAround className="mr-2 h-4 w-4" /> Distribute Vertical
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => flipNodes(selectedNodeIds, 'horizontal')}>
                <FlipHorizontal className="mr-2 h-4 w-4" /> Flip Horizontal
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => flipNodes(selectedNodeIds, 'vertical')}>
                <FlipVertical className="mr-2 h-4 w-4" /> Flip Vertical
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => rotateNodes(selectedNodeIds, 'cw')}>
                <RotateCw className="mr-2 h-4 w-4" /> Rotate 90° CW
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => rotateNodes(selectedNodeIds, 'ccw')}>
                <RotateCcw className="mr-2 h-4 w-4" /> Rotate 90° CCW
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}

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
