'use client';

import { memo } from 'react';
import { getBezierPath } from '@xyflow/react';
import type { EdgeProps, Edge } from '@xyflow/react';
import type { SystemWireEdgeData } from '@/lib/types/canvas';
import { useSystemSimulationStore } from '@/lib/store/system-simulation-store';

type SystemWireEdgeType = Edge<SystemWireEdgeData>;

function SystemWireEdgeComponent({
  id,
  source,
  sourceHandleId,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  markerEnd,
}: EdgeProps<SystemWireEdgeType>) {
  const isSimActive = useSystemSimulationStore((s) => s.isActive);
  const wireValue = useSystemSimulationStore((s) => {
    if (!s.isActive || !sourceHandleId) return undefined;
    return s.portValues[source]?.[sourceHandleId];
  });

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        style={{
          stroke: isSimActive
            ? '#8b5cf6'
            : selected
              ? 'var(--primary)'
              : 'var(--foreground)',
          strokeWidth: selected ? 2.5 : 2,
          fill: 'none',
        }}
        markerEnd={markerEnd ?? 'url(#arrow)'}
      />
      {isSimActive && wireValue !== undefined && (
        <g>
          <rect
            x={midX - 18}
            y={midY - 18}
            width={36}
            height={14}
            rx={3}
            fill="var(--background)"
            stroke="var(--border)"
            strokeWidth={0.5}
            opacity={0.9}
          />
          <text
            x={midX}
            y={midY - 8}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[9px] fill-muted-foreground font-mono"
            style={{ fontSize: '9px' }}
          >
            {wireValue.toFixed(1)}
          </text>
        </g>
      )}
    </>
  );
}

export const SystemWireEdge = memo(SystemWireEdgeComponent);
