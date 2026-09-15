import { AdsByGoogle } from '../components/AdsByGoogle';
import { Link, useParams } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import type React from 'react';
import { Info, MapPin, Minus, Plus, User } from 'lucide-react';
import { toast } from 'sonner';
import { Alert } from '../components/ui-kit/Alert';
import { Button } from '../components/ui-kit/Button';
import { Card } from '../components/ui-kit/Card';
import { CardTitle } from '../components/ui-kit/CardTitle';
import { CourseDetailSkeleton } from '../components/ui-kit/PageSkeletons';
import { Select, SelectOption } from '../components/ui-kit/Select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { SportsCourseIcon } from '../components/SportsCourseIcon';
import { fetchCourseDetail, fetchWithdrawalRate } from '../lib/courseApi';
import { isCourseHidden } from '../lib/contentVisibility';
import { hasMeaningfulValue } from '../lib/courseFilters';
import {
	courseStandard,
	departmentItems,
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
	const { dataset, getCourses, getMyCourseIds, addCourse, removeCourse } = useApp();
	const [courseDepartment, setCourseDepartment] = useState(dataset.department);
	const [course, setCourse] = useState<Course | null>(null);
	const [syllabus, setSyllabus] = useState<SyllabusItem[]>([]);
	const [relatedCourses, setRelatedCourses] = useState<Course[]>([]);
	const [withdrawalRate, setWithdrawalRate] = useState<number | null>(null);
	const [withdrawalDistribution, setWithdrawalDistribution] =
		useState<WithdrawalRateDistribution | null>(null);
	const [selectedSyllabusIndex, setSelectedSyllabusIndex] = useState('0');
	const [error, setError] = useState<unknown>(null);
	const [syllabusError, setSyllabusError] = useState(false);
	const [version, setVersion] = useState(0);

	useEffect(() => {
		let cancelled = false;
		async function load() {
			setError(null);
			setCourse(null);
			setSyllabusError(false);
			setSelectedSyllabusIndex('0');
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
				setCourseDepartment(foundDepartment);
				if (isCourseHidden(found)) {
					globalThis.location.href = '/not-found';
					return;
				}
				const detailItems =
					detailResult.status === 'fulfilled' && Array.isArray(detailResult.value)
						? detailResult.value
						: [];
				setSyllabusError(detailResult.status === 'rejected');
				const teacherRates = (found.teacher || [])
					.map((item) => rate[item.name])
					.filter((value) => value !== null && value !== undefined && String(value).trim() !== '')
					.map(Number)
					.filter((value) => Number.isFinite(value) && value >= 0);
				setCourse(found);
				setSyllabus(detailItems);
				setRelatedCourses(courses);
				setWithdrawalRate(teacherRates.length ? Math.max(...teacherRates) : null);
				setWithdrawalDistribution(createWithdrawalRateDistribution(Object.values(rate)));
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
	const selectedSyllabus = syllabus[Number(selectedSyllabusIndex)] || null;
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
		<div className='flex flex-col gap-4'>
			<div className='flex flex-wrap items-center justify-between gap-3'>
				<div className='flex flex-col gap-1'>
					<h1 className='text-xl leading-snug font-semibold'>
						<CourseDetailTitle course={currentCourse} />
					</h1>
					<div className='text-base font-normal opacity-80'>{currentCourse.name?.en}</div>
				</div>
				<div>
					<Button primary={!isInMyCourse} danger={isInMyCourse} onClick={toggleCourse}>
						{isInMyCourse ? <Minus className='size-4' /> : <Plus className='size-4' />}
						{isInMyCourse ? '從我的課程移除' : '加入我的課程'}
					</Button>
				</div>
			</div>
			{conflicted ? (
				<Alert danger>
					<strong>課程衝堂</strong>
					<br />
					本課程與{' '}
					{conflictCourses.map((item, index) => (
						<span key={item.id}>
							{index > 0 ? '、' : ''}
							<Link
								to={`/course/${year}/${sem}/${item.id}`}
								className='underline underline-offset-2'
							>
								{item.name?.zh}
							</Link>
						</span>
					))}{' '}
					衝堂！
				</Alert>
			) : null}
			{isEarlyEight ? <Alert>該課程為早八，選課前請先三思！</Alert> : null}
			<div>
				<div className='mt-4 grid gap-3 sm:grid-cols-3'>
					<Card>
						<CardTitle>{currentCourse.id}</CardTitle>
						<p>課號</p>
					</Card>
					<Card>
						<CardTitle>{formatCredit(course.credit)}</CardTitle>
						<p>學分</p>
					</Card>
					<WithdrawalRateCard
						withdrawalRate={withdrawalRate}
						distribution={withdrawalDistribution}
					/>
				</div>
				<div
					className='-mx-4 mt-3 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto overscroll-x-contain px-4 pb-2 [-webkit-overflow-scrolling:touch] lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 lg:pb-0'
					aria-label='課程詳細資訊'
				>
					<InfoCard
						className='min-w-[82vw] snap-start sm:min-w-[22rem] lg:min-w-0 lg:snap-none'
						icon={<Info />}
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
							...optionalInfoItem('階段', course.stage),
							...courseAttributeItems(course),
						]}
					/>
					<InfoCard
						className='min-w-[82vw] snap-start sm:min-w-[22rem] lg:min-w-0 lg:snap-none'
						icon={<User />}
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
							infoItem('備註', <HtmlText text={course.notes || '無'} />),
						]}
					/>
					<InfoCard
						className='min-w-[82vw] snap-start sm:min-w-[22rem] lg:min-w-0 lg:snap-none'
						icon={<MapPin />}
						title='上課資訊'
						items={[
							infoItem(
								'教室',
								course.classroom?.length
									? course.classroom.map((item) => item.name).join('、')
									: '無資料',
							),
							...(parseCourseTime(course.time).length
								? parseCourseTime(course.time).map((item) => infoItem(item.title, item.content))
								: [infoItem('上課時間', '尚無資訊')]),
						]}
					/>
				</div>
			</div>
			<section className='flex flex-col gap-2'>
				<h3>課程概述</h3>
				<HtmlText text={course.description?.zh || '尚無中文課程概述'} as='p' />
				<HtmlText text={course.description?.en || '尚無英文課程概述'} as='p' />
			</section>
			{selectedSyllabus &&
			[selectedSyllabus.objective, selectedSyllabus.schedule, selectedSyllabus.materials]
				.join('')
				.trim().length >= 400 ? (
				<AdsByGoogle placement='section' />
			) : null}
			{syllabusError ? <Alert>課程大綱暫時無法載入，請稍後再試。</Alert> : null}
			{!syllabusError && !syllabus.length ? <Alert>尚無課程大綱資料。</Alert> : null}
			{syllabus.length > 1 ? (
				<Alert>
					<strong>含有多項資料</strong>
					<br />
					本課程含有多項資料可供查詢，請使用下拉式選單選取教師來查看資料。
					<br />
					<br />
					<Select
						aria-label='選擇課綱教師'
						value={selectedSyllabusIndex}
						onChange={(value) => setSelectedSyllabusIndex(value)}
					>
						{syllabus.map((item, index) => (
							<SelectOption key={`${item.name}-${index}`} value={String(index)}>
								{item.name || `課綱 ${index + 1}`}
							</SelectOption>
						))}
					</Select>
				</Alert>
			) : null}
			{selectedSyllabus ? <SyllabusDetail item={selectedSyllabus} /> : null}
			<CourseSourceLinks course={course} />
			<AdsByGoogle placement='footer' />
		</div>
	);
}

