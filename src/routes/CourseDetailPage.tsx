import { AdsByGoogle } from '../components/AdsByGoogle';
import { Link, useParams } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import type React from 'react';
import { Info, MapPin, Minus, Plus, User } from 'lucide-react';
import { Alert } from '../components/ui-kit/Alert';
import { Button } from '../components/ui-kit/Button';
import { Card } from '../components/ui-kit/Card';
import { CardTitle } from '../components/ui-kit/CardTitle';
import { CourseDetailSkeleton } from '../components/ui-kit/PageSkeletons';
import { Select, SelectOption } from '../components/ui-kit/Select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { SportsCourseIcon } from '../components/SportsCourseIcon';
import { fetchCourseDetail, fetchWithdrawalRate } from '../lib/courseApi';
import {
	courseStandard,
	getSportsCourseTitle,
	hasTimeConflict,
	isSportsCourse,
	parseCourseTime,
} from '../lib/courseUtils';
import { coursePageTitle, usePageTitle } from '../lib/pageTitle';
import { useApp } from '../state/AppContext';
import type { Course, SyllabusItem } from '../types/course';
import { errorMessage } from '../lib/error';

type InfoCardItem = [string, React.ReactNode];

export function CourseDetailPage() {
	const { year, sem, id } = useParams({ from: '/course/$year/$sem/$id' });
	const { getCourses, getMyCourseIds, addCourse, removeCourse } = useApp();
	const [course, setCourse] = useState<Course | null>(null);
	const [syllabus, setSyllabus] = useState<SyllabusItem[]>([]);
	const [relatedCourses, setRelatedCourses] = useState<Course[]>([]);
	const [withdrawalRate, setWithdrawalRate] = useState<number | null>(null);
	const [selectedSyllabusIndex, setSelectedSyllabusIndex] = useState('0');
	const [error, setError] = useState<unknown>(null);
	const [version, setVersion] = useState(0);

	useEffect(() => {
		let cancelled = false;
		async function load() {
			setError(null);
			try {
				const [detail, courses, rate] = await Promise.all([
					fetchCourseDetail(year, sem, id),
					getCourses({ year, sem }),
					fetchWithdrawalRate(''),
				]);
				if (cancelled) return;
				const found = courses.find((item) => item.id === id);
				if (!found) throw new Error('找不到課程');
				if ((found.teacher || []).some((teacher) => teacher.name === '朴維鎮')) {
					globalThis.location.href = '/not-found';
					return;
				}
				const detailItems = Array.isArray(detail) ? detail : [];
				const calcedWithdrawalRate = Math.max(
					...detailItems.map((item) => rate[item.name] ?? null).filter(Boolean),
					-1,
				);
				setCourse(found);
				setSyllabus(detailItems);
				setRelatedCourses(courses);
				setWithdrawalRate(calcedWithdrawalRate > 0 ? calcedWithdrawalRate : null);
			} catch (e) {
				if (!cancelled) setError(e);
			}
		}
		load();
		return () => {
			cancelled = true;
		};
	}, [year, sem, id]);

	const isInMyCourse = getMyCourseIds(year, sem).includes(id);
	const conflictCourses = useMemo(() => {
		if (!course) return [];
		const ids = getMyCourseIds(year, sem);
		return relatedCourses.filter(
			(item) => ids.includes(item.id) && item.id !== course.id && hasTimeConflict(course, item),
		);
	}, [course, relatedCourses, version]);
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
		if (isInMyCourse) removeCourse(currentCourse.id);
		else addCourse(currentCourse.id);
		setVersion((value) => value + 1);
	}

	return (
		<div className='space-y-4'>
			<div className='flex flex-wrap items-center justify-between gap-3'>
				<div>
					<h2 className='text-2xl font-semibold'>
						<CourseDetailTitle course={currentCourse} />
					</h2>
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
							<Link to={`/course/${year}/${sem}/${item.id}`}>{item.name?.zh}</Link>
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
						<CardTitle>{course.credit}</CardTitle>
						<p>學分</p>
					</Card>
					<WithdrawalRateCard withdrawalRate={withdrawalRate} />
				</div>
				<div className='mt-3 grid gap-3 lg:grid-cols-3'>
					<InfoCard
						icon={<Info />}
						title='課程資訊'
						items={[
							infoItem(
								'課程標準',
								`${course.courseType || ''} ${course.courseType ? courseStandard[course.courseType] || '' : ''}`,
							),
							infoItem('人數', `${course.people ?? '無資料'} 人`),
							...(Number(course.peopleWithdraw) > 0
								? [infoItem('退選', `${course.peopleWithdraw} 人`)]
								: []),
							infoItem('時數', `${course.hours ?? '無資料'} 小時`),
							...(Number(course.stage) > 1 ? [infoItem('階段', course.stage)] : []),
						]}
					/>
					<InfoCard
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
							infoItem('備註', <HtmlText text={course.notes || '無'} />),
						]}
					/>
					<InfoCard
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
			<h3 className='mt-5'>贊助商廣告</h3>
			<AdsByGoogle />
			<h3>課程概述</h3>
			<HtmlText text={course.description?.zh || ''} as='p' />
			<HtmlText text={course.description?.en || ''} as='p' />
			{syllabus.length > 1 ? (
				<Alert>
					<strong>含有多項資料</strong>
					<br />
					本課程含有多項資料可供查詢，請使用下拉式選單選取教師來查看資料。
					<br />
					<br />
					<Select
						value={selectedSyllabusIndex}
						onChange={(value) => setSelectedSyllabusIndex(value)}
					>
						{syllabus.map((item, index) => (
							<SelectOption key={`${item.name}-${index}`} value={String(index)}>
								{item.name}
							</SelectOption>
						))}
					</Select>
				</Alert>
			) : null}
			{selectedSyllabus ? <SyllabusDetail item={selectedSyllabus} /> : null}
		</div>
	);
}

