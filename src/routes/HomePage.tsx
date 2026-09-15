import type React from 'react';
import { useEffect, useState } from 'react';
import {
	BookOpen,
	Building2,
	Calendar,
	CalendarPlus,
	ChartNoAxesColumnIncreasing,
	CircleHelp,
	Clock3,
	FileText,
	GraduationCap,
	History,
	Info,
	Layers3,
	Puzzle,
	Search,
	Settings,
	Sparkles,
	Terminal,
	UserRound,
	UsersRound,
} from 'lucide-react';
import { AdsByGoogle } from '../components/AdsByGoogle';
import { UniversalSearch } from '../components/UniversalSearch';
import { Card } from '../components/ui-kit/Card';
import { CardTitle } from '../components/ui-kit/CardTitle';
import { fetchCalendar } from '../lib/courseApi';
import { displayDepartment, timetable } from '../lib/courseUtils';
import { useApp } from '../state/AppContext';
import type { Course } from '../types/course';

type HomeLink = {
	to: string;
	title: string;
	text: string;
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

function useStandardUrl() {
	const [url, setUrl] = useState('/standard');
	useEffect(() => {
		const raw = localStorage.getItem('data-standard-query');
		if (!raw) return;
		try {
			const query = JSON.parse(raw);
			setUrl(`/standard?year=${query.year}&system=${query.system}&department=${query.department}`);
		} catch {}
	}, []);
	return url;
}

function UpcomingCourse() {
	const { dataset, getCourses, getMyCourseIds } = useApp();
	const [items, setItems] = useState<Course[] | null>(null);

	useEffect(() => {
		let cancelled = false;
		setItems(null);
		async function load() {
			const ids = getMyCourseIds();
			if (!ids.length) {
				setItems([]);
				return;
			}
			const courses = (await getCourses()).filter((course) => ids.includes(course.id));
			const today = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()];
			const next = courses
				.filter((course) => course.time?.[today]?.length)
				.sort((a, b) => {
					const aSlot = timetable.indexOf(a.time[today]?.[0] || '');
					const bSlot = timetable.indexOf(b.time[today]?.[0] || '');
					return aSlot - bSlot;
				})
				.slice(0, 3);
			if (!cancelled) setItems(next);
		}
		load().catch(() => {
			if (!cancelled) setItems([]);
		});
		return () => {
			cancelled = true;
		};
	}, [dataset.year, dataset.sem, dataset.department]);

	if (!items?.length) return null;
	return (
		<PageSection title='今天的課程'>
			<div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
				{items.map((course) => (
					<Card
						className='px-4 py-3'
						key={course.id}
						to={`/course/${dataset.year}/${dataset.sem}/${course.id}`}
					>
						<div className='relative z-10 min-w-0 pr-6'>
							<CardTitle>{course.name?.zh || '未命名課程'}</CardTitle>
							<p>{(course.teacher || []).map((item) => item.name).join('、')}</p>
						</div>
						<Clock3 data-card-icon aria-hidden='true' />
					</Card>
				))}
			</div>
		</PageSection>
	);
}

