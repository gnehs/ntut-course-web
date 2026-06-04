import { cn } from '@/lib/utils'

export function Alert({ children, danger = false, className = '' }) {
  return (
    <div
      role="alert"
      className={cn(
        'rounded-[8px] border px-4 py-3',
        danger
          ? 'border-[rgba(var(--vs-danger),0.28)] bg-[rgba(var(--vs-danger),0.08)] text-[rgb(var(--vs-danger))]'
          : 'border-[rgba(var(--vs-text),0.1)] bg-[rgb(var(--vs-background))] text-[rgb(var(--vs-text))]',
        className
      )}
    >
      {children}
    </div>
  )
}
