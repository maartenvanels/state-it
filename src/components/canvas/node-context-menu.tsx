'use client';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Trash2, Copy, CircleDot, Unlink } from 'lucide-react';
import { useCanvasStore } from '@/lib/store/canvas-store';
import { useUIStore } from '@/lib/store/ui-store';
import { useCallback } from 'react';

interface NodeContextMenuProps {
  nodeId: string;
  hasParent: boolean;
  children: React.ReactNode;
}

export function NodeContextMenu({
  nodeId,
  hasParent,
  children,
}: NodeContextMenuProps) {
  const removeNodes = useCanvasStore((s) => s.removeNodes);
  const unnestNode = useCanvasStore((s) => s.unnestNode);
  const addDefaultTransitionNode = useCanvasStore(
    (s) => s.addDefaultTransitionNode
  );
  const nodes = useCanvasStore((s) => s.nodes);
  const setSelection = useUIStore((s) => s.setSelection);

  const handleDelete = useCallback(() => {
    removeNodes([nodeId]);
    setSelection([], []);
  }, [nodeId, removeNodes, setSelection]);

  const handleUnnest = useCallback(() => {
    unnestNode(nodeId);
  }, [nodeId, unnestNode]);

  const handleAddDefaultTransition = useCallback(() => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    addDefaultTransitionNode(nodeId, {
      x: node.position.x - 60,
      y: node.position.y + 20,
    });
  }, [nodeId, nodes, addDefaultTransitionNode]);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={handleAddDefaultTransition}>
          <CircleDot className="mr-2 h-4 w-4" />
          Add Default Transition
        </ContextMenuItem>
        <ContextMenuSeparator />
        {hasParent && (
          <ContextMenuItem onClick={handleUnnest}>
            <Unlink className="mr-2 h-4 w-4" />
            Detach from Parent
          </ContextMenuItem>
        )}
        <ContextMenuItem disabled>
          <Copy className="mr-2 h-4 w-4" />
          Duplicate
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={handleDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
