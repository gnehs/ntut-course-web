import { cn } from '@/lib/utils';

export function Alert({ children, danger = false, className = '' }) {
	return (
		<div
			role='alert'
			className={cn(
				'rounded-panel bg-sheen-surface shadow-rest border px-4 py-3',
				danger
					? 'border-[rgba(var(--vs-danger),0.28)] bg-[rgba(var(--vs-danger),0.08)] text-[rgb(var(--vs-danger))] shadow-[inset_0_1px_0_var(--edge-highlight-soft),0_1px_2px_rgba(var(--vs-danger),0.12)]'
					: 'border-transparent bg-[rgb(var(--vs-background))] text-[rgb(var(--vs-text))]',
				className,
			)}
		>
			{children}
		</div>
	);
}
