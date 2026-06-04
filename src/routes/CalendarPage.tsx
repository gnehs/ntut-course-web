import { useEffect, useMemo, useState } from 'react';
import { Check, Filter } from 'lucide-react';
import { Button } from '../components/ui-kit/Button';
import { Card } from '../components/ui-kit/Card';
import { CardTitle } from '../components/ui-kit/CardTitle';
import { CalendarSkeleton } from '../components/ui-kit/PageSkeletons';
import { fetchCalendar } from '../lib/courseApi';
import type { CalendarEvent } from '../types/course';

export function CalendarPage() {
	const [calendar, setCalendar] = useState<CalendarEvent[] | null>(null);
	const [important, setImportant] = useState(false);
	useEffect(() => {
		let cancelled = false;
		fetchCalendar()
			.then((data) => !cancelled && setCalendar(data))
			.catch(() => !cancelled && setCalendar([]));
		return () => {
			cancelled = true;
		};
	}, []);
	const rows = useMemo(() => {
		const todayFloor = new Date();
		todayFloor.setDate(todayFloor.getDate() - 1);
		const data = (calendar || [])
			.filter((item) => calendarDate(item.start) > todayFloor)
			.sort((a, b) => calendarDate(a.start).getTime() - calendarDate(b.start).getTime());
		return important
			? data.filter((item) =>
					item.summary?.match(
						/補假|加選|開學|會考|撤選|校慶|期中|期末考|網路教學評量|全校週會|選課|放假/,
					),
				)
			: data;
	}, [calendar, important]);
	if (!calendar) return <CalendarSkeleton />;
	return (
		<div>
			<div className='flex flex-wrap items-center justify-between gap-2'>
				<h1 className='m-0'>行事曆</h1>
				<Button active={important} className='m-0' onClick={() => setImportant((value) => !value)}>
					{important ? <Check className='size-4' /> : <Filter className='size-4' />}
					僅顯示重要日程
				</Button>
			</div>
			<div className='mt-4 overflow-hidden rounded-[4px] border border-[rgba(var(--vs-text),0.1)]'>
				{rows.map((item, index) => (
					<div
						key={item.uid || `${item.summary}-${index}`}
						className={`flex items-center gap-2 bg-[rgb(var(--vs-background))] p-2.5 ${index > 0 ? 'border-t border-[rgba(var(--vs-text),0.1)]' : ''}`}
					>
						<div
							className='flex size-12 shrink-0 flex-col overflow-hidden rounded-lg bg-gradient-to-b from-white to-[rgba(var(--vs-text),0.04)] text-center shadow-md'
							style={{
								opacity: index > 0 && sameCalendarDay(rows[index - 1]?.start, item.start) ? 0 : 1,
							}}
						>
							<div className='flex h-5 w-full items-center justify-center bg-gradient-to-b from-[rgb(255,124,124)] to-[rgb(220,62,63)] text-[10px] leading-none font-semibold text-white'>
								{calendarDate(item.start).getMonth() + 1} 月
							</div>
							<div className='flex flex-1 items-center justify-center text-xl leading-none font-semibold text-[rgb(var(--vs-text))]'>
								{calendarDate(item.start).getDate()}
							</div>
						</div>
						<div className='min-w-0 flex-1'>
							<div className='text-[1.2em] font-semibold'>{item.summary}</div>
							<div className='opacity-75'>
								{calendarDate(item.start).toLocaleDateString()} ~{' '}
								{calendarDate(item.end).toLocaleDateString()}
							</div>
						</div>
					</div>
				))}
			</div>
			<div className='my-4 text-center text-[0.75em] opacity-75'>
				資料來源：
				<a
					href='https://calendar.google.com/calendar/embed?src=docfuhim9b22fqvp2tk842ak3c%40group.calendar.google.com&ctz=Asia%2FTaipei'
					target='_blank'
					rel='noreferrer'
				>
					教務處行事曆－學生版
				</a>
			</div>
		</div>
	);
}

function calendarDate(value) {
	const raw = value?.date || value?.dateTime || value;
	const match = String(raw || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
	return new Date(raw);
}

function sameCalendarDay(a, b) {
	const left = calendarDate(a);
	const right = calendarDate(b);
	return left.toDateString() === right.toDateString();
}
