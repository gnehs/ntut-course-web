import { Link, useParams } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';
import { toast } from 'sonner';
import { CourseCollectionPage, CourseCollectionSkeleton } from '../components/CourseCollectionPage';
import { Alert } from '../components/ui-kit/Alert';
import { Button } from '../components/ui-kit/Button';
import { Card } from '../components/ui-kit/Card';
import { CardTitle } from '../components/ui-kit/CardTitle';
import { Input } from '../components/ui-kit/Input';
import { Skeleton } from '../components/ui/skeleton';
import { fetchCourse, fetchPrograms } from '../lib/courseApi';
import { departmentItems, storageDepartment } from '../lib/courseUtils';
import { errorMessage } from '../lib/error';
import { usePageTitle } from '../lib/pageTitle';
import { useApp } from '../state/AppContext';
import type { Course, Program } from '../types/course';

const APS_COURSE_ROOT = 'https://aps.ntut.edu.tw/course/tw/';

type ProgramParams = {
	year?: string;
	sem?: string;
	id?: string;
};

type DepartmentCourses = {
	department: string;
	storageDepartment: string;
	courses: Course[];
};

function courseIdentity(course: Pick<Course, 'id' | 'code'>) {
	return String(course.id || course.code || '').trim();
}

/**
 * Turns the crawler's relative APS links into absolute links while rejecting
 * non-web protocols. Program metadata is remote data, so it must not become a
 * javascript:, data:, or other executable URL in the page.
 */
export function safeProgramHref(href: string | undefined | null) {
	if (!href) return null;
	try {
		const url = new URL(href, APS_COURSE_ROOT);
		return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
	} catch {
		return null;
	}
}

function programParams() {
	return useParams({ strict: false }) as ProgramParams;
}

export function ProgramIndexPage() {
	const { dataset } = useApp();
	const [programs, setPrograms] = useState<Program[] | null>(null);
	const [unavailable, setUnavailable] = useState(false);
	const [filter, setFilter] = useState('');
	const [error, setError] = useState<unknown>(null);
	usePageTitle('一般學程');

	useEffect(() => {
		let cancelled = false;
		setPrograms(null);
		setUnavailable(false);
		setError(null);

		fetchPrograms(dataset.year, dataset.sem)
			.then((data) => {
				if (cancelled) return;
				setUnavailable(data === null);
				setPrograms(data || []);
			})
			.catch((reason) => {
				if (cancelled) return;
				setError(reason);
				setPrograms([]);
			});

		return () => {
			cancelled = true;
		};
	}, [dataset.year, dataset.sem]);

	const filteredPrograms = useMemo(() => {
		const keyword = filter.trim().toLocaleLowerCase();
		if (!keyword) return programs || [];
		return (programs || []).filter((program) =>
			[program.id, program.name, program.description]
				.filter(Boolean)
				.some((value) => String(value).toLocaleLowerCase().includes(keyword)),
		);
	}, [filter, programs]);

	if (!programs) return <ProgramIndexSkeleton />;

	return (
		<div className='flex flex-col gap-4'>
			<div>
				<h1>一般學程</h1>
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
					aria-label='搜尋一般學程'
					className='pl-10'
				/>
			</div>

			{error ? (
				<Alert danger>
					<strong>一般學程資料載入失敗</strong>
					<p className='mt-1 mb-0 text-sm'>{errorMessage(error)}</p>
				</Alert>
			) : null}

			{unavailable ? (
				<Alert>
					<strong>本學期尚未提供一般學程資料</strong>
					<p className='mt-1 mb-0 text-sm opacity-75'>
						資料尚未發布時不會顯示上一學期的內容，請稍後再試。
					</p>
				</Alert>
			) : null}

			{!error && !unavailable && !filteredPrograms.length ? (
				<Alert>{filter.trim() ? '沒有符合的學程。' : '本學期目前沒有一般學程資料。'}</Alert>
			) : null}

			<div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
				{filteredPrograms.map((program) => (
					<Card
						key={program.id}
						to={`/program/${encodeURIComponent(dataset.year)}/${encodeURIComponent(dataset.sem)}/${encodeURIComponent(program.id)}`}
						className='flex flex-col gap-2 px-4 py-3 transition-transform duration-200 hover:-translate-y-1'
					>
						<p className='font-mono text-xs opacity-65'>{program.id}</p>
						<CardTitle>{program.name}</CardTitle>
						{program.description ? (
							<p className='line-clamp-3 text-sm opacity-70'>{program.description}</p>
						) : null}
						<p className='mt-auto text-sm opacity-65'>{program.courses.length} 門課程</p>
					</Card>
				))}
			</div>
		</div>
	);
}

