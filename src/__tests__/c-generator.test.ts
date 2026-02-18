import { describe, it, expect } from 'vitest';
import { generateC } from '@/lib/codegen/c-generator';
import type { StateMachineModel } from '@/lib/types/codegen';

// ─── Helpers ────────────────────────────────────────────────────

function makeState(
  id: string,
  name: string,
  opts: {
    safeName?: string;
    isDefault?: boolean;
    entry?: string[];
    during?: string[];
    exit?: string[];
  } = {}
) {
  return {
    id,
    name,
    safeName: opts.safeName ?? name.toUpperCase(),
    parentId: null,
    decomposition: 'exclusive' as const,
    isDefault: opts.isDefault ?? false,
    childIds: [],
    actions: {
      entry: opts.entry ?? [],
      during: opts.during ?? [],
      exit: opts.exit ?? [],
    },
  };
}

function makeTrans(
  id: string,
  sourceId: string,
  targetId: string,
  opts: {
    event?: string;
    condition?: string;
    conditionAction?: string;
    transitionAction?: string;
    priority?: number;
  } = {}
) {
  return {
    id,
    sourceId,
    targetId,
    event: opts.event ?? null,
    condition: opts.condition ?? null,
    conditionAction: opts.conditionAction ?? null,
    transitionAction: opts.transitionAction ?? null,
    priority: opts.priority ?? 0,
    isDefault: false,
  };
}

function makeModel(overrides: Partial<StateMachineModel> = {}): StateMachineModel {
  const idle = makeState('s1', 'Idle', { isDefault: true });
  const running = makeState('s2', 'Running');

  return {
    name: 'SM',
    states: [idle, running],
    transitions: [
      makeTrans('t1', 's1', 's2', { event: 'start' }),
      makeTrans('t2', 's2', 's1', { event: 'stop' }),
    ],
    variables: [],
    rootStateIds: ['s1', 's2'],
    defaultStateId: 's1',
    ...overrides,
  };
}

// ─── Tests ──────────────────────────────────────────────────────

