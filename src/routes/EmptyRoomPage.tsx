import { Link } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert } from '../components/ui-kit/Alert';
import { Button } from '../components/ui-kit/Button';
import { Card } from '../components/ui-kit/Card';
import { CardTitle } from '../components/ui-kit/CardTitle';
import { Dialog } from '../components/ui-kit/Dialog';
import { EmptyRoomSkeleton } from '../components/ui-kit/PageSkeletons';
import { useApp } from '../state/AppContext';
import type { Course } from '../types/course';
import { errorMessage } from '../lib/error';
import { cn } from '@/lib/utils';

const timetableSlots = ['1', '2', '3', '4', 'N', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D'];
const dateEng2zh = {
	sun: '週日',
	mon: '週一',
	tue: '週二',
	wed: '週三',
	thu: '週四',
	fri: '週五',
	sat: '週六',
};

export function EmptyRoomPage() {
	const { dataset, getCourses } = useApp();
	const [courses, setCourses] = useState<Course[] | null>(null);
	const [onError, setOnError] = useState<unknown>(null);
	const [todayDayOfWeek, setTodayDayOfWeek] = useState(
		Object.keys(dateEng2zh)[new Date().getDay()],
	);
	const [emptyroomDetailRoomName, setEmptyroomDetailRoomName] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		setCourses(null);
		setOnError(null);
		setEmptyroomDetailRoomName(null);
		Promise.all([
			getCourses({
				year: dataset.year,
				sem: dataset.sem,
				department: '研究所(日間部、進修部、週末碩士班)',
			}),
			getCourses({ year: dataset.year, sem: dataset.sem, department: '進修部' }),
			getCourses({ year: dataset.year, sem: dataset.sem, department: 'main' }),
		])
			.then((data) => {
				if (cancelled) return;
				setCourses(data.flat());
			})
			.catch((error) => {
				if (!cancelled) {
					setOnError(error);
					setCourses([]);
				}
			});
		return () => {
			cancelled = true;
		};
	}, [dataset.year, dataset.sem, getCourses]);

	const { categoryList, roomList } = useMemo(() => {
		const result: { categoryList: string[]; roomList: EmptyRoom[] } = {
			categoryList: [],
			roomList: [],
		};
		if (!courses) return result;

		const roomMap = new Map<string, EmptyRoom>();
		const categorySet = new Set<string>();
		const courseMap = new Map<string, Course>();

		for (const course of courses) {
			if (!courseMap.has(course.id)) courseMap.set(course.id, course);
		}

		for (const course of courseMap.values()) {
			for (const classroom of course.classroom || []) {
				if (!classroom?.name) continue;
				const category = classroom.name.match(/^(\D.)/)?.[1] || classroom.name.slice(0, 2);
				categorySet.add(category);
				if (!roomMap.has(classroom.name)) {
					roomMap.set(classroom.name, {
						name: classroom.name,
						category,
						timetable: [...timetableSlots],
						link: classroom.link || '',
						coursesBySlot: Object.fromEntries(timetableSlots.map((slot) => [slot, []])) as Record<
							string,
							EmptyRoomCourse[]
						>,
					});
				}
			}
		}

		for (const course of courseMap.values()) {
			for (const classroom of course.classroom || []) {
				const room = roomMap.get(classroom.name);
				if (!room) continue;
				const occupiedSlots = course.time?.[todayDayOfWeek] || [];
				const courseItem = {
					id: course.id,
					name: course.name?.zh || course.name?.en || course.id,
				};
				if (classroom.link && !resolveRoomSourceUrl(room.link)) room.link = classroom.link;
				for (const slot of occupiedSlots) {
					const slotCourses = room.coursesBySlot[String(slot)];
					if (!slotCourses || slotCourses.some((item) => item.id === courseItem.id)) continue;
					slotCourses.push(courseItem);
				}
			}
		}

		result.categoryList = [...categorySet].sort();
		result.roomList = [...roomMap.values()]
			.map((room) => ({
				...room,
				timetable: timetableSlots.filter((slot) => room.coursesBySlot[slot].length === 0),
			}))
			.sort((a, b) => a.name.localeCompare(b.name));
		return result;
	}, [courses, todayDayOfWeek]);
	const emptyroomDetailData = useMemo(
		() =>
			emptyroomDetailRoomName
				? roomList.find((room) => room.name === emptyroomDetailRoomName) || null
				: null,
		[emptyroomDetailRoomName, roomList],
	);
	const emptyroomDetailDialog = Boolean(emptyroomDetailData);

	if (!courses) return <EmptyRoomSkeleton />;

	return (
		<div className='space-y-4'>
			{onError ? (
				<Alert danger>
					<strong>擷取資料時發生了錯誤</strong>
					<br />
					<pre>{errorMessage(onError)}</pre>
				</Alert>
			) : null}
			<Alert>請注意，此功能僅能列出表定無課程進行的教室，教室可能因其他因素，致無法使用。</Alert>
			<h1>尋找空教室</h1>
			<div
				className='flex flex-wrap items-center justify-center gap-1 py-3'
				role='group'
				aria-label='選擇星期'
			>
				{Object.entries(dateEng2zh).map(([en, zh]) => (
					<Button
						key={en}
						active={todayDayOfWeek === en}
						aria-label={zh}
						aria-pressed={todayDayOfWeek === en}
						className='m-0'
						onClick={() => setTodayDayOfWeek(en)}
					>
						{zh.slice(1)}
					</Button>
				))}
			</div>
			<div
				className='flex flex-wrap items-center gap-x-4 gap-y-2 text-sm opacity-80'
				role='group'
				aria-label='節次狀態圖例'
			>
				<div className='flex items-center gap-2'>
					<span
						aria-hidden='true'
						className='size-3 rounded-full border border-dashed border-slate-500 bg-white'
					/>
					<span>空堂</span>
				</div>
				<div className='flex items-center gap-2'>
					<span aria-hidden='true' className='size-3 rounded-full bg-[rgb(var(--vs-danger))]' />
					<span>有課程</span>
				</div>
			</div>
			<div className='space-y-4'>
				{categoryList.map((category) => (
					<section key={category}>
						<h2>{category}</h2>
						<div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
							{roomList
								.filter((room) => room.category === category)
								.map((room) => (
									<Card
										key={room.name}
										className='hoverable px-4 py-3'
										role='button'
										tabIndex={0}
										aria-haspopup='dialog'
										aria-label={`查看「${room.name}」詳細上課資訊`}
										aria-describedby={`empty-room-status-${encodeURIComponent(room.name)}`}
										onClick={() => {
											setEmptyroomDetailRoomName(room.name);
										}}
										onKeyDown={(event) => {
											if (event.key !== 'Enter' && event.key !== ' ') return;
											event.preventDefault();
											setEmptyroomDetailRoomName(room.name);
										}}
									>
										<CardTitle>{room.name}</CardTitle>
										<div className='mt-2 flex flex-wrap gap-1'>
											{timetableSlots.map((slot) => (
												<div
													key={slot}
													role='img'
													aria-label={`${slot}，${room.timetable.includes(slot) ? '空堂' : '有課程'}`}
													className={cn(
														'flex size-5 items-center justify-center rounded-full border text-xs',
														room.timetable.includes(slot)
															? 'border-dashed border-slate-500 bg-white text-slate-700'
															: 'border-transparent bg-[rgb(var(--vs-danger))] text-[rgb(var(--vs-primary-foreground))]',
													)}
												>
													<span aria-hidden='true'>{slot}</span>
												</div>
											))}
										</div>
										<span
											id={`empty-room-status-${encodeURIComponent(room.name)}`}
											className='sr-only'
										>
											{timetableSlots
												.map(
													(slot) => `${slot} ${room.timetable.includes(slot) ? '空堂' : '有課程'}`,
												)
												.join('、')}
										</span>
									</Card>
								))}
						</div>
					</section>
				))}
			</div>
			<Dialog
				open={emptyroomDetailDialog}
				title={emptyroomDetailData ? `「${emptyroomDetailData.name}」詳細上課資訊` : '詳細上課資訊'}
				onClose={() => setEmptyroomDetailRoomName(null)}
				footer={
					resolveRoomSourceUrl(emptyroomDetailData?.link) ? (
						<a
							href={resolveRoomSourceUrl(emptyroomDetailData?.link) || undefined}
							target='_blank'
							rel='noreferrer'
							className='text-sm underline underline-offset-2 opacity-65 hover:opacity-100'
						>
							學校原始資料
						</a>
					) : null
				}
			>
				{emptyroomDetailData ? (
					<div className='rounded-panel overflow-hidden border border-[rgba(var(--vs-text),0.1)]'>
						{timetableSlots.map((slot, index) => (
							<div
								key={slot}
								className={`flex items-center justify-between gap-4 bg-[rgb(var(--vs-background))] px-3 py-2 ${index > 0 ? 'border-t border-[rgba(var(--vs-text),0.1)]' : ''}`}
							>
								<div>
									{slot} - {slotToTime(slot)}
								</div>
								{emptyroomDetailData.coursesBySlot[slot].length ? (
									<ul className='grid gap-1 text-right'>
										{emptyroomDetailData.coursesBySlot[slot].map((course) => (
											<li key={course.id}>
												<Link
													to={`/course/${dataset.year}/${dataset.sem}/${course.id}`}
													className='text-[rgb(var(--vs-primary))] underline underline-offset-2'
												>
													{course.name}
												</Link>
											</li>
										))}
									</ul>
								) : (
									<div>空堂</div>
								)}
							</div>
						))}
					</div>
				) : null}
			</Dialog>
		</div>
	);
}

export function resolveRoomSourceUrl(link?: string) {
	const value = link?.trim();
	if (!value) return null;
	try {
		const url = new URL(value, 'https://aps.ntut.edu.tw/course/tw/');
		return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
	} catch {
		return null;
	}
}

function slotToTime(slot) {
	const timetable = {
		'1': '8:10',
		'2': '9:10',
		'3': '10:10',
		'4': '11:10',
		N: '12:10',
		'5': '13:10',
		'6': '14:10',
		'7': '15:10',
		'8': '16:10',
		'9': '17:10',
		A: '18:30',
		B: '19:20',
		C: '20:20',
		D: '21:10',
	};
	return timetable[slot];
}
type EmptyRoom = {
	name: string;
	category: string;
	timetable: string[];
	link: string;
	coursesBySlot: Record<string, EmptyRoomCourse[]>;
};

type EmptyRoomCourse = {
	id: string;
	name: string;
};
