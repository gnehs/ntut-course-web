import { cn } from '@/lib/utils';

export function MiniNotify({ children, className = '' }) {
	return (
		<div
			className={cn(
				'rounded-[8px] border border-[rgba(var(--vs-text),0.1)] bg-[rgb(var(--vs-background))] px-4 py-3 text-sm',
				className,
			)}
		>
			{children}
		</div>
	);
}
