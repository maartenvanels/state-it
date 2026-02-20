import type { FunctionBlockDef, BlockCategory } from '../types/function-block';

const BLOCK_REGISTRY = new Map<string, FunctionBlockDef>();

export function registerBlock(def: FunctionBlockDef): void {
  BLOCK_REGISTRY.set(def.type, def);
}

export function getBlockDef(defType: string): FunctionBlockDef | undefined {
  return BLOCK_REGISTRY.get(defType);
}

export function getBlocksByCategory(category: BlockCategory): FunctionBlockDef[] {
  return Array.from(BLOCK_REGISTRY.values()).filter(
    (def) => def.category === category
  );
}

export function getAllCategories(): BlockCategory[] {
  const categories = new Set<BlockCategory>();
  for (const def of BLOCK_REGISTRY.values()) {
    categories.add(def.category);
  }
  // Return in display order
  const order: BlockCategory[] = [
    'math', 'trigonometry', 'comparison', 'logic',
    'selection', 'conversion', 'timing',
  ];
  return order.filter((c) => categories.has(c));
}

export function getAllBlockDefs(): FunctionBlockDef[] {
  return Array.from(BLOCK_REGISTRY.values());
}

export function unregisterBlock(defType: string): void {
  BLOCK_REGISTRY.delete(defType);
}
