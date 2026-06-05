import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert } from '../components/ui-kit/Alert';
import { Card } from '../components/ui-kit/Card';
import { CardTitle } from '../components/ui-kit/CardTitle';
import { StandardPickerSkeleton } from '../components/ui-kit/PageSkeletons';
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
import { courseStandard } from '../lib/courseUtils';
import { BookOpen, Building2, Calendar, GraduationCap, ListChecks, Search } from 'lucide-react';

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
		setStandardData(null);
		fetchStandardYear(year)
			.then(setStandardData)
			.catch((value) => {
				setError(value);
				setStandardData({});
			});
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

	const creditItems = useMemo(() => {
		if (!current?.credits) return [];
		return Object.entries(current.credits).filter(([, v]) => v !== 0);
	}, [current]);

	function gradeLabel(courseYear: string, sem: string) {
		return `${courseYear} 年級${sem === '1' ? '上' : sem === '2' ? '下' : ''}學期`;
	}

	return (
		<div className='mx-auto max-w-5xl space-y-4'>
			<h1 className='text-2xl font-semibold tracking-tight'>課程標準</h1>
			<p className='text-sm opacity-60'>
				選擇入學年度、學制與科系，查看該科系的課程規劃與畢業學分要求
			</p>

			{error ? (
				<Alert danger>
					<strong>發生了錯誤</strong>
					<pre>{errorMessage(error)}</pre>
				</Alert>
			) : null}

			{!years ? <StandardPickerSkeleton /> : null}

			{years ? (
				<div className='space-y-4'>
					<div className='flex flex-col gap-3 sm:flex-row'>
						<div className='flex-1 space-y-1.5'>
							<label className='flex items-center gap-1.5 text-xs font-medium opacity-50'>
								<Calendar className='size-3.5' />
								入學年度
							</label>
							<Select
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

						<div className='flex-1 space-y-1.5'>
							<label className='flex items-center gap-1.5 text-xs font-medium opacity-50'>
								<Building2 className='size-3.5' />
								學制
							</label>
							<Select
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

						<div className='flex-1 space-y-1.5'>
							<label className='flex items-center gap-1.5 text-xs font-medium opacity-50'>
								<Search className='size-3.5' />
								系所
							</label>
							<Select
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
				</div>
			) : null}

			{year && !standardData ? <StandardPickerSkeleton content /> : null}

			{department && current ? (
				<>
					<div>
						<h2 className='text-lg font-semibold'>畢業學分要求</h2>
						<div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5'>
							{creditItems.map(([key, value]) => (
								<Card key={key}>
									<CardTitle className='tabular-nums'>{value}</CardTitle>
									<p>{key}</p>
								</Card>
							))}
						</div>
					</div>

					<div>
						<h2 className='text-lg font-semibold'>相關規定事項</h2>
						{current.rules?.length ? (
							<ul className='space-y-2 rounded-lg border border-[rgba(var(--vs-text),0.1)] bg-[rgb(var(--vs-background))] p-4'>
								{current.rules.map((item) => (
									<li key={item} className='flex items-start gap-2 text-sm leading-relaxed'>
										<span className='mt-1.5 block size-1.5 shrink-0 rounded-full bg-[rgb(var(--vs-primary))]' />
										{item}
									</li>
								))}
							</ul>
						) : (
							<Alert>無相關規定事項</Alert>
						)}
					</div>

					<div>
						<h2 className='text-lg font-semibold'>課程列表</h2>
						<div className='grid gap-4 lg:grid-cols-2'>
							{Object.entries(current.courses || {}).map(([courseYear, yearData]) => (
								<div key={courseYear} className='space-y-3'>
									{(Object.entries(yearData) as [string, StandardCourse[]][]).map(
										([sem, items]) => (
											<div key={`${courseYear}-${sem}`} className='space-y-2'>
												<h3 className='text-sm font-semibold opacity-70'>
													{gradeLabel(courseYear, sem)}
												</h3>
												<div className='overflow-hidden rounded-lg border border-[rgba(var(--vs-text),0.1)] bg-[rgb(var(--vs-background))]'>
													{items.map((item, index) => (
														<div
															className={`flex items-center justify-between gap-2 px-4 py-2.5 ${index > 0 ? 'border-t border-[rgba(var(--vs-text),0.06)]' : ''}`}
															key={`${item.type}-${item.name}`}
														>
															<span className='flex min-w-0 items-center gap-2 text-sm'>
																<span className='shrink-0 rounded bg-[rgba(var(--vs-primary),0.08)] px-1 py-0.5 text-xs font-medium'>
																	{item.type}
																</span>
																<span className='truncate'>{item.name}</span>
															</span>
															<span className='shrink-0 text-sm tabular-nums opacity-60'>
																{item.credit} 學分
															</span>
														</div>
													))}
												</div>
											</div>
										),
									)}
								</div>
							))}
						</div>
					</div>

					<div className='rounded-lg border border-[rgba(var(--vs-text),0.08)] bg-[rgba(var(--vs-text),0.02)] p-4'>
						<h3 className='mb-2.5 text-xs font-medium'>課程類型圖例</h3>
						<div className='flex flex-wrap gap-2'>
							{courseStandardEntries.map(([symbol, label]) => (
								<div
									key={symbol}
									className='inline-flex items-center gap-1.5 rounded border border-[rgba(var(--vs-text),0.1)] bg-[rgb(var(--vs-background))] px-2 py-1 text-xs'
								>
									<span className='rounded bg-[rgba(var(--vs-primary),0.08)] px-1 py-0.5 text-xs font-medium'>
										{symbol}
									</span>
									<span className='opacity-60'>{label}</span>
								</div>
							))}
						</div>
					</div>
				</>
			) : null}
		</div>
	);
}

function formatRocYear(value: string) {
	const text = String(value || '');
	return /^\d+$/.test(text) ? `${text} 年` : text;
}
