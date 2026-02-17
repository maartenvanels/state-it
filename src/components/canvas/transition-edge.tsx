'use client';

import { memo } from 'react';
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

  const labelText = data ? formatTransitionLabel(data.label) : '';
  const hasPriority = data && data.priority > 0;

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
        {/* Priority badge near the source */}
        {hasPriority && (
          <div
            className="absolute pointer-events-none"
            style={{
              transform: `translate(-50%, -50%) translate(${sourceX}px, ${sourceY}px)`,
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
        {/* Condition label at midpoint */}
        {labelText && (
          <div
            className={cn(
              'nodrag nopan pointer-events-auto absolute rounded border bg-background px-1.5 py-0.5 text-[10px] shadow-sm',
              selected ? 'border-blue-500' : 'border-border'
            )}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
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
