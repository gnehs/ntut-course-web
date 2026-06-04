import { cn } from '@/lib/utils';

export function CardTitle({ children, spaceBetween = false, className = '' }) {
	return (
		<h3
			className={cn(
				'm-0 mb-0.5 flex w-full flex-row items-center text-[1.17em] font-semibold',
				spaceBetween ? 'justify-between' : 'justify-start',
				className,
			)}
		>
			{children}
		</h3>
	);
}
