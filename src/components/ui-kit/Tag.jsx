import { cn } from '@/lib/utils'

export function Tag({ children, color, textColor = '#FFF', className = '' }) {
  return (
    <span
      className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[0.78em] leading-none', className)}
      style={color ? { backgroundColor: color, color: textColor } : undefined}
    >
      {children}
    </span>
  )
}
