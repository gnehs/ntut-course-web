import { AdsByGoogle } from '../components/AdsByGoogle';
import { useParams } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { CourseCollectionPage, CourseCollectionSkeleton } from '../components/CourseCollectionPage';
import { ProgramList, ProgramListSkeleton } from '../components/ProgramList';
import { IconMinus, IconPlus, IconSearch } from '@tabler/icons-react';
import { toast } from 'sonner';
import { Alert } from '../components/ui-kit/Alert';
import { Button } from '../components/ui-kit/Button';
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
		if (!dataset.year || !dataset.sem) return undefined;
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
			<h1>微學程</h1>

			<div className='relative'>
				<IconSearch className='text-icon-muted pointer-events-none absolute top-1/2 left-3 -translate-y-1/2' />
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

			{filteredPrograms.length ? (
				<ProgramList
					items={filteredPrograms.map((program) => ({
						id: program.id,
						name: program.name,
						courseCount: (program.course || program.courses || []).length,
						to: `/mprogram/${dataset.year}/${dataset.sem}/${program.id}`,
					}))}
				/>
			) : null}
		</div>
	);
}

function MProgramIndexSkeleton() {
	return (
		<div className='flex flex-col gap-4' aria-busy='true' aria-label='載入微學程'>
			<Skeleton className='h-8 w-32' />
			<Skeleton className='h-11 w-full' />
			<ProgramListSkeleton />
		</div>
	);
}

export function MProgramDetailPage() {
	const { year, sem, id } = useParams({ from: '/mprogram/$year/$sem/$id' });
	const { addCourse, removeCourse } = useApp();
	const [program, setProgram] = useState<MicroProgram | null>(null);
	const [courses, setCourses] = useState<Course[] | null>(null);
	const [error, setError] = useState<unknown>(null);
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

	if (!courses) return <CourseCollectionSkeleton label='載入微學程' />;
	const emptyState = error ? (
		<></>
	) : program ? (
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
	) : undefined;
	return (
		<CourseCollectionPage
			title={programName}
			code={id}
			year={year}
			sem={sem}
			groups={[{ key: 'micro', courses }]}
			actions={
				!isInMyCourse ? (
					<Button primary onClick={addProgramCourses}>
						<IconPlus className='size-4' />
						加入我的課程
					</Button>
				) : (
					<Button danger onClick={removeProgramCourses}>
						<IconMinus className='size-4' />
						從我的課程移除
					</Button>
				)
			}
			notice={
				error ? (
					<Alert danger>
						<strong>微學程資料載入失敗</strong>
						<p className='mt-1 mb-0 text-sm'>{errorMessage(error)}</p>
					</Alert>
				) : undefined
			}
			emptyState={emptyState}
			savedVersion={version}
			footer={
				<section className='border-t border-[rgba(var(--vs-text),0.1)] pt-4 has-[[data-ad-collapsed]]:hidden'>
					<AdsByGoogle title='贊助商廣告' />
				</section>
			}
		/>
	);
}
