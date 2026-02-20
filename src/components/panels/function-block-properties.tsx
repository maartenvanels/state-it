'use client';

import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useProjectStore } from '@/lib/store/project-store';
import { useCanvasStore } from '@/lib/store/canvas-store';
import { getBlockDef } from '@/lib/blocks/registry';
import { CATEGORY_LABELS, CATEGORY_COLOR_CLASSES } from '@/lib/types/function-block';
import type { FunctionBlockNodeData } from '@/lib/types/canvas';
import type { FunctionBlockConfig } from '@/lib/types/function-block';
import { deserializeSystemToCanvas } from '@/lib/persistence/serializer';
import { cn } from '@/lib/utils';

interface FunctionBlockPropertiesProps {
  nodeId: string;
  data: FunctionBlockNodeData;
}

export function FunctionBlockProperties({ nodeId, data }: FunctionBlockPropertiesProps) {
  const def = getBlockDef(data.defType);

  const updateBlock = useCallback(
    (updates: Record<string, unknown>) => {
      useProjectStore.getState().updateSystemBlock(nodeId, updates);
      const project = useProjectStore.getState().currentProject;
      if (project) {
        const { nodes, edges } = deserializeSystemToCanvas(project);
        useCanvasStore.getState().setNodes(nodes);
        useCanvasStore.getState().setEdges(edges);
      }
    },
    [nodeId]
  );

  const handleNameChange = useCallback(
    (name: string) => {
      updateBlock({ name });
    },
    [updateBlock]
  );

  const handleParamChange = useCallback(
    (paramId: string, value: number | string | boolean) => {
      const block = useProjectStore.getState().currentProject?.systemBlocks.find(
        (b) => b.id === nodeId
      );
      if (!block) return;
      const config = block.config as unknown as FunctionBlockConfig;
      const newParams = { ...config.params, [paramId]: value };
      updateBlock({ config: { ...config, params: newParams } as unknown as Record<string, unknown> });
    },
    [nodeId, updateBlock]
  );

  if (!def) {
    return (
      <div className="p-4 text-sm text-destructive">
        Unknown block type: {data.defType}
      </div>
    );
  }

  const colors = CATEGORY_COLOR_CLASSES[def.category];

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className={cn('text-lg font-bold', colors.text)}>{def.symbol}</span>
        <div>
          <p className="text-sm font-semibold">{def.name}</p>
          <Badge variant="outline" className={cn('text-[10px]', colors.text)}>
            {CATEGORY_LABELS[def.category]}
          </Badge>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{def.description}</p>

      <Separator />

      {/* Name */}
      <div className="space-y-1.5">
        <Label className="text-xs">Name</Label>
        <Input
          value={data.name}
          onChange={(e) => handleNameChange(e.target.value)}
          className="h-8 text-sm"
        />
      </div>

      {/* Parameters */}
      {def.params.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Parameters
            </p>
            {def.params.map((param) => {
              const value = data.params[param.id] ?? param.defaultValue;
              return (
                <div key={param.id} className="space-y-1.5">
                  <Label className="text-xs">{param.name}</Label>
                  {param.type === 'number' && (
                    <Input
                      type="number"
                      value={Number(value)}
                      min={param.min}
                      max={param.max}
                      step={param.step}
                      onChange={(e) => handleParamChange(param.id, Number(e.target.value))}
                      className="h-8 text-sm"
                    />
                  )}
                  {param.type === 'select' && param.options && (
                    <Select
                      value={String(value)}
                      onValueChange={(v) => handleParamChange(param.id, v)}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {param.options.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {param.type === 'boolean' && (
                    <Switch
                      checked={Boolean(value)}
                      onCheckedChange={(checked) => handleParamChange(param.id, checked)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Ports info */}
      <Separator />
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Ports
        </p>
        {def.inputs.length > 0 && (
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">Inputs</p>
            {def.inputs.map((port) => (
              <div key={port.id} className="flex items-center gap-2 text-xs py-0.5">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="font-mono">{port.name}</span>
                <span className="text-muted-foreground">({port.dataType})</span>
              </div>
            ))}
          </div>
        )}
        {def.outputs.length > 0 && (
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">Outputs</p>
            {def.outputs.map((port) => (
              <div key={port.id} className="flex items-center gap-2 text-xs py-0.5">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="font-mono">{port.name}</span>
                <span className="text-muted-foreground">({port.dataType})</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
