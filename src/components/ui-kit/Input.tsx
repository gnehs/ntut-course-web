import { cn } from '@/lib/utils';

export function Input({ className = '', ...props }) {
	return (
		<input
			className={cn(
				'rounded-control bg-field shadow-field min-h-11 w-full min-w-0 border border-[rgba(var(--vs-text),0.1)] px-3 py-2 text-base text-[rgb(var(--vs-text))] transition-[background-color,border-color,box-shadow] outline-none focus:bg-[rgb(var(--vs-background))] md:min-h-9 md:py-1.5 md:text-sm',
				'focus:border-[rgba(var(--vs-primary),0.7)] focus-visible:ring-[3px] focus-visible:ring-[rgba(var(--vs-primary),0.24)]',
				className,
			)}
			{...props}
		/>
	);
}
