import * as React from 'react';
import { CheckIcon } from 'lucide-react';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';

import { cn } from '@/lib/utils';

function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
	return (
		<CheckboxPrimitive.Root
			data-slot='checkbox'
			className={cn(
				'peer size-4 shrink-0 rounded-[4px] border border-[rgba(var(--vs-text),0.18)] bg-[rgb(var(--vs-background))] text-white transition-colors outline-none focus-visible:border-[rgba(var(--vs-primary),0.75)] focus-visible:ring-[3px] focus-visible:ring-[rgba(var(--vs-primary),0.18)] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-[rgb(var(--vs-primary))] data-[state=checked]:bg-[rgb(var(--vs-primary))]',
				className,
			)}
			{...props}
		>
			<CheckboxPrimitive.Indicator
				data-slot='checkbox-indicator'
				className='grid place-content-center text-current transition-none'
			>
				<CheckIcon className='size-3.5' />
			</CheckboxPrimitive.Indicator>
		</CheckboxPrimitive.Root>
	);
}

export { Checkbox };
