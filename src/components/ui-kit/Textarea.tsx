import { cn } from '@/lib/utils';

export function Textarea({ className = '', ...props }) {
	return (
		<textarea
			className={cn(
				'min-h-[120px] w-full rounded-lg border border-[rgba(var(--vs-text),0.12)] bg-[rgb(var(--vs-background))] px-3 py-2 text-[rgb(var(--vs-text))] transition-colors outline-none',
				'focus:border-[rgba(var(--vs-primary),0.7)]',
				className,
			)}
			{...props}
		/>
	);
}
