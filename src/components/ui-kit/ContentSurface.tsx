import { forwardRef } from 'react';
import type React from 'react';
import { cn } from '@/lib/utils';

type ContentSurfaceProps = {
	as?: React.ElementType;
	children?: React.ReactNode;
	className?: string;
} & React.HTMLAttributes<HTMLElement>;

export const ContentSurface = forwardRef<unknown, ContentSurfaceProps>(function ContentSurface(
	{ as: Component = 'div', children, className = '', ...props },
	ref,
) {
	return (
		<Component
			ref={ref}
			className={cn(
				'content-surface text-[rgb(var(--vs-text))]',
				'[&_code]:rounded-[4px] [&_code]:border [&_code]:border-[rgba(var(--vs-text),0.1)] [&_code]:bg-[rgba(var(--vs-text),0.01)] [&_code]:px-1 [&_code]:text-[0.95em] [&_code]:leading-[1.5em]',
				"[&_code]:[font-family:'Roboto_Mono','Noto_Sans_TC',monospace] [&_pre]:[font-family:'Roboto_Mono','Noto_Sans_TC',monospace]",
				'[&_hr]:border-0 [&_hr]:border-t [&_hr]:border-black/10',
				className,
			)}
			{...props}
		>
			{children}
		</Component>
	);
});
