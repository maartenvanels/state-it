import type { FunctionBlockDef, BlockCategory } from '../types/function-block';
import { registerBlock, unregisterBlock } from './registry';

const STORAGE_KEY = 'states_custom_blocks';

interface StoredCustomBlock {
  type: string;
  category: BlockCategory;
  name: string;
  symbol: string;
  description: string;
  inputNames: string[];
  outputName: string;
  expression: string;
  createdAt: string;
}

/**
 * Build an executable FunctionBlockDef from a stored custom block definition.
 */
function buildCustomDef(stored: StoredCustomBlock): FunctionBlockDef {
  const inputs = stored.inputNames.map((name, i) => ({
    id: `in${i + 1}`,
    name,
    dataType: 'number' as const,
  }));

  // Build the execute function from the expression
  // Expression uses variable names (A, B, C...) which map to inputs
  const execute = buildExecuteFunction(stored.expression, stored.inputNames);

  // Build code gen expressions
  const cExpr = buildCExpression(stored.expression, stored.inputNames);
  const sclExpr = buildSCLExpression(stored.expression, stored.inputNames);

  return {
    type: stored.type,
    category: stored.category,
    name: stored.name,
    symbol: stored.symbol,
    description: stored.description,
    inputs,
    outputs: [{ id: 'out', name: stored.outputName, dataType: 'number' }],
    params: [],
    defaultSize: { width: 120, height: 70 + inputs.length * 5 },
    isCustom: true,
    customExpression: stored.expression,
    execute,
    codeGen: {
      c: { expression: cExpr },
      scl: { expression: sclExpr },
    },
  };
}

/**
 * Build an execute function from an expression string.
 * Supported operators: +, -, *, /, **, %, (, )
 * Supported functions: abs, sqrt, sin, cos, tan, min, max, floor, ceil, round
 */
function buildExecuteFunction(
  expression: string,
  inputNames: string[]
): FunctionBlockDef['execute'] {
  return (inputs, _params, state) => {
    try {
      // Map input names to values
      const vars: Record<string, number> = {};
      inputNames.forEach((name, i) => {
        vars[name] = inputs[`in${i + 1}`] ?? 0;
      });

      const result = evaluateExpression(expression, vars);
      return { outputs: { out: result }, state };
    } catch {
      return { outputs: { out: 0 }, state };
    }
  };
}

/**
 * Simple expression evaluator using Function constructor.
 * Only allows safe math operations.
 */
function evaluateExpression(expr: string, vars: Record<string, number>): number {
  // Replace known math functions with Math.* calls
  let safeExpr = expr
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
    .replace(/\bPI\b/g, 'Math.PI')
    .replace(/\bE\b/g, 'Math.E');

  // Replace variable names with values
  for (const [name, value] of Object.entries(vars)) {
    safeExpr = safeExpr.replace(new RegExp(`\\b${name}\\b`, 'g'), String(value));
  }

  // Validate: only allow numbers, operators, parens, dots, Math.*
  const sanitized = safeExpr.replace(/Math\.\w+/g, '0');
  if (!/^[\d\s+\-*/().,%^]+$/.test(sanitized)) {
    return 0;
  }

  // eslint-disable-next-line no-new-func
  const fn = new Function(`return (${safeExpr});`);
  const result = fn();
  return typeof result === 'number' && isFinite(result) ? result : 0;
}

/**
 * Build a C expression from the user expression.
 * Maps input names to {in1}, {in2} etc.
 */
function buildCExpression(expression: string, inputNames: string[]): string {
  let expr = expression;
  // Replace function names with C equivalents
  expr = expr
    .replace(/\babs\b/gi, 'fabsf')
    .replace(/\bsqrt\b/gi, 'sqrtf')
    .replace(/\bsin\b/gi, 'sinf')
    .replace(/\bcos\b/gi, 'cosf')
    .replace(/\btan\b/gi, 'tanf')
    .replace(/\bmin\b/gi, 'fminf')
    .replace(/\bmax\b/gi, 'fmaxf')
    .replace(/\bfloor\b/gi, 'floorf')
    .replace(/\bceil\b/gi, 'ceilf')
    .replace(/\bround\b/gi, 'roundf')
    .replace(/\bPI\b/g, '3.14159265f')
    .replace(/\*\*/g, ' /* pow */ ');

  // Replace variable names with {inN} placeholders
  inputNames.forEach((name, i) => {
    expr = expr.replace(new RegExp(`\\b${name}\\b`, 'g'), `{in${i + 1}}`);
  });

  return `(${expr})`;
}

