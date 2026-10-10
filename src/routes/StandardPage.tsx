import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { AdsByGoogle } from '../components/AdsByGoogle';
import { Alert } from '../components/ui-kit/Alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { StandardPickerSkeleton } from '../components/ui-kit/PageSkeletons';
import { StudentPrefixSearch } from '../components/StudentPrefixSearch';
import { Select, SelectOption } from '../components/ui-kit/Select';
import { fetchStandards, fetchStandardYear } from '../lib/courseApi';
import { createSearchObject, createSearchParams } from '../lib/urlState';
import type {
	GroupedStandardDepartment,
	QueryValue,
	StandardCourse,
	StandardYearData,
} from '../types/course';
import { errorMessage } from '../lib/error';
import { courseStandard, formatCredit, isZeroCreditValue } from '../lib/courseUtils';
import { Building2, Calendar, Search } from 'lucide-react';

const courseStandardEntries = Object.entries(courseStandard);

export function StandardPage() {
	const { location } = useRouterState();
	const navigate = useNavigate();
	const params = useMemo(() => createSearchParams(location.search), [location.search]);
	const [years, setYears] = useState<string[] | null>(null);
	const [error, setError] = useState<unknown>(null);
	const [year, setYear] = useState(params.get('year') || '');
	const [standardData, setStandardData] = useState<StandardYearData | null>(null);
	const [system, setSystem] = useState(params.get('system') || '');
	const [department, setDepartment] = useState(params.get('department') || '');

	useEffect(() => {
		fetchStandards()
			.then(setYears)
			.catch((value) => {
				setError(value);
				setYears([]);
			});
	}, []);

	useEffect(() => {
		if (!year) return;
		let cancelled = false;
		setStandardData(null);
		setError(null);
		fetchStandardYear(year)
			.then((data) => {
				if (!cancelled) setStandardData(data);
			})
			.catch((value) => {
				if (cancelled) return;
				setError(value);
				setStandardData({});
			});
		return () => {
			cancelled = true;
		};
	}, [year]);

	const systems = Object.keys(standardData || {});

	const departments = system
		? Object.keys(standardData?.[system] || {})
				.sort((a, b) => a.localeCompare(b))
				.sort((a, b) => a.length - b.length)
		: [];

	const current = useMemo(() => {
		const data =
			system && department ? structuredClone(standardData?.[system]?.[department]) : null;
		if (!data) return null;
		const grouped: Record<string, Record<string, StandardCourse[]>> = {};
		for (const course of data.courses || []) {
			const courseYear = course.year || '';
			const courseSem = course.sem || '';
			if (!grouped[courseYear]) grouped[courseYear] = {};
			if (!grouped[courseYear][courseSem]) grouped[courseYear][courseSem] = [];
			grouped[courseYear][courseSem].push(course);
		}
		const sorted: Record<string, Record<string, StandardCourse[]>> = {};
		Object.keys(grouped)
			.sort((a, b) => a.localeCompare(b))
			.forEach((k) => {
				sorted[k] = grouped[k];
			});
		return { ...data, courses: sorted } satisfies GroupedStandardDepartment;
	}, [standardData, system, department]);

	useEffect(() => {
		if (year && system && department)
			localStorage.setItem('data-standard-query', JSON.stringify({ year, system, department }));
	}, [year, system, department]);

	const yearItems = useMemo(() => {
		if (!years) return [];
		return Array.isArray(years) ? [...years] : Object.keys(years).reverse();
	}, [years]);

	function setQuery(next: Record<string, QueryValue | undefined>) {
		if (location.pathname !== '/standard') return;
		const query = { year, system, department, ...next };
		for (const key of Object.keys(query)) if (!query[key]) delete query[key];
		setYear(query.year || '');
		setSystem(query.system || '');
		setDepartment(query.department || '');
		void navigate({ to: '/standard', search: createSearchObject(query) });
	}

	const legendEntries = useMemo(() => {
		const courses = standardData?.[system]?.[department]?.courses || [];
		const usedTypes = new Set(courses.map((course) => course.type));
		return courseStandardEntries.filter(([symbol]) => usedTypes.has(symbol));
	}, [standardData, system, department]);

	const creditItems = useMemo(() => {
		if (!current?.credits) return [];
		return Object.entries(current.credits).filter(([, value]) => !isZeroCreditValue(value));
	}, [current]);

	function gradeLabel(courseYear: string, sem: string) {
		return `${courseYear} 年級${sem === '1' ? '上' : sem === '2' ? '下' : ''}學期`;
	}

	return (
		<div className='flex flex-col gap-6'>
			<div className='flex flex-col gap-1'>
				<h1 className='m-0'>課程標準</h1>
				<p className='m-0 text-sm opacity-70'>輸入入學年度或學號前綴，查看課程規劃與畢業學分要求</p>
			</div>

			{error ? (
				<Alert danger>
					<strong>發生了錯誤</strong>
					<pre>{errorMessage(error)}</pre>
				</Alert>
			) : null}

			{!years ? <StandardPickerSkeleton /> : null}

			{years ? (
				<Tabs defaultValue='search' className='gap-3'>
					<TabsList aria-label='課程標準查詢方式'>
						<TabsTrigger value='search'>快速搜尋</TabsTrigger>
						<TabsTrigger value='manual'>條件選擇</TabsTrigger>
					</TabsList>
					<TabsContent value='search'>
						<StudentPrefixSearch years={yearItems} onSelect={setQuery} />
					</TabsContent>
					<TabsContent value='manual'>
						<div className='grid gap-3 sm:grid-cols-3'>
							<div className='flex flex-col gap-1'>
								<label
									htmlFor='standard-year'
									className='flex items-center gap-1.5 text-sm font-medium opacity-75'
								>
									<Calendar className='size-3.5' />
									入學年度
								</label>
								<Select
									id='standard-year'
									className='rounded-surface'
									value={year}
									onChange={(v) => setQuery({ year: v, system: '', department: '' })}
									placeholder='選擇入學年度'
								>
									{yearItems.map((item) => (
										<SelectOption key={item} value={item}>
											{formatRocYear(item)}
										</SelectOption>
									))}
								</Select>
							</div>

							<div className='flex flex-col gap-1'>
								<label
									htmlFor='standard-system'
									className='flex items-center gap-1.5 text-sm font-medium opacity-75'
								>
									<Building2 className='size-3.5' />
									學制
								</label>
								<Select
									id='standard-system'
									className='rounded-surface'
									value={system}
									onChange={(v) => setQuery({ system: v, department: '' })}
									placeholder={!year ? '請先選擇年度' : !standardData ? '載入中…' : '選擇學制'}
									disabled={!year || !standardData}
								>
									{systems.map((item) => (
										<SelectOption key={item} value={item}>
											{item}
										</SelectOption>
									))}
								</Select>
							</div>

							<div className='flex flex-col gap-1'>
								<label
									htmlFor='standard-department'
									className='flex items-center gap-1.5 text-sm font-medium opacity-75'
								>
									<Search className='size-3.5' />
									系所
								</label>
								<Select
									id='standard-department'
									className='rounded-surface'
									value={department}
									onChange={(v) => setQuery({ department: v })}
									placeholder={!system ? '請先選擇學制' : '選擇系所'}
									disabled={!system}
								>
									{departments.map((item) => (
										<SelectOption key={item} value={item}>
											{item}
										</SelectOption>
									))}
								</Select>
							</div>
						</div>
					</TabsContent>
				</Tabs>
			) : null}

			{year && system && department ? (
				<p
					className='m-0 flex flex-col gap-0.5 border-t border-[rgba(var(--vs-text),0.1)] pt-5'
					aria-live='polite'
				>
					<span className='text-sm opacity-65'>目前查看</span>
					<strong className='text-shadow-emboss text-xl leading-snug font-semibold'>
						{formatRocYear(year)}入學 · {system} · {department}
					</strong>
				</p>
			) : null}

			{year && !standardData ? <StandardPickerSkeleton content /> : null}

			{department && current ? (
				<>
					<section className='flex flex-col gap-3'>
						<h2 className='m-0 text-lg font-semibold'>畢業學分要求</h2>
						<dl className='rounded-surface shadow-rest m-0 grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-px overflow-hidden bg-[rgba(var(--vs-text),0.08)]'>
							{creditItems.map(([key, value]) => (
								<div
									key={key}
									className='flex min-w-0 flex-col-reverse gap-1 bg-[rgb(var(--vs-background))] px-4 py-3'
								>
									<dt className='text-xs leading-snug opacity-70'>{key}</dt>
									<dd className='m-0 text-2xl leading-tight font-semibold tabular-nums'>
										{formatCredit(value)}
									</dd>
								</div>
							))}
						</dl>
					</section>

					<section className='flex flex-col gap-3'>
						<h2 className='m-0 text-lg font-semibold'>相關規定事項</h2>
						{current.rules?.length ? (
							<ol className='rounded-surface shadow-rest m-0 list-none divide-y divide-[rgba(var(--vs-text),0.08)] bg-[rgb(var(--vs-background))] p-0'>
								{current.rules.map((item, index) => (
									<li
										key={item}
										className='grid grid-cols-[1.5rem_minmax(0,1fr)] gap-3 px-4 py-3 text-[0.95rem] leading-relaxed sm:px-5'
									>
										<span
											aria-hidden='true'
											className='text-sm leading-[1.7] font-medium text-[rgba(var(--vs-text),0.5)] tabular-nums'
										>
											{index + 1}
										</span>
										<span className='max-w-[44rem]'>{item}</span>
									</li>
								))}
							</ol>
						) : (
							<Alert>無相關規定事項</Alert>
						)}
					</section>

					<section className='flex flex-col gap-3'>
						<div className='flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2'>
							<h2 className='m-0 text-lg font-semibold'>課程列表</h2>
							{legendEntries.length > 0 ? (
								<dl
									aria-label='課程類型圖例'
									className='m-0 flex flex-wrap gap-x-4 gap-y-1 text-xs'
								>
									{legendEntries.map(([symbol, label]) => (
										<div key={symbol} className='flex items-center gap-1.5'>
											<dt className='flex size-5 shrink-0 items-center justify-center text-sm leading-none'>
												{symbol}
											</dt>
											<dd className='m-0 text-[rgba(var(--vs-text),0.75)]'>{label}</dd>
										</div>
									))}
								</dl>
							) : null}
						</div>
						<div className='flex flex-col gap-5'>
							{Object.entries(current.courses || {}).map(([courseYear, yearData]) => (
								<div key={courseYear} className='grid items-start gap-4 md:grid-cols-2'>
									{(Object.entries(yearData) as [string, StandardCourse[]][]).map(
										([sem, items]) => (
											<div
												key={`${courseYear}-${sem}`}
												className='rounded-surface shadow-rest overflow-hidden bg-[rgb(var(--vs-background))]'
											>
												<div className='flex items-baseline justify-between gap-3 border-b border-[rgba(var(--vs-text),0.08)] bg-linear-to-b from-[rgba(var(--vs-text),0.015)] to-[rgba(var(--vs-text),0.045)] px-4 py-2.5'>
													<h3 className='m-0 text-sm font-semibold'>
														{gradeLabel(courseYear, sem)}
													</h3>
													<span className='shrink-0 text-xs tabular-nums opacity-65'>
														{items.length} 門 · {formatCredit(sumCredits(items))} 學分
													</span>
												</div>
												{items.map((item, index) => (
													<div
														className={`flex items-center justify-between gap-3 px-4 py-2.5 ${index > 0 ? 'border-t border-[rgba(var(--vs-text),0.06)]' : ''}`}
														key={`${item.type}-${item.name}`}
													>
														<span className='flex min-w-0 items-center gap-2.5 text-sm'>
															<span className='grid size-5 shrink-0 place-items-center text-sm leading-none text-[rgba(var(--vs-text),0.7)]'>
																{item.type}
															</span>
															<span className='truncate'>{item.name}</span>
														</span>
														<span className='shrink-0 text-sm tabular-nums opacity-60'>
															{formatCredit(item.credit)} 學分
														</span>
													</div>
												))}
											</div>
										),
									)}
								</div>
							))}
						</div>
					</section>
				</>
			) : null}
			{!error && current && Object.keys(current.courses || {}).length > 0 ? (
				<AdsByGoogle placement='footer' />
			) : null}
		</div>
	);
}

function sumCredits(items: StandardCourse[]) {
	return items.reduce((sum, item) => {
		const credit = Number(formatCredit(item.credit));
		return Number.isFinite(credit) ? sum + credit : sum;
	}, 0);
}

function formatRocYear(value: string) {
	const text = String(value || '');
	return /^\d+$/.test(text) ? `${text} 年` : text;
}
