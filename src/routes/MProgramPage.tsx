import { AdsByGoogle } from '../components/AdsByGoogle';
import { useParams } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { CourseList } from '../components/CourseList';
import { Check, Minus, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Alert } from '../components/ui-kit/Alert';
import { Button } from '../components/ui-kit/Button';
import { Card } from '../components/ui-kit/Card';
import { CardTitle } from '../components/ui-kit/CardTitle';
import { Input } from '../components/ui-kit/Input';
import { CardGridSkeleton, ClassDetailSkeleton } from '../components/ui-kit/PageSkeletons';
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
		const value = filter.trim();
		if (!value) return programs || [];
		return (programs || []).filter(
			(program) => program.name.includes(value) || program.id.includes(value),
		);
	}, [programs, filter]);

	if (!programs)
		return (
			<div>
				<h1>選擇微學程</h1>
				<div className='grid gap-3 sm:grid-cols-1 lg:grid-cols-4'>
					<Card>
						<p>輸入關鍵字來篩選</p>
						<Input value={filter} onChange={(event) => setFilter(event.target.value)} />
					</Card>
				</div>
				<CardGridSkeleton count={10} />
			</div>
		);
	return (
		<div className='space-y-4'>
			<h1>選擇微學程</h1>
			<Input
				value={filter}
				onChange={(event) => setFilter(event.target.value)}
				placeholder='輸入關鍵字來篩選...'
			/>
			{error ? (
				<Alert danger>
					<strong>搜尋時發生了錯誤</strong>
					<pre>{errorMessage(error)}</pre>
				</Alert>
			) : null}
			<div className='grid gap-3 sm:grid-cols-3 lg:grid-cols-5'>
				{filteredPrograms.map((program) => (
					<Card
						className='cursor-pointer p-3 transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_10px_20px_0_rgba(0,0,0,var(--vs-shadow-opacity,0.05))] active:translate-y-[5px] active:shadow-none'
						key={program.id}
						to={`/mprogram/${dataset.year}/${dataset.sem}/${program.id}`}
					>
						<p>{program.id}</p>
						<CardTitle>{program.name}</CardTitle>
					</Card>
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

	if (!courses) return <ClassDetailSkeleton />;
	return (
		<div className='space-y-4'>
			<div className='flex flex-wrap items-center justify-between gap-2'>
				<div>
					<h1>{programName}</h1>
				</div>
				<div className='flex flex-wrap justify-end gap-2'>
					<Button
						active={showConflictCourse}
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
					<strong>擷取資料時發生了錯誤</strong>
					<pre>{errorMessage(error)}</pre>
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
			<h3>贊助商廣告</h3>
			<AdsByGoogle />
		</div>
	);
}
