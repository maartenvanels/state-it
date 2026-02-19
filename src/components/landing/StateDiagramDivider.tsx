'use client';
import { useInView } from '@/hooks/useInView';

export function StateDiagramDivider() {
  const { ref, isInView } = useInView({ threshold: 0.5 });

  return (
    <div ref={ref} className="mx-auto max-w-2xl px-6 py-4 text-primary">
      <svg viewBox="0 0 600 60" className="w-full h-14">
        {/* State: Idle */}
        <rect
          x="30" y="18" width="80" height="24" rx="12"
          fill="none" stroke="currentColor" strokeWidth="1.5"
          opacity={isInView ? 1 : 0}
          style={{ transition: 'opacity 0.4s ease-out 0s' }}
        />
        <text
          x="70" y="34" textAnchor="middle"
          fill="currentColor" fontSize="10" fontFamily="monospace"
          opacity={isInView ? 1 : 0}
          style={{ transition: 'opacity 0.4s ease-out 0.1s' }}
        >
          Idle
        </text>

        {/* Arrow: Idle → Running */}
        <line
          x1="110" y1="30" x2="240" y2="30"
          stroke="currentColor" strokeWidth="1.5"
          strokeDasharray="130"
          strokeDashoffset={isInView ? 0 : 130}
          style={{ transition: 'stroke-dashoffset 0.5s ease-out 0.3s' }}
        />
        <polygon
          points="240,25 252,30 240,35"
          fill="currentColor"
          opacity={isInView ? 1 : 0}
          style={{ transition: 'opacity 0.3s ease-out 0.7s' }}
        />
        <text
          x="181" y="25" textAnchor="middle"
          fill="currentColor" fontSize="9" fontFamily="monospace"
          opacity={isInView ? 0.7 : 0}
          style={{ transition: 'opacity 0.3s ease-out 0.6s' }}
        >
          start
        </text>

        {/* State: Running */}
        <rect
          x="252" y="18" width="96" height="24" rx="12"
          fill="none" stroke="currentColor" strokeWidth="1.5"
          opacity={isInView ? 1 : 0}
          style={{ transition: 'opacity 0.4s ease-out 0.8s' }}
        />
        <text
          x="300" y="34" textAnchor="middle"
          fill="currentColor" fontSize="10" fontFamily="monospace"
          opacity={isInView ? 1 : 0}
          style={{ transition: 'opacity 0.4s ease-out 0.9s' }}
        >
          Running
        </text>

        {/* Arrow: Running → Done */}
        <line
          x1="348" y1="30" x2="458" y2="30"
          stroke="currentColor" strokeWidth="1.5"
          strokeDasharray="110"
          strokeDashoffset={isInView ? 0 : 110}
          style={{ transition: 'stroke-dashoffset 0.5s ease-out 1.1s' }}
        />
        <polygon
          points="458,25 470,30 458,35"
          fill="currentColor"
          opacity={isInView ? 1 : 0}
          style={{ transition: 'opacity 0.3s ease-out 1.5s' }}
        />
        <text
          x="403" y="25" textAnchor="middle"
          fill="currentColor" fontSize="9" fontFamily="monospace"
          opacity={isInView ? 0.7 : 0}
          style={{ transition: 'opacity 0.3s ease-out 1.4s' }}
        >
          done
        </text>

        {/* State: Done (double ring = final) */}
        <rect
          x="470" y="18" width="80" height="24" rx="12"
          fill="none" stroke="currentColor" strokeWidth="1.5"
          opacity={isInView ? 1 : 0}
          style={{ transition: 'opacity 0.4s ease-out 1.6s' }}
        />
        <rect
          x="474" y="22" width="72" height="16" rx="8"
          fill="none" stroke="currentColor" strokeWidth="0.75"
          opacity={isInView ? 0.6 : 0}
          style={{ transition: 'opacity 0.4s ease-out 1.7s' }}
        />
        <text
          x="510" y="34" textAnchor="middle"
          fill="currentColor" fontSize="10" fontFamily="monospace"
          opacity={isInView ? 1 : 0}
          style={{ transition: 'opacity 0.4s ease-out 1.7s' }}
        >
          Done
        </text>
      </svg>
    </div>
  );
}
