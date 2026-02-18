'use client';

import { memo, useState, useCallback, useMemo } from 'react';
import { NodeResizer } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { AnnotationNodeData } from '@/lib/types/canvas';
import { useCanvasStore } from '@/lib/store/canvas-store';
import { MIN_ANNOTATION_WIDTH, MIN_ANNOTATION_HEIGHT } from '@/lib/utils/constants';
import { cn } from '@/lib/utils';
import katex from 'katex';
import { AnnotationContextMenu } from './annotation-context-menu';

type AnnotationNodeType = Node<AnnotationNodeData, 'annotationNode'>;

function renderContentWithLatex(content: string): string {
  if (!content) return '';
  // Split on $$...$$ blocks for display math
  const parts = content.split(/(\$\$[^$]+\$\$)/g);
  return parts
    .map((part) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const latex = part.slice(2, -2);
        try {
          return katex.renderToString(latex, {
            throwOnError: false,
            displayMode: true,
          });
        } catch {
          return part;
        }
      }
      // Handle inline $...$ math
      const withInline = part.replace(/\$([^$]+)\$/g, (_, latex) => {
        try {
          return katex.renderToString(latex, { throwOnError: false });
        } catch {
          return `$${latex}$`;
        }
      });
      // Escape HTML in non-LaTeX parts, but preserve the katex output
      return withInline;
    })
    .join('');
}

function AnnotationNodeComponent({
  id,
  data,
  selected,
}: NodeProps<AnnotationNodeType>) {
  const resizeNode = useCanvasStore((s) => s.resizeNode);
  const updateAnnotationNodeData = useCanvasStore(
    (s) => s.updateAnnotationNodeData
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(data.content);

  const handleResize = useCallback(
    (_: unknown, params: { width: number; height: number }) => {
      resizeNode(id, { width: params.width, height: params.height });
    },
    [id, resizeNode]
  );

  const handleDoubleClick = useCallback(() => {
    setEditContent(data.content);
    setIsEditing(true);
  }, [data.content]);

  const handleSubmit = useCallback(() => {
    setIsEditing(false);
    if (editContent !== data.content) {
      updateAnnotationNodeData(id, { content: editContent });
    }
  }, [id, editContent, data.content, updateAnnotationNodeData]);

  const renderedContent = useMemo(
    () => renderContentWithLatex(data.content),
    [data.content]
  );

  const bgColor = data.color ?? '#fef08a';

  return (
    <AnnotationContextMenu nodeId={id}>
      <div
        className={cn(
          'relative h-full w-full rounded-md shadow-md transition-shadow',
          selected && 'ring-2 ring-blue-500/50 shadow-lg'
        )}
        style={{
          backgroundColor: bgColor,
          fontSize: `${data.fontSize ?? 14}px`,
        }}
        onDoubleClick={handleDoubleClick}
      >
        <NodeResizer
          isVisible={selected}
          minWidth={MIN_ANNOTATION_WIDTH}
          minHeight={MIN_ANNOTATION_HEIGHT}
          onResize={handleResize}
          lineClassName="!border-blue-500"
          handleClassName="!w-2 !h-2 !bg-blue-500 !border-blue-500"
        />

        {/* Fold corner effect */}
        <div
          className="absolute top-0 right-0 w-5 h-5 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, transparent 50%, color-mix(in oklch, ${bgColor} 70%, black) 50%)`,
          }}
        />

        {/* Image display */}
        {data.image && (
          <div className="px-3 pt-2">
            <img
              src={data.image}
              alt="annotation"
              className="max-w-full max-h-40 object-contain rounded"
              draggable={false}
            />
          </div>
        )}

        {/* Content */}
        <div className="px-3 py-2 text-gray-800 overflow-hidden h-full">
          {isEditing ? (
            <textarea
              className="w-full h-full bg-transparent outline-none resize-none text-inherit font-sans"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onBlur={handleSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsEditing(false);
                  setEditContent(data.content);
                }
              }}
              autoFocus
            />
          ) : (
            <div
              className="whitespace-pre-wrap break-words"
              dangerouslySetInnerHTML={{ __html: renderedContent }}
            />
          )}
        </div>
      </div>
    </AnnotationContextMenu>
  );
}

export const AnnotationNode = memo(AnnotationNodeComponent);
