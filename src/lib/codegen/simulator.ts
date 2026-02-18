import type { StateMachineModel, ModelTransition } from '../types/codegen';
import type { SimulationStep } from '../store/simulation-store';
import {
  evaluateCondition,
  executeStatements,
  createDefaultContext,
  type EvalContext,
} from '../syntax/evaluator';

/**
 * Simulation context that persists across steps.
 */
export interface SimulationContext {
  eval: EvalContext;
  stateEntryStep: number;
}

export function createSimulationContext(model: StateMachineModel): SimulationContext {
  const ctx = createDefaultContext();

  // Initialize variables from model
  for (const v of model.variables) {
    if (v.initialValue) {
      const num = Number(v.initialValue);
      if (!isNaN(num)) {
        ctx.variables[v.name] = num;
      } else if (v.initialValue === 'true') {
        ctx.variables[v.name] = true;
      } else if (v.initialValue === 'false') {
        ctx.variables[v.name] = false;
      } else {
        ctx.variables[v.name] = v.initialValue;
      }
    } else {
      // Default init: 0 for numbers, false for bools
      ctx.variables[v.name] = v.dataType === 'boolean' ? false : 0;
    }
  }

  return { eval: ctx, stateEntryStep: 0 };
}

/**
 * Evaluate a single step of the state machine with an optional event.
 * Returns a SimulationStep describing what happened, or null if no transition was taken.
 */
export function evaluateStep(
  model: StateMachineModel,
  currentStateId: string,
  event: string | null,
  stepNumber: number,
  simCtx?: SimulationContext
): SimulationStep | null {
  const currentState = model.states.find((s) => s.id === currentStateId);
  if (!currentState) return null;

  // Update tick count if context available
  if (simCtx) {
    simCtx.eval.stateTickCount = stepNumber - simCtx.stateEntryStep;
  }

  // Collect during actions
  const duringActions: string[] = [];
  for (const action of currentState.actions.during) {
    if (simCtx) {
      const executed = executeStatements(action, simCtx.eval);
      duringActions.push(...executed.map((a) => `during: ${a}`));
    } else {
      duringActions.push(`during: ${action}`);
    }
  }

  // Find outgoing transitions from current state, sorted by priority
  const outgoing = model.transitions
    .filter((t) => t.sourceId === currentStateId && !t.isDefault)
    .sort((a, b) => a.priority - b.priority);

  // Check each transition
  for (const trans of outgoing) {
    if (canTakeTransition(trans, event, simCtx)) {
      const targetState = model.states.find((s) => s.id === trans.targetId);
      if (!targetState) continue;

      const actions: string[] = [...duringActions];

      // Exit actions
      if (currentState.actions.exit.length > 0) {
        for (const action of currentState.actions.exit) {
          if (simCtx) {
            const executed = executeStatements(action, simCtx.eval);
            actions.push(...executed.map((a) => `exit ${currentState.name}: ${a}`));
          } else {
            actions.push(`exit ${currentState.name}: ${action}`);
          }
        }
      }

      // Condition action
      if (trans.conditionAction) {
        if (simCtx) {
          const executed = executeStatements(trans.conditionAction, simCtx.eval);
          actions.push(...executed.map((a) => `condition action: ${a}`));
        } else {
          actions.push(`condition action: ${trans.conditionAction}`);
        }
      }

      // Transition action
      if (trans.transitionAction) {
        if (simCtx) {
          const executed = executeStatements(trans.transitionAction, simCtx.eval);
          actions.push(...executed.map((a) => `transition action: ${a}`));
        } else {
          actions.push(`transition action: ${trans.transitionAction}`);
        }
      }

      // Entry actions of target
      if (targetState.actions.entry.length > 0) {
        for (const action of targetState.actions.entry) {
          if (simCtx) {
            const executed = executeStatements(action, simCtx.eval);
            actions.push(...executed.map((a) => `entry ${targetState.name}: ${a}`));
          } else {
            actions.push(`entry ${targetState.name}: ${action}`);
          }
        }
      }

      // Reset tick count for new state
      if (simCtx) {
        simCtx.stateEntryStep = stepNumber;
      }

      return {
        stepNumber,
        fromStateId: currentStateId,
        toStateId: trans.targetId,
        event,
        transitionId: trans.id,
        actions,
      };
    }
  }

  // No transition taken — just during actions
  if (duringActions.length > 0 || event) {
    return {
      stepNumber,
      fromStateId: currentStateId,
      toStateId: currentStateId, // Stay in same state
      event,
      transitionId: null,
      actions: duringActions.length > 0
        ? duringActions
        : [`No matching transition for event: ${event ?? 'none'}`],
    };
  }

  return null;
}

/**
 * Check if a transition can be taken given the current event and context.
 * With a SimulationContext, conditions are actually evaluated.
 * Without, conditions are assumed true (legacy behavior).
 */
function canTakeTransition(
  trans: ModelTransition,
  event: string | null,
  simCtx?: SimulationContext
): boolean {
  // If transition requires an event
  if (trans.event) {
    // Event must match
    if (!event || trans.event !== event) return false;
  }

  // If transition has no event requirement (unconditional)
  // and an event is being fired, don't take it
  if (!trans.event && event) return false;

  // Evaluate condition
  if (trans.condition && simCtx) {
    const result = evaluateCondition(trans.condition, simCtx.eval);
    // If evaluation fails (null), assume true for backwards compat
    if (result === false) return false;
  }

  return true;
}

/**
 * Collect all unique events from the model
 */
export function collectModelEvents(model: StateMachineModel): string[] {
  const events = new Set<string>();
  for (const t of model.transitions) {
    if (t.event) events.add(t.event);
  }
  return Array.from(events).sort();
}
