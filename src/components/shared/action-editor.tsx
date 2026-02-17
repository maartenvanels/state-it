'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import type { ActionBlock } from '@/lib/types/state';
import { generateId } from '@/lib/utils/id-generator';

interface ActionEditorProps {
  label: string;
  color: string;
  actions: ActionBlock[];
  onChange: (actions: ActionBlock[]) => void;
}

export function ActionEditor({
  label,
  color,
  actions,
  onChange,
}: ActionEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const addAction = useCallback(() => {
    const newAction: ActionBlock = {
      id: generateId(),
      code: '',
      order: actions.length,
    };
    onChange([...actions, newAction]);
    setEditingId(newAction.id);
  }, [actions, onChange]);

  const updateAction = useCallback(
    (id: string, code: string) => {
      onChange(
        actions.map((a) => (a.id === id ? { ...a, code } : a))
      );
    },
    [actions, onChange]
  );

  const removeAction = useCallback(
    (id: string) => {
      onChange(actions.filter((a) => a.id !== id));
    },
    [actions, onChange]
  );

  const handleBlur = useCallback(
    (id: string, code: string) => {
      setEditingId(null);
      if (!code.trim()) {
        removeAction(id);
      }
    },
    [removeAction]
  );

  return (
    <div className="rounded border border-dashed p-2 space-y-1">
      <div className="flex items-center justify-between">
        <span className={color}>{label}:</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={addAction}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {actions.length === 0 ? (
        <div className="text-muted-foreground/50 italic text-[10px] ml-1">
          Click + to add action
        </div>
      ) : (
        actions.map((action) => (
          <div key={action.id} className="flex items-center gap-1 group">
            {editingId === action.id ? (
              <input
                className="flex-1 bg-transparent text-[11px] font-mono outline-none ring-1 ring-blue-500 rounded px-1 py-0.5"
                value={action.code}
                onChange={(e) => updateAction(action.id, e.target.value)}
                onBlur={() => handleBlur(action.id, action.code)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleBlur(action.id, action.code);
                  }
                  if (e.key === 'Escape') {
                    setEditingId(null);
                  }
                }}
                autoFocus
              />
            ) : (
              <button
                className="flex-1 text-left text-[11px] font-mono px-1 py-0.5 rounded hover:bg-accent truncate"
                onClick={() => setEditingId(action.id)}
              >
                {action.code || <span className="italic opacity-50">empty</span>}
              </button>
            )}
            <button
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => removeAction(action.id)}
            >
              <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        ))
      )}
    </div>
  );
}
