export type SystemBlockType = 'chart';
// Phase C will add: 'constant' | 'signalGenerator' | 'step' | 'manualSwitch' | 'slider' | 'scope' | 'display' | 'logger'

export interface SystemBlock {
  id: string;
  type: SystemBlockType;
  name: string;
  chartId: string | null;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: Record<string, unknown>;
}

export interface SystemWire {
  id: string;
  sourceBlockId: string;
  sourcePortId: string;
  targetBlockId: string;
  targetPortId: string;
}
