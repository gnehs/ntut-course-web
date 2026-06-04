import { cn } from '../lib/utils';
import { dateEng2zh, timetable as defaultTimetable } from '../lib/courseUtils';
import { Check, X } from 'lucide-react';
import type React from 'react';

const defaultDays = ['mon', 'tue', 'wed', 'thu', 'fri'];

export function TimetableSelector({
	value,
	onToggle,
	slots = defaultTimetable,
	days = defaultDays,
	className = '',
}) {
	return (
		<div
			className={cn(
				'overflow-hidden rounded-lg border border-[rgba(var(--vs-text),0.1)] bg-[rgba(var(--vs-text),0.03)]',
				className,
			)}
		>
			<div className='grid grid-cols-[42px_repeat(5,minmax(0,1fr))]'>
				<SelectorButton onClick={() => onToggle()} />
				{days.map((day) => (
					<SelectorButton key={day} onClick={() => onToggle(day)}>
						{dateEng2zh[day].slice(1)}
					</SelectorButton>
				))}
				{slots.map((slot) => (
					<TimetableRow
						key={slot}
						dayKeys={days}
						onToggle={onToggle}
						selected={value}
						slot={slot}
					/>
				))}
			</div>
		</div>
	);
}

function TimetableRow({ slot, dayKeys, selected, onToggle }) {
	return (
		<>
			<SelectorButton onClick={() => onToggle(null, slot)}>{slot}</SelectorButton>
			{dayKeys.map((day) => {
				const active = selected[day]?.includes(slot);
				return (
					<div
						key={`${day}-${slot}`}
						className='border-t border-l border-[rgba(var(--vs-text),0.08)] first:border-l-0'
					>
						<button
							type='button'
							aria-pressed={active}
							onClick={() => onToggle(day, slot)}
							className={cn(
								'flex h-full min-h-[52px] w-full items-center justify-center px-2 py-2 text-2xl transition-colors',
								active
									? 'bg-[rgba(var(--vs-danger),0.18)] text-[rgb(var(--vs-danger))]'
									: 'bg-[rgba(var(--vs-primary),0.15)] text-[rgba(var(--vs-text),0.9)] hover:bg-[rgba(var(--vs-primary),0.22)]',
							)}
						>
							{active ? <X className='size-4' /> : <Check className='size-4' />}
						</button>
					</div>
				);
			})}
		</>
	);
}

function SelectorButton({
	children,
	className = '',
	...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<button
			type='button'
			className={cn(
				'flex min-h-[52px] items-center justify-center border-t border-l border-[rgba(var(--vs-text),0.08)] bg-[rgba(var(--vs-text),0.04)] text-sm font-medium text-[rgb(var(--vs-text))] transition-colors hover:bg-[rgba(var(--vs-text),0.08)]',
				className,
			)}
			{...props}
		>
			{children}
		</button>
	);
}
