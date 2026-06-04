import { cn } from '@/lib/utils'

export function Select({ className = '', ...props }) {
  return (
    <select
      className={cn(
        'h-9 w-full min-w-0 rounded-[12px] border border-[rgba(var(--vs-text),0.12)] bg-[rgb(var(--vs-background))] px-3 py-2 text-[rgb(var(--vs-text))] outline-none transition-colors',
        'focus:border-[rgba(var(--vs-primary),0.7)]',
        className
      )}
      {...props}
    />
  )
}
