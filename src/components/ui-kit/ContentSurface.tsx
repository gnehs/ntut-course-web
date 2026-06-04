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
				'text-[rgb(var(--vs-text))]',
				'[&_code]:rounded-[4px] [&_code]:border [&_code]:border-[rgba(var(--vs-text),0.1)] [&_code]:bg-[rgba(var(--vs-text),0.01)] [&_code]:px-1 [&_code]:text-[0.95em] [&_code]:leading-[1.5em]',
				"[&_code]:[font-family:'Roboto_Mono','Noto_Sans_TC',monospace] [&_pre]:[font-family:'Roboto_Mono','Noto_Sans_TC',monospace]",
				'[&_hr]:border-0 [&_hr]:border-t [&_hr]:border-black/10',
				'[&_h1]:text-[2em] [&_h1]:leading-[1.5em] [&_h1]:font-semibold',
				'[&_h2]:text-[1.5em] [&_h2]:leading-[1.5em] [&_h2]:font-semibold',
				'[&_h3]:text-[1.17em] [&_h3]:leading-[1.5em] [&_h3]:font-semibold',
				'[&_h4]:text-[1em] [&_h4]:leading-[1.5em] [&_h4]:font-semibold',
				'[&_h5]:text-[0.83em] [&_h5]:leading-[1.5em] [&_h5]:font-semibold',
				'[&_h6]:text-[0.67em] [&_h6]:leading-[1.5em] [&_h6]:font-semibold',
				'[&_p]:my-[1em] [&_p]:leading-[1.5em]',
				'[&_h1+p]:mt-[-1em] [&_h2+p]:mt-[-1em] [&_h3+p]:mt-[-1em] [&_h4+p]:mt-[-1em] [&_h5+p]:mt-[-1em] [&_h6+p]:mt-[-1em]',
				className,
			)}
			{...props}
		>
			{children}
		</Component>
	);
});
