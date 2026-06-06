import * as React from 'react';
import { Popover as PopoverPrimitive } from 'radix-ui';

import { cn } from '@/lib/utils';

function Popover({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Root>) {
	return <PopoverPrimitive.Root data-slot='popover' {...props} />;
}

function PopoverTrigger({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
	return <PopoverPrimitive.Trigger data-slot='popover-trigger' {...props} />;
}

function PopoverContent({
	className,
	align = 'start',
	sideOffset = 8,
	...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
	return (
		<PopoverPrimitive.Portal>
			<PopoverPrimitive.Content
				data-slot='popover-content'
				align={align}
				sideOffset={sideOffset}
				className={cn(
					'z-50 max-h-[min(70vh,560px)] w-[min(360px,calc(100vw-1.5rem))] overflow-auto rounded-xl border border-[rgba(var(--vs-text),0.1)] bg-[rgb(var(--vs-background))] p-3 text-[rgb(var(--vs-text))] shadow-[0_18px_50px_rgba(0,0,0,0.2)] outline-none',
					className,
				)}
				{...props}
			/>
		</PopoverPrimitive.Portal>
	);
}

export { Popover, PopoverContent, PopoverTrigger };