describe('C Generator', () => {
  describe('basic two-state machine', () => {
    const model = makeModel();
    const { header, source } = generateC(model);

    it('generates state enum', () => {
      expect(header).toContain('STATE_IDLE = 0');
      expect(header).toContain('STATE_RUNNING');
    });

    it('generates event enum', () => {
      expect(header).toContain('SM_EVENT_NONE = 0');
      expect(header).toContain('SM_EVENT_START');
      expect(header).toContain('SM_EVENT_STOP');
    });

    it('generates struct with currentState and previousState', () => {
      expect(header).toContain('SM_State currentState;');
      expect(header).toContain('SM_State previousState;');
    });

    it('generates Init function setting default state', () => {
      expect(source).toContain('void SM_Init(SM* sm)');
      expect(source).toContain('sm->currentState = STATE_IDLE;');
    });

    it('generates Step function with switch/case', () => {
      expect(source).toContain('void SM_Step(SM* sm, SM_Event event)');
      expect(source).toContain('switch (sm->currentState)');
      expect(source).toContain('case STATE_IDLE:');
      expect(source).toContain('case STATE_RUNNING:');
    });

    it('generates event-guarded transitions', () => {
      expect(source).toContain('event == SM_EVENT_START');
      expect(source).toContain('sm->currentState = STATE_RUNNING;');
      expect(source).toContain('event == SM_EVENT_STOP');
      expect(source).toContain('sm->currentState = STATE_IDLE;');
    });

    it('includes header guard', () => {
      expect(header).toContain('#ifndef SM_H');
      expect(header).toContain('#define SM_H');
      expect(header).toContain('#endif');
    });

    it('includes standard headers', () => {
      expect(header).toContain('#include <stdint.h>');
      expect(header).toContain('#include <stdbool.h>');
    });
  });

  describe('conditions are translated', () => {
    it('translates condition with variable prefix', () => {
      const model = makeModel({
        variables: [
          { id: 'v1', name: 'speed', scope: 'local', dataType: 'int32', initialValue: '0', description: '' },
        ],
        transitions: [
          makeTrans('t1', 's1', 's2', { event: 'start', condition: 'speed > 100' }),
          makeTrans('t2', 's2', 's1', { event: 'stop' }),
        ],
      });
      const { source } = generateC(model);
      expect(source).toContain('sm->speed > 100');
    });

    it('translates logical operators', () => {
      const model = makeModel({
        variables: [
          { id: 'v1', name: 'a', scope: 'local', dataType: 'boolean', initialValue: 'false', description: '' },
          { id: 'v2', name: 'b', scope: 'local', dataType: 'boolean', initialValue: 'false', description: '' },
        ],
        transitions: [
          makeTrans('t1', 's1', 's2', { condition: 'a && b' }),
          makeTrans('t2', 's2', 's1', { condition: '!a || b' }),
        ],
      });
      const { source } = generateC(model);
      expect(source).toContain('sm->a && sm->b');
      expect(source).toContain('!sm->a || sm->b');
    });

    it('translates equality and comparison', () => {
      const model = makeModel({
        variables: [
          { id: 'v1', name: 'x', scope: 'local', dataType: 'int32', initialValue: '0', description: '' },
        ],
        transitions: [
          makeTrans('t1', 's1', 's2', { condition: 'x == 0' }),
          makeTrans('t2', 's2', 's1', { condition: 'x != 0 && x <= 10' }),
        ],
      });
      const { source } = generateC(model);
      expect(source).toContain('sm->x == 0');
      expect(source).toContain('sm->x != 0');
      expect(source).toContain('sm->x <= 10');
    });
  });

  describe('actions are translated', () => {
    it('translates entry/during/exit actions', () => {
      const model = makeModel({
        variables: [
          { id: 'v1', name: 'count', scope: 'local', dataType: 'int32', initialValue: '0', description: '' },
        ],
        states: [
          makeState('s1', 'Idle', {
            isDefault: true,
            entry: ['count = 0'],
            during: ['count++'],
            exit: ['count = -1'],
          }),
          makeState('s2', 'Running'),
        ],
      });
      const { source } = generateC(model);
      // entry
      expect(source).toContain('sm->count = 0;');
      // during
      expect(source).toContain('sm->count++;');
      // exit
      expect(source).toContain('sm->count = -1;');
    });

    it('translates transition actions', () => {
      const model = makeModel({
        variables: [
          { id: 'v1', name: 'x', scope: 'local', dataType: 'int32', initialValue: '0', description: '' },
        ],
        transitions: [
          makeTrans('t1', 's1', 's2', {
            event: 'start',
            conditionAction: 'x = 0',
            transitionAction: 'x += 10',
          }),
          makeTrans('t2', 's2', 's1', { event: 'stop' }),
        ],
      });
      const { source } = generateC(model);
      expect(source).toContain('sm->x = 0;');
      expect(source).toContain('sm->x += 10;');
    });

    it('translates compound assignment and increment', () => {
      const model = makeModel({
        variables: [
          { id: 'v1', name: 'val', scope: 'local', dataType: 'int32', initialValue: '0', description: '' },
        ],
        states: [
          makeState('s1', 'Idle', { isDefault: true, during: ['val += 5'] }),
          makeState('s2', 'Running', { during: ['val--'] }),
        ],
      });
      const { source } = generateC(model);
      expect(source).toContain('sm->val += 5;');
      expect(source).toContain('sm->val--;');
    });
  });

  describe('built-in functions', () => {
    it('translates min/max to ternary', () => {
      const model = makeModel({
        variables: [
          { id: 'v1', name: 'speed', scope: 'local', dataType: 'int32', initialValue: '0', description: '' },
          { id: 'v2', name: 'target', scope: 'local', dataType: 'int32', initialValue: '0', description: '' },
        ],
        states: [
          makeState('s1', 'Idle', { isDefault: true, during: ['speed = min(speed, target)'] }),
          makeState('s2', 'Running'),
        ],
      });
      const { source } = generateC(model);
      // min is translated to ternary
      expect(source).toContain('sm->speed');
      expect(source).toContain('sm->target');
      expect(source).toMatch(/\?/); // ternary operator present
    });
  });

  describe('variables', () => {
    it('declares variables in struct', () => {
      const model = makeModel({
        variables: [
          { id: 'v1', name: 'counter', scope: 'local', dataType: 'int32', initialValue: '0', description: '' },
          { id: 'v2', name: 'isReady', scope: 'local', dataType: 'boolean', initialValue: 'false', description: '' },
          { id: 'v3', name: 'temp', scope: 'local', dataType: 'float', initialValue: '0.0', description: '' },
        ],
      });
      const { header, source } = generateC(model);
      expect(header).toContain('int32_t counter;');
      expect(header).toContain('bool isReady;');
      expect(header).toContain('float temp;');
      // Init sets initial values
      expect(source).toContain('sm->counter = 0;');
      expect(source).toContain('sm->isReady = false;');
      expect(source).toContain('sm->temp = 0.0;');
    });
  });

  describe('temporal logic', () => {
    it('adds tick counter when temporal expressions are used', () => {
      const model = makeModel({
        transitions: [
          makeTrans('t1', 's1', 's2', { condition: 'after(100, tick)' }),
          makeTrans('t2', 's2', 's1', { condition: 'after(50, tick)' }),
        ],
      });
      const { header, source } = generateC(model);
      expect(header).toContain('uint32_t _stateTickCount;');
      expect(source).toContain('sm->_stateTickCount++;');
      expect(source).toContain('sm->_stateTickCount >= 100');
      expect(source).toContain('sm->_stateTickCount = 0;');
    });

    it('does not add tick counter when no temporal expressions', () => {
      const model = makeModel();
      const { header, source } = generateC(model);
      expect(header).not.toContain('_stateTickCount');
      expect(source).not.toContain('_stateTickCount');
    });
  });

  describe('empty model', () => {
    it('returns placeholder for empty model', () => {
      const model: StateMachineModel = {
        name: 'Empty',
        states: [],
        transitions: [],
        variables: [],
        rootStateIds: [],
        defaultStateId: null,
      };
      const { header, source } = generateC(model);
      expect(header).toContain('No states defined');
      expect(source).toContain('No states defined');
    });
  });

  describe('eventless transitions', () => {
    it('generates unconditional transition without event check', () => {
      const model = makeModel({
        transitions: [
          makeTrans('t1', 's1', 's2'), // no event, no condition
          makeTrans('t2', 's2', 's1', { event: 'reset' }),
        ],
      });
      const { source } = generateC(model);
      // The unconditional transition from Idle should not check any event
      expect(source).toContain('case STATE_IDLE:');
      // Should have a block without if (for unconditional)
      expect(source).toContain('sm->currentState = STATE_RUNNING;');
    });
  });

  describe('transition priority ordering', () => {
    it('generates if/else if chain in priority order', () => {
      const model = makeModel({
        transitions: [
          makeTrans('t1', 's1', 's2', { event: 'go', condition: 'x > 10', priority: 2 }),
          makeTrans('t2', 's1', 's2', { event: 'go', condition: 'x > 5', priority: 1 }),
          makeTrans('t3', 's2', 's1', { event: 'stop' }),
        ],
        variables: [
          { id: 'v1', name: 'x', scope: 'local', dataType: 'int32', initialValue: '0', description: '' },
        ],
      });
      const { source } = generateC(model);
      // Priority 1 (x > 5) should come first as 'if', priority 2 (x > 10) as 'else if'
      const idxFirst = source.indexOf('sm->x > 5');
      const idxSecond = source.indexOf('sm->x > 10');
      expect(idxFirst).toBeGreaterThan(-1);
      expect(idxSecond).toBeGreaterThan(-1);
      expect(idxFirst).toBeLessThan(idxSecond);
    });
  });
});
