import { AdsByGoogle } from '../components/AdsByGoogle';
import { CourseList } from '../components/CourseList';
import {
	COURSE_ASIDE_TRANSITION,
	CourseLink,
	CoursePeekOpenedContext,
	type PendingExpand,
	courseSeed,
	takePendingExpand,
} from '../components/CoursePeek';
import { CourseTimeChips } from '../components/CourseTimeChips';
import { Link, useParams, useRouterState } from '@tanstack/react-router';
import { Fragment, startTransition, use, useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import {
	IconChevronDown,
	IconExternalLink,
	IconInfoCircle,
	IconMapPin,
	IconMinus,
	IconPlus,
	IconUser,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { Alert } from '../components/ui-kit/Alert';
import { Button } from '../components/ui-kit/Button';
import { CourseDetailSkeleton, SkeletonBlock } from '../components/ui-kit/PageSkeletons';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { SportsCourseIcon } from '../components/SportsCourseIcon';
import {
	checklistFields,
	collapsedFields,
	renderSyllabusIndicator,
} from '../components/SyllabusIndicators';
import { fetchCourseDetail, fetchWithdrawalRate } from '../lib/courseApi';
import { isCourseHidden } from '../lib/contentVisibility';
import { hasMeaningfulValue } from '../lib/courseFilters';
import {
	courseStandard,
	departmentItems,
	findSimilarCourses,
	storageDepartment,
	formatCredit,
	getSportsCourseTitle,
	hasTimeConflict,
	isSportsCourse,
	parseCourseTime,
} from '../lib/courseUtils';
import { coursePageTitle, usePageTitle } from '../lib/pageTitle';
import { useApp } from '../state/AppContext';
import type { Course, CovidCourseInfo, SyllabusItem } from '../types/course';
import { errorMessage } from '../lib/error';
import {
	classifyWithdrawalRate,
	createWithdrawalRateDistribution,
	formatWithdrawalRate,
	formatWithdrawalThreshold,
	type WithdrawalRateDistribution,
	type WithdrawalRateLevel,
} from '../lib/withdrawalStats';

type InfoCardItem = [string, React.ReactNode];

export function CourseDetailPage() {
	const { year, sem, id } = useParams({ from: '/course/$year/$sem/$id' });
	const rootRef = useRef<HTMLDivElement>(null);
	// A peek opened over this page names its own sidebar while it is open; two would cancel the transition.
	const peekOpen = useRouterState({ select: (state) => Boolean(state.location.state.coursePeek) });

	const pendingRef = useRef<PendingExpand | undefined>(undefined);
	const [loaded, setLoaded] = useState(false);
	useEffect(() => {
		pendingRef.current ??= takePendingExpand();
	}, []);

	// Arriving from an expanded peek, the page waits for its data so it is as tall as the peek was,
	// then scrolls its content to where it already sat on screen and lets the transition capture it.
	// Passive effects run after the closing peek has released its scroll lock.
	useEffect(() => {
		const pending = pendingRef.current;
		const root = rootRef.current;
		if (!loaded || !pending) return;
		pendingRef.current = undefined;
		if (pending.contentTop !== undefined && root) {
			const top = root.getBoundingClientRect().top + window.scrollY - pending.contentTop;
			window.scrollTo(0, Math.max(0, top));
		}
		pending.arrived();
	}, [loaded]);

	return (
		<div ref={rootRef} className='@container'>
			<CourseDetail
				year={year}
				sem={sem}
				id={id}
				asideTransition={!peekOpen}
				onLoaded={() => setLoaded(true)}
			/>
		</div>
	);
}

type LoadedCourseDetail = {
	department: string;
	course: Course;
	syllabus: SyllabusItem[];
	syllabusError: boolean;
	relatedCourses: Course[];
	withdrawalRate: number | null;
	withdrawalDistribution: WithdrawalRateDistribution | null;
};

// What a peek finished loading, kept for the page it may expand into. The page takes it once, so it
// opens complete instead of with a skeleton, a refetch and a second large render; anything else loads fresh.
const handedOffDetails = new Map<string, LoadedCourseDetail>();

export function CourseDetail({
	year,
	sem,
	id,
	asideTransition = false,
	handOff = false,
	onLoaded,
}: {
	year: string;
	sem: string;
	id: string;
	asideTransition?: boolean;
	/** Keeps the loaded detail for the full page, which a peek can expand into. */
	handOff?: boolean;
	onLoaded?: () => void;
}) {
	const { dataset, getCourses, getMyCourseIds, addCourse, removeCourse } = useApp();
	const detailKey = `${year}/${sem}/${id}`;
	const [handedOff] = useState(() => ({ key: detailKey, detail: handedOffDetails.get(detailKey) }));
	const cached = handedOff.detail;
	useEffect(() => {
		handedOffDetails.delete(handedOff.key);
	}, []);
	// A course opened from a list is already in hand, so its summary renders before the fetches settle.
	const [courseDepartment, setCourseDepartment] = useState(
		() => cached?.department || courseSeed(year, sem, id)?.department || dataset.department,
	);
	const [course, setCourse] = useState<Course | null>(
		() => cached?.course ?? courseSeed(year, sem, id)?.course ?? null,
	);
	const [loaded, setLoaded] = useState(Boolean(cached));
	const opened = use(CoursePeekOpenedContext);
	useEffect(() => {
		if (loaded) onLoaded?.();
	}, [loaded]);
	const [syllabus, setSyllabus] = useState<SyllabusItem[]>(cached?.syllabus ?? []);
	const [relatedCourses, setRelatedCourses] = useState<Course[]>(cached?.relatedCourses ?? []);
	const [withdrawalRate, setWithdrawalRate] = useState<number | null>(
		cached?.withdrawalRate ?? null,
	);
	const [withdrawalDistribution, setWithdrawalDistribution] =
		useState<WithdrawalRateDistribution | null>(cached?.withdrawalDistribution ?? null);
	const [error, setError] = useState<unknown>(null);
	const [syllabusError, setSyllabusError] = useState(cached?.syllabusError ?? false);
	const [version, setVersion] = useState(0);

	function showDetail(detail: LoadedCourseDetail) {
		setCourseDepartment(detail.department);
		setSyllabusError(detail.syllabusError);
		setCourse(detail.course);
		setSyllabus(detail.syllabus);
		setRelatedCourses(detail.relatedCourses);
		setWithdrawalRate(detail.withdrawalRate);
		setWithdrawalDistribution(detail.withdrawalDistribution);
		setLoaded(true);
	}

	useEffect(() => {
		let cancelled = false;
		async function load() {
			if (handedOff.detail && handedOff.key === `${year}/${sem}/${id}`) {
				setError(null);
				showDetail(handedOff.detail);
				return;
			}
			const seed = courseSeed(year, sem, id);
			setError(null);
			setLoaded(false);
			setCourse(seed?.course ?? null);
			if (seed?.department) setCourseDepartment(seed.department);
			setSyllabusError(false);
			try {
				const [detailResult, coursesResult, rateResult] = await Promise.allSettled([
					fetchCourseDetail(year, sem, id),
					getCourses({ year, sem }),
					fetchWithdrawalRate(''),
				]);
				if (cancelled) return;
				let courses = coursesResult.status === 'fulfilled' ? coursesResult.value : [];
				let foundDepartment = dataset.department;
				const rate = rateResult.status === 'fulfilled' ? rateResult.value : {};
				let found = courses.find((item) => item.id === id);
				if (!found) {
					const departments = departmentItems
						.map(storageDepartment)
						.filter((item) => item !== dataset.department);
					const results = await Promise.allSettled(
						departments.map((department) => getCourses({ year, sem, department })),
					);
					if (cancelled) return;
					for (let index = 0; index < results.length; index++) {
						const result = results[index];
						if (result.status !== 'fulfilled') continue;
						const match = result.value.find((item) => item.id === id);
						if (match) {
							found = match;
							courses = result.value;
							foundDepartment = departments[index];
							break;
						}
					}
					if (
						!found &&
						(coursesResult.status === 'rejected' ||
							results.some((result) => result.status === 'rejected'))
					) {
						throw new Error('部分部別資料無法載入，請稍後再試');
					}
				}
				if (!found) throw new Error('找不到課程');
				if (isCourseHidden(found)) {
					globalThis.location.href = '/not-found';
					return;
				}
				const detailItems =
					detailResult.status === 'fulfilled' && Array.isArray(detailResult.value)
						? detailResult.value
						: [];
				const teacherRates = (found.teacher || [])
					.map((item) => rate[item.name])
					.filter((value) => value !== null && value !== undefined && String(value).trim() !== '')
					.map(Number)
					.filter((value) => Number.isFinite(value) && value >= 0);
				const detail: LoadedCourseDetail = {
					department: foundDepartment,
					course: found,
					syllabus: detailItems,
					syllabusError: detailResult.status === 'rejected',
					relatedCourses: courses,
					withdrawalRate: teacherRates.length ? Math.max(...teacherRates) : null,
					withdrawalDistribution: createWithdrawalRateDistribution(Object.values(rate)),
				};
				if (handOff && !detail.syllabusError) handedOffDetails.set(`${year}/${sem}/${id}`, detail);
				await opened;
				if (cancelled) return;
				// The syllabus and similar course lists are a large render; yielding keeps the page responsive.
				startTransition(() => showDetail(detail));
			} catch (e) {
				if (!cancelled) setError(e);
			}
		}
		load();
		return () => {
			cancelled = true;
		};
	}, [year, sem, id, dataset.department]);

	const isInMyCourse = getMyCourseIds(year, sem, courseDepartment).includes(id);
	const conflictCourses = useMemo(() => {
		if (!course) return [];
		const ids = getMyCourseIds(year, sem, courseDepartment);
		return relatedCourses.filter(
			(item) => ids.includes(item.id) && item.id !== course.id && hasTimeConflict(course, item),
		);
	}, [course, relatedCourses, courseDepartment, version]);
	const conflicted = conflictCourses.length > 0;
	const selectedSyllabus = syllabus[0] ?? null;
	// The sidebar only sits beside the content on wide screens; on phones this slot would push the description down.
	const [showSidebarAd] = useState(
		() =>
			typeof window !== 'undefined' &&
			typeof window.matchMedia === 'function' &&
			window.matchMedia('(min-width: 1024px)').matches,
	);
	const isEarlyEight = parseCourseTime(course?.time).some((item) =>
		item.content.split('、').includes('1'),
	);
	usePageTitle(course ? coursePageTitle(course) : undefined);

	if (error) return <Alert danger>找不到課程或資料擷取失敗：{errorMessage(error)}</Alert>;
	if (!course) return <CourseDetailSkeleton />;
	const currentCourse = course;

	function toggleCourse() {
		if (isInMyCourse) {
			removeCourse(currentCourse.id, year, sem, courseDepartment);
			toast.success('已從我的課程移除', {
				description: `${currentCourse.id} ${currentCourse.name?.zh || '未命名課程'}`,
			});
		} else {
			addCourse(currentCourse.id, year, sem, courseDepartment);
			toast.success('已加入我的課程', {
				description: `${currentCourse.id} ${currentCourse.name?.zh || '未命名課程'}`,
			});
		}
		setVersion((value) => value + 1);
	}

	return (
		<div className='grid min-w-0 gap-4 @3xl:grid-cols-[minmax(0,1fr)_20rem] @3xl:grid-rows-[auto_1fr] @3xl:items-start @3xl:gap-x-6'>
			{/* A peek's floating buttons sit over the top right; one column keeps the title clear of them. */}
			<header className='flex min-w-0 flex-col gap-1 pr-[var(--course-header-inset,0px)] @3xl:col-start-1 @3xl:pr-0'>
				<h1 className='m-0 text-2xl leading-snug font-semibold'>
					<CourseDetailTitle course={currentCourse} />
				</h1>
				{currentCourse.name?.en ? (
					<div className='text-base font-normal opacity-70'>{currentCourse.name.en}</div>
				) : null}
			</header>
			<aside
				aria-label='課程詳細資訊'
				style={{ viewTransitionName: asideTransition ? COURSE_ASIDE_TRANSITION : undefined }}
				className='flex min-w-0 flex-col gap-3 @3xl:sticky @3xl:top-[var(--course-sticky-top,74px)] @3xl:col-start-2 @3xl:row-span-2 @3xl:row-start-1'
			>
				<Button
					primary={!isInMyCourse}
					danger={isInMyCourse}
					className='w-full'
					onClick={toggleCourse}
				>
					{isInMyCourse ? <IconMinus className='size-4' /> : <IconPlus className='size-4' />}
					{isInMyCourse ? '從我的課程移除' : '加入我的課程'}
				</Button>
				<div className={panelClassName}>
					<div className='rounded-t-surface grid grid-cols-3 divide-x divide-[rgba(var(--vs-text),0.08)] border-b border-[rgba(var(--vs-text),0.08)]'>
						<CourseStat label='課號' value={currentCourse.id} />
						<CourseStat label='學分' value={formatCredit(course.credit)} />
						<WithdrawalRateStat
							loading={!loaded}
							withdrawalRate={withdrawalRate}
							distribution={withdrawalDistribution}
						/>
					</div>
					<div className='grid divide-y divide-[rgba(var(--vs-text),0.08)] @xl:grid-cols-3 @xl:divide-x @xl:divide-y-0 @3xl:grid-cols-1 @3xl:divide-x-0 @3xl:divide-y'>
						<InfoSection
							icon={<IconInfoCircle />}
							title='課程資訊'
							items={[
								infoItem(
									'課程標準',
									`${course.courseType || ''} ${course.courseType ? courseStandard[course.courseType] || '' : ''}`,
								),
								...optionalInfoItem('課程代碼', course.code),
								infoItem('人數', formatQuantity(course.people, '人')),
								...optionalInfoItem('退選', course.peopleWithdraw, '人'),
								infoItem('時數', formatQuantity(course.hours, '小時')),
								// Stage 1 is the default every course has, so only a later stage is worth a row.
								...optionalInfoItem(
									'階段',
									course.stage?.trim() === '1' ? undefined : course.stage,
								),
								...courseAttributeItems(course),
							]}
						/>
						<InfoSection
							icon={<IconUser />}
							title='授課資訊'
							items={[
								infoItem(
									'教師',
									<InlineLinks
										items={(course.teacher || []).map((item) => ({
											label: item.name,
											to: `/teacher/${item.name}`,
										}))}
										fallback='無資料'
									/>,
								),
								infoItem(
									'班級',
									<InlineLinks
										items={(course.class || []).map((item) => ({
											label: item.name,
											to: `/class/${year}/${sem}/${item.name}`,
										}))}
									/>,
								),
								...optionalInfoItem('助教', course.ta?.map((item) => item.name).join('、')),
								...optionalInfoItem('授課語言', course.language),
								...(course.notes?.trim() && course.notes.trim() !== '無'
									? [infoItem('備註', <HtmlText text={course.notes} />)]
									: []),
							]}
						/>
						<InfoSection
							icon={<IconMapPin />}
							title='上課資訊'
							items={[
								infoItem(
									'教室',
									course.classroom?.length
										? course.classroom.map((item) => item.name).join('、')
										: '無資料',
								),
								infoItem('時間', <CourseTimeChips time={course.time} />),
							]}
						/>
					</div>
				</div>
				{showSidebarAd ? (
					<div className='empty:hidden has-[[data-ad-collapsed]]:hidden'>
						<AdsByGoogle placement='sidebar' />
					</div>
				) : null}
			</aside>
			<div className='flex min-w-0 flex-col gap-4 @3xl:col-start-1'>
				{conflicted ? (
					<Alert danger>
						<strong>課程衝堂</strong>
						<br />
						本課程與{' '}
						{conflictCourses.map((item, index) => (
							<span key={item.id}>
								{index > 0 ? '、' : ''}
								<CourseLink
									year={year}
									sem={sem}
									id={item.id}
									course={item}
									department={courseDepartment}
									className='underline underline-offset-2'
								>
									{item.name?.zh}
								</CourseLink>
							</span>
						))}{' '}
						衝堂！
					</Alert>
				) : null}
				{isEarlyEight ? <Alert>該課程為早八，選課前請先三思！</Alert> : null}
				<div className={panelClassName}>
					<section className={docSectionClassName}>
						<h3 className={docHeadingClassName}>課程概述</h3>
						{/* The English description repeats the Chinese one, so it only stands in when that is missing. */}
						<HtmlText
							text={
								course.description?.zh?.trim() || course.description?.en?.trim() || '尚無課程概述'
							}
							as='p'
						/>
					</section>
				</div>
				{selectedSyllabus &&
				[selectedSyllabus.objective, selectedSyllabus.schedule, selectedSyllabus.materials]
					.join('')
					.trim().length >= 400 ? (
					<div className='empty:hidden has-[[data-ad-collapsed]]:hidden'>
						<AdsByGoogle placement='section' />
					</div>
				) : null}
				{!loaded ? (
					<div className={panelClassName}>
						<section className={docSectionClassName}>
							<div className={docHeadingClassName}>
								<SkeletonBlock className='h-[1lh] w-16' />
							</div>
							<div className='flex flex-col gap-2 leading-relaxed'>
								<SkeletonBlock className='h-[1lh] w-full' />
								<SkeletonBlock className='h-[1lh] w-full' />
								<SkeletonBlock className='h-[1lh] w-4/5' />
								<SkeletonBlock className='h-[1lh] w-3/5' />
							</div>
						</section>
					</div>
				) : null}
				{syllabusError ? <Alert>課程大綱暫時無法載入，請稍後再試。</Alert> : null}
				{loaded && !syllabusError && !syllabus.length ? <Alert>尚無課程大綱資料。</Alert> : null}
				{syllabus.length ? <SyllabusDetail items={syllabus} /> : null}
				{/* An unfilled slot is removed from the column so it leaves no gap between the panels. */}
				<div className='empty:hidden has-[[data-ad-collapsed]]:hidden'>
					<AdsByGoogle placement='section' />
				</div>
				<CourseSourceLinks course={course} />
				<SimilarCourses
					key={course.id}
					course={course}
					courses={relatedCourses}
					year={year}
					sem={sem}
					department={courseDepartment}
					onSavedChange={() => setVersion((value) => value + 1)}
				/>
			</div>
		</div>
	);
}

const panelClassName = 'rounded-surface min-w-0 bg-[rgb(var(--vs-background))] shadow-rest';
const dividerClassName = 'divide-y divide-[rgba(var(--vs-text),0.08)]';
// Label column beside the text keeps long syllabus fields scannable and the line length readable.
const docSectionClassName =
	'flex min-w-0 flex-col gap-2 px-4 py-4 text-[0.95rem] sm:px-5 md:grid md:grid-cols-[9rem_minmax(0,1fr)] md:gap-6';
const docHeadingClassName = 'm-0 text-[0.95rem] leading-relaxed font-semibold';

function InfoSection({
	icon,
	title,
	items,
}: {
	icon: React.ReactNode;
	title: string;
	items: InfoCardItem[];
}) {
	return (
		<section className='min-w-0 px-4 py-3 leading-[1.5]'>
			<div className='mb-2 flex items-center gap-1.5 text-sm font-semibold'>
				<span aria-hidden='true' className='text-icon-muted [&>svg]:size-4'>
					{icon}
				</span>
				<span>{title}</span>
			</div>
			<dl className='m-0 grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-sm'>
				{items.map(([itemTitle, content]) => (
					<Fragment key={itemTitle}>
						<dt className='text-[rgba(var(--vs-text),0.6)]'>{itemTitle}</dt>
						<dd className='m-0 min-w-0 [overflow-wrap:anywhere] break-words whitespace-pre-wrap'>
							{content}
						</dd>
					</Fragment>
				))}
			</dl>
		</section>
	);
}

function CourseStat({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className='min-w-0 px-4 py-3'>
			<div className='truncate text-lg leading-tight font-semibold tabular-nums'>{value}</div>
			<div className='mt-1 text-xs leading-tight opacity-70'>{label}</div>
		</div>
	);
}

function WithdrawalRateStat({
	loading,
	withdrawalRate,
	distribution,
}: {
	/** Placeholders take the value's and the badge's line boxes, so the row keeps its height once loaded. */
	loading: boolean;
	withdrawalRate: number | null;
	distribution: WithdrawalRateDistribution | null;
}) {
	const [tooltipOpen, setTooltipOpen] = useState(false);
	const classification = classifyWithdrawalRate(withdrawalRate, distribution);
	const withdrawalRateLabel =
		withdrawalRate !== null ? `${formatWithdrawalRate(withdrawalRate)}%` : '無資料';

	function handleTooltipClick() {
		if (tooltipOpen) {
			setTooltipOpen(false);
			return;
		}
		// Radix closes a tooltip when its trigger is activated. Re-open on the
		// next task so keyboard and touch activation can still inspect the help.
		window.setTimeout(() => setTooltipOpen(true), 0);
	}

	return (
		<TooltipProvider>
			<Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
				<div className='relative min-w-0 cursor-help px-4 py-3'>
					<TooltipTrigger asChild>
						<button
							type='button'
							aria-label={`退選率 ${withdrawalRateLabel}${withdrawalRate !== null ? `，${classification.label}` : ''}，查看退選率說明`}
							className='rounded-tr-surface absolute inset-0 z-10 cursor-help border-0 bg-transparent p-0 focus-visible:ring-[3px] focus-visible:ring-[rgba(var(--vs-primary),0.28)] focus-visible:outline-none focus-visible:ring-inset'
							onClick={handleTooltipClick}
						/>
					</TooltipTrigger>
					<div className='truncate text-lg leading-tight font-semibold tabular-nums'>
						{loading ? <SkeletonBlock className='h-[1lh] w-14' /> : withdrawalRateLabel}
					</div>
					<div className='mt-1 flex flex-wrap items-center gap-x-1 text-xs leading-tight'>
						<span className='text-muted-foreground inline-flex items-center gap-0.5'>
							退選率
							<IconInfoCircle aria-hidden='true' className='size-[1em]' />
						</span>
						{loading ? (
							<SkeletonBlock className='h-[1lh] w-16 text-xs' />
						) : withdrawalRate !== null ? (
							<WithdrawalRateBadge level={classification.level} label={classification.label} />
						) : null}
					</div>
				</div>
				<TooltipContent
					side='bottom'
					align='center'
					sideOffset={8}
					className='rounded-panel max-w-[min(20rem,calc(100vw-2rem))] p-4 text-left'
				>
					<div className='flex flex-col gap-1'>
						<h4 className='text-sm font-semibold'>什麼是退選率？</h4>
						<div>這項資料由教師之退選人數計算而來。</div>
						<h4 className='mt-2 text-sm font-semibold'>退選率如何計算？</h4>
						<div>總退選人數 / 總選課人數</div>
						<h4 className='mt-2 text-sm font-semibold'>如果有多名教師，退選率會怎麼顯示？</h4>
						<div>若該課程有多名教師，則會顯示最高退選率之教師。</div>
						<h4 className='mt-2 text-sm font-semibold'>退選率多少算高？</h4>
						<div>{withdrawalRateDescription(distribution)}</div>
					</div>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}

function WithdrawalRateBadge({ level, label }: { level: WithdrawalRateLevel; label: string }) {
	const className =
		level === 'high'
			? 'text-[rgb(var(--vs-danger))]'
			: level === 'low'
				? 'text-emerald-700 dark:text-emerald-300'
				: 'text-[rgba(var(--vs-text),0.78)]';
	return <span className={`text-xs font-medium ${className}`}>{label}</span>;
}

function withdrawalRateDescription(distribution: WithdrawalRateDistribution | null) {
	if (!distribution || distribution.sampleSize < 2 || distribution.standardDeviation === 0) {
		return '資料不足時會先標示為一般退選率。';
	}
	return `系統會以目前退選率資料計算平均 ${formatWithdrawalThreshold(distribution.mean)} 與標準差 ${formatWithdrawalThreshold(distribution.standardDeviation)}；高於平均加一個標準差會標為高退選率，低於平均減一個標準差會標為低退選率，其餘為一般退選率。`;
}

function infoItem(title: string, content: React.ReactNode): InfoCardItem {
	return [title, content];
}

function CourseDetailTitle({ course }: { course: Course }) {
	if (isSportsCourse(course)) {
		const title = getSportsCourseTitle(course);
		return (
			<span className='inline-flex items-center gap-2'>
				<SportsCourseIcon title={title} />
				<span>{title}</span>
			</span>
		);
	}
	return <>{course?.name?.zh || course?.name || ''}</>;
}

function InlineLinks({
	items,
	fallback = '無資料',
}: {
	items: { to: string; label: string }[];
	fallback?: React.ReactNode;
}) {
	if (!items.length) return fallback;
	return items.map((item, index) => (
		<span key={item.to}>
			{index > 0 ? '、' : ''}
			<Link
				className='rounded-sm text-[rgb(var(--vs-primary))] underline underline-offset-2 transition-colors hover:bg-[rgba(var(--vs-primary),0.08)] focus-visible:ring-2 focus-visible:ring-[rgb(var(--vs-primary))] focus-visible:outline-none'
				to={item.to}
			>
				{item.label}
			</Link>
		</span>
	));
}

export function HtmlText({
	text,
	as: Component = 'span',
}: {
	text: string;
	as?: keyof React.JSX.IntrinsicElements;
}) {
	return (
		<Component className='my-0 min-w-0 leading-relaxed break-words whitespace-pre-wrap'>
			{renderTextWithLinks(text)}
		</Component>
	);
}

const urlPattern = /https?:\/\/[^\s<>"'`]+/gi;
const trailingUrlPunctuation = /[.,;:!?。，、；：！？)\]}）】》」』]+$/u;
const courseTextLinkClassName =
	'break-all text-[rgb(var(--vs-primary))] underline underline-offset-2 [overflow-wrap:anywhere]';

function renderTextWithLinks(text: string) {
	const value = normaliseDisplayText(text);
	const nodes: React.ReactNode[] = [];
	let lastIndex = 0;

	for (const match of value.matchAll(urlPattern)) {
		const rawUrl = match[0];
		const matchIndex = match.index ?? 0;
		const { url, suffix } = splitUrlSuffix(rawUrl);

		if (matchIndex > lastIndex) nodes.push(value.slice(lastIndex, matchIndex));
		if (url) {
			nodes.push(
				<a
					key={`${url}-${matchIndex}`}
					href={url}
					target='_blank'
					rel='noreferrer'
					className={courseTextLinkClassName}
				>
					{url}
				</a>,
			);
		}
		if (suffix) nodes.push(suffix);
		lastIndex = matchIndex + rawUrl.length;
	}

	if (lastIndex < value.length) nodes.push(value.slice(lastIndex));
	return nodes.length ? nodes : value;
}

function splitUrlSuffix(rawUrl: string) {
	let url = rawUrl;
	let suffix = '';

	while (url && trailingUrlPunctuation.test(url.slice(-1))) {
		suffix = `${url.slice(-1)}${suffix}`;
		url = url.slice(0, -1);
	}

	return { url, suffix };
}

const syllabusTextFields = {
	objective: '課程大綱',
	schedule: '課程進度',
	scorePolicy: '評量標準',
	materials: '使用教材、參考書目或其他',
	consultation: '課程諮詢管道',
	remarks: '備註',
} as const;

const syllabusMetadata = new Set([
	'name',
	'email',
	'officeHoursLink',
	'latestUpdate',
	'foreignLanguageTextbooks',
	'covid19',
]);

function comparableValue(value: unknown) {
	return typeof value === 'string' ? value.replace(/\s+/g, '') : JSON.stringify(value ?? null);
}

function teacherName(item: SyllabusItem, index: number) {
	return item.name?.trim() || `教師 ${index + 1}`;
}

type SyllabusVariant = { teachers: string[]; text: string };

// Teachers who share a course mostly agree on some fields and differ on others, so each field is
// shown once when everyone filed the same text and otherwise lists each distinct version under
// the teachers who wrote it.
function syllabusVariants(items: SyllabusItem[], field: string) {
	const variants = new Map<string, SyllabusVariant>();
	items.forEach((item, index) => {
		const value = item[field];
		const raw =
			checklistFields.has(field ?? '') && typeof value === 'string'
				? value.trim()
				: syllabusDisplayText(value);
		const text =
			field === 'objective'
				? withoutEnglishTranslation(raw)
				: field === 'materials'
					? withoutCopyrightNotice(raw)
					: raw;
		if (!text) return;
		const key = comparableValue(text);
		const variant = variants.get(key);
		if (variant) variant.teachers.push(teacherName(item, index));
		else variants.set(key, { teachers: [teacherName(item, index)], text });
	});
	return [...variants.values()];
}

function SyllabusDetail({ items }: { items: SyllabusItem[] }) {
	const covid19 = items.find((item) => item.covid19)?.covid19;
	const additionalFields = [
		...new Set(
			items.flatMap((item) =>
				Object.keys(item).filter(
					(key) => !syllabusMetadata.has(key) && !Object.hasOwn(syllabusTextFields, key),
				),
			),
		),
	];
	const foreignTextbooks = syllabusVariants(
		items.map((item) => ({
			...item,
			foreignLanguageTextbooks: item.foreignLanguageTextbooks === true,
		})),
		'foreignLanguageTextbooks',
	).find((variant) => variant.text === '是');
	const latestUpdate = items
		.map((item) => item.latestUpdate?.trim())
		.filter(Boolean)
		.sort()
		.at(-1);
	return (
		<div className={`${panelClassName} ${dividerClassName}`}>
			{covid19 ? <CovidInfo covid19={covid19} /> : null}
			<section className={docSectionClassName}>
				<h3 className={docHeadingClassName}>教師</h3>
				<ul className='m-0 flex min-w-0 list-none flex-col gap-1.5 p-0'>
					{items.map((teacher, index) => {
						const officeHoursUrl = officialCourseUrl(teacher.officeHoursLink, 'mobile');
						return (
							<li key={index} className='flex min-w-0 flex-wrap items-baseline gap-x-3'>
								<HtmlText
									as='p'
									text={[teacher.name, teacher.email].filter(Boolean).join(' ') || '無資料'}
								/>
								{officeHoursUrl ? (
									<a
										href={officeHoursUrl}
										className={courseTextLinkClassName}
										target='_blank'
										rel='noreferrer'
									>
										教師諮商時間
									</a>
								) : null}
							</li>
						);
					})}
				</ul>
			</section>
			{Object.entries(syllabusTextFields).map(([key, label]) => (
				<VariantSection
					key={key}
					label={label}
					variants={syllabusVariants(items, key)}
					teacherCount={items.length}
					field={key}
				/>
			))}
			{additionalFields.map((key) => (
				<VariantSection
					key={key}
					label={key}
					variants={syllabusVariants(items, key)}
					teacherCount={items.length}
					field={key}
				/>
			))}
			{/* The crawler also emits false when the school's answer is blank. */}
			{foreignTextbooks ? (
				<section className={docSectionClassName}>
					<h3 className={`${docHeadingClassName} col-span-full`}>
						使用外文原文書籍：是
						{foreignTextbooks.teachers.length < items.length ? (
							<span className='text-muted-foreground font-normal'>
								（{foreignTextbooks.teachers.join('、')}）
							</span>
						) : null}
					</h3>
				</section>
			) : null}
			{latestUpdate ? (
				<section className={docSectionClassName}>
					<h3 className={docHeadingClassName}>最後更新</h3>
					<p className='my-0 opacity-75'>{formatLatestUpdate(latestUpdate)}</p>
				</section>
			) : null}
		</div>
	);
}

const emptySyllabusText = new Set(['無', '● 無 (None)', '無（None）', '● 無（None）']);

function syllabusDisplayText(value: unknown) {
	const text =
		typeof value === 'string'
			? value.trim()
			: typeof value === 'boolean'
				? value
					? '是'
					: '否'
				: typeof value === 'number' && Number.isFinite(value)
					? String(value)
					: '';
	return text && !emptySyllabusText.has(text) ? text : '';
}

function TextSection({ label, value, field }: { label: string; value: unknown; field?: string }) {
	const text =
		checklistFields.has(field ?? '') && typeof value === 'string'
			? value.trim()
			: syllabusDisplayText(value);
	if (!text) return null;
	return (
		<SyllabusSection label={label} field={field}>
			<SyllabusText text={text} field={field} />
		</SyllabusSection>
	);
}

function SyllabusSection({
	label,
	field,
	children,
}: {
	label: string;
	field?: string;
	children: React.ReactNode;
}) {
	const collapsible = collapsedFields.has(field ?? '');
	const [expanded, setExpanded] = useState(!collapsible);
	return (
		<section className={docSectionClassName}>
			<h3 className={docHeadingClassName}>
				{collapsible ? (
					<button
						type='button'
						aria-expanded={expanded}
						onClick={() => setExpanded((value) => !value)}
						className='flex w-full cursor-pointer items-start justify-between gap-2 border-0 bg-transparent p-0 text-left font-semibold text-inherit'
					>
						{label}
						{/* Pinned to the first line so a wrapped label does not push the chevron down. */}
						<IconChevronDown
							aria-hidden='true'
							className={`text-icon-muted mt-1 size-4 shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
						/>
					</button>
				) : (
					label
				)}
			</h3>
			{expanded ? children : null}
		</section>
	);
}

function VariantSection({
	label,
	variants,
	teacherCount,
	field,
}: {
	label: string;
	variants: SyllabusVariant[];
	teacherCount: number;
	field?: string;
}) {
	if (!variants.length) return null;
	if (variants.length === 1 && variants[0].teachers.length === teacherCount) {
		return <TextSection label={label} value={variants[0].text} field={field} />;
	}
	return (
		<SyllabusSection label={label} field={field}>
			<div className='flex min-w-0 flex-col'>
				{variants.map((variant, index) => (
					<div
						key={index}
						className='flex min-w-0 flex-col gap-1 border-t border-[rgba(var(--vs-text),0.08)] py-3 first:border-t-0 first:pt-0 last:pb-0'
					>
						<p className='text-muted-foreground m-0 text-sm font-medium'>
							{variant.teachers.join('、')}
						</p>
						<SyllabusText text={variant.text} field={field} />
					</div>
				))}
			</div>
		</SyllabusSection>
	);
}

function SyllabusText({ text, field }: { text: string; field?: string }) {
	const indicator = renderSyllabusIndicator(field, text);
	if (indicator) return indicator;
	const schedule = field === 'schedule' ? parseWeeklySchedule(text) : null;
	if (!schedule) return <HtmlText as='p' text={formatSyllabusText(text)} />;
	return (
		<div className='flex min-w-0 flex-col gap-3'>
			{schedule.intro ? <HtmlText as='p' text={schedule.intro} /> : null}
			<ol className='m-0 grid list-none grid-cols-[auto_minmax(0,1fr)] gap-x-4 p-0'>
				{schedule.weeks.map((week, index) => (
					<li
						key={`${week.label}-${index}`}
						className='col-span-full grid grid-cols-subgrid border-t border-[rgba(var(--vs-text),0.08)] py-2 first:border-t-0 first:pt-0 last:pb-0'
					>
						<span className='text-muted-foreground font-medium whitespace-nowrap tabular-nums'>
							{week.label}
						</span>
						<HtmlText as='div' text={week.content} />
					</li>
				))}
			</ol>
		</div>
	);
}

// The school's form prefixes every textbook list with the same reminder, which says nothing about the course.
const copyrightNoticePattern =
	/[【\[]?\s*遵守智慧財產權觀念，請使用正版教科書，不得使用非法影印教科書\s*[】\]]?/g;

function withoutCopyrightNotice(text: string) {
	return text.replace(copyrightNoticePattern, '').trim();
}

function formatSyllabusText(text: string) {
	return separateLanguages(
		text.replace(/([^\n])●/g, '$1\n●').replace(/([)）])[ \t]*(?=SDG\d+[:：])/g, '$1\n'),
	);
}

const cjkPattern = /[\u3400-\u9fff]/;

const isEnglishParagraph = (line: string) =>
	line.length >= 40 && !cjkPattern.test(line) && /[A-Za-z]{3}/.test(line);

const listItemPattern = /^\s*(\d+\s*[.)、．]|[(（]\d+[)）]|[-•●■▪*])/;
const urlLinePattern = /^\s*https?:\/\/\S+\s*$/;
const visibleLength = (text: string) => text.replace(/\s/g, '').length;

// The course outline usually repeats itself in English beside the Chinese. Checked against every
// outline of 115-1, a run of lines without Chinese is only taken for that translation when most of
// it is English prose; list items are left out of that count so a list that mixes languages keeps
// its English entries, and a link stays in place. When little Chinese remains, or the English
// outweighs it many times over, the English is the real content (an English-taught course with a
// Chinese heading), so the outline is kept whole.
function withoutEnglishTranslation(text: string) {
	if (!cjkPattern.test(text)) return text;
	const isProse = (line: string) => isEnglishParagraph(line) && !listItemPattern.test(line);
	const kept: string[] = [];
	let run: string[] = [];
	let removed = 0;
	const flush = () => {
		const prose = visibleLength(run.filter(isProse).join(''));
		if (prose && prose * 2 >= visibleLength(run.join(''))) {
			removed += visibleLength(run.filter((line) => !urlLinePattern.test(line)).join(''));
			kept.push(...run.filter((line) => urlLinePattern.test(line)));
		} else {
			kept.push(...run);
		}
		run = [];
	};
	for (const line of text.split('\n')) {
		if (cjkPattern.test(line)) {
			flush();
			kept.push(line);
		} else {
			run.push(line);
		}
	}
	flush();
	const result = kept.join('\n').trim();
	const chinese = result.match(new RegExp(cjkPattern.source, 'g'))?.length ?? 0;
	return removed && chinese >= 30 && removed <= chinese * 12 ? result : text;
}

// Teachers often paste the English translation right under the Chinese text; a blank line keeps
// the two from reading as one paragraph.
function separateLanguages(text: string) {
	const lines = text.split('\n');
	return lines
		.flatMap((line, index) => {
			const previous = lines[index - 1];
			if (!previous?.trim() || !line.trim()) return [line];
			const switched =
				(cjkPattern.test(previous) && isEnglishParagraph(line)) ||
				(isEnglishParagraph(previous) && cjkPattern.test(line));
			return switched ? ['', line] : [line];
		})
		.join('\n');
}

const weekLinePattern = /^\s*(Week\s*\d+|第\s*[\d一二三四五六七八九十]+\s*[週周])\s*[:：.、-]?\s*/i;

// Schedules are free text, so they only become a list when enough lines clearly start with a week.
function parseWeeklySchedule(text: string) {
	const intro: string[] = [];
	const weeks: { label: string; content: string }[] = [];
	for (const line of normaliseDisplayText(text).split('\n')) {
		const match = line.match(weekLinePattern);
		if (match) {
			weeks.push({
				label: match[1].replace(/\s+/g, ' ').trim(),
				content: line.slice(match[0].length).trim(),
			});
		} else if (!weeks.length) {
			intro.push(line);
		} else if (line.trim()) {
			const week = weeks[weeks.length - 1];
			week.content = week.content ? `${week.content}\n${line.trim()}` : line.trim();
		}
	}
	if (weeks.length < 3) return null;
	return { intro: intro.join('\n').trim(), weeks };
}

function normaliseDisplayText(text: string) {
	return String(text || '')
		.replace(/\r\n?/g, '\n')
		.replace(/\n[ \t]*(?:\n[ \t]*){2,}/g, '\n\n')
		.replace(/\t/g, '　　');
}

const covidFields = {
	lv2Method: '二級警戒上課方式',
	lv2Description: '二級警戒上課說明',
	courseScoreMethod: '評量方式',
	courseInfo: '課程訊息公告',
	courseURL: '上課網址',
	contactInfo: '學生加退選簽核及諮詢課程問題管道',
	additionalInfo: '補充說明資訊',
};

function CovidInfo({ covid19 }: { covid19: CovidCourseInfo }) {
	if (
		!Object.values(covid19).some((value) => value?.trim() && !emptySyllabusText.has(value.trim()))
	)
		return null;
	return (
		<section className={`min-w-0 ${dividerClassName}`}>
			<div className='px-4 py-4 sm:px-5'>
				<h2 className='m-0 text-base font-semibold'>因應疫情所致之上課方式</h2>
				<p className='my-0 mt-1 text-sm opacity-70'>實際實施日期與上課方式，依學校公布之訊息為主</p>
			</div>
			{Object.entries(covid19).map(([key, value]) => (
				<TextSection key={key} label={covidFields[key] || key} value={value} />
			))}
		</section>
	);
}

function optionalInfoItem(label: string, value: string | undefined, unit?: string): InfoCardItem[] {
	return value?.trim() ? [infoItem(label, unit ? formatQuantity(value, unit) : value)] : [];
}

function courseAttributeItems(course: Course): InfoCardItem[] {
	return (
		[
			['audit', '隨班附讀'],
			['lab', '實驗實習'],
			['interdisciplinary', '跨領域'],
		] as const
	).flatMap(([key, label]) => {
		const value = course[key]?.trim();
		return value && hasMeaningfulValue(value) ? [infoItem(label, value)] : [];
	});
}

function formatQuantity(value: string | undefined, unit: string) {
	return value?.trim() ? `${value} ${unit}` : '無資料';
}

function formatLatestUpdate(value: string | undefined) {
	if (!value?.trim()) return '無資料';
	const date = new Date(value);
	if (!Number.isFinite(date.getTime())) return value;
	const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
	if (seconds < 0) return value;
	const intervals: [string, number][] = [
		['年', 31536000],
		['月', 2592000],
		['天', 86400],
		['小時', 3600],
		['分鐘', 60],
		['秒', 1],
	];
	const [label, size] = intervals.find(([, size]) => seconds >= size) || ['秒', 1];
	return `${Math.floor(seconds / size)} ${label}前（${value}）`;
}

function officialCourseUrl(value: string | undefined, section: 'tw' | 'mobile') {
	if (!value?.trim()) return null;
	try {
		const url = new URL(value, `https://aps.ntut.edu.tw/course/${section}/`);
		return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
	} catch {
		return null;
	}
}

const similarCoursePreviewCount = 6;

function SimilarCourses({
	course,
	courses,
	year,
	sem,
	department,
	onSavedChange,
}: {
	course: Course;
	courses: Course[];
	year: string;
	sem: string;
	department: string;
	onSavedChange: () => void;
}) {
	const { sameName, sameTeacher } = useMemo(
		() => findSimilarCourses(course, courses),
		[course, courses],
	);
	if (!sameName.length && !sameTeacher.length) return null;
	return (
		<>
			<div className='empty:hidden has-[[data-ad-collapsed]]:hidden'>
				<AdsByGoogle placement='section' />
			</div>
			{[
				{ title: '同名課程', items: sameName },
				{ title: '同教師的其他課程', items: sameTeacher },
			].map((group) => (
				<SimilarCourseSection
					key={group.title}
					title={group.title}
					courses={group.items}
					year={year}
					sem={sem}
					department={department}
					onSavedChange={onSavedChange}
				/>
			))}
		</>
	);
}

function SimilarCourseSection({
	title,
	courses,
	year,
	sem,
	department,
	onSavedChange,
}: {
	title: string;
	courses: Course[];
	year: string;
	sem: string;
	department: string;
	onSavedChange: () => void;
}) {
	const [expanded, setExpanded] = useState(false);
	if (!courses.length) return null;
	return (
		<section className='flex flex-col gap-2'>
			<h2 className='m-0 text-lg font-semibold'>{title}</h2>
			<CourseList
				courses={courses}
				year={year}
				sem={sem}
				department={department}
				showToolbar={false}
				markConflicts={false}
				scrollOnMobile
				desktopLimit={expanded ? undefined : similarCoursePreviewCount}
				onSavedChange={onSavedChange}
			/>
			{courses.length > similarCoursePreviewCount ? (
				<Button
					className='self-center max-sm:hidden'
					onClick={() => setExpanded((value) => !value)}
				>
					{expanded ? '收合' : `顯示全部 ${courses.length} 門`}
				</Button>
			) : null}
		</section>
	);
}

function CourseSourceLinks({ course }: { course: Course }) {
	const links = [
		{ label: '原始課程概述', url: officialCourseUrl(course.courseDescriptionLink, 'tw') },
		...(course.syllabusLinks || []).map((link, index) => ({
			label: `原始課綱 ${index + 1}`,
			url: officialCourseUrl(link, 'mobile'),
		})),
		...(['teacher', 'class', 'classroom', 'ta'] as const).flatMap((key) =>
			(course[key] || []).map((item) => ({
				label: `${{ teacher: '教師', class: '班級', classroom: '教室', ta: '助教' }[key]}：${item.name}`,
				url: officialCourseUrl(item.link, 'tw'),
			})),
		),
	].filter((link) => link.url !== null);
	if (!links.length) return null;
	return (
		<section className={`${panelClassName} ${docSectionClassName}`}>
			<h3 className={docHeadingClassName}>學校原始資料</h3>
			<ul className='m-0 flex min-w-0 list-none flex-wrap gap-2 p-0'>
				{links.map((link, index) => (
					<li key={`${link.url}-${index}`} className='min-w-0'>
						<a
							className='rounded-control inline-flex min-h-8 max-w-full items-center gap-1.5 bg-[rgba(var(--vs-text),0.05)] px-2.5 py-1 text-sm text-[rgb(var(--vs-text))] no-underline transition-colors hover:bg-[rgba(var(--vs-text),0.1)] focus-visible:ring-[3px] focus-visible:ring-[rgba(var(--vs-primary),0.28)] focus-visible:outline-none'
							href={link.url!}
							target='_blank'
							rel='noreferrer'
						>
							<span className='min-w-0 [overflow-wrap:anywhere]'>{link.label}</span>
							<IconExternalLink aria-hidden='true' className='text-icon-muted size-3.5 shrink-0' />
						</a>
					</li>
				))}
			</ul>
		</section>
	);
}
