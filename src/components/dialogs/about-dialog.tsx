'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/lib/store/ui-store';
import { ExternalLink, Keyboard } from 'lucide-react';

interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  const openDialog = useUIStore((s) => s.openDialog);

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
            A visual state machine and Simulink-like system modeling tool.
            Design hierarchical state charts, wire source/sink blocks,
            simulate system behavior, and generate production-ready C and
            Siemens TIA Portal SCL code.
          </p>

          <div className="space-y-1 text-xs text-muted-foreground">
            <div>Version 1.0.0</div>
            <div>MIT License</div>
          </div>

          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {
                onOpenChange(false);
                openDialog('shortcuts');
              }}
            >
              <Keyboard className="mr-1.5 h-3 w-3" />
              Shortcuts
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              asChild
            >
              <a
                href="https://github.com/MaartenSmeets/state-it"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-1.5 h-3 w-3" />
                GitHub
              </a>
            </Button>
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
