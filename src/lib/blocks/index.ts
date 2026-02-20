import { registerBlock } from './registry';
import { MATH_BLOCKS } from './builtin-math';
import { TRIG_BLOCKS } from './builtin-trig';
import { COMPARISON_BLOCKS } from './builtin-comparison';
import { LOGIC_BLOCKS } from './builtin-logic';
import { SELECTION_BLOCKS } from './builtin-selection';
import { CONVERSION_BLOCKS } from './builtin-conversion';
import { TIMING_BLOCKS } from './builtin-timing';

const ALL_BUILTIN_BLOCKS = [
  ...MATH_BLOCKS,
  ...TRIG_BLOCKS,
  ...COMPARISON_BLOCKS,
  ...LOGIC_BLOCKS,
  ...SELECTION_BLOCKS,
  ...CONVERSION_BLOCKS,
  ...TIMING_BLOCKS,
];

let registered = false;

export function registerBuiltinBlocks(): void {
  if (registered) return;
  for (const def of ALL_BUILTIN_BLOCKS) {
    registerBlock(def);
  }
  registered = true;
}

// Auto-register on import
registerBuiltinBlocks();

// Load custom blocks from localStorage (client-side only)
if (typeof window !== 'undefined') {
  import('./custom-blocks').then(({ loadCustomBlocks }) => loadCustomBlocks());
}
