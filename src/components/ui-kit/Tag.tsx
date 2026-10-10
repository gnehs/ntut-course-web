import { cn } from '@/lib/utils';

export function Tag({ children, color, textColor = '#FFF', className = '' }) {
	return (
		<span
			className={cn(
				'bg-sheen-gloss inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs leading-none whitespace-nowrap shadow-[inset_0_1px_0_rgba(255,255,255,0.28),inset_0_0_0_1px_rgba(0,0,0,0.06),0_1px_1px_rgba(var(--vs-shadow),0.1)]',
				textColor === '#FFF' && 'text-shadow-ink',
				className,
			)}
			style={color ? { backgroundColor: color, color: textColor } : undefined}
		>
			{children}
		</span>
	);
}
