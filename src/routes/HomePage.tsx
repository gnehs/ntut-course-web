import type React from 'react';
import { useEffect, useState } from 'react';
import {
	BookOpen,
	Building2,
	Calendar,
	CalendarPlus,
	ChartNoAxesColumnIncreasing,
	ChevronRight,
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
import { Link } from '@tanstack/react-router';
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
						<div className='min-w-0'>
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
			to: '/class',
			title: '班級課表',
			text: '查詢各班開課與課表',
			icon: UsersRound,
		},
		{
			to: '/my-course',
			title: '我的課程',
			text: '收藏課程、檢查衝堂',
			icon: UserRound,
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
						<PrimaryActionCard item={item} key={item.to} />
					))}
				</div>
			</section>

			<UpcomingCourse />

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
			<h2
				id={headingId}
				className='text-muted-foreground m-0 scroll-mt-20 px-1 text-sm font-medium'
			>
				{title}
			</h2>
			{children}
		</section>
	);
}

// Primary actions carry the brand colour; everything else on the page stays neutral.
function PrimaryActionCard({ item }: { item: HomeLink }) {
	const Icon = item.icon;
	return (
		<Card className='flex items-center gap-3 p-4' to={item.to}>
			<span
				aria-hidden='true'
				className='rounded-control flex size-10 shrink-0 items-center justify-center bg-[rgb(var(--vs-primary))] text-[rgb(var(--vs-primary-foreground))]'
			>
				<Icon className='size-5' />
			</span>
			<div className='min-w-0'>
				<CardTitle>{item.title}</CardTitle>
				<p>{item.text}</p>
			</div>
		</Card>
	);
}

// Secondary destinations share one surface so they read as a list, not as competing cards.
function HomeLinkList({ items }: { items: HomeLink[] }) {
	return (
		<Card className='!p-0'>
			{items.map((item) => {
				const Icon = item.icon;
				return (
					<Link
						key={item.to}
						to={item.to}
						className='group flex min-h-14 items-center gap-3 border-t px-4 py-2.5 !text-[rgb(var(--vs-text))] !no-underline transition-colors duration-200 first:border-t-0 hover:bg-[rgba(var(--vs-text),0.04)] focus-visible:bg-[rgba(var(--vs-text),0.06)] focus-visible:outline-none'
					>
						<Icon className='text-muted-foreground size-5 shrink-0' aria-hidden='true' />
						<div className='min-w-0 flex-1'>
							<div className='font-medium'>{item.title}</div>
							<p>{item.text}</p>
						</div>
						<ChevronRight
							className='text-icon-subtle group-hover:text-icon-muted size-4 shrink-0 transition-[color,translate] duration-200 group-hover:translate-x-0.5'
							aria-hidden='true'
						/>
					</Link>
				);
			})}
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
		<section aria-labelledby='site-heading' className='flex flex-col gap-1 border-t pt-3'>
			<h2 id='site-heading' className='text-muted-foreground m-0 px-1 text-sm font-medium'>
				網站與資料
			</h2>
			<nav aria-label='網站與資料連結' className='-mx-1 flex flex-wrap gap-x-1'>
				{links.map(({ to, title, icon: Icon }) => (
					<Link
						key={to}
						to={to}
						className='rounded-surface !text-muted-foreground hover:!text-foreground flex min-h-11 items-center gap-1.5 px-2 text-sm !no-underline transition-colors duration-200 hover:bg-[rgba(var(--vs-text),0.05)] sm:min-h-9'
					>
						<Icon className='size-4 shrink-0' aria-hidden='true' />
						<span>{title}</span>
					</Link>
				))}
			</nav>
		</section>
	);
}
