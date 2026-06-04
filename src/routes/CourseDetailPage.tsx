import { AdsByGoogle } from '../components/AdsByGoogle';
import { Link, useParams } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import type React from 'react';
import { Alert } from '../components/ui-kit/Alert';
import { Button } from '../components/ui-kit/Button';
import { Card } from '../components/ui-kit/Card';
import { CardTitle } from '../components/ui-kit/CardTitle';
import { CourseDetailSkeleton } from '../components/ui-kit/PageSkeletons';
import { fetchCourseDetail, fetchWithdrawalRate } from '../lib/courseApi';
import {
	courseStandard,
	getSportsCourseIcon,
	getSportsCourseTitle,
	hasTimeConflict,
	isSportsCourse,
	parseCourseTime,
} from '../lib/courseUtils';
import { useApp } from '../state/AppContext';
import type { Course, SyllabusItem } from '../types/course';
import { errorMessage } from '../lib/error';

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

	if (error) return <Alert danger>找不到課程或資料擷取失敗：{errorMessage(error)}</Alert>;
	if (!course) return <CourseDetailSkeleton />;
	const currentCourse = course;

	function toggleCourse() {
		if (isInMyCourse) removeCourse(currentCourse.id);
		else addCourse(currentCourse.id);
		setVersion((value) => value + 1);
	}

	return (
		<div>
			<div className='flex flex-wrap items-center justify-between gap-3'>
				<div className='min-w-0 flex-1'>
					<h2 className='m-0 text-2xl leading-[1.25] font-bold'>
						<CourseDetailTitle course={currentCourse} />
						<br />
						<span className='text-base font-normal opacity-80'>{currentCourse.name?.en}</span>
					</h2>
				</div>
				<div className='r'>
					<Button primary={!isInMyCourse} danger={isInMyCourse} onClick={toggleCourse}>
						<i className={`bx ${isInMyCourse ? 'bx-minus' : 'bx-plus'}`} />
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
			<div className='mt-4 grid gap-3 sm:grid-cols-3'>
				<Card>
					<CardTitle>{currentCourse.id}</CardTitle>
					<p>課號</p>
				</Card>
				<Card>
					<CardTitle>{course.credit}</CardTitle>
					<p>學分</p>
				</Card>
				<Card>
					<CardTitle>{withdrawalRate ? `${withdrawalRate}%` : '無資料'}</CardTitle>
					<p>
						退選率 <i className='bx bx-info-circle' />
					</p>
				</Card>
			</div>
			<div className='mt-3 grid gap-3 lg:grid-cols-3'>
				<InfoCard
					icon='bx-info-circle'
					title='課程資訊'
					items={[
						[
							'課程標準',
							`${course.courseType || ''} ${course.courseType ? courseStandard[course.courseType] || '' : ''}`,
						],
						['人數', `${course.people ?? '無資料'} 人`],
						...(Number(course.peopleWithdraw) > 0 ? [['退選', `${course.peopleWithdraw} 人`]] : []),
						['時數', `${course.hours ?? '無資料'} 小時`],
						...(Number(course.stage) > 1 ? [['階段', course.stage]] : []),
					]}
				/>
				<InfoCard
					icon='bx-user'
					title='授課資訊'
					items={[
						[
							'教師',
							<InlineLinks
								items={(course.teacher || []).map((item) => ({
									label: item.name,
									to: `/teacher/${item.name}`,
								}))}
								fallback='無資料'
							/>,
						],
						[
							'班級',
							<InlineLinks
								items={(course.class || []).map((item) => ({
									label: item.name,
									to: `/class/${year}/${sem}/${item.name}`,
								}))}
							/>,
						],
						['備註', <HtmlText text={course.notes || '無'} />],
					]}
				/>
				<InfoCard
					icon='bx-map'
					title='上課資訊'
					items={[
						[
							'教室',
							course.classroom?.length
								? course.classroom.map((item) => item.name).join('、')
								: '無資料',
						],
						...(parseCourseTime(course.time).length
							? parseCourseTime(course.time).map((item) => [item.title, item.content])
							: [['上課時間', '尚無資訊']]),
					]}
				/>
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
					<select
						className='w-full max-w-[260px] rounded-[12px] border border-[rgba(var(--vs-text),0.12)] bg-[rgb(var(--vs-background))] px-3 py-2 outline-none'
						value={selectedSyllabusIndex}
						onChange={(event) => setSelectedSyllabusIndex(event.target.value)}
					>
						{syllabus.map((item, index) => (
							<option key={`${item.name}-${index}`} value={String(index)}>
								{item.name}
							</option>
						))}
					</select>
				</Alert>
			) : null}
			{selectedSyllabus ? <SyllabusDetail item={selectedSyllabus} /> : null}
		</div>
	);
}

function InfoCard({ icon, title, items }) {
	return (
		<section className='rounded-[8px] border border-[rgba(var(--vs-text),0.1)] bg-[rgb(var(--vs-background))] p-3 leading-[1.5]'>
			<div className='text-xl'>
				<i className={`bx ${icon}`} />
			</div>
			<div className='mb-2 text-base font-bold'>{title}</div>
			<div className='grid gap-2 md:grid-cols-2'>
				{items.map(([itemTitle, content]) => (
					<div className='grid gap-0 md:gap-1' key={itemTitle}>
						<div className='text-sm font-bold whitespace-nowrap'>{itemTitle}</div>
						<div className='text-sm opacity-75'>{content}</div>
					</div>
				))}
			</div>
		</section>
	);
}

function CourseDetailTitle({ course }: { course: Course }) {
	if (isSportsCourse(course)) {
		const title = getSportsCourseTitle(course);
		const icon = getSportsCourseIcon(title);
		return (
			<span className='inline-flex items-center gap-1'>
				{icon ? <i className={icon} /> : null}
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
			<Link className='text-[rgb(var(--vs-primary))]' to={item.to}>
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
	return <Component dangerouslySetInnerHTML={{ __html: parseTextarea(text) }} />;
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
				<div className='font-bold'>
					若疫情為 <strong>ㄧ級</strong>警戒
				</div>
				<div>實體授課</div>
			</div>
			<div className='mt-3 border-l-4 border-[#e6e6e6] pl-3'>
				<div className='font-bold'>
					若疫情為 <strong>二級</strong>警戒
				</div>
				<HtmlText as='div' text={covid19.lv2Method || covid19.lv2Description || '尚無對策'} />
			</div>
			<div className='mt-3 border-l-4 border-[#e6e6e6] pl-3'>
				<div className='font-bold'>
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
