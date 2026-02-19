'use client';

import { memo } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { SinkBlockNodeData } from '@/lib/types/canvas';
import type { ScopeConfig, DisplayConfig } from '@/lib/types/system';
import { useSystemSimulationStore } from '@/lib/store/system-simulation-store';
import type { ScopeSample } from '@/lib/codegen/system-simulator';
import { cn } from '@/lib/utils';
import { LineChart, Monitor } from 'lucide-react';

type SinkBlockNodeType = Node<SinkBlockNodeData, 'sinkBlock'>;

function formatDisplayValue(
  value: number,
  format: DisplayConfig['format']
): string {
  switch (format) {
    case 'decimal':
      return value.toFixed(2);
    case 'hex':
      return '0x' + Math.round(value).toString(16).toUpperCase();
    case 'binary':
      return '0b' + (Math.round(value) >>> 0).toString(2);
    case 'boolean':
      return value ? 'TRUE' : 'FALSE';
    default:
      return String(value);
  }
}

function ScopeSparkline({
  samples,
  config,
}: {
  samples: ScopeSample[];
  config: ScopeConfig;
}) {
  if (samples.length < 2) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-[10px] text-muted-foreground/50">No data</span>
      </div>
    );
  }

  const width = 200;
  const height = 80;
  const padding = 4;

  let yMin = config.yMin;
  let yMax = config.yMax;
  if (config.autoScale) {
    yMin = Math.min(...samples.map((s) => s.value));
    yMax = Math.max(...samples.map((s) => s.value));
    const margin = (yMax - yMin) * 0.1 || 0.5;
    yMin -= margin;
    yMax += margin;
  }

  const xScale = (width - 2 * padding) / Math.max(samples.length - 1, 1);
  const yRange = yMax - yMin || 1;
  const yScale = (height - 2 * padding) / yRange;

  const points = samples
    .map((s, i) => {
      const x = padding + i * xScale;
      const y = height - padding - (s.value - yMin) * yScale;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-full"
      preserveAspectRatio="none"
    >
      {/* Axes */}
      <line
        x1={padding}
        y1={padding}
        x2={padding}
        y2={height - padding}
        stroke="currentColor"
        strokeOpacity={0.1}
        strokeWidth={0.5}
      />
      <line
        x1={padding}
        y1={height - padding}
        x2={width - padding}
        y2={height - padding}
        stroke="currentColor"
        strokeOpacity={0.1}
        strokeWidth={0.5}
      />
      {/* Zero line */}
      {yMin < 0 && yMax > 0 && (
        <line
          x1={padding}
          y1={height - padding - (0 - yMin) * yScale}
          x2={width - padding}
          y2={height - padding - (0 - yMin) * yScale}
          stroke="currentColor"
          strokeOpacity={0.08}
          strokeWidth={0.5}
          strokeDasharray="4,4"
        />
      )}
      {/* Data line */}
      <polyline
        fill="none"
        stroke="#8b5cf6"
        strokeWidth={1.5}
        points={points}
      />
    </svg>
  );
}

function SinkBlockNodeComponent({
  id,
  data,
  selected,
}: NodeProps<SinkBlockNodeType>) {
  const isScope = data.blockType === 'scope';
  const config = data.config as unknown as ScopeConfig | DisplayConfig;

  const isSimActive = useSystemSimulationStore((s) => s.isActive);
  const scopeSamples = useSystemSimulationStore(
    (s) => s.scopeData[id] ?? []
  );
  const displayValue = useSystemSimulationStore(
    (s) => s.displayValues[id] ?? 0
  );

  return (
    <>
      <NodeResizer
        isVisible={!!selected}
        minWidth={isScope ? 180 : 120}
        minHeight={isScope ? 100 : 60}
        lineClassName="!border-violet-500/50"
        handleClassName="!w-2 !h-2 !bg-violet-500 !border-violet-500"
      />

      <div
        className={cn(
          'flex flex-col h-full border-2 rounded-lg bg-background shadow-sm overflow-hidden',
          isSimActive
            ? 'border-violet-400 ring-1 ring-violet-400/30'
            : selected
              ? 'border-violet-500'
              : 'border-border'
        )}
      >
        {/* Header */}
        <div className="bg-violet-500/10 border-b px-3 py-1.5 flex items-center gap-2">
          {isScope ? (
            <LineChart className="h-3 w-3 text-violet-600 flex-shrink-0" />
          ) : (
            <Monitor className="h-3 w-3 text-violet-600 flex-shrink-0" />
          )}
          <span className="text-xs font-semibold truncate">{data.name}</span>
        </div>

        {/* Body */}
        <div className="flex-1 flex items-center justify-center px-2 py-1">
          {isScope ? (
            <div className="w-full h-full min-h-[40px] border border-dashed border-muted-foreground/30 rounded overflow-hidden">
              {isSimActive && scopeSamples.length > 0 ? (
                <ScopeSparkline
                  samples={scopeSamples}
                  config={config as ScopeConfig}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-[10px] text-muted-foreground/50">
                    Scope
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center text-[10px] text-muted-foreground">
              <span className="text-sm font-mono font-medium">
                {isSimActive
                  ? formatDisplayValue(
                      displayValue,
                      (config as DisplayConfig).format
                    )
                  : '---'}
              </span>
              <span>{(config as DisplayConfig).format}</span>
            </div>
          )}
        </div>
      </div>

      {/* Input handle (left side) */}
      <Handle
        id="input"
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
    </>
  );
}

export const SinkBlockNode = memo(SinkBlockNodeComponent);
