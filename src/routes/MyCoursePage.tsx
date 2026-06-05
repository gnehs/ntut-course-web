import { AdsByGoogle } from '../components/AdsByGoogle';
import { useEffect, useMemo, useState } from 'react';
import { CourseList } from '../components/CourseList';
import { BookOpen, Calendar, Clock, FileInput, FileOutput, Puzzle, Shapes } from 'lucide-react';
import { toast } from 'sonner';
import { Alert } from '../components/ui-kit/Alert';
import { Button } from '../components/ui-kit/Button';
import { Card } from '../components/ui-kit/Card';
import { CardTitle } from '../components/ui-kit/CardTitle';
import { ClassDetailSkeleton } from '../components/ui-kit/PageSkeletons';
import { useApp } from '../state/AppContext';
import type { Course } from '../types/course';

type MyCourseExportData = {
	key?: unknown;
	data?: unknown;
	classKey?: unknown;
	classData?: unknown;
};

export function MyCoursePage() {
	const { dataset, getCourses, getMyCourseIds, myCourseKey, myCourseClassKey } = useApp();
	const [courses, setCourses] = useState<Course[] | null>(null);
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
		try {
			const data = JSON.parse(raw) as MyCourseExportData;
			if (typeof data.key === 'string' && typeof data.data === 'string') {
				localStorage.setItem(data.key, data.data);
			}
			if (typeof data.classKey === 'string' && typeof data.classData === 'string') {
				localStorage.setItem(data.classKey, data.classData);
			}
			const importedCourses = typeof data.data === 'string' ? JSON.parse(data.data) : [];
			const importedCourseCount = Array.isArray(importedCourses) ? importedCourses.length : 0;
			toast.success('匯入完成', {
				description: `已匯入 ${importedCourseCount} 筆課程到我的課程`,
			});
			setVersion((value) => value + 1);
		} catch {
			toast.error('匯入失敗', {
				description: '請確認貼上的資料格式是否正確',
			});
		}
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
				<div className='flex flex-wrap justify-end gap-2'>
					<Button onClick={exportData}>
						<FileOutput className='size-4' />
						匯出
					</Button>
					<Button onClick={importData}>
						<FileInput className='size-4' />
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
							<CardTitle>{credit}</CardTitle>
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
