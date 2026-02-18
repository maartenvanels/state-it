import type {
  Token,
  TokenType,
  ASTNode,
  BinaryOp,
  AssignOp,
  TimeUnit,
  TemporalKind,
  ParseResult,
  ParseError,
} from './types';
import { tokenize } from './lexer';

const TEMPORAL_KEYWORDS = new Set(['after', 'before', 'every', 'at']);
const TIME_UNITS = new Set(['tick', 'sec', 'ms']);

const ASSIGN_OPS: Record<string, AssignOp> = {
  '=': '=',
  '+=': '+=',
  '-=': '-=',
  '*=': '*=',
  '/=': '/=',
  '%=': '%=',
};

const ASSIGN_TOKENS = new Set<TokenType>([
  'eq', 'plusEq', 'minusEq', 'starEq', 'slashEq', 'percentEq',
]);

/**
 * Parse a State-It expression or statement list.
 * Returns AST nodes and any parse errors.
 */
export function parse(input: string): ParseResult {
  if (!input.trim()) {
    return { statements: [], errors: [] };
  }

  const tokens = tokenize(input);
  const parser = new Parser(tokens);
  return parser.parseProgram();
}

/**
 * Parse a single expression (for conditions).
 * Returns the AST node or null on failure.
 */
export function parseExpression(input: string): { node: ASTNode | null; errors: ParseError[] } {
  if (!input.trim()) {
    return { node: null, errors: [] };
  }

  const tokens = tokenize(input);
  const parser = new Parser(tokens);
  const errors: ParseError[] = [];

  try {
    const node = parser.expression();
    return { node, errors };
  } catch (e) {
    errors.push({
      message: e instanceof Error ? e.message : 'Parse error',
      pos: parser.currentPos(),
    });
    return { node: null, errors };
  }
}

