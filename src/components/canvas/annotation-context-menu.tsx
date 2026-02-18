'use client';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Trash2, Palette, ImagePlus, ImageOff } from 'lucide-react';
import { useCanvasStore } from '@/lib/store/canvas-store';
import { useUIStore } from '@/lib/store/ui-store';
import { ANNOTATION_COLORS } from '@/lib/utils/constants';
import { useCallback, useRef } from 'react';

interface AnnotationContextMenuProps {
  nodeId: string;
  children: React.ReactNode;
}

export function AnnotationContextMenu({
  nodeId,
  children,
}: AnnotationContextMenuProps) {
  const removeNodes = useCanvasStore((s) => s.removeNodes);
  const updateAnnotationNodeData = useCanvasStore(
    (s) => s.updateAnnotationNodeData
  );
  const node = useCanvasStore((s) =>
    s.nodes.find((n) => n.id === nodeId && n.type === 'annotationNode')
  );
  const setSelection = useUIStore((s) => s.setSelection);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDelete = useCallback(() => {
    removeNodes([nodeId]);
    setSelection([], []);
  }, [nodeId, removeNodes, setSelection]);

  const handleColorChange = useCallback(
    (color: string) => {
      updateAnnotationNodeData(nodeId, { color });
    },
    [nodeId, updateAnnotationNodeData]
  );

  const handleImageUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleRemoveImage = useCallback(() => {
    updateAnnotationNodeData(nodeId, { image: null });
  }, [nodeId, updateAnnotationNodeData]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        updateAnnotationNodeData(nodeId, { image: reader.result as string });
      };
      reader.readAsDataURL(file);
      // Reset so same file can be re-selected
      e.target.value = '';
    },
    [nodeId, updateAnnotationNodeData]
  );

  const hasImage = node?.type === 'annotationNode' && node.data.image;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleFileChange}
      />
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <Palette className="mr-2 h-4 w-4" />
              Color
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="p-2">
              <div className="grid grid-cols-3 gap-1.5">
                {ANNOTATION_COLORS.map((c) => (
                  <button
                    key={c.name}
                    className="h-6 w-6 rounded border hover:scale-110 transition-transform"
                    style={{ backgroundColor: c.value }}
                    onClick={() => handleColorChange(c.value)}
                    title={c.name}
                  />
                ))}
              </div>
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuItem onClick={handleImageUpload}>
            <ImagePlus className="mr-2 h-4 w-4" />
            {hasImage ? 'Replace Image' : 'Add Image'}
          </ContextMenuItem>
          {hasImage && (
            <ContextMenuItem onClick={handleRemoveImage}>
              <ImageOff className="mr-2 h-4 w-4" />
              Remove Image
            </ContextMenuItem>
          )}
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={handleDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </>
  );
}
