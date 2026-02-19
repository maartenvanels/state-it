'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useProjectStore } from '@/lib/store/project-store';
import { useNavigationStore } from '@/lib/store/navigation-store';
import type { Variable, VariableScope, DataType } from '@/lib/types/variable';
import { Plus, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const SCOPES: { value: VariableScope; label: string }[] = [
  { value: 'input', label: 'INP' },
  { value: 'output', label: 'OUT' },
  { value: 'local', label: 'LOC' },
  { value: 'parameter', label: 'PAR' },
];

const DATA_TYPES: { value: DataType; label: string }[] = [
  { value: 'boolean', label: 'bool' },
  { value: 'int8', label: 'i8' },
  { value: 'int16', label: 'i16' },
  { value: 'int32', label: 'i32' },
  { value: 'uint8', label: 'u8' },
  { value: 'uint16', label: 'u16' },
  { value: 'uint32', label: 'u32' },
  { value: 'float', label: 'f32' },
  { value: 'double', label: 'f64' },
  { value: 'string', label: 'str' },
  { value: 'enum', label: 'enum' },
];

const SCOPE_COLORS: Record<VariableScope, string> = {
  input: '#22c55e',
  output: '#f97316',
  local: '#3b82f6',
  parameter: '#a855f7',
};

const NAME_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

const EMPTY_ARRAY: never[] = [];

export function VariableTable() {
  const chartId = useNavigationStore((s) =>
    s.activeView.type === 'chart' ? s.activeView.chartId : null
  );
  const variables = useProjectStore((s) => {
    if (!chartId || !s.currentProject) return EMPTY_ARRAY;
    const chart = s.currentProject.charts.find((c) => c.id === chartId);
    return chart?.variables ?? EMPTY_ARRAY;
  });
  const addVariableStore = useProjectStore((s) => s.addVariable);
  const updateVariableStore = useProjectStore((s) => s.updateVariable);
  const removeVariableStore = useProjectStore((s) => s.removeVariable);

  const addVariable = useCallback(
    (variable: Omit<Variable, 'id'>) => {
      if (!chartId) return '';
      return addVariableStore(chartId, variable);
    },
    [chartId, addVariableStore]
  );
  const updateVariable = useCallback(
    (varId: string, updates: Partial<Variable>) => {
      if (!chartId) return;
      updateVariableStore(chartId, varId, updates);
    },
    [chartId, updateVariableStore]
  );
  const removeVariable = useCallback(
    (varId: string) => {
      if (!chartId) return;
      removeVariableStore(chartId, varId);
    },
    [chartId, removeVariableStore]
  );

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [newRowId, setNewRowId] = useState<string | null>(null);
  const newNameRef = useRef<HTMLInputElement>(null);

  // Focus name input when a new row is added
  useEffect(() => {
    if (newRowId && newNameRef.current) {
      newNameRef.current.focus();
      newNameRef.current.select();
      const timer = setTimeout(() => setNewRowId(null), 0);
      return () => clearTimeout(timer);
    }
  }, [newRowId, variables]);

  const handleAdd = useCallback(() => {
    const id = addVariable({
      name: 'newVar',
      scope: 'local',
      dataType: 'int32',
      initialValue: '0',
      description: '',
    });
    setNewRowId(id);
  }, [addVariable]);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  if (variables.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-2 pt-2">
          <span className="text-xs font-medium text-muted-foreground">
            Variables (0)
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleAdd}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center text-sm text-muted-foreground flex-1">
          <p>No variables defined</p>
          <p className="text-xs mt-1">Click + to add a variable</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-2 pt-2">
        <span className="text-xs font-medium text-muted-foreground">
          Variables ({variables.length})
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleAdd}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <table className="w-full text-[10px] font-mono border-collapse">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left py-1 px-1 font-medium w-[3.2rem]">Scope</th>
              <th className="text-left py-1 px-1 font-medium">Name</th>
              <th className="text-left py-1 px-1 font-medium w-[3.2rem]">Type</th>
              <th className="text-left py-1 px-1 font-medium w-[3.5rem]">Init</th>
              <th className="w-5"></th>
            </tr>
          </thead>
          <tbody>
            {variables.map((v) => (
              <VariableRow
                key={v.id}
                variable={v}
                isExpanded={expandedIds.has(v.id)}
                onToggleExpand={() => toggleExpanded(v.id)}
                onUpdate={(updates) => updateVariable(v.id, updates)}
                onDelete={() => removeVariable(v.id)}
                nameRef={v.id === newRowId ? newNameRef : undefined}
              />
            ))}
          </tbody>
        </table>
      </ScrollArea>
    </div>
  );
}

