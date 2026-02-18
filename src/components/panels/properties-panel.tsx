'use client';

import { useUIStore } from '@/lib/store/ui-store';
import { useCanvasStore } from '@/lib/store/canvas-store';
import { Settings2 } from 'lucide-react';
import { StateProperties } from './state-properties';
import { TransitionProperties } from './transition-properties';
import { AnnotationProperties } from './annotation-properties';
import { ScrollArea } from '@/components/ui/scroll-area';

export function PropertiesPanel() {
  const selectedNodeIds = useUIStore((s) => s.selectedNodeIds);
  const selectedEdgeIds = useUIStore((s) => s.selectedEdgeIds);
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);

  const selectedNode =
    selectedNodeIds.length === 1
      ? nodes.find((n) => n.id === selectedNodeIds[0])
      : null;

  const selectedEdge =
    selectedEdgeIds.length === 1
      ? edges.find((e) => e.id === selectedEdgeIds[0])
      : null;

  if (selectedNode && selectedNode.type === 'stateNode') {
    return (
      <ScrollArea className="h-full">
        <StateProperties nodeId={selectedNode.id} data={selectedNode.data} />
      </ScrollArea>
    );
  }

  if (selectedNode && selectedNode.type === 'annotationNode') {
    return (
      <ScrollArea className="h-full">
        <AnnotationProperties nodeId={selectedNode.id} data={selectedNode.data} />
      </ScrollArea>
    );
  }

  if (selectedEdge && selectedEdge.data) {
    return (
      <ScrollArea className="h-full">
        <TransitionProperties
          edgeId={selectedEdge.id}
          data={selectedEdge.data}
        />
      </ScrollArea>
    );
  }

  if (selectedNodeIds.length > 1 || selectedEdgeIds.length > 1) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-sm text-muted-foreground p-4">
        <Settings2 className="mb-2 h-8 w-8 opacity-50" />
        <p>{selectedNodeIds.length + selectedEdgeIds.length} items selected</p>
        <p className="text-xs mt-1">
          Select a single item to edit properties
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-center text-sm text-muted-foreground p-4">
      <Settings2 className="mb-2 h-8 w-8 opacity-50" />
      <p>Select a state or transition</p>
      <p className="text-xs mt-1">Properties will appear here</p>
    </div>
  );
}
