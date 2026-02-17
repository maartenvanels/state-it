import type { StateMachineModel, ModelTransition } from '../types/codegen';
import type { SimulationStep } from '../store/simulation-store';

/**
 * Evaluate a single step of the state machine with an optional event.
 * Returns a SimulationStep describing what happened, or null if no transition was taken.
 */
export function evaluateStep(
  model: StateMachineModel,
  currentStateId: string,
  event: string | null,
  stepNumber: number
): SimulationStep | null {
  const currentState = model.states.find((s) => s.id === currentStateId);
  if (!currentState) return null;

  // Collect during actions
  const duringActions = currentState.actions.during.map(
    (a) => `during: ${a}`
  );

  // Find outgoing transitions from current state, sorted by priority
  const outgoing = model.transitions
    .filter((t) => t.sourceId === currentStateId && !t.isDefault)
    .sort((a, b) => a.priority - b.priority);

  // Check each transition
  for (const trans of outgoing) {
    if (canTakeTransition(trans, event)) {
      const targetState = model.states.find((s) => s.id === trans.targetId);
      if (!targetState) continue;

      const actions: string[] = [...duringActions];

      // Exit actions
      if (currentState.actions.exit.length > 0) {
        actions.push(
          ...currentState.actions.exit.map((a) => `exit ${currentState.name}: ${a}`)
        );
      }

      // Condition action
      if (trans.conditionAction) {
        actions.push(`condition action: ${trans.conditionAction}`);
      }

      // Transition action
      if (trans.transitionAction) {
        actions.push(`transition action: ${trans.transitionAction}`);
      }

      // Entry actions of target
      if (targetState.actions.entry.length > 0) {
        actions.push(
          ...targetState.actions.entry.map((a) => `entry ${targetState.name}: ${a}`)
        );
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
 * Check if a transition can be taken given the current event.
 * Simplified: matches event name only. Conditions are displayed but assumed true.
 */
function canTakeTransition(
  trans: ModelTransition,
  event: string | null
): boolean {
  // If transition requires an event
  if (trans.event) {
    // Event must match
    if (!event || trans.event !== event) return false;
  }

  // If transition has no event requirement (unconditional)
  // and no event is being fired, allow it (auto-transition)
  if (!trans.event && event) return false;

  // Conditions are treated as always true in simplified simulation
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
