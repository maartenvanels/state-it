import type { StateMachineModel } from '../types/codegen';
import { DATA_TYPE_TO_SCL } from '../types/variable';

/**
 * Generate Siemens TIA Portal SCL code from a state machine model
 * Target: S7-1500
 */
export function generateSCL(model: StateMachineModel): string {
  if (model.states.length === 0) {
    return '// No states defined\n';
  }

  const lines: string[] = [];
  const fbName = `FB_${model.name}`;
  const rootStates = model.states.filter((s) => s.parentId === null);
  const events = collectEvents(model);

  lines.push(`FUNCTION_BLOCK "${fbName}"`);
  lines.push('');

  // VAR_INPUT
  lines.push('VAR_INPUT');
  if (events.length > 0) {
    for (const event of events) {
      lines.push(`    x${capitalize(event)} : BOOL;`);
    }
  }
  // User input variables
  for (const v of model.variables.filter((v) => v.scope === 'input')) {
    const sclType = DATA_TYPE_TO_SCL[v.dataType];
    const comment = v.description ? ` // ${v.description}` : '';
    lines.push(`    ${v.name} : ${sclType};${comment}`);
  }
  lines.push('END_VAR');
  lines.push('');

  // VAR_OUTPUT
  lines.push('VAR_OUTPUT');
  lines.push(`    iActState : INT;`);
  lines.push(`    iPrevState : INT;`);
  // User output variables
  for (const v of model.variables.filter((v) => v.scope === 'output')) {
    const sclType = DATA_TYPE_TO_SCL[v.dataType];
    const comment = v.description ? ` // ${v.description}` : '';
    lines.push(`    ${v.name} : ${sclType};${comment}`);
  }
  lines.push('END_VAR');
  lines.push('');

  // VAR (internal)
  lines.push('VAR');
  lines.push(`    sState : INT;`);
  lines.push(`    sPrevState : INT;`);
  // Sub-state variables
  for (const state of model.states) {
    if (state.childIds.length === 0) continue;
    lines.push(`    sSubState_${state.safeName} : INT;`);
  }
  // User local variables
  for (const v of model.variables.filter((v) => v.scope === 'local')) {
    const sclType = DATA_TYPE_TO_SCL[v.dataType];
    const comment = v.description ? ` // ${v.description}` : '';
    lines.push(`    ${v.name} : ${sclType};${comment}`);
  }
  lines.push('END_VAR');
  lines.push('');

  // VAR CONSTANT - state numbers
  lines.push('VAR CONSTANT');
  rootStates.forEach((state, i) => {
    lines.push(`    s${state.safeName} : INT := ${i};`);
  });
  // Sub-state constants
  for (const state of model.states) {
    if (state.childIds.length === 0) continue;
    const children = model.states.filter((s) => state.childIds.includes(s.id));
    children.forEach((child, i) => {
      lines.push(`    sSUB_${state.safeName}_${child.safeName} : INT := ${i};`);
    });
  }
  // User parameters
  for (const v of model.variables.filter((v) => v.scope === 'parameter')) {
    const sclType = DATA_TYPE_TO_SCL[v.dataType];
    const init = v.initialValue ? ` := ${v.initialValue}` : '';
    lines.push(`    ${v.name} : ${sclType}${init};`);
  }
  lines.push('END_VAR');
  lines.push('');

  // BEGIN - main logic
  lines.push('BEGIN');
  lines.push(`    #sPrevState := #sState;`);
  lines.push('');
  lines.push(`    CASE #sState OF`);

  for (const state of rootStates) {
    lines.push(`        #s${state.safeName}:`);

    // During actions
    if (state.actions.during.length > 0) {
      lines.push('            (* During actions *)');
      for (const action of state.actions.during) {
        lines.push(`            ${action};`);
      }
      lines.push('');
    }

    // Transitions
    const outgoing = model.transitions
      .filter((t) => t.sourceId === state.id && !t.isDefault)
      .sort((a, b) => a.priority - b.priority);

    if (outgoing.length > 0) {
      lines.push('            (* Check transitions *)');

      for (let i = 0; i < outgoing.length; i++) {
        const trans = outgoing[i];
        const targetState = model.states.find((s) => s.id === trans.targetId);
        if (!targetState) continue;

        const condParts: string[] = [];
        if (trans.event) {
          condParts.push(`#x${capitalize(trans.event)}`);
        }
        if (trans.condition) {
          condParts.push(trans.condition);
        }

        const condition = condParts.length > 0
          ? condParts.join(' AND ')
          : 'TRUE';

        const keyword = i === 0 ? 'IF' : 'ELSIF';
        lines.push(`            ${keyword} ${condition} THEN`);

        // Exit actions
        if (state.actions.exit.length > 0) {
          lines.push(`                (* Exit ${state.name} *)`);
          for (const action of state.actions.exit) {
            lines.push(`                ${action};`);
          }
        }

        // Condition action
        if (trans.conditionAction) {
          lines.push(`                ${trans.conditionAction};`);
        }

        // Transition action
        if (trans.transitionAction) {
          lines.push(`                (* Transition action *)`);
          lines.push(`                ${trans.transitionAction};`);
        }

        // State change
        lines.push(`                #sState := #s${targetState.safeName};`);

        // Entry actions of target
        if (targetState.actions.entry.length > 0) {
          lines.push(`                (* Entry ${targetState.name} *)`);
          for (const action of targetState.actions.entry) {
            lines.push(`                ${action};`);
          }
        }
      }

      lines.push(`            END_IF;`);
    }

    lines.push('');
  }

  lines.push(`    END_CASE;`);
  lines.push('');

  // Output assignments
  lines.push(`    (* Output state info *)`);
  lines.push(`    #iActState := #sState;`);
  lines.push(`    #iPrevState := #sPrevState;`);
  lines.push('');
  lines.push(`END_FUNCTION_BLOCK`);
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

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
