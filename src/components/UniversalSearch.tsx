import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { cn } from '../lib/utils';
import { ArrowRight, History, Loader, Search, X } from 'lucide-react';
import { courseTitle, searchCourseList } from '../lib/courseUtils';
import { animateSearchResults } from '../lib/motion';
import { useApp } from '../state/AppContext';
import type { Course, SearchHistoryItem } from '../types/course';

export function UniversalSearch({ navbar = false, className = '' }) {
	const { dataset, getCourses } = useApp();
	const navigate = useNavigate();
	const inputRef = useRef<HTMLInputElement | null>(null);
	const resultsRef = useRef<HTMLDivElement | null>(null);
	const searchId = useId();
	const resultsId = `${searchId}-results`;
	const [input, setInput] = useState('');
	const [courseData, setCourseData] = useState<Course[] | null>(null);
	const [focused, setFocused] = useState(false);
	const [loading, setLoading] = useState(false);
	const [currentSelectionIndex, setCurrentSelectionIndex] = useState(-1);

	useEffect(() => {
		let cancelled = false;
		if (!focused && !input) return undefined;
		setLoading(true);
		getCourses()
			.then((data) => {
				if (!cancelled) setCourseData(data);
			})
			.catch(() => {
				if (!cancelled) setCourseData([]);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [dataset.year, dataset.sem, dataset.department, focused, input, getCourses]);

	const items = useMemo(() => {
		if (!input) return JSON.parse(localStorage.getItem('search-history') || '[]').reverse();
		if (!courseData) return [];
		const courses = searchCourseList(courseData, input).slice(0, 20);
		const results: SearchHistoryItem[] = courses.map((course) => ({
			id: course.id,
			key: `${course.id}`,
			to: `/course/${dataset.year}/${dataset.sem}/${course.id}`,
			category: `${course.id} ${(course.teacher || []).map((item) => item.name).join(' ')}`.trim(),
			text: courseTitle(course),
			description: (course.teacher || []).map((item) => item.name).join('、'),
			course,
		}));
		const keyword = input.trim();
		if (!keyword) return results;
		// Always offer a way forward, so an empty result list never looks like a broken search.
		const query = new URLSearchParams({
			year: dataset.year,
			sem: dataset.sem,
			d: dataset.department,
			q: JSON.stringify({ k: keyword }),
		});
		return [
			...results,
			{
				id: 'advanced-search',
				key: 'advanced-search',
				to: `/advanced-search?${query}`,
				category: results.length ? '想找更多？' : '找不到直接符合的課程',
				text: `用進階搜尋尋找「${keyword}」`,
				transient: true,
			},
		];
	}, [courseData, input, dataset.year, dataset.sem, dataset.department]);

	useEffect(() => {
		setCurrentSelectionIndex(-1);
	}, [input, focused]);

	useEffect(() => {
		if (currentSelectionIndex < 0) return;
		const activeNode = resultsRef.current?.querySelector('[data-active="true"]');
		activeNode?.scrollIntoView?.({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
	}, [currentSelectionIndex]);

	useEffect(() => {
		return animateSearchResults(resultsRef.current, focused);
	}, [focused, items.length]);

	function remember(item) {
		setInput('');
		setFocused(false);
		setCurrentSelectionIndex(-1);
		if (item.transient) return;
		const historyItem = { ...item, id: item.id || item.key || item.to, history: true };
		const history = JSON.parse(localStorage.getItem('search-history') || '[]').filter(
			(entry) => entry.to !== item.to,
		);
		localStorage.setItem(
			'search-history',
			JSON.stringify(
				[...history, historyItem]
					.slice(-10)
					.reverse()
					.filter((x, index, array) => array.findIndex((y) => y.id === x.id) === index)
					.reverse(),
			),
		);
	}

	function selectItem(item: SearchHistoryItem) {
		remember(item);
		if (item.to) navigate({ to: item.to });
	}

	function onKeyDown(event) {
		if (!items.length && event.key !== 'Escape') return;
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			setCurrentSelectionIndex((value) => Math.min(value + 1, items.length - 1));
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			setCurrentSelectionIndex((value) => Math.max(value - 1, 0));
		} else if (event.key === 'Enter') {
			// Without an explicit selection, Enter takes the keyword to the full search page.
			const item =
				currentSelectionIndex >= 0
					? items[currentSelectionIndex]
					: items.find((entry) => entry.transient);
			if (item) {
				event.preventDefault();
				selectItem(item);
			}
		} else if (event.key === 'Escape') {
			event.preventDefault();
			inputRef.current?.blur?.();
		}
	}

	return (
		<div
			className={cn(
				'relative mx-auto w-full',
				navbar ? 'max-w-[512px] md:max-w-[512px]' : 'max-w-none',
				className,
			)}
		>
			<div
				className={cn(
					'rounded-control flex border transition-[background-color,border-color,box-shadow] duration-200',
					focused
						? 'shadow-raised border-[rgba(var(--vs-primary),0.55)] bg-[rgb(var(--vs-background))] ring-[3px] ring-[rgba(var(--vs-primary),0.16)]'
						: 'border-[rgba(var(--vs-text),0.12)] bg-[rgb(var(--vs-background))] hover:border-[rgba(var(--vs-text),0.24)]',
				)}
			>
				<input
					ref={inputRef}
					type='text'
					role='combobox'
					aria-label='搜尋課程、教師、課號、班級'
					aria-autocomplete='list'
					aria-expanded={focused && items.length > 0}
					aria-controls={resultsId}
					aria-activedescendant={
						currentSelectionIndex >= 0 ? `${resultsId}-item-${currentSelectionIndex}` : undefined
					}
					placeholder='搜尋課程、教師、課號、班級'
					autoComplete='off'
					value={input}
					onFocus={() => setFocused(true)}
					onBlur={() => setTimeout(() => setFocused(false), 120)}
					onPointerDown={() => setFocused(true)}
					onChange={(event) => {
						setInput(event.target.value);
						setFocused(true);
					}}
					onKeyDown={onKeyDown}
					onMouseEnter={() => setCurrentSelectionIndex(-1)}
					className={cn(
						'min-w-0 flex-1 bg-transparent text-[16px] text-[rgb(var(--vs-text))] outline-none',
						navbar ? 'px-3 py-2' : 'px-4 py-3',
					)}
				/>
				<button
					type='button'
					aria-label={input ? '清除搜尋' : '搜尋'}
					className={cn(
						'text-foreground-soft flex shrink-0 items-center justify-center transition-colors duration-200 hover:text-[rgb(var(--vs-text))]',
						navbar ? 'px-3 py-2' : 'px-4 py-3',
					)}
					onClick={() => {
						if (input) {
							setInput('');
							setCurrentSelectionIndex(-1);
						}
						inputRef.current?.focus?.();
					}}
				>
					{input ? (
						<X className='text-2xl' />
					) : loading ? (
						<Loader aria-hidden='true' className='animate-spin text-2xl' />
					) : (
						<Search className='text-2xl' />
					)}
				</button>
			</div>
			<div
				id={resultsId}
				ref={resultsRef}
				data-search-results
				role='listbox'
				aria-label='搜尋建議'
				className={cn(
					'rounded-surface bg-sheen-surface shadow-overlay absolute top-full right-0 left-0 z-[999] mt-2 max-h-[512px] overflow-y-auto bg-[rgb(var(--vs-background))] transition-[opacity,transform] duration-200',
					focused
						? 'pointer-events-auto opacity-100'
						: 'pointer-events-none -translate-y-2 opacity-0',
					'max-h-[256px] md:max-h-[512px]',
				)}
			>
				{focused &&
					items.map((item, index) => (
						<Link
							id={`${resultsId}-item-${index}`}
							key={item.key || item.to || `${item.category}-${item.text}-${index}`}
							to={item.to || '/'}
							role='option'
							aria-selected={currentSelectionIndex === index}
							data-search-result-item
							data-active={currentSelectionIndex === index ? 'true' : 'false'}
							className={cn(
								'flex items-center overflow-hidden no-underline',
								'text-[rgb(var(--vs-text))]',
								index > 0 && 'border-t border-[rgba(var(--vs-gray-2),1)]',
								currentSelectionIndex === index && 'bg-[rgba(var(--vs-text),0.05)]',
							)}
							onClick={() => remember(item)}
							onMouseDown={(event) => event.preventDefault()}
							onMouseEnter={() => setCurrentSelectionIndex(index)}
						>
							<div className={cn('flex-1', navbar ? 'px-3 py-2' : 'px-4 py-3')}>
								<div className='text-xs opacity-80'>
									{item.category || (item.history ? '歷史' : '')}
								</div>
								<div className='text-base font-semibold'>
									{item.text || item.label || item.name}
								</div>
								{item.description ? (
									<div className='text-xs opacity-70'>{item.description}</div>
								) : null}
							</div>
							<div
								className={cn(
									'transition-transform duration-200',
									navbar ? 'px-3 py-2' : 'px-4 py-3',
									currentSelectionIndex === index && 'translate-x-[3px]',
								)}
							>
								{item.history ? (
									currentSelectionIndex === index ? (
										<ArrowRight className='text-2xl' />
									) : (
										<History className='text-2xl' />
									)
								) : (
									<ArrowRight className='text-2xl' />
								)}
							</div>
						</Link>
					))}
			</div>
		</div>
	);
}
