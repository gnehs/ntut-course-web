import { cn } from '@/lib/utils';

export function MiniNotify({ children, className = '' }) {
	return (
		<div
			className={cn(
				'rounded-panel bg-sheen-surface shadow-rest bg-[rgb(var(--vs-background))] px-4 py-3 text-sm',
				className,
			)}
		>
			{children}
		</div>
	);
}
