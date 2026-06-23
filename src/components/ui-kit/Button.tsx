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
	const classes = cn(
		'inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-normal leading-none transition-all duration-200',
		'border-0 no-underline focus-visible:ring-[3px] focus-visible:ring-[rgba(var(--vs-primary),0.28)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
		icon && 'size-11 px-0',
		active &&
			'bg-[rgb(var(--vs-primary))] text-[rgb(var(--vs-primary-foreground))] hover:bg-[rgb(var(--vs-primary))]',
		!active &&
			danger &&
			'bg-[rgba(var(--vs-danger),0.15)] text-[rgb(var(--vs-danger))] hover:bg-[rgba(var(--vs-danger),0.2)]',
		!active &&
			!danger &&
			'bg-[rgba(var(--vs-primary),0.15)] text-[rgb(var(--vs-primary))] hover:bg-[rgba(var(--vs-primary),0.2)]',
		primary && !active && 'bg-[rgba(var(--vs-primary),0.15)] text-[rgb(var(--vs-primary))]',
		className,
	);
	return (
		<Component type={Component === 'button' ? type : undefined} className={classes} {...props} />
	);
}
