import { cn } from '@/lib/utils';

export function Tag({ children, color, textColor = '#FFF', className = '' }) {
	return (
		<span
			className={cn(
				'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs leading-none whitespace-nowrap',
				className,
			)}
			style={color ? { backgroundColor: color, color: textColor } : undefined}
		>
			{children}
		</span>
	);
}
