import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert } from '../components/ui-kit/Alert';
import { Card } from '../components/ui-kit/Card';
import { CardTitle } from '../components/ui-kit/CardTitle';
import { StandardPickerSkeleton } from '../components/ui-kit/PageSkeletons';
import { fetchStandards, fetchStandardYear } from '../lib/courseApi';
import { createSearchObject, createSearchParams } from '../lib/urlState';
import type {
	GroupedStandardDepartment,
	QueryValue,
	StandardCourse,
	StandardYearData,
} from '../types/course';
import { errorMessage } from '../lib/error';

export function StandardPage() {
	const { location } = useRouterState();
	const navigate = useNavigate();
	const params = useMemo(
		() => createSearchParams(location.search),
		[location.search],
	);
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
		return { ...data, courses: grouped } satisfies GroupedStandardDepartment;
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
	return (
		<div>
			<h1>課程標準</h1>
			{error ? (
				<Alert danger>
					<strong>發生了錯誤</strong>
					<pre>{errorMessage(error)}</pre>
				</Alert>
			) : null}
			{!years ? <StandardPickerSkeleton /> : null}
			{year ? (
				<>
					<h3>
						已選擇的項目{' '}
						<span style={{ fontSize: '.8em', opacity: 0.7, fontWeight: 'normal' }}>點擊來取消</span>
					</h3>
					<div className='grid grid-cols-3 gap-3 lg:grid-cols-5'>
						<Card
							className='px-4 py-3'
							onClick={() => setQuery({ year: '', system: '', department: '' })}
						>
							<CardTitle>{formatRocYear(year)}</CardTitle>
							<p>年</p>
						</Card>
						{system ? (
							<Card className='px-4 py-3' onClick={() => setQuery({ system: '', department: '' })}>
								<CardTitle>{system}</CardTitle>
								<p>學制</p>
							</Card>
						) : null}
						{department ? (
							<Card className='px-4 py-3' onClick={() => setQuery({ department: '' })}>
								<CardTitle>{department}</CardTitle>
								<p>科系</p>
							</Card>
						) : null}
					</div>
				</>
			) : null}
			{years && !year ? (
				<>
					<h3>選擇入學年度</h3>
					<div className='overflow-hidden rounded-[8px] border border-[rgba(var(--vs-text),0.1)]'>
						{yearItems.map((item, index) => (
							<div
								key={item}
								onClick={() => setQuery({ year: item })}
								className={`cursor-pointer px-4 py-3 ${index > 0 ? 'border-t border-[rgba(var(--vs-text),0.1)]' : ''} hover:bg-[rgba(var(--vs-text),0.05)]`}
							>
								{formatRocYear(item)}
							</div>
						))}
					</div>
				</>
			) : null}
			{year && !standardData ? <StandardPickerSkeleton /> : null}
			{standardData && !system ? (
				<>
					<h3>選擇學制</h3>
					<div className='overflow-hidden rounded-[8px] border border-[rgba(var(--vs-text),0.1)]'>
						{systems.map((item, index) => (
							<div
								key={item}
								onClick={() => setQuery({ system: item })}
								className={`cursor-pointer px-4 py-3 ${index > 0 ? 'border-t border-[rgba(var(--vs-text),0.1)]' : ''} hover:bg-[rgba(var(--vs-text),0.05)]`}
							>
								{item}
							</div>
						))}
					</div>
				</>
			) : null}
			{standardData && system && !department ? (
				<>
					<h3>選擇系所</h3>
					<div className='overflow-hidden rounded-[8px] border border-[rgba(var(--vs-text),0.1)]'>
						{departments.map((item, index) => (
							<div
								key={item}
								onClick={() => setQuery({ department: item })}
								className={`cursor-pointer px-4 py-3 ${index > 0 ? 'border-t border-[rgba(var(--vs-text),0.1)]' : ''} hover:bg-[rgba(var(--vs-text),0.05)]`}
							>
								{item}
							</div>
						))}
					</div>
				</>
			) : null}
			{department && current ? (
				<>
					<h3>{department}</h3>
					<div className='grid grid-cols-3 gap-3 lg:grid-cols-5'>
						{Object.entries(current.credits || {})
							.filter(([, value]) => value !== 0)
							.map(([key, value]) => (
								<Card key={key}>
									<CardTitle>{value}</CardTitle>
									<p>{key}</p>
								</Card>
							))}
					</div>
					<h3>相關規定事項</h3>
					{current.rules?.length ? (
						<ul>
							{current.rules.map((item) => (
								<li key={item}>{item}</li>
							))}
						</ul>
					) : (
						<Alert>無相關規定事項</Alert>
					)}
					<h3>課程</h3>
					<div className='grid gap-4 lg:grid-cols-2'>
						{Object.entries(current.courses || {}).map(([courseYear, yearData]) => (
							<div key={courseYear} className='flex-1'>
								{(Object.entries(yearData) as [string, StandardCourse[]][]).map(([sem, items]) => (
									<div key={`${courseYear}-${sem}`} style={{ marginBottom: '1rem' }}>
										<h4>
											{courseYear} 年級{sem === '1' ? '上' : '下'}學期
										</h4>
										<div className='overflow-hidden rounded-[8px] border border-[rgba(var(--vs-text),0.1)]'>
											{items.map((item, index) => (
												<div
													className={`flex items-center justify-between gap-2 px-4 py-3 ${index > 0 ? 'border-t border-[rgba(var(--vs-text),0.1)]' : ''}`}
													key={`${item.type}-${item.name}`}
												>
													<span>
														{item.type} {item.name}
													</span>
													<span>{item.credit} 學分</span>
												</div>
											))}
										</div>
									</div>
								))}
							</div>
						))}
					</div>
				</>
			) : null}
		</div>
	);
}

function formatRocYear(value) {
	const text = String(value || '');
	return /^\d+$/.test(text) ? `${text} 年` : text;
}