function ProgramIndexSkeleton() {
	return (
		<div className='flex flex-col gap-4' aria-busy='true' aria-label='載入一般學程'>
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

export function ProgramDetailPage() {
	const { year = '', sem = '', id = '' } = programParams();
	const [program, setProgram] = useState<Program | null | undefined>(undefined);
	const [departmentCourses, setDepartmentCourses] = useState<DepartmentCourses[]>([]);
	const [courseErrors, setCourseErrors] = useState<{ department: string; reason: unknown }[]>([]);
	const [unavailable, setUnavailable] = useState(false);
	const [error, setError] = useState<unknown>(null);
	const [savedVersion, setSavedVersion] = useState(0);
	const { addCourse, removeCourse, getMyCourseIds } = useApp();
	usePageTitle(program?.name || '一般學程');

	useEffect(() => {
		let cancelled = false;
		setProgram(undefined);
		setDepartmentCourses([]);
		setCourseErrors([]);
		setUnavailable(false);
		setError(null);

		async function load() {
			const results = await Promise.allSettled([
				fetchPrograms(year, sem),
				...departmentItems.map((department) =>
					fetchCourse(year, sem, storageDepartment(department)),
				),
			]);
			if (cancelled) return;

			const programResult = results[0] as PromiseSettledResult<Program[] | null>;
			if (programResult.status === 'rejected') throw programResult.reason;
			if (programResult.value === null) {
				setUnavailable(true);
				setProgram(null);
				return;
			}

			const found = programResult.value.find((item) => item.id === id);
			const groups: DepartmentCourses[] = [];
			const failures: { department: string; reason: unknown }[] = [];
			for (const [index, department] of departmentItems.entries()) {
				const result = results[index + 1] as PromiseSettledResult<Course[]>;
				if (result.status === 'rejected') {
					failures.push({ department, reason: result.reason });
					groups.push({
						department,
						storageDepartment: storageDepartment(department),
						courses: [],
					});
					continue;
				}
				groups.push({
					department,
					storageDepartment: storageDepartment(department),
					courses: result.value,
				});
			}
			setDepartmentCourses(groups);
			setCourseErrors(failures);
			setProgram(found || null);
		}

		load().catch((reason) => {
			if (cancelled) return;
			setError(reason);
			setProgram(null);
		});

		return () => {
			cancelled = true;
		};
	}, [id, sem, year]);

	const courseIds = useMemo(
		() => new Set((program?.courses || []).map((courseId) => String(courseId).trim())),
		[program],
	);
	const matchedGroups = useMemo(() => {
		const seenCourseIds = new Set<string>();
		return departmentCourses.map((group) => ({
			...group,
			courses: group.courses.filter((course) => {
				const courseId = courseIdentity(course);
				const matchesProgram = [course.id, course.code]
					.filter(Boolean)
					.some((value) => courseIds.has(String(value).trim()));
				if (!matchesProgram || !courseId || seenCourseIds.has(courseId)) return false;
				seenCourseIds.add(courseId);
				return true;
			}),
		}));
	}, [courseIds, departmentCourses]);
	const matchedCourses = useMemo(
		() => matchedGroups.flatMap((group) => group.courses),
		[matchedGroups],
	);
	const savedByDepartment = useMemo(() => {
		const result = new Map<string, Set<string>>();
		for (const group of matchedGroups)
			result.set(
				group.storageDepartment,
				new Set(getMyCourseIds(year, sem, group.storageDepartment)),
			);
		return result;
	}, [getMyCourseIds, matchedGroups, savedVersion, sem, year]);

	function addProgramCourses() {
		for (const group of matchedGroups)
			for (const course of group.courses) addCourse(course.id, year, sem, group.storageDepartment);
		toast.success(`已加入 ${matchedCourses.length} 門課程`, {
			description: `${program?.name || '一般學程'} 已加入我的課程`,
		});
		setSavedVersion((value) => value + 1);
	}

	function removeProgramCourses() {
		for (const group of matchedGroups)
			for (const course of group.courses)
				removeCourse(course.id, year, sem, group.storageDepartment);
		toast.success(`已移除 ${matchedCourses.length} 門課程`, {
			description: `${program?.name || '一般學程'} 已從我的課程移除`,
		});
		setSavedVersion((value) => value + 1);
	}

	const allSaved =
		matchedCourses.length > 0 &&
		matchedGroups.every((group) =>
			group.courses.every((course) =>
				savedByDepartment.get(group.storageDepartment)?.has(course.id),
			),
		);

	if (program === undefined && !error && !unavailable)
		return <CourseCollectionSkeleton label='載入一般學程' />;
	if (unavailable)
		return (
			<div className='flex flex-col gap-4'>
				<h1>一般學程</h1>
				<Alert>本學期尚未提供一般學程資料。</Alert>
			</div>
		);
	if (error)
		return (
			<div className='flex flex-col gap-4'>
				<h1>一般學程</h1>
				<Alert danger>
					<strong>一般學程資料載入失敗</strong>
					<p className='mt-1 mb-0 text-sm'>{errorMessage(error)}</p>
				</Alert>
			</div>
		);
	if (!program)
		return (
			<div className='flex flex-col gap-4'>
				<h1>找不到一般學程</h1>
				<Alert>找不到代碼為「{id}」的一般學程。</Alert>
				<Link to='/program' className='underline underline-offset-2'>
					返回一般學程列表
				</Link>
			</div>
		);

	const sourceHref = safeProgramHref(program.href);
	return (
		<CourseCollectionPage
			title={program.name}
			code={program.id}
			description={program.description}
			year={year}
			sem={sem}
			groups={matchedGroups.map((group) => ({
				key: group.storageDepartment,
				label: group.department,
				department: group.storageDepartment,
				courses: group.courses,
			}))}
			actions={
				<Button
					primary={!allSaved}
					danger={allSaved}
					onClick={allSaved ? removeProgramCourses : addProgramCourses}
				>
					{allSaved ? '從我的課程移除全部' : '全部加入我的課程'}
				</Button>
			}
			notice={
				courseErrors.length ? (
					<Alert danger>
						<strong>部分學制的課程資料無法載入</strong>
						<ul className='mt-2 mb-0 list-disc pl-5 text-sm'>
							{courseErrors.map(({ department, reason }) => (
								<li key={department}>
									{department}：{errorMessage(reason)}
								</li>
							))}
						</ul>
					</Alert>
				) : undefined
			}
			emptyState={
				courseErrors.length ? (
					<Alert>
						<strong>目前無法確認此學程的課程清單</strong>
						<p className='mt-1 mb-0 text-sm opacity-75'>部分學制資料載入失敗，請稍後再試。</p>
					</Alert>
				) : (
					<Alert>此學程在目前三個學制的課程清單中沒有找到對應課程。</Alert>
				)
			}
			savedVersion={savedVersion}
			onSavedChange={() => setSavedVersion((value) => value + 1)}
			footer={
				sourceHref ? (
					<div className='border-t border-[rgba(var(--vs-text),0.1)] pt-4'>
						<a
							href={sourceHref}
							target='_blank'
							rel='noreferrer'
							className='inline-flex items-center gap-1 text-sm underline underline-offset-2 opacity-65 hover:opacity-100'
						>
							學校原始資料 <ExternalLink className='size-4' aria-hidden='true' />
						</a>
					</div>
				) : undefined
			}
		/>
	);
}
