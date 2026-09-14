import { useEffect, useMemo, useState } from 'react';
import { Check, Filter } from 'lucide-react';
import { Alert } from '../components/ui-kit/Alert';
import { Button } from '../components/ui-kit/Button';
import { CalendarSkeleton } from '../components/ui-kit/PageSkeletons';
import { fetchCalendar } from '../lib/courseApi';
import { errorMessage } from '../lib/error';
import type { CalendarEvent } from '../types/course';

export function CalendarPage() {
	const [calendar, setCalendar] = useState<CalendarEvent[] | null>(null);
	const [loadError, setLoadError] = useState<unknown>(null);
	const [important, setImportant] = useState(false);
	const [version, setVersion] = useState(0);
	useEffect(() => {
		let cancelled = false;
		setCalendar(null);
		setLoadError(null);
		async function load() {
			try {
				const data = await fetchCalendar();
				if (!cancelled) setCalendar(data);
			} catch (error) {
				if (!cancelled) {
					setLoadError(error);
					setCalendar(null);
				}
			}
		}
		load();
		return () => {
			cancelled = true;
		};
	}, [version]);
	const upcomingRows = useMemo(() => {
		const todayFloor = new Date();
		todayFloor.setDate(todayFloor.getDate() - 1);
		return [...(calendar || [])]
			.filter((item) => calendarDate(item.start) > todayFloor)
			.sort((a, b) => calendarDate(a.start).getTime() - calendarDate(b.start).getTime());
	}, [calendar]);
	const rows = useMemo(
		() =>
			important
				? upcomingRows.filter((item) =>
						item.summary?.match(
							/補假|加選|開學|會考|撤選|校慶|期中|期末考|網路教學評量|全校週會|選課|放假/,
						),
					)
				: upcomingRows,
		[important, upcomingRows],
	);
	if (loadError) {
		return (
			<div>
				<div className='flex flex-wrap items-center justify-between gap-2'>
					<h1 className='m-0'>行事曆</h1>
				</div>
				<Alert danger className='mt-4'>
					<strong>行事曆資料載入失敗</strong>
					<p className='mt-1 mb-0'>暫時無法取得行事曆資料，請稍後再試。</p>
					<p className='mt-1 mb-0 text-sm opacity-75'>{errorMessage(loadError)}</p>
					<div className='mt-3'>
						<Button primary onClick={() => setVersion((value) => value + 1)}>
							重新載入
						</Button>
					</div>
				</Alert>
				<CalendarSource />
			</div>
		);
	}
	if (!calendar) return <CalendarSkeleton />;
	return (
		<div>
			<div className='flex flex-wrap items-center justify-between gap-2'>
				<h1 className='m-0'>行事曆</h1>
				<Button
					active={important}
					aria-pressed={important}
					className='m-0'
					onClick={() => setImportant((value) => !value)}
				>
					{important ? <Check className='size-4' /> : <Filter className='size-4' />}
					僅顯示重要日程
				</Button>
			</div>
			<div className='rounded-surface mt-4 overflow-hidden border border-[rgba(var(--vs-text),0.1)]'>
				{rows.length ? (
					rows.map((item, index) => (
						<div
							key={item.uid || `${item.summary}-${index}`}
							className={`flex items-center gap-2 bg-[rgb(var(--vs-background))] p-2.5 ${index > 0 ? 'border-t border-[rgba(var(--vs-text),0.1)]' : ''}`}
						>
							<div
								className='rounded-control flex size-12 shrink-0 flex-col overflow-hidden bg-gradient-to-b from-white to-[rgba(var(--vs-text),0.04)] text-center shadow-md'
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
					))
				) : (
					<Alert className='m-3'>
						<strong>
							{important && upcomingRows.length
								? '目前沒有符合的重要日程'
								: calendar.length
									? '目前沒有即將到來的日程'
									: '目前沒有行事曆資料'}
						</strong>
						<p className='mt-1 mb-0'>
							{important && upcomingRows.length
								? '可以關閉篩選，查看全部即將到來的日程。'
								: calendar.length
									? '目前沒有可顯示的近期校務日程。'
									: '請稍後再回來查看最新校務日程。'}
						</p>
						{important && upcomingRows.length ? (
							<div className='mt-3'>
								<Button onClick={() => setImportant(false)}>顯示全部日程</Button>
							</div>
						) : null}
					</Alert>
				)}
			</div>
			<CalendarSource />
		</div>
	);
}

function CalendarSource() {
	return (
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
