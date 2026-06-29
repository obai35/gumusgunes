'use client'

export function DiamondLoading({ text }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <svg
          width="100"
          height="100"
          viewBox="0 0 100 100"
          className="drop-shadow-lg"
        >
          {/* Ring */}
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="none"
            stroke="#C9A96E"
            strokeWidth="3"
            strokeLinecap="round"
            className="origin-center"
            style={{ strokeDasharray: '240', strokeDashoffset: '60', animation: 'ringDraw 1.5s ease-out infinite' }}
          />
          {/* Ring shine */}
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="none"
            stroke="url(#shineGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            style={{ strokeDasharray: '15 85', strokeDashoffset: '0', animation: 'ringShine 2s linear infinite' }}
          />
          {/* Diamond mounting base */}
          <path
            d="M50 18 L60 30 L50 40 L40 30 Z"
            fill="#C9A96E"
            opacity="0.5"
            style={{ animation: 'diamondMount 1.5s ease-out infinite' }}
          />
          {/* Diamond */}
          <polygon
            points="50,10 62,28 50,42 38,28"
            fill="url(#diamondGrad)"
            style={{ animation: 'diamondPlace 1.5s ease-out infinite' }}
          />
          {/* Diamond facets (inner lines) */}
          <line x1="50" y1="10" x2="50" y2="42" stroke="white" strokeWidth="0.8" opacity="0.6" />
          <line x1="38" y1="28" x2="62" y2="28" stroke="white" strokeWidth="0.8" opacity="0.4" />
          {/* Sparkles */}
          <g style={{ animation: 'sparkle 1.5s ease-out infinite' }}>
            <line x1="50" y1="10" x2="50" y2="4" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
            <line x1="44" y1="14" x2="39" y2="9" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
            <line x1="56" y1="14" x2="61" y2="9" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
          </g>
          {/* Right prong */}
          <line x1="62" y1="28" x2="66" y2="32" stroke="#C9A96E" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          {/* Left prong */}
          <line x1="38" y1="28" x2="34" y2="32" stroke="#C9A96E" strokeWidth="2" strokeLinecap="round" opacity="0.7" />

          <defs>
            <linearGradient id="diamondGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#e8f4ff" />
              <stop offset="60%" stopColor="#b8d4f0" />
              <stop offset="100%" stopColor="#f0f0f0" />
            </linearGradient>
            <linearGradient id="shineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="40%" stopColor="transparent" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.6)" />
              <stop offset="60%" stopColor="transparent" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
        </svg>
        {text && (
          <p className="font-display text-sm text-navy/60 tracking-wider uppercase animate-pulse">
            {text}
          </p>
        )}
      </div>

      <style>{`
        @keyframes ringDraw {
          0%, 20% { stroke-dashoffset: 240; }
          60%, 100% { stroke-dashoffset: 60; }
        }
        @keyframes ringShine {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -240; }
        }
        @keyframes diamondMount {
          0%, 20% { opacity: 0; transform: translateY(10px); }
          50%, 100% { opacity: 0.5; transform: translateY(0); }
        }
        @keyframes diamondPlace {
          0%, 30% { opacity: 0; transform: translateY(-15px); }
          60%, 100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes sparkle {
          0%, 50% { opacity: 0; }
          60%, 70% { opacity: 1; }
          80%, 100% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
