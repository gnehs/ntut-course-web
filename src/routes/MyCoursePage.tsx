import { AdsByGoogle } from '../components/AdsByGoogle';
import { useEffect, useMemo, useState } from 'react';
import { CourseList } from '../components/CourseList';
import { Alert } from '../components/ui-kit/Alert';
import { Button } from '../components/ui-kit/Button';
import { Card } from '../components/ui-kit/Card';
import { CardTitle } from '../components/ui-kit/CardTitle';
import { ClassDetailSkeleton } from '../components/ui-kit/PageSkeletons';
import { useApp } from '../state/AppContext';
import type { Course } from '../types/course';

export function MyCoursePage() {
	const { dataset, getCourses, getMyCourseIds, myCourseKey, myCourseClassKey } = useApp();
	const [courses, setCourses] = useState<Course[] | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [version, setVersion] = useState(0);

	useEffect(() => {
		let cancelled = false;
		async function load() {
			const ids = getMyCourseIds();
			const all = await getCourses();
			if (!cancelled) setCourses(all.filter((course) => ids.includes(course.id)));
		}
		load().catch(() => setCourses([]));
		return () => {
			cancelled = true;
		};
	}, [dataset.year, dataset.sem, dataset.department, version]);

	const credit = useMemo(
		() => (courses || []).reduce((sum, course) => sum + Number(course.credit || 0), 0),
		[courses],
	);
	const hours = useMemo(
		() => (courses || []).reduce((sum, course) => sum + Number(course.hours || 0), 0),
		[courses],
	);

	function exportData() {
		const payload = {
			key: myCourseKey(),
			data: localStorage.getItem(myCourseKey()),
			classKey: myCourseClassKey(),
			classData: localStorage.getItem(myCourseClassKey()),
		};
		prompt('請複製以下資料：', JSON.stringify(payload));
	}

	function importData() {
		const raw = prompt('請貼上先前複製的資料：');
		if (!raw) return;
		const data = JSON.parse(raw);
		if (data.key && data.data) localStorage.setItem(data.key, data.data);
		if (data.classKey && data.classData) localStorage.setItem(data.classKey, data.classData);
		setMessage(`已匯入 ${JSON.parse(data.data || '[]').length} 筆課程到我的課程`);
		setVersion((value) => value + 1);
	}

	if (!courses) return <ClassDetailSkeleton />;

	return (
		<div>
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
				<div className='flex flex-wrap justify-end'>
					<Button onClick={exportData}>
						<i className='bx bxs-file-export' />
						匯出
					</Button>
					<Button onClick={importData}>
						<i className='bx bxs-file-import' />
						匯入
					</Button>
				</div>
			</div>
			<p style={{ marginTop: '-1em' }}>
				你可以在這裡儲存一些課程供未來選課時參考用，在此處的課程會與其他課程比對並顯示是否衝堂。
			</p>
			{!courses.length ? (
				<Alert>
					<strong>尚未儲存任何課程</strong>
					<br />
					你可以在班級頁面或是課程頁面右上方找到「加入我的課程」按鈕！
					<br />
					若這裡沒有先前加入的課程，可能是選擇了錯誤的資料集，請嘗試於右上按鈕切換資料集。
				</Alert>
			) : null}
			{courses.length ? (
				<>
					<h3>建議</h3>
					<div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
						<Card className='px-4 py-3' to={`/widget?year=${dataset.year}`}>
							<CardTitle>iOS 小工具</CardTitle>
							<p>在桌面上檢視接下來的課程</p>
							<i className='bx bx-extension' />
						</Card>
						<Card className='px-4 py-3' to={`/add-calendar?year=${dataset.year}`}>
							<CardTitle>新增到行事曆</CardTitle>
							<p>將我的課程匯入至行事曆</p>
							<i className='bx bx-calendar' />
						</Card>
					</div>
					<h3>課程</h3>
					<div className='grid grid-cols-3 gap-3'>
						<Card>
							<CardTitle>{credit}</CardTitle>
							<p>學分</p>
							<i className='bx bx-book' />
						</Card>
						<Card>
							<CardTitle>{hours}</CardTitle>
							<p>時數</p>
							<i className='bx bx-time' />
						</Card>
						<Card>
							<CardTitle>{courses.length}</CardTitle>
							<p>課程數</p>
							<i className='bx bx-category-alt' />
						</Card>
					</div>
					<CourseList courses={courses} showTimetable />
				</>
			) : null}
			{message ? (
				<Alert>
					<strong>匯入完成！</strong>
					<br />
					{message}
				</Alert>
			) : null}
			<h3>贊助商廣告</h3>
			<AdsByGoogle />
		</div>
	);
}
