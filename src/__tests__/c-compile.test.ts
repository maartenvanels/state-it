import { describe, it, expect } from 'vitest';
import { generateC } from '@/lib/codegen/c-generator';
import type { StateMachineModel } from '@/lib/types/codegen';
import { execSync } from 'child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

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

/**
 * Write generated C to temp files, compile with gcc, and optionally run.
 * Returns { compiled: boolean, output?: string, error?: string }
 */
function compileAndRun(
  model: StateMachineModel,
  mainC: string
): { compiled: boolean; ran: boolean; output: string; error: string } {
  const dir = mkdtempSync(join(tmpdir(), 'stateit-'));
  const smName = model.name.toLowerCase();

  try {
    const { header, source } = generateC(model);

    writeFileSync(join(dir, `${smName}.h`), header);
    writeFileSync(join(dir, `${smName}.c`), source);
    writeFileSync(join(dir, 'main.c'), mainC);

    // Compile
    try {
      execSync(`gcc -Wall -Wextra -Werror -std=c11 -o "${join(dir, 'test.exe')}" "${join(dir, 'main.c')}" "${join(dir, `${smName}.c`)}"`, {
        stdio: 'pipe',
        timeout: 10000,
      });
    } catch (e: unknown) {
      const err = e as { stderr?: Buffer };
      return {
        compiled: false,
        ran: false,
        output: '',
        error: err.stderr?.toString() ?? 'Compilation failed',
      };
    }

    // Run
    try {
      const result = execSync(`"${join(dir, 'test.exe')}"`, {
        stdio: 'pipe',
        timeout: 5000,
      });
      return {
        compiled: true,
        ran: true,
        output: result.toString().replace(/\r\n/g, '\n').trim(),
        error: '',
      };
    } catch (e: unknown) {
      const err = e as { stderr?: Buffer; stdout?: Buffer };
      return {
        compiled: true,
        ran: false,
        output: err.stdout?.toString() ?? '',
        error: err.stderr?.toString() ?? 'Runtime error',
      };
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// ─── Tests ──────────────────────────────────────────────────────

describe('C Generator - GCC Compilation', () => {
  it('basic two-state machine compiles and runs', () => {
    const model: StateMachineModel = {
      name: 'SM',
      states: [
        makeState('s1', 'Idle', { isDefault: true }),
        makeState('s2', 'Running'),
      ],
      transitions: [
        makeTrans('t1', 's1', 's2', { event: 'start' }),
        makeTrans('t2', 's2', 's1', { event: 'stop' }),
      ],
      variables: [],
      rootStateIds: ['s1', 's2'],
      defaultStateId: 's1',
    };

    const mainC = `
#include <stdio.h>
#include "sm.h"

int main(void) {
    SM sm;
    SM_Init(&sm);
    printf("init: %d\\n", sm.currentState);

    SM_Step(&sm, SM_EVENT_START);
    printf("after start: %d\\n", sm.currentState);

    SM_Step(&sm, SM_EVENT_STOP);
    printf("after stop: %d\\n", sm.currentState);

    return 0;
}
`;

    const result = compileAndRun(model, mainC);
    expect(result.error).toBe('');
    expect(result.compiled).toBe(true);
    expect(result.ran).toBe(true);
    expect(result.output).toBe('init: 0\nafter start: 1\nafter stop: 0');
  });

  it('conditions with variables compile and evaluate correctly', () => {
    const model: StateMachineModel = {
      name: 'SM',
      states: [
        makeState('s1', 'Off', { isDefault: true }),
        makeState('s2', 'On'),
      ],
      transitions: [
        makeTrans('t1', 's1', 's2', { event: 'go', condition: 'speed > 50' }),
        makeTrans('t2', 's2', 's1', { event: 'halt' }),
      ],
      variables: [
        { id: 'v1', name: 'speed', scope: 'local', dataType: 'int32', initialValue: '0', description: '' },
      ],
      rootStateIds: ['s1', 's2'],
      defaultStateId: 's1',
    };

    const mainC = `
#include <stdio.h>
#include "sm.h"

int main(void) {
    SM sm;
    SM_Init(&sm);

    // speed=0, condition false -> should stay in Off
    SM_Step(&sm, SM_EVENT_GO);
    printf("speed=0: %d\\n", sm.currentState);

    // speed=100, condition true -> should go to On
    sm.speed = 100;
    SM_Step(&sm, SM_EVENT_GO);
    printf("speed=100: %d\\n", sm.currentState);

    return 0;
}
`;

    const result = compileAndRun(model, mainC);
    expect(result.error).toBe('');
    expect(result.compiled).toBe(true);
    expect(result.ran).toBe(true);
    // STATE_OFF=0, STATE_ON=1
    expect(result.output).toBe('speed=0: 0\nspeed=100: 1');
  });

  it('entry/during/exit actions compile and execute correctly', () => {
    const model: StateMachineModel = {
      name: 'SM',
      states: [
        makeState('s1', 'Idle', {
          isDefault: true,
          entry: ['counter = 10'],
          during: ['counter++'],
          exit: ['counter = 0'],
        }),
        makeState('s2', 'Active', {
          entry: ['counter = 99'],
        }),
      ],
      transitions: [
        makeTrans('t1', 's1', 's2', { event: 'go' }),
        makeTrans('t2', 's2', 's1', { event: 'back' }),
      ],
      variables: [
        { id: 'v1', name: 'counter', scope: 'local', dataType: 'int32', initialValue: '0', description: '' },
      ],
      rootStateIds: ['s1', 's2'],
      defaultStateId: 's1',
    };

    const mainC = `
#include <stdio.h>
#include "sm.h"

int main(void) {
    SM sm;
    SM_Init(&sm);
    printf("after init: counter=%d\\n", sm.counter);

    // Step without event -> during action (counter++)
    SM_Step(&sm, SM_EVENT_NONE);
    printf("after during: counter=%d\\n", sm.counter);

    SM_Step(&sm, SM_EVENT_NONE);
    printf("after during2: counter=%d\\n", sm.counter);

    // Transition to Active -> exit(counter=0) then entry(counter=99)
    SM_Step(&sm, SM_EVENT_GO);
    printf("after go: counter=%d state=%d\\n", sm.counter, sm.currentState);

    return 0;
}
`;

    const result = compileAndRun(model, mainC);
    expect(result.error).toBe('');
    expect(result.compiled).toBe(true);
    expect(result.ran).toBe(true);
    expect(result.output).toBe(
      'after init: counter=10\n' +
      'after during: counter=11\n' +
      'after during2: counter=12\n' +
      'after go: counter=99 state=1'
    );
  });

  it('compound assignment and modulo compile correctly', () => {
    const model: StateMachineModel = {
      name: 'SM',
      states: [
        makeState('s1', 'A', {
          isDefault: true,
          entry: ['val = 100'],
          during: ['val -= 7'],
        }),
        makeState('s2', 'B', {
          entry: ['val %= 10'],
        }),
      ],
      transitions: [
        makeTrans('t1', 's1', 's2', { condition: 'val <= 50' }),
        makeTrans('t2', 's2', 's1', { event: 'reset' }),
      ],
      variables: [
        { id: 'v1', name: 'val', scope: 'local', dataType: 'int32', initialValue: '0', description: '' },
      ],
      rootStateIds: ['s1', 's2'],
      defaultStateId: 's1',
    };

    const mainC = `
#include <stdio.h>
#include "sm.h"

int main(void) {
    SM sm;
    SM_Init(&sm);
    printf("init: val=%d\\n", sm.val);

    // Step: during(val-=7), then check val<=50 -> false (93)
    SM_Step(&sm, SM_EVENT_NONE);
    printf("step1: val=%d state=%d\\n", sm.val, sm.currentState);

    // Keep stepping until condition triggers
    for (int i = 0; i < 7; i++) {
        SM_Step(&sm, SM_EVENT_NONE);
    }
    printf("step8: val=%d state=%d\\n", sm.val, sm.currentState);

    return 0;
}
`;

    const result = compileAndRun(model, mainC);
    expect(result.error).toBe('');
    expect(result.compiled).toBe(true);
    expect(result.ran).toBe(true);
    // Step 1: 100-7=93, still in A (state 0)
    // After 8 total steps: 100-(8*7)=44, val<=50 -> transition to B, entry sets val=44%10=4
    expect(result.output).toContain('init: val=100');
    expect(result.output).toContain('step1: val=93 state=0');
    expect(result.output).toContain('step8:');
    expect(result.output).toContain('state=1');
  });

  it('logical operators && || ! compile correctly', () => {
    const model: StateMachineModel = {
      name: 'SM',
      states: [
        makeState('s1', 'Wait', { isDefault: true }),
        makeState('s2', 'Go'),
      ],
      transitions: [
        makeTrans('t1', 's1', 's2', { condition: 'ready && !blocked || forced' }),
        makeTrans('t2', 's2', 's1', { event: 'reset' }),
      ],
      variables: [
        { id: 'v1', name: 'ready', scope: 'local', dataType: 'boolean', initialValue: 'false', description: '' },
        { id: 'v2', name: 'blocked', scope: 'local', dataType: 'boolean', initialValue: 'false', description: '' },
        { id: 'v3', name: 'forced', scope: 'local', dataType: 'boolean', initialValue: 'false', description: '' },
      ],
      rootStateIds: ['s1', 's2'],
      defaultStateId: 's1',
    };

    const mainC = `
#include <stdio.h>
#include "sm.h"

int main(void) {
    SM sm;
    SM_Init(&sm);

    // All false -> stay
    SM_Step(&sm, SM_EVENT_NONE);
    printf("all false: %d\\n", sm.currentState);

    // ready=true, blocked=false -> ready && !blocked = true -> go
    sm.ready = true;
    SM_Step(&sm, SM_EVENT_NONE);
    printf("ready+unblocked: %d\\n", sm.currentState);

    return 0;
}
`;

    const result = compileAndRun(model, mainC);
    expect(result.error).toBe('');
    expect(result.compiled).toBe(true);
    expect(result.ran).toBe(true);
    expect(result.output).toBe('all false: 0\nready+unblocked: 1');
  });

  it('temporal logic after(n, tick) compiles and works', () => {
    const model: StateMachineModel = {
      name: 'SM',
      states: [
        makeState('s1', 'Red', { isDefault: true }),
        makeState('s2', 'Green'),
      ],
      transitions: [
        makeTrans('t1', 's1', 's2', { condition: 'after(3, tick)' }),
        makeTrans('t2', 's2', 's1', { condition: 'after(2, tick)' }),
      ],
      variables: [],
      rootStateIds: ['s1', 's2'],
      defaultStateId: 's1',
    };

    // No events → SM_Step takes only sm pointer
    const mainC = `
#include <stdio.h>
#include "sm.h"

int main(void) {
    SM sm;
    SM_Init(&sm);

    for (int i = 1; i <= 8; i++) {
        SM_Step(&sm);
        printf("step %d: state=%d\\n", i, sm.currentState);
    }

    return 0;
}
`;

    const result = compileAndRun(model, mainC);
    expect(result.error).toBe('');
    expect(result.compiled).toBe(true);
    expect(result.ran).toBe(true);

    const lines = result.output.split('\n');
    // Tick 1,2: still Red (tick count 1,2 < 3)
    expect(lines[0]).toContain('state=0');
    expect(lines[1]).toContain('state=0');
    // Tick 3: after(3,tick) -> Green
    expect(lines[2]).toContain('state=1');
    // Tick 4: tick count reset, 1 < 2, still Green
    expect(lines[3]).toContain('state=1');
    // Tick 5: after(2,tick) -> back to Red
    expect(lines[4]).toContain('state=0');
  });

  it('min/max built-in functions compile correctly', () => {
    const model: StateMachineModel = {
      name: 'SM',
      states: [
        makeState('s1', 'Ramp', {
          isDefault: true,
          during: ['speed = min(speed + 30, 100)'],
        }),
        makeState('s2', 'Done'),
      ],
      transitions: [
        makeTrans('t1', 's1', 's2', { condition: 'speed >= 100' }),
      ],
      variables: [
        { id: 'v1', name: 'speed', scope: 'local', dataType: 'int32', initialValue: '0', description: '' },
      ],
      rootStateIds: ['s1', 's2'],
      defaultStateId: 's1',
    };

    // No events → SM_Step takes only sm pointer
    const mainC = `
#include <stdio.h>
#include "sm.h"

int main(void) {
    SM sm;
    SM_Init(&sm);

    for (int i = 1; i <= 5; i++) {
        SM_Step(&sm);
        printf("step %d: speed=%d state=%d\\n", i, sm.speed, sm.currentState);
    }

    return 0;
}
`;

    const result = compileAndRun(model, mainC);
    expect(result.error).toBe('');
    expect(result.compiled).toBe(true);
    expect(result.ran).toBe(true);

    const lines = result.output.split('\n');
    expect(lines[0]).toContain('speed=30 state=0');
    expect(lines[1]).toContain('speed=60 state=0');
    expect(lines[2]).toContain('speed=90 state=0');
    // step 4: min(120,100)=100, then condition triggers -> Done
    expect(lines[3]).toContain('speed=100 state=1');
  });
});
