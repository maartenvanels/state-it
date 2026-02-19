'use client';

import { memo } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { SourceBlockNodeData } from '@/lib/types/canvas';
import type { ConstantConfig, SignalGeneratorConfig } from '@/lib/types/system';
import { useSystemSimulationStore } from '@/lib/store/system-simulation-store';
import { cn } from '@/lib/utils';
import { Hash, Activity } from 'lucide-react';

type SourceBlockNodeType = Node<SourceBlockNodeData, 'sourceBlock'>;

function SourceBlockNodeComponent({
  id,
  data,
  selected,
}: NodeProps<SourceBlockNodeType>) {
  const isConstant = data.blockType === 'constant';
  const config = data.config as unknown as ConstantConfig | SignalGeneratorConfig;
  const isSimActive = useSystemSimulationStore((s) => s.isActive);
  const outputValue = useSystemSimulationStore(
    (s) => s.portValues[id]?.['output']
  );

  return (
    <>
      <NodeResizer
        isVisible={!!selected}
        minWidth={120}
        minHeight={60}
        lineClassName="!border-emerald-500/50"
        handleClassName="!w-2 !h-2 !bg-emerald-500 !border-emerald-500"
      />

      <div
        className={cn(
          'flex flex-col h-full border-2 rounded-lg bg-background shadow-sm overflow-hidden',
          isSimActive
            ? 'border-emerald-400 ring-1 ring-emerald-400/30'
            : selected
              ? 'border-emerald-500'
              : 'border-border'
        )}
      >
        {/* Header */}
        <div className="bg-emerald-500/10 border-b px-3 py-1.5 flex items-center gap-2">
          {isConstant ? (
            <Hash className="h-3 w-3 text-emerald-600 flex-shrink-0" />
          ) : (
            <Activity className="h-3 w-3 text-emerald-600 flex-shrink-0" />
          )}
          <span className="text-xs font-semibold truncate">{data.name}</span>
        </div>

        {/* Body */}
        <div className="flex-1 flex items-center justify-center px-2 py-1">
          {isConstant ? (
            <div className="flex flex-col items-center">
              <span className="text-sm font-mono font-medium">
                {(config as ConstantConfig).value}
              </span>
              {isSimActive && outputValue !== undefined && (
                <span className="text-[10px] text-emerald-500 font-mono">
                  = {outputValue.toFixed(2)}
                </span>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center text-[10px] text-muted-foreground">
              <span className="capitalize">
                {(config as SignalGeneratorConfig).waveform}
              </span>
              <span>{(config as SignalGeneratorConfig).frequency} Hz</span>
              {isSimActive && outputValue !== undefined && (
                <span className="text-emerald-500 font-mono">
                  = {outputValue.toFixed(2)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Output handle (right side) */}
      <Handle
        id="output"
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
    </>
  );
}

export const SourceBlockNode = memo(SourceBlockNodeComponent);
