import { cn } from '@/lib/utils'

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
