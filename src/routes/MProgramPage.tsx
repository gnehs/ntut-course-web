import { AdsByGoogle } from '../components/AdsByGoogle';
import { useParams } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { CourseList } from '../components/CourseList';
import { Check, Minus, Plus, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { Alert } from '../components/ui-kit/Alert';
import { Button } from '../components/ui-kit/Button';
import { Card } from '../components/ui-kit/Card';
import { CardTitle } from '../components/ui-kit/CardTitle';
import { Input } from '../components/ui-kit/Input';
import { Skeleton } from '../components/ui/skeleton';
import { fetchCourse, fetchMicroPrograms } from '../lib/courseApi';
import { usePageTitle } from '../lib/pageTitle';
import { useApp } from '../state/AppContext';
import type { Course, MicroProgram } from '../types/course';
import { errorMessage } from '../lib/error';

export function MProgramIndexPage() {
	const { dataset } = useApp();
	const [programs, setPrograms] = useState<MicroProgram[] | null>(null);
	const [filter, setFilter] = useState('');
	const [error, setError] = useState<unknown>(null);
	usePageTitle('微學程');

	useEffect(() => {
		let cancelled = false;
		setPrograms(null);
		setError(null);
		async function load() {
			const data = await fetchMicroPrograms(dataset.year, dataset.sem);
			if (!cancelled) setPrograms(data);
		}
		load().catch((e) => {
			if (!cancelled) {
				setError(e);
				setPrograms([]);
			}
		});
		return () => {
			cancelled = true;
		};
	}, [dataset.year, dataset.sem]);

	const filteredPrograms = useMemo(() => {
		const keyword = filter.trim().toLocaleLowerCase();
		if (!keyword) return programs || [];
		return (programs || []).filter((program) =>
			[program.id, program.name].some((value) =>
				String(value).toLocaleLowerCase().includes(keyword),
			),
		);
	}, [programs, filter]);

	if (!programs) return <MProgramIndexSkeleton />;

	return (
		<div className='flex flex-col gap-4'>
			<div>
				<h1>微學程</h1>
				<p className='m-0 text-sm opacity-70'>
					{dataset.year} 年第 {dataset.sem === '1' ? '一' : '二'} 學期
				</p>
			</div>

			<div className='relative'>
				<Search className='pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 opacity-50' />
				<Input
					value={filter}
					onChange={(event) => setFilter(event.target.value)}
					placeholder='搜尋學程名稱或代碼'
					aria-label='搜尋微學程'
					className='pl-10'
				/>
			</div>

			{error ? (
				<Alert danger>
					<strong>微學程資料載入失敗</strong>
					<p className='mt-1 mb-0 text-sm'>{errorMessage(error)}</p>
				</Alert>
			) : null}

			{!error && !filteredPrograms.length ? (
				<Alert>{filter.trim() ? '沒有符合的微學程。' : '本學期目前沒有微學程資料。'}</Alert>
			) : null}

			<div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
				{filteredPrograms.map((program) => (
					<Card
						key={program.id}
						className='flex flex-col gap-2 px-4 py-3 transition-transform duration-200 hover:-translate-y-1'
						to={`/mprogram/${dataset.year}/${dataset.sem}/${program.id}`}
					>
						<p className='font-mono text-xs opacity-65'>{program.id}</p>
						<CardTitle>{program.name}</CardTitle>
						<p className='mt-auto text-sm opacity-65'>
							{(program.course || program.courses || []).length} 門課程
						</p>
					</Card>
				))}
			</div>
		</div>
	);
}

function MProgramIndexSkeleton() {
	return (
		<div className='flex flex-col gap-4' aria-busy='true' aria-label='載入微學程'>
			<div className='flex flex-col gap-2'>
				<Skeleton className='h-8 w-32' />
				<Skeleton className='h-4 w-48' />
			</div>
			<Skeleton className='h-11 w-full' />
			<div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
				{Array.from({ length: 6 }, (_, index) => (
					<Skeleton key={index} className='h-32 w-full' />
				))}
			</div>
		</div>
	);
}

export function MProgramDetailPage() {
	const { year, sem, id } = useParams({ from: '/mprogram/$year/$sem/$id' });
	const { addCourse, removeCourse } = useApp();
	const [program, setProgram] = useState<MicroProgram | null>(null);
	const [courses, setCourses] = useState<Course[] | null>(null);
	const [error, setError] = useState<unknown>(null);
	const [showConflictCourse, setShowConflictCourse] = useState(true);
	const [version, setVersion] = useState(0);
	const storageKey = `my-couse-mprogram-${year}-${sem}`;
	const programName = program?.name || '微學程';
	const isInMyCourse = localStorage.getItem(storageKey) === programName;
	usePageTitle(programName);

	useEffect(() => {
		let cancelled = false;
		setProgram(null);
		setCourses(null);
		setError(null);
		async function load() {
			const [programList, allCourses] = await Promise.all([
				fetchMicroPrograms(year, sem),
				fetchCourse(year, sem),
			]);
			const foundProgram = programList.find((item) => item.id === id);
			const courseIds = foundProgram?.course || [];
			const result = foundProgram
				? allCourses.filter((course) => courseIds.includes(course.id))
				: [];
			if (!cancelled) {
				setProgram(foundProgram || { id, name: '微學程' });
				setCourses(result);
			}
		}
		load().catch((e) => {
			if (!cancelled) {
				setError(e);
				setCourses([]);
			}
		});
		return () => {
			cancelled = true;
		};
	}, [year, sem, id, version]);

	function addProgramCourses() {
		const previous = localStorage.getItem(storageKey);
		if (
			previous &&
			previous !== programName &&
			!confirm(`你先前已將「${previous}」之課程加入我的課程，此行為會導致課程過多，要繼續嗎？`)
		) {
			return;
		}
		localStorage.setItem(storageKey, programName);
		for (const course of courses || []) addCourse(course.id, year, sem);
		toast.success(`已加入 ${courses?.length || 0} 門課程`, {
			description: `${programName} 已加入我的課程`,
		});
		setVersion((value) => value + 1);
	}

	function removeProgramCourses() {
		for (const course of courses || []) removeCourse(course.id, year, sem);
		localStorage.removeItem(storageKey);
		toast.success(`已移除 ${courses?.length || 0} 門課程`, {
			description: `${programName} 已從我的課程移除`,
		});
		setVersion((value) => value + 1);
	}

	if (!courses) return <MProgramDetailSkeleton />;
	return (
		<div className='flex flex-col gap-4'>
			<div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
				<div>
					<p className='m-0 font-mono text-sm opacity-65'>{id}</p>
					<h1>{programName}</h1>
				</div>
			</div>

			<div className='flex flex-wrap items-center justify-between gap-3'>
				<p className='m-0 text-sm opacity-70'>找到 {courses.length} 門課程</p>
				<div className='flex flex-wrap items-center gap-2 sm:justify-end'>
					<Button
						active={showConflictCourse}
						aria-pressed={showConflictCourse}
						onClick={() => setShowConflictCourse((value) => !value)}
					>
						{showConflictCourse ? <Check className='size-4' /> : <X className='size-4' />}
						衝堂課程
					</Button>
					{!isInMyCourse ? (
						<Button primary onClick={addProgramCourses}>
							<Plus className='size-4' />
							加入我的課程
						</Button>
					) : (
						<Button danger onClick={removeProgramCourses}>
							<Minus className='size-4' />
							從我的課程移除
						</Button>
					)}
				</div>
			</div>
			{error ? (
				<Alert danger>
					<strong>微學程資料載入失敗</strong>
					<p className='mt-1 mb-0 text-sm'>{errorMessage(error)}</p>
				</Alert>
			) : null}
			{courses.length ? (
				<CourseList
					courses={courses}
					showTimetable
					showConflictCourse={showConflictCourse}
					year={year}
					sem={sem}
				/>
			) : null}
			{!courses.length && program ? (
				<Alert>
					<strong>查無資料</strong>
					{program.href ? (
						<>
							<br />
							<a
								href={`https://aps.ntut.edu.tw/course/tw/${program.href}`}
								target='_blank'
								rel='noreferrer'
							>
								前往原始網頁
							</a>
							看看原本的資料
						</>
					) : null}
				</Alert>
			) : null}
			<section className='border-t border-[rgba(var(--vs-text),0.1)] pt-4'>
				<h3 className='m-0'>贊助商廣告</h3>
				<AdsByGoogle />
			</section>
		</div>
	);
}

function MProgramDetailSkeleton() {
	return (
		<div className='flex flex-col gap-4' aria-busy='true' aria-label='載入微學程'>
			<div className='flex flex-col gap-2'>
				<Skeleton className='h-4 w-24' />
				<Skeleton className='h-8 w-64 max-w-full' />
			</div>
			<div className='flex flex-wrap items-center justify-between gap-3'>
				<Skeleton className='h-4 w-28' />
				<div className='flex gap-2'>
					<Skeleton className='h-11 w-24' />
					<Skeleton className='h-11 w-32' />
				</div>
			</div>
			<div className='flex justify-center gap-1 py-4'>
				<Skeleton className='h-9 w-20' />
				<Skeleton className='h-9 w-20' />
				<Skeleton className='h-9 w-20' />
			</div>
			<div className='grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-3'>
				{Array.from({ length: 6 }, (_, index) => (
					<Skeleton key={index} className='h-48 w-full' />
				))}
			</div>
		</div>
	);
}
