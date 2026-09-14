import type * as React from 'react';
import { Tabs as TabsPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';

function Tabs({
	className,
	orientation = 'horizontal',
	...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
	return (
		<TabsPrimitive.Root
			data-slot='tabs'
			orientation={orientation}
			className={cn('flex gap-3', orientation === 'horizontal' && 'flex-col', className)}
			{...props}
		/>
	);
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
	return (
		<TabsPrimitive.List
			data-slot='tabs-list'
			className={cn(
				'rounded-surface inline-flex w-fit shrink-0 items-center gap-1 bg-[rgba(var(--vs-text),0.08)] p-1',
				className,
			)}
			{...props}
		/>
	);
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
	return (
		<TabsPrimitive.Trigger
			data-slot='tabs-trigger'
			className={cn(
				'rounded-control inline-flex min-h-10 flex-1 items-center justify-center gap-2 px-4 py-2 text-sm font-medium whitespace-nowrap text-[rgba(var(--vs-text),0.65)] outline-none',
				'hover:text-[rgb(var(--vs-text))] focus-visible:ring-2 focus-visible:ring-[rgba(var(--vs-primary),0.5)] disabled:pointer-events-none disabled:opacity-50',
				className,
			)}
			{...props}
		/>
	);
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
	return (
		<TabsPrimitive.Content
			data-slot='tabs-content'
			className={cn(
				'min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--vs-primary),0.5)]',
				className,
			)}
			{...props}
		/>
	);
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
