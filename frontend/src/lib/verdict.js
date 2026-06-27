export const VERDICT_CONFIG = {
  supported: {
    label: 'Supported',
    color: '#52b788',
    bg: 'rgba(45, 106, 79, 0.12)',
    border: '#2d6a4f',
    badgeBg: 'bg-supported/20 text-supported-light border border-supported/30',
    underlineClass: 'claim-supported',
    icon: '✓',
  },
  unverifiable: {
    label: 'Unverifiable',
    color: '#f4a42e',
    bg: 'rgba(184, 144, 47, 0.10)',
    border: '#b8902f',
    badgeBg: 'bg-unverifiable/20 text-unverifiable-light border border-unverifiable/30',
    underlineClass: 'claim-unverifiable',
    icon: '?',
  },
  contradicted: {
    label: 'Contradicted',
    color: '#ef4444',
    bg: 'rgba(155, 44, 44, 0.12)',
    border: '#9b2c2c',
    badgeBg: 'bg-contradicted/20 text-contradicted-light border border-contradicted/30',
    underlineClass: 'claim-contradicted',
    icon: '✗',
  },
}

export function getVerdictConfig(verdict) {
  return VERDICT_CONFIG[verdict] || VERDICT_CONFIG.unverifiable
}

export function pct(score) {
  return Math.round((score || 0) * 100)
}
