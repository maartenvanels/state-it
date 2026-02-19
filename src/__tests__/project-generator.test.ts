import { describe, it, expect } from 'vitest';
import { generateProject } from '@/lib/codegen/project-generator';
import type { CanvasNode, TransitionEdge } from '@/lib/types/canvas';
import type { Variable } from '@/lib/types/variable';
import type { StateBlock } from '@/lib/types/state';
import { nanoid } from 'nanoid';

// ─── Helpers ────────────────────────────────────────────────────

function makeStateNode(
  name: string,
  opts: { isDefault?: boolean; parentId?: string | null } = {}
): CanvasNode {
  const id = nanoid();
  const stateBlock: StateBlock = {
    id,
    name,
    parentId: opts.parentId ?? null,
    decomposition: 'exclusive',
    position: { x: 0, y: 0 },
    size: { width: 200, height: 150 },
    actions: { entry: [], during: [], exit: [] },
    isDefault: opts.isDefault ?? false,
    executionOrder: 0,
    color: null,
  };

  return {
    id,
    type: 'stateNode',
    position: { x: 0, y: 0 },
    data: {
      stateBlock,
      isHighlighted: false,
      isDropTarget: false,
      validationErrors: [],
    },
  } as CanvasNode;
}

function makeTransitionEdge(
  sourceId: string,
  targetId: string,
  opts: { event?: string } = {}
): TransitionEdge {
  const id = nanoid();
  return {
    id,
    source: sourceId,
    target: targetId,
    type: 'transition',
    data: {
      transitionId: id,
      label: {
        event: opts.event ?? null,
        condition: null,
        conditionAction: null,
        transitionAction: null,
      },
      priority: 0,
      isDefault: false,
      labelOffsetX: 0,
      labelOffsetY: 0,
    },
  } as TransitionEdge;
}

function makeTestCanvas() {
  const idle = makeStateNode('Idle', { isDefault: true });
  const running = makeStateNode('Running');
  const edge = makeTransitionEdge(idle.id, running.id, { event: 'start' });
  const backEdge = makeTransitionEdge(running.id, idle.id, { event: 'stop' });

  return {
    nodes: [idle, running] as CanvasNode[],
    edges: [edge, backEdge] as TransitionEdge[],
    variables: [] as Variable[],
    projectName: 'TestMachine',
  };
}

// ─── Tests ──────────────────────────────────────────────────────

describe('Project Generator', () => {
  describe('target: both', () => {
    it('generates 3 files (.h, .c, .scl)', () => {
      const canvas = makeTestCanvas();
      const result = generateProject({ ...canvas, target: 'both' });

      expect(result.files).toHaveLength(3);
      expect(result.files[0].filename).toBe('testmachine.h');
      expect(result.files[1].filename).toBe('testmachine.c');
      expect(result.files[2].filename).toBe('testmachine.scl');
    });

    it('assigns correct languages', () => {
      const canvas = makeTestCanvas();
      const result = generateProject({ ...canvas, target: 'both' });

      expect(result.files[0].language).toBe('c');
      expect(result.files[1].language).toBe('c');
      expect(result.files[2].language).toBe('scl');
    });

    it('assigns correct categories', () => {
      const canvas = makeTestCanvas();
      const result = generateProject({ ...canvas, target: 'both' });

      expect(result.files[0].category).toBe('header');
      expect(result.files[1].category).toBe('source');
      expect(result.files[2].category).toBe('scl');
    });
  });

  describe('target: c', () => {
    it('generates only C files (.h, .c)', () => {
      const canvas = makeTestCanvas();
      const result = generateProject({ ...canvas, target: 'c' });

      expect(result.files).toHaveLength(2);
      expect(result.files.every((f) => f.language === 'c')).toBe(true);
      expect(result.files[0].filename).toBe('testmachine.h');
      expect(result.files[1].filename).toBe('testmachine.c');
    });
  });

  describe('target: scl', () => {
    it('generates only SCL file', () => {
      const canvas = makeTestCanvas();
      const result = generateProject({ ...canvas, target: 'scl' });

      expect(result.files).toHaveLength(1);
      expect(result.files[0].language).toBe('scl');
      expect(result.files[0].filename).toBe('testmachine.scl');
    });
  });

  describe('empty canvas', () => {
    it('returns empty files array when no state nodes', () => {
      const result = generateProject({
        nodes: [],
        edges: [],
        variables: [],
        projectName: 'Empty',
        target: 'both',
      });

      expect(result.files).toHaveLength(0);
      expect(result.messages).toHaveLength(0);
    });
  });

  describe('file content', () => {
    it('header file contains state enum', () => {
      const canvas = makeTestCanvas();
      const result = generateProject({ ...canvas, target: 'c' });
      const header = result.files.find((f) => f.category === 'header');

      expect(header).toBeDefined();
      expect(header!.content).toContain('STATE_IDLE');
      expect(header!.content).toContain('STATE_RUNNING');
    });

    it('source file contains Init and Step functions', () => {
      const canvas = makeTestCanvas();
      const result = generateProject({ ...canvas, target: 'c' });
      const source = result.files.find((f) => f.category === 'source');

      expect(source).toBeDefined();
      expect(source!.content).toContain('_Init(');
      expect(source!.content).toContain('_Step(');
    });

    it('SCL file contains FUNCTION_BLOCK', () => {
      const canvas = makeTestCanvas();
      const result = generateProject({ ...canvas, target: 'scl' });
      const scl = result.files.find((f) => f.category === 'scl');

      expect(scl).toBeDefined();
      expect(scl!.content).toContain('FUNCTION_BLOCK');
    });
  });

  describe('validation messages', () => {
    it('passes through validation messages', () => {
      // Two states with no transitions — one will be unreachable
      const stateA = makeStateNode('Connected', { isDefault: true });
      const stateB = makeStateNode('Isolated');
      const result = generateProject({
        nodes: [stateA, stateB],
        edges: [],
        variables: [],
        projectName: 'Test',
        target: 'c',
      });

      // Should have a warning about unreachable state
      expect(result.messages.length).toBeGreaterThan(0);
      expect(result.messages.some((m) => m.message.includes('unreachable'))).toBe(true);
    });
  });

  describe('safe filename', () => {
    it('lowercases the project name for filenames', () => {
      const canvas = makeTestCanvas();
      const result = generateProject({
        ...canvas,
        projectName: 'MyMotorController',
        target: 'both',
      });

      // model-builder converts to safe name (uppercase) then project-generator lowercases
      for (const file of result.files) {
        expect(file.filename).toMatch(/^[a-z_]+\.(h|c|scl)$/);
      }
    });
  });
});
