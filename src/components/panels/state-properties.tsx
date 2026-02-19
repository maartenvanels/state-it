'use client';

import { useState, useCallback, useEffect } from 'react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useCanvasStore } from '@/lib/store/canvas-store';
import type { StateNodeData } from '@/lib/types/canvas';
import type { DecompositionType, ActionBlock } from '@/lib/types/state';
import { ActionEditor } from '@/components/shared/action-editor';
import { STATE_COLORS } from '@/lib/utils/constants';
import { cn } from '@/lib/utils';

interface StatePropertiesProps {
  nodeId: string;
  data: StateNodeData;
}

export function StateProperties({ nodeId, data }: StatePropertiesProps) {
  const { stateBlock } = data;
  const updateStateNodeData = useCanvasStore((s) => s.updateStateNodeData);
  const [name, setName] = useState(stateBlock.name);

  // Sync name when selection changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(stateBlock.name);
  }, [nodeId, stateBlock.name]);

  const handleNameBlur = useCallback(() => {
    if (name.trim() && name !== stateBlock.name) {
      updateStateNodeData(nodeId, {
        stateBlock: { ...stateBlock, name: name.trim() },
      });
    }
  }, [name, stateBlock, nodeId, updateStateNodeData]);

  const handleDecompositionChange = useCallback(
    (value: string) => {
      updateStateNodeData(nodeId, {
        stateBlock: {
          ...stateBlock,
          decomposition: value as DecompositionType,
        },
      });
    },
    [stateBlock, nodeId, updateStateNodeData]
  );

  const handleDefaultChange = useCallback(
    (checked: boolean) => {
      updateStateNodeData(nodeId, {
        stateBlock: { ...stateBlock, isDefault: checked },
      });
    },
    [stateBlock, nodeId, updateStateNodeData]
  );

  const handleColorChange = useCallback(
    (color: string | null) => {
      updateStateNodeData(nodeId, {
        stateBlock: { ...stateBlock, color },
      });
    },
    [stateBlock, nodeId, updateStateNodeData]
  );

  const handleActionsChange = useCallback(
    (type: 'entry' | 'during' | 'exit', actions: ActionBlock[]) => {
      updateStateNodeData(nodeId, {
        stateBlock: {
          ...stateBlock,
          actions: { ...stateBlock.actions, [type]: actions },
        },
      });
    },
    [stateBlock, nodeId, updateStateNodeData]
  );

  return (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold text-sm">State Properties</h3>

      <div className="space-y-2">
        <Label htmlFor="state-name" className="text-xs">
          Name
        </Label>
        <Input
          id="state-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleNameBlur}
          onKeyDown={(e) => e.key === 'Enter' && handleNameBlur()}
          className="h-8 text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="decomposition" className="text-xs">
          Decomposition
        </Label>
        <Select
          value={stateBlock.decomposition}
          onValueChange={handleDecompositionChange}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="exclusive">Exclusive (OR)</SelectItem>
            <SelectItem value="parallel">Parallel (AND)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="default-state" className="text-xs">
          Default State
        </Label>
        <Switch
          id="default-state"
          checked={stateBlock.isDefault}
          onCheckedChange={handleDefaultChange}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Color</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-8 w-full justify-start gap-2">
              <div
                className="h-4 w-4 rounded-sm border"
                style={{ backgroundColor: stateBlock.color ?? 'var(--card)' }}
              />
              <span className="text-sm">
                {STATE_COLORS.find((c) => c.value === stateBlock.color)?.name ?? 'Default'}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-3">
            <div className="grid grid-cols-4 gap-2">
              {STATE_COLORS.map((color) => (
                <button
                  key={color.name}
                  className={cn(
                    'h-7 w-7 rounded-md border-2 transition-all hover:scale-110',
                    stateBlock.color === color.value
                      ? 'border-foreground ring-2 ring-ring'
                      : 'border-transparent'
                  )}
                  style={{
                    backgroundColor: color.value ?? 'var(--card)',
                  }}
                  onClick={() => handleColorChange(color.value)}
                  title={color.name}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-xs">Actions</Label>
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <ActionEditor
            label="entry"
            color="text-blue-500"
            actions={stateBlock.actions.entry}
            onChange={(actions) => handleActionsChange('entry', actions)}
          />
          <ActionEditor
            label="during"
            color="text-green-500"
            actions={stateBlock.actions.during}
            onChange={(actions) => handleActionsChange('during', actions)}
          />
          <ActionEditor
            label="exit"
            color="text-orange-500"
            actions={stateBlock.actions.exit}
            onChange={(actions) => handleActionsChange('exit', actions)}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-1 text-xs text-muted-foreground">
        <div>
          Size: {stateBlock.size.width} x {stateBlock.size.height}
        </div>
        <div>
          Position: ({Math.round(stateBlock.position.x)},{' '}
          {Math.round(stateBlock.position.y)})
        </div>
        {stateBlock.parentId && <div>Nested in parent</div>}
      </div>
    </div>
  );
}
