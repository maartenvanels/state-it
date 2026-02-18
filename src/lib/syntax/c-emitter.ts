import type { ASTNode } from './types';

export interface CEmitOptions {
  /** Prefix for variable access, e.g. "sm->" */
  varPrefix?: string;
  /** Set of known variable names (to apply prefix) */
  variables?: Set<string>;
}

/**
 * Emit a single AST node as a C expression string.
 */
export function emitC(node: ASTNode, opts: CEmitOptions = {}): string {
  const vp = opts.varPrefix ?? 'sm->';
  const vars = opts.variables;

  function v(name: string): string {
    if (vars && !vars.has(name)) return name;
    return `${vp}${name}`;
  }

  function emit(n: ASTNode): string {
    switch (n.type) {
      case 'number':
        return n.raw;

      case 'boolean':
        return n.value ? 'true' : 'false';

      case 'string':
        return `"${n.value}"`;

      case 'identifier':
        return v(n.name);

      case 'binary': {
        const left = emit(n.left);
        const right = emit(n.right);
        return `(${left} ${n.op} ${right})`;
      }

      case 'unary':
        return `${n.op}${emit(n.operand)}`;

      case 'assignment': {
        const target = v(n.target);
        const val = emit(n.value);
        if (n.op === '=') return `${target} = ${val}`;
        return `${target} ${n.op} ${val}`;
      }

      case 'postfix':
        return `${v(n.target)}${n.op}`;

      case 'call':
        return emitCallC(n.name, n.args.map(emit));

      case 'temporal':
        return emitTemporalC(n);

      case 'elapsed':
        return `${vp}_stateTickCount`;
    }
  }

  return emit(node);
}

/**
 * Emit a statement (expression + semicolon) as C code.
 */
export function emitCStatement(node: ASTNode, opts: CEmitOptions = {}): string {
  return `${emitC(node, opts)};`;
}

/**
 * Emit a condition (expression without semicolon) as C code.
 */
export function emitCCondition(node: ASTNode, opts: CEmitOptions = {}): string {
  return emitC(node, opts);
}

function emitCallC(name: string, args: string[]): string {
  // Map built-in functions
  switch (name) {
    case 'abs':
      return `abs(${args[0]})`;
    case 'min':
      return args.length === 2 ? `((${args[0]}) < (${args[1]}) ? (${args[0]}) : (${args[1]}))` : `min(${args.join(', ')})`;
    case 'max':
      return args.length === 2 ? `((${args[0]}) > (${args[1]}) ? (${args[0]}) : (${args[1]}))` : `max(${args.join(', ')})`;
    case 'sqrt':
      return `sqrt(${args[0]})`;
    case 'limit':
      return args.length === 3
        ? `((${args[1]}) < (${args[0]}) ? (${args[0]}) : ((${args[1]}) > (${args[2]}) ? (${args[2]}) : (${args[1]})))`
        : `limit(${args.join(', ')})`;
    case 'toInt':
      return `(int32_t)(${args[0]})`;
    case 'toReal':
      return `(float)(${args[0]})`;
    case 'toBool':
      return `(bool)(${args[0]})`;
    default:
      return `${name}(${args.join(', ')})`;
  }
}

function emitTemporalC(n: { kind: string; count: ASTNode; unit: string }): string {
  // Temporal expressions reference the generated tick counter
  // The actual tick-to-time conversion is handled by the generator
  const count = emitC(n.count);
  switch (n.kind) {
    case 'after':
      return `(sm->_stateTickCount >= ${count})`;
    case 'before':
      return `(sm->_stateTickCount < ${count})`;
    case 'every':
      return `(sm->_stateTickCount % ${count} == 0)`;
    case 'at':
      return `(sm->_stateTickCount == ${count})`;
    default:
      return `/* unknown temporal: ${n.kind} */`;
  }
}
