import type { ASTNode } from './types';
import { parse, parseExpression } from './parser';
import { emitC, emitCStatement, emitCCondition, type CEmitOptions } from './c-emitter';
import { emitSCL, emitSCLStatement, emitSCLCondition, type SCLEmitOptions } from './scl-emitter';

/**
 * Translate a condition string to C.
 * Falls back to raw string if parsing fails.
 */
export function translateConditionToC(
  input: string,
  opts: CEmitOptions = {}
): string {
  if (!input.trim()) return '';
  const { node } = parseExpression(input);
  if (!node) return input; // fallback
  return emitCCondition(node, opts);
}

/**
 * Translate an action string (may contain multiple statements) to C.
 * Returns array of C statements.
 */
export function translateActionToC(
  input: string,
  opts: CEmitOptions = {}
): string[] {
  if (!input.trim()) return [];
  const { statements, errors } = parse(input);
  if (errors.length > 0 || statements.length === 0) return [input + ';']; // fallback
  return statements.map((s) => emitCStatement(s, opts));
}

/**
 * Translate a condition string to SCL.
 * Falls back to raw string if parsing fails.
 */
export function translateConditionToSCL(
  input: string,
  opts: SCLEmitOptions = {}
): string {
  if (!input.trim()) return '';
  const { node } = parseExpression(input);
  if (!node) return input; // fallback
  return emitSCLCondition(node, opts);
}

/**
 * Translate an action string (may contain multiple statements) to SCL.
 * Returns array of SCL statements.
 */
export function translateActionToSCL(
  input: string,
  opts: SCLEmitOptions = {}
): string[] {
  if (!input.trim()) return [];
  const { statements, errors } = parse(input);
  if (errors.length > 0 || statements.length === 0) return [input + ';']; // fallback
  return statements.map((s) => emitSCLStatement(s, opts));
}

/**
 * Check if any expression in a list uses temporal operators.
 * Used by generators to decide whether to add tick counter variables.
 */
export function usesTemporalLogic(expressions: string[]): boolean {
  for (const input of expressions) {
    if (!input.trim()) continue;
    const { statements } = parse(input);
    for (const stmt of statements) {
      if (hasTemporalNode(stmt)) return true;
    }
    // Also try as expression
    const { node } = parseExpression(input);
    if (node && hasTemporalNode(node)) return true;
  }
  return false;
}

function hasTemporalNode(node: ASTNode): boolean {
  switch (node.type) {
    case 'temporal':
    case 'elapsed':
      return true;
    case 'binary':
      return hasTemporalNode(node.left) || hasTemporalNode(node.right);
    case 'unary':
      return hasTemporalNode(node.operand);
    case 'call':
      return node.args.some(hasTemporalNode);
    case 'assignment':
      return hasTemporalNode(node.value);
    default:
      return false;
  }
}
