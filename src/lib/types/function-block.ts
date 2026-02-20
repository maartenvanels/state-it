// ─── Function Block Definition System ─────────────────────────
// Declarative block definitions for math, logic, comparison,
// timing, and user-created function blocks.

export type BlockCategory =
  | 'math'
  | 'trigonometry'
  | 'comparison'
  | 'logic'
  | 'selection'
  | 'conversion'
  | 'timing';

export interface PortDef {
  id: string;
  name: string;
  dataType: 'number' | 'boolean';
}

export interface ParamDef {
  id: string;
  name: string;
  type: 'number' | 'select' | 'boolean';
  defaultValue: number | string | boolean;
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  step?: number;
}

export interface FunctionBlockDef {
  type: string;
  category: BlockCategory;
  name: string;
  symbol: string;
  description: string;
  inputs: PortDef[];
  outputs: PortDef[];
  params: ParamDef[];
  defaultSize: { width: number; height: number };
  isCustom?: boolean;

  execute: (
    inputs: Record<string, number>,
    params: Record<string, number | string | boolean>,
    state: Record<string, number>
  ) => { outputs: Record<string, number>; state: Record<string, number> };

  codeGen: {
    c: {
      expression?: string;
      includes?: string[];
      fbTemplate?: string;
    };
    scl: {
      expression?: string;
      iecFbType?: string;
      fbTemplate?: string;
    };
  };

  customExpression?: string;
}

// Per-instance config stored in SystemBlock.config
export interface FunctionBlockConfig {
  defType: string;
  params: Record<string, number | string | boolean>;
}

// ─── Category Display Metadata ────────────────────────────────

export const CATEGORY_COLORS: Record<BlockCategory, string> = {
  math: 'amber',
  trigonometry: 'amber',
  comparison: 'sky',
  logic: 'purple',
  selection: 'teal',
  conversion: 'slate',
  timing: 'rose',
};

export const CATEGORY_LABELS: Record<BlockCategory, string> = {
  math: 'Math',
  trigonometry: 'Trigonometry',
  comparison: 'Comparison',
  logic: 'Logic',
  selection: 'Selection',
  conversion: 'Conversion',
  timing: 'Timing / PLC',
};

// CSS class mappings for category colors
export const CATEGORY_COLOR_CLASSES: Record<BlockCategory, {
  border: string;
  bg: string;
  text: string;
  headerBg: string;
}> = {
  math: {
    border: 'border-amber-500',
    bg: 'bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    headerBg: 'bg-amber-500/20',
  },
  trigonometry: {
    border: 'border-amber-500',
    bg: 'bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    headerBg: 'bg-amber-500/20',
  },
  comparison: {
    border: 'border-sky-500',
    bg: 'bg-sky-500/10',
    text: 'text-sky-600 dark:text-sky-400',
    headerBg: 'bg-sky-500/20',
  },
  logic: {
    border: 'border-purple-500',
    bg: 'bg-purple-500/10',
    text: 'text-purple-600 dark:text-purple-400',
    headerBg: 'bg-purple-500/20',
  },
  selection: {
    border: 'border-teal-500',
    bg: 'bg-teal-500/10',
    text: 'text-teal-600 dark:text-teal-400',
    headerBg: 'bg-teal-500/20',
  },
  conversion: {
    border: 'border-slate-500',
    bg: 'bg-slate-500/10',
    text: 'text-slate-600 dark:text-slate-400',
    headerBg: 'bg-slate-500/20',
  },
  timing: {
    border: 'border-rose-500',
    bg: 'bg-rose-500/10',
    text: 'text-rose-600 dark:text-rose-400',
    headerBg: 'bg-rose-500/20',
  },
};
