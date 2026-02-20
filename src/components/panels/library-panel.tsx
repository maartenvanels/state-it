'use client';

import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ChevronRight, ChevronDown, Search, Plus, Trash2 } from 'lucide-react';
import { CreateBlockDialog } from '@/components/dialogs/create-block-dialog';
import { removeCustomBlock } from '@/lib/blocks/custom-blocks';
import { getAllCategories, getBlocksByCategory } from '@/lib/blocks/registry';
import '@/lib/blocks'; // ensure built-in blocks are registered
import {
  CATEGORY_LABELS,
  CATEGORY_COLOR_CLASSES,
  type BlockCategory,
  type FunctionBlockDef,
} from '@/lib/types/function-block';
import { cn } from '@/lib/utils';

export function LibraryPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    () => new Set(['math'])
  );
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [, forceUpdate] = useState(0);

  const categories = getAllCategories();

  const toggleCategory = useCallback((cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const handleDragStart = useCallback(
    (event: React.DragEvent, defType: string) => {
      event.dataTransfer.setData('application/function-block', defType);
      event.dataTransfer.effectAllowed = 'move';
    },
    []
  );

  const query = searchQuery.toLowerCase().trim();

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-2 pb-1">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search blocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 pl-7 text-xs"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-auto p-2 pt-1 space-y-1">
        {categories.map((cat) => (
          <CategorySection
            key={cat}
            category={cat}
            expanded={expandedCategories.has(cat) || query.length > 0}
            onToggle={() => toggleCategory(cat)}
            searchQuery={query}
            onDragStart={handleDragStart}
            onRemoveCustom={(defType) => {
              removeCustomBlock(defType);
              forceUpdate((n) => n + 1);
            }}
          />
        ))}

        {/* Custom blocks section */}
        <Separator className="my-2" />
        <Button
          variant="outline"
          size="sm"
          className="w-full h-7 text-xs"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="mr-1 h-3 w-3" />
          Create Custom Block
        </Button>
      </div>

      <CreateBlockDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreated={() => forceUpdate((n) => n + 1)}
      />
    </div>
  );
}

function CategorySection({
  category,
  expanded,
  onToggle,
  searchQuery,
  onDragStart,
  onRemoveCustom,
}: {
  category: BlockCategory;
  expanded: boolean;
  onToggle: () => void;
  searchQuery: string;
  onDragStart: (event: React.DragEvent, defType: string) => void;
  onRemoveCustom: (defType: string) => void;
}) {
  const allBlocks = getBlocksByCategory(category);
  const colors = CATEGORY_COLOR_CLASSES[category];

  const blocks = searchQuery
    ? allBlocks.filter(
        (b) =>
          b.name.toLowerCase().includes(searchQuery) ||
          b.symbol.toLowerCase().includes(searchQuery) ||
          b.description.toLowerCase().includes(searchQuery)
      )
    : allBlocks;

  if (searchQuery && blocks.length === 0) return null;

  return (
    <div>
      <button
        className="flex w-full items-center gap-1 rounded px-1 py-1 text-xs font-medium hover:bg-accent transition-colors"
        onClick={onToggle}
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3 flex-shrink-0" />
        ) : (
          <ChevronRight className="h-3 w-3 flex-shrink-0" />
        )}
        <span className={cn(colors.text)}>{CATEGORY_LABELS[category]}</span>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {blocks.length}
        </span>
      </button>

      {expanded && (
        <div className="grid grid-cols-3 gap-1 pl-1 pr-1 pb-1">
          {blocks.map((block) => (
            <LibraryItem
              key={block.type}
              block={block}
              onDragStart={onDragStart}
              onRemove={block.isCustom ? () => onRemoveCustom(block.type) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LibraryItem({
  block,
  onDragStart,
  onRemove,
}: {
  block: FunctionBlockDef;
  onDragStart: (event: React.DragEvent, defType: string) => void;
  onRemove?: () => void;
}) {
  const colors = CATEGORY_COLOR_CLASSES[block.category];

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, block.type)}
      className={cn(
        'relative flex flex-col items-center justify-center rounded border cursor-grab',
        'py-1.5 px-1 hover:bg-accent/50 transition-colors select-none',
        'active:cursor-grabbing group',
        colors.bg,
        'border-border/50'
      )}
      title={block.description}
    >
      {onRemove && (
        <button
          className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground hidden group-hover:flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onRemove();
          }}
          title="Remove custom block"
        >
          <Trash2 className="h-2.5 w-2.5" />
        </button>
      )}
      <span className={cn('text-sm font-bold leading-none', colors.text)}>
        {block.symbol}
      </span>
      <span className="text-[9px] text-muted-foreground mt-0.5 truncate w-full text-center">
        {block.name}
      </span>
    </div>
  );
}
