'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground text-sm font-bold">
              S
            </div>
            State It
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2 text-sm">
          <p className="text-muted-foreground">
            A visual state machine editor inspired by MATLAB Stateflow.
            Design hierarchical state machines, define transitions with
            conditions, and generate production-ready C and Siemens TIA Portal
            SCL code.
          </p>

          <div className="space-y-1 text-xs text-muted-foreground">
            <div>Version 1.0.0</div>
            <div>MIT License</div>
          </div>

          <div className="text-xs text-muted-foreground pt-2 border-t">
            <div className="font-medium mb-1">Tech Stack</div>
            <div>Next.js + TypeScript + React Flow + shadcn/ui + Zustand</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
