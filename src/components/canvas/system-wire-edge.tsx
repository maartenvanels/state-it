'use client';

import { memo } from 'react';
import { getBezierPath } from '@xyflow/react';
import type { EdgeProps, Edge } from '@xyflow/react';
import type { SystemWireEdgeData } from '@/lib/types/canvas';

type SystemWireEdgeType = Edge<SystemWireEdgeData>;

function SystemWireEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  markerEnd,
}: EdgeProps<SystemWireEdgeType>) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <path
      id={id}
      className="react-flow__edge-path"
      d={edgePath}
      style={{
        stroke: selected ? 'var(--primary)' : 'var(--foreground)',
        strokeWidth: selected ? 2.5 : 2,
        fill: 'none',
      }}
      markerEnd={markerEnd ?? 'url(#arrow)'}
    />
  );
}

export const SystemWireEdge = memo(SystemWireEdgeComponent);
