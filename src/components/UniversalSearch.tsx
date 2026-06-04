import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useRef, useState } from 'react';
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
		return courses.map((course) => ({
			id: course.id,
			key: `${course.id}`,
			to: `/course/${dataset.year}/${dataset.sem}/${course.id}`,
			category: `${course.id} ${(course.teacher || []).map((item) => item.name).join(' ')}`.trim(),
			text: courseTitle(course),
			description: (course.teacher || []).map((item) => item.name).join('、'),
			course,
		}));
	}, [courseData, input, dataset.year, dataset.sem]);

	useEffect(() => {
		setCurrentSelectionIndex(-1);
	}, [input, focused]);

	useEffect(() => {
		if (currentSelectionIndex < 0) return;
		const activeNode = document.querySelector('[data-search-results] [data-active=\"true\"]');
		activeNode?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
	}, [currentSelectionIndex]);

	useEffect(() => {
		return animateSearchResults(resultsRef.current, focused);
	}, [focused, items.length]);

	function remember(item) {
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
		setInput('');
		setFocused(false);
		setCurrentSelectionIndex(-1);
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
		} else if (event.key === 'Enter' || event.key === 'Tab') {
			if (currentSelectionIndex >= 0) {
				event.preventDefault();
				selectItem(items[currentSelectionIndex]);
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
					'flex rounded-lg border transition-all duration-200',
					focused
						? 'border-[rgba(var(--vs-gray-2),1)] bg-[rgb(var(--vs-gray-1))] shadow-[0_5px_20px_0_rgba(0,0,0,var(--vs-shadow-opacity,0.05))]'
						: 'border-transparent bg-[rgba(var(--vs-text),0.1)] hover:bg-[rgba(var(--vs-text),0.05)]',
					'dark:border-[rgba(var(--vs-text),0.05)] dark:bg-[rgba(var(--vs-text),0.05)] dark:hover:bg-[rgba(var(--vs-text),0.075)]',
				)}
			>
				<input
					ref={inputRef}
					type='text'
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
					className={cn(
						'flex shrink-0 items-center justify-center text-[rgba(var(--vs-text),0.8)] transition-all duration-200 hover:text-[rgb(var(--vs-text))]',
						navbar ? 'px-3 py-2' : 'px-4 py-3',
					)}
					onClick={() => {
						if (input) {
							setInput('');
							setCurrentSelectionIndex(-1);
							inputRef.current?.focus?.();
						}
					}}
				>
					{input ? (
						<X className='text-2xl' />
					) : loading ? (
						<Loader className='animate-spin text-2xl' />
					) : (
						<Search className='text-2xl' />
					)}
				</button>
			</div>
			<div
				ref={resultsRef}
				data-search-results
				className={cn(
					'absolute top-full right-0 left-0 z-[999] mt-2 max-h-[512px] overflow-y-auto rounded-lg bg-[rgb(var(--vs-background))] shadow-[0_20px_20px_0_rgba(0,0,0,var(--vs-background-opacity,0.02))] transition-all duration-200',
					focused
						? 'pointer-events-auto opacity-100'
						: 'pointer-events-none -translate-y-2 opacity-0',
					'max-h-[256px] md:max-h-[512px]',
				)}
			>
				{focused &&
					items.map((item, index) => (
						<Link
							key={item.key || item.to || `${item.category}-${item.text}-${index}`}
							to={item.to || '/'}
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
