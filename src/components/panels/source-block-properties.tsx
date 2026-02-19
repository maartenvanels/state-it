'use client';

import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import type { SourceBlockNodeData } from '@/lib/types/canvas';
import type { ConstantConfig, SignalGeneratorConfig } from '@/lib/types/system';
import { Hash, Activity } from 'lucide-react';

interface Props {
  nodeId: string;
  data: SourceBlockNodeData;
}

export function SourceBlockProperties({ nodeId, data }: Props) {
  const isConstant = data.blockType === 'constant';
  const config = data.config as unknown as ConstantConfig | SignalGeneratorConfig;

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

      // Refresh canvas nodes
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
        {isConstant ? (
          <Hash className="h-4 w-4 text-emerald-600" />
        ) : (
          <Activity className="h-4 w-4 text-emerald-600" />
        )}
        <h3 className="font-semibold text-sm">
          {isConstant ? 'Constant' : 'Signal Generator'}
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

      {isConstant ? (
        <ConstantConfigEditor
          config={config as ConstantConfig}
          onUpdate={(c) => updateBlock({ config: c as unknown as Record<string, unknown> })}
        />
      ) : (
        <SignalGeneratorConfigEditor
          config={config as SignalGeneratorConfig}
          onUpdate={(c) => updateBlock({ config: c as unknown as Record<string, unknown> })}
        />
      )}
    </div>
  );
}

function ConstantConfigEditor({
  config,
  onUpdate,
}: {
  config: ConstantConfig;
  onUpdate: (c: ConstantConfig) => void;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label className="text-xs">Value</Label>
        <Input
          type="number"
          value={config.value}
          onChange={(e) => onUpdate({ ...config, value: parseFloat(e.target.value) || 0 })}
          className="h-8 text-sm font-mono"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Data Type</Label>
        <Select
          value={config.dataType}
          onValueChange={(v) => onUpdate({ ...config, dataType: v as ConstantConfig['dataType'] })}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BOOL">BOOL</SelectItem>
            <SelectItem value="INT">INT</SelectItem>
            <SelectItem value="REAL">REAL</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

function SignalGeneratorConfigEditor({
  config,
  onUpdate,
}: {
  config: SignalGeneratorConfig;
  onUpdate: (c: SignalGeneratorConfig) => void;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label className="text-xs">Waveform</Label>
        <Select
          value={config.waveform}
          onValueChange={(v) =>
            onUpdate({ ...config, waveform: v as SignalGeneratorConfig['waveform'] })
          }
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sine">Sine</SelectItem>
            <SelectItem value="square">Square</SelectItem>
            <SelectItem value="triangle">Triangle</SelectItem>
            <SelectItem value="sawtooth">Sawtooth</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label className="text-xs">Amplitude</Label>
          <Input
            type="number"
            step="0.1"
            value={config.amplitude}
            onChange={(e) => onUpdate({ ...config, amplitude: parseFloat(e.target.value) || 0 })}
            className="h-8 text-sm font-mono"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Frequency (Hz)</Label>
          <Input
            type="number"
            step="0.1"
            value={config.frequency}
            onChange={(e) => onUpdate({ ...config, frequency: parseFloat(e.target.value) || 0 })}
            className="h-8 text-sm font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label className="text-xs">Offset</Label>
          <Input
            type="number"
            step="0.1"
            value={config.offset}
            onChange={(e) => onUpdate({ ...config, offset: parseFloat(e.target.value) || 0 })}
            className="h-8 text-sm font-mono"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Phase (deg)</Label>
          <Input
            type="number"
            step="1"
            value={config.phase}
            onChange={(e) => onUpdate({ ...config, phase: parseFloat(e.target.value) || 0 })}
            className="h-8 text-sm font-mono"
          />
        </div>
      </div>
    </>
  );
}
