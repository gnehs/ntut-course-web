import { cn } from '@/lib/utils';
import {
	Select as ShadcnSelect,
	SelectContent,
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
	...props
}: {
	className?: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	children: React.ReactNode;
	disabled?: boolean;
}) {
	return (
		<ShadcnSelect value={value} onValueChange={onChange} disabled={disabled} {...props}>
			<SelectTrigger
				className={cn(
					'min-h-11 w-full min-w-0 rounded-lg border border-[rgba(var(--vs-text),0.12)] bg-[rgb(var(--vs-background))] px-3 py-2 text-[rgb(var(--vs-text))] transition-colors outline-none',
					'focus:border-[rgba(var(--vs-primary),0.7)] focus-visible:ring-[3px] focus-visible:ring-[rgba(var(--vs-primary),0.24)]',
					className,
				)}
			>
				<SelectValue placeholder={placeholder} />
			</SelectTrigger>
			<SelectContent className='rounded-lg border border-[rgba(var(--vs-text),0.12)] bg-[rgb(var(--vs-background))] text-[rgb(var(--vs-text))]'>
				{children}
			</SelectContent>
		</ShadcnSelect>
	);
}

export function SelectOption({ value, children }: { value: string; children: React.ReactNode }) {
	return (
		<SelectItem
			value={value}
			className='cursor-pointer hover:bg-[rgba(var(--vs-primary),0.08)] focus:bg-[rgba(var(--vs-primary),0.08)]'
		>
			{children}
		</SelectItem>
	);
}
