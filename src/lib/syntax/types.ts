// ─── Token Types ────────────────────────────────────────────────

export type TokenType =
  | 'number'
  | 'hexNumber'
  | 'float'
  | 'string'
  | 'identifier'
  | 'boolean'
  | 'plus'
  | 'minus'
  | 'star'
  | 'slash'
  | 'percent'
  | 'eq'
  | 'eqEq'
  | 'notEq'
  | 'lt'
  | 'ltEq'
  | 'gt'
  | 'gtEq'
  | 'ampAmp'
  | 'pipesPipes'
  | 'bang'
  | 'amp'
  | 'pipe'
  | 'caret'
  | 'tilde'
  | 'ltLt'
  | 'gtGt'
  | 'plusEq'
  | 'minusEq'
  | 'starEq'
  | 'slashEq'
  | 'percentEq'
  | 'plusPlus'
  | 'minusMinus'
  | 'lparen'
  | 'rparen'
  | 'comma'
  | 'semicolon'
  | 'eof';

export interface Token {
  type: TokenType;
  value: string;
  pos: number;
}

// ─── AST Node Types ─────────────────────────────────────────────

export type BinaryOp =
  | '+' | '-' | '*' | '/' | '%'
  | '==' | '!=' | '<' | '<=' | '>' | '>='
  | '&&' | '||'
  | '&' | '|' | '^'
  | '<<' | '>>';

export type UnaryOp = '!' | '~' | '-';

export type AssignOp = '=' | '+=' | '-=' | '*=' | '/=' | '%=';

export type TemporalKind = 'after' | 'before' | 'every' | 'at';
export type TimeUnit = 'tick' | 'sec' | 'ms';

export type ASTNode =
  | NumberLiteral
  | BooleanLiteral
  | StringLiteral
  | Identifier
  | BinaryExpr
  | UnaryExpr
  | Assignment
  | PostfixExpr
  | CallExpr
  | TemporalExpr
  | ElapsedExpr;

export interface NumberLiteral {
  type: 'number';
  value: number;
  raw: string; // original text (preserves hex, etc.)
}

export interface BooleanLiteral {
  type: 'boolean';
  value: boolean;
}

export interface StringLiteral {
  type: 'string';
  value: string;
}

export interface Identifier {
  type: 'identifier';
  name: string;
}

export interface BinaryExpr {
  type: 'binary';
  op: BinaryOp;
  left: ASTNode;
  right: ASTNode;
}

export interface UnaryExpr {
  type: 'unary';
  op: UnaryOp;
  operand: ASTNode;
}

export interface Assignment {
  type: 'assignment';
  target: string;
  op: AssignOp;
  value: ASTNode;
}

export interface PostfixExpr {
  type: 'postfix';
  target: string;
  op: '++' | '--';
}

export interface CallExpr {
  type: 'call';
  name: string;
  args: ASTNode[];
}

export interface TemporalExpr {
  type: 'temporal';
  kind: TemporalKind;
  count: ASTNode;
  unit: TimeUnit;
}

export interface ElapsedExpr {
  type: 'elapsed';
}

// ─── Parse Result ───────────────────────────────────────────────

export interface ParseResult {
  statements: ASTNode[];
  errors: ParseError[];
}

export interface ParseError {
  message: string;
  pos: number;
}
