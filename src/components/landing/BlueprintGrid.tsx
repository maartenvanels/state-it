'use client';

export function BlueprintGrid() {
  return (
    <div
      className="absolute inset-0 -z-20 opacity-[0.04] animate-grid-drift"
      style={{
        backgroundImage: `
          linear-gradient(rgba(124,58,237,0.4) 1px, transparent 1px),
          linear-gradient(90deg, rgba(124,58,237,0.4) 1px, transparent 1px),
          linear-gradient(rgba(124,58,237,0.15) 1px, transparent 1px),
          linear-gradient(90deg, rgba(124,58,237,0.15) 1px, transparent 1px)
        `,
        backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px',
      }}
    />
  );
}