function VariableRow({
  variable,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete,
  nameRef,
}: {
  variable: Variable;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<Variable>) => void;
  onDelete: () => void;
  nameRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const [localName, setLocalName] = useState(variable.name);
  const [localInit, setLocalInit] = useState(variable.initialValue);
  const [nameError, setNameError] = useState(false);

  // Sync from store when variable changes externally
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setLocalName(variable.name);
    setLocalInit(variable.initialValue);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [variable.name, variable.initialValue]);

  const commitName = useCallback(() => {
    const trimmed = localName.trim();
    if (!trimmed || !NAME_REGEX.test(trimmed)) {
      setNameError(true);
      // Revert to store value if empty
      if (!trimmed) {
        setLocalName(variable.name);
        setNameError(false);
      }
      return;
    }
    setNameError(false);
    if (trimmed !== variable.name) {
      onUpdate({ name: trimmed });
    }
  }, [localName, variable.name, onUpdate]);

  const commitInit = useCallback(() => {
    const trimmed = localInit.trim();
    if (trimmed !== variable.initialValue) {
      onUpdate({ initialValue: trimmed });
    }
  }, [localInit, variable.initialValue, onUpdate]);

  const handleKeyDown = (e: React.KeyboardEvent, commit: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
      (e.target as HTMLElement).blur();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setLocalName(variable.name);
      setLocalInit(variable.initialValue);
      setNameError(false);
      (e.target as HTMLElement).blur();
    }
  };

  const hasDetails = variable.description || variable.dataType === 'enum';

  return (
    <>
      <tr className="group hover:bg-accent/30 border-b border-border/20">
        {/* Scope */}
        <td className="py-0.5 px-1">
          <select
            value={variable.scope}
            onChange={(e) => onUpdate({ scope: e.target.value as VariableScope })}
            className="w-full bg-transparent border-0 outline-none text-[10px] font-mono font-medium cursor-pointer p-0 appearance-auto"
            style={{ color: SCOPE_COLORS[variable.scope] }}
          >
            {SCOPES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </td>

        {/* Name with expand toggle */}
        <td className="py-0.5 px-1">
          <div className="flex items-center gap-0.5">
            <button
              onClick={onToggleExpand}
              className="flex-shrink-0 p-0 text-muted-foreground/50 hover:text-muted-foreground"
              title={hasDetails ? 'Show details' : 'Add description'}
            >
              {isExpanded ? (
                <ChevronDown className="h-2.5 w-2.5" />
              ) : (
                <ChevronRight className="h-2.5 w-2.5" />
              )}
            </button>
            <input
              ref={nameRef}
              type="text"
              value={localName}
              onChange={(e) => {
                setLocalName(e.target.value);
                setNameError(false);
              }}
              onBlur={commitName}
              onKeyDown={(e) => handleKeyDown(e, commitName)}
              className={`w-full bg-transparent outline-none text-[10px] font-mono font-medium px-0.5 rounded ${nameError
                ? 'ring-1 ring-destructive text-destructive'
                : 'focus:ring-1 focus:ring-ring'
                }`}
              spellCheck={false}
            />
          </div>
        </td>

        {/* Data Type */}
        <td className="py-0.5 px-1">
          <select
            value={variable.dataType}
            onChange={(e) => {
              const newType = e.target.value as DataType;
              onUpdate({ dataType: newType });
              // Auto-expand when enum is selected
              if (newType === 'enum' && !isExpanded) {
                onToggleExpand();
              }
            }}
            className="w-full bg-transparent border-0 outline-none text-[10px] font-mono cursor-pointer p-0 text-muted-foreground appearance-auto"
          >
            {DATA_TYPES.map((dt) => (
              <option key={dt.value} value={dt.value}>
                {dt.label}
              </option>
            ))}
          </select>
        </td>

        {/* Initial Value */}
        <td className="py-0.5 px-1">
          <input
            type="text"
            value={localInit}
            onChange={(e) => setLocalInit(e.target.value)}
            onBlur={commitInit}
            onKeyDown={(e) => handleKeyDown(e, commitInit)}
            className="w-full bg-transparent outline-none text-[10px] font-mono text-muted-foreground px-0.5 rounded focus:ring-1 focus:ring-ring"
            placeholder="—"
            spellCheck={false}
          />
        </td>

        {/* Delete */}
        <td className="py-0.5 px-0.5">
          <button
            onClick={onDelete}
            className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10"
          >
            <Trash2 className="h-2.5 w-2.5 text-muted-foreground hover:text-destructive" />
          </button>
        </td>
      </tr>

      {/* Expandable detail row */}
      {isExpanded && (
        <ExpandedDetailRow variable={variable} onUpdate={onUpdate} />
      )}
    </>
  );
}

