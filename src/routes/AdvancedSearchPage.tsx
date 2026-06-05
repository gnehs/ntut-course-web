import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import type React from 'react';
import { Checkbox } from '../components/ui/checkbox';
import { AdsByGoogle } from '../components/AdsByGoogle';
import { CourseList } from '../components/CourseList';
import { ChevronDown, Search, X } from 'lucide-react';
import { TimetableSelector } from '../components/TimetableSelector';
import { Alert } from '../components/ui-kit/Alert';
import { Button } from '../components/ui-kit/Button';
import { Field } from '../components/ui-kit/Field';
import { Input } from '../components/ui-kit/Input';
import { AdvancedSearchPageSkeleton } from '../components/ui-kit/PageSkeletons';
import { MiniNotify } from '../components/ui-kit/MiniNotify';
import { Select, SelectOption } from '../components/ui-kit/Select';
import { categoryFilterList, courseStandard, timetable } from '../lib/courseUtils';
import { fetchDepartment, fetchWithdrawalRate } from '../lib/courseApi';
import { createSearchObject, createSearchParams } from '../lib/urlState';
import { useApp } from '../state/AppContext';
import type { Course, DepartmentGroup, QueryValue, WithdrawalRateMap } from '../types/course';
import { errorMessage } from '../lib/error';

const emptyTimetableFilter: Record<string, string[]> = {
	mon: [],
	tue: [],
	wed: [],
	thu: [],
	fri: [],
};
const emptyStandardFilter = {
	'○': false,
	'△': false,
	'☆': false,
	'●': false,
	'▲': false,
	'★': false,
};

type AdvancedSearchQuery = {
	k?: string;
	c?: boolean;
	csf?: string;
	cf?: string[];
	sb?: string;
	tf?: Record<string, string[]>;
	af?: string;
	sph?: boolean;
};

