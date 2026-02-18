'use client';

import { useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Play,
  Square,
  SkipForward,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { useSimulationStore } from '@/lib/store/simulation-store';
import { useCanvasStore } from '@/lib/store/canvas-store';
import { useProjectStore } from '@/lib/store/project-store';
import { buildModel } from '@/lib/codegen/model-builder';
import {
  evaluateStep,
  collectModelEvents,
  createSimulationContext,
  type SimulationContext,
} from '@/lib/codegen/simulator';

export function SimulationToolbar() {
  const isActive = useSimulationStore((s) => s.isActive);
  const activeStateId = useSimulationStore((s) => s.activeStateId);
  const stepCount = useSimulationStore((s) => s.stepCount);
  const history = useSimulationStore((s) => s.history);
  const availableEvents = useSimulationStore((s) => s.availableEvents);
  const startSimulation = useSimulationStore((s) => s.startSimulation);
  const stopSimulation = useSimulationStore((s) => s.stopSimulation);
  const setActiveState = useSimulationStore((s) => s.setActiveState);
  const incrementStep = useSimulationStore((s) => s.incrementStep);
  const resetSim = useSimulationStore((s) => s.reset);

  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const project = useProjectStore((s) => s.currentProject);

  const model = useMemo(() => {
    if (nodes.filter((n) => n.type === 'stateNode').length === 0) return null;
    return buildModel(
      nodes,
      edges,
      project?.variables ?? [],
      project?.name ?? 'SM'
    );
  }, [nodes, edges, project]);

  const simCtxRef = useRef<SimulationContext | null>(null);

  const handleStart = useCallback(() => {
    if (!model || !model.defaultStateId) return;
    const events = collectModelEvents(model);
    simCtxRef.current = createSimulationContext(model);
    startSimulation(model.defaultStateId, events);
  }, [model, startSimulation]);

  const handleStop = useCallback(() => {
    stopSimulation();
  }, [stopSimulation]);

  const handleStep = useCallback(() => {
    if (!model || !activeStateId) return;
    incrementStep();
    const result = evaluateStep(model, activeStateId, null, stepCount + 1, simCtxRef.current ?? undefined);
    if (result) {
      setActiveState(result.toStateId!, result);
    }
  }, [model, activeStateId, stepCount, incrementStep, setActiveState]);

  const handleFireEvent = useCallback(
    (event: string) => {
      if (!model || !activeStateId) return;
      incrementStep();
      const result = evaluateStep(
        model,
        activeStateId,
        event,
        stepCount + 1,
        simCtxRef.current ?? undefined
      );
      if (result) {
        setActiveState(result.toStateId!, result);
      }
    },
    [model, activeStateId, stepCount, incrementStep, setActiveState]
  );

  const handleReset = useCallback(() => {
    if (!model || !model.defaultStateId) return;
    simCtxRef.current = createSimulationContext(model);
    resetSim(model.defaultStateId);
  }, [model, resetSim]);

  const activeStateName = useMemo(() => {
    if (!activeStateId) return null;
    const node = nodes.find((n) => n.id === activeStateId);
    if (node?.type === 'stateNode') return node.data.stateBlock.name;
    return null;
  }, [activeStateId, nodes]);

  const stateCount = nodes.filter((n) => n.type === 'stateNode').length;
  if (stateCount === 0) return null;

  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-background border rounded-lg shadow-lg p-2 flex items-center gap-2">
      {!isActive ? (
        <Button size="sm" variant="default" onClick={handleStart} className="gap-1.5">
          <Play className="h-3.5 w-3.5" />
          Simulate
        </Button>
      ) : (
        <>
          {/* Controls */}
          <Button
            size="sm"
            variant="destructive"
            onClick={handleStop}
            className="gap-1"
          >
            <Square className="h-3 w-3" />
            Stop
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            className="gap-1"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleStep}
            className="gap-1"
          >
            <SkipForward className="h-3 w-3" />
            Step
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Current state */}
          <div className="text-xs px-2">
            <span className="text-muted-foreground">State:</span>{' '}
            <span className="font-semibold text-blue-500">
              {activeStateName ?? 'None'}
            </span>
            <span className="text-muted-foreground ml-2">
              Step {stepCount}
            </span>
          </div>

          {/* Event buttons */}
          {availableEvents.length > 0 && (
            <>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-muted-foreground" />
                {availableEvents.map((event) => (
                  <Button
                    key={event}
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs px-2"
                    onClick={() => handleFireEvent(event)}
                  >
                    {event}
                  </Button>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Simulation history panel (shown in the bottom or side)
 */
export function SimulationHistory() {
  const isActive = useSimulationStore((s) => s.isActive);
  const history = useSimulationStore((s) => s.history);
  const nodes = useCanvasStore((s) => s.nodes);

  if (!isActive || history.length === 0) return null;

  const getStateName = (id: string | null) => {
    if (!id) return '(none)';
    const node = nodes.find((n) => n.id === id);
    if (node?.type === 'stateNode') return node.data.stateBlock.name;
    return id;
  };

  return (
    <div className="border-t bg-background">
      <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground border-b flex items-center gap-1">
        <Play className="h-3 w-3" />
        Simulation Log
      </div>
      <ScrollArea className="max-h-32">
        <div className="p-2 space-y-1">
          {history
            .slice()
            .reverse()
            .map((step, i) => (
              <div key={i} className="text-[10px] font-mono flex gap-2">
                <span className="text-muted-foreground w-6 text-right flex-shrink-0">
                  #{step.stepNumber}
                </span>
                {step.fromStateId !== step.toStateId ? (
                  <span>
                    <span className="text-orange-400">
                      {getStateName(step.fromStateId)}
                    </span>
                    {' -> '}
                    <span className="text-blue-400">
                      {getStateName(step.toStateId)}
                    </span>
                    {step.event && (
                      <span className="text-green-400 ml-1">
                        [{step.event}]
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    {step.actions[0] ?? 'No action'}
                  </span>
                )}
              </div>
            ))}
        </div>
      </ScrollArea>
    </div>
  );
}
