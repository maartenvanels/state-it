'use client';

import { useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/lib/store/ui-store';
import { useCanvasStore } from '@/lib/store/canvas-store';
import { useProjectStore } from '@/lib/store/project-store';
import { Code2, Copy, AlertTriangle } from 'lucide-react';
import { buildModel } from '@/lib/codegen/model-builder';
import { validateModel } from '@/lib/codegen/validator';
import { generateC } from '@/lib/codegen/c-generator';
import { generateSCL } from '@/lib/codegen/scl-generator';

export function CodePreviewPanel() {
  const language = useUIStore((s) => s.codePreviewLanguage);
  const setLanguage = useUIStore((s) => s.setCodePreviewLanguage);
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const project = useProjectStore((s) => s.currentProject);
  const variables = project?.variables ?? [];
  const projectName = project?.name ?? 'StateMachine';

  const stateCount = nodes.filter((n) => n.type === 'stateNode').length;

  const { cCode, sclCode, warnings, errors } = useMemo(() => {
    if (stateCount === 0) {
      return {
        cCode: { header: '', source: '' },
        sclCode: '',
        warnings: [],
        errors: [],
      };
    }

    const model = buildModel(nodes, edges, variables, projectName);
    const messages = validateModel(model);
    const cResult = generateC(model);
    const sclResult = generateSCL(model);

    return {
      cCode: cResult,
      sclCode: sclResult,
      warnings: messages.filter((m) => m.level === 'warning'),
      errors: messages.filter((m) => m.level === 'error'),
    };
  }, [nodes, edges, variables, projectName, stateCount]);

  const handleCopy = () => {
    const text = language === 'c'
      ? `${cCode.header}\n\n${cCode.source}`
      : sclCode;
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex h-full flex-col">
      <Tabs
        value={language}
        onValueChange={(v) => setLanguage(v as 'c' | 'scl')}
        className="flex-1 flex flex-col"
      >
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
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleCopy}
                title="Copy to clipboard"
              >
                <Copy className="h-3 w-3" />
              </Button>
            )}
            <TabsList className="h-7">
              <TabsTrigger value="c" className="text-xs h-6 px-2">
                C
              </TabsTrigger>
              <TabsTrigger value="scl" className="text-xs h-6 px-2">
                SCL
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="c" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <pre className="p-3 text-xs font-mono leading-relaxed whitespace-pre">
              {stateCount === 0 ? (
                <span className="text-muted-foreground">
                  {'/* Add states to see generated C code */'}
                </span>
              ) : (
                <>
                  <span className="text-muted-foreground/50 text-[10px]">{'/* === Header === */\n'}</span>
                  <HighlightedC code={cCode.header} />
                  <span>{'\n'}</span>
                  <span className="text-muted-foreground/50 text-[10px]">{'/* === Source === */\n'}</span>
                  <HighlightedC code={cCode.source} />
                </>
              )}
            </pre>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="scl" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <pre className="p-3 text-xs font-mono leading-relaxed whitespace-pre">
              {stateCount === 0 ? (
                <span className="text-muted-foreground">
                  {'(* Add states to see generated SCL code *)'}
                </span>
              ) : (
                <HighlightedSCL code={sclCode} />
              )}
            </pre>
          </ScrollArea>
        </TabsContent>
      </Tabs>
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
  let remaining = line;

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