export function AdvancedSearchPage() {
	const { location } = useRouterState();
	const navigate = useNavigate();
	const { dataset, getCourses } = useApp();
	const params = useMemo(() => createSearchParams(location.search), [location.search]);
	const restoredQuery = useMemo<AdvancedSearchQuery>(
		() => safeParseJson(params.get('q'), {}),
		[location.search],
	);
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [searchCourseKeyword, setSearchCourseKeyword] = useState(restoredQuery.k || '');
	const [showConflictCourse, setShowConflictCourse] = useState(restoredQuery.c ?? true);
	const [showPlaceholder, setShowPlaceholder] = useState(restoredQuery.sph ?? false);
	const [sortBy, setSortBy] = useState(restoredQuery.sb || 'default');
	const [categoryFilter, setCategoryFilter] = useState<string[]>(restoredQuery.cf || []);
	const [courseStandardFilter, setCourseStandardFilter] = useState(() => {
		const next = { ...emptyStandardFilter };
		for (const key of String(restoredQuery.csf || '')
			.split(',')
			.filter(Boolean))
			next[key] = true;
		return next;
	});
	const [academyFilter, setAcademyFilter] = useState<string[]>(
		restoredQuery.af ? String(restoredQuery.af).split(',') : [],
	);
	const [timetableFilter, setTimetableFilter] = useState<Record<string, string[]>>(
		restoredQuery.tf || structuredClone(emptyTimetableFilter),
	);
	const [allCourses, setAllCourses] = useState<Course[] | null>(null);
	const [departmentData, setDepartmentData] = useState<DepartmentGroup[] | null>(null);
	const [withdrawalRate, setWithdrawalRate] = useState<WithdrawalRateMap | null>(null);
	const [onError, setOnError] = useState<unknown>(null);
	const [recommandKeyword, setRecommandKeyword] = useState(['體育', '博雅']);

	const year = params.get('year') || dataset.year;
	const sem = params.get('sem') || dataset.sem;
	const department = params.get('d') || dataset.department;

	const academyList = useMemo<string[]>(
		() => [...new Set<string>((departmentData || []).map((item) => item.category))],
		[departmentData],
	);
	const courseStandardFilterEnabled = useMemo(
		() => Object.values(courseStandardFilter).some((item) => item),
		[courseStandardFilter],
	);

	useEffect(() => {
		setSearchCourseKeyword(restoredQuery.k || '');
		setShowConflictCourse(restoredQuery.c ?? true);
		setShowPlaceholder(restoredQuery.sph ?? false);
		setSortBy(restoredQuery.sb || 'default');
		setCategoryFilter(restoredQuery.cf || []);
		setCourseStandardFilter(() => {
			const next = { ...emptyStandardFilter };
			for (const key of String(restoredQuery.csf || '')
				.split(',')
				.filter(Boolean))
				next[key] = true;
			return next;
		});
		setAcademyFilter(restoredQuery.af ? String(restoredQuery.af).split(',') : []);
		setTimetableFilter(restoredQuery.tf || structuredClone(emptyTimetableFilter));
	}, [restoredQuery]);

	useEffect(() => {
		let cancelled = false;
		async function load() {
			try {
				setAllCourses(null);
				setDepartmentData(null);
				const [departments, rate, courses] = await Promise.all([
					fetchDepartment(year, sem),
					fetchWithdrawalRate(''),
					getCourses({ year, sem, department }),
				]);
				if (cancelled) return;
				setDepartmentData(departments);
				setWithdrawalRate(rate);
				setAllCourses(courses);
				const classData = departments.flatMap((item) => item.class || []);
				const classID = localStorage.getItem('my-class');
				const className = classData.find((item) => item.id === classID)?.name;
				if (className) {
					setRecommandKeyword((items) =>
						items.includes(className) ? items : [...items, className],
					);
				}
			} catch (e) {
				if (!cancelled) setOnError(e);
			}
		}
		load();
		return () => {
			cancelled = true;
		};
	}, [year, sem, department, getCourses]);

	const searchResult = useMemo(() => {
		if (!allCourses) return null;
		try {
			let filtered = [...allCourses];

			if (searchCourseKeyword.length) {
				if (!Number.isNaN(Number(searchCourseKeyword)) && searchCourseKeyword.length >= 3) {
					filtered = filtered.filter((course) =>
						String(course.id || '').includes(searchCourseKeyword),
					);
				} else {
					for (const keyword of searchCourseKeyword
						.split(' ')
						.map((item) => item.toLowerCase())
						.filter(Boolean)) {
						filtered = filtered.filter(
							(course) =>
								String(course.name?.zh || '')
									.toLowerCase()
									.includes(keyword) ||
								String(course.name?.en || '')
									.toLowerCase()
									.includes(keyword) ||
								(course.teacher || [])
									.map((item) => item.name)
									.join(' ')
									.toLowerCase()
									.includes(keyword) ||
								(course.class || [])
									.map((item) => item.name)
									.join(' ')
									.toLowerCase()
									.includes(keyword),
						);
						if (keyword === '體育') {
							filtered = filtered.filter((course) =>
								(course.class || [])
									.map((item) => item.name)
									.join(' ')
									.toLowerCase()
									.includes(keyword),
							);
						}
					}
				}
			}

			if (courseStandardFilterEnabled) {
				const standardList = Object.keys(courseStandardFilter).filter(
					(item) => courseStandardFilter[item],
				);
				filtered = filtered.filter((course) => standardList.includes(course.courseType || ''));
			}

			if (categoryFilter.length) {
				filtered = filtered.filter(
					(course) =>
						(course.class || [])
							.map((item) => item.name)
							.join('')
							.includes('博雅') &&
						categoryFilter.some((item) => String(course.notes || '').includes(item)),
				);
			}

			filtered = filtered.filter((course) => {
				for (const date of Object.keys(timetableFilter)) {
					for (const slot of timetable) {
						if (timetableFilter[date].includes(slot) && course.time?.[date]?.includes(slot))
							return false;
					}
				}
				return true;
			});

			if (academyFilter.length && departmentData) {
				const filterOutAcademy = academyList.filter((item) => !academyFilter.includes(item));
				const filterOutClass = departmentData
					.filter((item) => filterOutAcademy.includes(item.category))
					.flatMap((item) => item.class || [])
					.map((item) => item.name);
				filtered = filtered.filter(
					(course) =>
						!(course.class || [])
							.map((item) => item.name)
							.some((item) => filterOutClass.includes(item)),
				);
			}

			if (sortBy === 'withdrawal' && withdrawalRate) {
				filtered = filtered
					.map((course) => ({
						...course,
						withdrawalRate: Math.max(
							...(course.teacher || [])
								.map((item) => withdrawalRate[item.name] || 0)
								.filter((item) => item),
							0,
						),
					}))
					.sort((a, b) => a.withdrawalRate - b.withdrawalRate);
			}

			if (!showPlaceholder) {
				filtered = filtered.filter((course) => {
					if (
						['學院指定向度', '學生自選向度', '博雅選修課程', '多元英文'].some((item) =>
							String(course.name?.zh || '').includes(item),
						)
					)
						return false;
					if (String(course.name?.zh || '').includes('體育') && !(course.teacher || []).length)
						return false;
					return true;
				});
			}

			setOnError(null);
			return filtered;
		} catch (e) {
			setOnError(e);
			return [];
		}
	}, [
		allCourses,
		searchCourseKeyword,
		courseStandardFilterEnabled,
		courseStandardFilter,
		categoryFilter,
		timetableFilter,
		academyFilter,
		departmentData,
		academyList,
		sortBy,
		withdrawalRate,
		showPlaceholder,
	]);

	useEffect(() => {
		if (location.pathname !== '/advanced-search') return;
		const q: Record<string, QueryValue | undefined> = {};
		if (searchCourseKeyword !== '') q.k = searchCourseKeyword;
		if (!showConflictCourse) q.c = showConflictCourse;
		if (courseStandardFilterEnabled)
			q.csf = Object.entries(courseStandardFilter)
				.filter((item) => item[1])
				.map((item) => item[0])
				.join(',');
		if (categoryFilter.length) q.cf = categoryFilter;
		if (sortBy !== 'default') q.sb = sortBy;
		if (Object.values(timetableFilter).some((items) => items.length)) q.tf = timetableFilter;
		if (academyFilter.length) q.af = academyFilter.join(',');
		if (showPlaceholder) q.sph = showPlaceholder;
		void navigate({
			to: '/advanced-search',
			search: createSearchObject({
				year,
				sem,
				d: department,
				...(Object.keys(q).length ? { q } : {}),
			}),
			replace: true,
		});
	}, [
		location.pathname,
		navigate,
		year,
		sem,
		department,
		searchCourseKeyword,
		showConflictCourse,
		showPlaceholder,
		sortBy,
		categoryFilter,
		courseStandardFilter,
		academyFilter,
		timetableFilter,
		courseStandardFilterEnabled,
	]);

	function reset() {
		setSearchCourseKeyword('');
		setShowConflictCourse(true);
		setShowPlaceholder(false);
		setSortBy('default');
		setCategoryFilter([]);
		setCourseStandardFilter({ ...emptyStandardFilter });
		setAcademyFilter([]);
		setTimetableFilter(structuredClone(emptyTimetableFilter));
	}

	function toggleLesson(date, slot) {
		setTimetableFilter((current) => {
			const next = structuredClone(current);
			if (date && slot) {
				next[date] = toggleArrayValue(next[date], slot);
			} else if (date) {
				next[date] = next[date].length ? [] : timetable.slice(0, -1);
			} else if (slot) {
				const checkBlocks = Object.values(next).reduce(
					(sum, items) => sum + (items.includes(slot) ? 1 : 0),
					0,
				);
				for (const key of Object.keys(next)) {
					next[key] = checkBlocks
						? next[key].filter((item) => item !== slot)
						: [...next[key], slot];
				}
			} else {
				const checkBlocks = Object.values(next).reduce((sum, items) => sum + items.length, 0);
				for (const key of Object.keys(next)) {
					next[key] = checkBlocks ? [] : timetable.slice(0, -1);
				}
			}
			return next;
		});
	}

	return (
		<div className='grid gap-[18px] lg:grid-cols-[340px_1fr]'>
			<button
				type='button'
				aria-label='關閉搜尋側欄'
				className={`fixed inset-0 z-[29] transition-colors duration-200 lg:hidden ${sidebarOpen ? 'pointer-events-auto bg-black/20' : 'pointer-events-none bg-transparent'}`}
				onClick={() => setSidebarOpen(false)}
			/>
			<aside
				className={`fixed inset-y-0 left-0 z-30 h-screen w-[min(340px,90vw)] overflow-auto bg-[rgb(var(--vs-background))] p-4 shadow-[0_5px_20px_rgba(0,0,0,var(--vs-shadow-opacity))] lg:sticky lg:top-0 lg:z-auto lg:w-auto lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-[105%]'}`}
			>
				<AdvancedSearchSidebarContent
					academyFilter={academyFilter}
					academyList={academyList}
					categoryFilter={categoryFilter}
					courseStandardFilter={courseStandardFilter}
					courseStandardFilterEnabled={courseStandardFilterEnabled}
					onClose={() => setSidebarOpen(false)}
					onKeywordChange={setSearchCourseKeyword}
					onReset={reset}
					onToggleAcademy={(item) => setAcademyFilter((items) => toggleArrayValue(items, item))}
					onToggleCategory={(value) => setCategoryFilter((items) => toggleArrayValue(items, value))}
					onTogglePlaceholder={(checked) => setShowPlaceholder(Boolean(checked))}
					onToggleStandard={(symbol, checked) =>
						setCourseStandardFilter((value) => ({ ...value, [symbol]: Boolean(checked) }))
					}
					onToggleTimetable={toggleLesson}
					onToggleConflict={(checked) => setShowConflictCourse(Boolean(checked))}
					recommandKeyword={recommandKeyword}
					searchCourseKeyword={searchCourseKeyword}
					showCloseButton
					showConflictCourse={showConflictCourse}
					showPlaceholder={showPlaceholder}
					sortBy={sortBy}
					timetableFilter={timetableFilter}
					setSortBy={setSortBy}
				/>
			</aside>
			<main className='px-3 pt-[74px] pb-10 lg:px-0 lg:pt-0 lg:pb-10'>
				<div className='flex items-center justify-between gap-3'>
					<Button
						className='m-0 inline-flex lg:hidden'
						active={sidebarOpen}
						onClick={() => setSidebarOpen((value) => !value)}
					>
						<Search className='size-4' />
						搜尋
					</Button>
				</div>
				<MiniNotify className='mt-3 lg:hidden'>
					<strong>第一次來嗎？</strong> 使用右上角按鈕進行搜尋
				</MiniNotify>
				{onError ? (
					<Alert danger>
						<strong>搜尋時發生錯誤</strong>
						<pre>{errorMessage(onError)}</pre>
					</Alert>
				) : null}
				{!searchResult ? (
					<AdvancedSearchPageSkeleton />
				) : (
					<CourseList courses={searchResult} showConflictCourse={showConflictCourse} />
				)}
				<div className='grid gap-3'>
					<h3 className='mb-4'>贊助商廣告</h3>
					<AdsByGoogle />
				</div>
			</main>
		</div>
	);
}

