'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useProjectStore } from '@/lib/store/project-store';
import { useCanvasStore } from '@/lib/store/canvas-store';
import {
  exportProjectJSON,
  exportCCode,
  exportSCLCode,
} from '@/lib/persistence/exporter';
import { FileJson, FileCode, FileText } from 'lucide-react';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  const project = useProjectStore((s) => s.currentProject);
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);

  if (!project) return null;

  const stateCount = nodes.filter((n) => n.type === 'stateNode').length;

  const handleExportJSON = () => {
    exportProjectJSON(project, nodes, edges);
    onOpenChange(false);
  };

  const handleExportC = () => {
    exportCCode(project, nodes, edges);
    onOpenChange(false);
  };

  const handleExportSCL = () => {
    exportSCLCode(project, nodes, edges);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Export</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Button
            variant="outline"
            className="w-full justify-start h-auto py-3"
            onClick={handleExportJSON}
          >
            <FileJson className="mr-3 h-5 w-5 text-blue-500" />
            <div className="text-left">
              <div className="font-medium">Project JSON</div>
              <div className="text-xs text-muted-foreground">
                Full project file for backup/sharing
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start h-auto py-3"
            onClick={handleExportC}
            disabled={stateCount === 0}
          >
            <FileCode className="mr-3 h-5 w-5 text-green-500" />
            <div className="text-left">
              <div className="font-medium">C Code (.h + .c)</div>
              <div className="text-xs text-muted-foreground">
                Header + source files for embedded systems
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start h-auto py-3"
            onClick={handleExportSCL}
            disabled={stateCount === 0}
          >
            <FileText className="mr-3 h-5 w-5 text-orange-500" />
            <div className="text-left">
              <div className="font-medium">SCL Code (.scl)</div>
              <div className="text-xs text-muted-foreground">
                Siemens TIA Portal S7-1500 structured text
              </div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
