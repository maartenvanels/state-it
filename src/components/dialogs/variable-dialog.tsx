'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
import { useNavigationStore } from '@/lib/store/navigation-store';
import type { Variable, VariableScope, DataType } from '@/lib/types/variable';

interface VariableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editVariable?: Variable | null;
}

const SCOPES: { value: VariableScope; label: string }[] = [
  { value: 'input', label: 'Input' },
  { value: 'output', label: 'Output' },
  { value: 'local', label: 'Local' },
  { value: 'parameter', label: 'Parameter' },
];

const DATA_TYPES: { value: DataType; label: string }[] = [
  { value: 'boolean', label: 'Boolean' },
  { value: 'int8', label: 'Int8' },
  { value: 'int16', label: 'Int16' },
  { value: 'int32', label: 'Int32' },
  { value: 'uint8', label: 'UInt8' },
  { value: 'uint16', label: 'UInt16' },
  { value: 'uint32', label: 'UInt32' },
  { value: 'float', label: 'Float' },
  { value: 'double', label: 'Double' },
  { value: 'string', label: 'String' },
  { value: 'enum', label: 'Enum' },
];

export function VariableDialog({
  open,
  onOpenChange,
  editVariable,
}: VariableDialogProps) {
  const chartId = useNavigationStore((s) =>
    s.activeView.type === 'chart' ? s.activeView.chartId : null
  );
  const addVariableStore = useProjectStore((s) => s.addVariable);
  const updateVariableStore = useProjectStore((s) => s.updateVariable);

  const [name, setName] = useState('');
  const [scope, setScope] = useState<VariableScope>('local');
  const [dataType, setDataType] = useState<DataType>('int32');
  const [initialValue, setInitialValue] = useState('');
  const [description, setDescription] = useState('');
  const [enumValues, setEnumValues] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editVariable) {
      setName(editVariable.name);
      setScope(editVariable.scope);
      setDataType(editVariable.dataType);
      setInitialValue(editVariable.initialValue);
      setDescription(editVariable.description);
      setEnumValues(editVariable.enumValues?.join(', ') ?? '');
    } else {
      setName('');
      setScope('local');
      setDataType('int32');
      setInitialValue('');
      setDescription('');
      setEnumValues('');
    }
    setError('');
  }, [editVariable, open]);

  const handleSubmit = () => {
    // Validate name
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name.trim())) {
      setError('Name must be a valid C identifier');
      return;
    }

    const variable: Omit<Variable, 'id'> = {
      name: name.trim(),
      scope,
      dataType,
      initialValue: initialValue.trim(),
      description: description.trim(),
      ...(dataType === 'enum' && enumValues.trim()
        ? {
            enumValues: enumValues
              .split(',')
              .map((v) => v.trim())
              .filter(Boolean),
          }
        : {}),
    };

    if (!chartId) return;
    if (editVariable) {
      updateVariableStore(chartId, editVariable.id, variable);
    } else {
      addVariableStore(chartId, variable);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editVariable ? 'Edit Variable' : 'Add Variable'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="var-name">Name</Label>
            <Input
              id="var-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="e.g. counter"
              className="font-mono"
            />
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Scope</Label>
              <Select
                value={scope}
                onValueChange={(v) => setScope(v as VariableScope)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCOPES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Data Type</Label>
              <Select
                value={dataType}
                onValueChange={(v) => setDataType(v as DataType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATA_TYPES.map((dt) => (
                    <SelectItem key={dt.value} value={dt.value}>
                      {dt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="var-init">Initial Value</Label>
            <Input
              id="var-init"
              value={initialValue}
              onChange={(e) => setInitialValue(e.target.value)}
              placeholder="e.g. 0"
              className="font-mono"
            />
          </div>

          {dataType === 'enum' && (
            <div className="space-y-1.5">
              <Label htmlFor="var-enum">Enum Values (comma-separated)</Label>
              <Input
                id="var-enum"
                value={enumValues}
                onChange={(e) => setEnumValues(e.target.value)}
                placeholder="e.g. OFF, ON, ERROR"
                className="font-mono"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="var-desc">Description</Label>
            <Input
              id="var-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {editVariable ? 'Save' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
