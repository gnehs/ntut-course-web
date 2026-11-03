import { AdsByGoogle } from '../components/AdsByGoogle';
import { Link } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { CourseList, CourseListSkeleton } from '../components/CourseList';
import {
	IconBook,
	IconCalendar,
	IconClock,
	IconPuzzle,
	IconSearch,
	IconSparkles,
} from '@tabler/icons-react';
import { Alert } from '../components/ui-kit/Alert';
import { Button } from '../components/ui-kit/Button';
import { ActionList } from '../components/ui-kit/ActionList';
import { Skeleton } from '../components/ui/skeleton';
import { aiChatLinks, buildCourseAdvicePrompt } from '../lib/aiPrompt';
import { formatCredit } from '../lib/courseUtils';
import { errorMessage } from '../lib/error';
import { useApp } from '../state/AppContext';
import type { Course } from '../types/course';

const statsListClassName =
	'rounded-surface shadow-rest m-0 grid grid-cols-3 gap-px overflow-hidden bg-[color-mix(in_srgb,rgb(var(--vs-text))_12%,rgb(var(--vs-background)))]';
const statItemClassName =
	'flex min-w-0 flex-col-reverse gap-1 bg-[rgb(var(--vs-background))] px-4 py-3';
const statLabelClassName = 'text-xs leading-tight opacity-70';
const statValueClassName = 'm-0 truncate text-xl leading-tight font-semibold tabular-nums';

export function MyCoursePage() {
	const { dataset, getCourses, getMyCourseIds } = useApp();
	const [courses, setCourses] = useState<Course[] | null>(null);
	const [loadError, setLoadError] = useState<unknown>(null);
	const [version, setVersion] = useState(0);

	useEffect(() => {
		if (!dataset.year || !dataset.sem) return undefined;
		let cancelled = false;
		async function load() {
			setCourses(null);
			setLoadError(null);
			try {
				const ids = getMyCourseIds();
				const all = await getCourses();
				if (!cancelled) setCourses(all.filter((course) => ids.includes(course.id)));
			} catch (error) {
				if (!cancelled) {
					setLoadError(error);
					setCourses(null);
				}
			}
		}
		load();
		return () => {
			cancelled = true;
		};
	}, [dataset.year, dataset.sem, dataset.department, getCourses, getMyCourseIds, version]);

	const credit = useMemo(
		() => (courses || []).reduce((sum, course) => sum + Number(course.credit || 0), 0),
		[courses],
	);
	const hours = useMemo(
		() => (courses || []).reduce((sum, course) => sum + Number(course.hours || 0), 0),
		[courses],
	);
	const advicePrompt = useMemo(
		() => buildCourseAdvicePrompt({ ...dataset, courses: courses || [] }),
		[dataset, courses],
	);

	if (loadError) {
		return (
			<div className='space-y-4'>
				<div className='flex flex-wrap items-center justify-between gap-2'>
					<h1 className='m-0'>我的課程</h1>
				</div>
				<Alert danger>
					<strong>我的課程資料載入失敗</strong>
					<p className='mt-1 mb-0'>暫時無法取得課程資料，請稍後再試。</p>
					<p className='mt-1 mb-0 text-sm opacity-75'>{errorMessage(loadError)}</p>
					<div className='mt-3'>
						<Button primary onClick={() => setVersion((value) => value + 1)}>
							重新載入
						</Button>
					</div>
				</Alert>
				<AdsByGoogle title='贊助商廣告' />
			</div>
		);
	}

	// With nothing saved there is nothing to wait for, so the empty state shows straight away.
	const shownCourses =
		courses ?? (dataset.year && dataset.sem && !getMyCourseIds().length ? [] : null);
	if (!shownCourses) return <MyCourseSkeleton year={dataset.year} />;

	return (
		<div className='flex flex-col gap-6'>
			<MyCourseHeader />
			{!shownCourses.length ? (
				<section className='rounded-surface shadow-rest flex flex-col items-center gap-4 bg-[rgb(var(--vs-background))] px-6 py-12 text-center'>
					<div
						aria-hidden='true'
						className='tone-neutral shadow-soft bg-sheen-soft text-muted-foreground grid size-14 place-items-center rounded-full bg-[rgba(var(--vs-text),0.06)]'
					>
						<IconBook className='size-6' />
					</div>
					<div className='flex max-w-[30rem] flex-col gap-2'>
						<strong className='text-lg leading-snug'>尚未儲存任何課程</strong>
						<p className='m-0 text-sm leading-relaxed opacity-75'>
							在班級頁面或課程頁面按下「加入我的課程」就會出現在這裡。
							若先前加入的課程不見了，可能是選到了其他學期，請用右上角的按鈕切換。
						</p>
					</div>
					<div className='flex flex-wrap justify-center gap-2'>
						<Button
							as={Link}
							primary
							to={`/advanced-search?year=${dataset.year}&sem=${dataset.sem}&d=${dataset.department}`}
						>
							<IconSearch className='size-4' />
							前往搜尋
						</Button>
						<Button as={Link} to='/class'>
							<IconClock className='size-4' />
							班級課表
						</Button>
					</div>
				</section>
			) : (
				<>
					<dl className={statsListClassName}>
						{[
							{ name: '學分', value: formatCredit(credit) },
							{ name: '時數', value: hours },
							{ name: '課程數', value: shownCourses.length },
						].map((item) => (
							<div key={item.name} className={statItemClassName}>
								<dt className={statLabelClassName}>{item.name}</dt>
								<dd className={statValueClassName}>{item.value}</dd>
							</div>
						))}
					</dl>
					<CourseList courses={shownCourses} showTimetable />
					<MoreSections year={dataset.year} prompt={advicePrompt} />
				</>
			)}
			<section className='has-[[data-ad-collapsed]]:hidden'>
				<AdsByGoogle title='贊助商廣告' />
			</section>
		</div>
	);
}

