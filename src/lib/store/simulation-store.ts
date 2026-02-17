'use client';

import { create } from 'zustand';

export interface SimulationStep {
  stepNumber: number;
  fromStateId: string | null;
  toStateId: string | null;
  event: string | null;
  transitionId: string | null;
  actions: string[];
}

interface SimulationState {
  isActive: boolean;
  activeStateId: string | null;
  previousStateId: string | null;
  stepCount: number;
  history: SimulationStep[];
  availableEvents: string[];
}

interface SimulationActions {
  startSimulation: (
    defaultStateId: string,
    events: string[]
  ) => void;
  stopSimulation: () => void;
  setActiveState: (stateId: string, step: SimulationStep) => void;
  reset: (defaultStateId: string) => void;
  incrementStep: () => void;
}

export const useSimulationStore = create<SimulationState & SimulationActions>()(
  (set, get) => ({
    isActive: false,
    activeStateId: null,
    previousStateId: null,
    stepCount: 0,
    history: [],
    availableEvents: [],

    startSimulation: (defaultStateId, events) => {
      set({
        isActive: true,
        activeStateId: defaultStateId,
        previousStateId: null,
        stepCount: 0,
        history: [
          {
            stepNumber: 0,
            fromStateId: null,
            toStateId: defaultStateId,
            event: null,
            transitionId: null,
            actions: ['Initialize to default state'],
          },
        ],
        availableEvents: events,
      });
    },

    stopSimulation: () => {
      set({
        isActive: false,
        activeStateId: null,
        previousStateId: null,
        stepCount: 0,
        history: [],
        availableEvents: [],
      });
    },

    setActiveState: (stateId, step) => {
      set({
        previousStateId: get().activeStateId,
        activeStateId: stateId,
        history: [...get().history, step],
      });
    },

    reset: (defaultStateId) => {
      set({
        activeStateId: defaultStateId,
        previousStateId: null,
        stepCount: 0,
        history: [
          {
            stepNumber: 0,
            fromStateId: null,
            toStateId: defaultStateId,
            event: null,
            transitionId: null,
            actions: ['Reset to default state'],
          },
        ],
      });
    },

    incrementStep: () => {
      set({ stepCount: get().stepCount + 1 });
    },
  })
);