/**
 * Build an SCL expression from the user expression.
 * Maps input names to {in1}, {in2} etc.
 */
function buildSCLExpression(expression: string, inputNames: string[]): string {
  let expr = expression;
  expr = expr
    .replace(/\babs\b/gi, 'ABS')
    .replace(/\bsqrt\b/gi, 'SQRT')
    .replace(/\bsin\b/gi, 'SIN')
    .replace(/\bcos\b/gi, 'COS')
    .replace(/\btan\b/gi, 'TAN')
    .replace(/\bmin\b/gi, 'MIN')
    .replace(/\bmax\b/gi, 'MAX')
    .replace(/\bfloor\b/gi, 'FLOOR')
    .replace(/\bceil\b/gi, 'CEIL')
    .replace(/\bround\b/gi, 'ROUND')
    .replace(/\bPI\b/g, '3.14159265')
    .replace(/\*\*/g, '**');

  inputNames.forEach((name, i) => {
    expr = expr.replace(new RegExp(`\\b${name}\\b`, 'g'), `{in${i + 1}}`);
  });

  return `(${expr})`;
}

/**
 * Auto-detect variable names from an expression.
 * Returns uppercase single letters and multi-letter identifiers
 * that aren't known functions.
 */
export function detectInputNames(expression: string): string[] {
  const knownFunctions = new Set([
    'abs', 'sqrt', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
    'min', 'max', 'floor', 'ceil', 'round', 'pi', 'e',
    'math', 'true', 'false',
  ]);

  const identifiers = expression.match(/\b[A-Za-z_]\w*\b/g) ?? [];
  const unique = [...new Set(identifiers)].filter(
    (id) => !knownFunctions.has(id.toLowerCase())
  );

  return unique.sort();
}

// ─── localStorage persistence ───────────────────────────────

function loadStored(): StoredCustomBlock[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStored(blocks: StoredCustomBlock[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(blocks));
}

/**
 * Load all custom blocks from localStorage and register them in the block registry.
 */
export function loadCustomBlocks(): FunctionBlockDef[] {
  const stored = loadStored();
  const defs: FunctionBlockDef[] = [];
  for (const s of stored) {
    const def = buildCustomDef(s);
    registerBlock(def);
    defs.push(def);
  }
  return defs;
}

/**
 * Save a new custom block to localStorage and register it.
 */
export function saveCustomBlock(
  name: string,
  symbol: string,
  description: string,
  category: BlockCategory,
  expression: string,
  inputNames: string[],
  outputName: string
): FunctionBlockDef {
  const type = `custom.${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now() % 10000}`;

  const stored: StoredCustomBlock = {
    type,
    category,
    name,
    symbol,
    description,
    inputNames,
    outputName,
    expression,
    createdAt: new Date().toISOString(),
  };

  const all = loadStored();
  all.push(stored);
  saveStored(all);

  const def = buildCustomDef(stored);
  registerBlock(def);
  return def;
}

/**
 * Remove a custom block from localStorage and unregister it.
 */
export function removeCustomBlock(defType: string): void {
  const all = loadStored();
  const filtered = all.filter((b) => b.type !== defType);
  saveStored(filtered);
  unregisterBlock(defType);
}

/**
 * Get all stored custom blocks (without loading into registry).
 */
export function getCustomBlockDefs(): FunctionBlockDef[] {
  return loadStored().map(buildCustomDef);
}

/**
 * Export custom library as JSON.
 */
export function exportCustomLibrary(): string {
  return JSON.stringify(loadStored(), null, 2);
}

/**
 * Import custom library from JSON.
 */
export function importCustomLibrary(json: string): number {
  const imported: StoredCustomBlock[] = JSON.parse(json);
  const existing = loadStored();
  const existingTypes = new Set(existing.map((b) => b.type));

  let count = 0;
  for (const block of imported) {
    if (!existingTypes.has(block.type)) {
      existing.push(block);
      const def = buildCustomDef(block);
      registerBlock(def);
      count++;
    }
  }

  saveStored(existing);
  return count;
}
