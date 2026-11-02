import * as React from 'react';
import { IconCheck } from '@tabler/icons-react';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';

import { cn } from '@/lib/utils';

function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
	return (
		<CheckboxPrimitive.Root
			data-slot='checkbox'
			className={cn(
				'peer tone-primary text-primary-foreground shadow-soft data-[state=checked]:shadow-solid size-4 shrink-0 rounded-[5px] bg-[rgb(var(--vs-background))] transition-[background-color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(var(--vs-primary),0.18)] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[rgb(var(--vs-primary))]',
				className,
			)}
			{...props}
		>
			<CheckboxPrimitive.Indicator
				data-slot='checkbox-indicator'
				className='grid place-content-center text-current transition-none'
			>
				<IconCheck className='size-3.5' />
			</CheckboxPrimitive.Indicator>
		</CheckboxPrimitive.Root>
	);
}

export { Checkbox };