function AdvancedSearchSidebarContent({
	academyFilter,
	academyList,
	categoryFilter,
	courseStandardFilter,
	courseStandardFilterEnabled,
	onClose,
	onKeywordChange,
	onReset,
	onToggleAcademy,
	onToggleCategory,
	onToggleConflict,
	onTogglePlaceholder,
	onToggleStandard,
	onToggleTimetable,
	recommandKeyword,
	searchCourseKeyword,
	setSortBy,
	showCloseButton,
	showConflictCourse,
	showPlaceholder,
	sortBy,
	timetableFilter,
}) {
	return (
		<div className='grid gap-3'>
			<div className='flex items-center justify-between gap-3'>
				<Link
					to='/'
					className='font-semibold text-[rgb(var(--vs-text))] no-underline hover:text-[rgba(var(--vs-text),0.8)]'
				>
					🍤 北科課程好朋友
				</Link>
				<div className='flex items-center gap-1'>
					<Button className='m-0' onClick={onReset}>
						重設
					</Button>
					{showCloseButton ? (
						<Button icon className='m-0 lg:hidden' onClick={onClose}>
							<X className='size-4' />
						</Button>
					) : null}
				</div>
			</div>
			<Field label='搜尋關鍵字'>
				<Input
					value={searchCourseKeyword}
					onChange={(event) => onKeywordChange(event.target.value)}
					placeholder='課程名稱、教師、課號、班級'
				/>
			</Field>
			<div className='flex flex-wrap items-center gap-1 text-sm'>
				<span className='opacity-75'>建議：</span>
				{recommandKeyword.map((keyword) => (
					<Button
						key={keyword}
						active={searchCourseKeyword === keyword}
						className='m-0 h-auto px-3 py-1.5'
						onClick={() => onKeywordChange(keyword)}
					>
						{keyword}
					</Button>
				))}
			</div>
			<SearchSection title='顯示與排序' open>
				<label className='flex min-h-7 cursor-pointer items-center gap-2'>
					<Checkbox checked={showConflictCourse} onCheckedChange={onToggleConflict} />
					顯示衝堂課程
				</label>
				<label className='flex min-h-7 cursor-pointer items-center gap-2'>
					<Checkbox checked={showPlaceholder} onCheckedChange={onTogglePlaceholder} />
					顯示佔位課程
				</label>
				<Field label='排序依照'>
					<Select value={sortBy} onChange={(value) => setSortBy(value)}>
						<SelectOption value='default'>預設</SelectOption>
						<SelectOption value='withdrawal'>退選率（由低到高）</SelectOption>
					</Select>
				</Field>
			</SearchSection>
			<SearchSection title='依課程標準篩選' open={courseStandardFilterEnabled}>
				{Object.entries(courseStandard).map(([symbol, text]) => (
					<label key={symbol} className='flex min-h-7 cursor-pointer items-center gap-2'>
						<Checkbox
							checked={Boolean(courseStandardFilter[symbol])}
							onCheckedChange={(checked) => onToggleStandard(symbol, checked)}
						/>
						<span>
							{symbol} {text}
						</span>
					</label>
				))}
			</SearchSection>
			<SearchSection title='依博雅類別篩選課程' open={categoryFilter.length > 0}>
				{Object.entries(categoryFilterList).map(([key, value]) => (
					<label key={value} className='flex min-h-7 cursor-pointer items-center gap-2'>
						<Checkbox
							checked={categoryFilter.includes(value)}
							onCheckedChange={() => onToggleCategory(value)}
						/>
						<span>{key}</span>
					</label>
				))}
			</SearchSection>
			<SearchSection title='依學院篩選' open={academyFilter.length > 0}>
				{academyList.map((item) => (
					<label key={item} className='flex min-h-7 cursor-pointer items-center gap-2'>
						<Checkbox
							checked={academyFilter.includes(item)}
							onCheckedChange={() => onToggleAcademy(item)}
						/>
						<span>{item}</span>
					</label>
				))}
			</SearchSection>
			<SearchSection
				title='依時間篩選'
				open={(Object.values(timetableFilter) as string[][]).some((items) => items.length)}
			>
				<MiniNotify>點擊星期或節次可一次選取整個行或列，左上角可一次切換整張課表。</MiniNotify>
				<TimetableSelector value={timetableFilter} onToggle={onToggleTimetable} />
			</SearchSection>
		</div>
	);
}

function SearchSection({
	title,
	open = false,
	children,
}: {
	title: string;
	open?: boolean;
	children: React.ReactNode;
}) {
	const [expanded, setExpanded] = useState(open);

	useEffect(() => {
		if (open) setExpanded(true);
	}, [open]);

	return (
		<section className='border-t border-[rgba(var(--vs-text),0.08)] pt-3'>
			<button
				type='button'
				className='flex w-full cursor-pointer items-center justify-between gap-2 border-0 bg-transparent p-0 text-left font-semibold text-[rgb(var(--vs-text))]'
				aria-expanded={expanded}
				onClick={() => setExpanded((value) => !value)}
			>
				<span>{title}</span>
				<ChevronDown
					className={`size-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
				/>
			</button>
			{expanded ? <div className='mt-3 grid gap-2'>{children}</div> : null}
		</section>
	);
}

function toggleArrayValue(values: string[], value: string) {
	return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function safeParseJson<T>(text: string | null, fallback: T): T {
	if (!text) return fallback;
	try {
		return JSON.parse(text);
	} catch {
		return fallback;
	}
}
