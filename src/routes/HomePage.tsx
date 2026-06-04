import { useEffect, useState } from 'react';
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
						<i className='bx bx-time absolute right-[0.1em] bottom-0 text-[48px] opacity-20' />
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
					className='inline-flex w-fit items-center rounded-full border border-[rgba(var(--vs-text),0.25)] px-3 py-1 text-sm text-[rgba(var(--vs-text),0.75)] transition-colors hover:bg-[rgba(var(--vs-text),0.05)]'
					onClick={() => setDatasetDialogOpen(true)}
				>
					{displayDepartment(dataset.department)}
				</button>
				<div className='text-[32px] leading-tight font-bold'>
					{dataset.year} 年{dataset.sem === '1' ? '上' : '下'}學期
				</div>
			</div>
			<UniversalSearch className='block md:hidden' />
			<UpcomingCourse />
			<PageSection title='課程'>
				<HomeCardGrid
					items={[
						{
							to: `/advanced-search?year=${dataset.year}&sem=${dataset.sem}&d=${dataset.department}`,
							title: '進階搜尋',
							text: '依條件搜尋課程',
							icon: 'bx bx-search',
						},
						{ to: '/class', title: '班級課表', text: '查看各班上課時間表', icon: 'bx bx-time' },
						{
							to: '/mprogram',
							title: '微學程',
							text: '查詢微學程課程',
							icon: 'bx bx-book-content',
						},
						{ to: '/my-course', title: '我的課程', text: '查看已儲存的課程', icon: 'bx bx-user' },
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
							icon: 'bx bxs-graduation',
						},
						{
							to: '/emptyroom',
							title: '尋找空教室',
							text: '查看沒有課程進行的教室',
							icon: 'bx bx-ghost',
						},
						{
							to: '/withdrawal',
							title: '退選率',
							text: '查看所有教師的退選率',
							icon: 'bx bx-user-x',
						},
						{ to: '/calendar', title: '行事曆', text: '查看學校行事曆', icon: 'bx bx-calendar' },
						{
							to: `/widget?year=${dataset.year}`,
							title: 'iOS 小工具',
							text: '在桌面上檢視接下來的課程',
							icon: 'bx bx-extension',
						},
						{
							to: `/add-calendar?year=${dataset.year}`,
							title: '新增課程到行事曆',
							text: '將我的課程匯入至行事曆',
							icon: 'bx bx-calendar-plus',
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
							icon: 'bx bx-file',
						},
						{
							to: '/changelog',
							title: '更新日誌',
							text: '查看本站最近的更新日誌',
							icon: 'bx bx-history',
						},
						{ to: '/about', title: '關於', text: '關於本網站', icon: 'bx bx-info-circle' },
						{ to: '/privacy', title: '隱私權政策', text: '隱私權政策', icon: 'bx bx-info-circle' },
						{
							to: '/status',
							title: '擷取狀態',
							text: '查看爬蟲資料擷取狀態',
							icon: 'bx bx-terminal',
						},
						{ to: '/settings', title: '設定', text: '課程資料庫、資料匯出等', icon: 'bx bx-cog' },
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

function HomeCardGrid({ items }) {
	return (
		<div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
			{items.map((item) => (
				<Card key={item.to} className='px-4 py-3' to={item.to}>
					<CardTitle>{item.title}</CardTitle>
					<p>{item.text}</p>
					<i className={`${item.icon} absolute right-[0.1em] bottom-0 text-[48px] opacity-20`} />
				</Card>
			))}
		</div>
	);
}
