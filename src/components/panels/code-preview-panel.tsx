'use client';

import { useMemo, useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/lib/store/ui-store';
import { useCanvasStore } from '@/lib/store/canvas-store';
import { useProjectStore } from '@/lib/store/project-store';
import { useNavigationStore } from '@/lib/store/navigation-store';
import { Code2, Copy, Download, AlertTriangle } from 'lucide-react';
import { generateProject } from '@/lib/codegen/project-generator';
import { downloadFile } from '@/lib/persistence/exporter';
import type { GeneratedFile } from '@/lib/types/codegen';

const EMPTY_ARRAY: never[] = [];

export function CodePreviewPanel() {
  const preferredLanguage = useUIStore((s) => s.codePreviewLanguage);
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const project = useProjectStore((s) => s.currentProject);
  const chartId = useNavigationStore((s) =>
    s.activeView.type === 'chart' ? s.activeView.chartId : null
  );
  const variables = useProjectStore((s) => {
    if (!chartId || !s.currentProject) return EMPTY_ARRAY;
    const chart = s.currentProject.charts.find((c) => c.id === chartId);
    return chart?.variables ?? EMPTY_ARRAY;
  });
  const chartName = useProjectStore((s) => {
    if (!chartId || !s.currentProject) return s.currentProject?.name ?? 'StateMachine';
    const chart = s.currentProject.charts.find((c) => c.id === chartId);
    return chart?.name ?? 'StateMachine';
  });

  const stateCount = nodes.filter((n) => n.type === 'stateNode').length;

  const generated = useMemo(() => {
    if (stateCount === 0) {
      return { files: [] as GeneratedFile[], messages: [] };
    }

    return generateProject({
      nodes,
      edges,
      variables,
      projectName: chartName,
      target: 'both',
    });
  }, [nodes, edges, variables, chartName, stateCount]);

  const warnings = generated.messages.filter((m) => m.level === 'warning');
  const errors = generated.messages.filter((m) => m.level === 'error');

  const [selectedFileIdx, setSelectedFileIdx] = useState(0);

  // When files change, select first file matching preferred language, or clamp index
  useEffect(() => {
    if (generated.files.length === 0) {
      setSelectedFileIdx(0);
      return;
    }
    const preferredIdx = generated.files.findIndex(
      (f) => f.language === preferredLanguage
    );
    if (preferredIdx >= 0) {
      setSelectedFileIdx(preferredIdx);
    } else if (selectedFileIdx >= generated.files.length) {
      setSelectedFileIdx(0);
    }
    // Only run when files change or preferred language changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generated.files.length, preferredLanguage]);

  const selectedFile = generated.files[selectedFileIdx] ?? null;

  const handleCopy = () => {
    if (selectedFile) {
      navigator.clipboard.writeText(selectedFile.content);
    }
  };

  const handleDownload = () => {
    if (!selectedFile) return;
    const mime = selectedFile.language === 'c' ? 'text/x-c' : 'text/plain';
    downloadFile(selectedFile.content, selectedFile.filename, mime);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-2 py-1">
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <Code2 className="h-3 w-3" />
          Code Preview
          {(errors.length > 0 || warnings.length > 0) && (
            <span className="flex items-center gap-0.5 ml-1">
              {errors.length > 0 && (
                <span className="text-destructive text-[10px]">
                  {errors.length} err
                </span>
              )}
              {warnings.length > 0 && (
                <span className="text-yellow-500 text-[10px] flex items-center gap-0.5">
                  <AlertTriangle className="h-2.5 w-2.5" />
                  {warnings.length}
                </span>
              )}
            </span>
          )}
        </span>
        <div className="flex items-center gap-1">
          {stateCount > 0 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleCopy}
                title="Copy to clipboard"
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleDownload}
                title="Download file"
              >
                <Download className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* File tabs */}
      {generated.files.length > 0 && (
        <div className="flex border-b overflow-x-auto">
          {generated.files.map((file, idx) => (
            <button
              key={file.filename}
              className={`px-3 py-1 text-xs font-mono border-b-2 whitespace-nowrap transition-colors ${
                idx === selectedFileIdx
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setSelectedFileIdx(idx)}
            >
              {file.filename}
            </button>
          ))}
        </div>
      )}

      {/* File content */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <pre className="p-3 text-xs font-mono leading-relaxed whitespace-pre">
            {selectedFile ? (
              selectedFile.language === 'c' ? (
                <HighlightedC code={selectedFile.content} />
              ) : (
                <HighlightedSCL code={selectedFile.content} />
              )
            ) : (
              <span className="text-muted-foreground">
                {'/* Add states to see generated code */'}
              </span>
            )}
          </pre>
        </ScrollArea>
      </div>
    </div>
  );
}

function HighlightedC({ code }: { code: string }) {
  const lines = code.split('\n');
  return (
    <>
      {lines.map((line, i) => (
        <CLine key={i} line={line} />
      ))}
    </>
  );
}

function CLine({ line }: { line: string }) {
  // Comment lines
  if (line.trimStart().startsWith('/*') || line.trimStart().startsWith('//')) {
    return <span className="text-muted-foreground/60">{line}{'\n'}</span>;
  }

  // Preprocessor
  if (line.trimStart().startsWith('#')) {
    return <span className="text-purple-400">{line}{'\n'}</span>;
  }

  // Highlight keywords and types inline
  const parts = tokenizeCLine(line);
  return (
    <span>
      {parts.map((part, i) => (
        <span key={i} className={part.className}>{part.text}</span>
      ))}
      {'\n'}
    </span>
  );
}

function tokenizeCLine(line: string): { text: string; className: string }[] {
  const C_KEYWORDS = /\b(typedef|enum|struct|void|switch|case|break|default|if|else|return|const)\b/g;
  const C_TYPES = /\b(bool|int8_t|int16_t|int32_t|uint8_t|uint16_t|uint32_t|float|double|char)\b/g;

  const result: { text: string; className: string }[] = [];
  const remaining = line;

  // Check for inline comments
  const commentIdx = remaining.indexOf('/*');
  const lineCommentIdx = remaining.indexOf('//');
  let commentStart = -1;
  if (commentIdx >= 0 && (lineCommentIdx < 0 || commentIdx < lineCommentIdx)) {
    commentStart = commentIdx;
  } else if (lineCommentIdx >= 0) {
    commentStart = lineCommentIdx;
  }

  let codePart = remaining;
  let commentPart = '';
  if (commentStart >= 0) {
    codePart = remaining.substring(0, commentStart);
    commentPart = remaining.substring(commentStart);
  }

  // Tokenize code part
  let lastIndex = 0;
  const combined = new RegExp(`(${C_KEYWORDS.source})|(${C_TYPES.source})`, 'g');
  let match;
  while ((match = combined.exec(codePart)) !== null) {
    if (match.index > lastIndex) {
      result.push({ text: codePart.substring(lastIndex, match.index), className: '' });
    }
    if (match[1]) {
      result.push({ text: match[0], className: 'text-blue-400 font-semibold' });
    } else {
      result.push({ text: match[0], className: 'text-green-400' });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < codePart.length) {
    result.push({ text: codePart.substring(lastIndex), className: '' });
  }

  if (commentPart) {
    result.push({ text: commentPart, className: 'text-muted-foreground/60' });
  }

  return result;
}

function HighlightedSCL({ code }: { code: string }) {
  const lines = code.split('\n');
  return (
    <>
      {lines.map((line, i) => (
        <SCLLine key={i} line={line} />
      ))}
    </>
  );
}

function SCLLine({ line }: { line: string }) {
  const parts = tokenizeSCLLine(line);
  return (
    <span>
      {parts.map((part, i) => (
        <span key={i} className={part.className}>{part.text}</span>
      ))}
      {'\n'}
    </span>
  );
}

function tokenizeSCLLine(line: string): { text: string; className: string }[] {
  const result: { text: string; className: string }[] = [];

  // Check for (* comment *)
  const commentMatch = line.match(/(\(\*.*?\*\))/);
  if (commentMatch && commentMatch.index !== undefined) {
    const before = line.substring(0, commentMatch.index);
    const comment = commentMatch[0];
    const after = line.substring(commentMatch.index + comment.length);

    if (before) result.push(...tokenizeSCLCode(before));
    result.push({ text: comment, className: 'text-muted-foreground/60' });
    if (after) result.push(...tokenizeSCLCode(after));
    return result;
  }

  // // comment
  const lineCommentIdx = line.indexOf('//');
  if (lineCommentIdx >= 0) {
    const before = line.substring(0, lineCommentIdx);
    const comment = line.substring(lineCommentIdx);
    if (before) result.push(...tokenizeSCLCode(before));
    result.push({ text: comment, className: 'text-muted-foreground/60' });
    return result;
  }

  return tokenizeSCLCode(line);
}

function tokenizeSCLCode(line: string): { text: string; className: string }[] {
  const SCL_KEYWORDS = /\b(FUNCTION_BLOCK|END_FUNCTION_BLOCK|VAR_INPUT|VAR_OUTPUT|VAR CONSTANT|VAR|END_VAR|BEGIN|CASE|END_CASE|OF|IF|ELSIF|ELSE|END_IF|THEN|AND|OR|NOT|TRUE|FALSE)\b/g;
  const SCL_TYPES = /\b(BOOL|SINT|INT|DINT|USINT|UINT|UDINT|REAL|LREAL|STRING)\b/g;
  const SCL_REFS = /(#\w+)/g;

  const result: { text: string; className: string }[] = [];
  const combined = new RegExp(`(${SCL_KEYWORDS.source})|(${SCL_TYPES.source})|(${SCL_REFS.source})`, 'g');

  let lastIndex = 0;
  let match;
  while ((match = combined.exec(line)) !== null) {
    if (match.index > lastIndex) {
      result.push({ text: line.substring(lastIndex, match.index), className: '' });
    }
    if (match[1]) {
      result.push({ text: match[0], className: 'text-blue-400 font-semibold' });
    } else if (match[2]) {
      result.push({ text: match[0], className: 'text-green-400' });
    } else {
      result.push({ text: match[0], className: 'text-orange-400' });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < line.length) {
    result.push({ text: line.substring(lastIndex), className: '' });
  }

  return result;
}
