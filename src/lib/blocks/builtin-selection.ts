import type { FunctionBlockDef } from '../types/function-block';

export const SELECTION_BLOCKS: FunctionBlockDef[] = [
  {
    type: 'sel.switch',
    category: 'selection',
    name: 'Switch',
    symbol: 'SW',
    description: 'Pass A when condition is true, B otherwise',
    inputs: [
      { id: 'a', name: 'A', dataType: 'number' },
      { id: 'cond', name: 'Cond', dataType: 'boolean' },
      { id: 'b', name: 'B', dataType: 'number' },
    ],
    outputs: [{ id: 'out', name: 'Out', dataType: 'number' }],
    params: [],
    defaultSize: { width: 110, height: 90 },
    execute: (inputs) => ({
      outputs: { out: (inputs.cond ?? 0) !== 0 ? (inputs.a ?? 0) : (inputs.b ?? 0) },
      state: {},
    }),
    codeGen: {
      c: { expression: '(({cond}) ? {a} : {b})' },
      scl: { expression: 'SEL(G := {cond}, IN0 := {b}, IN1 := {a})' },
    },
  },
  {
    type: 'sel.mux',
    category: 'selection',
    name: 'Select',
    symbol: 'MUX',
    description: 'Select input 0 or 1 based on selector',
    inputs: [
      { id: 'sel', name: 'Sel', dataType: 'number' },
      { id: 'in0', name: 'In0', dataType: 'number' },
      { id: 'in1', name: 'In1', dataType: 'number' },
    ],
    outputs: [{ id: 'out', name: 'Out', dataType: 'number' }],
    params: [],
    defaultSize: { width: 110, height: 90 },
    execute: (inputs) => ({
      outputs: { out: (inputs.sel ?? 0) >= 1 ? (inputs.in1 ?? 0) : (inputs.in0 ?? 0) },
      state: {},
    }),
    codeGen: {
      c: { expression: '(({sel} >= 1) ? {in1} : {in0})' },
      scl: { expression: 'MUX(K := {sel}, IN0 := {in0}, IN1 := {in1})' },
    },
  },
];
