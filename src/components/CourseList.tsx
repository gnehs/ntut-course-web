import { CourseListToolbar } from './CourseListToolbar';
import { Link } from '@tanstack/react-router';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { CircleAlert, Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { AdsByGoogle } from './AdsByGoogle';
import { CourseTimeChips } from './CourseTimeChips';
import { cn } from '../lib/utils';
import {
	courseStandard,
	courseTitle,
	dateEng2zh,
	formatCredit,
	getCourseDisplayTitle,
	getGeneralCourseTags,
	getSportsCourseTitle,
	isSportsCourse,
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
	emptyState?: React.ReactNode;
	showToolbar?: boolean;
	toolbarStart?: React.ReactNode;
	toolbarEnd?: React.ReactNode;
	layout?: CourseListLayout;
	onLayoutChange?: (layout: CourseListLayout) => void;
	onPageChange?: (page: number) => void;
	page?: number;
	showTimetable?: boolean;
	showMidListAd?: boolean;
	showConflictCourse?: boolean;
	markConflicts?: boolean;
	/** Phones get a single swipeable row instead of a stack of cards. */
	scrollOnMobile?: boolean;
	/** Cards past this count are hidden on wider screens; a mobile swipe row still shows them all. */
	desktopLimit?: number;
	year?: string;
	sem?: string;
	department?: string;
	savedVersion?: number;
	onSavedChange?: () => void;
};

export type CourseListLayout = 'card' | 'table' | 'timetable';

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
	emptyState,
	showToolbar = true,
	toolbarStart,
	toolbarEnd,
	layout: controlledLayout,
	onLayoutChange,
	onPageChange,
	page: controlledPage,
	showTimetable = false,
	showMidListAd = false,
	showConflictCourse = true,
	markConflicts = true,
	scrollOnMobile = false,
	desktopLimit,
	year,
	sem,
	department,
	savedVersion: externalSavedVersion = 0,
	onSavedChange,
}: CourseListProps) {
	const { dataset, getCourses, getMyCourseIds, addCourse, removeCourse } = useApp();
	const [internalLayout, setInternalLayout] = useState<CourseListLayout>('card');
	const [internalPage, setInternalPage] = useState(1);
	const layout = controlledLayout ?? internalLayout;
	const page = controlledPage ?? internalPage;
	const hasMountedRef = useRef(false);
	const cardRowRef = useRef<HTMLDivElement>(null);
	const [savedVersion, setSavedVersion] = useState(0);
	const [conflictCourseData, setConflictCourseData] = useState<string[]>([]);
	const viewYear = year || dataset.year;
	const viewSem = sem || dataset.sem;
	const viewDepartment = department || dataset.department;
	const savedCourseIds = useMemo(
		() => getMyCourseIds(viewYear, viewSem, viewDepartment),
		[getMyCourseIds, viewYear, viewSem, viewDepartment, savedVersion, externalSavedVersion],
	);

	useEffect(() => {
		if (!markConflicts) {
			setConflictCourseData([]);
			return;
		}
		let cancelled = false;
		async function checkConflict() {
			const ids = getMyCourseIds(viewYear, viewSem, viewDepartment);
			const myCourses = (
				await getCourses({ year: viewYear, sem: viewSem, department: viewDepartment })
			).filter((course) => ids.includes(course.id));
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
		checkConflict().catch(() => {
			if (!cancelled) setConflictCourseData([]);
		});
		return () => {
			cancelled = true;
		};
	}, [
		courses,
		markConflicts,
		viewYear,
		viewSem,
		viewDepartment,
		savedVersion,
		externalSavedVersion,
	]);

	const filteredCourse = useMemo(() => {
		if (!courses) return [];
		return showConflictCourse
			? courses
			: courses.filter((course) => !conflictCourseData.includes(course.id));
	}, [courses, showConflictCourse, conflictCourseData]);

	const pageCount = Math.max(Math.ceil(filteredCourse.length / PAGE_SIZE), 1);
	const pageItems = filteredCourse.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
	const showSectionAd = showMidListAd && layout === 'card' && pageItems.length >= 12;

	useEffect(() => {
		if (controlledPage !== undefined) return;
		if (!hasMountedRef.current) {
			hasMountedRef.current = true;
			return;
		}
		setInternalPage(1);
	}, [controlledPage, courses, showConflictCourse, layout]);

	useEffect(() => {
		if (page > pageCount) updatePage(1);
	}, [page, pageCount]);

	function updatePage(nextPage: number) {
		if (nextPage === page) return;
		if (onPageChange) onPageChange(nextPage);
		else setInternalPage(nextPage);
	}

	function changeLayout(nextLayout: CourseListLayout) {
		if (nextLayout === layout) return;
		if (onLayoutChange) onLayoutChange(nextLayout);
		else setInternalLayout(nextLayout);
		updatePage(1);
	}

	function changePage(nextPage: number) {
		if (nextPage === page) return;
		updatePage(nextPage);
		window.scrollTo({ top: 0 });
	}

	function toggleSavedCourse(course: Course) {
		const saved = savedCourseIds.includes(course.id);
		if (saved) {
			removeCourse(course.id, viewYear, viewSem, viewDepartment);
			toast.success('已從我的課程移除', {
				description: `${course.id} ${course.name?.zh || '未命名課程'}`,
			});
		} else {
			addCourse(course.id, viewYear, viewSem, viewDepartment);
			toast.success('已加入我的課程', {
				description: `${course.id} ${course.name?.zh || '未命名課程'}`,
			});
		}
		setSavedVersion((value) => value + 1);
		onSavedChange?.();
	}

	if (!courses) return null;

	return (
		<div>
			{showToolbar ? (
				<CourseListToolbar
					layout={layout}
					onLayoutChange={changeLayout}
					showTimetable={showTimetable}
					toolbarStart={toolbarStart}
					toolbarEnd={toolbarEnd}
				/>
			) : null}
			{layout === 'card' ? (
				<>
					<div
						ref={cardRowRef}
						className={cn(
							'grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-3',
							scrollOnMobile &&
								'max-sm:no-scrollbar max-sm:scroll-fade-x max-sm:-mx-4 max-sm:-mt-2 max-sm:-mb-6 max-sm:flex max-sm:snap-x max-sm:snap-mandatory max-sm:scroll-px-4 max-sm:overflow-x-auto max-sm:px-4 max-sm:pt-2 max-sm:pb-6 max-sm:*:w-[85%] max-sm:*:shrink-0 max-sm:*:snap-start',
						)}
					>
						{pageItems.map((course, index) => {
							const saved = savedCourseIds.includes(course.id);
							const conflicted = conflictCourseData.includes(course.id);
							return (
								<Fragment key={course.id}>
									{showSectionAd && index === 6 ? (
										<div className="col-span-full min-w-0 empty:hidden has-[>div[aria-hidden='true']]:hidden">
											<AdsByGoogle placement='section' />
										</div>
									) : null}
									<Card
										className={cn(
											'hoverable px-4 py-4',
											desktopLimit !== undefined && index >= desktopLimit && 'sm:hidden',
										)}
									>
										<Link
											to={`/course/${viewYear}/${viewSem}/${course.id}`}
											aria-label={`查看 ${courseTitle(course)} 課程詳情`}
											className='absolute inset-0 z-0 rounded-[inherit] focus-visible:ring-[3px] focus-visible:ring-[rgba(var(--vs-primary),0.28)] focus-visible:outline-none'
										/>
										<div className='pointer-events-none relative z-[1] flex flex-col gap-3'>
											<div className='relative flex flex-col gap-1 pr-11'>
												<CardTitle className='mb-0 w-auto min-w-0 text-base leading-6 [overflow-wrap:anywhere]'>
													<CourseDisplayHeading course={course} />
												</CardTitle>
												<div className='text-xs leading-5 tabular-nums opacity-70'>
													{courseSummary(course)}
												</div>
												<SaveCourseButton saved={saved} onClick={() => toggleSavedCourse(course)} />
											</div>
											{getGeneralCourseTags(course).length ? (
												<div className='flex flex-wrap gap-1'>
													<CourseTags course={course} />
												</div>
											) : null}
											<dl className='m-0 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-sm leading-5'>
												<CourseMetaLine label='時間'>
													<CourseTimeChips time={course.time}>
														{/* A conflict is a property of the time slot, so it sits beside it instead of taking its own row. */}
														{conflicted ? (
															<span className='inline-flex items-center gap-1 rounded-sm bg-[rgba(var(--vs-danger),0.12)] px-1.5 font-medium whitespace-nowrap text-[rgb(var(--vs-danger))]'>
																<CircleAlert className='size-3.5' />
																衝堂
															</span>
														) : null}
													</CourseTimeChips>
												</CourseMetaLine>
												<CourseMetaLine label='教師' truncate>
													{(course.teacher || []).map((item) => item.name).join('、') || '無資料'}
												</CourseMetaLine>
												<CourseMetaLine label='班級' truncate>
													{(course.class || []).map((item) => item.name).join('、') || '無資料'}
												</CourseMetaLine>
												{hasCourseNotes(course) ? (
													<CourseMetaLine label='備註'>{course.notes}</CourseMetaLine>
												) : null}
											</dl>
										</div>
									</Card>
								</Fragment>
							);
						})}
					</div>
					{scrollOnMobile ? <ScrollIndicator targetRef={cardRowRef} /> : null}
					{!filteredCourse.length ? (
						<div className='flex items-center justify-center p-5'>
							{emptyState || <p>查無資料</p>}
						</div>
					) : null}
					<Pagination page={page} length={pageCount} onChange={changePage} />
				</>
			) : null}
			{layout === 'table' ? (
				<Card className='overflow-hidden p-0'>
					<div className='overflow-x-auto'>
						<table className='w-full min-w-[860px] border-collapse text-left'>
							<thead>
								<tr className='text-shadow-emboss bg-[rgba(var(--vs-text),0.035)] text-sm'>
									<th className='border-b border-[rgba(var(--vs-text),0.08)] px-4 py-2.5'>課號</th>
									<th className='border-b border-[rgba(var(--vs-text),0.08)] px-4 py-2.5'>
										課程名稱
									</th>
									<th className='border-b border-[rgba(var(--vs-text),0.08)] px-4 py-2.5'>學分</th>
									<th className='border-b border-[rgba(var(--vs-text),0.08)] px-4 py-2.5'>時間</th>
									<th className='border-b border-[rgba(var(--vs-text),0.08)] px-4 py-2.5'>教師</th>
									<th className='border-b border-[rgba(var(--vs-text),0.08)] px-4 py-2.5'>班級</th>
									<th className='border-b border-[rgba(var(--vs-text),0.08)] px-4 py-2.5'>備註</th>
									<th className='border-b border-[rgba(var(--vs-text),0.08)] px-4 py-2.5'>
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
											<td className='border-b border-[rgba(var(--vs-text),0.08)] px-4 py-2.5 whitespace-nowrap tabular-nums'>
												{course.id}
											</td>
											<td className='border-b border-[rgba(var(--vs-text),0.08)] px-4 py-2.5'>
												<Link to={`/course/${viewYear}/${viewSem}/${course.id}`}>
													{courseTitle(course)}
												</Link>
											</td>
											<td className='border-b border-[rgba(var(--vs-text),0.08)] px-4 py-2.5 tabular-nums'>
												{formatCredit(course.credit)}
											</td>
											<td className='border-b border-[rgba(var(--vs-text),0.08)] px-4 py-2.5 whitespace-nowrap tabular-nums'>
												<CourseTimeChips time={course.time} fallback='' wrap={false} />
											</td>
											<td className='border-b border-[rgba(var(--vs-text),0.08)] px-4 py-2.5'>
												{trimEllip((course.teacher || []).map((item) => item.name).join('、'), 9)}
											</td>
											<td className='border-b border-[rgba(var(--vs-text),0.08)] px-4 py-2.5'>
												{trimEllip((course.class || []).map((item) => item.name).join('、'), 9)}
											</td>
											<td className='border-b border-[rgba(var(--vs-text),0.08)] px-4 py-2.5'>
												{conflictCourseData.includes(course.id) ? (
													<span className='text-[rgb(var(--vs-danger))]'>衝堂</span>
												) : (
													course.notes
												)}
											</td>
											<td className='border-b border-[rgba(var(--vs-text),0.08)] px-4 py-2.5'>
												<Button
													icon
													danger={saved}
													className='m-0'
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
					{!filteredCourse.length ? (
						<div className='flex items-center justify-center p-5'>
							{emptyState || <p>查無資料</p>}
						</div>
					) : null}
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
	return getGeneralCourseTags(course).map((tag) => (
		<Tag key={tag.name} color={tag.color} textColor={tag.textColor}>
			{tag.name}
		</Tag>
	));
}

// iOS only shows its overlay scrollbar mid-swipe, so the row keeps its own track to show how much is left.
function ScrollIndicator({ targetRef }: { targetRef: React.RefObject<HTMLDivElement | null> }) {
	const [thumb, setThumb] = useState<{ size: number; offset: number } | null>(null);
	useEffect(() => {
		const target = targetRef.current;
		if (!target) return;
		function measure() {
			if (!target) return;
			const { scrollWidth, clientWidth, scrollLeft } = target;
			if (scrollWidth <= clientWidth + 1) return setThumb(null);
			const size = Math.max(clientWidth / scrollWidth, 0.2);
			setThumb({ size, offset: (scrollLeft / (scrollWidth - clientWidth)) * (1 - size) });
		}
		measure();
		target.addEventListener('scroll', measure, { passive: true });
		const observer = new ResizeObserver(measure);
		observer.observe(target);
		return () => {
			target.removeEventListener('scroll', measure);
			observer.disconnect();
		};
	}, [targetRef]);
	if (!thumb) return null;
	return (
		<div
			aria-hidden='true'
			className='relative mx-auto mt-3 h-1 w-24 overflow-hidden rounded-full bg-[rgba(var(--vs-text),0.1)] sm:hidden'
		>
			<div
				className='absolute inset-y-0 rounded-full bg-[rgba(var(--vs-text),0.45)]'
				style={{ width: `${thumb.size * 100}%`, left: `${thumb.offset * 100}%` }}
			/>
		</div>
	);
}

function SaveCourseButton({ saved, onClick }: { saved: boolean; onClick: () => void }) {
	const Icon = saved ? Minus : Plus;
	return (
		<button
			type='button'
			aria-label={saved ? '從我的課程移除' : '加入我的課程'}
			className={cn(
				'rounded-control pointer-events-auto absolute -top-1 -right-1 grid size-11 place-items-center border-0 bg-transparent p-0 transition-colors',
				'before:rounded-control before:shadow-soft hover:before:shadow-soft-hover text-[rgb(var(--tone))] outline-none before:absolute before:inset-1.5 before:transition-[background-color,box-shadow]',
				'focus-visible:ring-[3px] focus-visible:ring-[rgba(var(--vs-primary),0.28)]',
				saved
					? 'tone-danger before:bg-[rgba(var(--vs-danger),0.15)] hover:before:bg-[rgba(var(--vs-danger),0.2)]'
					: 'tone-neutral before:bg-[rgba(var(--vs-text),0.06)] hover:before:bg-[rgba(var(--vs-text),0.1)]',
			)}
			onClick={onClick}
		>
			<Icon className='relative z-[1] size-4' />
		</button>
	);
}

function courseSummary(course: Course) {
	const credit = formatCredit(course.credit);
	return [
		course.id,
		Number.isFinite(Number(credit || NaN)) ? `${credit} 學分` : '',
		course.courseType ? courseStandard[course.courseType] : '',
	]
		.filter(Boolean)
		.join(' · ');
}

function hasCourseNotes(course: Course) {
	const notes = course.notes?.trim();
	return Boolean(notes) && notes !== '無';
}

function CourseMetaLine({
	label,
	children,
	truncate = false,
}: {
	label: string;
	children: React.ReactNode;
	truncate?: boolean;
}) {
	return (
		<>
			<dt className='text-[rgba(var(--vs-text),0.6)]'>{label}</dt>
			<dd className={cn('m-0 min-w-0', truncate ? 'truncate' : 'break-words whitespace-pre-wrap')}>
				{children}
			</dd>
		</>
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
					className='rounded-control bg-sheen-well shadow-well bg-[rgba(var(--vs-text),0.05)]'
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
								'rounded-control shadow-soft hover:shadow-soft-hover relative z-[1] flex h-full min-w-0 flex-col justify-between gap-1 px-2 py-3 text-left no-underline backdrop-blur-[2px] transition-[background-color,box-shadow]',
								item.isConflict
									? 'tone-danger bg-[rgba(var(--vs-danger),0.16)] text-[rgb(var(--vs-danger))] hover:bg-[rgba(var(--vs-danger),0.22)]'
									: 'tone-primary bg-[rgba(var(--vs-primary),0.15)] text-[rgba(var(--vs-text),0.9)] hover:bg-[rgba(var(--vs-primary),0.22)]',
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
