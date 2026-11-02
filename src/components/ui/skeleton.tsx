import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }) {
	return (
		<div
			data-slot='skeleton'
			className={cn('rounded-control animate-pulse bg-[rgba(var(--vs-text),0.1)]', className)}
			{...props}
		/>
	);
}

export { Skeleton };
