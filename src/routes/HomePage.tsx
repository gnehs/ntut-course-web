import type React from 'react';
import { useEffect, useState } from 'react';
import {
	BookOpen,
	Calendar,
	CalendarPlus,
	Clock,
	FileText,
	Ghost,
	GraduationCap,
	History,
	Info,
	Puzzle,
	Search,
	Settings,
	Terminal,
	User,
	UserX,
} from 'lucide-react';
import { AdsByGoogle } from '../components/AdsByGoogle';
import { fetchCalendar } from '../lib/courseApi';
import { displayDepartment } from '../lib/courseUtils';
import { useApp } from '../state/AppContext';
import { UniversalSearch } from '../components/UniversalSearch';
import { Card } from '../components/ui-kit/Card';
import { CardTitle } from '../components/ui-kit/CardTitle';
import type { Course } from '../types/course';

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
		async function load() {
			const ids = getMyCourseIds();
			if (!ids.length) {
				setItems([]);
				return;
			}
			const courses = (await getCourses()).filter((course) => ids.includes(course.id));
			const today = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()];
			const next = courses.filter((course) => course.time?.[today]?.length).slice(0, 3);
			if (!cancelled) setItems(next);
		}
		load().catch(() => setItems([]));
		return () => {
			cancelled = true;
		};
	}, [dataset.year, dataset.sem, dataset.department]);

	if (!items?.length) return null;
	return (
		<PageSection title='接下來的課程'>
			<div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
				{items.map((course) => (
					<Card
						className='px-4 py-3'
						key={course.id}
						to={`/course/${dataset.year}/${dataset.sem}/${course.id}`}
					>
						<CardTitle>{course.name?.zh || '未命名課程'}</CardTitle>
						<p>{(course.teacher || []).map((item) => item.name).join('、')}</p>
						<Clock data-card-icon />
					</Card>
				))}
			</div>
		</PageSection>
	);
}

