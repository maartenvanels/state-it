'use client';

import { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useCanvasStore } from '@/lib/store/canvas-store';
import type { TransitionEdgeData, StateNodeData } from '@/lib/types/canvas';
import { formatTransitionLabel } from '@/lib/types/transition';

interface TransitionPropertiesProps {
  edgeId: string;
  data: TransitionEdgeData;
}

export function TransitionProperties({
  edgeId,
  data,
}: TransitionPropertiesProps) {
  const updateTransitionEdge = useCanvasStore((s) => s.updateTransitionEdge);
  const edges = useCanvasStore((s) => s.edges);
  const nodes = useCanvasStore((s) => s.nodes);

  const [event, setEvent] = useState(data.label.event ?? '');
  const [condition, setCondition] = useState(data.label.condition ?? '');
  const [conditionAction, setConditionAction] = useState(
    data.label.conditionAction ?? ''
  );
  const [transitionAction, setTransitionAction] = useState(
    data.label.transitionAction ?? ''
  );

  // Sync state when selection changes
  useEffect(() => {
    setEvent(data.label.event ?? '');
    setCondition(data.label.condition ?? '');
    setConditionAction(data.label.conditionAction ?? '');
    setTransitionAction(data.label.transitionAction ?? '');
  }, [edgeId, data.label]);

  const commitChanges = useCallback(() => {
    updateTransitionEdge(edgeId, {
      label: {
        event: event.trim() || null,
        condition: condition.trim() || null,
        conditionAction: conditionAction.trim() || null,
        transitionAction: transitionAction.trim() || null,
      },
    });
  }, [
    edgeId,
    event,
    condition,
    conditionAction,
    transitionAction,
    updateTransitionEdge,
  ]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        commitChanges();
      }
    },
    [commitChanges]
  );

  const currentEdge = edges.find((e) => e.id === edgeId);
  const sourceNode = currentEdge
    ? nodes.find((n) => n.id === currentEdge.source)
    : undefined;
  const sourceStateName =
    sourceNode?.type === 'stateNode' && sourceNode.data
      ? (sourceNode.data as StateNodeData).stateBlock.name
      : undefined;
  const siblingCount = currentEdge
    ? edges.filter(
        (e) => e.source === currentEdge.source && e.data && !e.data.isDefault
      ).length
    : 0;

  const preview = formatTransitionLabel({
    event: event.trim() || null,
    condition: condition.trim() || null,
    conditionAction: conditionAction.trim() || null,
    transitionAction: transitionAction.trim() || null,
  });

  return (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold text-sm">Transition Properties</h3>

      {/* Preview */}
      <div className="rounded border bg-muted/50 p-2 text-xs font-mono">
        {data.label.event && (
          <span className="font-semibold">{data.label.event}</span>
        )}
        {data.label.condition && (
          <span className="text-blue-500">[{data.label.condition}]</span>
        )}
        {data.label.conditionAction && (
          <span className="text-green-500">
            {'{'}
            {data.label.conditionAction}
            {'}'}
          </span>
        )}
        {data.label.transitionAction && (
          <span className="text-orange-500">
            /{data.label.transitionAction}
          </span>
        )}
        {!data.label.event &&
          !data.label.condition &&
          !data.label.conditionAction &&
          !data.label.transitionAction && (
            <span className="text-muted-foreground italic">
              (unconditional)
            </span>
          )}
      </div>

      <div className="text-[10px] text-muted-foreground bg-muted/30 rounded p-1.5 font-mono">
        Syntax: <span className="font-semibold">event</span>
        <span className="text-blue-500">[condition]</span>
        <span className="text-green-500">{'{action}'}</span>
        <span className="text-orange-500">/transAction</span>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="tr-event" className="text-xs">
            Event
          </Label>
          <Input
            id="tr-event"
            value={event}
            onChange={(e) => setEvent(e.target.value)}
            onBlur={commitChanges}
            onKeyDown={handleKeyDown}
            placeholder="e.g. start_btn"
            className="h-8 text-sm font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tr-condition" className="text-xs">
            Condition <span className="text-blue-500">[...]</span>
          </Label>
          <Input
            id="tr-condition"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            onBlur={commitChanges}
            onKeyDown={handleKeyDown}
            placeholder="e.g. speed > 100"
            className="h-8 text-sm font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tr-cond-action" className="text-xs">
            Condition Action{' '}
            <span className="text-green-500">{'{...}'}</span>
          </Label>
          <Input
            id="tr-cond-action"
            value={conditionAction}
            onChange={(e) => setConditionAction(e.target.value)}
            onBlur={commitChanges}
            onKeyDown={handleKeyDown}
            placeholder="e.g. counter++"
            className="h-8 text-sm font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tr-action" className="text-xs">
            Transition Action <span className="text-orange-500">/...</span>
          </Label>
          <Input
            id="tr-action"
            value={transitionAction}
            onChange={(e) => setTransitionAction(e.target.value)}
            onBlur={commitChanges}
            onKeyDown={handleKeyDown}
            placeholder="e.g. initMotor()"
            className="h-8 text-sm font-mono"
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Priority</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              value={data.priority}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1) {
                  updateTransitionEdge(edgeId, { priority: val });
                }
              }}
              className="h-8 text-sm w-20"
            />
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                if (data.priority > 1) {
                  updateTransitionEdge(edgeId, {
                    priority: data.priority - 1,
                  });
                }
              }}
              disabled={data.priority <= 1}
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                updateTransitionEdge(edgeId, {
                  priority: data.priority + 1,
                });
              }}
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
            <span className="text-[10px] text-muted-foreground">
              {siblingCount > 1
                ? `${data.priority} of ${siblingCount}`
                : 'Lower = first'}
            </span>
          </div>
        </div>

        {data.isDefault && (
          <div className="text-blue-500 font-medium text-xs">
            Default Transition
          </div>
        )}

        <div className="font-mono text-[10px] text-muted-foreground bg-muted/30 rounded p-1.5">
          Full label: {preview}
        </div>
      </div>
    </div>
  );
}
