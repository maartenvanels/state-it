import type { FunctionBlockDef } from '../types/function-block';

export const CONVERSION_BLOCKS: FunctionBlockDef[] = [
  {
    type: 'conv.round',
    category: 'conversion',
    name: 'Round',
    symbol: 'rnd',
    description: 'Round to nearest integer',
    inputs: [{ id: 'in', name: 'In', dataType: 'number' }],
    outputs: [{ id: 'out', name: 'Out', dataType: 'number' }],
    params: [],
    defaultSize: { width: 90, height: 60 },
    execute: (inputs) => ({
      outputs: { out: Math.round(inputs.in ?? 0) },
      state: {},
    }),
    codeGen: {
      c: { expression: 'round({in})', includes: ['<math.h>'] },
      scl: { expression: 'ROUND({in})' },
    },
  },
  {
    type: 'conv.floor',
    category: 'conversion',
    name: 'Floor',
    symbol: '\u230a\u230b',
    description: 'Round down to integer',
    inputs: [{ id: 'in', name: 'In', dataType: 'number' }],
    outputs: [{ id: 'out', name: 'Out', dataType: 'number' }],
    params: [],
    defaultSize: { width: 90, height: 60 },
    execute: (inputs) => ({
      outputs: { out: Math.floor(inputs.in ?? 0) },
      state: {},
    }),
    codeGen: {
      c: { expression: 'floor({in})', includes: ['<math.h>'] },
      scl: { expression: 'FLOOR({in})' },
    },
  },
  {
    type: 'conv.ceil',
    category: 'conversion',
    name: 'Ceil',
    symbol: '\u2308\u2309',
    description: 'Round up to integer',
    inputs: [{ id: 'in', name: 'In', dataType: 'number' }],
    outputs: [{ id: 'out', name: 'Out', dataType: 'number' }],
    params: [],
    defaultSize: { width: 90, height: 60 },
    execute: (inputs) => ({
      outputs: { out: Math.ceil(inputs.in ?? 0) },
      state: {},
    }),
    codeGen: {
      c: { expression: 'ceil({in})', includes: ['<math.h>'] },
      scl: { expression: 'CEIL({in})' },
    },
  },
  {
    type: 'conv.trunc',
    category: 'conversion',
    name: 'Truncate',
    symbol: 'trunc',
    description: 'Truncate toward zero',
    inputs: [{ id: 'in', name: 'In', dataType: 'number' }],
    outputs: [{ id: 'out', name: 'Out', dataType: 'number' }],
    params: [],
    defaultSize: { width: 90, height: 60 },
    execute: (inputs) => ({
      outputs: { out: Math.trunc(inputs.in ?? 0) },
      state: {},
    }),
    codeGen: {
      c: { expression: 'trunc({in})', includes: ['<math.h>'] },
      scl: { expression: 'TRUNC({in})' },
    },
  },
];
