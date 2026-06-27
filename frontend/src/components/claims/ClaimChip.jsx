import { useState } from 'react'
import { getVerdictConfig, pct } from '../../lib/verdict'

export function ClaimChip({ claim, isActive, onClick }) {
  const [hovered, setHovered] = useState(false)
  const verdict = claim.verification?.verdict || 'unverifiable'
  const cfg = getVerdictConfig(verdict)
  const confidence = pct(claim.verification?.confidence_score)

  return (
    <span
      className="relative cursor-pointer"
      style={{ display: 'inline' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClick(claim)}
    >
      {/* The claim text with colored underline */}
      <span
        className="font-serif text-[1.05rem] leading-relaxed transition-all duration-200"
        style={{
          backgroundColor: isActive || hovered ? cfg.bg : 'transparent',
          borderRadius: '3px',
          padding: '1px 2px',
          textDecoration: 'underline',
          textDecorationColor: cfg.color,
          textDecorationThickness: isActive ? '3px' : hovered ? '2.5px' : '2px',
          textUnderlineOffset: '3px',
          textDecorationStyle: verdict === 'unverifiable' ? 'dashed' : 'solid',
        }}
      >
        {claim.claim_text}
      </span>

      {/* Confidence badge on hover */}
      {(hovered || isActive) && (
        <span
          className="inline-flex items-center ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium align-middle"
          style={{
            backgroundColor: cfg.bg,
            color: cfg.color,
            border: `1px solid ${cfg.border}`,
          }}
        >
          {cfg.icon} {confidence}%
        </span>
      )}
    </span>
  )
}

export function ClaimsSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="skeleton-pulse">
          <div
            className="h-5 rounded bg-surface"
            style={{ width: `${70 + Math.random() * 25}%` }}
          />
        </div>
      ))}
    </div>
  )
}

export function SummaryStats({ claims }) {
  const verdicts = claims.map(c => c.verification?.verdict || 'unverifiable')
  const supported = verdicts.filter(v => v === 'supported').length
  const contradicted = verdicts.filter(v => v === 'contradicted').length
  const unverifiable = verdicts.filter(v => v === 'unverifiable').length

  return (
    <div className="flex flex-wrap gap-3">
      <StatPill count={supported} label="Supported" color="text-[#52b788]" bg="bg-supported/10 border-supported/30" />
      <StatPill count={unverifiable} label="Unverifiable" color="text-[#f4a42e]" bg="bg-unverifiable/10 border-unverifiable/30" />
      <StatPill count={contradicted} label="Contradicted" color="text-[#ef4444]" bg="bg-contradicted/10 border-contradicted/30" />
    </div>
  )
}

function StatPill({ count, label, color, bg }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${bg}`}>
      <span className={`font-mono font-bold text-sm ${color}`}>{count}</span>
      <span className="text-xs text-muted">{label}</span>
    </div>
  )
}