class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  currentPos(): number {
    return this.peek().pos;
  }

  parseProgram(): ParseResult {
    const statements: ASTNode[] = [];
    const errors: ParseError[] = [];

    while (!this.isAtEnd()) {
      // Skip extra semicolons
      while (this.check('semicolon')) this.advance();
      if (this.isAtEnd()) break;

      try {
        statements.push(this.statement());
      } catch (e) {
        errors.push({
          message: e instanceof Error ? e.message : 'Parse error',
          pos: this.currentPos(),
        });
        // Recovery: skip to next semicolon or end
        while (!this.isAtEnd() && !this.check('semicolon')) {
          this.advance();
        }
      }

      // Consume optional semicolon between statements
      if (this.check('semicolon')) this.advance();
    }

    return { statements, errors };
  }

  // ─── Statement ──────────────────────────────────────────────

  private statement(): ASTNode {
    // Check for assignment or postfix (identifier followed by =, +=, ++, etc.)
    if (this.check('identifier') && !this.isCallOrTemporal()) {
      const ident = this.peek();
      const next = this.peekNext();

      // Postfix: x++ or x--
      if (next && (next.type === 'plusPlus' || next.type === 'minusMinus')) {
        this.advance(); // consume identifier
        const op = this.advance(); // consume ++ or --
        return { type: 'postfix', target: ident.value, op: op.value as '++' | '--' };
      }

      // Assignment: x = expr, x += expr, etc.
      if (next && ASSIGN_TOKENS.has(next.type)) {
        this.advance(); // consume identifier
        const opToken = this.advance(); // consume assignment op
        const value = this.expression();
        return {
          type: 'assignment',
          target: ident.value,
          op: ASSIGN_OPS[opToken.value],
          value,
        };
      }
    }

    // Otherwise, it's an expression statement
    return this.expression();
  }

  // ─── Expression (precedence climbing) ───────────────────────

  expression(): ASTNode {
    return this.logicalOr();
  }

  private logicalOr(): ASTNode {
    let left = this.logicalAnd();
    while (this.check('pipesPipes')) {
      this.advance();
      const right = this.logicalAnd();
      left = { type: 'binary', op: '||', left, right };
    }
    return left;
  }

  private logicalAnd(): ASTNode {
    let left = this.bitwiseOr();
    while (this.check('ampAmp')) {
      this.advance();
      const right = this.bitwiseOr();
      left = { type: 'binary', op: '&&', left, right };
    }
    return left;
  }

  private bitwiseOr(): ASTNode {
    let left = this.bitwiseXor();
    while (this.check('pipe')) {
      this.advance();
      const right = this.bitwiseXor();
      left = { type: 'binary', op: '|', left, right };
    }
    return left;
  }

  private bitwiseXor(): ASTNode {
    let left = this.bitwiseAnd();
    while (this.check('caret')) {
      this.advance();
      const right = this.bitwiseAnd();
      left = { type: 'binary', op: '^', left, right };
    }
    return left;
  }

  private bitwiseAnd(): ASTNode {
    let left = this.equality();
    while (this.check('amp')) {
      this.advance();
      const right = this.equality();
      left = { type: 'binary', op: '&', left, right };
    }
    return left;
  }

  private equality(): ASTNode {
    let left = this.comparison();
    while (this.check('eqEq') || this.check('notEq')) {
      const op = this.advance().value as BinaryOp;
      const right = this.comparison();
      left = { type: 'binary', op, left, right };
    }
    return left;
  }

  private comparison(): ASTNode {
    let left = this.shift();
    while (this.check('lt') || this.check('ltEq') || this.check('gt') || this.check('gtEq')) {
      const op = this.advance().value as BinaryOp;
      const right = this.shift();
      left = { type: 'binary', op, left, right };
    }
    return left;
  }

  private shift(): ASTNode {
    let left = this.additive();
    while (this.check('ltLt') || this.check('gtGt')) {
      const op = this.advance().value as BinaryOp;
      const right = this.additive();
      left = { type: 'binary', op, left, right };
    }
    return left;
  }

  private additive(): ASTNode {
    let left = this.multiplicative();
    while (this.check('plus') || this.check('minus')) {
      const op = this.advance().value as BinaryOp;
      const right = this.multiplicative();
      left = { type: 'binary', op, left, right };
    }
    return left;
  }

  private multiplicative(): ASTNode {
    let left = this.unary();
    while (this.check('star') || this.check('slash') || this.check('percent')) {
      const op = this.advance().value as BinaryOp;
      const right = this.unary();
      left = { type: 'binary', op, left, right };
    }
    return left;
  }

  private unary(): ASTNode {
    if (this.check('bang')) {
      this.advance();
      return { type: 'unary', op: '!', operand: this.unary() };
    }
    if (this.check('tilde')) {
      this.advance();
      return { type: 'unary', op: '~', operand: this.unary() };
    }
    if (this.check('minus')) {
      // Distinguish unary minus from binary minus
      this.advance();
      return { type: 'unary', op: '-', operand: this.unary() };
    }
    return this.postfix();
  }

  private postfix(): ASTNode {
    const expr = this.primary();
    // Postfix ++ / -- only on identifiers, handled in statement()
    // but also support in expression context
    if (expr.type === 'identifier' && (this.check('plusPlus') || this.check('minusMinus'))) {
      const op = this.advance().value as '++' | '--';
      return { type: 'postfix', target: expr.name, op };
    }
    return expr;
  }

  private primary(): ASTNode {
    const tok = this.peek();

    // Grouped expression
    if (tok.type === 'lparen') {
      this.advance();
      const expr = this.expression();
      this.expect('rparen', "Expected ')'");
      return expr;
    }

    // Number literals
    if (tok.type === 'number') {
      this.advance();
      return { type: 'number', value: parseInt(tok.value, 10), raw: tok.value };
    }

    if (tok.type === 'hexNumber') {
      this.advance();
      return { type: 'number', value: parseInt(tok.value, 16), raw: tok.value };
    }

    if (tok.type === 'float') {
      this.advance();
      return { type: 'number', value: parseFloat(tok.value), raw: tok.value };
    }

    // Boolean literals
    if (tok.type === 'boolean') {
      this.advance();
      return { type: 'boolean', value: tok.value === 'true' };
    }

    // String literals
    if (tok.type === 'string') {
      this.advance();
      // Strip quotes
      return { type: 'string', value: tok.value.slice(1, -1) };
    }

    // Identifiers, function calls, temporal expressions
    if (tok.type === 'identifier') {
      const name = tok.value;

      // elapsed()
      if (name === 'elapsed' && this.peekNext()?.type === 'lparen') {
        this.advance(); // consume 'elapsed'
        this.advance(); // consume '('
        this.expect('rparen', "Expected ')' after elapsed");
        return { type: 'elapsed' };
      }

      // Temporal: after(n, tick), before(n, sec), etc.
      if (TEMPORAL_KEYWORDS.has(name) && this.peekNext()?.type === 'lparen') {
        this.advance(); // consume keyword
        this.advance(); // consume '('
        const count = this.expression();
        this.expect('comma', "Expected ',' in temporal expression");
        const unitTok = this.expect('identifier', 'Expected time unit (tick, sec, ms)');
        if (!TIME_UNITS.has(unitTok.value)) {
          throw new Error(`Invalid time unit '${unitTok.value}', expected tick, sec, or ms`);
        }
        this.expect('rparen', "Expected ')' after temporal expression");
        return {
          type: 'temporal',
          kind: name as TemporalKind,
          count,
          unit: unitTok.value as TimeUnit,
        };
      }

      // Function call: name(args...)
      if (this.peekNext()?.type === 'lparen') {
        this.advance(); // consume name
        this.advance(); // consume '('
        const args: ASTNode[] = [];
        if (!this.check('rparen')) {
          args.push(this.expression());
          while (this.check('comma')) {
            this.advance();
            args.push(this.expression());
          }
        }
        this.expect('rparen', `Expected ')' after arguments to ${name}`);
        return { type: 'call', name, args };
      }

      // Plain identifier
      this.advance();
      return { type: 'identifier', name };
    }

    throw new Error(`Unexpected token '${tok.value}' at position ${tok.pos}`);
  }

  // ─── Helpers ────────────────────────────────────────────────

  private isCallOrTemporal(): boolean {
    const tok = this.peek();
    if (tok.type !== 'identifier') return false;
    const next = this.peekNext();
    if (!next) return false;
    // Function call or temporal — identifier followed by '('
    if (next.type === 'lparen') return true;
    return false;
  }

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private peekNext(): Token | undefined {
    return this.tokens[this.pos + 1];
  }

  private advance(): Token {
    const tok = this.tokens[this.pos];
    if (tok.type !== 'eof') this.pos++;
    return tok;
  }

  private check(type: TokenType): boolean {
    return this.peek().type === type;
  }

  private isAtEnd(): boolean {
    return this.peek().type === 'eof';
  }

  private expect(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw new Error(`${message} (got '${this.peek().value}' at position ${this.peek().pos})`);
  }
}
