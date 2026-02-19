'use client';

import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProjectStore } from '@/lib/store/project-store';
import { useCanvasStore } from '@/lib/store/canvas-store';
import { deserializeSystemToCanvas } from '@/lib/persistence/serializer';
import type { SinkBlockNodeData } from '@/lib/types/canvas';
import type { ScopeConfig, DisplayConfig } from '@/lib/types/system';
import { LineChart, Monitor } from 'lucide-react';

interface Props {
  nodeId: string;
  data: SinkBlockNodeData;
}

export function SinkBlockProperties({ nodeId, data }: Props) {
  const isScope = data.blockType === 'scope';
  const config = data.config as unknown as ScopeConfig | DisplayConfig;

  const updateBlock = useCallback(
    (updates: { name?: string; config?: Record<string, unknown> }) => {
      const store = useProjectStore.getState();
      const block = store.currentProject?.systemBlocks.find((b) => b.id === nodeId);
      if (!block) return;

      const newBlock = {
        ...block,
        ...(updates.name ? { name: updates.name } : {}),
        ...(updates.config ? { config: { ...block.config, ...updates.config } } : {}),
      };
      store.updateSystemBlock(nodeId, newBlock);

      const project = useProjectStore.getState().currentProject;
      if (project) {
        const { nodes, edges } = deserializeSystemToCanvas(project);
        useCanvasStore.getState().setNodes(nodes);
        useCanvasStore.getState().setEdges(edges);
      }
    },
    [nodeId]
  );

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2 mb-3">
        {isScope ? (
          <LineChart className="h-4 w-4 text-violet-600" />
        ) : (
          <Monitor className="h-4 w-4 text-violet-600" />
        )}
        <h3 className="font-semibold text-sm">
          {isScope ? 'Scope' : 'Display'}
        </h3>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Name</Label>
        <Input
          value={data.name}
          onChange={(e) => updateBlock({ name: e.target.value })}
          className="h-8 text-sm"
        />
      </div>

      {isScope ? (
        <ScopeConfigEditor
          config={config as ScopeConfig}
          onUpdate={(c) => updateBlock({ config: c as unknown as Record<string, unknown> })}
        />
      ) : (
        <DisplayConfigEditor
          config={config as DisplayConfig}
          onUpdate={(c) => updateBlock({ config: c as unknown as Record<string, unknown> })}
        />
      )}
    </div>
  );
}

function ScopeConfigEditor({
  config,
  onUpdate,
}: {
  config: ScopeConfig;
  onUpdate: (c: ScopeConfig) => void;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label className="text-xs">Time Window (s)</Label>
        <Input
          type="number"
          step="1"
          value={config.timeWindow}
          onChange={(e) => onUpdate({ ...config, timeWindow: parseFloat(e.target.value) || 10 })}
          className="h-8 text-sm font-mono"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-xs">Auto Scale</Label>
        <Switch
          checked={config.autoScale}
          onCheckedChange={(checked) => onUpdate({ ...config, autoScale: checked })}
        />
      </div>

      {!config.autoScale && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label className="text-xs">Y Min</Label>
            <Input
              type="number"
              step="0.1"
              value={config.yMin}
              onChange={(e) => onUpdate({ ...config, yMin: parseFloat(e.target.value) || -1 })}
              className="h-8 text-sm font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Y Max</Label>
            <Input
              type="number"
              step="0.1"
              value={config.yMax}
              onChange={(e) => onUpdate({ ...config, yMax: parseFloat(e.target.value) || 1 })}
              className="h-8 text-sm font-mono"
            />
          </div>
        </div>
      )}
    </>
  );
}

function DisplayConfigEditor({
  config,
  onUpdate,
}: {
  config: DisplayConfig;
  onUpdate: (c: DisplayConfig) => void;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label className="text-xs">Format</Label>
        <Select
          value={config.format}
          onValueChange={(v) => onUpdate({ ...config, format: v as DisplayConfig['format'] })}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="decimal">Decimal</SelectItem>
            <SelectItem value="hex">Hexadecimal</SelectItem>
            <SelectItem value="binary">Binary</SelectItem>
            <SelectItem value="boolean">Boolean</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Label</Label>
        <Input
          value={config.label}
          onChange={(e) => onUpdate({ ...config, label: e.target.value })}
          className="h-8 text-sm"
          placeholder="Display label..."
        />
      </div>
    </>
  );
}
