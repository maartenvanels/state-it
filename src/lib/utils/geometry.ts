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
