'use client';

import { create } from 'zustand';
import type { ScopeSample, SystemSimContext } from '../codegen/system-simulator';

export type SimSpeed = 10 | 50 | 100 | 500 | 1000;

interface SystemSimulationState {
  isActive: boolean;
  isRunning: boolean;
  tickCount: number;
  speed: SimSpeed;
  chartActiveStates: Record<string, string>;
  scopeData: Record<string, ScopeSample[]>;
  displayValues: Record<string, number>;
  portValues: Record<string, Record<string, number>>;
}

interface SystemSimulationActions {
  start: () => void;
  stop: () => void;
  step: () => void;
  play: () => void;
  pause: () => void;
  reset: () => void;
  setSpeed: (speed: SimSpeed) => void;
  syncFromContext: (ctx: SystemSimContext) => void;
}

export const useSystemSimulationStore = create<
  SystemSimulationState & SystemSimulationActions
>()((set) => ({
  isActive: false,
  isRunning: false,
  tickCount: 0,
  speed: 100,
  chartActiveStates: {},
  scopeData: {},
  displayValues: {},
  portValues: {},

  start: () => set({ isActive: true, isRunning: false, tickCount: 0 }),

  stop: () =>
    set({
      isActive: false,
      isRunning: false,
      tickCount: 0,
      chartActiveStates: {},
      scopeData: {},
      displayValues: {},
      portValues: {},
    }),

  step: () => set((s) => ({ tickCount: s.tickCount + 1 })),

  play: () => set({ isRunning: true }),

  pause: () => set({ isRunning: false }),

  reset: () =>
    set({
      tickCount: 0,
      chartActiveStates: {},
      scopeData: {},
      displayValues: {},
      portValues: {},
    }),

  setSpeed: (speed) => set({ speed }),

  syncFromContext: (ctx) => {
    const chartActiveStates: Record<string, string> = {};
    for (const [blockId, chartState] of ctx.chartStates) {
      chartActiveStates[blockId] = chartState.activeStateId;
    }

    const scopeData: Record<string, ScopeSample[]> = {};
    for (const [blockId, samples] of ctx.scopeData) {
      scopeData[blockId] = [...samples];
    }

    const displayValues: Record<string, number> = {};
    for (const [blockId, value] of ctx.displayValues) {
      displayValues[blockId] = value;
    }

    const portValues: Record<string, Record<string, number>> = {};
    for (const [blockId, ports] of ctx.portValues) {
      portValues[blockId] = Object.fromEntries(ports);
    }

    set({
      tickCount: ctx.tickCount,
      chartActiveStates,
      scopeData,
      displayValues,
      portValues,
    });
  },
}));
