'use client';

import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProjectStore } from '@/lib/store/project-store';
import { useCanvasStore } from '@/lib/store/canvas-store';
import type { ChartBlockNodeData, CanvasNode } from '@/lib/types/canvas';
import type { Port } from '@/lib/types/chart';
import type { DataType } from '@/lib/types/variable';
import { generateId } from '@/lib/utils/id-generator';
import { LayoutGrid, Plus, Trash2 } from 'lucide-react';

interface Props {
  nodeId: string;
  data: ChartBlockNodeData;
}

export function ChartBlockProperties({ nodeId, data }: Props) {
  const chart = useProjectStore((s) =>
    s.currentProject?.charts.find((c) => c.id === data.chartId)
  );

  const handleRename = useCallback(
    (name: string) => {
      useProjectStore.getState().renameChart(data.chartId, name);
      // Update chartName directly on existing canvas nodes to avoid
      // rebuilding the entire canvas (which resets dragged positions).
      const canvasStore = useCanvasStore.getState();
      canvasStore.setNodes(
        canvasStore.nodes.map((node) => {
          if (node.type === 'chartBlock' && (node.data as ChartBlockNodeData).chartId === data.chartId) {
            return {
              ...node,
              data: { ...node.data, chartName: name },
            } as CanvasNode;
          }
          return node;
        })
      );
    },
    [data.chartId]
  );

  const handleDescriptionChange = useCallback(
    (description: string) => {
      const store = useProjectStore.getState();
      const current = store.currentProject;
      if (!current) return;
      store.setCurrentProject({
        ...current,
        charts: current.charts.map((c) =>
          c.id === data.chartId ? { ...c, description } : c
        ),
      });
    },
    [data.chartId]
  );

  const handleUpdatePorts = useCallback(
    (ports: Port[]) => {
      useProjectStore.getState().updateChartPorts(data.chartId, ports);
      // Update ports directly on existing canvas nodes to avoid
      // rebuilding the entire canvas (which resets dragged positions).
      const canvasStore = useCanvasStore.getState();
      canvasStore.setNodes(
        canvasStore.nodes.map((node) => {
          if (node.type === 'chartBlock' && (node.data as ChartBlockNodeData).chartId === data.chartId) {
            return {
              ...node,
              data: { ...node.data, ports },
            } as CanvasNode;
          }
          return node;
        })
      );
    },
    [data.chartId]
  );

  const handleAddPort = useCallback(() => {
    const newPort: Port = {
      id: generateId(),
      name: `port_${(chart?.ports.length ?? 0) + 1}`,
      direction: 'input',
      dataType: 'float',
      defaultValue: '0',
    };
    handleUpdatePorts([...(chart?.ports ?? []), newPort]);
  }, [chart?.ports, handleUpdatePorts]);

  const handleRemovePort = useCallback(
    (portId: string) => {
      handleUpdatePorts((chart?.ports ?? []).filter((p) => p.id !== portId));
    },
    [chart?.ports, handleUpdatePorts]
  );

  const handlePortChange = useCallback(
    (portId: string, updates: Partial<Port>) => {
      handleUpdatePorts(
        (chart?.ports ?? []).map((p) =>
          p.id === portId ? { ...p, ...updates } : p
        )
      );
    },
    [chart?.ports, handleUpdatePorts]
  );

  if (!chart) return null;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2 mb-3">
        <LayoutGrid className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">Chart Block</h3>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Name</Label>
        <Input
          value={chart.name}
          onChange={(e) => handleRename(e.target.value)}
          className="h-8 text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Description</Label>
        <textarea
          value={chart.description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleDescriptionChange(e.target.value)}
          className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          placeholder="Chart description..."
        />
      </div>

      {/* Port editor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Ports</Label>
          <Button variant="ghost" size="sm" className="h-6 px-2" onClick={handleAddPort}>
            <Plus className="h-3 w-3 mr-1" />
            <span className="text-xs">Add</span>
          </Button>
        </div>

        {chart.ports.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No ports defined. Add ports to wire this chart to other blocks.
          </p>
        ) : (
          <div className="space-y-2">
            {chart.ports.map((port) => (
              <div
                key={port.id}
                className="flex items-center gap-1 rounded border p-1.5"
              >
                <Input
                  value={port.name}
                  onChange={(e) => handlePortChange(port.id, { name: e.target.value })}
                  className="h-6 text-xs flex-1 min-w-0"
                />
                <Select
                  value={port.direction}
                  onValueChange={(v) =>
                    handlePortChange(port.id, { direction: v as 'input' | 'output' })
                  }
                >
                  <SelectTrigger className="h-6 text-xs w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="input">In</SelectItem>
                    <SelectItem value="output">Out</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={port.dataType}
                  onValueChange={(v) =>
                    handlePortChange(port.id, { dataType: v as DataType })
                  }
                >
                  <SelectTrigger className="h-6 text-xs w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boolean">BOOL</SelectItem>
                    <SelectItem value="int32">INT</SelectItem>
                    <SelectItem value="float">REAL</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0"
                  onClick={() => handleRemovePort(port.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
