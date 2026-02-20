import type { FunctionBlockDef } from '../types/function-block';

export const LOGIC_BLOCKS: FunctionBlockDef[] = [
  {
    type: 'logic.and',
    category: 'logic',
    name: 'AND',
    symbol: '&',
    description: 'Logical AND',
    inputs: [
      { id: 'in1', name: 'A', dataType: 'boolean' },
      { id: 'in2', name: 'B', dataType: 'boolean' },
    ],
    outputs: [{ id: 'out', name: 'Out', dataType: 'boolean' }],
    params: [],
    defaultSize: { width: 100, height: 70 },
    execute: (inputs) => ({
      outputs: { out: ((inputs.in1 ?? 0) !== 0 && (inputs.in2 ?? 0) !== 0) ? 1 : 0 },
      state: {},
    }),
    codeGen: {
      c: { expression: '({in1} && {in2})' },
      scl: { expression: '({in1} AND {in2})' },
    },
  },
  {
    type: 'logic.or',
    category: 'logic',
    name: 'OR',
    symbol: '\u22651',
    description: 'Logical OR',
    inputs: [
      { id: 'in1', name: 'A', dataType: 'boolean' },
      { id: 'in2', name: 'B', dataType: 'boolean' },
    ],
    outputs: [{ id: 'out', name: 'Out', dataType: 'boolean' }],
    params: [],
    defaultSize: { width: 100, height: 70 },
    execute: (inputs) => ({
      outputs: { out: ((inputs.in1 ?? 0) !== 0 || (inputs.in2 ?? 0) !== 0) ? 1 : 0 },
      state: {},
    }),
    codeGen: {
      c: { expression: '({in1} || {in2})' },
      scl: { expression: '({in1} OR {in2})' },
    },
  },
  {
    type: 'logic.not',
    category: 'logic',
    name: 'NOT',
    symbol: '!',
    description: 'Logical NOT',
    inputs: [{ id: 'in', name: 'In', dataType: 'boolean' }],
    outputs: [{ id: 'out', name: 'Out', dataType: 'boolean' }],
    params: [],
    defaultSize: { width: 90, height: 60 },
    execute: (inputs) => ({
      outputs: { out: (inputs.in ?? 0) === 0 ? 1 : 0 },
      state: {},
    }),
    codeGen: {
      c: { expression: '(!{in})' },
      scl: { expression: 'NOT {in}' },
    },
  },
  {
    type: 'logic.xor',
    category: 'logic',
    name: 'XOR',
    symbol: '=1',
    description: 'Logical XOR',
    inputs: [
      { id: 'in1', name: 'A', dataType: 'boolean' },
      { id: 'in2', name: 'B', dataType: 'boolean' },
    ],
    outputs: [{ id: 'out', name: 'Out', dataType: 'boolean' }],
    params: [],
    defaultSize: { width: 100, height: 70 },
    execute: (inputs) => ({
      outputs: {
        out: ((inputs.in1 ?? 0) !== 0) !== ((inputs.in2 ?? 0) !== 0) ? 1 : 0,
      },
      state: {},
    }),
    codeGen: {
      c: { expression: '(({in1} != 0) ^ ({in2} != 0))' },
      scl: { expression: '({in1} XOR {in2})' },
    },
  },
];
