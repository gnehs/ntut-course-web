import { cn } from '@/lib/utils';
import type React from 'react';

type ButtonProps = {
	as?: React.ElementType;
	className?: string;
	active?: boolean;
	icon?: boolean;
	danger?: boolean;
	primary?: boolean;
	type?: string;
} & Omit<React.ComponentPropsWithoutRef<'button'>, 'type'> &
	Record<string, unknown>;

export function Button({
	as: Component = 'button',
	className = '',
	active = false,
	icon = false,
	danger = false,
	primary = false,
	type = 'button',
	...props
}: ButtonProps) {
	const isSolid = (active || primary) && !danger;
	const classes = cn(
		'inline-flex min-h-11 shrink-0 touch-manipulation items-center justify-center gap-1.5 rounded-control px-3 py-2 text-sm font-medium leading-5 transition-[background-color,border-color,color,box-shadow,opacity,transform] duration-200 motion-safe:active:scale-[0.97] motion-safe:active:duration-[120ms] sm:min-h-9',
		'border-0 no-underline focus-visible:ring-[3px] focus-visible:ring-[rgba(var(--vs-primary),0.28)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
		icon && 'size-11 p-0 sm:size-9',
		danger ? 'tone-danger' : isSolid ? 'tone-primary' : 'tone-neutral',
		isSolid
			? 'bg-[rgb(var(--vs-primary))] text-[rgb(var(--vs-primary-foreground))] shadow-solid hover:bg-[rgb(var(--vs-primary))] hover:shadow-solid-hover'
			: 'shadow-soft hover:shadow-soft-hover',
		danger &&
			'bg-[rgba(var(--vs-danger),0.15)] text-[rgb(var(--vs-danger))] hover:bg-[rgba(var(--vs-danger),0.2)]',
		!isSolid &&
			!danger &&
			'bg-[rgba(var(--vs-text),0.06)] text-[rgb(var(--vs-text))] hover:bg-[rgba(var(--vs-text),0.1)]',
		className,
	);
	return (
		<Component type={Component === 'button' ? type : undefined} className={classes} {...props} />
	);
}