export function HomePage() {
	const { dataset, setDatasetDialogOpen } = useApp();
	const standardURL = useStandardUrl();

	useEffect(() => {
		fetchCalendar().catch(() => {});
	}, []);

	return (
		<div className='grid gap-6'>
			<div className='grid gap-3'>
				<button
					type='button'
					className='rounded-control inline-flex min-h-11 w-fit items-center border border-[rgba(var(--vs-text),0.25)] px-3 py-1 text-sm text-[rgba(var(--vs-text),0.75)] transition-colors hover:bg-[rgba(var(--vs-text),0.05)]'
					onClick={() => setDatasetDialogOpen(true)}
				>
					{displayDepartment(dataset.department)}
				</button>
				<h1 className='m-0 text-[clamp(1.75rem,4vw,2rem)] leading-tight font-semibold'>
					{dataset.year} 年{dataset.sem === '1' ? '上' : '下'}學期
				</h1>
			</div>
			<UniversalSearch className='block md:hidden' />
			<section aria-label='常用功能' className='grid gap-3 md:grid-cols-3'>
				{[
					{
						to: `/advanced-search?year=${dataset.year}&sem=${dataset.sem}&d=${dataset.department}`,
						title: '搜尋',
						text: '找課程、教師與上課時段',
						icon: Search,
					},
					{ to: '/my-course', title: '我的課程', text: '整理收藏，檢查課表是否衝堂', icon: User },
					{ to: '/class', title: '班級課表', text: '從班級開始安排這學期', icon: Clock },
				].map(({ to, title, text, icon: Icon }) => (
					<Card key={to} to={to} className='flex items-center gap-4 p-4 md:flex-col md:items-start'>
						<span className='rounded-control grid size-11 shrink-0 place-items-center bg-[rgba(var(--vs-primary),0.12)] text-[rgb(var(--vs-primary))]'>
							<Icon className='size-5' aria-hidden='true' />
						</span>
						<div className='grid min-w-0 gap-1'>
							<h2 className='m-0 text-xl font-semibold'>{title}</h2>
							<p>{text}</p>
						</div>
					</Card>
				))}
			</section>
			<UpcomingCourse />
			<PageSection title='探索課程'>
				<HomeCardGrid
					items={[
						{ to: '/program', title: '一般學程', text: '查看學程規劃與開課課程', icon: BookOpen },
						{
							to: '/mprogram',
							title: '微學程',
							text: '查詢微學程課程',
							icon: BookOpen,
						},
					]}
				/>
			</PageSection>
			<PageSection title='實用'>
				<HomeCardGrid
					items={[
						{
							to: standardURL,
							title: '課程標準',
							text: '查看各系所畢業標準等相關資訊',
							icon: GraduationCap,
						},
						{
							to: '/emptyroom',
							title: '尋找空教室',
							text: '查看沒有課程進行的教室',
							icon: Ghost,
						},
						{
							to: '/competencies',
							title: '核心能力',
							text: '查看系所課程與核心能力對照',
							icon: GraduationCap,
						},
						{
							to: '/withdrawal',
							title: '退選率',
							text: '查看所有教師的退選率',
							icon: UserX,
						},
						{ to: '/calendar', title: '行事曆', text: '查看學校行事曆', icon: Calendar },
						{
							to: `/widget?year=${dataset.year}`,
							title: 'iOS 小工具',
							text: '在桌面上檢視接下來的課程',
							icon: Puzzle,
						},
						{
							to: `/add-calendar?year=${dataset.year}`,
							title: '新增課程到行事曆',
							text: '將我的課程匯入至行事曆',
							icon: CalendarPlus,
						},
					]}
				/>
			</PageSection>
			<PageSection title='其他'>
				<HomeCardGrid
					items={[
						{
							to: '/doc',
							title: '文件',
							text: 'API 文件與嵌入頁面相關功能介紹與說明',
							icon: FileText,
						},
						{
							to: '/changelog',
							title: '更新日誌',
							text: '查看本站最近的更新日誌',
							icon: History,
						},
						{ to: '/about', title: '關於', text: '關於本網站', icon: Info },
						{ to: '/privacy', title: '隱私權政策', text: '隱私權政策', icon: Info },
						{
							to: '/status',
							title: '擷取狀態',
							text: '查看爬蟲資料擷取狀態',
							icon: Terminal,
						},
						{ to: '/settings', title: '設定', text: '課程資料庫、資料匯出等', icon: Settings },
					]}
				/>
			</PageSection>
			<PageSection title='贊助商廣告'>
				<AdsByGoogle />
				<p style={{ textAlign: 'center', fontSize: '.75em', opacity: 0.75 }}>
					本站資料擷取自{' '}
					<a href='https://aps.ntut.edu.tw/course/tw/course.jsp' target='_blank' rel='noreferrer'>
						國立臺北科技大學課程系統
					</a>
					，資料僅供參考，可能會有所遺漏或錯誤，正式資料仍以學校公佈為主。
				</p>
			</PageSection>
		</div>
	);
}

function PageSection({ title, children }) {
	return (
		<section className='grid gap-3'>
			<h2 className='m-0'>{title}</h2>
			{children}
		</section>
	);
}

function HomeCardGrid({
	items,
}: {
	items: {
		to: string;
		title: string;
		text: string;
		icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	}[];
}) {
	return (
		<div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
			{items.map((item) => (
				<HomeCard item={item} key={item.to} />
			))}
		</div>
	);
}

function HomeCard({
	item,
}: {
	item: {
		to: string;
		title: string;
		text: string;
		icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	};
}) {
	const Icon = item.icon;
	return (
		<Card className='px-4 py-3' to={item.to}>
			<CardTitle>{item.title}</CardTitle>
			<p>{item.text}</p>
			<Icon data-card-icon aria-hidden='true' />
		</Card>
	);
}
