export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const cfg = {
    sm: { icon: 18, text: 13, gap: 6 },
    md: { icon: 22, text: 17, gap: 7 },
    lg: { icon: 28, text: 22, gap: 9 },
  }[size]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: `${cfg.gap}px`, userSelect: 'none' }}>
      <svg width={cfg.icon} height={cfg.icon} viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="13" r="2.5" fill="var(--accent)" />
        <path d="M6.5 13 A4.5 4.5 0 0 1 15.5 13"
          stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.65" />
        <path d="M3 13 A8 8 0 0 1 19 13"
          stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.35" />
      </svg>
      <span style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontWeight: 900,
        fontSize: `${cfg.text}px`,
        letterSpacing: '-0.04em',
        color: 'var(--text)',
        lineHeight: 1,
      }}>
        Traka
      </span>
    </div>
  )
}
