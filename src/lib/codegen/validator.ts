import type { StateMachineModel, ValidationMessage } from '../types/codegen';

/**
 * Validate a state machine model and return errors/warnings
 */
export function validateModel(model: StateMachineModel): ValidationMessage[] {
  const messages: ValidationMessage[] = [];

  // Check for empty model
  if (model.states.length === 0) {
    messages.push({
      level: 'warning',
      message: 'No states defined in the state machine',
    });
    return messages;
  }

  // Check for no default/initial state
  if (!model.defaultStateId) {
    messages.push({
      level: 'warning',
      message: 'No default state defined. The first state will be used as initial state.',
    });
  }

  // Check for duplicate state names
  const nameMap = new Map<string, string[]>();
  for (const state of model.states) {
    const existing = nameMap.get(state.safeName) ?? [];
    existing.push(state.id);
    nameMap.set(state.safeName, existing);
  }
  for (const [name, ids] of nameMap) {
    if (ids.length > 1) {
      messages.push({
        level: 'error',
        message: `Duplicate state name: "${name}" (${ids.length} states)`,
        stateId: ids[0],
      });
    }
  }

  // Check each state
  for (const state of model.states) {
    // Check for empty name
    if (!state.name.trim()) {
      messages.push({
        level: 'error',
        message: 'State has no name',
        stateId: state.id,
      });
    }

    // Check for exclusive states with children but no default
    if (state.decomposition === 'exclusive' && state.childIds.length > 0) {
      const hasDefaultChild = model.states
        .filter((s) => state.childIds.includes(s.id))
        .some((s) => s.isDefault);
      const hasDefaultTransition = model.transitions
        .filter((t) => t.isDefault)
        .some((t) => state.childIds.includes(t.targetId));

      if (!hasDefaultChild && !hasDefaultTransition) {
        messages.push({
          level: 'warning',
          message: `State "${state.name}" has child states but no default child`,
          stateId: state.id,
        });
      }
    }
  }

  // Check transitions
  for (const transition of model.transitions) {
    if (transition.isDefault) continue;

    // Check that source exists
    const sourceExists = model.states.some((s) => s.id === transition.sourceId);
    if (!sourceExists) {
      messages.push({
        level: 'error',
        message: 'Transition has invalid source state',
        transitionId: transition.id,
      });
    }

    // Check that target exists
    const targetExists = model.states.some((s) => s.id === transition.targetId);
    if (!targetExists) {
      messages.push({
        level: 'error',
        message: 'Transition has invalid target state',
        transitionId: transition.id,
      });
    }
  }

  // Check for unreachable states
  const reachable = new Set<string>();
  if (model.defaultStateId) {
    collectReachable(model.defaultStateId, model, reachable);
  }
  for (const state of model.states) {
    if (state.parentId !== null) continue; // Only check root-level
    if (!reachable.has(state.id) && state.id !== model.defaultStateId) {
      messages.push({
        level: 'warning',
        message: `State "${state.name}" may be unreachable`,
        stateId: state.id,
      });
    }
  }

  return messages;
}

function collectReachable(
  stateId: string,
  model: StateMachineModel,
  visited: Set<string>
): void {
  if (visited.has(stateId)) return;
  visited.add(stateId);

  // Follow all outgoing transitions
  const outgoing = model.transitions.filter(
    (t) => t.sourceId === stateId && !t.isDefault
  );
  for (const t of outgoing) {
    collectReachable(t.targetId, model, visited);
  }
}