function InfoCard({
	icon,
	title,
	items,
}: {
	icon: React.ReactNode;
	title: string;
	items: InfoCardItem[];
}) {
	return (
		<section className='rounded-lg border border-[rgba(var(--vs-text),0.1)] bg-[rgb(var(--vs-background))] p-3 leading-[1.5]'>
			<div>{icon}</div>
			<div className='my-2 text-base font-semibold'>{title}</div>
			<div className='grid gap-2 md:grid-cols-2'>
				{items.map(([itemTitle, content]) => (
					<div className='grid gap-0 md:gap-1' key={itemTitle}>
						<div className='text-sm font-semibold whitespace-nowrap'>{itemTitle}</div>
						<div className='text-sm opacity-75'>{content}</div>
					</div>
				))}
			</div>
		</section>
	);
}

function WithdrawalRateCard({ withdrawalRate }: { withdrawalRate: number | null }) {
	const [tooltipOpen, setTooltipOpen] = useState(false);

	return (
		<Card>
			<CardTitle>{withdrawalRate ? `${withdrawalRate}%` : '無資料'}</CardTitle>
			<p>
				退選率{' '}
				<TooltipProvider>
					<Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
						<TooltipTrigger
							asChild
							onBlur={() => setTooltipOpen(false)}
							onClick={() => setTooltipOpen(true)}
							onFocus={() => setTooltipOpen(true)}
							onMouseEnter={() => setTooltipOpen(true)}
							onMouseLeave={() => setTooltipOpen(false)}
							onPointerEnter={() => setTooltipOpen(true)}
							onPointerLeave={() => setTooltipOpen(false)}
						>
							<button
								type='button'
								aria-label='退選率說明'
								className='inline-flex cursor-help rounded align-[-0.125em] text-current outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--vs-primary))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--vs-background))]'
							>
								<Info className='size-[1em]' />
							</button>
						</TooltipTrigger>
						<TooltipContent
							side='bottom'
							align='center'
							sideOffset={8}
							className='max-w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-[rgba(var(--vs-text),0.12)] bg-[rgb(var(--vs-background))] p-3 text-left text-sm leading-5 text-[rgb(var(--vs-text))] shadow-[0_12px_32px_rgba(0,0,0,var(--vs-shadow-opacity,0.16))]'
						>
							<div className='flex flex-col gap-1'>
								<h4 className='text-sm font-semibold'>什麼是退選率？</h4>
								<div>這項資料由教師之退選人數計算而來。</div>
								<h4 className='mt-2 text-sm font-semibold'>退選率如何計算？</h4>
								<div>總退選人數 / 總選課人數</div>
								<h4 className='mt-2 text-sm font-semibold'>如果有多名教師，退選率會怎麼顯示？</h4>
								<div>若該課程有多名教師，則會顯示最高退選率之教師。</div>
								<h4 className='mt-2 text-sm font-semibold'>退選率多少算高？</h4>
								<div>
									根據近三年的統計資料，有半數教師退選率高於 1.20%；四分之一教師退選率高於
									2.91%，也就是說如果你看到退選率超過 3%，你就要小心了！
								</div>
							</div>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</p>
		</Card>
	);
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
	fallback = '',
}: {
	items: { to: string; label: string }[];
	fallback?: React.ReactNode;
}) {
	if (!items.length) return fallback;
	return items.map((item, index) => (
		<span key={item.to}>
			{index > 0 ? '、' : ''}
			<Link className='text-[rgb(var(--vs-primary))] underline underline-offset-2' to={item.to}>
				{item.label}
			</Link>
		</span>
	));
}

