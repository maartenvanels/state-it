'use client';

import { memo, useState, useCallback } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { StateNodeData } from '@/lib/types/canvas';
import { useCanvasStore } from '@/lib/store/canvas-store';
import { useUIStore } from '@/lib/store/ui-store';
import { useSimulationStore } from '@/lib/store/simulation-store';
import { MIN_STATE_WIDTH, MIN_STATE_HEIGHT } from '@/lib/utils/constants';
import { cn } from '@/lib/utils';
import { NodeContextMenu } from './node-context-menu';

const HANDLES = [
  // Top side – 5 points
  { id: 'top-1', position: Position.Top, style: { left: '10%' } },
  { id: 'top-2', position: Position.Top, style: { left: '25%' } },
  { id: 'top-3', position: Position.Top, style: { left: '50%' } },
  { id: 'top-4', position: Position.Top, style: { left: '75%' } },
  { id: 'top-5', position: Position.Top, style: { left: '90%' } },
  // Right side – 5 points
  { id: 'right-1', position: Position.Right, style: { top: '10%' } },
  { id: 'right-2', position: Position.Right, style: { top: '25%' } },
  { id: 'right-3', position: Position.Right, style: { top: '50%' } },
  { id: 'right-4', position: Position.Right, style: { top: '75%' } },
  { id: 'right-5', position: Position.Right, style: { top: '90%' } },
  // Bottom side – 5 points
  { id: 'bottom-1', position: Position.Bottom, style: { left: '90%' } },
  { id: 'bottom-2', position: Position.Bottom, style: { left: '75%' } },
  { id: 'bottom-3', position: Position.Bottom, style: { left: '50%' } },
  { id: 'bottom-4', position: Position.Bottom, style: { left: '25%' } },
  { id: 'bottom-5', position: Position.Bottom, style: { left: '10%' } },
  // Left side – 5 points
  { id: 'left-1', position: Position.Left, style: { top: '90%' } },
  { id: 'left-2', position: Position.Left, style: { top: '75%' } },
  { id: 'left-3', position: Position.Left, style: { top: '50%' } },
  { id: 'left-4', position: Position.Left, style: { top: '25%' } },
  { id: 'left-5', position: Position.Left, style: { top: '10%' } },
];

type StateNodeType = Node<StateNodeData, 'stateNode'>;

