'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Sparkles } from 'lucide-react';
import { saveCustomBlock, detectInputNames } from '@/lib/blocks/custom-blocks';
import {
  CATEGORY_LABELS,
  CATEGORY_COLOR_CLASSES,
  type BlockCategory,
} from '@/lib/types/function-block';
import { cn } from '@/lib/utils';

interface CreateBlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (defType: string) => void;
}

const CATEGORIES: { value: BlockCategory; label: string }[] = [
  { value: 'math', label: 'Math' },
  { value: 'trigonometry', label: 'Trigonometry' },
  { value: 'comparison', label: 'Comparison' },
  { value: 'logic', label: 'Logic' },
  { value: 'selection', label: 'Selection' },
  { value: 'conversion', label: 'Conversion' },
  { value: 'timing', label: 'Timing / PLC' },
];

export function CreateBlockDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateBlockDialogProps) {
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('f');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<BlockCategory>('math');
  const [expression, setExpression] = useState('');
  const [outputName, setOutputName] = useState('Out');

  const detectedInputs = useMemo(
    () => detectInputNames(expression),
    [expression]
  );

  const validationError = useMemo(() => {
    if (!name.trim()) return 'Name is required';
    if (!symbol.trim()) return 'Symbol is required';
    if (!expression.trim()) return 'Expression is required';
    if (detectedInputs.length === 0) return 'Expression must contain at least one variable';
    // Basic validation: try evaluating with dummy values
    try {
      const vars: Record<string, number> = {};
      detectedInputs.forEach((v) => { vars[v] = 1; });
      let testExpr = expression
        .replace(/\babs\b/gi, 'Math.abs')
        .replace(/\bsqrt\b/gi, 'Math.sqrt')
        .replace(/\bsin\b/gi, 'Math.sin')
        .replace(/\bcos\b/gi, 'Math.cos')
        .replace(/\btan\b/gi, 'Math.tan')
        .replace(/\bmin\b/gi, 'Math.min')
        .replace(/\bmax\b/gi, 'Math.max')
        .replace(/\bfloor\b/gi, 'Math.floor')
        .replace(/\bceil\b/gi, 'Math.ceil')
        .replace(/\bround\b/gi, 'Math.round')
        .replace(/\bPI\b/g, 'Math.PI');
      for (const [v, val] of Object.entries(vars)) {
        testExpr = testExpr.replace(new RegExp(`\\b${v}\\b`, 'g'), String(val));
      }
      // eslint-disable-next-line no-new-func
      const result = new Function(`return (${testExpr});`)();
      if (typeof result !== 'number' || !isFinite(result)) {
        return 'Expression does not evaluate to a finite number';
      }
    } catch (e) {
      return `Invalid expression: ${(e as Error).message}`;
    }
    return null;
  }, [name, symbol, expression, detectedInputs]);

  const handleCreate = () => {
    if (validationError) return;
    const def = saveCustomBlock(
      name.trim(),
      symbol.trim(),
      description.trim() || `Custom block: ${expression}`,
      category,
      expression.trim(),
      detectedInputs,
      outputName.trim() || 'Out'
    );
    onCreated?.(def.type);
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setName('');
    setSymbol('f');
    setDescription('');
    setCategory('math');
    setExpression('');
    setOutputName('Out');
  };

  const colors = CATEGORY_COLOR_CLASSES[category];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Create Custom Block
          </DialogTitle>
          <DialogDescription>
            Define a custom function block with a mathematical expression.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Name & Symbol row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. WeightedSum"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Symbol</Label>
              <Input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="f(x)"
                className="h-8 text-sm text-center font-bold"
                maxLength={4}
              />
            </div>
          </div>

          {/* Category & Output */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as BlockCategory)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Output Name</Label>
              <Input
                value={outputName}
                onChange={(e) => setOutputName(e.target.value)}
                placeholder="Out"
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="h-8 text-sm"
            />
          </div>

          <Separator />

          {/* Expression */}
          <div className="space-y-1.5">
            <Label className="text-xs">Expression</Label>
            <Textarea
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="e.g. (A + B) * C"
              className="font-mono text-sm min-h-[60px] resize-none"
              rows={2}
            />
            <p className="text-[10px] text-muted-foreground">
              Use variable names (A, B, C...) as inputs. Supported: +, -, *, /, **, abs, sqrt, sin, cos, tan, min, max, floor, ceil, round, PI
            </p>
          </div>

          {/* Detected inputs */}
          {detectedInputs.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Detected Inputs</Label>
              <div className="flex flex-wrap gap-1">
                {detectedInputs.map((inp) => (
                  <Badge key={inp} variant="secondary" className="text-xs font-mono">
                    {inp}
                  </Badge>
                ))}
                <span className="text-xs text-muted-foreground ml-1 self-center">
                  → {outputName || 'Out'}
                </span>
              </div>
            </div>
          )}

          {/* Preview */}
          {name && symbol && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Preview</Label>
              <div className="flex items-center justify-center">
                <div
                  className={cn(
                    'rounded border px-6 py-3 text-center',
                    colors.bg,
                    'border-border/50'
                  )}
                >
                  <span className={cn('text-xl font-bold block', colors.text)}>
                    {symbol}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{name}</span>
                </div>
              </div>
            </div>
          )}

          {/* Validation error */}
          {validationError && expression.trim() && (
            <div className="flex items-start gap-2 rounded bg-destructive/10 p-2">
              <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">{validationError}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!!validationError}>
            Create Block
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
