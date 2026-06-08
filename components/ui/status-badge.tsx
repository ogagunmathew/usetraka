'use client'

import { EventStatus } from '@/lib/types'
import { STATUS_STYLES } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function StatusBadge({ status }: { status: EventStatus }) {
  const style = STATUS_STYLES[status]
  return (
    <span className={cn('inline-block px-2 py-0.5 rounded text-xs font-semibold', style.bg, style.text)}>
      {status}
    </span>
  )
}
