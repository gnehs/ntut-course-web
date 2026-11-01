import { cn } from '@/lib/utils';

export function Textarea({ className = '', ...props }) {
	return (
		<textarea
			className={cn(
				'rounded-control bg-field shadow-field min-h-[120px] w-full border border-[rgba(var(--vs-text),0.1)] px-3 py-2 text-base text-[rgb(var(--vs-text))] transition-[background-color,border-color,box-shadow] outline-none focus:bg-[rgb(var(--vs-background))] md:text-sm',
				'focus:border-[rgba(var(--vs-primary),0.7)] focus-visible:ring-[3px] focus-visible:ring-[rgba(var(--vs-primary),0.24)]',
				className,
			)}
			{...props}
		/>
	);
}
