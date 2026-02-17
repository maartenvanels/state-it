'use client';

import dynamic from 'next/dynamic';

const EditorContent = dynamic(() => import('./editor-content'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <div className="text-sm text-muted-foreground">Loading editor...</div>
    </div>
  ),
});

export default function EditorPage() {
  return <EditorContent />;
}
