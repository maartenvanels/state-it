'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shortcuts = [
  {
    group: 'File',
    items: [
      { keys: 'Ctrl+N', action: 'New Project' },
      { keys: 'Ctrl+O', action: 'Open Project' },
      { keys: 'Ctrl+S', action: 'Save' },
    ],
  },
  {
    group: 'Edit',
    items: [
      { keys: 'Ctrl+Z', action: 'Undo' },
      { keys: 'Ctrl+Y', action: 'Redo' },
      { keys: 'Ctrl+A', action: 'Select All' },
      { keys: 'Delete', action: 'Delete Selected' },
    ],
  },
  {
    group: 'Canvas',
    items: [
      { keys: 'V', action: 'Select Mode' },
      { keys: 'S', action: 'Add State Mode' },
      { keys: 'Escape', action: 'Deselect / Cancel' },
    ],
  },
  {
    group: 'View',
    items: [
      { keys: 'Ctrl+/', action: 'Keyboard Shortcuts' },
    ],
  },
];

export function ShortcutsDialog({ open, onOpenChange }: ShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {shortcuts.map((group) => (
            <div key={group.group}>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {group.group}
              </h4>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <div
                    key={item.keys}
                    className="flex items-center justify-between py-1"
                  >
                    <span className="text-sm">{item.action}</span>
                    <kbd className="ml-4 inline-flex items-center gap-1 rounded border bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground">
                      {item.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
