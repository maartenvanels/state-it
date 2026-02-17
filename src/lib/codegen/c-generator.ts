import type { StateMachineModel, GeneratedCode } from '../types/codegen';
import { DATA_TYPE_TO_C } from '../types/variable';

/**
 * Generate C code from a state machine model
 */
export function generateC(model: StateMachineModel): GeneratedCode {
  if (model.states.length === 0) {
    return {
      header: '/* No states defined */\n',
      source: '/* No states defined */\n',
    };
  }

  const sm = model.name;
  const header = generateHeader(model, sm);
  const source = generateSource(model, sm);

  return { header, source };
}

function generateHeader(model: StateMachineModel, sm: string): string {
  const lines: string[] = [];
  const guard = `${sm}_H`;

  lines.push(`#ifndef ${guard}`);
  lines.push(`#define ${guard}`);
  lines.push('');
  lines.push('#include <stdint.h>');
  lines.push('#include <stdbool.h>');
  lines.push('');

  // State enumeration
  lines.push('/* State enumeration */');
  lines.push(`typedef enum {`);
  const rootStates = model.states.filter((s) => s.parentId === null);
  rootStates.forEach((state, i) => {
    const comma = i < rootStates.length - 1 ? ',' : '';
    const val = i === 0 ? ' = 0' : '';
    lines.push(`    STATE_${state.safeName}${val}${comma}`);
  });
  lines.push(`} ${sm}_State;`);
  lines.push('');

  // Child state enumerations for hierarchical states
  for (const state of model.states) {
    if (state.childIds.length === 0) continue;
    const children = model.states.filter((s) => state.childIds.includes(s.id));
    lines.push(`/* Sub-states of ${state.name} */`);
    lines.push(`typedef enum {`);
    children.forEach((child, i) => {
      const comma = i < children.length - 1 ? ',' : '';
      const val = i === 0 ? ' = 0' : '';
      lines.push(`    SUBSTATE_${state.safeName}_${child.safeName}${val}${comma}`);
    });
    lines.push(`} ${sm}_SubState_${state.safeName};`);
    lines.push('');
  }

  // Events enumeration
  const events = collectEvents(model);
  if (events.length > 0) {
    lines.push('/* Event enumeration */');
    lines.push(`typedef enum {`);
    lines.push(`    ${sm}_EVENT_NONE = 0,`);
    events.forEach((event, i) => {
      const comma = i < events.length - 1 ? ',' : '';
      lines.push(`    ${sm}_EVENT_${event.toUpperCase()}${comma}`);
    });
    lines.push(`} ${sm}_Event;`);
    lines.push('');
  }

  // State machine struct
  lines.push('/* State machine structure */');
  lines.push(`typedef struct {`);
  lines.push(`    ${sm}_State currentState;`);
  lines.push(`    ${sm}_State previousState;`);

  // Sub-state variables
  for (const state of model.states) {
    if (state.childIds.length === 0) continue;
    lines.push(`    ${sm}_SubState_${state.safeName} subState_${state.safeName};`);
  }

  // User variables
  if (model.variables.length > 0) {
    lines.push('    /* Variables */');
    for (const v of model.variables) {
      const cType = DATA_TYPE_TO_C[v.dataType];
      lines.push(`    ${cType} ${v.name};`);
    }
  }

  lines.push(`} ${sm};`);
  lines.push('');

  // Function prototypes
  lines.push('/* Function prototypes */');
  lines.push(`void ${sm}_Init(${sm}* sm);`);
  if (events.length > 0) {
    lines.push(`void ${sm}_Step(${sm}* sm, ${sm}_Event event);`);
  } else {
    lines.push(`void ${sm}_Step(${sm}* sm);`);
  }
  lines.push('');

  lines.push(`#endif /* ${guard} */`);
  lines.push('');

  return lines.join('\n');
}

