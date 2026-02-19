'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCanvasStore } from '@/lib/store/canvas-store';
import { ANNOTATION_COLORS } from '@/lib/utils/constants';
import type { AnnotationNodeData } from '@/lib/types/canvas';
import { cn } from '@/lib/utils';

interface AnnotationPropertiesProps {
  nodeId: string;
  data: AnnotationNodeData;
}

export function AnnotationProperties({
  nodeId,
  data,
}: AnnotationPropertiesProps) {
  const updateAnnotationNodeData = useCanvasStore(
    (s) => s.updateAnnotationNodeData
  );
  const [content, setContent] = useState(data.content);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setContent(data.content);
  }, [nodeId, data.content]);

  const handleContentBlur = useCallback(() => {
    if (content !== data.content) {
      updateAnnotationNodeData(nodeId, { content });
    }
  }, [content, data.content, nodeId, updateAnnotationNodeData]);

  const handleColorChange = useCallback(
    (color: string) => {
      updateAnnotationNodeData(nodeId, { color });
    },
    [nodeId, updateAnnotationNodeData]
  );

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        updateAnnotationNodeData(nodeId, { image: reader.result as string });
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    },
    [nodeId, updateAnnotationNodeData]
  );

  const handleRemoveImage = useCallback(() => {
    updateAnnotationNodeData(nodeId, { image: null });
  }, [nodeId, updateAnnotationNodeData]);

  return (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold text-sm">Annotation Properties</h3>

      <div className="space-y-2">
        <Label className="text-xs">Content</Label>
        <textarea
          className="w-full min-h-[100px] rounded-md border bg-transparent px-3 py-2 text-sm resize-y"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleContentBlur}
          placeholder="Type text here... Use $..$ for inline math, $$...$$ for display math"
        />
        <p className="text-[10px] text-muted-foreground">
          Supports LaTeX: $E=mc^2$ or $$\sum_&#123;i=0&#125;^n x_i$$
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Color</Label>
        <div className="flex gap-1.5 flex-wrap">
          {ANNOTATION_COLORS.map((c) => (
            <button
              key={c.name}
              className={cn(
                'h-6 w-6 rounded border-2 transition-all hover:scale-110',
                data.color === c.value
                  ? 'border-foreground'
                  : 'border-transparent'
              )}
              style={{ backgroundColor: c.value }}
              onClick={() => handleColorChange(c.value)}
              title={c.name}
            />
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-xs">Image</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleImageUpload}
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            {data.image ? 'Replace' : 'Add'} Image
          </Button>
          {data.image && (
            <Button variant="outline" size="sm" onClick={handleRemoveImage}>
              Remove
            </Button>
          )}
        </div>
        {data.image && (
          <img
            src={data.image}
            alt="annotation"
            className="max-w-full max-h-32 rounded border"
          />
        )}
      </div>
    </div>
  );
}
