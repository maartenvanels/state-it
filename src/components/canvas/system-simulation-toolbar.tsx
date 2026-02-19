'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Play, Pause, Square, SkipForward, RotateCcw } from 'lucide-react';
import {
  useSystemSimulationStore,
  type SimSpeed,
} from '@/lib/store/system-simulation-store';
import { useProjectStore } from '@/lib/store/project-store';
import {
  createSystemSimContext,
  executeSystemTick,
  buildExecutionOrder,
  type SystemSimContext,
} from '@/lib/codegen/system-simulator';

export function SystemSimulationToolbar() {
  const project = useProjectStore((s) => s.currentProject);
  const isActive = useSystemSimulationStore((s) => s.isActive);
  const isRunning = useSystemSimulationStore((s) => s.isRunning);
  const tickCount = useSystemSimulationStore((s) => s.tickCount);
  const speed = useSystemSimulationStore((s) => s.speed);

  const start = useSystemSimulationStore((s) => s.start);
  const stop = useSystemSimulationStore((s) => s.stop);
  const play = useSystemSimulationStore((s) => s.play);
  const pause = useSystemSimulationStore((s) => s.pause);
  const reset = useSystemSimulationStore((s) => s.reset);
  const setSpeed = useSystemSimulationStore((s) => s.setSpeed);
  const step = useSystemSimulationStore((s) => s.step);
  const syncFromContext = useSystemSimulationStore((s) => s.syncFromContext);

  const simCtxRef = useRef<SystemSimContext | null>(null);
  const executionOrderRef = useRef<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleStart = useCallback(() => {
    if (!project) return;
    const ctx = createSystemSimContext(
      project.systemBlocks,
      project.systemWires,
      project.charts
    );
    const order = buildExecutionOrder(
      project.systemBlocks,
      project.systemWires
    );
    simCtxRef.current = ctx;
    executionOrderRef.current = order;
    start();
    syncFromContext(ctx);
  }, [project, start, syncFromContext]);

  const handleStep = useCallback(() => {
    if (!project || !simCtxRef.current) return;
    executeSystemTick(
      simCtxRef.current,
      project.systemBlocks,
      project.systemWires,
      project.charts,
      executionOrderRef.current
    );
    step();
    syncFromContext(simCtxRef.current);
  }, [project, step, syncFromContext]);

  // Auto-run timer
  useEffect(() => {
    if (isRunning && isActive) {
      timerRef.current = setInterval(() => {
        handleStep();
      }, speed);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, isActive, speed, handleStep]);

  const handleReset = useCallback(() => {
    if (!project) return;
    const ctx = createSystemSimContext(
      project.systemBlocks,
      project.systemWires,
      project.charts
    );
    simCtxRef.current = ctx;
    reset();
    syncFromContext(ctx);
  }, [project, reset, syncFromContext]);

  const handleStop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    simCtxRef.current = null;
    stop();
  }, [stop]);

  if (!project || project.systemBlocks.length === 0) return null;

  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-background border rounded-lg shadow-lg p-2 flex items-center gap-2">
      {!isActive ? (
        <Button
          size="sm"
          variant="default"
          onClick={handleStart}
          className="gap-1.5"
        >
          <Play className="h-3.5 w-3.5" />
          Simulate
        </Button>
      ) : (
        <>
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

          {isRunning ? (
            <Button
              size="sm"
              variant="outline"
              onClick={pause}
              className="gap-1"
            >
              <Pause className="h-3 w-3" />
              Pause
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={play}
              className="gap-1"
            >
              <Play className="h-3 w-3" />
              Play
            </Button>
          )}

          <Select
            value={String(speed)}
            onValueChange={(v) => setSpeed(Number(v) as SimSpeed)}
          >
            <SelectTrigger className="h-8 w-[80px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 ms</SelectItem>
              <SelectItem value="50">50 ms</SelectItem>
              <SelectItem value="100">100 ms</SelectItem>
              <SelectItem value="500">500 ms</SelectItem>
              <SelectItem value="1000">1 s</SelectItem>
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="h-6" />

          <div className="text-xs px-2">
            <span className="text-muted-foreground">Tick</span>{' '}
            <span className="font-semibold font-mono">{tickCount}</span>
          </div>
        </>
      )}
    </div>
  );
}
