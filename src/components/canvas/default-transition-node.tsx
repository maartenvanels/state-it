'use client';

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { DefaultTransitionNodeData } from '@/lib/types/canvas';

type DefaultTransitionNodeType = Node<
  DefaultTransitionNodeData,
  'defaultTransition'
>;

function DefaultTransitionNodeComponent({
  selected,
}: NodeProps<DefaultTransitionNodeType>) {
  return (
    <div
      className={`w-4 h-4 rounded-full bg-foreground border-2 ${
        selected ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-background'
      }`}
    >
      <Handle
        type="source"
        position={Position.Bottom}
        id="default-source"
        style={{
          width: 6,
          height: 6,
          bottom: -3,
          background: 'transparent',
          border: 'none',
        }}
      />
    </div>
  );
}

export const DefaultTransitionNode = memo(DefaultTransitionNodeComponent);
