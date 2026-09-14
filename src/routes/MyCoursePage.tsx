import { AdsByGoogle } from '../components/AdsByGoogle';
import { Link } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { CourseList } from '../components/CourseList';
import { BookOpen, Calendar, Clock, Puzzle, Search, Shapes } from 'lucide-react';
import { Alert } from '../components/ui-kit/Alert';
import { Button } from '../components/ui-kit/Button';
import { Card } from '../components/ui-kit/Card';
import { CardTitle } from '../components/ui-kit/CardTitle';
import { ClassDetailSkeleton } from '../components/ui-kit/PageSkeletons';
import { formatCredit } from '../lib/courseUtils';
import { errorMessage } from '../lib/error';
import { useApp } from '../state/AppContext';
import type { Course } from '../types/course';

export function MyCoursePage() {
	const { dataset, getCourses, getMyCourseIds } = useApp();
	const [courses, setCourses] = useState<Course[] | null>(null);
	const [loadError, setLoadError] = useState<unknown>(null);
	const [version, setVersion] = useState(0);

	useEffect(() => {
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
				<h3 className='mb-4'>贊助商廣告</h3>
				<AdsByGoogle />
			</div>
		);
	}

	if (!courses) return <ClassDetailSkeleton />;

	return (
		<div className='space-y-4'>
			{courses.length ? (
				<Alert>
					<strong>提醒</strong>
					<br />
					請注意，本資料僅儲存在瀏覽器中，可能會隨時消失！
				</Alert>
			) : null}
			<div className='flex flex-wrap items-center justify-between gap-2'>
				<div>
					<h1>我的課程</h1>
				</div>
			</div>
			<p style={{ marginTop: '-1em' }}>
				你可以在這裡儲存一些課程供未來選課時參考用，在此處的課程會與其他課程比對並顯示是否衝堂。
			</p>
			<p className='m-0 text-sm opacity-75'>
				需要備份或移轉所有學期的資料嗎？請到 <Link to='/settings'>設定</Link> 管理我的課程備份。
			</p>
			{!courses.length ? (
				<Alert>
					<strong>尚未儲存任何課程</strong>
					<br />
					你可以在班級頁面或是課程頁面右上方找到「加入我的課程」按鈕！
					<br />
					若這裡沒有先前加入的課程，可能是選擇了錯誤的資料集，請嘗試於右上按鈕切換資料集。
					<div className='mt-3 flex flex-wrap gap-2'>
						<Button
							as={Link}
							primary
							to={`/advanced-search?year=${dataset.year}&sem=${dataset.sem}&d=${dataset.department}`}
						>
							<Search className='size-4' />
							前往搜尋
						</Button>
						<Button as={Link} to='/class'>
							<Clock className='size-4' />
							班級課表
						</Button>
					</div>
				</Alert>
			) : null}
			{courses.length ? (
				<>
					<h3>建議</h3>
					<div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
						<Card className='px-4 py-3' to={`/widget?year=${dataset.year}`}>
							<CardTitle>iOS 小工具</CardTitle>
							<p>在桌面上檢視接下來的課程</p>
							<Puzzle data-card-icon />
						</Card>
						<Card className='px-4 py-3' to={`/add-calendar?year=${dataset.year}`}>
							<CardTitle>新增到行事曆</CardTitle>
							<p>將我的課程匯入至行事曆</p>
							<Calendar data-card-icon />
						</Card>
					</div>
					<h3>課程</h3>
					<div className='grid grid-cols-3 gap-3'>
						<Card>
							<CardTitle>{formatCredit(credit)}</CardTitle>
							<p>學分</p>
							<BookOpen data-card-icon />
						</Card>
						<Card>
							<CardTitle>{hours}</CardTitle>
							<p>時數</p>
							<Clock data-card-icon />
						</Card>
						<Card>
							<CardTitle>{courses.length}</CardTitle>
							<p>課程數</p>
							<Shapes data-card-icon />
						</Card>
					</div>
					<CourseList courses={courses} showTimetable />
				</>
			) : null}
			<h3 className='mb-4'>贊助商廣告</h3>
			<AdsByGoogle />
		</div>
	);
}
