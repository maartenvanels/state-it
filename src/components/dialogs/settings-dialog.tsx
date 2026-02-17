'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useProjectStore } from '@/lib/store/project-store';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const settings = useProjectStore(
    (s) => s.currentProject?.settings
  );
  const updateSettings = useProjectStore((s) => s.updateSettings);

  if (!settings) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Canvas Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Canvas</h4>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-grid">Show Grid</Label>
              <Switch
                id="show-grid"
                checked={settings.showGrid}
                onCheckedChange={(checked) =>
                  updateSettings({ showGrid: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="snap-grid">Snap to Grid</Label>
              <Switch
                id="snap-grid"
                checked={settings.snapToGrid}
                onCheckedChange={(checked) =>
                  updateSettings({ snapToGrid: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="grid-size">Grid Size</Label>
              <Input
                id="grid-size"
                type="number"
                value={settings.gridSize}
                onChange={(e) =>
                  updateSettings({
                    gridSize: Math.max(5, Math.min(100, parseInt(e.target.value) || 20)),
                  })
                }
                className="w-20 h-8 text-sm"
                min={5}
                max={100}
              />
            </div>
          </div>

          <Separator />

          {/* Code Generation */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Code Generation</h4>

            <div className="flex items-center justify-between">
              <Label>Default Target</Label>
              <Select
                value={settings.codeGenTarget}
                onValueChange={(v) =>
                  updateSettings({
                    codeGenTarget: v as 'c' | 'scl' | 'both',
                  })
                }
              >
                <SelectTrigger className="w-28 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="c">C</SelectItem>
                  <SelectItem value="scl">SCL</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Auto-save */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Auto-Save</h4>

            <div className="flex items-center justify-between">
              <Label>Interval (seconds)</Label>
              <Input
                type="number"
                value={settings.autoSaveInterval / 1000}
                onChange={(e) =>
                  updateSettings({
                    autoSaveInterval:
                      Math.max(5, parseInt(e.target.value) || 30) * 1000,
                  })
                }
                className="w-20 h-8 text-sm"
                min={5}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
