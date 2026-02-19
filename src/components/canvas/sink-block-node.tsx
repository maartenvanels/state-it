'use client';

import { memo } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { SinkBlockNodeData } from '@/lib/types/canvas';
import type { ScopeConfig, DisplayConfig } from '@/lib/types/system';
import { cn } from '@/lib/utils';
import { LineChart, Monitor } from 'lucide-react';

type SinkBlockNodeType = Node<SinkBlockNodeData, 'sinkBlock'>;

function SinkBlockNodeComponent({
  data,
  selected,
}: NodeProps<SinkBlockNodeType>) {
  const isScope = data.blockType === 'scope';
  const config = data.config as unknown as ScopeConfig | DisplayConfig;

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
          selected ? 'border-violet-500' : 'border-border'
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
            <div className="w-full h-full min-h-[40px] border border-dashed border-muted-foreground/30 rounded flex items-center justify-center">
              <span className="text-[10px] text-muted-foreground/50">
                Scope
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-[10px] text-muted-foreground">
              <span className="text-sm font-mono font-medium">---</span>
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
