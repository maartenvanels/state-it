'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/lib/store/ui-store';
import { useCanvasStore } from '@/lib/store/canvas-store';
import { useProjectStore } from '@/lib/store/project-store';
import {
  GitBranchPlus,
  Database,
  ChevronRight,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import type { CanvasNode } from '@/lib/types/canvas';
import type { Variable } from '@/lib/types/variable';
import { VariableDialog } from '@/components/dialogs/variable-dialog';
import { DATA_TYPE_TO_C } from '@/lib/types/variable';

export function Sidebar() {
  const leftPanelTab = useUIStore((s) => s.leftPanelTab);
  const setLeftPanelTab = useUIStore((s) => s.setLeftPanelTab);
  const nodes = useCanvasStore((s) => s.nodes);
  const variables = useProjectStore((s) => s.currentProject?.variables ?? []);

  const stateNodes = nodes.filter((n) => n.type === 'stateNode');
  const rootNodes = stateNodes.filter(
    (n) => n.type === 'stateNode' && !n.data.stateBlock.parentId
  );

  const [varDialogOpen, setVarDialogOpen] = useState(false);
  const [editingVar, setEditingVar] = useState<Variable | null>(null);

  const handleAddVariable = () => {
    setEditingVar(null);
    setVarDialogOpen(true);
  };

  const handleEditVariable = (v: Variable) => {
    setEditingVar(v);
    setVarDialogOpen(true);
  };

  return (
    <div className="flex h-full flex-col">
      <Tabs
        value={leftPanelTab}
        onValueChange={(v) => setLeftPanelTab(v as 'hierarchy' | 'data')}
        className="flex-1 flex flex-col"
      >
        <TabsList className="mx-2 mt-2 grid w-auto grid-cols-2">
          <TabsTrigger value="hierarchy" className="text-xs">
            <GitBranchPlus className="mr-1 h-3 w-3" />
            States
          </TabsTrigger>
          <TabsTrigger value="data" className="text-xs">
            <Database className="mr-1 h-3 w-3" />
            Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hierarchy" className="flex-1 m-0">
          <ScrollArea className="h-full p-2">
            {stateNodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-sm text-muted-foreground">
                <GitBranchPlus className="mb-2 h-8 w-8 opacity-50" />
                <p>No states yet</p>
                <p className="text-xs mt-1">
                  Click + or press S to add a state
                </p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {rootNodes.map((node) => (
                  <StateTreeItem key={node.id} node={node} depth={0} />
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="data" className="flex-1 m-0">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-2 pt-2">
              <span className="text-xs font-medium text-muted-foreground">
                Variables ({variables.length})
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleAddVariable}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            <ScrollArea className="flex-1 p-2">
              {variables.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-sm text-muted-foreground">
                  <Database className="mb-2 h-8 w-8 opacity-50" />
                  <p>No variables defined</p>
                  <p className="text-xs mt-1">Click + to add a variable</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {variables.map((v) => (
                    <VariableItem
                      key={v.id}
                      variable={v}
                      onEdit={handleEditVariable}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>

      <VariableDialog
        open={varDialogOpen}
        onOpenChange={setVarDialogOpen}
        editVariable={editingVar}
      />
    </div>
  );
}

function VariableItem({
  variable,
  onEdit,
}: {
  variable: Variable;
  onEdit: (v: Variable) => void;
}) {
  const removeVariable = useProjectStore((s) => s.removeVariable);

  const scopeColor: Record<string, string> = {
    input: 'text-green-500',
    output: 'text-orange-500',
    local: 'text-blue-500',
    parameter: 'text-purple-500',
  };

  return (
    <div className="group flex items-center gap-1.5 rounded px-2 py-1.5 hover:bg-accent text-xs">
      <span
        className={`text-[10px] font-medium uppercase w-6 flex-shrink-0 ${scopeColor[variable.scope] ?? ''}`}
      >
        {variable.scope.substring(0, 3)}
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-mono font-medium truncate">{variable.name}</div>
        <div className="text-[10px] text-muted-foreground">
          {DATA_TYPE_TO_C[variable.dataType]}
          {variable.initialValue && ` = ${variable.initialValue}`}
        </div>
      </div>
      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="p-0.5 rounded hover:bg-accent-foreground/10"
          onClick={() => onEdit(variable)}
        >
          <Pencil className="h-3 w-3 text-muted-foreground" />
        </button>
        <button
          className="p-0.5 rounded hover:bg-destructive/10"
          onClick={() => removeVariable(variable.id)}
        >
          <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
        </button>
      </div>
    </div>
  );
}

function StateTreeItem({ node, depth }: { node: CanvasNode; depth: number }) {
  const nodes = useCanvasStore((s) => s.nodes);
  const selectedNodeIds = useUIStore((s) => s.selectedNodeIds);
  const setSelection = useUIStore((s) => s.setSelection);
  const [expanded, setExpanded] = useState(true);

  if (node.type !== 'stateNode') return null;

  const children = nodes.filter(
    (n) => n.type === 'stateNode' && n.parentId === node.id
  );
  const hasChildren = children.length > 0;
  const isSelected = selectedNodeIds.includes(node.id);
  const isDefault = node.data.stateBlock.isDefault;
  const isParallel = node.data.stateBlock.decomposition === 'parallel';

  return (
    <div>
      <button
        className={`flex w-full items-center rounded px-1 py-1 text-left text-xs transition-colors hover:bg-accent ${
          isSelected ? 'bg-accent text-accent-foreground font-medium' : ''
        }`}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
        onClick={() => setSelection([node.id], [])}
      >
        {hasChildren ? (
          <button
            className="mr-0.5 p-0.5 rounded hover:bg-accent-foreground/10"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        ) : (
          <span className="w-4 mr-0.5" />
        )}

        <div
          className={`mr-1.5 h-3 w-3 rounded-sm border flex-shrink-0 ${
            isParallel ? 'border-dashed' : 'border-solid'
          } ${isDefault ? 'border-blue-500 bg-blue-500/20' : 'border-foreground/50'}`}
        />

        <span className="truncate">{node.data.stateBlock.name}</span>

        {isParallel && (
          <span className="ml-auto text-[9px] text-muted-foreground px-1 bg-muted rounded">
            AND
          </span>
        )}
        {hasChildren && !isParallel && (
          <span className="ml-auto text-[9px] text-muted-foreground">
            {children.length}
          </span>
        )}
      </button>

      {hasChildren && expanded && (
        <div className="relative">
          <div
            className="absolute left-0 top-0 bottom-0 border-l border-border/50"
            style={{ marginLeft: `${depth * 16 + 12}px` }}
          />
          {children.map((child) => (
            <StateTreeItem key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
