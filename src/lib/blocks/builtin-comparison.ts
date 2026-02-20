import type { FunctionBlockDef } from '../types/function-block';

export const COMPARISON_BLOCKS: FunctionBlockDef[] = [
  {
    type: 'cmp.eq',
    category: 'comparison',
    name: 'Equal',
    symbol: '==',
    description: 'A equals B',
    inputs: [
      { id: 'in1', name: 'A', dataType: 'number' },
      { id: 'in2', name: 'B', dataType: 'number' },
    ],
    outputs: [{ id: 'out', name: 'Out', dataType: 'boolean' }],
    params: [],
    defaultSize: { width: 100, height: 70 },
    execute: (inputs) => ({
      outputs: { out: (inputs.in1 ?? 0) === (inputs.in2 ?? 0) ? 1 : 0 },
      state: {},
    }),
    codeGen: {
      c: { expression: '({in1} == {in2})' },
      scl: { expression: '({in1} = {in2})' },
    },
  },
  {
    type: 'cmp.neq',
    category: 'comparison',
    name: 'Not Equal',
    symbol: '\u2260',
    description: 'A not equal to B',
    inputs: [
      { id: 'in1', name: 'A', dataType: 'number' },
      { id: 'in2', name: 'B', dataType: 'number' },
    ],
    outputs: [{ id: 'out', name: 'Out', dataType: 'boolean' }],
    params: [],
    defaultSize: { width: 100, height: 70 },
    execute: (inputs) => ({
      outputs: { out: (inputs.in1 ?? 0) !== (inputs.in2 ?? 0) ? 1 : 0 },
      state: {},
    }),
    codeGen: {
      c: { expression: '({in1} != {in2})' },
      scl: { expression: '({in1} <> {in2})' },
    },
  },
  {
    type: 'cmp.gt',
    category: 'comparison',
    name: 'Greater Than',
    symbol: '>',
    description: 'A greater than B',
    inputs: [
      { id: 'in1', name: 'A', dataType: 'number' },
      { id: 'in2', name: 'B', dataType: 'number' },
    ],
    outputs: [{ id: 'out', name: 'Out', dataType: 'boolean' }],
    params: [],
    defaultSize: { width: 100, height: 70 },
    execute: (inputs) => ({
      outputs: { out: (inputs.in1 ?? 0) > (inputs.in2 ?? 0) ? 1 : 0 },
      state: {},
    }),
    codeGen: {
      c: { expression: '({in1} > {in2})' },
      scl: { expression: '({in1} > {in2})' },
    },
  },
  {
    type: 'cmp.lt',
    category: 'comparison',
    name: 'Less Than',
    symbol: '<',
    description: 'A less than B',
    inputs: [
      { id: 'in1', name: 'A', dataType: 'number' },
      { id: 'in2', name: 'B', dataType: 'number' },
    ],
    outputs: [{ id: 'out', name: 'Out', dataType: 'boolean' }],
    params: [],
    defaultSize: { width: 100, height: 70 },
    execute: (inputs) => ({
      outputs: { out: (inputs.in1 ?? 0) < (inputs.in2 ?? 0) ? 1 : 0 },
      state: {},
    }),
    codeGen: {
      c: { expression: '({in1} < {in2})' },
      scl: { expression: '({in1} < {in2})' },
    },
  },
  {
    type: 'cmp.gte',
    category: 'comparison',
    name: 'Greater or Equal',
    symbol: '\u2265',
    description: 'A greater than or equal to B',
    inputs: [
      { id: 'in1', name: 'A', dataType: 'number' },
      { id: 'in2', name: 'B', dataType: 'number' },
    ],
    outputs: [{ id: 'out', name: 'Out', dataType: 'boolean' }],
    params: [],
    defaultSize: { width: 100, height: 70 },
    execute: (inputs) => ({
      outputs: { out: (inputs.in1 ?? 0) >= (inputs.in2 ?? 0) ? 1 : 0 },
      state: {},
    }),
    codeGen: {
      c: { expression: '({in1} >= {in2})' },
      scl: { expression: '({in1} >= {in2})' },
    },
  },
  {
    type: 'cmp.lte',
    category: 'comparison',
    name: 'Less or Equal',
    symbol: '\u2264',
    description: 'A less than or equal to B',
    inputs: [
      { id: 'in1', name: 'A', dataType: 'number' },
      { id: 'in2', name: 'B', dataType: 'number' },
    ],
    outputs: [{ id: 'out', name: 'Out', dataType: 'boolean' }],
    params: [],
    defaultSize: { width: 100, height: 70 },
    execute: (inputs) => ({
      outputs: { out: (inputs.in1 ?? 0) <= (inputs.in2 ?? 0) ? 1 : 0 },
      state: {},
    }),
    codeGen: {
      c: { expression: '({in1} <= {in2})' },
      scl: { expression: '({in1} <= {in2})' },
    },
  },
];
