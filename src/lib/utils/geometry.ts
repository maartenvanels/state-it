import { GRID_SIZE } from './constants';
import type { CanvasNode } from '../types/canvas';

/**
 * Check if nodeId is a descendant of potentialAncestorId
 */
export function isDescendantOf(
  nodeId: string,
  potentialAncestorId: string,
  nodes: CanvasNode[]
): boolean {
  let current = nodes.find((n) => n.id === nodeId);
  while (current?.parentId) {
    if (current.parentId === potentialAncestorId) return true;
    current = nodes.find((n) => n.id === current!.parentId);
  }
  return false;
}

/**
 * Get the absolute position of a node (accounting for parent chain)
 */
export function getAbsolutePosition(
  node: CanvasNode,
  nodes: CanvasNode[]
): { x: number; y: number } {
  let x = node.position.x;
  let y = node.position.y;
  let current = node;
  while (current.parentId) {
    const parent = nodes.find((n) => n.id === current.parentId);
    if (!parent) break;
    x += parent.position.x;
    y += parent.position.y;
    current = parent;
  }
  return { x, y };
}

/**
 * Get the width/height of a node from its measured dimensions or style
 */
export function getNodeSize(node: CanvasNode): { width: number; height: number } {
  return {
    width: node.measured?.width ?? (node.style?.width as number) ?? 200,
    height: node.measured?.height ?? (node.style?.height as number) ?? 150,
  };
}

export function snapToGrid(
  position: { x: number; y: number },
  gridSize: number = GRID_SIZE
): { x: number; y: number } {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize,
  };
}

export function isContainedIn(
  child: { x: number; y: number; width: number; height: number },
  parent: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    child.x >= parent.x &&
    child.y >= parent.y &&
    child.x + child.width <= parent.x + parent.width &&
    child.y + child.height <= parent.y + parent.height
  );
}