function HtmlText({
	text,
	as: Component = 'span',
}: {
	text: string;
	as?: keyof React.JSX.IntrinsicElements;
}) {
	return (
		<Component dangerouslySetInnerHTML={{ __html: parseTextarea(text) }} className='leading-5' />
	);
}

function parseTextarea(text) {
	return String(text || '')
		.replace(/\t/g, '　　')
		.replace(/\n/g, '<br/>');
}

function SyllabusDetail({ item }) {
	return (
		<div className='space-y-4'>
			{item.covid19 ? <CovidInfo covid19={item.covid19} /> : null}
			<h3>教師</h3>
			<p>
				{item.name} {item.email}
			</p>
			<h3>課程大綱</h3>
			<HtmlText as='p' text={item.objective} />
			<h3>課程進度</h3>
			<HtmlText as='p' text={item.schedule} />
			<h3>評量標準</h3>
			<HtmlText as='p' text={item.scorePolicy} />
			<h3>使用教材、參考書目或其他</h3>
			<HtmlText as='p' text={item.materials} />
			{item.consultation ? (
				<>
					<h3>課程諮詢管道</h3>
					<HtmlText as='p' text={item.consultation} />
				</>
			) : null}
			{item.remarks ? (
				<>
					<h3>備註</h3>
					<HtmlText as='p' text={item.remarks} />
				</>
			) : null}
			<h3>使用外文原文書籍：{item.foreignLanguageTextbooks ? '是' : '否'}</h3>
			<h3>最後更新</h3>
			<p>
				{timeSince(new Date(item.latestUpdate))}前 <small>{item.latestUpdate}</small>
			</p>
		</div>
	);
}

function CovidInfo({ covid19 }) {
	return (
		<div className='mt-4 rounded-[16px] border border-[rgba(var(--vs-text),0.2)] bg-[rgb(var(--vs-background))] px-4 py-3'>
			<h2>因應疫情所致之上課方式</h2>
			<p>實際實施日期與上課方式，依學校公布之訊息為主</p>
			<div className='mt-3 border-l-4 border-[#e6e6e6] pl-3'>
				<div className='font-semibold'>
					若疫情為 <strong>ㄧ級</strong>警戒
				</div>
				<div>實體授課</div>
			</div>
			<div className='mt-3 border-l-4 border-[#e6e6e6] pl-3'>
				<div className='font-semibold'>
					若疫情為 <strong>二級</strong>警戒
				</div>
				<HtmlText as='div' text={covid19.lv2Method || covid19.lv2Description || '尚無對策'} />
			</div>
			<div className='mt-3 border-l-4 border-[#e6e6e6] pl-3'>
				<div className='font-semibold'>
					若疫情為 <strong>三級</strong>警戒
				</div>
				<div>遠距上課</div>
			</div>
			{covid19.courseScoreMethod ? (
				<>
					<h3>評量方式</h3>
					<HtmlText as='p' text={covid19.courseScoreMethod} />
				</>
			) : null}
			{covid19.courseInfo ? (
				<>
					<h3>課程訊息公告</h3>
					<HtmlText as='p' text={covid19.courseInfo} />
				</>
			) : null}
			{covid19.courseURL ? (
				<>
					<h3>上課網址</h3>
					<HtmlText as='p' text={covid19.courseURL} />
				</>
			) : null}
			{covid19.contactInfo ? (
				<>
					<h3>學生加退選簽核及諮詢課程問題管道</h3>
					<HtmlText as='p' text={covid19.contactInfo} />
				</>
			) : null}
			{covid19.additionalInfo ? (
				<>
					<h3>補充說明資訊</h3>
					<HtmlText as='p' text={covid19.additionalInfo} />
				</>
			) : null}
		</div>
	);
}

function timeSince(date: Date) {
	const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
	const intervals: [string, number][] = [
		[' 年', 31536000],
		[' 月', 2592000],
		[' 天', 86400],
		[' 小時', 3600],
		[' 分鐘', 60],
	];
	for (const [label, size] of intervals) {
		const value = seconds / size;
		if (value > 1) return `${Math.floor(value)}${label}`;
	}
	return `${Math.floor(seconds)} 秒`;
}
