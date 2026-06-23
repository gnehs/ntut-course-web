import { Link } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, Download, RefreshCw, Search } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Button } from '../components/ui-kit/Button';
import { StepsPageSkeleton } from '../components/ui-kit/PageSkeletons';
import { fetchCalendar } from '../lib/courseApi';
import { buildCourseCalendar, trimEllip } from '../lib/courseUtils';
import { useApp } from '../state/AppContext';
import type { CalendarCourse, CalendarEvent } from '../types/course';

export function AddCalendarPage() {
	const { dataset, getCourses, getMyCourseIds } = useApp();
	const [courses, setCourses] = useState<CalendarCourse[] | null>(null);
	const [start, setStart] = useState('');
	const [until, setUntil] = useState('');
	const [selectedIds, setSelectedIds] = useState<string[]>([]);

	useEffect(() => {
		let cancelled = false;
		async function load() {
			const calendar = await fetchCalendar().catch(() => []);
			const startDate = resolveStartDate(calendar, dataset.year, dataset.sem);
			const endDate = resolveEndDate(calendar, dataset.year, dataset.sem);
			if (!cancelled) {
				setStart(startDate);
				setUntil(endDate);
			}

			const allCourses = await getCourses();
			const ids = getMyCourseIds();
			const myCourses = allCourses.filter((course) => ids.includes(course.id));
			const origin = globalThis.location?.origin || 'https://ntut-course.gnehs.net';
			if (!cancelled) {
				setCourses(
					myCourses.map((course) => ({
						id: course.id,
						courseType: course.courseType,
						name: course.name?.zh || '',
						description: course.description?.zh || '',
						time: course.time,
						teacher: trimEllip((course.teacher || []).map((item) => item.name).join('、'), 13),
						classroom: trimEllip((course.classroom || []).map((item) => item.name).join('、'), 13),
						link: `${origin}/course/${dataset.year}/${dataset.sem}/${course.id}`,
					})),
				);
				setSelectedIds(myCourses.map((course) => course.id));
			}
		}
		load().catch(() => setCourses([]));
		return () => {
			cancelled = true;
		};
	}, [dataset.year, dataset.sem, dataset.department]);

	const selectedCourses = useMemo(
		() => (courses || []).filter((course) => selectedIds.includes(course.id)),
		[courses, selectedIds],
	);

	function downloadIcs() {
		try {
			window.gtag?.('event', 'download_calendar', {
				event_category: 'calendar',
				event_label: 'download_calendar',
				value: selectedCourses.length,
			});
		} catch {}
		const ics = buildCourseCalendar({
			courses: selectedCourses,
			startDate: start,
			untilDate: until,
			year: dataset.year,
			sem: dataset.sem,
		});
		const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
		const a = document.createElement('a');
		a.href = url;
		a.download = `${dataset.year}-${dataset.sem}-course.ics`;
		a.click();
		URL.revokeObjectURL(url);
	}

	if (!courses) return <StepsPageSkeleton />;
	const hasCourses = courses.length > 0;
	return (
		<div className='flex flex-col gap-5'>
			<section className='flex flex-col gap-4'>
				<h1 className='text-3xl font-semibold tracking-normal'>新增到行事曆</h1>
				<p className='max-w-2xl text-[rgb(var(--vs-text))]/75'>
					選擇課程和日期區間，下載 ICS 後匯入你慣用的行事曆。
				</p>
			</section>
			<Alert>
				<RefreshCw />
				<AlertTitle>課表變更後要重新匯入</AlertTitle>
				<AlertDescription>
					下載的 ICS 是一次性檔案；加退選或修改課程後，請重新下載並匯入新的行事曆檔案。
				</AlertDescription>
			</Alert>
			{!hasCourses ? (
				<Alert>
					<AlertCircle />
					<AlertTitle>先新增課程</AlertTitle>
					<AlertDescription>
						行事曆檔案會從「我的課程」產生；先從搜尋或班級課表加入課程後，再回來下載 ICS。
						<div className='mt-3 flex flex-wrap gap-2'>
							<Button
								as={Link}
								primary
								to={`/advanced-search?year=${dataset.year}&sem=${dataset.sem}&d=${dataset.department}`}
							>
								<Search className='size-4' data-icon='inline-start' />
								前往搜尋
							</Button>
							<Button as={Link} to='/class'>
								<Clock className='size-4' data-icon='inline-start' />
								班級課表
							</Button>
						</div>
					</AlertDescription>
				</Alert>
			) : null}
			<Card className='rounded-lg border border-[rgba(var(--vs-text),0.1)] bg-[rgb(var(--vs-background))] shadow-sm'>
				<CardHeader className='p-4 sm:px-5'>
					<div className='flex flex-wrap items-start justify-between gap-3'>
						<div className='flex min-w-0 flex-col gap-2'>
							<CardTitle className='text-base font-semibold'>1. 選擇要加入的課程</CardTitle>
						</div>
						<Badge variant='outline'>
							<CheckCircle2 data-icon='inline-start' />
							{selectedCourses.length} / {courses.length}
						</Badge>
					</div>
				</CardHeader>
				<CardContent className='p-4 pt-0 sm:px-5'>
					{hasCourses ? (
						<div className='grid gap-2 md:grid-cols-2'>
							{courses.map((course) => {
								const checked = selectedIds.includes(course.id);
								return (
									<label
										key={course.id}
										htmlFor={`calendar-course-${course.id}`}
										className='flex min-w-0 cursor-pointer items-center gap-3 rounded-lg border border-[rgba(var(--vs-text),0.1)] bg-[rgb(var(--vs-gray-1))] p-3 transition-colors hover:bg-[rgba(var(--vs-primary),0.06)]'
									>
										<Checkbox
											id={`calendar-course-${course.id}`}
											checked={checked}
											onCheckedChange={(value) =>
												setSelectedIds((ids) =>
													value === true
														? ids.includes(course.id)
															? ids
															: [...ids, course.id]
														: ids.filter((id) => id !== course.id),
												)
											}
										/>
										<span className='min-w-0 flex-1'>
											<span className='block truncate font-medium'>{course.name}</span>
											<span className='mt-1 block truncate text-sm text-[rgb(var(--vs-text))]/65'>
												{[course.teacher, course.classroom].filter(Boolean).join(' · ') ||
													'課程資料'}
											</span>
										</span>
									</label>
								);
							})}
						</div>
					) : (
						<div className='rounded-lg border border-dashed border-[rgba(var(--vs-text),0.16)] bg-[rgb(var(--vs-gray-1))] p-4 text-sm text-[rgb(var(--vs-text))]/65'>
							加入課程後，這裡會列出可匯入行事曆的課程。
						</div>
					)}
				</CardContent>
			</Card>
			<Card
				className={`rounded-lg border border-[rgba(var(--vs-text),0.1)] bg-[rgb(var(--vs-background))] shadow-sm ${!hasCourses ? 'opacity-70' : ''}`}
			>
				<CardHeader className='p-4 sm:px-5'>
					<CardTitle className='text-base font-semibold'>2. 確認日期並下載</CardTitle>
					<CardDescription>
						{hasCourses
							? '通常會自動填上開學日與最後上課日；若學校行事曆有異動可手動修改。'
							: '目前沒有課程資料，下載功能已停用。'}
					</CardDescription>
				</CardHeader>
				<CardContent className='grid gap-4 p-4 pt-0 sm:grid-cols-2 sm:px-5'>
					<label className='flex flex-col gap-2'>
						<span className='text-sm font-medium'>開學日</span>
						<Input
							type='date'
							value={start}
							disabled={!hasCourses}
							onChange={(event) => setStart(event.target.value)}
						/>
					</label>
					<label className='flex flex-col gap-2'>
						<span className='text-sm font-medium'>最後上課日</span>
						<Input
							type='date'
							value={until}
							disabled={!hasCourses}
							onChange={(event) => setUntil(event.target.value)}
						/>
					</label>
				</CardContent>
				<Separator className='bg-[rgba(var(--vs-text),0.08)]' />
				<CardContent className='flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5'>
					<div className='text-sm text-[rgb(var(--vs-text))]/70'>
						{hasCourses
							? `將下載 \`${dataset.year}-${dataset.sem}-course.ics\`，內含 ${selectedCourses.length} 門課程。`
							: '尚未有課程可下載。'}
					</div>
					<Button active disabled={!selectedCourses.length || !hasCourses} onClick={downloadIcs}>
						<Download className='size-4' data-icon='inline-start' />
						下載 ICS
					</Button>
				</CardContent>
			</Card>
			<Alert>
				<AlertCircle />
				<AlertTitle>已知問題</AlertTitle>
				<AlertDescription>
					目前尚未撰寫跳過連假的功能，因此遇到連假時行事曆上仍會有課程。
				</AlertDescription>
			</Alert>
		</div>
	);
}

