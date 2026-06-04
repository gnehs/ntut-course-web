import { cn } from '@/lib/utils';

export function Input({ className = '', ...props }) {
	return (
		<input
			className={cn(
				'h-9 w-full min-w-0 rounded-lg border border-[rgba(var(--vs-text),0.12)] bg-[rgb(var(--vs-background))] px-3 py-2 text-[rgb(var(--vs-text))] transition-colors outline-none',
				'focus:border-[rgba(var(--vs-primary),0.7)]',
				className,
			)}
			{...props}
		/>
	);
}
