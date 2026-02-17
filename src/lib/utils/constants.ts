export const GRID_SIZE = 20;

export const MIN_STATE_WIDTH = 120;
export const MIN_STATE_HEIGHT = 80;
export const DEFAULT_STATE_WIDTH = 200;
export const DEFAULT_STATE_HEIGHT = 150;

export const HANDLE_POSITIONS = [
  // Top side – 5 points
  { id: 'top-1', position: 'top' as const, style: { left: '10%' } },
  { id: 'top-2', position: 'top' as const, style: { left: '25%' } },
  { id: 'top-3', position: 'top' as const, style: { left: '50%' } },
  { id: 'top-4', position: 'top' as const, style: { left: '75%' } },
  { id: 'top-5', position: 'top' as const, style: { left: '90%' } },
  // Right side – 5 points
  { id: 'right-1', position: 'right' as const, style: { top: '10%' } },
  { id: 'right-2', position: 'right' as const, style: { top: '25%' } },
  { id: 'right-3', position: 'right' as const, style: { top: '50%' } },
  { id: 'right-4', position: 'right' as const, style: { top: '75%' } },
  { id: 'right-5', position: 'right' as const, style: { top: '90%' } },
  // Bottom side – 5 points
  { id: 'bottom-1', position: 'bottom' as const, style: { left: '90%' } },
  { id: 'bottom-2', position: 'bottom' as const, style: { left: '75%' } },
  { id: 'bottom-3', position: 'bottom' as const, style: { left: '50%' } },
  { id: 'bottom-4', position: 'bottom' as const, style: { left: '25%' } },
  { id: 'bottom-5', position: 'bottom' as const, style: { left: '10%' } },
  // Left side – 5 points
  { id: 'left-1', position: 'left' as const, style: { top: '90%' } },
  { id: 'left-2', position: 'left' as const, style: { top: '75%' } },
  { id: 'left-3', position: 'left' as const, style: { top: '50%' } },
  { id: 'left-4', position: 'left' as const, style: { top: '25%' } },
  { id: 'left-5', position: 'left' as const, style: { top: '10%' } },
] as const;

export const COLORS = {
  selected: 'hsl(217, 91%, 60%)',
  collision: 'hsl(0, 84%, 60%)',
  dropTarget: 'hsl(142, 71%, 45%)',
  defaultBorder: 'var(--border)',
};
