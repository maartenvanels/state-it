'use client';

import { memo, useRef, useCallback, useState, useEffect } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { FunctionBlockNodeData } from '@/lib/types/canvas';
import { getBlockDef } from '@/lib/blocks/registry';
import { CATEGORY_COLOR_CLASSES } from '@/lib/types/function-block';
import { useSystemSimulationStore } from '@/lib/store/system-simulation-store';
import { cn } from '@/lib/utils';

type FunctionBlockNodeType = Node<FunctionBlockNodeData, 'functionBlock'>;

function FunctionBlockNodeComponent({
  id,
  data,
  selected,
}: NodeProps<FunctionBlockNodeType>) {
  const def = getBlockDef(data.defType);
  const isSimActive = useSystemSimulationStore((s) => s.isActive);
  const portValues = useSystemSimulationStore((s) =>
    s.isActive ? s.portValues[id] : undefined
  );

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

  useEffect(() => {
    measurePorts();
    const container = containerRef.current;
    const nodeEl = container?.closest('.react-flow__node') as HTMLElement | null;
    if (!nodeEl) return;
    const ro = new ResizeObserver(measurePorts);
    ro.observe(nodeEl);
    return () => ro.disconnect();
  }, [measurePorts, def?.inputs.length, def?.outputs.length, isSimActive]);

  if (!def) {
    return (
      <div className="border-2 border-destructive rounded-lg bg-background p-2 text-xs text-destructive">
        Unknown block: {data.defType}
      </div>
    );
  }

  const colors = CATEGORY_COLOR_CLASSES[def.category];
  const inputs = def.inputs;
  const outputs = def.outputs;

  // Build param display string
  const paramDisplay = def.params
    .map((p) => {
      const val = data.params[p.id] ?? p.defaultValue;
      return `${p.id}=${val}`;
    })
    .join(', ');

  // Get first output value for simulation display
  const simOutputValue = portValues && outputs.length > 0
    ? portValues[`out-${outputs[0].id}`]
    : undefined;

  return (
    <>
      <NodeResizer
        isVisible={!!selected}
        minWidth={80}
        minHeight={50}
        lineClassName="!border-primary/50"
        handleClassName="!w-2 !h-2 !bg-primary !border-primary"
        onResize={measurePorts}
      />

      <div
        ref={containerRef}
        className={cn(
          'flex flex-col h-full border-2 rounded-lg bg-background shadow-sm overflow-hidden',
          isSimActive
            ? `${colors.border} ring-1 ring-offset-0`
            : selected
              ? 'border-primary'
              : 'border-border'
        )}
        style={isSimActive ? { boxShadow: `0 0 0 1px var(--tw-ring-color, transparent)` } : undefined}
      >
        {/* Header bar with category color */}
        <div className={cn('border-b px-2 py-1 flex items-center gap-1.5', colors.headerBg)}>
          <span className={cn('text-sm font-bold', colors.text)}>
            {def.symbol}
          </span>
          <span className="text-[10px] font-medium truncate text-foreground/80">
            {data.name}
          </span>
        </div>

        {/* Port area */}
        <div className="flex-1 flex justify-between min-h-[20px]">
          {/* Input ports (left) */}
          <div className="flex flex-col justify-evenly py-0.5">
            {inputs.map((port) => (
              <div
                key={port.id}
                data-port-id={port.id}
                className="flex items-center pl-2 pr-1"
              >
                <span className="text-[9px] text-muted-foreground font-mono">
                  {port.name}
                </span>
              </div>
            ))}
          </div>

          {/* Center: param display or simulation value */}
          <div className="flex items-center justify-center px-1">
            {isSimActive && simOutputValue !== undefined ? (
              <span className={cn('text-[10px] font-mono font-semibold', colors.text)}>
                {typeof simOutputValue === 'number'
                  ? (Number.isInteger(simOutputValue)
                      ? simOutputValue.toString()
                      : simOutputValue.toFixed(2))
                  : ''}
              </span>
            ) : paramDisplay ? (
              <span className="text-[9px] text-muted-foreground font-mono">
                {paramDisplay}
              </span>
            ) : null}
          </div>

          {/* Output ports (right) */}
          <div className="flex flex-col justify-evenly py-0.5">
            {outputs.map((port) => (
              <div
                key={port.id}
                data-port-id={port.id}
                className="flex items-center justify-end pr-2 pl-1"
              >
                <span className="text-[9px] text-muted-foreground font-mono">
                  {port.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Input handles */}
      {inputs.map((port) => (
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

      {/* Output handles */}
      {outputs.map((port) => (
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

export const FunctionBlockNode = memo(FunctionBlockNodeComponent);
