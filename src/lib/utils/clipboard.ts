import type { CanvasNode, TransitionEdge } from '../types/canvas';

export interface ClipboardData {
  nodes: CanvasNode[];
  edges: TransitionEdge[];
  anchorPosition: { x: number; y: number };
}

let clipboard: ClipboardData | null = null;

export function getClipboard(): ClipboardData | null {
  return clipboard;
}

export function setClipboard(data: ClipboardData): void {
  clipboard = data;
}

export function hasClipboard(): boolean {
  return clipboard !== null && clipboard.nodes.length > 0;
}
