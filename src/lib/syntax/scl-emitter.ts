import type { ASTNode, BinaryOp } from './types';

export interface SCLEmitOptions {
  /** Prefix for variable access, e.g. "#" */
  varPrefix?: string;
  /** Set of known variable names (to apply prefix) */
  variables?: Set<string>;
}

const SCL_BINARY_OPS: Partial<Record<BinaryOp, string>> = {
  '&&': 'AND',
  '||': 'OR',
  '==': '=',
  '!=': '<>',
  '%': 'MOD',
};

/**
 * Emit a single AST node as an SCL expression string.
 */
export function emitSCL(node: ASTNode, opts: SCLEmitOptions = {}): string {
  const vp = opts.varPrefix ?? '#';
  const vars = opts.variables;

  function v(name: string): string {
    if (vars && !vars.has(name)) return name;
    return `${vp}${name}`;
  }

  function emit(n: ASTNode): string {
    switch (n.type) {
      case 'number':
        // Convert hex notation: 0xFF → 16#FF
        if (n.raw.startsWith('0x') || n.raw.startsWith('0X')) {
          return `16#${n.raw.slice(2).toUpperCase()}`;
        }
        return n.raw;

      case 'boolean':
        return n.value ? 'TRUE' : 'FALSE';

      case 'string':
        return `'${n.value}'`;

      case 'identifier':
        return v(n.name);

      case 'binary':
        return emitBinarySCL(n.op, n.left, n.right, emit);

      case 'unary':
        if (n.op === '!') return `NOT ${emit(n.operand)}`;
        if (n.op === '~') return `NOT ${emit(n.operand)}`;
        if (n.op === '-') return `-(${emit(n.operand)})`;
        return `${n.op}${emit(n.operand)}`;

      case 'assignment': {
        const target = v(n.target);
        const val = emit(n.value);
        if (n.op === '=') return `${target} := ${val}`;
        // Compound assignment: x += 5 → x := x + 5
        const baseOp = n.op.charAt(0); // +, -, *, /, %
        const sclOp = baseOp === '%' ? 'MOD' : baseOp;
        return `${target} := ${target} ${sclOp} ${val}`;
      }

      case 'postfix': {
        const target = v(n.target);
        const delta = n.op === '++' ? '+ 1' : '- 1';
        return `${target} := ${target} ${delta}`;
      }

      case 'call':
        return emitCallSCL(n.name, n.args.map(emit));

      case 'temporal':
        return emitTemporalSCL(n, emit);

      case 'elapsed':
        return `${vp}_stateTickCount`;
    }
  }

  return emit(node);
}

/**
 * Emit a statement (expression + semicolon) as SCL code.
 */
export function emitSCLStatement(node: ASTNode, opts: SCLEmitOptions = {}): string {
  return `${emitSCL(node, opts)};`;
}

/**
 * Emit a condition (expression without semicolon) as SCL code.
 */
export function emitSCLCondition(node: ASTNode, opts: SCLEmitOptions = {}): string {
  return emitSCL(node, opts);
}

function emitBinarySCL(
  op: BinaryOp,
  left: ASTNode,
  right: ASTNode,
  emit: (n: ASTNode) => string
): string {
  // Bit shifts → function calls in SCL
  if (op === '<<') {
    return `SHL(IN:=${emit(left)}, N:=${emit(right)})`;
  }
  if (op === '>>') {
    return `SHR(IN:=${emit(left)}, N:=${emit(right)})`;
  }

  const sclOp = SCL_BINARY_OPS[op] ?? op;
  return `(${emit(left)} ${sclOp} ${emit(right)})`;
}

function emitCallSCL(name: string, args: string[]): string {
  switch (name) {
    case 'abs':
      return `ABS(${args[0]})`;
    case 'min':
      return args.length === 2
        ? `MIN(IN1:=${args[0]}, IN2:=${args[1]})`
        : `MIN(${args.join(', ')})`;
    case 'max':
      return args.length === 2
        ? `MAX(IN1:=${args[0]}, IN2:=${args[1]})`
        : `MAX(${args.join(', ')})`;
    case 'sqrt':
      return `SQRT(${args[0]})`;
    case 'limit':
      return args.length === 3
        ? `LIMIT(MN:=${args[0]}, IN:=${args[1]}, MX:=${args[2]})`
        : `LIMIT(${args.join(', ')})`;
    case 'toInt':
      return `REAL_TO_DINT(${args[0]})`;
    case 'toReal':
      return `DINT_TO_REAL(${args[0]})`;
    case 'toBool':
      return `INT_TO_BOOL(${args[0]})`;
    default:
      // User-defined function — pass through with quoted name
      return `"${name}"(${args.join(', ')})`;
  }
}

function emitTemporalSCL(
  n: { kind: string; count: ASTNode; unit: string },
  emit: (n: ASTNode) => string
): string {
  const count = emit(n.count);
  switch (n.kind) {
    case 'after':
      return `(#_stateTickCount >= ${count})`;
    case 'before':
      return `(#_stateTickCount < ${count})`;
    case 'every':
      return `(#_stateTickCount MOD ${count} = 0)`;
    case 'at':
      return `(#_stateTickCount = ${count})`;
    default:
      return `(* unknown temporal: ${n.kind} *)`;
  }
}
