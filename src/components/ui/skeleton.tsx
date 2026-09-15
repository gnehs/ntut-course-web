import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }) {
	return (
		<div
			data-slot='skeleton'
			className={cn('rounded-control bg-accent animate-pulse', className)}
			{...props}
		/>
	);
}

export { Skeleton };