function InfoCard({
	className = '',
	icon,
	title,
	items,
}: {
	className?: string;
	icon: React.ReactNode;
	title: string;
	items: InfoCardItem[];
}) {
	return (
		<section
			className={`rounded-panel border border-[rgba(var(--vs-text),0.1)] bg-[rgb(var(--vs-background))] p-3 leading-[1.5] ${className}`}
		>
			<div>{icon}</div>
			<div className='my-2 text-base font-semibold'>{title}</div>
			<div className='grid gap-2 md:grid-cols-2'>
				{items.map(([itemTitle, content]) => (
					<div className='grid min-w-0 gap-0 md:gap-1' key={itemTitle}>
						<div className='text-sm font-semibold whitespace-nowrap'>{itemTitle}</div>
						<div className='min-w-0 text-sm [overflow-wrap:anywhere] break-words whitespace-pre-wrap opacity-75'>
							{content}
						</div>
					</div>
				))}
			</div>
		</section>
	);
}

function WithdrawalRateCard({
	withdrawalRate,
	distribution,
}: {
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
				<Card className='cursor-help'>
					<TooltipTrigger asChild>
						<button
							type='button'
							aria-label={`退選率 ${withdrawalRateLabel}${withdrawalRate !== null ? `，${classification.label}` : ''}，查看退選率說明`}
							className='absolute inset-0 z-10 cursor-help rounded-[inherit] border-0 bg-transparent p-0 focus-visible:ring-[3px] focus-visible:ring-[rgba(var(--vs-primary),0.28)] focus-visible:outline-none'
							onClick={handleTooltipClick}
						/>
					</TooltipTrigger>
					<CardTitle className='flex flex-wrap items-start justify-between gap-2'>
						{withdrawalRateLabel}
						{withdrawalRate !== null ? (
							<WithdrawalRateBadge level={classification.level} label={classification.label} />
						) : null}
					</CardTitle>
					<p className='inline-flex items-center gap-1'>
						退選率
						<Info aria-hidden='true' className='inline size-[1em] align-[-0.125em] opacity-70' />
					</p>
				</Card>
				<TooltipContent
					side='bottom'
					align='center'
					sideOffset={8}
					className='rounded-panel max-w-[min(20rem,calc(100vw-2rem))] border border-[rgba(var(--vs-text),0.12)] bg-[rgb(var(--vs-background))] p-3 text-left text-sm leading-5 text-[rgb(var(--vs-text))] shadow-[0_12px_32px_rgba(15,23,42,0.18)]'
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
			<span className='inline-flex items-center gap-1'>
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

function SyllabusDetail({ item }: { item: SyllabusItem }) {
	const officeHoursUrl = officialCourseUrl(item.officeHoursLink, 'mobile');
	const additionalFields = Object.entries(item).filter(
		([key]) => !syllabusMetadata.has(key) && !Object.hasOwn(syllabusTextFields, key),
	);
	return (
		<div className='flex flex-col gap-4'>
			{item.covid19 ? <CovidInfo covid19={item.covid19} /> : null}
			<section className='flex flex-col gap-2'>
				<h3>教師</h3>
				<HtmlText as='p' text={[item.name, item.email].filter(Boolean).join(' ') || '無資料'} />
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
			</section>
			{Object.entries(syllabusTextFields).map(([key, label]) => (
				<TextSection key={key} label={label} value={item[key]} />
			))}
			{additionalFields.map(([key, value]) => (
				<TextSection key={key} label={key} value={value} />
			))}
			{/* The crawler also emits false when the school's answer is blank. */}
			{item.foreignLanguageTextbooks === true ? <h3>使用外文原文書籍：是</h3> : null}
			{item.latestUpdate?.trim() ? (
				<section className='flex flex-col gap-2'>
					<h3>最後更新</h3>
					<p className='my-0'>{formatLatestUpdate(item.latestUpdate)}</p>
				</section>
			) : null}
		</div>
	);
}

const emptySyllabusText = new Set(['無', '● 無 (None)', '無（None）', '● 無（None）']);

function TextSection({ label, value }: { label: string; value: unknown }) {
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
	if (!text || emptySyllabusText.has(text)) return null;
	return (
		<section className='flex min-w-0 flex-col gap-2'>
			<h3>{label}</h3>
			<HtmlText as='p' text={formatSyllabusText(text)} />
		</section>
	);
}

function formatSyllabusText(text: string) {
	return text.replace(/([^\n])●/g, '$1\n●').replace(/([)）])[ \t]*(?=SDG\d+[:：])/g, '$1\n');
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
		<section className='flex min-w-0 flex-col gap-4'>
			<h2>因應疫情所致之上課方式</h2>
			<p className='my-0'>實際實施日期與上課方式，依學校公布之訊息為主</p>
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
		<section className='mt-2 flex min-w-0 flex-col gap-2 border-t border-[rgba(var(--vs-text),0.1)] pt-4 text-sm text-[rgba(var(--vs-text),0.72)]'>
			<h3 className='text-base font-medium'>學校原始資料</h3>
			<ul className='flex flex-wrap gap-x-4 gap-y-2'>
				{links.map((link, index) => (
					<li key={`${link.url}-${index}`}>
						<a
							className={courseTextLinkClassName}
							href={link.url!}
							target='_blank'
							rel='noreferrer'
						>
							{link.label}
						</a>
					</li>
				))}
			</ul>
		</section>
	);
}
