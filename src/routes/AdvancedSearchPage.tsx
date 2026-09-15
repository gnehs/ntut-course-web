import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { Checkbox } from '../components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { AdsByGoogle } from '../components/AdsByGoogle';
import { CourseList } from '../components/CourseList';
import type { CourseListLayout } from '../components/CourseList';

import {
	Check,
	ChevronDown,
	Clock3,
	GraduationCap,
	Languages,
	LibraryBig,
	ListFilter,
	Search,
	Shapes,
	Sparkles,
	Tags,
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
import { fetchDepartment, fetchSyllabusIndex, fetchWithdrawalRate } from '../lib/courseApi';
import {
	AI_ANY_FILTER,
	ALL_LANGUAGE_FILTER,
	courseAttributeLabels,
	filterCoursesByMetadata,
	getCourseAttributeOptions,
	getLanguageOptions,
	getSyllabusFilterOptions,
	languageLabel,
	parseMetadataFilterState,
	serializeMetadataFilterState,
} from '../lib/courseFilters';
import type { CourseAttribute } from '../lib/courseFilters';
import { createSearchObject, createSearchParams } from '../lib/urlState';
import { useApp } from '../state/AppContext';
import type {
	Course,
	DepartmentGroup,
	QueryValue,
	SyllabusIndex,
	WithdrawalRateMap,
} from '../types/course';
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
	ai?: boolean | string[];
	sdgs?: number[];
	attrs?: string[];
};

type SearchSectionId =
	| 'display'
	| 'language'
	| 'standard'
	| 'category'
	| 'academy'
	| 'attributes'
	| 'syllabus'
	| 'time';

type AdvancedSearchControlsProps = {
	academyFilter: string[];
	academyList: string[];
	aiFilter: string[];
	aiOptions: string[];
	attributeFilter: CourseAttribute[];
	attributeOptions: CourseAttribute[];
	categoryFilter: string[];
	courseStandardFilter: Record<string, boolean>;
	courseStandardFilterEnabled: boolean;
	courseStandardOptions: CourseStandardSymbol[];
	languageFilter: string;
	languageOptions: string[];
	onClose?: () => void;
	onKeywordChange: (value: string) => void;
	onLanguageChange: (value: string) => void;
	onReset: () => void;
	onToggleAi: (value: string) => void;
	onToggleAcademy: (item: string) => void;
	onToggleAttribute: (value: CourseAttribute) => void;
	onToggleCategory: (value: string) => void;
	onToggleConflict: (checked: unknown) => void;
	onTogglePlaceholder: (checked: unknown) => void;
	onToggleSdgs: (value: number) => void;
	onToggleStandard: (symbol: string, checked: unknown) => void;
	onToggleTimetable: (date?: string | null, slot?: string) => void;
	recommandKeyword: string[];
	searchCourseKeyword: string;
	sdgsFilter: number[];
	sdgsOptions: number[];
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
	{ id: 'language', label: '語言', title: '依授課語言篩選', icon: Languages },
	{ id: 'standard', label: '課程標準', title: '依課程標準篩選', icon: GraduationCap },
	{ id: 'category', label: '博雅類別', title: '依博雅類別篩選課程', icon: Shapes },
	{ id: 'academy', label: '學院', title: '依學院篩選', icon: LibraryBig },
	{ id: 'attributes', label: '課程屬性', title: '依課程屬性篩選', icon: Tags },
	{ id: 'syllabus', label: '課綱主題', title: '依課綱主題篩選', icon: Sparkles },
	{ id: 'time', label: '時間', title: '依時間篩選', icon: Clock3 },
];