export function hasOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): boolean {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

// --- Alignment & Distribution utilities ---

export type AlignDirection = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
export type DistributeAxis = 'horizontal' | 'vertical';
export type MatchDimension = 'width' | 'height' | 'both';

interface NodeRect {
  id: string;
  absX: number;
  absY: number;
  width: number;
  height: number;
  parentId?: string;
}

function getNodeRects(nodeIds: string[], allNodes: CanvasNode[]): NodeRect[] {
  return nodeIds
    .map((id) => allNodes.find((n) => n.id === id))
    .filter((n): n is CanvasNode => !!n)
    .map((node) => {
      const abs = getAbsolutePosition(node, allNodes);
      const size = getNodeSize(node);
      return {
        id: node.id,
        absX: abs.x,
        absY: abs.y,
        width: size.width,
        height: size.height,
        parentId: node.parentId,
      };
    });
}

function absoluteToRelative(
  absPos: { x: number; y: number },
  parentId: string | undefined,
  allNodes: CanvasNode[]
): { x: number; y: number } {
  if (!parentId) return absPos;
  const parent = allNodes.find((n) => n.id === parentId);
  if (!parent) return absPos;
  const parentAbs = getAbsolutePosition(parent, allNodes);
  return { x: absPos.x - parentAbs.x, y: absPos.y - parentAbs.y };
}

/**
 * Calculate new positions for nodes after alignment.
 * Returns a map of nodeId → new relative position.
 */
export function calcAlignedPositions(
  nodeIds: string[],
  allNodes: CanvasNode[],
  direction: AlignDirection
): Map<string, { x: number; y: number }> {
  const rects = getNodeRects(nodeIds, allNodes);
  if (rects.length < 2) return new Map();

  const result = new Map<string, { x: number; y: number }>();

  let targetValue: number;
  switch (direction) {
    case 'left':
      targetValue = Math.min(...rects.map((r) => r.absX));
      for (const r of rects) {
        result.set(r.id, absoluteToRelative({ x: targetValue, y: r.absY }, r.parentId, allNodes));
      }
      break;
    case 'center': {
      const centers = rects.map((r) => r.absX + r.width / 2);
      targetValue = centers.reduce((a, b) => a + b, 0) / centers.length;
      for (const r of rects) {
        result.set(r.id, absoluteToRelative({ x: targetValue - r.width / 2, y: r.absY }, r.parentId, allNodes));
      }
      break;
    }
    case 'right':
      targetValue = Math.max(...rects.map((r) => r.absX + r.width));
      for (const r of rects) {
        result.set(r.id, absoluteToRelative({ x: targetValue - r.width, y: r.absY }, r.parentId, allNodes));
      }
      break;
    case 'top':
      targetValue = Math.min(...rects.map((r) => r.absY));
      for (const r of rects) {
        result.set(r.id, absoluteToRelative({ x: r.absX, y: targetValue }, r.parentId, allNodes));
      }
      break;
    case 'middle': {
      const middles = rects.map((r) => r.absY + r.height / 2);
      targetValue = middles.reduce((a, b) => a + b, 0) / middles.length;
      for (const r of rects) {
        result.set(r.id, absoluteToRelative({ x: r.absX, y: targetValue - r.height / 2 }, r.parentId, allNodes));
      }
      break;
    }
    case 'bottom':
      targetValue = Math.max(...rects.map((r) => r.absY + r.height));
      for (const r of rects) {
        result.set(r.id, absoluteToRelative({ x: r.absX, y: targetValue - r.height }, r.parentId, allNodes));
      }
      break;
  }

  return result;
}

/**
 * Calculate new positions for nodes after distribution.
 * Returns a map of nodeId → new relative position.
 */
export function calcDistributedPositions(
  nodeIds: string[],
  allNodes: CanvasNode[],
  axis: DistributeAxis
): Map<string, { x: number; y: number }> {
  const rects = getNodeRects(nodeIds, allNodes);
  if (rects.length < 3) return new Map();

  const result = new Map<string, { x: number; y: number }>();

  if (axis === 'horizontal') {
    const sorted = [...rects].sort((a, b) => a.absX - b.absX);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const totalNodeWidth = sorted.reduce((sum, r) => sum + r.width, 0);
    const totalSpace = (last.absX + last.width) - first.absX - totalNodeWidth;
    const gap = totalSpace / (sorted.length - 1);

    let currentX = first.absX;
    for (const r of sorted) {
      result.set(r.id, absoluteToRelative({ x: currentX, y: r.absY }, r.parentId, allNodes));
      currentX += r.width + gap;
    }
  } else {
    const sorted = [...rects].sort((a, b) => a.absY - b.absY);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const totalNodeHeight = sorted.reduce((sum, r) => sum + r.height, 0);
    const totalSpace = (last.absY + last.height) - first.absY - totalNodeHeight;
    const gap = totalSpace / (sorted.length - 1);

    let currentY = first.absY;
    for (const r of sorted) {
      result.set(r.id, absoluteToRelative({ x: r.absX, y: currentY }, r.parentId, allNodes));
      currentY += r.height + gap;
    }
  }

  return result;
}

/**
 * Calculate the target size when matching node dimensions.
 * Uses the maximum dimension among selected nodes.
 */
export function calcMatchedSize(
  nodeIds: string[],
  allNodes: CanvasNode[],
  dimension: MatchDimension
): { width: number; height: number } | null {
  const rects = getNodeRects(nodeIds, allNodes);
  if (rects.length < 2) return null;

  const maxWidth = Math.max(...rects.map((r) => r.width));
  const maxHeight = Math.max(...rects.map((r) => r.height));

  switch (dimension) {
    case 'width':
      return { width: maxWidth, height: 0 }; // height 0 = don't change
    case 'height':
      return { width: 0, height: maxHeight };
    case 'both':
      return { width: maxWidth, height: maxHeight };
  }
}
