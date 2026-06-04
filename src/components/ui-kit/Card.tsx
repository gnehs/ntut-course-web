import { Link } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import type React from 'react';
import { bindInteractiveCard } from '@/lib/motion';
import { cn } from '@/lib/utils';

type CardProps = {
	to?: string;
	className?: string;
	children?: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>;

export function Card({ to, className = '', children, ...props }: CardProps) {
	const cardRef = useRef<HTMLElement | null>(null);
	const isHoverable = /\bhoverable\b/.test(className);
	const isPadding = /\bpadding\b/.test(className);
	const isBorderless = /\bborderless\b/.test(className);
	const isInteractive = isHoverable || Boolean(to);
	const normalizedClassName = normalizeCardClassName(className, isInteractive);
	const classes = cn(
		'relative w-full overflow-hidden rounded-lg !text-black !no-underline transition-colors duration-200 dark:!text-white',
		'[&_p]:!m-0 [&_p]:!text-[0.85rem] [&_p]:!opacity-80 [&_p+p]:!mt-2',
		'[&>[data-card-icon]]:absolute [&>[data-card-icon]]:right-2 [&>[data-card-icon]]:bottom-0 [&>[data-card-icon]]:m-auto [&>[data-card-icon]]:size-12 [&>[data-card-icon]]:origin-bottom-right [&>[data-card-icon]]:opacity-20 [&>[data-card-icon]]:translate-y-2.5',
		isBorderless ? 'border-0 bg-transparent shadow-none' : 'bg-[rgb(var(--vs-background))]',
		!isBorderless && isInteractive
			? 'shadow-[0_5px_20px_0_rgba(0,0,0,var(--vs-shadow-opacity,0.05))]'
			: !isBorderless && 'border border-[rgba(var(--vs-text),0.1)] shadow-none',
		isBorderless ? 'px-0 py-1' : isPadding ? 'px-4 py-3' : 'px-3 py-2',
		isInteractive &&
			'cursor-pointer will-change-transform hover:!text-black dark:hover:!text-white',
		normalizedClassName,
	);

	useEffect(() => {
		if (!isInteractive) return undefined;
		return bindInteractiveCard(cardRef.current);
	}, [isInteractive]);

	if (to) {
		return (
			<Link ref={cardRef as React.Ref<HTMLAnchorElement>} to={to} className={classes} {...props}>
				{children}
			</Link>
		);
	}
	return (
		<div ref={cardRef as React.Ref<HTMLDivElement>} className={classes} {...props}>
			{children}
		</div>
	);
}

function normalizeCardClassName(className: string, isInteractive: boolean) {
	const baseClasses = className
		.replace(/\bhoverable\b|\bpadding\b|\bborderless\b/g, '')
		.split(/\s+/)
		.filter(Boolean);

	if (!isInteractive) return baseClasses.join(' ');

	return baseClasses
		.filter((item) => {
			if (item === 'cursor-pointer') return false;
			if (item === 'transition-transform') return false;
			if (item === 'transition-all') return false;
			if (item === 'active:shadow-none') return false;
			if (item.startsWith('hover:-translate-y')) return false;
			if (item.startsWith('active:translate-y')) return false;
			if (item.startsWith('hover:shadow-')) return false;
			return true;
		})
		.join(' ');
}
