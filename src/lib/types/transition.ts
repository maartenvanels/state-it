export interface Transition {
  id: string;
  sourceStateId: string;
  targetStateId: string;
  sourceHandle: string;
  targetHandle: string;
  label: TransitionLabel;
  priority: number;
  isDefault: boolean;
}

export interface TransitionLabel {
  event: string | null;
  condition: string | null;
  conditionAction: string | null;
  transitionAction: string | null;
}

export const EMPTY_TRANSITION_LABEL: TransitionLabel = {
  event: null,
  condition: null,
  conditionAction: null,
  transitionAction: null,
};

export function formatTransitionLabel(label: TransitionLabel): string {
  let result = '';
  if (label.event) result += label.event;
  if (label.condition) result += `[${label.condition}]`;
  if (label.conditionAction) result += `{${label.conditionAction}}`;
  if (label.transitionAction) result += `/${label.transitionAction}`;
  return result || '(unconditional)';
}

export function parseTransitionLabel(raw: string): TransitionLabel {
  const match = raw.match(
    /^(\w+)?(?:\[(.*?)\])?(?:\{(.*?)\})?(?:\/(.*?))?$/
  );
  if (!match) {
    return { event: null, condition: null, conditionAction: null, transitionAction: null };
  }
  return {
    event: match[1] || null,
    condition: match[2] || null,
    conditionAction: match[3] || null,
    transitionAction: match[4] || null,
  };
}
