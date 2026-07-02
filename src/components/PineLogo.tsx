import React from 'react';

interface PineLogoProps {
  className?: string;
  size?: number;
  hideText?: boolean;
}

export default function PineLogo({ className = '', size = 32, hideText = false }: PineLogoProps) {
  return (
    <div className={`flex items-center gap-2 font-sans ${className}`}>
      {/* Pineapple Building Icon */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Crown/Spikes (Red & Teal/Blue accents as seen in top) */}
        <path
          d="M32 2L36 12L32 18L28 12L32 2Z"
          fill="#EF4444" // red
        />
        <path
          d="M24 6L29 13L26 18L19 12L24 6Z"
          fill="#3B82F6" // blue
        />
        <path
          d="M40 6L35 13L38 18L45 12L40 6Z"
          fill="#10B981" // green/teal
        />

        {/* Pineapple body (Yellow/Gold) */}
        <rect
          x="16"
          y="18"
          width="32"
          height="38"
          rx="12"
          fill="#F59E0B" // amber
          stroke="#D97706" // darker amber border
          strokeWidth="2"
        />

        {/* Windows (Blue grids) */}
        <rect x="22" y="24" width="6" height="6" rx="1.5" fill="#1E3A8A" />
        <rect x="36" y="24" width="6" height="6" rx="1.5" fill="#1E3A8A" />
        <rect x="22" y="34" width="6" height="6" rx="1.5" fill="#1E3A8A" />
        <rect x="36" y="34" width="6" height="6" rx="1.5" fill="#1E3A8A" />

        {/* Door (Blue arch) */}
        <path
          d="M28 56V47C28 44.7909 29.7909 43 32 43C34.2091 43 36 44.7909 36 47V56H28Z"
          fill="#1E3A8A"
        />
      </svg>
      
      {!hideText && (
        <span className="text-xl font-bold tracking-tight text-slate-900">
          Pine<span className="text-blue-900">Vela</span>
        </span>
      )}
    </div>
  );
}
