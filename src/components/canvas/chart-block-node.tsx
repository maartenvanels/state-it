'use client';

import { memo, useMemo } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { ChartBlockNodeData } from '@/lib/types/canvas';
import { useNavigationStore } from '@/lib/store/navigation-store';
import { useProjectStore } from '@/lib/store/project-store';
import { useSystemSimulationStore } from '@/lib/store/system-simulation-store';
import { cn } from '@/lib/utils';

type ChartBlockNodeType = Node<ChartBlockNodeData, 'chartBlock'>;

function ChartBlockNodeComponent({
  id,
  data,
  selected,
}: NodeProps<ChartBlockNodeType>) {
  const navigateToChart = useNavigationStore((s) => s.navigateToChart);
  const isSimActive = useSystemSimulationStore((s) => s.isActive);
  const activeStateId = useSystemSimulationStore(
    (s) => s.chartActiveStates[id]
  );
  const chart = useProjectStore((s) =>
    s.currentProject?.charts.find((c) => c.id === data.chartId)
  );

  const activeStateName = useMemo(() => {
    if (!activeStateId || !chart) return null;
    const state = chart.states.find((s) => s.id === activeStateId);
    return state?.name ?? null;
  }, [activeStateId, chart]);

  const inputPorts = data.ports.filter((p) => p.direction === 'input');
  const outputPorts = data.ports.filter((p) => p.direction === 'output');

  return (
    <>
      <NodeResizer
        isVisible={!!selected}
        minWidth={160}
        minHeight={80}
        lineClassName="!border-primary/50"
        handleClassName="!w-2 !h-2 !bg-primary !border-primary"
      />

      <div
        className={cn(
          'flex flex-col h-full border-2 rounded-lg bg-background shadow-sm overflow-hidden',
          isSimActive
            ? 'border-blue-400 ring-1 ring-blue-400/30'
            : selected
              ? 'border-primary'
              : 'border-border'
        )}
        onDoubleClick={() => navigateToChart(data.chartId)}
      >
        {/* Header bar */}
        <div className="bg-primary/10 border-b px-3 py-1.5 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
          <span className="text-xs font-semibold truncate">{data.chartName}</span>
        </div>

        {/* Ports area */}
        <div className="flex-1 flex justify-between px-2 py-1 min-h-[32px]">
          {/* Input ports (left) */}
          <div className="flex flex-col gap-1 justify-center">
            {inputPorts.map((port) => (
              <div key={port.id} className="flex items-center gap-1">
                <span className="text-[9px] text-muted-foreground font-mono">
                  {port.name}
                </span>
              </div>
            ))}
          </div>

          {/* Output ports (right) */}
          <div className="flex flex-col gap-1 justify-center items-end">
            {outputPorts.map((port) => (
              <div key={port.id} className="flex items-center gap-1">
                <span className="text-[9px] text-muted-foreground font-mono">
                  {port.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Empty state hint */}
        {inputPorts.length === 0 && outputPorts.length === 0 && !isSimActive && (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-[10px] text-muted-foreground/50">
              Double-click to edit
            </span>
          </div>
        )}

        {/* Active state during simulation */}
        {isSimActive && activeStateName && (
          <div className="border-t px-2 py-1 text-center">
            <span className="text-[10px] text-blue-500 font-mono font-semibold">
              {activeStateName}
            </span>
          </div>
        )}
      </div>

      {/* Input port handles (left side) */}
      {inputPorts.map((port, idx) => (
        <Handle
          key={`in-${port.id}`}
          id={`in-${port.id}`}
          type="target"
          position={Position.Left}
          style={{
            top: `${((idx + 1) / (inputPorts.length + 1)) * 100}%`,
            width: 8,
            height: 8,
            background: '#3b82f6',
            border: '2px solid white',
          }}
        />
      ))}

      {/* Output port handles (right side) */}
      {outputPorts.map((port, idx) => (
        <Handle
          key={`out-${port.id}`}
          id={`out-${port.id}`}
          type="source"
          position={Position.Right}
          style={{
            top: `${((idx + 1) / (outputPorts.length + 1)) * 100}%`,
            width: 8,
            height: 8,
            background: '#f97316',
            border: '2px solid white',
          }}
        />
      ))}

      {/* Default handles for wiring when no ports defined */}
      {inputPorts.length === 0 && (
        <Handle
          id="default-target"
          type="target"
          position={Position.Left}
          style={{
            top: '50%',
            width: 8,
            height: 8,
            background: '#3b82f6',
            border: '2px solid white',
          }}
        />
      )}
      {outputPorts.length === 0 && (
        <Handle
          id="default-source"
          type="source"
          position={Position.Right}
          style={{
            top: '50%',
            width: 8,
            height: 8,
            background: '#f97316',
            border: '2px solid white',
          }}
        />
      )}
    </>
  );
}

export const ChartBlockNode = memo(ChartBlockNodeComponent);
