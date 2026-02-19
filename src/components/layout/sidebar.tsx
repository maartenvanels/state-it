'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUIStore } from '@/lib/store/ui-store';
import { useCanvasStore } from '@/lib/store/canvas-store';
import { useProjectStore } from '@/lib/store/project-store';
import { useNavigationStore } from '@/lib/store/navigation-store';
import {
  GitBranchPlus,
  Database,
  ChevronRight,
  ChevronDown,
  BookOpen,
  StickyNote,
  LayoutGrid,
  Hash,
  Activity,
  LineChart,
  Monitor,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import type { CanvasNode } from '@/lib/types/canvas';
import { VariableTable } from '@/components/panels/variable-table';
import { HelpPanel } from '@/components/panels/help-panel';

export function Sidebar() {
  const leftPanelTab = useUIStore((s) => s.leftPanelTab);
  const setLeftPanelTab = useUIStore((s) => s.setLeftPanelTab);
  const nodes = useCanvasStore((s) => s.nodes);
  const activeView = useNavigationStore((s) => s.activeView);
  const isSystemView = activeView.type === 'system';

  const selectedNodeIds = useUIStore((s) => s.selectedNodeIds);
  const setSelection = useUIStore((s) => s.setSelection);
  const stateNodes = nodes.filter((n) => n.type === 'stateNode');
  const rootNodes = stateNodes.filter(
    (n) => n.type === 'stateNode' && !n.data.stateBlock.parentId
  );
  const annotationNodes = nodes.filter((n) => n.type === 'annotationNode');

  return (
    <div className="flex h-full flex-col">
      <Tabs
        value={leftPanelTab}
        onValueChange={(v) => setLeftPanelTab(v as 'hierarchy' | 'data' | 'help')}
        className="flex-1 flex flex-col"
      >
        <TabsList className="mx-2 mt-2 grid w-auto grid-cols-3">
          <TabsTrigger value="hierarchy" className="text-xs">
            {isSystemView ? (
              <><LayoutGrid className="mr-1 h-3 w-3" />Blocks</>
            ) : (
              <><GitBranchPlus className="mr-1 h-3 w-3" />States</>
            )}
          </TabsTrigger>
          <TabsTrigger value="data" className="text-xs">
            <Database className="mr-1 h-3 w-3" />
            Data
          </TabsTrigger>
          <TabsTrigger value="help" className="text-xs">
            <BookOpen className="mr-1 h-3 w-3" />
            Syntax
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hierarchy" className="flex-1 m-0">
          <ScrollArea className="h-full p-2">
            {isSystemView ? (
              <SystemBlockListPanel />
            ) : (
              <>
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
                {annotationNodes.length > 0 && (
                  <>
                    <Separator className="my-2" />
                    <div className="px-1 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      Annotations ({annotationNodes.length})
                    </div>
                    <div className="space-y-0.5">
                      {annotationNodes.map((node) => (
                        <button
                          key={node.id}
                          className={`flex w-full items-center rounded px-2 py-1 text-left text-xs transition-colors hover:bg-accent ${
                            selectedNodeIds.includes(node.id)
                              ? 'bg-accent text-accent-foreground font-medium'
                              : ''
                          }`}
                          onClick={() => setSelection([node.id], [])}
                        >
                          <StickyNote
                            className="mr-1.5 h-3 w-3 flex-shrink-0"
                            style={{ color: node.type === 'annotationNode' ? (node.data.color ?? '#fef08a') : undefined }}
                          />
                          <span className="truncate">
                            {node.type === 'annotationNode'
                              ? (node.data.content?.split('\n')[0]?.slice(0, 30) || 'Empty note')
                              : ''}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="data" className="flex-1 m-0">
          <VariableTable />
        </TabsContent>

        <TabsContent value="help" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <HelpPanel />
          </ScrollArea>
        </TabsContent>
      </Tabs>
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
  const nodeColor = node.data.stateBlock.color;

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
          } ${!nodeColor && isDefault ? 'border-blue-500 bg-blue-500/20' : !nodeColor ? 'border-foreground/50' : ''}`}
          style={nodeColor ? {
            borderColor: nodeColor,
            backgroundColor: `color-mix(in oklch, ${nodeColor} 30%, transparent)`,
          } : undefined}
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

function SystemBlockListPanel() {
  const charts = useProjectStore((s) => s.currentProject?.charts ?? []);
  const blocks = useProjectStore((s) => s.currentProject?.systemBlocks ?? []);
  const navigateToChart = useNavigationStore((s) => s.navigateToChart);
  const selectedNodeIds = useUIStore((s) => s.selectedNodeIds);
  const setSelection = useUIStore((s) => s.setSelection);

  const sourceBlocks = blocks.filter(
    (b) => b.type === 'constant' || b.type === 'signalGenerator'
  );
  const sinkBlocks = blocks.filter(
    (b) => b.type === 'scope' || b.type === 'display'
  );

  const blockIcon = (type: string) => {
    switch (type) {
      case 'constant': return <Hash className="mr-1.5 h-3 w-3 flex-shrink-0 text-emerald-600" />;
      case 'signalGenerator': return <Activity className="mr-1.5 h-3 w-3 flex-shrink-0 text-emerald-600" />;
      case 'scope': return <LineChart className="mr-1.5 h-3 w-3 flex-shrink-0 text-violet-600" />;
      case 'display': return <Monitor className="mr-1.5 h-3 w-3 flex-shrink-0 text-violet-600" />;
      default: return null;
    }
  };

  if (blocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center text-sm text-muted-foreground">
        <LayoutGrid className="mb-2 h-8 w-8 opacity-50" />
        <p>No blocks yet</p>
        <p className="text-xs mt-1">Click + to add a block</p>
      </div>
    );
  }

  return (
    <div>
      {/* Charts section */}
      {charts.length > 0 && (
        <>
          <div className="px-1 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Charts ({charts.length})
          </div>
          <div className="space-y-0.5 mb-2">
            {charts.map((chart) => {
              const block = blocks.find((b) => b.chartId === chart.id);
              const isSelected = block ? selectedNodeIds.includes(block.id) : false;
              return (
                <button
                  key={chart.id}
                  className={`flex w-full items-center rounded px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent ${
                    isSelected ? 'bg-accent text-accent-foreground font-medium' : ''
                  }`}
                  onClick={() => block && setSelection([block.id], [])}
                  onDoubleClick={() => navigateToChart(chart.id)}
                >
                  <LayoutGrid className="mr-1.5 h-3 w-3 flex-shrink-0 text-primary" />
                  <span className="truncate font-medium">{chart.name}</span>
                  <span className="ml-auto text-[9px] text-muted-foreground">
                    {chart.states.length} states
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Sources section */}
      {sourceBlocks.length > 0 && (
        <>
          <Separator className="my-2" />
          <div className="px-1 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Sources ({sourceBlocks.length})
          </div>
          <div className="space-y-0.5 mb-2">
            {sourceBlocks.map((block) => (
              <button
                key={block.id}
                className={`flex w-full items-center rounded px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent ${
                  selectedNodeIds.includes(block.id)
                    ? 'bg-accent text-accent-foreground font-medium'
                    : ''
                }`}
                onClick={() => setSelection([block.id], [])}
              >
                {blockIcon(block.type)}
                <span className="truncate">{block.name}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Sinks section */}
      {sinkBlocks.length > 0 && (
        <>
          <Separator className="my-2" />
          <div className="px-1 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Sinks ({sinkBlocks.length})
          </div>
          <div className="space-y-0.5">
            {sinkBlocks.map((block) => (
              <button
                key={block.id}
                className={`flex w-full items-center rounded px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent ${
                  selectedNodeIds.includes(block.id)
                    ? 'bg-accent text-accent-foreground font-medium'
                    : ''
                }`}
                onClick={() => setSelection([block.id], [])}
              >
                {blockIcon(block.type)}
                <span className="truncate">{block.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
