import { cn } from '@/lib/utils';
import {
	Select as ShadcnSelect,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

export function Select({
	className = '',
	value,
	onChange,
	placeholder,
	children,
	disabled,
	id,
	'aria-label': ariaLabel,
	...props
}: {
	className?: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	children: React.ReactNode;
	disabled?: boolean;
	id?: string;
	'aria-label'?: string;
}) {
	return (
		<ShadcnSelect value={value} onValueChange={onChange} disabled={disabled} {...props}>
			<SelectTrigger
				id={id}
				aria-label={ariaLabel}
				className={cn(
					'rounded-control min-h-11 w-full min-w-0 border border-[rgba(var(--vs-text),0.12)] bg-[rgb(var(--vs-background))] px-3 py-2 text-base text-[rgb(var(--vs-text))] transition-[background-color,border-color,box-shadow] outline-none md:text-sm',
					'focus:border-[rgba(var(--vs-primary),0.7)] focus-visible:ring-[3px] focus-visible:ring-[rgba(var(--vs-primary),0.24)]',
					className,
				)}
			>
				<SelectValue placeholder={placeholder} />
			</SelectTrigger>
			<SelectContent
				position='popper'
				align='start'
				sideOffset={6}
				className='rounded-popover bg-sheen-surface shadow-overlay max-h-[min(20rem,var(--radix-select-content-available-height))] w-[var(--radix-select-trigger-width)] border-0 bg-[rgb(var(--vs-background))] text-[rgb(var(--vs-text))]'
			>
				<SelectGroup className='flex flex-col gap-0.5'>{children}</SelectGroup>
			</SelectContent>
		</ShadcnSelect>
	);
}

export function SelectOption({ value, children }: { value: string; children: React.ReactNode }) {
	return (
		<SelectItem
			value={value}
			className='tone-neutral focus:bg-sheen-soft focus:shadow-soft min-h-9 cursor-pointer py-2 pr-9 pl-3 transition-[background-color,box-shadow,color] duration-100 focus:bg-[rgba(var(--vs-text),0.07)] focus:text-[rgb(var(--vs-text))] data-[state=checked]:font-semibold [&_svg]:!text-[rgb(var(--vs-primary))]'
		>
			{children}
		</SelectItem>
	);
}
