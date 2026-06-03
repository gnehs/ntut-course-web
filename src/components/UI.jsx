import { Link } from '@tanstack/react-router'
import { forwardRef, useEffect, useRef } from 'react'
import { Dialog as ShadcnDialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { bindInteractiveCard } from '@/lib/motion'

export const ContentSurface = forwardRef(function ContentSurface({ as: Component = 'div', children, className = '', ...props }, ref) {
  return (
    <Component
      ref={ref}
      className={cn(
        'text-[rgb(var(--vs-text))]',
        "[font-family:'Roboto_Condensed','Noto_Sans_TC',sans-serif]",
        "[&_a]:text-[rgb(var(--vs-primary))] [&_a]:underline [&_a:hover]:text-[rgba(var(--vs-primary),0.8)] [&_a:active]:text-[rgba(var(--vs-primary),0.9)]",
        "[&_code]:rounded-[4px] [&_code]:border [&_code]:border-[rgba(var(--vs-text),0.1)] [&_code]:bg-[rgba(var(--vs-text),0.01)] [&_code]:px-1 [&_code]:text-[0.95em] [&_code]:leading-[1.5em]",
        "[&_code]:[font-family:'Roboto_Mono','Noto_Sans_TC',monospace] [&_pre]:[font-family:'Roboto_Mono','Noto_Sans_TC',monospace]",
        '[&_hr]:border-0 [&_hr]:border-t [&_hr]:border-black/10',
        '[&_h1]:my-[1em] [&_h1]:text-[2em] [&_h1]:font-bold [&_h1]:leading-[1.5em]',
        '[&_h2]:my-[1em] [&_h2]:text-[1.5em] [&_h2]:font-bold [&_h2]:leading-[1.5em]',
        '[&_h3]:my-[1em] [&_h3]:text-[1.17em] [&_h3]:font-bold [&_h3]:leading-[1.5em]',
        '[&_h4]:my-[1em] [&_h4]:text-[1em] [&_h4]:font-bold [&_h4]:leading-[1.5em]',
        '[&_h5]:my-[1em] [&_h5]:text-[0.83em] [&_h5]:font-bold [&_h5]:leading-[1.5em]',
        '[&_h6]:my-[1em] [&_h6]:text-[0.67em] [&_h6]:font-bold [&_h6]:leading-[1.5em]',
        '[&_p]:my-[1em] [&_p]:leading-[1.5em]',
        '[&_h1+p]:mt-[-1em] [&_h2+p]:mt-[-1em] [&_h3+p]:mt-[-1em] [&_h4+p]:mt-[-1em] [&_h5+p]:mt-[-1em] [&_h6+p]:mt-[-1em]',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
})

export function Button({ as: Component = 'button', className = '', active = false, icon = false, danger = false, primary = false, type = 'button', ...props }) {
  const classes = cn(
    'inline-flex h-[34px] shrink-0 items-center justify-center gap-1 rounded-[12px] px-[10px] text-[0.8em] font-normal leading-none transition-all duration-200',
    'm-[5px] border-0 no-underline disabled:cursor-not-allowed disabled:opacity-50',
    icon && 'w-[34px] px-0',
    active && 'bg-[rgb(var(--vs-primary))] text-white hover:bg-[rgb(var(--vs-primary))]',
    !active && danger && 'bg-[rgba(var(--vs-danger),0.15)] text-[rgb(var(--vs-danger))] hover:bg-[rgba(var(--vs-danger),0.2)]',
    !active && !danger && 'bg-[rgba(var(--vs-primary),0.15)] text-[rgb(var(--vs-primary))] hover:bg-[rgba(var(--vs-primary),0.2)]',
    primary && !active && 'bg-[rgba(var(--vs-primary),0.15)] text-[rgb(var(--vs-primary))]',
    className
  )
  return (
    <Component
      type={Component === 'button' ? type : undefined}
      className={classes}
      {...props}
    />
  )
}

export function Card({ to, className = '', children, ...props }) {
  const cardRef = useRef(null)
  const isHoverable = /\bhoverable\b/.test(className)
  const isPadding = /\bpadding\b/.test(className)
  const isBorderless = /\bborderless\b/.test(className)
  const isInteractive = isHoverable || Boolean(to)
  const normalizedClassName = normalizeCardClassName(className, isInteractive)
  const classes = cn(
    'relative w-full overflow-hidden rounded-[8px] !text-black !no-underline transition-colors duration-200 dark:!text-white',
    '[&_p]:!m-0 [&_p]:!text-[0.85rem] [&_p]:!opacity-80 [&_p+p]:!mt-2',
    '[&>i]:absolute [&>i]:bottom-0 [&>i]:right-[0.1em] [&>i]:m-auto [&>i]:origin-bottom-right [&>i]:text-[48px] [&>i]:opacity-20',
    isBorderless
      ? 'border-0 bg-transparent shadow-none'
      : 'bg-[rgb(var(--vs-background))]',
    !isBorderless && isInteractive
      ? 'shadow-[0_5px_20px_0_rgba(0,0,0,var(--vs-shadow-opacity,0.05))]'
      : !isBorderless && 'border border-[rgba(var(--vs-text),0.1)] shadow-none',
    isBorderless ? 'px-0 py-1' : isPadding ? 'px-4 py-3' : 'px-3 py-2',
    isInteractive && 'cursor-pointer will-change-transform hover:!text-black dark:hover:!text-white',
    normalizedClassName
  )

  useEffect(() => {
    if (!isInteractive) return undefined
    return bindInteractiveCard(cardRef.current)
  }, [isInteractive])

  if (to) {
    return (
      <Link ref={cardRef} to={to} className={classes} {...props}>
        {children}
      </Link>
    )
  }
  return <div ref={cardRef} className={classes} {...props}>{children}</div>
}

function normalizeCardClassName(className, isInteractive) {
  const baseClasses = className
    .replace(/\bhoverable\b|\bpadding\b|\bborderless\b/g, '')
    .split(/\s+/)
    .filter(Boolean)

  if (!isInteractive) return baseClasses.join(' ')

  return baseClasses
    .filter((item) => {
      if (item === 'cursor-pointer') return false
      if (item === 'transition-transform') return false
      if (item === 'transition-all') return false
      if (item === 'active:shadow-none') return false
      if (item.startsWith('hover:-translate-y')) return false
      if (item.startsWith('active:translate-y')) return false
      if (item.startsWith('hover:shadow-')) return false
      return true
    })
    .join(' ')
}

export function CardTitle({ children, spaceBetween = false, className = '' }) {
  return (
    <h3
      className={cn(
        'm-0 mb-0.5 flex w-full flex-row items-center text-[1.17em] font-bold leading-[1.25]',
        '!m-0 !mb-0.5 !text-[1.17em] !font-bold !leading-[1.25]',
        spaceBetween ? 'justify-between' : 'justify-start',
        className
      )}
    >
      {children}
    </h3>
  )
}

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

export function Field({ label, children }) {
  return (
    <div className="grid gap-1">
      {label ? <label className="block text-[0.85em] opacity-75">{label}</label> : null}
      {children}
    </div>
  )
}

export function Input({ className = '', ...props }) {
  return (
    <input
      className={cn(
        'h-9 w-full min-w-0 rounded-[12px] border border-[rgba(var(--vs-text),0.12)] bg-[rgb(var(--vs-background))] px-3 py-2 text-[rgb(var(--vs-text))] outline-none transition-colors',
        'focus:border-[rgba(var(--vs-primary),0.7)]',
        className
      )}
      {...props}
    />
  )
}

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

export function Textarea({ className = '', ...props }) {
  return (
    <textarea
      className={cn(
        'min-h-[120px] w-full rounded-[12px] border border-[rgba(var(--vs-text),0.12)] bg-[rgb(var(--vs-background))] px-3 py-2 text-[rgb(var(--vs-text))] outline-none transition-colors',
        'focus:border-[rgba(var(--vs-primary),0.7)]',
        className
      )}
      {...props}
    />
  )
}

export function Dialog({ open, title, children, footer, onClose }) {
  if (!open) return null
  return (
    <ShadcnDialog open={open} onOpenChange={(value) => !value && onClose?.()}>
      <DialogContent className="w-[min(420px,calc(100vw-2rem))] gap-4 rounded-[18px] border border-[rgba(var(--vs-text),0.1)] bg-[rgb(var(--vs-background))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.24)]">
        <DialogHeader className="text-left">
          <DialogTitle>{title || '對話框'}</DialogTitle>
          <DialogDescription className="sr-only">{title || '對話框'}</DialogDescription>
        </DialogHeader>
        {children}
        {footer ? <DialogFooter>{footer}</DialogFooter> : null}
      </DialogContent>
    </ShadcnDialog>
  )
}

export function Loader() {
  return (
    <div className="flex items-center justify-center py-5">
      <div className="h-[18px] w-[120px] animate-pulse rounded-full bg-[rgba(var(--vs-text),0.12)]" />
      <span className="sr-only">載入中...</span>
    </div>
  )
}

export function MiniNotify({ children, className = '' }) {
  return (
    <div className={cn('rounded-[8px] border border-[rgba(var(--vs-text),0.1)] bg-[rgb(var(--vs-background))] px-4 py-3 text-sm', className)}>
      {children}
    </div>
  )
}

export function Pagination({ page, length, onChange }) {
  if (length <= 1) return null
  const items = getPaginationItems(page, length)
  return (
    <div className="flex flex-wrap items-center justify-center gap-1 py-5">
      <Button
        icon
        className="m-0"
        disabled={page <= 1}
        aria-label="上一頁"
        onClick={() => onChange(Math.max(page - 1, 1))}
      >
        <i className="bx bx-chevron-left" />
      </Button>
      {items.map((item, index) => (
        item === 'ellipsis' ? (
          <span key={`ellipsis-${index}`} className="inline-flex h-[34px] min-w-[34px] items-center justify-center px-1 text-[0.8em] opacity-60">...</span>
        ) : (
          <Button key={item} active={item === page} className="m-0" onClick={() => onChange(item)}>{item}</Button>
        )
      ))}
      <Button
        icon
        className="m-0"
        disabled={page >= length}
        aria-label="下一頁"
        onClick={() => onChange(Math.min(page + 1, length))}
      >
        <i className="bx bx-chevron-right" />
      </Button>
    </div>
  )
}

function getPaginationItems(page, length) {
  if (length <= 9) return Array.from({ length }, (_, index) => index + 1)

  if (page <= 4) {
    return [1, 2, 3, 4, 'ellipsis', length - 3, length - 2, length - 1, length]
  }

  if (page >= length - 3) {
    return [1, 2, 3, 4, 'ellipsis', length - 3, length - 2, length - 1, length]
  }

  return [1, 'ellipsis', page - 2, page - 1, page, page + 1, page + 2, 'ellipsis', length]
}
