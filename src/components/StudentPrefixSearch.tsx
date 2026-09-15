import { ArrowRight, Loader, RefreshCw, Search, X } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Button } from './ui-kit/Button';
import { Input } from './ui-kit/Input';
import { fetchStandardDepartments } from '../lib/courseApi';
import { findStudentPrefixMatches, parseNtutStudentPrefix } from '../lib/studentPrefix';
import { cn } from '../lib/utils';

type StandardDepartmentEntry = Awaited<ReturnType<typeof fetchStandardDepartments>>[number];
type Selection = { year: string; system: string; department: string };

type StudentPrefixSearchProps = {
	years: string[];
	onSelect: (selection: Selection) => void;
};

const FORMAT_HINT = '格式：先輸入入學年度，例如 109；再輸入一至兩碼系所前綴，例如 109a、109ab';

export function StudentPrefixSearch({ years, onSelect }: StudentPrefixSearchProps) {
	const inputRef = useRef<HTMLInputElement | null>(null);
	const rootRef = useRef<HTMLDivElement | null>(null);
	const resultsRef = useRef<HTMLDivElement | null>(null);
	const blurTimerRef = useRef<number | null>(null);
	const requestIdRef = useRef(0);
	const departmentsCacheRef = useRef(new Map<string, StandardDepartmentEntry[]>());
	const searchId = useId();
	const resultsId = `${searchId}-results`;

	const [input, setInput] = useState('');
	const [focused, setFocused] = useState(false);
	const [loadedDepartments, setLoadedDepartments] = useState<{
		year: string;
		entries: StandardDepartmentEntry[];
	} | null>(null);
	const [loadingYear, setLoadingYear] = useState<string | null>(null);
	const [errorYear, setErrorYear] = useState<string | null>(null);
	const [retryToken, setRetryToken] = useState(0);
	const [currentSelectionIndex, setCurrentSelectionIndex] = useState(-1);

	const parsed = useMemo(() => parseNtutStudentPrefix(input), [input]);
	const year = parsed?.year || '';
	const yearAvailable = Boolean(year && years.includes(year));
	const searchable = Boolean(parsed && yearAvailable);

	useEffect(() => {
		const requestId = ++requestIdRef.current;
		if (!searchable || !year) {
			setLoadedDepartments(null);
			setLoadingYear(null);
			setErrorYear(null);
			return undefined;
		}

		const cached = departmentsCacheRef.current.get(year);
		if (cached) {
			setLoadedDepartments({ year, entries: cached });
			setLoadingYear(null);
			setErrorYear(null);
			return undefined;
		}

		let cancelled = false;
		setLoadedDepartments(null);
		setLoadingYear(year);
		setErrorYear(null);
		fetchStandardDepartments(year)
			.then((data) => {
				if (cancelled || requestId !== requestIdRef.current) return;
				departmentsCacheRef.current.set(year, data);
				setLoadedDepartments({ year, entries: data });
				setLoadingYear(null);
			})
			.catch(() => {
				if (cancelled || requestId !== requestIdRef.current) return;
				setLoadedDepartments(null);
				setLoadingYear(null);
				setErrorYear(year);
			});

		return () => {
			cancelled = true;
		};
	}, [retryToken, searchable, year]);

	const matches = useMemo(() => {
		if (!searchable || !parsed || loadedDepartments?.year !== year) return [];
		return findStudentPrefixMatches(parsed, loadedDepartments.entries);
	}, [loadedDepartments, parsed, searchable, year]);

	const groups = useMemo(() => {
		const grouped = new Map<string, StandardDepartmentEntry[]>();
		for (const entry of matches) {
			const system = entry.system || '其他學制';
			const group = grouped.get(system);
			if (group) group.push(entry);
			else grouped.set(system, [entry]);
		}
		return Array.from(grouped, ([system, entries]) => ({ system, entries }));
	}, [matches]);

	const flatMatches = useMemo(() => groups.flatMap((group) => group.entries), [groups]);

	useEffect(() => {
		setCurrentSelectionIndex(-1);
	}, [input, focused, year]);

	useEffect(() => {
		if (currentSelectionIndex < 0) return;
		const activeNode = resultsRef.current?.querySelector('[data-active="true"]');
		activeNode?.scrollIntoView?.({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
	}, [currentSelectionIndex]);

	useEffect(() => {
		return () => {
			if (blurTimerRef.current !== null) window.clearTimeout(blurTimerRef.current);
		};
	}, []);

	function selectEntry(entry: StandardDepartmentEntry) {
		if (!parsed) return;
		onSelect({ year: parsed.year, system: entry.system, department: entry.department });
		setFocused(false);
		setCurrentSelectionIndex(-1);
		inputRef.current?.blur?.();
	}

	function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
		if (event.nativeEvent.isComposing || event.keyCode === 229) return;
		if (event.key === 'ArrowDown' && flatMatches.length) {
			event.preventDefault();
			setCurrentSelectionIndex((value) => Math.min(value + 1, flatMatches.length - 1));
		} else if (event.key === 'ArrowUp' && flatMatches.length) {
			event.preventDefault();
			setCurrentSelectionIndex((value) => Math.max(value - 1, 0));
		} else if (event.key === 'Enter' && flatMatches.length) {
			const index =
				currentSelectionIndex >= 0 ? currentSelectionIndex : flatMatches.length === 1 ? 0 : -1;
			if (index >= 0) {
				event.preventDefault();
				selectEntry(flatMatches[index]);
			}
		} else if (event.key === 'Escape') {
			event.preventDefault();
			setFocused(false);
			setCurrentSelectionIndex(-1);
			inputRef.current?.blur?.();
		}
	}

	function renderMessage() {
		if (!input.trim()) {
			return (
				<div className='flex flex-col gap-1 px-4 py-3 text-sm opacity-75'>
					<span>輸入入學年度或學號前綴即可尋找課程標準。</span>
					<span className='text-xs'>
						先輸入年度，例如 109；再輸入系所前綴，例如 109ab。不必輸入完整學號。
					</span>
				</div>
			);
		}
		if (!parsed) return <div className='px-4 py-3 text-sm opacity-75'>{FORMAT_HINT}</div>;
		if (!yearAvailable) {
			return <div className='px-4 py-3 text-sm opacity-75'>{year} 年目前沒有可查詢資料。</div>;
		}
		if (loadingYear === year) {
			return (
				<div className='flex items-center gap-2 px-4 py-3 text-sm opacity-75' role='status'>
					<Loader aria-hidden='true' className='size-4 animate-spin' />
					載入 {year} 年的系所建議…
				</div>
			);
		}
		if (errorYear === year) {
			return (
				<div className='flex items-center justify-between gap-3 px-4 py-3 text-sm'>
					<span className='text-[rgb(var(--vs-danger))]'>
						載入 {year} 年的系所建議失敗，請再試一次。
					</span>
					<Button
						className='shrink-0 px-2 py-1 text-xs'
						onClick={() => {
							setRetryToken((value) => value + 1);
							setFocused(true);
							inputRef.current?.focus?.();
						}}
					>
						<RefreshCw aria-hidden='true' className='size-3.5' />
						重試
					</Button>
				</div>
			);
		}
		if (!loadedDepartments || loadedDepartments.year !== year) return null;
		return <div className='px-4 py-3 text-sm opacity-75'>找不到符合的系所建議。</div>;
	}

	return (
		<div
			ref={rootRef}
			className='relative w-full'
			onFocus={() => {
				if (blurTimerRef.current !== null) window.clearTimeout(blurTimerRef.current);
				setFocused(true);
			}}
			onBlur={(event) => {
				const nextTarget = event.relatedTarget as Node | null;
				if (nextTarget && rootRef.current?.contains(nextTarget)) return;
				blurTimerRef.current = window.setTimeout(() => {
					setFocused(false);
					setCurrentSelectionIndex(-1);
				}, 120);
			}}
		>
			<div
				className={cn(
					'rounded-surface flex border transition-[background-color,border-color,box-shadow] duration-200',
					focused
						? 'border-[rgba(var(--vs-gray-2),1)] bg-[rgb(var(--vs-gray-1))] shadow-[0_5px_20px_0_rgba(0,0,0,var(--vs-shadow-opacity,0.05))]'
						: 'border-transparent bg-[rgba(var(--vs-text),0.1)] hover:bg-[rgba(var(--vs-text),0.05)]',
					'dark:border-[rgba(var(--vs-text),0.05)] dark:bg-[rgba(var(--vs-text),0.05)] dark:hover:bg-[rgba(var(--vs-text),0.075)]',
				)}
			>
				<Input
					ref={inputRef}
					role='combobox'
					aria-label='依入學年度或學號前綴尋找課程標準'
					aria-describedby={`${searchId}-hint`}
					aria-autocomplete='list'
					aria-expanded={focused}
					aria-controls={resultsId}
					aria-activedescendant={
						currentSelectionIndex >= 0 ? `${resultsId}-item-${currentSelectionIndex}` : undefined
					}
					placeholder='輸入學號前綴，例如 11432, 109AB'
					autoComplete='off'
					value={input}
					onFocus={() => {
						if (blurTimerRef.current !== null) window.clearTimeout(blurTimerRef.current);
						setFocused(true);
					}}
					onPointerDown={() => setFocused(true)}
					onChange={(event) => {
						setInput(event.target.value.toUpperCase());
						setCurrentSelectionIndex(-1);
						setFocused(true);
					}}
					onKeyDown={onKeyDown}
					onMouseEnter={() => setCurrentSelectionIndex(-1)}
					className='rounded-surface min-w-0 flex-1 border-0 bg-transparent px-3 py-3 shadow-none focus:border-0 focus-visible:ring-0'
				/>
				<button
					type='button'
					aria-label={input ? '清除入學年度或學號前綴' : '搜尋入學年度或學號前綴'}
					className='flex shrink-0 items-center justify-center px-3 text-[rgba(var(--vs-text),0.8)] transition-colors duration-200 hover:text-[rgb(var(--vs-text))]'
					onClick={() => {
						if (!input) {
							inputRef.current?.focus?.();
							return;
						}
						setInput('');
						setCurrentSelectionIndex(-1);
						inputRef.current?.focus?.();
					}}
				>
					{input ? <X aria-hidden='true' /> : <Search aria-hidden='true' />}
				</button>
			</div>
			<p id={`${searchId}-hint`} className='sr-only'>
				可先輸入入學年度，再輸入學號前綴；不必輸入完整學號。
			</p>
			<div
				id={resultsId}
				ref={resultsRef}
				role='listbox'
				aria-label='入學年度或學號前綴搜尋結果'
				aria-busy={loadingYear === year}
				className={cn(
					'rounded-surface absolute top-full right-0 left-0 z-[999] mt-1 max-h-[360px] overflow-y-auto border border-[rgba(var(--vs-text),0.12)] bg-[rgb(var(--vs-background))] shadow-[0_16px_40px_rgba(var(--vs-text),0.16)] transition-[opacity,transform] duration-200',
					focused
						? 'pointer-events-auto opacity-100'
						: 'pointer-events-none -translate-y-2 opacity-0',
				)}
			>
				{focused && !flatMatches.length
					? renderMessage()
					: focused
						? groups.map((group) => (
								<div key={group.system} role='group' aria-label={group.system}>
									{group.entries.map((entry) => {
										const index = flatMatches.indexOf(entry);
										return (
											<button
												id={`${resultsId}-item-${index}`}
												key={`${entry.system}-${entry.department}-${entry.division}-${entry.matric}`}
												role='option'
												tabIndex={-1}
												aria-selected={currentSelectionIndex === index}
												data-search-result-item
												data-active={currentSelectionIndex === index ? 'true' : 'false'}
												className={cn(
													'flex w-full items-center overflow-hidden text-left text-[rgb(var(--vs-text))]',
													index > 0 && 'border-t border-[rgba(var(--vs-gray-2),1)]',
													currentSelectionIndex === index && 'bg-[rgba(var(--vs-text),0.05)]',
												)}
												onClick={() => selectEntry(entry)}
												onMouseDown={(event) => event.preventDefault()}
												onMouseEnter={() => setCurrentSelectionIndex(index)}
											>
												<span className='min-w-0 flex-1 px-4 py-3'>
													<span className='block text-xs opacity-75'>
														{year} · {entry.system}
													</span>
													<span className='block text-base font-semibold'>{entry.department}</span>
												</span>
												<ArrowRight
													aria-hidden='true'
													className={cn(
														'mr-4 transition-transform duration-200',
														currentSelectionIndex === index && 'translate-x-[3px]',
													)}
												/>
											</button>
										);
									})}
								</div>
							))
						: null}
			</div>
		</div>
	);
}
