'use client';

import { useNavigationStore } from '@/lib/store/navigation-store';
import { useProjectStore } from '@/lib/store/project-store';
import { ChevronRight } from 'lucide-react';

export function BreadcrumbNav() {
  const activeView = useNavigationStore((s) => s.activeView);
  const navigateToSystem = useNavigationStore((s) => s.navigateToSystem);
  const chartName = useProjectStore((s) => {
    if (activeView.type !== 'chart') return null;
    const chart = s.currentProject?.charts.find(
      (c) => c.id === activeView.chartId
    );
    return chart?.name ?? 'Chart';
  });

  return (
    <div className="flex items-center h-7 px-3 border-b bg-background text-xs">
      {activeView.type === 'system' ? (
        <span className="font-medium text-foreground">System</span>
      ) : (
        <>
          <button
            onClick={navigateToSystem}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            System
          </button>
          <ChevronRight className="h-3 w-3 mx-1 text-muted-foreground" />
          <span className="font-medium text-foreground">{chartName}</span>
        </>
      )}
    </div>
  );
}
