'use client'

interface BadgeProps {
  label: string
  color?: string
}

export function Badge({ label, color = '#64748b' }: BadgeProps) {
  return (
    <span
      className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{
        background: `${color}1a`,
        color: color,
        border: `1px solid ${color}40`,
      }}
    >
      {label}
    </span>
  )
}
