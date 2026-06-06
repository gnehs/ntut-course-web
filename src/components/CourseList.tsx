import { Link } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import type React from 'react';
import { CircleAlert, Clock, Minus, PanelTop, Plus, Table } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import {
	courseTitle,
	dateEng2zh,
	getCourseDisplayTitle,
	getGeneralCourseTags,
	getSportsCourseTitle,
	isSportsCourse,
	parseCourseTime,
	timetable,
	trimEllip,
} from '../lib/courseUtils';
import { useApp } from '../state/AppContext';
import { Button } from './ui-kit/Button';
import { Card } from './ui-kit/Card';
import { CardTitle } from './ui-kit/CardTitle';
import { Pagination } from './ui-kit/Pagination';
import { Tag } from './ui-kit/Tag';
import type { Course } from '../types/course';
import { SportsCourseIcon } from './SportsCourseIcon';

const PAGE_SIZE = 54;

type CourseListProps = {
	courses: Course[] | null;
	showTimetable?: boolean;
	showConflictCourse?: boolean;
	year?: string;
	sem?: string;
};

type TimetableCourseItem = Course & {
	date: string;
	slots: string[];
	startSlot: string;
	endSlot: string;
	startIndex: number;
	endIndex: number;
	isConflict: boolean;
	laneIndex: number;
	laneCount: number;
};