export function HomePage() {
	const { dataset } = useApp();
	const standardURL = useStandardUrl();
	const hasDataset = Boolean(dataset.year && dataset.sem);
	const semesterLabel = hasDataset
		? `${dataset.year} 年${dataset.sem === '1' ? '上' : '下'}學期`
		: '正在載入學期';

	useEffect(() => {
		fetchCalendar().catch(() => {});
	}, []);

	const primaryActions: HomeLink[] = [
		{
			to: hasDataset
				? `/advanced-search?year=${dataset.year}&sem=${dataset.sem}&d=${dataset.department}`
				: '/advanced-search',
			title: '搜尋課程',
			text: '課名、教師、時段篩選',
			icon: Search,
		},
		{
			to: '/my-course',
			title: '我的課程',
			text: '收藏課程、檢查衝堂',
			icon: UserRound,
		},
		{
			to: '/class',
			title: '班級課表',
			text: '查詢各班開課與課表',
			icon: UsersRound,
		},
	];

	const planningLinks: HomeLink[] = [
		{ to: '/program', title: '一般學程', text: '查看學程規劃與開課課程', icon: BookOpen },
		{ to: '/mprogram', title: '微學程', text: '查詢跨領域微學程課程', icon: Layers3 },
		{
			to: standardURL,
			title: '課程標準',
			text: '對照畢業門檻與必修課程',
			icon: GraduationCap,
		},
		{
			to: '/competencies',
			title: '核心能力',
			text: '了解課程與系所能力的對照',
			icon: Sparkles,
		},
		{
			to: '/withdrawal',
			title: '退選率',
			text: '參考教師與課程退選統計',
			icon: ChartNoAxesColumnIncreasing,
		},
	];

	const toolLinks: HomeLink[] = [
		{ to: '/emptyroom', title: '尋找空教室', text: '查看目前沒有課程的教室', icon: Building2 },
		{ to: '/calendar', title: '學校行事曆', text: '掌握重要校務日期', icon: Calendar },
		{
			to: dataset.year ? `/add-calendar?year=${dataset.year}` : '/add-calendar',
			title: '匯入行事曆',
			text: '將我的課程加入個人行事曆',
			icon: CalendarPlus,
		},
		{
			to: dataset.year ? `/widget?year=${dataset.year}` : '/widget',
			title: 'iOS 小工具',
			text: '在桌面查看接下來的課程',
			icon: Puzzle,
		},
	];

	return (
		<div className='flex flex-col gap-6'>
			<header>
				<h1 className='m-0'>{semesterLabel}</h1>
				<p className='m-0 text-sm opacity-70'>{displayDepartment(dataset.department)}</p>
			</header>
			<UniversalSearch className='block md:hidden' />

			<section aria-label='常用功能'>
				<h2 className='sr-only'>常用功能</h2>
				<div className='grid gap-3 sm:grid-cols-3'>
					{primaryActions.map((item) => (
						<HomeLinkCard item={item} key={item.to} />
					))}
				</div>
			</section>

			<UpcomingCourse />
			<AdsByGoogle placement='section' />

			<div className='grid items-start gap-6 md:grid-cols-2'>
				<PageSection title='探索與規劃'>
					<HomeLinkList items={planningLinks} />
				</PageSection>
				<PageSection title='課表與校園工具'>
					<HomeLinkList items={toolLinks} />
				</PageSection>
			</div>

			<SiteNavigation />

			<section aria-labelledby='source-heading' className='flex flex-col gap-3'>
				<h2 id='source-heading' className='sr-only'>
					廣告與資料來源
				</h2>
				<AdsByGoogle placement='footer' />
				<p className='text-muted-foreground m-0 text-center text-xs leading-relaxed'>
					本站資料擷取自{' '}
					<a href='https://aps.ntut.edu.tw/course/tw/course.jsp' target='_blank' rel='noreferrer'>
						國立臺北科技大學課程系統
					</a>
					，資料僅供參考，可能會有所遺漏或錯誤，正式資料仍以學校公佈為主。
				</p>
			</section>
		</div>
	);
}

function PageSection({ title, children }: { title: string; children: React.ReactNode }) {
	const headingId = `home-${title.replaceAll(/\s/g, '-')}`;
	return (
		<section aria-labelledby={headingId} className='flex min-w-0 flex-col gap-3'>
			<h2 id={headingId} className='m-0 scroll-mt-20'>
				{title}
			</h2>
			{children}
		</section>
	);
}

function HomeLinkList({ items }: { items: HomeLink[] }) {
	return (
		<div className='grid gap-3'>
			{items.map((item) => (
				<HomeLinkCard item={item} key={item.to} />
			))}
		</div>
	);
}

function HomeLinkCard({ item }: { item: HomeLink }) {
	const Icon = item.icon;
	return (
		<Card className='px-4 py-3' to={item.to}>
			<div className='relative z-10 min-w-0 pr-6'>
				<CardTitle>{item.title}</CardTitle>
				<p>{item.text}</p>
			</div>
			<Icon data-card-icon aria-hidden='true' />
		</Card>
	);
}

function SiteNavigation() {
	const links = [
		{ to: '/settings', title: '設定', icon: Settings },
		{ to: '/status', title: '擷取狀態', icon: Terminal },
		{ to: '/doc', title: '文件', icon: FileText },
		{ to: '/changelog', title: '更新日誌', icon: History },
		{ to: '/about', title: '關於', icon: Info },
		{ to: '/privacy', title: '隱私權政策', icon: CircleHelp },
	];

	return (
		<section aria-labelledby='site-heading' className='flex flex-col gap-3 border-t pt-3'>
			<h2 id='site-heading' className='text-muted-foreground m-0 text-sm font-medium'>
				網站與資料
			</h2>
			<nav
				aria-label='網站與資料連結'
				className='grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6'
			>
				{links.map(({ to, title, icon: Icon }) => (
					<Card
						key={to}
						to={to}
						className='flex min-h-11 min-w-0 items-center gap-1.5 text-sm sm:min-h-9'
					>
						<Icon className='text-muted-foreground size-4 shrink-0' aria-hidden='true' />
						<span>{title}</span>
					</Card>
				))}
			</nav>
		</section>
	);
}
