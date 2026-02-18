import type { Token, TokenType } from './types';

const KEYWORDS: Record<string, TokenType> = {
  true: 'boolean',
  false: 'boolean',
};

/**
 * Tokenize a State-It expression string into a token stream.
 */
export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;

  while (pos < input.length) {
    // Skip whitespace
    if (/\s/.test(input[pos])) {
      pos++;
      continue;
    }

    // Skip line comments
    if (input[pos] === '/' && input[pos + 1] === '/') {
      while (pos < input.length && input[pos] !== '\n') pos++;
      continue;
    }

    const start = pos;
    const ch = input[pos];

    // Hex numbers: 0x...
    if (ch === '0' && input[pos + 1] === 'x') {
      pos += 2;
      while (pos < input.length && /[0-9a-fA-F]/.test(input[pos])) pos++;
      tokens.push({ type: 'hexNumber', value: input.slice(start, pos), pos: start });
      continue;
    }

    // Numbers (int or float)
    if (/[0-9]/.test(ch)) {
      while (pos < input.length && /[0-9]/.test(input[pos])) pos++;
      if (input[pos] === '.' && /[0-9]/.test(input[pos + 1])) {
        pos++; // skip dot
        while (pos < input.length && /[0-9]/.test(input[pos])) pos++;
        // Scientific notation
        if (input[pos] === 'e' || input[pos] === 'E') {
          pos++;
          if (input[pos] === '-' || input[pos] === '+') pos++;
          while (pos < input.length && /[0-9]/.test(input[pos])) pos++;
        }
        tokens.push({ type: 'float', value: input.slice(start, pos), pos: start });
      } else {
        tokens.push({ type: 'number', value: input.slice(start, pos), pos: start });
      }
      continue;
    }

    // String literals (single-quoted)
    if (ch === "'") {
      pos++; // skip opening quote
      while (pos < input.length && input[pos] !== "'") pos++;
      pos++; // skip closing quote
      tokens.push({ type: 'string', value: input.slice(start, pos), pos: start });
      continue;
    }

    // Identifiers and keywords
    if (/[a-zA-Z_]/.test(ch)) {
      while (pos < input.length && /[a-zA-Z0-9_]/.test(input[pos])) pos++;
      const word = input.slice(start, pos);
      const kwType = KEYWORDS[word];
      tokens.push({ type: kwType ?? 'identifier', value: word, pos: start });
      continue;
    }

    // Multi-character operators
    const two = input.slice(pos, pos + 2);
    const twoCharOp = TWO_CHAR_OPS[two];
    if (twoCharOp) {
      tokens.push({ type: twoCharOp, value: two, pos: start });
      pos += 2;
      continue;
    }

    // Single-character operators
    const oneCharOp = ONE_CHAR_OPS[ch];
    if (oneCharOp) {
      tokens.push({ type: oneCharOp, value: ch, pos: start });
      pos++;
      continue;
    }

    // Unknown character — skip it
    pos++;
  }

  tokens.push({ type: 'eof', value: '', pos });
  return tokens;
}

const TWO_CHAR_OPS: Record<string, TokenType> = {
  '==': 'eqEq',
  '!=': 'notEq',
  '<=': 'ltEq',
  '>=': 'gtEq',
  '&&': 'ampAmp',
  '||': 'pipesPipes',
  '<<': 'ltLt',
  '>>': 'gtGt',
  '+=': 'plusEq',
  '-=': 'minusEq',
  '*=': 'starEq',
  '/=': 'slashEq',
  '%=': 'percentEq',
  '++': 'plusPlus',
  '--': 'minusMinus',
};

const ONE_CHAR_OPS: Record<string, TokenType> = {
  '+': 'plus',
  '-': 'minus',
  '*': 'star',
  '/': 'slash',
  '%': 'percent',
  '=': 'eq',
  '<': 'lt',
  '>': 'gt',
  '!': 'bang',
  '&': 'amp',
  '|': 'pipe',
  '^': 'caret',
  '~': 'tilde',
  '(': 'lparen',
  ')': 'rparen',
  ',': 'comma',
  ';': 'semicolon',
};