export function AdvancedSearchPage() {
	const { location } = useRouterState();
	const navigate = useNavigate();
	const { dataset, getCourses } = useApp();
	const params = useMemo(() => createSearchParams(location.search), [location.search]);
	const locationKey = createLocationKey(location.pathname, location.search);
	const restoredQuery = useMemo<AdvancedSearchQuery>(
		() => safeParseJson(params.get('q'), {}),
		[location.search],
	);
	const restoredMetadata = useMemo(
		() =>
			parseMetadataFilterState({
				language: params.get('language'),
				ai: restoredQuery.ai,
				sdgs: restoredQuery.sdgs,
				attrs: restoredQuery.attrs,
			}),
		[params, restoredQuery],
	);
	const restoredPage = parsePage(params.get('page'));
	const restoredLayout = parseCourseListLayout(params.get('view'));
	const [searchCourseKeyword, setSearchCourseKeyword] = useState(restoredQuery.k || '');
	const [showConflictCourse, setShowConflictCourse] = useState(restoredQuery.c ?? true);
	const [showPlaceholder, setShowPlaceholder] = useState(restoredQuery.sph ?? false);
	const [sortBy, setSortBy] = useState(restoredQuery.sb || 'default');
	const [languageFilter, setLanguageFilter] = useState(restoredMetadata.language);
	const [aiFilter, setAiFilter] = useState(restoredMetadata.ai);
	const [sdgsFilter, setSdgsFilter] = useState(restoredMetadata.sdgs);
	const [attributeFilter, setAttributeFilter] = useState<CourseAttribute[]>(
		restoredMetadata.attributes,
	);
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
	const [isLoading, setIsLoading] = useState(true);
	const [departmentData, setDepartmentData] = useState<DepartmentGroup[] | null>(null);
	const [withdrawalRate, setWithdrawalRate] = useState<WithdrawalRateMap | null>(null);
	const [syllabusIndex, setSyllabusIndex] = useState<SyllabusIndex | null>(null);
	const [syllabusIndexLoaded, setSyllabusIndexLoaded] = useState(false);
	const [syllabusIndexError, setSyllabusIndexError] = useState<unknown>(null);
	const [onError, setOnError] = useState<unknown>(null);
	const [recommandKeyword, setRecommandKeyword] = useState(['體育', '博雅']);
	const [resultPage, setResultPage] = useState(restoredPage);
	const [resultLayout, setResultLayout] = useState<CourseListLayout>(restoredLayout);
	const lastObservedLocationKeyRef = useRef(locationKey);
	const skipUrlSyncRef = useRef(false);
	const pendingSearchKeysRef = useRef(new Set<string>());

	const year = params.get('year') || dataset.year;
	const sem = params.get('sem') || dataset.sem;
	const department = params.get('d') || dataset.department;
	const courseStandardOptions = useMemo(() => {
		const standardSymbols = Object.keys(courseStandard) as CourseStandardSymbol[];
		if (!allCourses) return [];
		const availableSymbols = new Set(allCourses.map((course) => course.courseType).filter(Boolean));
		return standardSymbols.filter((symbol) => availableSymbols.has(symbol));
	}, [allCourses]);

	const academyList = useMemo<string[]>(
		() => [...new Set<string>((departmentData || []).map((item) => item.category))],
		[departmentData],
	);
	const languageOptions = useMemo(() => getLanguageOptions(allCourses || []), [allCourses]);
	const attributeOptions = useMemo(() => getCourseAttributeOptions(allCourses || []), [allCourses]);
	const syllabusFilterOptions = useMemo(
		() => getSyllabusFilterOptions(syllabusIndex),
		[syllabusIndex],
	);
	const courseStandardFilterEnabled = useMemo(
		() => Object.values(courseStandardFilter).some((item) => item),
		[courseStandardFilter],
	);

	useEffect(() => {
		if (location.pathname !== '/advanced-search') return;
		const locationChanged = lastObservedLocationKeyRef.current !== locationKey;
		if (locationChanged) {
			lastObservedLocationKeyRef.current = locationKey;
			skipUrlSyncRef.current = true;
			if (pendingSearchKeysRef.current.has(locationKey)) {
				pendingSearchKeysRef.current.delete(locationKey);
				return;
			}
			pendingSearchKeysRef.current.clear();
		}
		setSearchCourseKeyword(restoredQuery.k || '');
		setShowConflictCourse(restoredQuery.c ?? true);
		setShowPlaceholder(restoredQuery.sph ?? false);
		setSortBy(restoredQuery.sb || 'default');
		setLanguageFilter(restoredMetadata.language);
		setAiFilter(restoredMetadata.ai);
		setSdgsFilter(restoredMetadata.sdgs);
		setAttributeFilter(restoredMetadata.attributes);
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
		setResultPage(restoredPage);
		setResultLayout(restoredLayout);
	}, [
		location.pathname,
		locationKey,
		restoredLayout,
		restoredMetadata,
		restoredPage,
		restoredQuery,
	]);

	useEffect(() => {
		if (!allCourses) return;
		setCourseStandardFilter((current) => {
			const availableSymbols = new Set(courseStandardOptions);
			let changed = false;
			const next = { ...current };
			for (const symbol of Object.keys(next) as CourseStandardSymbol[]) {
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
			setIsLoading(true);
			setOnError(null);
			try {
				setAllCourses(null);
				setDepartmentData(null);
				setSyllabusIndex(null);
				setSyllabusIndexLoaded(false);
				setSyllabusIndexError(null);
				const syllabusIndexPromise = fetchSyllabusIndex(year, sem).catch((error) => {
					if (!cancelled) setSyllabusIndexError(error);
					return null;
				});
				const [departments, rate, courses, index] = await Promise.all([
					fetchDepartment(year, sem),
					fetchWithdrawalRate(''),
					getCourses({ year, sem, department }),
					syllabusIndexPromise,
				]);
				if (cancelled) return;
				setDepartmentData(departments);
				setWithdrawalRate(rate);
				setAllCourses(courses);
				setSyllabusIndex(index);
				setSyllabusIndexLoaded(true);
				const classData = departments.flatMap((item) => item.class || []);
				const classID = localStorage.getItem('my-class');
				const className = classData.find((item) => item.id === classID)?.name;
				if (className) {
					setRecommandKeyword((items) =>
						items.includes(className) ? items : [...items, className],
					);
				}
			} catch (e) {
				if (!cancelled) {
					setAllCourses([]);
					setDepartmentData(null);
					setSyllabusIndex(null);
					setSyllabusIndexLoaded(false);
					setOnError(e);
				}
			} finally {
				if (!cancelled) setIsLoading(false);
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
			let filtered = filterCoursesByMetadata(allCourses, {
				language: languageFilter,
				ai: aiFilter,
				sdgs: sdgsFilter,
				attributes: attributeFilter,
				syllabusIndex,
			});

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
								.map((item) => Number(withdrawalRate[item.name] ?? 0))
								.filter(Number.isFinite),
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

			return filtered;
		} catch (e) {
			setOnError(e);
			return [];
		}
	}, [
		allCourses,
		languageFilter,
		aiFilter,
		sdgsFilter,
		attributeFilter,
		syllabusIndex,
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

	const metadataWarnings = useMemo(() => {
		if (!allCourses || onError) return [];
		const warnings: string[] = [];
		if (languageFilter && languageOptions.length === 0)
			warnings.push('目前學期沒有可用的授課語言資料，語言條件未套用。');

		if (
			(aiFilter.length || sdgsFilter.length) &&
			syllabusIndexLoaded &&
			(syllabusIndexError || syllabusIndex == null)
		) {
			if (syllabusIndexError) {
				warnings.push('課綱分析資料暫時無法載入，AI 與 SDGs 條件未套用。');
			} else {
				warnings.push('目前學期沒有課綱索引資料，AI 與 SDGs 條件未套用。');
			}
		}

		if (attributeFilter.length && attributeOptions.length === 0)
			warnings.push('目前學期沒有可用的課程屬性資料，課程屬性條件未套用。');
		return warnings;
	}, [
		aiFilter,
		allCourses,
		attributeFilter,
		attributeOptions,
		languageFilter,
		languageOptions,
		onError,
		sdgsFilter,
		syllabusIndex,
		syllabusIndexError,
		syllabusIndexLoaded,
	]);
	useEffect(() => {
		if (location.pathname !== '/advanced-search') return;
		// A route navigation can render once with the previous local state. Let the
		// restore effect above apply the URL first, then sync from the restored state.
		if (skipUrlSyncRef.current) {
			skipUrlSyncRef.current = false;
			return;
		}
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
		const metadataQuery = serializeMetadataFilterState({
			language: languageFilter,
			ai: aiFilter,
			sdgs: sdgsFilter,
			attributes: attributeFilter,
		});
		if (metadataQuery.ai !== undefined) q.ai = metadataQuery.ai;
		if (metadataQuery.sdgs !== undefined) q.sdgs = metadataQuery.sdgs as unknown as QueryValue;
		if (metadataQuery.attrs !== undefined) q.attrs = metadataQuery.attrs;
		const nextSearch = createSearchObject({
			year,
			sem,
			d: department,
			language: metadataQuery.language,
			page: resultPage > 1 ? resultPage : undefined,
			view: resultLayout === 'card' ? undefined : resultLayout,
			...(Object.keys(q).length ? { q } : {}),
		});
		const nextLocationKey = createLocationKey('/advanced-search', nextSearch);
		if (nextLocationKey === locationKey) return;
		pendingSearchKeysRef.current.add(nextLocationKey);
		void navigate({
			to: '/advanced-search',
			search: nextSearch,
			replace: true,
			resetScroll: false,
		});
	}, [
		location.pathname,
		locationKey,
		navigate,
		year,
		sem,
		department,
		searchCourseKeyword,
		showConflictCourse,
		showPlaceholder,
		languageFilter,
		aiFilter,
		sdgsFilter,
		attributeFilter,
		sortBy,
		categoryFilter,
		courseStandardFilter,
		academyFilter,
		timetableFilter,
		courseStandardFilterEnabled,
		resultLayout,
		resultPage,
	]);

	function reset() {
		setSearchCourseKeyword('');
		setShowConflictCourse(true);
		setShowPlaceholder(false);
		setSortBy('default');
		setLanguageFilter('');
		setAiFilter([]);
		setSdgsFilter([]);
		setAttributeFilter([]);
		setCategoryFilter([]);
		setCourseStandardFilter({ ...emptyStandardFilter });
		setAcademyFilter([]);
		setTimetableFilter(structuredClone(emptyTimetableFilter));
		setResultPage(1);
	}

	function resetPage() {
		setResultPage(1);
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
		aiFilter,
		aiOptions: syllabusFilterOptions.ai,
		attributeFilter,
		attributeOptions,
		categoryFilter,
		courseStandardFilter,
		courseStandardFilterEnabled,
		courseStandardOptions,
		languageFilter,
		languageOptions,
		onKeywordChange: (value) => {
			setSearchCourseKeyword(value);
			resetPage();
		},
		onLanguageChange: (value) => {
			setLanguageFilter(value === ALL_LANGUAGE_FILTER ? '' : value);
			resetPage();
		},
		onReset: reset,
		onToggleAi: (value) => {
			setAiFilter((items) => {
				if (value === AI_ANY_FILTER) return items.includes(value) ? [] : [value];
				const next = items.filter((item) => item !== AI_ANY_FILTER);
				return toggleArrayValue(next, value);
			});
			resetPage();
		},
		onToggleAcademy: (item) => {
			setAcademyFilter((items) => toggleArrayValue(items, item));
			resetPage();
		},
		onToggleAttribute: (value) => {
			setAttributeFilter((items) => toggleArrayValue(items, value));
			resetPage();
		},
		onToggleCategory: (value) => {
			setCategoryFilter((items) => toggleArrayValue(items, value));
			resetPage();
		},
		onTogglePlaceholder: (checked) => {
			setShowPlaceholder(Boolean(checked));
			resetPage();
		},
		onToggleSdgs: (value) => {
			setSdgsFilter((items) =>
				items.includes(value)
					? items.filter((item) => item !== value)
					: [...items, value].sort((a, b) => a - b),
			);
			resetPage();
		},
		onToggleStandard: (symbol, checked) => {
			setCourseStandardFilter((value) => ({ ...value, [symbol]: Boolean(checked) }));
			resetPage();
		},
		onToggleTimetable: (date, slot) => {
			toggleLesson(date, slot);
			resetPage();
		},
		onToggleConflict: (checked) => {
			setShowConflictCourse(Boolean(checked));
			resetPage();
		},
		recommandKeyword,
		searchCourseKeyword,
		sdgsFilter,
		sdgsOptions: syllabusFilterOptions.sdgs,
		showConflictCourse,
		showPlaceholder,
		sortBy,
		timetableFilter,
		setSortBy: (value) => {
			setSortBy(value);
			resetPage();
		},
	};

	const selectedStandards = Object.entries(courseStandardFilter)
		.filter(([, selected]) => selected)
		.map(([symbol]) => symbol);
	const timetableFilterCount = Object.values(timetableFilter).reduce(
		(sum, items) => sum + items.length,
		0,
	);
	const hasActiveFilter = Boolean(
		searchCourseKeyword.trim() ||
		!showConflictCourse ||
		showPlaceholder ||
		sortBy !== 'default' ||
		languageFilter ||
		selectedStandards.length ||
		categoryFilter.length ||
		academyFilter.length ||
		attributeFilter.length ||
		aiFilter.length ||
		sdgsFilter.length ||
		timetableFilterCount,
	);

	return (
		<div className='grid min-w-0 gap-[18px] lg:grid-cols-[340px_minmax(0,1fr)]'>
			<aside className='hidden h-screen overflow-auto bg-[rgb(var(--vs-background))] p-4 shadow-[0_5px_20px_rgba(0,0,0,var(--vs-shadow-opacity))] lg:sticky lg:top-0 lg:block lg:w-auto'>
				<AdvancedSearchSidebarContent {...searchControlsProps} />
			</aside>
			<section className='min-w-0 px-3 pt-4 pb-10 lg:pt-0 lg:pr-4 lg:pb-10 lg:pl-0'>
				<h1 className='sr-only'>搜尋課程</h1>
				<AdvancedSearchMobileControls {...searchControlsProps} />
				{onError ? (
					<Alert danger>
						<strong>搜尋時發生錯誤</strong>
						<pre>{errorMessage(onError)}</pre>
					</Alert>
				) : null}
				{metadataWarnings.map((warning) => (
					<Alert key={warning}>{warning}</Alert>
				))}
				{onError ? null : isLoading || !searchResult ? (
					<AdvancedSearchPageSkeleton />
				) : (
					<CourseList
						courses={searchResult}
						showMidListAd
						showConflictCourse={showConflictCourse}
						year={year}
						sem={sem}
						department={department}
						page={resultPage}
						layout={resultLayout}
						onPageChange={setResultPage}
						onLayoutChange={(nextLayout) => {
							setResultLayout(nextLayout);
							setResultPage(1);
						}}
						emptyState={
							<div className='grid justify-items-center gap-2 p-5 text-center'>
								<p className='m-0 font-semibold'>查無資料</p>
								<p className='m-0 max-w-md text-sm opacity-70'>
									{hasActiveFilter
										? '目前沒有符合篩選條件的課程。'
										: '這個資料集目前沒有可顯示的課程。'}
								</p>
								{hasActiveFilter ? (
									<p className='m-0 max-w-md text-sm opacity-70'>
										試著移除一個篩選條件，或清除全部篩選。
									</p>
								) : null}
								{hasActiveFilter ? (
									<Button className='m-0' onClick={reset}>
										清除篩選條件
									</Button>
								) : null}
							</div>
						}
					/>
				)}
				{!onError && !isLoading && searchResult?.length ? <AdsByGoogle placement='footer' /> : null}
			</section>
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
	if (id === 'language') return Number(Boolean(props.languageFilter));
	if (id === 'standard') {
		return props.courseStandardOptions.filter((symbol) => props.courseStandardFilter[symbol])
			.length;
	}
	if (id === 'category') return props.categoryFilter.length;
	if (id === 'academy') return props.academyFilter.length;
	if (id === 'attributes') return props.attributeFilter.length;
	if (id === 'syllabus') return Number(props.aiFilter.length > 0) + props.sdgsFilter.length;
	return Object.values(props.timetableFilter).reduce((sum, items) => sum + items.length, 0);
}

function getFilterSection(id: SearchSectionId) {
	return filterSections.find((section) => section.id === id) ?? filterSections[0];
}

function isFilterSectionVisible(id: SearchSectionId, props: AdvancedSearchControlsProps) {
	if (id === 'language') return props.languageOptions.length > 0;
	if (id === 'attributes') return props.attributeOptions.length > 0;
	if (id === 'syllabus') return props.aiOptions.length > 0 || props.sdgsOptions.length > 0;
	return true;
}

function getVisibleFilterSections(props: AdvancedSearchControlsProps) {
	return filterSections.filter((section) => isFilterSectionVisible(section.id, props));
}

function AdvancedSearchMobileControls(props: AdvancedSearchControlsProps) {
	const [activeSection, setActiveSection] = useState<SearchSectionId | null>(null);
	const filterScrollRef = useRef<HTMLDivElement | null>(null);
	const [filterScrollHint, setFilterScrollHint] = useState({ left: false, right: false });
	const hasActiveCondition =
		props.searchCourseKeyword.trim().length > 0 ||
		getVisibleFilterSections(props).some((section) => getFilterSectionCount(section.id, props) > 0);
	const visibleSections = getVisibleFilterSections(props);

	useEffect(() => {
		const scrollElement = filterScrollRef.current;
		if (!scrollElement) return undefined;

		let frame = 0;
		const updateScrollHint = () => {
			window.cancelAnimationFrame(frame);
			frame = window.requestAnimationFrame(() => {
				const maxScroll = scrollElement.scrollWidth - scrollElement.clientWidth;
				const next = {
					left: scrollElement.scrollLeft > 2,
					right: maxScroll - scrollElement.scrollLeft > 2,
				};
				setFilterScrollHint((current) =>
					current.left === next.left && current.right === next.right ? current : next,
				);
			});
		};

		updateScrollHint();
		scrollElement.addEventListener('scroll', updateScrollHint, { passive: true });
		window.addEventListener('resize', updateScrollHint);
		const observer =
			typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateScrollHint);
		observer?.observe(scrollElement);

		return () => {
			window.cancelAnimationFrame(frame);
			scrollElement.removeEventListener('scroll', updateScrollHint);
			window.removeEventListener('resize', updateScrollHint);
			observer?.disconnect();
		};
	}, [
		hasActiveCondition,
		props.courseStandardOptions.length,
		props.academyList.length,
		visibleSections.length,
	]);

	return (
		<section className='mb-4 grid min-w-0 gap-3 lg:hidden'>
			<div className='flex min-w-0 items-center'>
				<label className='relative min-w-0 flex-1'>
					<span className='sr-only'>搜尋關鍵字</span>
					<Search className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[rgba(var(--vs-text),0.5)]' />
					<Input
						value={props.searchCourseKeyword}
						onChange={(event) => props.onKeywordChange(event.target.value)}
						placeholder='搜尋課程、教師、課號、班級'
						className='rounded-control h-11 pr-3 pl-9 text-base'
					/>
				</label>
			</div>
			<SuggestedKeywords
				keywords={props.recommandKeyword}
				value={props.searchCourseKeyword}
				onSelect={props.onKeywordChange}
				scrollable
			/>
			<div className='relative min-w-0'>
				{filterScrollHint.left ? (
					<div
						aria-hidden='true'
						className='from-page pointer-events-none absolute top-0 left-0 z-[1] h-full w-10 bg-linear-to-r to-transparent'
					/>
				) : null}
				{filterScrollHint.right ? (
					<div
						aria-hidden='true'
						className='from-page pointer-events-none absolute top-0 right-0 z-[1] h-full w-10 bg-linear-to-l to-transparent'
					/>
				) : null}
				<div
					ref={filterScrollRef}
					className='flex min-w-0 gap-2 overflow-x-auto overscroll-x-contain px-1 pb-1 [-webkit-overflow-scrolling:touch]'
				>
					{hasActiveCondition ? (
						<button
							type='button'
							className='rounded-control inline-flex min-h-11 shrink-0 items-center gap-1.5 border border-[rgba(var(--vs-text),0.12)] bg-[rgb(var(--vs-background))] px-3 text-sm text-[rgb(var(--vs-text))] transition-colors'
							onClick={props.onReset}
						>
							<X className='size-4 shrink-0' />
							<span>重設</span>
						</button>
					) : null}
					{visibleSections.map((section) => {
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
										className={`rounded-control inline-flex min-h-11 shrink-0 items-center gap-1.5 border px-3 text-sm transition-colors ${
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
					className={`rounded-control m-0 px-3 ${scrollable ? 'min-h-11' : 'min-h-8 text-xs'}`}
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
					aria-label='回首頁'
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
			{getVisibleFilterSections(props).map((section) => (
				<SearchSection
					key={section.id}
					sectionId={section.id}
					open={getFilterSectionCount(section.id, props) > 0 || section.id === 'display'}
				>
					<FilterSectionContent id={section.id} {...props} />
				</SearchSection>
			))}
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

	if (id === 'language') {
		return (
			<Field label='授課語言'>
				<Select
					aria-label='授課語言'
					value={props.languageFilter || ALL_LANGUAGE_FILTER}
					onChange={props.onLanguageChange}
				>
					<SelectOption value={ALL_LANGUAGE_FILTER}>不限</SelectOption>
					{props.languageOptions.map((value) => (
						<SelectOption key={value} value={value}>
							{languageLabel(value)}
						</SelectOption>
					))}
				</Select>
			</Field>
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

	if (id === 'attributes') {
		return (
			<fieldset className='grid gap-2 border-0 p-0'>
				<legend className='text-sm font-medium'>課程屬性</legend>
				{props.attributeOptions.map((key) => (
					<label key={key} className='flex min-h-7 cursor-pointer items-center gap-2'>
						<Checkbox
							checked={props.attributeFilter.includes(key)}
							onCheckedChange={() => props.onToggleAttribute(key)}
						/>
						<span>{courseAttributeLabels[key]}</span>
					</label>
				))}
			</fieldset>
		);
	}

	if (id === 'syllabus') {
		return (
			<div className='grid gap-3'>
				{props.aiOptions.length ? (
					<fieldset className='grid gap-2 border-0 p-0'>
						<legend className='text-sm font-medium'>AI 教學方式</legend>
						<label className='flex min-h-7 cursor-pointer items-center gap-2'>
							<Checkbox
								checked={props.aiFilter.includes(AI_ANY_FILTER)}
								onCheckedChange={() => props.onToggleAi(AI_ANY_FILTER)}
							/>
							<span>有導入 AI</span>
						</label>
						{props.aiOptions.map((value) => (
							<label key={value} className='flex min-h-7 cursor-pointer items-center gap-2'>
								<Checkbox
									checked={props.aiFilter.includes(value)}
									onCheckedChange={() => props.onToggleAi(value)}
								/>
								<span>{value}</span>
							</label>
						))}
					</fieldset>
				) : null}
				{props.sdgsOptions.length ? (
					<fieldset className='grid gap-2 border-0 p-0'>
						<legend className='text-sm font-medium'>聯合國永續發展目標（SDGs）</legend>
						<div className='grid grid-cols-2 gap-x-3 gap-y-2'>
							{props.sdgsOptions.map((value) => (
								<label key={value} className='flex min-h-7 cursor-pointer items-center gap-2'>
									<Checkbox
										checked={props.sdgsFilter.includes(value)}
										onCheckedChange={() => props.onToggleSdgs(value)}
									/>
									<span>SDG {value}</span>
								</label>
							))}
						</div>
					</fieldset>
				) : null}
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

function toggleArrayValue<T>(values: T[], value: T) {
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

function parsePage(value: string | null) {
	const page = Number(value);
	return Number.isInteger(page) && page > 0 ? page : 1;
}

function createLocationKey(pathname: string, search: unknown) {
	const query = createSearchParams(search as Record<string, unknown>).toString();
	return query ? `${pathname}?${query}` : pathname;
}

function parseCourseListLayout(value: string | null): CourseListLayout {
	return value === 'table' ? 'table' : 'card';
}
