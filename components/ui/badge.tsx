'use client'

interface BadgeProps {
  label: string
  color?: string
}

export function Badge({ label, color = '#6c757d' }: BadgeProps) {
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-xs font-semibold text-white"
      style={{ backgroundColor: color }}
    >
      {label}
    </span>
  )
}
