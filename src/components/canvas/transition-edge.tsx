'use client';

import { memo, useCallback, useRef, useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
} from '@xyflow/react';
import type { EdgeProps, Edge } from '@xyflow/react';
import type { TransitionEdgeData } from '@/lib/types/canvas';

type TransitionEdgeType = Edge<TransitionEdgeData, 'transition'>;
import { formatTransitionLabel } from '@/lib/types/transition';
import { cn } from '@/lib/utils';
import { useCanvasStore } from '@/lib/store/canvas-store';

function TransitionEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  style = {},
}: EdgeProps<TransitionEdgeType>) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 8,
  });

  const updateTransitionEdge = useCanvasStore((s) => s.updateTransitionEdge);

  // Stored offset from data (persisted)
  const storedOffsetX = data?.labelOffsetX ?? 0;
  const storedOffsetY = data?.labelOffsetY ?? 0;

  // Local drag state
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{
    dragging: boolean;
    startMouseX: number;
    startMouseY: number;
  } | null>(null);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();
      dragRef.current = {
        dragging: true,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
      };

      const onMouseMove = (ev: MouseEvent) => {
        if (!dragRef.current?.dragging) return;
        const dx = ev.clientX - dragRef.current.startMouseX;
        const dy = ev.clientY - dragRef.current.startMouseY;
        setDragOffset({ x: dx, y: dy });
      };

      const onMouseUp = (ev: MouseEvent) => {
        if (!dragRef.current?.dragging) return;
        const dx = ev.clientX - dragRef.current.startMouseX;
        const dy = ev.clientY - dragRef.current.startMouseY;
        dragRef.current = null;
        setDragOffset({ x: 0, y: 0 });

        // Persist the new offset
        const newOffsetX = storedOffsetX + dx;
        const newOffsetY = storedOffsetY + dy;
        updateTransitionEdge(id, {
          labelOffsetX: newOffsetX,
          labelOffsetY: newOffsetY,
        });

        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [id, storedOffsetX, storedOffsetY, updateTransitionEdge]
  );

  const labelText = data ? formatTransitionLabel(data.label) : '';
  const hasPriority = data && data.priority > 0;

  // Priority badge: offset perpendicular to edge direction at source
  let badgeX = sourceX;
  let badgeY = sourceY;
  if (hasPriority) {
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    // Perpendicular unit vector (rotated 90 degrees)
    const perpX = -dy / len;
    const perpY = dx / len;
    const offset = 12;
    badgeX = sourceX + perpX * offset;
    badgeY = sourceY + perpY * offset;
  }

  // Final label position = React Flow midpoint + stored offset + drag offset
  const finalLabelX = labelX + storedOffsetX + dragOffset.x;
  const finalLabelY = labelY + storedOffsetY + dragOffset.y;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          stroke: selected ? '#3b82f6' : 'var(--foreground)',
          strokeWidth: selected ? 2 : 1.5,
        }}
        markerEnd="url(#arrow)"
      />
      <EdgeLabelRenderer>
        {/* Priority badge near the source, offset from line */}
        {hasPriority && (
          <div
            className="absolute pointer-events-none"
            style={{
              transform: `translate(-50%, -50%) translate(${badgeX}px, ${badgeY}px)`,
            }}
          >
            <div
              className={cn(
                'flex items-center justify-center w-4 h-4 rounded-full text-[8px] font-bold',
                selected
                  ? 'bg-blue-500 text-white'
                  : 'bg-muted text-muted-foreground border border-border'
              )}
            >
              {data.priority}
            </div>
          </div>
        )}
        {/* Condition label at midpoint (draggable) */}
        {labelText && (
          <div
            className={cn(
              'nodrag nopan pointer-events-auto absolute rounded border bg-background px-1.5 py-0.5 text-[10px] shadow-sm cursor-grab active:cursor-grabbing',
              selected ? 'border-blue-500' : 'border-border'
            )}
            style={{
              transform: `translate(-50%, -50%) translate(${finalLabelX}px, ${finalLabelY}px)`,
            }}
            onMouseDown={onMouseDown}
          >
            {data?.label.event && (
              <span className="font-semibold">{data.label.event}</span>
            )}
            {data?.label.condition && (
              <span className="text-blue-500">[{data.label.condition}]</span>
            )}
            {data?.label.conditionAction && (
              <span className="text-green-500">
                {'{'}
                {data.label.conditionAction}
                {'}'}
              </span>
            )}
            {data?.label.transitionAction && (
              <span className="text-orange-500">
                /{data.label.transitionAction}
              </span>
            )}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}

export const TransitionEdge = memo(TransitionEdgeComponent);