function ExpandedDetailRow({
  variable,
  onUpdate,
}: {
  variable: Variable;
  onUpdate: (updates: Partial<Variable>) => void;
}) {
  const [localDesc, setLocalDesc] = useState(variable.description);
  const [localEnum, setLocalEnum] = useState(
    variable.enumValues?.join(', ') ?? ''
  );

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setLocalDesc(variable.description);
    setLocalEnum(variable.enumValues?.join(', ') ?? '');
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [variable.description, variable.enumValues]);

  const commitDesc = useCallback(() => {
    const trimmed = localDesc.trim();
    if (trimmed !== variable.description) {
      onUpdate({ description: trimmed });
    }
  }, [localDesc, variable.description, onUpdate]);

  const commitEnum = useCallback(() => {
    const values = localEnum
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    const current = variable.enumValues ?? [];
    if (JSON.stringify(values) !== JSON.stringify(current)) {
      onUpdate({ enumValues: values });
    }
  }, [localEnum, variable.enumValues, onUpdate]);

  const handleKeyDown = (e: React.KeyboardEvent, commit: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
      (e.target as HTMLElement).blur();
    }
  };

  return (
    <tr className="bg-muted/30 border-b border-border/20">
      <td colSpan={5} className="px-2 py-1.5">
        <div className="space-y-1.5 pl-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-muted-foreground w-8 flex-shrink-0">
              Desc
            </span>
            <input
              type="text"
              value={localDesc}
              onChange={(e) => setLocalDesc(e.target.value)}
              onBlur={commitDesc}
              onKeyDown={(e) => handleKeyDown(e, commitDesc)}
              className="flex-1 bg-transparent outline-none text-[10px] font-mono px-1 py-0.5 rounded focus:ring-1 focus:ring-ring"
              placeholder="Description..."
              spellCheck={false}
            />
          </div>
          {variable.dataType === 'enum' && (
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-muted-foreground w-8 flex-shrink-0">
                Vals
              </span>
              <input
                type="text"
                value={localEnum}
                onChange={(e) => setLocalEnum(e.target.value)}
                onBlur={commitEnum}
                onKeyDown={(e) => handleKeyDown(e, commitEnum)}
                className="flex-1 bg-transparent outline-none text-[10px] font-mono px-1 py-0.5 rounded focus:ring-1 focus:ring-ring"
                placeholder="OFF, ON, ERROR"
                spellCheck={false}
              />
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