function StateNodeComponent({ id, data, selected }: NodeProps<StateNodeType>) {
  const { stateBlock } = data;
  const isDropTarget = useUIStore((s) => s.dropTargetNodeId === id);
  const isHighlighted = useUIStore((s) => s.collidingNodeIds.includes(id));
  const isConnecting = useUIStore((s) => s.isConnecting);
  const isSimActive = useSimulationStore((s) => s.isActive);
  const isActiveState = useSimulationStore((s) => s.activeStateId === id);
  const resizeNode = useCanvasStore((s) => s.resizeNode);
  const updateStateNodeData = useCanvasStore((s) => s.updateStateNodeData);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(stateBlock.name);
  const [isHovered, setIsHovered] = useState(false);

  const handleResize = useCallback(
    (_: unknown, params: { width: number; height: number }) => {
      resizeNode(id, { width: params.width, height: params.height });
    },
    [id, resizeNode]
  );

  const handleDoubleClick = useCallback(() => {
    setEditName(stateBlock.name);
    setIsEditing(true);
  }, [stateBlock.name]);

  const handleNameSubmit = useCallback(() => {
    setIsEditing(false);
    if (editName.trim() && editName !== stateBlock.name) {
      updateStateNodeData(id, {
        stateBlock: { ...stateBlock, name: editName.trim() },
      });
    }
  }, [editName, stateBlock, id, updateStateNodeData]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleNameSubmit();
      } else if (e.key === 'Escape') {
        setIsEditing(false);
        setEditName(stateBlock.name);
      }
    },
    [handleNameSubmit, stateBlock.name]
  );

  const isParallel = stateBlock.decomposition === 'parallel';
  const customColor = stateBlock.color;
  const hasActions =
    stateBlock.actions.entry.length > 0 ||
    stateBlock.actions.during.length > 0 ||
    stateBlock.actions.exit.length > 0;

  // Only apply custom color when no simulation/highlight overrides
  const useCustomColor = customColor && !isSimActive && !isHighlighted && !isDropTarget;

  return (
    <NodeContextMenu nodeId={id} hasParent={!!stateBlock.parentId}>
    <div
      className={cn(
        'relative h-full w-full rounded-lg border-2 bg-card text-card-foreground shadow-sm transition-colors',
        isParallel ? 'border-dashed' : 'border-solid',
        isSimActive && isActiveState &&
          'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]',
        isSimActive && !isActiveState &&
          'opacity-50',
        !isSimActive && selected && !useCustomColor && 'border-blue-500 ring-2 ring-blue-500/30',
        isHighlighted && 'border-red-500 bg-red-500/10 ring-2 ring-red-500/50',
        isDropTarget &&
          'border-green-500 border-dashed bg-green-500/10 ring-2 ring-green-500/50',
        !selected && !isHighlighted && !isDropTarget && !useCustomColor && 'border-border'
      )}
      style={useCustomColor ? {
        borderColor: selected ? customColor : `color-mix(in oklch, ${customColor} 60%, var(--border))`,
        backgroundColor: `color-mix(in oklch, ${customColor} 8%, var(--card))`,
        ...(selected ? { boxShadow: `0 0 0 3px color-mix(in oklch, ${customColor} 30%, transparent)` } : {}),
      } : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={MIN_STATE_WIDTH}
        minHeight={MIN_STATE_HEIGHT}
        onResize={handleResize}
        lineClassName="!border-blue-500"
        handleClassName="!w-2 !h-2 !bg-blue-500 !border-blue-500"
      />

      {/* Header */}
      <div
        className="drag-handle flex items-center px-3 py-1.5 border-b border-border/50 cursor-grab active:cursor-grabbing"
        onDoubleClick={handleDoubleClick}
      >
        {stateBlock.isDefault && (
          <div className="w-2.5 h-2.5 rounded-full bg-foreground mr-1.5 flex-shrink-0" />
        )}
        {isEditing ? (
          <input
            className="w-full bg-transparent text-sm font-semibold outline-none ring-1 ring-blue-500 rounded px-1"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        ) : (
          <span className="text-sm font-semibold truncate">
            {stateBlock.name}
          </span>
        )}
        {isParallel && (
          <span className="ml-auto text-[10px] text-muted-foreground">
            AND
          </span>
        )}
      </div>

      {/* Actions preview */}
      <div className="px-3 py-1.5 text-[10px] text-muted-foreground space-y-0.5 overflow-hidden">
        {hasActions ? (
          <>
            {stateBlock.actions.entry.map((a) => (
              <div key={a.id} className="truncate">
                <span className="text-blue-500/70">entry /</span> {a.code}
              </div>
            ))}
            {stateBlock.actions.during.map((a) => (
              <div key={a.id} className="truncate">
                <span className="text-green-500/70">during /</span> {a.code}
              </div>
            ))}
            {stateBlock.actions.exit.map((a) => (
              <div key={a.id} className="truncate">
                <span className="text-orange-500/70">exit /</span> {a.code}
              </div>
            ))}
          </>
        ) : (
          <div className="text-muted-foreground/50 italic">
            Double-click to edit
          </div>
        )}
      </div>

      {/* Handles */}
      {HANDLES.map((handle) => (
        <Handle
          key={handle.id}
          id={handle.id}
          type="source"
          position={handle.position}
          className="!transition-opacity !duration-150"
          style={{
            ...handle.style,
            width: 10,
            height: 10,
            background: isConnecting || selected ? '#3b82f6' : 'var(--border)',
            border: '2px solid var(--background)',
            opacity: isConnecting || isHovered || selected ? 1 : 0,
          }}
          isConnectable
          isConnectableEnd
        />
      ))}
    </div>
    </NodeContextMenu>
  );
}

export const StateNode = memo(StateNodeComponent);