export function CourseList({
	courses,
	showTimetable = false,
	showConflictCourse = true,
	year,
	sem,
}: CourseListProps) {
	const { dataset, getCourses, getMyCourseIds, addCourse, removeCourse } = useApp();
	const [layout, setLayout] = useState('card');
	const [page, setPage] = useState(1);
	const [savedVersion, setSavedVersion] = useState(0);
	const [conflictCourseData, setConflictCourseData] = useState<string[]>([]);
	const viewYear = year || dataset.year;
	const viewSem = sem || dataset.sem;
	const savedCourseIds = useMemo(
		() => getMyCourseIds(viewYear, viewSem),
		[getMyCourseIds, viewYear, viewSem, savedVersion],
	);

	useEffect(() => {
		let cancelled = false;
		async function checkConflict() {
			const ids = getMyCourseIds(viewYear, viewSem);
			const myCourses = (await getCourses({ year: viewYear, sem: viewSem })).filter((course) =>
				ids.includes(course.id),
			);
			const conflicts: string[] = [];
			for (const course of courses || []) {
				for (const myCourse of myCourses) {
					if (
						course.id !== myCourse.id &&
						hasConflict(course, myCourse) &&
						!conflicts.includes(course.id)
					)
						conflicts.push(course.id);
				}
			}
			if (!cancelled) setConflictCourseData(conflicts);
		}
		checkConflict().catch(() => setConflictCourseData([]));
		return () => {
			cancelled = true;
		};
	}, [courses, viewYear, viewSem, dataset.department, savedVersion]);

	const filteredCourse = useMemo(() => {
		if (!courses) return [];
		return showConflictCourse
			? courses
			: courses.filter((course) => !conflictCourseData.includes(course.id));
	}, [courses, showConflictCourse, conflictCourseData]);

	const pageCount = Math.max(Math.ceil(filteredCourse.length / PAGE_SIZE), 1);
	const pageItems = filteredCourse.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

	useEffect(() => {
		setPage(1);
	}, [courses, showConflictCourse]);

	useEffect(() => {
		if (page > pageCount) setPage(1);
	}, [page, pageCount]);

	function changeLayout(nextLayout: string) {
		if (nextLayout === layout) return;
		setLayout(nextLayout);
		setPage(1);
	}

	function changePage(nextPage: number) {
		if (nextPage === page) return;
		setPage(nextPage);
		window.scrollTo({ top: 0 });
	}

	function toggleSavedCourse(course: Course) {
		const saved = savedCourseIds.includes(course.id);
		if (saved) {
			removeCourse(course.id, viewYear, viewSem);
			toast.success('已從我的課程移除', {
				description: `${course.id} ${course.name?.zh || '未命名課程'}`,
			});
		} else {
			addCourse(course.id, viewYear, viewSem);
			toast.success('已加入我的課程', {
				description: `${course.id} ${course.name?.zh || '未命名課程'}`,
			});
		}
		setSavedVersion((value) => value + 1);
	}

	if (!courses) return null;

	return (
		<div>
			<div className='flex flex-wrap items-center justify-center gap-1 py-4'>
				<Button active={layout === 'table'} className='m-0' onClick={() => changeLayout('table')}>
					<Table className='size-4' />
					表格
				</Button>
				<Button active={layout === 'card'} className='m-0' onClick={() => changeLayout('card')}>
					<PanelTop className='size-4' />
					卡片
				</Button>
				{showTimetable ? (
					<Button active={layout === 'timetable'} onClick={() => changeLayout('timetable')}>
						<Clock className='size-4' />
						課表
					</Button>
				) : null}
			</div>
			{layout === 'card' ? (
				<>
					<div className='grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-3'>
						{pageItems.map((course) => {
							const saved = savedCourseIds.includes(course.id);
							return (
								<Card
									key={course.id}
									className='hoverable px-4 py-3 transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_10px_20px_0_rgba(0,0,0,var(--vs-shadow-opacity,0.05))] active:translate-y-[5px] active:shadow-none'
								>
									<Link
										to={`/course/${viewYear}/${viewSem}/${course.id}`}
										aria-label={`查看 ${courseTitle(course)} 課程詳情`}
										className='absolute inset-0 z-0 rounded-lg focus-visible:ring-[3px] focus-visible:ring-[rgba(var(--vs-primary),0.28)] focus-visible:outline-none'
									/>
									<div className='pointer-events-none relative z-[1]'>
										<CardTitle spaceBetween>
											<CourseDisplayHeading course={course} />
											<span className='pointer-events-auto flex shrink-0 items-center gap-1'>
												{conflictCourseData.includes(course.id) ? (
													<Tag
														color='rgba(var(--vs-danger),0.15)'
														textColor={`rgb(var(--vs-danger))`}
													>
														<CircleAlert className='size-4' />
														衝堂
													</Tag>
												) : null}
												<Button
													icon
													active={saved}
													className='m-0 size-8'
													aria-label={saved ? '從我的課程移除' : '加入我的課程'}
													onClick={() => toggleSavedCourse(course)}
												>
													{saved ? <Minus className='size-4' /> : <Plus className='size-4' />}
												</Button>
											</span>
										</CardTitle>
										<CourseTags course={course} />
										<div className='mt-2 grid grid-cols-[repeat(auto-fit,minmax(64px,1fr))] gap-2'>
											<Card className='border-0 bg-transparent px-0 py-1 shadow-none'>
												<CardTitle>{course.id}</CardTitle>
												<p>課號</p>
											</Card>
											<Card className='border-0 bg-transparent px-0 py-1 shadow-none'>
												<CardTitle>{course.credit}</CardTitle>
												<p>學分</p>
											</Card>
											{parseCourseTime(course.time).map((item) => (
												<Card
													key={item.title}
													className='border-0 bg-transparent px-0 py-1 shadow-none'
												>
													<CardTitle>{item.content}</CardTitle>
													<p>{item.title}</p>
												</Card>
											))}
											{!parseCourseTime(course.time).length ? (
												<Card className='border-0 bg-transparent px-0 py-1 shadow-none'>
													<CardTitle>無資料</CardTitle>
													<p>上課時間</p>
												</Card>
											) : null}
										</div>
										<p>
											班級：
											{trimEllip((course.class || []).map((item) => item.name).join('、'), 9)}
											<br />
											教師：
											{trimEllip((course.teacher || []).map((item) => item.name).join('、'), 13)}
											<br />
											備註：{trimEllip(course.notes, 15)}
										</p>
									</div>
								</Card>
							);
						})}
					</div>
					{!filteredCourse.length ? (
						<div className='flex items-center justify-center p-5'>
							<p>查無資料</p>
						</div>
					) : null}
					<Pagination page={page} length={pageCount} onChange={changePage} />
				</>
			) : null}
			{layout === 'table' ? (
				<Card className='overflow-hidden p-0'>
					<div className='overflow-x-auto'>
						<table className='w-full border-collapse text-left'>
							<thead>
								<tr>
									<th className='border-b border-[rgba(var(--vs-text),0.08)] px-3 py-2'>課號</th>
									<th className='border-b border-[rgba(var(--vs-text),0.08)] px-3 py-2'>
										課程名稱
									</th>
									<th className='border-b border-[rgba(var(--vs-text),0.08)] px-3 py-2'>教師</th>
									<th className='border-b border-[rgba(var(--vs-text),0.08)] px-3 py-2'>班級</th>
									<th className='border-b border-[rgba(var(--vs-text),0.08)] px-3 py-2'>備註</th>
									<th className='border-b border-[rgba(var(--vs-text),0.08)] px-3 py-2'>
										我的課程
									</th>
								</tr>
							</thead>
							<tbody>
								{pageItems.map((course) => {
									const saved = savedCourseIds.includes(course.id);
									return (
										<tr
											key={course.id}
											className='transition-colors hover:bg-[rgba(var(--vs-text),0.04)]'
										>
											<td className='border-b border-[rgba(var(--vs-text),0.08)] px-3 py-2'>
												{course.id}
											</td>
											<td className='border-b border-[rgba(var(--vs-text),0.08)] px-3 py-2'>
												<Link to={`/course/${viewYear}/${viewSem}/${course.id}`}>
													{courseTitle(course)}
												</Link>
											</td>
											<td className='border-b border-[rgba(var(--vs-text),0.08)] px-3 py-2'>
												{trimEllip((course.teacher || []).map((item) => item.name).join('、'), 9)}
											</td>
											<td className='border-b border-[rgba(var(--vs-text),0.08)] px-3 py-2'>
												{trimEllip((course.class || []).map((item) => item.name).join('、'), 9)}
											</td>
											<td className='border-b border-[rgba(var(--vs-text),0.08)] px-3 py-2'>
												{conflictCourseData.includes(course.id) ? (
													<span className='text-[rgb(var(--vs-danger))]'>衝堂</span>
												) : (
													course.notes
												)}
											</td>
											<td className='border-b border-[rgba(var(--vs-text),0.08)] px-3 py-2'>
												<Button
													icon
													active={saved}
													className='m-0 size-8'
													aria-label={saved ? '從我的課程移除' : '加入我的課程'}
													onClick={() => toggleSavedCourse(course)}
												>
													{saved ? <Minus className='size-4' /> : <Plus className='size-4' />}
												</Button>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
					<Pagination page={page} length={pageCount} onChange={changePage} />
				</Card>
			) : null}
			{layout === 'timetable' ? (
				<TimetableCourses courses={filteredCourse} year={viewYear} sem={viewSem} />
			) : null}
		</div>
	);
}

function CourseDisplayHeading({ course }: { course: Course }) {
	if (isSportsCourse(course)) {
		const title = getSportsCourseTitle(course);
		return (
			<span className='flex items-center gap-1'>
				<SportsCourseIcon title={title} className='text-base' />
				<span>{title}</span>
			</span>
		);
	}
	return <span>{getCourseDisplayTitle(course)}</span>;
}

function CourseTags({ course }: { course: Course }) {
	const tags = getGeneralCourseTags(course);
	if (!tags.length) return null;
	return (
		<div className='mt-2 flex flex-wrap gap-1'>
			{tags.map((tag) => (
				<Tag key={tag.name} color={tag.color} textColor={tag.textColor}>
					{tag.name}
				</Tag>
			))}
		</div>
	);
}

function hasConflict(a: Course, b: Course) {
	for (const [date, slots] of Object.entries(a.time || {}) as [string, string[]][]) {
		for (const slot of slots || []) {
			if (b.time?.[date]?.includes(slot)) return true;
		}
	}
	return false;
}

function TimetableCourses({
	courses,
	year,
	sem,
}: {
	courses: Course[];
	year: string;
	sem: string;
}) {
	const weekdays = Object.keys(dateEng2zh).filter((date) =>
		courses.some((course) => course.time?.[date]?.length),
	);
	const items = buildTimetableCourseItems(courses);

	return (
		<Card className='overflow-hidden p-0'>
			<div
				className='grid gap-2 bg-[rgba(var(--vs-text),0.02)] p-2'
				style={{
					gridTemplateColumns: [
						'[time]',
						'auto',
						weekdays.map((item) => `[${dateEng2zh[item].slice(1)}] 1fr`).join(' '),
						'[end]',
					].join(' '),
					gridTemplateRows: [
						'[weekday] auto',
						...timetable.map((item) => `[slot${item}] auto`),
						'[end]',
					].join(' '),
				}}
			>
				<div
					className='bg-[rgba(var(--vs-text),0.05)]'
					style={{ gridColumn: 'time / end', gridRow: 'weekday' }}
				/>
				{timetable.map((time) => (
					<div
						key={time}
						className='flex min-h-[3em] items-center justify-center px-1 text-[0.85em]'
						style={{ gridColumn: 'time', gridRow: `slot${time}` }}
					>
						{time}
					</div>
				))}
				{weekdays.map((date) => (
					<div
						key={date}
						className='px-4 py-2 text-center text-[0.85em]'
						style={{ gridColumn: dateEng2zh[date].slice(1), gridRow: 'weekday' }}
					>
						{dateEng2zh[date].slice(1)}
					</div>
				))}
				{items.map((item) => {
					const laneWidth = `${100 / item.laneCount}%`;
					return (
						<Link
							key={`${item.id}-${item.date}-${item.slots.join('-')}`}
							to={`/course/${year}/${sem}/${item.id}`}
							className={cn(
								'relative z-[1] flex h-full min-w-0 flex-col justify-between gap-1 rounded-lg border px-2 py-3 text-left no-underline backdrop-blur-[2px] transition-colors',
								item.isConflict
									? 'border-[rgba(var(--vs-danger),0.35)] bg-[rgba(var(--vs-danger),0.16)] text-[rgb(var(--vs-danger))] hover:bg-[rgba(var(--vs-danger),0.22)]'
									: 'border-transparent bg-[rgba(var(--vs-primary),0.15)] text-[rgba(var(--vs-text),0.9)] hover:bg-[rgba(var(--vs-primary),0.22)]',
							)}
							style={{
								gridColumn: dateEng2zh[item.date].slice(1),
								gridRow: `slot${item.startSlot} / slot${item.endSlot}`,
								width: laneWidth,
								marginLeft: `${(100 / item.laneCount) * item.laneIndex}%`,
							}}
						>
							<div className='truncate font-semibold' title={item.name?.zh || '未命名課程'}>
								{item.name?.zh || '未命名課程'}
							</div>
							<div
								className='truncate text-[0.85em] opacity-75'
								title={(item.teacher || []).map((x) => x.name).join('、')}
							>
								{(item.teacher || []).map((x) => x.name).join('、') || item.id}
							</div>
						</Link>
					);
				})}
			</div>
		</Card>
	);
}

export function buildTimetableCourseItems(courses: Course[]) {
	const items: TimetableCourseItem[] = [];
	for (const course of courses) {
		for (const [date, slots] of Object.entries(course.time || {}) as [string, string[]][]) {
			const sortedSlots = [...new Set(slots)]
				.map((slot) => ({ slot, index: timetable.indexOf(slot) }))
				.filter((item) => item.index >= 0)
				.sort((a, b) => a.index - b.index);
			if (!sortedSlots.length) continue;
			const startIndex = sortedSlots[0].index;
			const endIndex = sortedSlots[sortedSlots.length - 1].index + 1;
			items.push({
				...course,
				date,
				slots: sortedSlots.map((item) => item.slot),
				startSlot: timetable[startIndex],
				endSlot: timetable[endIndex] || 'end',
				startIndex,
				endIndex,
				isConflict: false,
				laneIndex: 0,
				laneCount: 1,
			});
		}
	}

	const itemsByDate = new Map<string, TimetableCourseItem[]>();
	for (const item of items) {
		itemsByDate.set(item.date, [...(itemsByDate.get(item.date) || []), item]);
	}

	for (const dayItems of itemsByDate.values()) {
		dayItems.sort((a, b) => a.startIndex - b.startIndex || b.endIndex - a.endIndex);
		const active: TimetableCourseItem[] = [];
		for (const item of dayItems) {
			for (let i = active.length - 1; i >= 0; i--) {
				if (active[i].endIndex <= item.startIndex) active.splice(i, 1);
			}
			const usedLanes = new Set(active.map((activeItem) => activeItem.laneIndex));
			let laneIndex = 0;
			while (usedLanes.has(laneIndex)) laneIndex++;
			item.laneIndex = laneIndex;
			active.push(item);
		}

		for (const item of dayItems) {
			const overlappingItems = dayItems.filter((other) => intervalsOverlap(item, other));
			item.isConflict = overlappingItems.length > 1;
			item.laneCount = Math.max(...overlappingItems.map((other) => other.laneIndex + 1), 1);
		}
	}

	return items;
}

function intervalsOverlap(a: TimetableCourseItem, b: TimetableCourseItem) {
	return a.startIndex < b.endIndex && b.startIndex < a.endIndex;
}
