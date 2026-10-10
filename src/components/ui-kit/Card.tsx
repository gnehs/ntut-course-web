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
	const isBorderless = /\bborderless\b/.test(className);
	const isInteractive = isHoverable || Boolean(to);
	const normalizedClassName = normalizeCardClassName(className, isInteractive);
	const classes = cn(
		'relative w-full overflow-hidden rounded-surface !text-foreground !no-underline transition-[background-color,border-color,color,box-shadow] duration-200',
		'[&_p]:!m-0 [&_p]:!text-[0.85rem] [&_p]:!opacity-80 [&_p+p]:!mt-2',
		'has-[>[data-card-icon]]:!pr-12 [&>[data-card-icon]]:absolute [&>[data-card-icon]]:inset-y-0 [&>[data-card-icon]]:right-4 [&>[data-card-icon]]:my-auto [&>[data-card-icon]]:size-5 [&>[data-card-icon]]:opacity-40',
		isBorderless ? 'border-0 bg-transparent shadow-none' : 'bg-[rgb(var(--vs-background))]',
		!isBorderless &&
			(isInteractive
				? 'bg-sheen-glow shadow-raised hover:shadow-lifted active:shadow-pressed'
				: 'bg-sheen-surface shadow-rest'),
		isBorderless ? 'px-0 py-1' : 'px-4 py-3',
		isInteractive &&
			'cursor-pointer will-change-transform focus-visible:ring-[3px] focus-visible:ring-[rgba(var(--vs-primary),0.28)] focus-visible:outline-none hover:!text-foreground',
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
