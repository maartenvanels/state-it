import type { StateMachineModel } from '../types/codegen';
import { DATA_TYPE_TO_SCL } from '../types/variable';
import {
  translateConditionToSCL,
  translateActionToSCL,
  usesTemporalLogic,
} from '../syntax/translate';
import type { SCLEmitOptions } from '../syntax/scl-emitter';

/**
 * Generate Siemens TIA Portal SCL code from a state machine model.
 * Target: S7-1500.
 * Conditions and actions are parsed from State-It syntax and translated to SCL.
 */
export function generateSCL(model: StateMachineModel): string {
  if (model.states.length === 0) {
    return '// No states defined\n';
  }

  const lines: string[] = [];
  const fbName = `FB_${model.name}`;
  const rootStates = model.states.filter((s) => s.parentId === null);
  const events = collectEvents(model);
  const varNames = new Set(model.variables.map((v) => v.name));
  const emitOpts: SCLEmitOptions = { varPrefix: '#', variables: varNames };
  const needsTemporal = checkTemporalUsage(model);

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
  // Temporal counter
  if (needsTemporal) {
    lines.push(`    _stateTickCount : UDINT;`);
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

  if (needsTemporal) {
    lines.push(`    #_stateTickCount := #_stateTickCount + 1;`);
  }

  lines.push('');
  lines.push(`    CASE #sState OF`);

  for (const state of rootStates) {
    lines.push(`        #s${state.safeName}:`);

    // During actions
    if (state.actions.during.length > 0) {
      lines.push('            (* During actions *)');
      for (const action of state.actions.during) {
        for (const stmt of translateActionToSCL(action, emitOpts)) {
          lines.push(`            ${stmt}`);
        }
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
          condParts.push(translateConditionToSCL(trans.condition, emitOpts));
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
            for (const stmt of translateActionToSCL(action, emitOpts)) {
              lines.push(`                ${stmt}`);
            }
          }
        }

        // Condition action
        if (trans.conditionAction) {
          for (const stmt of translateActionToSCL(trans.conditionAction, emitOpts)) {
            lines.push(`                ${stmt}`);
          }
        }

        // Transition action
        if (trans.transitionAction) {
          lines.push(`                (* Transition action *)`);
          for (const stmt of translateActionToSCL(trans.transitionAction, emitOpts)) {
            lines.push(`                ${stmt}`);
          }
        }

        // State change
        lines.push(`                #sState := #s${targetState.safeName};`);

        // Reset temporal counter on state change
        if (needsTemporal) {
          lines.push(`                #_stateTickCount := 0;`);
        }

        // Entry actions of target
        if (targetState.actions.entry.length > 0) {
          lines.push(`                (* Entry ${targetState.name} *)`);
          for (const action of targetState.actions.entry) {
            for (const stmt of translateActionToSCL(action, emitOpts)) {
              lines.push(`                ${stmt}`);
            }
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

function checkTemporalUsage(model: StateMachineModel): boolean {
  const allExpressions: string[] = [];
  for (const t of model.transitions) {
    if (t.condition) allExpressions.push(t.condition);
    if (t.conditionAction) allExpressions.push(t.conditionAction);
    if (t.transitionAction) allExpressions.push(t.transitionAction);
  }
  for (const s of model.states) {
    allExpressions.push(...s.actions.entry, ...s.actions.during, ...s.actions.exit);
  }
  return usesTemporalLogic(allExpressions);
}
