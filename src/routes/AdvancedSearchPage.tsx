import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { Checkbox } from '../components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { AdsByGoogle } from '../components/AdsByGoogle';
import { CourseList } from '../components/CourseList';
import {
	Check,
	ChevronDown,
	Clock3,
	GraduationCap,
	LibraryBig,
	ListFilter,
	Search,
	Shapes,
	X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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
import { animateFilterSection } from '../lib/motion';

type CourseStandardSymbol = keyof typeof courseStandard;

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

type SearchSectionId = 'display' | 'standard' | 'category' | 'academy' | 'time';

type AdvancedSearchControlsProps = {
	academyFilter: string[];
	academyList: string[];
	categoryFilter: string[];
	courseStandardFilter: Record<string, boolean>;
	courseStandardFilterEnabled: boolean;
	courseStandardOptions: CourseStandardSymbol[];
	onClose?: () => void;
	onKeywordChange: (value: string) => void;
	onReset: () => void;
	onToggleAcademy: (item: string) => void;
	onToggleCategory: (value: string) => void;
	onToggleConflict: (checked: unknown) => void;
	onTogglePlaceholder: (checked: unknown) => void;
	onToggleStandard: (symbol: string, checked: unknown) => void;
	onToggleTimetable: (date?: string | null, slot?: string) => void;
	recommandKeyword: string[];
	searchCourseKeyword: string;
	setSortBy: (value: string) => void;
	showCloseButton?: boolean;
	showConflictCourse: boolean;
	showPlaceholder: boolean;
	sortBy: string;
	timetableFilter: Record<string, string[]>;
};

const filterSections: {
	id: SearchSectionId;
	label: string;
	title: string;
	icon: LucideIcon;
}[] = [
	{ id: 'display', label: '顯示與排序', title: '顯示與排序', icon: ListFilter },
	{ id: 'standard', label: '課程標準', title: '依課程標準篩選', icon: GraduationCap },
	{ id: 'category', label: '博雅類別', title: '依博雅類別篩選課程', icon: Shapes },
	{ id: 'academy', label: '學院', title: '依學院篩選', icon: LibraryBig },
	{ id: 'time', label: '時間', title: '依時間篩選', icon: Clock3 },
];

export function AdvancedSearchPage() {
	const { location } = useRouterState();
	const navigate = useNavigate();
	const { dataset, getCourses } = useApp();
	const params = useMemo(() => createSearchParams(location.search), [location.search]);
	const restoredQuery = useMemo<AdvancedSearchQuery>(
		() => safeParseJson(params.get('q'), {}),
		[location.search],
	);
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
	const courseStandardOptions = useMemo(() => {
		const standardSymbols = Object.keys(courseStandard) as CourseStandardSymbol[];
		if (!allCourses) return standardSymbols;
		const availableSymbols = new Set(allCourses.map((course) => course.courseType).filter(Boolean));
		return standardSymbols.filter((symbol) => availableSymbols.has(symbol));
	}, [allCourses]);

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
		if (!allCourses) return;
		setCourseStandardFilter((current) => {
			const availableSymbols = new Set(courseStandardOptions);
			let changed = false;
			const next = { ...current };
			for (const symbol of Object.keys(next)) {
				if (next[symbol] && !availableSymbols.has(symbol)) {
					next[symbol] = false;
					changed = true;
				}
			}
			return changed ? next : current;
		});
	}, [allCourses, courseStandardOptions]);

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

	function toggleLesson(date?: string | null, slot?: string) {
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

	const searchControlsProps: AdvancedSearchControlsProps = {
		academyFilter,
		academyList,
		categoryFilter,
		courseStandardFilter,
		courseStandardFilterEnabled,
		courseStandardOptions,
		onKeywordChange: setSearchCourseKeyword,
		onReset: reset,
		onToggleAcademy: (item) => setAcademyFilter((items) => toggleArrayValue(items, item)),
		onToggleCategory: (value) => setCategoryFilter((items) => toggleArrayValue(items, value)),
		onTogglePlaceholder: (checked) => setShowPlaceholder(Boolean(checked)),
		onToggleStandard: (symbol, checked) =>
			setCourseStandardFilter((value) => ({ ...value, [symbol]: Boolean(checked) })),
		onToggleTimetable: toggleLesson,
		onToggleConflict: (checked) => setShowConflictCourse(Boolean(checked)),
		recommandKeyword,
		searchCourseKeyword,
		showConflictCourse,
		showPlaceholder,
		sortBy,
		timetableFilter,
		setSortBy,
	};

	return (
		<div className='grid min-w-0 gap-[18px] lg:grid-cols-[340px_minmax(0,1fr)]'>
			<aside className='hidden h-screen overflow-auto bg-[rgb(var(--vs-background))] p-4 shadow-[0_5px_20px_rgba(0,0,0,var(--vs-shadow-opacity))] lg:sticky lg:top-0 lg:block lg:w-auto'>
				<AdvancedSearchSidebarContent {...searchControlsProps} />
			</aside>
			<main className='min-w-0 px-3 pt-4 pb-10 lg:px-0 lg:pt-0 lg:pb-10'>
				<AdvancedSearchMobileControls {...searchControlsProps} />
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

function getFilterSectionCount(id: SearchSectionId, props: AdvancedSearchControlsProps) {
	if (id === 'display') {
		return (
			Number(!props.showConflictCourse) +
			Number(props.showPlaceholder) +
			Number(props.sortBy !== 'default')
		);
	}
	if (id === 'standard') {
		return props.courseStandardOptions.filter((symbol) => props.courseStandardFilter[symbol]).length;
	}
	if (id === 'category') return props.categoryFilter.length;
	if (id === 'academy') return props.academyFilter.length;
	return Object.values(props.timetableFilter).reduce((sum, items) => sum + items.length, 0);
}

function getFilterSection(id: SearchSectionId) {
	return filterSections.find((section) => section.id === id) ?? filterSections[0];
}

function AdvancedSearchMobileControls(props: AdvancedSearchControlsProps) {
	const [activeSection, setActiveSection] = useState<SearchSectionId | null>(null);
	const hasActiveCondition =
		props.searchCourseKeyword.trim().length > 0 ||
		filterSections.some((section) => getFilterSectionCount(section.id, props) > 0);

	return (
		<section className='mb-4 grid gap-3 lg:hidden'>
			<div className='flex items-center'>
				<label className='relative min-w-0 flex-1'>
					<span className='sr-only'>搜尋關鍵字</span>
					<Search className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[rgba(var(--vs-text),0.5)]' />
					<Input
						value={props.searchCourseKeyword}
						onChange={(event) => props.onKeywordChange(event.target.value)}
						placeholder='搜尋課程、教師、課號、班級'
						className='h-11 rounded-xl pr-3 pl-9 text-base'
					/>
				</label>
			</div>
			<SuggestedKeywords
				keywords={props.recommandKeyword}
				value={props.searchCourseKeyword}
				onSelect={props.onKeywordChange}
				scrollable
			/>
			<div className='flex min-w-0 gap-2 overflow-x-auto overscroll-x-contain pb-1 [-webkit-overflow-scrolling:touch]'>
				{hasActiveCondition ? (
					<button
						type='button'
						className='inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-[rgba(var(--vs-text),0.12)] bg-[rgb(var(--vs-background))] px-3 text-sm text-[rgb(var(--vs-text))] transition-colors'
						onClick={props.onReset}
					>
						<X className='size-4 shrink-0' />
						<span>重設</span>
					</button>
				) : null}
				{filterSections.map((section) => {
					const count = getFilterSectionCount(section.id, props);
					const active = activeSection === section.id;
					const Icon = section.icon;
					const TriggerIcon = count ? Check : Icon;
					return (
						<Popover
							key={section.id}
							open={active}
							onOpenChange={(open) => setActiveSection(open ? section.id : null)}
						>
							<PopoverTrigger asChild>
								<button
									type='button'
									aria-pressed={active}
									className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors ${
										active
											? 'border-[rgb(var(--vs-primary))] bg-[rgb(var(--vs-primary))] text-[rgb(var(--vs-primary-foreground))]'
											: count
												? 'border-[rgba(var(--vs-primary),0.35)] bg-[rgba(var(--vs-primary),0.16)] text-[rgb(var(--vs-primary))]'
												: 'border-[rgba(var(--vs-text),0.12)] bg-[rgb(var(--vs-background))] text-[rgb(var(--vs-text))]'
									}`}
								>
									<TriggerIcon className='size-4 shrink-0' />
									<span>{section.label}</span>
								</button>
							</PopoverTrigger>
							<PopoverContent>
								<div className='mb-3 flex items-center gap-2 font-semibold'>
									<Icon className='size-4 text-[rgb(var(--vs-primary))]' />
									<span>{section.label}</span>
								</div>
								<FilterSectionContent id={section.id} {...props} />
							</PopoverContent>
						</Popover>
					);
				})}
			</div>
		</section>
	);
}

function SuggestedKeywords({
	keywords,
	value,
	onSelect,
	scrollable = false,
}: {
	keywords: string[];
	value: string;
	onSelect: (keyword: string) => void;
	scrollable?: boolean;
}) {
	if (!keywords.length) return null;

	return (
		<div
			className={`flex min-w-0 items-center gap-2 text-sm ${
				scrollable
					? 'overflow-x-auto overscroll-x-contain pb-1 [-webkit-overflow-scrolling:touch]'
					: 'flex-wrap'
			}`}
		>
			<span className='shrink-0 text-xs font-medium tracking-normal text-[rgba(var(--vs-text),0.58)]'>
				快速搜尋
			</span>
			{keywords.map((keyword) => (
				<Button
					key={keyword}
					active={value === keyword}
					className='m-0 h-8 rounded-full px-3'
					onClick={() => onSelect(keyword)}
				>
					{keyword}
				</Button>
			))}
		</div>
	);
}

function AdvancedSearchSidebarContent(props: AdvancedSearchControlsProps) {
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
					<Button className='m-0' onClick={props.onReset}>
						重設
					</Button>
					{props.showCloseButton ? (
						<Button icon className='m-0 lg:hidden' onClick={props.onClose}>
							<X className='size-4' />
						</Button>
					) : null}
				</div>
			</div>
			<Field label='搜尋關鍵字'>
				<Input
					value={props.searchCourseKeyword}
					onChange={(event) => props.onKeywordChange(event.target.value)}
					placeholder='課程名稱、教師、課號、班級'
				/>
			</Field>
			<SuggestedKeywords
				keywords={props.recommandKeyword}
				value={props.searchCourseKeyword}
				onSelect={props.onKeywordChange}
			/>
			<SearchSection sectionId='display' open>
				<FilterSectionContent id='display' {...props} />
			</SearchSection>
			<SearchSection sectionId='standard' open={props.courseStandardFilterEnabled}>
				<FilterSectionContent id='standard' {...props} />
			</SearchSection>
			<SearchSection sectionId='category' open={props.categoryFilter.length > 0}>
				<FilterSectionContent id='category' {...props} />
			</SearchSection>
			<SearchSection sectionId='academy' open={props.academyFilter.length > 0}>
				<FilterSectionContent id='academy' {...props} />
			</SearchSection>
			<SearchSection
				sectionId='time'
				open={(Object.values(props.timetableFilter) as string[][]).some((items) => items.length)}
			>
				<FilterSectionContent id='time' {...props} />
			</SearchSection>
		</div>
	);
}

function FilterSectionContent({
	id,
	...props
}: AdvancedSearchControlsProps & { id: SearchSectionId }) {
	if (id === 'display') {
		return (
			<div className='grid gap-2'>
				<label className='flex min-h-7 cursor-pointer items-center gap-2'>
					<Checkbox checked={props.showConflictCourse} onCheckedChange={props.onToggleConflict} />
					顯示衝堂課程
				</label>
				<label className='flex min-h-7 cursor-pointer items-center gap-2'>
					<Checkbox checked={props.showPlaceholder} onCheckedChange={props.onTogglePlaceholder} />
					顯示佔位課程
				</label>
				<Field label='排序依照'>
					<Select value={props.sortBy} onChange={(value) => props.setSortBy(value)}>
						<SelectOption value='default'>預設</SelectOption>
						<SelectOption value='withdrawal'>退選率（由低到高）</SelectOption>
					</Select>
				</Field>
			</div>
		);
	}

	if (id === 'standard') {
		return (
			<div className='grid gap-2'>
				{props.courseStandardOptions.length ? (
					props.courseStandardOptions.map((symbol) => (
						<label key={symbol} className='flex min-h-7 cursor-pointer items-center gap-2'>
							<Checkbox
								checked={Boolean(props.courseStandardFilter[symbol])}
								onCheckedChange={(checked) => props.onToggleStandard(symbol, checked)}
							/>
							<span>
								{symbol} {courseStandard[symbol]}
							</span>
						</label>
					))
				) : (
					<p className='m-0 text-sm opacity-70'>這個資料集沒有可用的課程標準。</p>
				)}
			</div>
		);
	}

	if (id === 'category') {
		return (
			<div className='grid gap-2'>
				{Object.entries(categoryFilterList).map(([key, value]) => (
					<label key={value} className='flex min-h-7 cursor-pointer items-center gap-2'>
						<Checkbox
							checked={props.categoryFilter.includes(value)}
							onCheckedChange={() => props.onToggleCategory(value)}
						/>
						<span>{key}</span>
					</label>
				))}
			</div>
		);
	}

	if (id === 'academy') {
		return (
			<div className='grid gap-2'>
				{props.academyList.length ? (
					props.academyList.map((item) => (
						<label key={item} className='flex min-h-7 cursor-pointer items-center gap-2'>
							<Checkbox
								checked={props.academyFilter.includes(item)}
								onCheckedChange={() => props.onToggleAcademy(item)}
							/>
							<span>{item}</span>
						</label>
					))
				) : (
					<p className='m-0 text-sm opacity-70'>學院資料載入後即可篩選。</p>
				)}
			</div>
		);
	}

	return (
		<div className='grid gap-2'>
			<MiniNotify>
				紅色 X 代表排除該時段；點擊星期或節次可一次切換整個行或列，左上角可一次切換整張課表。
			</MiniNotify>
			<TimetableSelector value={props.timetableFilter} onToggle={props.onToggleTimetable} />
		</div>
	);
}

function SearchSection({
	sectionId,
	open = false,
	children,
}: {
	sectionId: SearchSectionId;
	open?: boolean;
	children: React.ReactNode;
}) {
	const [expanded, setExpanded] = useState(open);
	const [rendered, setRendered] = useState(open);
	const contentRef = useRef<HTMLDivElement | null>(null);
	const iconRef = useRef<SVGSVGElement | null>(null);
	const mountedRef = useRef(false);
	const initiallyRenderedRef = useRef(open);
	const section = getFilterSection(sectionId);
	const Icon = section.icon;

	useEffect(() => {
		if (open) {
			setRendered(true);
			setExpanded(true);
		}
	}, [open]);

	useEffect(() => {
		if (!rendered) return undefined;
		const cleanup = animateFilterSection(
			contentRef.current,
			iconRef.current,
			expanded,
			!mountedRef.current && initiallyRenderedRef.current,
			() => {
				if (!expanded) setRendered(false);
			},
		);
		mountedRef.current = true;
		return cleanup;
	}, [expanded, rendered]);

	return (
		<section className='border-t border-[rgba(var(--vs-text),0.08)] pt-3'>
			<button
				type='button'
				className='flex w-full cursor-pointer items-center justify-between gap-2 border-0 bg-transparent p-0 text-left font-semibold text-[rgb(var(--vs-text))]'
				aria-expanded={expanded}
				onClick={() => {
					if (expanded) setExpanded(false);
					else {
						setRendered(true);
						setExpanded(true);
					}
				}}
			>
				<span className='flex min-w-0 items-center gap-2'>
					<Icon className='size-4 shrink-0 text-[rgb(var(--vs-primary))]' />
					<span>{section.title}</span>
				</span>
				<ChevronDown ref={iconRef} className='size-4 shrink-0' />
			</button>
			{rendered ? (
				<div ref={contentRef} aria-hidden={!expanded} className='overflow-hidden'>
					<div className='mt-3 grid gap-2'>{children}</div>
				</div>
			) : null}
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