export function resolveStartDate(calendar: CalendarEvent[], rocYear: string, sem: string) {
	const window = semesterWindow(rocYear, sem);
	const startDay = calendar
		.filter((item) => isInsideSemesterWindow(item, window))
		.filter((item) => /開學|正式上課|開始上課/.test(item.summary || ''))
		.sort((a, b) => calendarDate(a.start).getTime() - calendarDate(b.start).getTime())[0];
	return startDay ? calendarIsoDate(startDay.start) : isoDate(window.fallbackStart);
}

export function resolveEndDate(calendar: CalendarEvent[], rocYear: string, sem: string) {
	const window = semesterWindow(rocYear, sem);
	const finalExam = calendar
		.filter((item) => isInsideSemesterWindow(item, window))
		.filter((item) => item.summary?.includes('期末考試'))
		.sort((a, b) => calendarDate(a.start).getTime() - calendarDate(b.start).getTime())[0];
	if (!finalExam) return isoDate(window.fallbackEnd);

	const finalExamStart = calendarDate(finalExam.start);
	finalExamStart.setDate(finalExamStart.getDate() - 1);
	return isoDate(finalExamStart);
}

function semesterWindow(rocYear: string, sem: string) {
	let year = Number(rocYear) + 1911;
	if (sem === '2') year += 1;
	if (sem === '1') {
		return {
			start: new Date(year, 7, 1),
			end: new Date(year + 1, 1, 15),
			fallbackStart: new Date(year, 7, 2),
			fallbackEnd: new Date(year + 1, 0, 31),
		};
	}
	return {
		start: new Date(year, 0, 1),
		end: new Date(year, 6, 15),
		fallbackStart: new Date(year, 0, 2),
		fallbackEnd: new Date(year, 5, 30),
	};
}

function isInsideSemesterWindow(item: CalendarEvent, window: ReturnType<typeof semesterWindow>) {
	const start = calendarDate(item.start);
	return start >= window.start && start <= window.end;
}

function calendarDate(value: string) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return new Date(value);
	return date;
}

function calendarIsoDate(value: string) {
	return isoDate(calendarDate(value));
}

function isoDate(date: Date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}