function generateSource(model: StateMachineModel, sm: string): string {
  const lines: string[] = [];
  const events = collectEvents(model);
  const rootStates = model.states.filter((s) => s.parentId === null);

  lines.push(`#include "${sm.toLowerCase()}.h"`);
  lines.push('');

  // Init function
  lines.push(`void ${sm}_Init(${sm}* sm) {`);
  const defaultState = model.states.find((s) => s.id === model.defaultStateId);
  if (defaultState) {
    lines.push(`    sm->currentState = STATE_${defaultState.safeName};`);
    lines.push(`    sm->previousState = STATE_${defaultState.safeName};`);
  }

  // Initialize sub-states
  for (const state of model.states) {
    if (state.childIds.length === 0) continue;
    const defaultChild = findDefaultChild(state, model);
    if (defaultChild) {
      lines.push(`    sm->subState_${state.safeName} = SUBSTATE_${state.safeName}_${defaultChild.safeName};`);
    }
  }

  // Initialize variables
  for (const v of model.variables) {
    if (v.initialValue) {
      lines.push(`    sm->${v.name} = ${v.initialValue};`);
    }
  }

  // Execute entry actions of default state
  if (defaultState && defaultState.actions.entry.length > 0) {
    lines.push('    /* Entry actions for initial state */');
    for (const action of defaultState.actions.entry) {
      lines.push(`    ${action};`);
    }
  }

  lines.push('}');
  lines.push('');

  // Step function
  const eventParam = events.length > 0 ? `, ${sm}_Event event` : '';
  lines.push(`void ${sm}_Step(${sm}* sm${eventParam}) {`);
  lines.push(`    sm->previousState = sm->currentState;`);
  lines.push('');
  lines.push(`    switch (sm->currentState) {`);

  for (const state of rootStates) {
    lines.push(`        case STATE_${state.safeName}: {`);

    // During actions
    if (state.actions.during.length > 0) {
      lines.push('            /* During actions */');
      for (const action of state.actions.during) {
        lines.push(`            ${action};`);
      }
      lines.push('');
    }

    // Transitions (sorted by priority)
    const outgoing = model.transitions
      .filter((t) => t.sourceId === state.id && !t.isDefault)
      .sort((a, b) => a.priority - b.priority);

    if (outgoing.length > 0) {
      lines.push('            /* Check transitions */');
      let isFirst = true;

      for (const trans of outgoing) {
        const targetState = model.states.find((s) => s.id === trans.targetId);
        if (!targetState) continue;

        const condParts: string[] = [];
        if (trans.event && events.length > 0) {
          condParts.push(`event == ${sm}_EVENT_${trans.event.toUpperCase()}`);
        }
        if (trans.condition) {
          condParts.push(trans.condition);
        }

        const condition = condParts.length > 0
          ? condParts.join(' && ')
          : null;

        if (condition) {
          const keyword = isFirst ? 'if' : 'else if';
          lines.push(`            ${keyword} (${condition}) {`);
        } else if (!isFirst) {
          lines.push(`            else {`);
        } else {
          lines.push(`            {`);
        }

        // Exit actions
        if (state.actions.exit.length > 0) {
          lines.push(`                /* Exit ${state.name} */`);
          for (const action of state.actions.exit) {
            lines.push(`                ${action};`);
          }
        }

        // Condition action
        if (trans.conditionAction) {
          lines.push(`                /* Condition action */`);
          lines.push(`                ${trans.conditionAction};`);
        }

        // Transition action
        if (trans.transitionAction) {
          lines.push(`                /* Transition action */`);
          lines.push(`                ${trans.transitionAction};`);
        }

        // State change
        lines.push(`                sm->currentState = STATE_${targetState.safeName};`);

        // Entry actions of target
        if (targetState.actions.entry.length > 0) {
          lines.push(`                /* Entry ${targetState.name} */`);
          for (const action of targetState.actions.entry) {
            lines.push(`                ${action};`);
          }
        }

        lines.push(`            }`);
        isFirst = false;
      }
    }

    lines.push('            break;');
    lines.push('        }');
    lines.push('');
  }

  lines.push('        default:');
  lines.push('            break;');
  lines.push('    }');
  lines.push('}');
  lines.push('');

  return lines.join('\n');
}

function collectEvents(model: StateMachineModel): string[] {
  const eventSet = new Set<string>();
  for (const t of model.transitions) {
    if (t.event) {
      eventSet.add(t.event);
    }
  }
  return Array.from(eventSet).sort();
}

function findDefaultChild(
  parent: { childIds: string[] },
  model: StateMachineModel
) {
  // Check for default transition pointing to a child
  const defaultTrans = model.transitions.find(
    (t) => t.isDefault && parent.childIds.includes(t.targetId)
  );
  if (defaultTrans) {
    return model.states.find((s) => s.id === defaultTrans.targetId) ?? null;
  }

  // Check for isDefault flag on children
  const defaultChild = model.states.find(
    (s) => parent.childIds.includes(s.id) && s.isDefault
  );
  if (defaultChild) return defaultChild;

  // Fallback: first child
  return model.states.find((s) => parent.childIds.includes(s.id)) ?? null;
}
