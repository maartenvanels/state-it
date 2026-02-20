'use client';

import { memo, useMemo, useRef, useCallback, useState, useEffect } from 'react';
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
  const hasPorts = inputPorts.length > 0 || outputPorts.length > 0;

  // Measure the port area to position handles precisely at port label centers
  const containerRef = useRef<HTMLDivElement>(null);
  const [portOffsets, setPortOffsets] = useState<Record<string, number>>({});

  const measurePorts = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const nodeEl = container.closest('.react-flow__node') as HTMLElement | null;
    if (!nodeEl) return;
    const nodeRect = nodeEl.getBoundingClientRect();
    const offsets: Record<string, number> = {};
    container.querySelectorAll<HTMLElement>('[data-port-id]').forEach((el) => {
      const r = el.getBoundingClientRect();
      const centerY = r.top + r.height / 2 - nodeRect.top;
      offsets[el.dataset.portId!] = (centerY / nodeRect.height) * 100;
    });
    setPortOffsets(offsets);
  }, []);

  // Re-measure when ports change or node is resized
  useEffect(() => {
    measurePorts();
    const container = containerRef.current;
    const nodeEl = container?.closest('.react-flow__node') as HTMLElement | null;
    if (!nodeEl) return;
    const ro = new ResizeObserver(measurePorts);
    ro.observe(nodeEl);
    return () => ro.disconnect();
  }, [measurePorts, inputPorts.length, outputPorts.length, isSimActive, activeStateName]);

  return (
    <>
      <NodeResizer
        isVisible={!!selected}
        minWidth={160}
        minHeight={80}
        lineClassName="!border-primary/50"
        handleClassName="!w-2 !h-2 !bg-primary !border-primary"
        onResize={measurePorts}
      />

      <div
        ref={containerRef}
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
        {hasPorts ? (
          <div className="flex-1 flex justify-between min-h-[32px]">
            {/* Input ports (left) */}
            <div className="flex flex-col justify-evenly py-0.5">
              {inputPorts.map((port) => (
                <div
                  key={port.id}
                  data-port-id={port.id}
                  className="flex items-center pl-3 pr-1"
                >
                  <span className="text-[9px] text-muted-foreground font-mono">
                    {port.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Output ports (right) */}
            <div className="flex flex-col justify-evenly py-0.5">
              {outputPorts.map((port) => (
                <div
                  key={port.id}
                  data-port-id={port.id}
                  className="flex items-center justify-end pr-3 pl-1"
                >
                  <span className="text-[9px] text-muted-foreground font-mono">
                    {port.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Empty state hint */
          !isSimActive && (
            <div className="flex-1 flex items-center justify-center">
              <span className="text-[10px] text-muted-foreground/50">
                Double-click to edit
              </span>
            </div>
          )
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

      {/* Input port handles — positioned to align with port labels */}
      {inputPorts.map((port) => (
        <Handle
          key={`in-${port.id}`}
          id={`in-${port.id}`}
          type="target"
          position={Position.Left}
          style={{
            top: `${portOffsets[port.id] ?? 50}%`,
            width: 8,
            height: 8,
            background: '#3b82f6',
            border: '2px solid white',
          }}
        />
      ))}

      {/* Output port handles — positioned to align with port labels */}
      {outputPorts.map((port) => (
        <Handle
          key={`out-${port.id}`}
          id={`out-${port.id}`}
          type="source"
          position={Position.Right}
          style={{
            top: `${portOffsets[port.id] ?? 50}%`,
            width: 8,
            height: 8,
            background: '#f97316',
            border: '2px solid white',
          }}
        />
      ))}
    </>
  );
}

export const ChartBlockNode = memo(ChartBlockNodeComponent);