function MyCourseHeader() {
	return (
		<header className='flex flex-col gap-2'>
			<h1 className='m-0'>我的課程</h1>
			<p className='m-0 opacity-80'>
				儲存課程供選課時參考，這裡的課程會與其他課程比對並顯示是否衝堂。
			</p>
			<p className='m-0 text-sm opacity-65'>
				資料僅儲存在這個瀏覽器中，可能會隨時消失；需要備份或移轉請到{' '}
				<Link to='/settings' className='text-[rgb(var(--vs-primary))] underline underline-offset-2'>
					設定
				</Link>
				。
			</p>
		</header>
	);
}

const sectionHeadingClassName = 'text-muted-foreground m-0 px-1 text-sm font-medium';

// Without a prompt the chat links have nowhere to go yet, so those rows hold their place but stay inert.
function MoreSections({ year, prompt }: { year: string; prompt?: string }) {
	return (
		<div className='grid items-start gap-6 md:grid-cols-2'>
			<section className='flex min-w-0 flex-col gap-3'>
				<h2 className={sectionHeadingClassName}>帶著課表走</h2>
				<ActionList
					items={[
						{
							to: `/widget?year=${year}`,
							title: 'iOS 小工具',
							text: '在桌面上檢視接下來的課程',
							icon: IconPuzzle,
						},
						{
							to: `/add-calendar?year=${year}`,
							title: '新增到行事曆',
							text: '將我的課程匯入至行事曆',
							icon: IconCalendar,
						},
					]}
				/>
			</section>
			<section className='flex min-w-0 flex-col gap-3'>
				<h2 className={sectionHeadingClassName}>請 AI 推薦課程</h2>
				<ActionList
					items={aiChatLinks.map((chat) => ({
						href: prompt === undefined ? undefined : chat.url(prompt),
						title: `問 ${chat.name}`,
						text: '帶入目前課表，推薦不會衝堂的課程',
						icon: IconSparkles,
					}))}
				/>
			</section>
		</div>
	);
}

function MyCourseSkeleton({ year }: { year: string }) {
	return (
		<div className='flex flex-col gap-6' aria-busy='true' aria-label='載入我的課程'>
			<MyCourseHeader />
			<dl className={statsListClassName}>
				{['學分', '時數', '課程數'].map((name) => (
					<div key={name} className={statItemClassName}>
						<dt className={statLabelClassName}>{name}</dt>
						<dd className={statValueClassName}>
							<Skeleton className='h-[1lh] w-10' />
						</dd>
					</div>
				))}
			</dl>
			<CourseListSkeleton showTimetable />
			<MoreSections year={year} />
		</div>
	);
}
