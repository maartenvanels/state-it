import type { ASTNode } from './types';
import { parse, parseExpression } from './parser';

/**
 * Runtime variable context for evaluation.
 */
export interface EvalContext {
  /** Variable name → value */
  variables: Record<string, number | boolean | string>;
  /** Tick count since entering current state */
  stateTickCount: number;
  /** Cycle time in milliseconds (for sec/ms temporal conversion) */
  cycleTimeMs: number;
}

export function createDefaultContext(): EvalContext {
  return {
    variables: {},
    stateTickCount: 0,
    cycleTimeMs: 10,
  };
}

/**
 * Evaluate a condition string against a context.
 * Returns true/false, or null if parsing fails or expression is empty.
 */
export function evaluateCondition(
  input: string,
  ctx: EvalContext
): boolean | null {
  if (!input.trim()) return null;
  const { node, errors } = parseExpression(input);
  if (!node || errors.length > 0) return null;
  try {
    const result = evaluate(node, ctx);
    return Boolean(result);
  } catch {
    return null;
  }
}

/**
 * Execute a statement string (actions), mutating the context variables.
 * Returns the list of executed action descriptions.
 */
export function executeStatements(
  input: string,
  ctx: EvalContext
): string[] {
  if (!input.trim()) return [];
  const { statements, errors } = parse(input);
  if (errors.length > 0) return [`Error: ${errors[0].message}`];

  const executed: string[] = [];
  for (const stmt of statements) {
    try {
      executeStatement(stmt, ctx);
      executed.push(formatStatement(stmt));
    } catch (e) {
      executed.push(`Error: ${e instanceof Error ? e.message : 'unknown'}`);
    }
  }
  return executed;
}

/**
 * Evaluate an AST node to a runtime value.
 */
function evaluate(node: ASTNode, ctx: EvalContext): number | boolean | string {
  switch (node.type) {
    case 'number':
      return node.value;

    case 'boolean':
      return node.value;

    case 'string':
      return node.value;

    case 'identifier': {
      const val = ctx.variables[node.name];
      if (val === undefined) return 0; // undefined variables default to 0
      return val;
    }

    case 'binary':
      return evaluateBinary(node.op, evaluate(node.left, ctx), evaluate(node.right, ctx));

    case 'unary': {
      const operand = evaluate(node.operand, ctx);
      switch (node.op) {
        case '!': return !operand;
        case '~': return typeof operand === 'number' ? ~operand : !operand;
        case '-': return typeof operand === 'number' ? -operand : 0;
      }
      return 0;
    }

    case 'call':
      return evaluateCall(node.name, node.args.map((a) => evaluate(a, ctx)));

    case 'temporal': {
      const count = Number(evaluate(node.count, ctx));
      const ticks = convertToTicks(count, node.unit, ctx.cycleTimeMs);
      switch (node.kind) {
        case 'after': return ctx.stateTickCount >= ticks;
        case 'before': return ctx.stateTickCount < ticks;
        case 'every': return ticks > 0 && ctx.stateTickCount % ticks === 0;
        case 'at': return ctx.stateTickCount === ticks;
      }
      return false;
    }

    case 'elapsed':
      return ctx.stateTickCount;

    case 'assignment':
    case 'postfix':
      // Side-effect nodes — execute and return the new value
      return executeStatement(node, ctx);
  }
}

function executeStatement(node: ASTNode, ctx: EvalContext): number | boolean | string {
  switch (node.type) {
    case 'assignment': {
      const val = evaluate(node.value, ctx);
      const current = ctx.variables[node.target] ?? 0;
      switch (node.op) {
        case '=':
          ctx.variables[node.target] = val;
          return val;
        case '+=':
          ctx.variables[node.target] = (current as number) + (val as number);
          return ctx.variables[node.target];
        case '-=':
          ctx.variables[node.target] = (current as number) - (val as number);
          return ctx.variables[node.target];
        case '*=':
          ctx.variables[node.target] = (current as number) * (val as number);
          return ctx.variables[node.target];
        case '/=':
          ctx.variables[node.target] = (val as number) !== 0 ? (current as number) / (val as number) : 0;
          return ctx.variables[node.target];
        case '%=':
          ctx.variables[node.target] = (val as number) !== 0 ? (current as number) % (val as number) : 0;
          return ctx.variables[node.target];
      }
      return 0;
    }

    case 'postfix': {
      const current = (ctx.variables[node.target] as number) ?? 0;
      const newVal = node.op === '++' ? current + 1 : current - 1;
      ctx.variables[node.target] = newVal;
      return current; // postfix returns old value
    }

    default:
      return evaluate(node, ctx);
  }
}

function evaluateBinary(
  op: string,
  left: number | boolean | string,
  right: number | boolean | string
): number | boolean | string {
  const l = Number(left);
  const r = Number(right);

  switch (op) {
    case '+': return typeof left === 'string' || typeof right === 'string'
      ? `${left}${right}` : l + r;
    case '-': return l - r;
    case '*': return l * r;
    case '/': return r !== 0 ? l / r : 0;
    case '%': return r !== 0 ? l % r : 0;
    case '==': return left === right || l === r;
    case '!=': return left !== right && l !== r;
    case '<': return l < r;
    case '<=': return l <= r;
    case '>': return l > r;
    case '>=': return l >= r;
    case '&&': return Boolean(left) && Boolean(right);
    case '||': return Boolean(left) || Boolean(right);
    case '&': return l & r;
    case '|': return l | r;
    case '^': return l ^ r;
    case '<<': return l << r;
    case '>>': return l >> r;
  }
  return 0;
}

function evaluateCall(name: string, args: (number | boolean | string)[]): number {
  const nums = args.map(Number);
  switch (name) {
    case 'abs': return Math.abs(nums[0]);
    case 'min': return Math.min(nums[0], nums[1]);
    case 'max': return Math.max(nums[0], nums[1]);
    case 'sqrt': return Math.sqrt(nums[0]);
    case 'limit': return Math.min(Math.max(nums[1], nums[0]), nums[2]);
    case 'toInt': return Math.trunc(nums[0]);
    case 'toReal': return nums[0];
    case 'toBool': return nums[0] ? 1 : 0;
    default: return 0;
  }
}

function convertToTicks(count: number, unit: string, cycleTimeMs: number): number {
  switch (unit) {
    case 'tick': return count;
    case 'ms': return Math.round(count / cycleTimeMs);
    case 'sec': return Math.round((count * 1000) / cycleTimeMs);
    default: return count;
  }
}

function formatStatement(node: ASTNode): string {
  switch (node.type) {
    case 'assignment':
      return `${node.target} ${node.op} ...`;
    case 'postfix':
      return `${node.target}${node.op}`;
    case 'call':
      return `${node.name}(...)`;
    default:
      return 'expression';
  }
}
