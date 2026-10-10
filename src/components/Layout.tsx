import { Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { useState } from 'react';
import { displayDepartment, parseYearSemVal, storageDepartment } from '../lib/courseUtils';
import { pageTitleForPath, usePageTitle } from '../lib/pageTitle';
import { createSearchParams } from '../lib/urlState';
import { useApp } from '../state/AppContext';
import { ChevronsUpDown, GitBranch, Search } from 'lucide-react';
import { Button } from './ui-kit/Button';
import { Alert } from './ui-kit/Alert';
import { ContentSurface } from './ui-kit/ContentSurface';
import { cn } from '@/lib/utils';
import { Dialog } from './ui-kit/Dialog';
import { Field } from './ui-kit/Field';
import { Select, SelectOption } from './ui-kit/Select';
import { UniversalSearch } from './UniversalSearch';

export function Layout() {
	const { location } = useRouterState();
	const navigate = useNavigate();
	const searchParams = createSearchParams(location.search);
	const isIframe = searchParams.get('mode') === 'iframe';
	const isAdvancedSearch = location.pathname === '/advanced-search';
	const {
		dataset,
		setDataset,
		yearSemItems,
		departmentItems,
		datasetDialogOpen,
		setDatasetDialogOpen,
		loadingDataset,
		error,
		retryDataset,
	} = useApp();
	const viewYear = isAdvancedSearch ? searchParams.get('year') || dataset.year : dataset.year;
	const viewSem = isAdvancedSearch ? searchParams.get('sem') || dataset.sem : dataset.sem;
	const viewDepartment = isAdvancedSearch
		? searchParams.get('d') || dataset.department
		: dataset.department;
	const hasDataset = Boolean(viewYear && viewSem);
	const yearSemLabel = hasDataset
		? parseYearSemVal(`${viewYear}-${viewSem}`)
		: loadingDataset
			? '正在載入學期'
			: '選擇學期';

	usePageTitle(pageTitleForPath(location.pathname));

	function applyDataset(nextDataset: { year: string; sem: string; department: string }) {
		setDataset(nextDataset);
		if (isAdvancedSearch) {
			void navigate({
				to: '/advanced-search',
				search: (previous) => ({
					...previous,
					year: nextDataset.year,
					sem: nextDataset.sem,
					d: nextDataset.department,
					page: undefined,
				}),
				resetScroll: true,
			});
		}
		setDatasetDialogOpen(false);
	}

	const semesterButton = (
		<Button
			className='whitespace-nowrap'
			aria-haspopup='dialog'
			title='切換學期與學制'
			onClick={() => setDatasetDialogOpen(true)}
		>
			{yearSemLabel}
			<ChevronsUpDown className='text-icon-muted size-3.5' aria-hidden='true' />
		</Button>
	);

	return (
		// Grid track sizing survives AdSense's inline height/min-height resets on ad ancestors.
		<div className='grid grid-cols-[minmax(0,1fr)] grid-rows-[minmax(100svh,auto)]'>
			<div className='bg-backdrop text-foreground flex flex-col font-sans'>
				<a
					href='#main-content'
					className='rounded-control shadow-overlay sr-only fixed top-2 left-2 z-50 bg-[rgb(var(--vs-background))] px-4 py-3 text-[rgb(var(--vs-primary))] focus:not-sr-only'
				>
					跳至主要內容
				</a>
				{!isIframe ? (
					<nav
						className={cn(
							'bg-sheen-surface shadow-bar sticky inset-x-0 top-0 z-20 grid h-[58px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 bg-[rgba(var(--vs-background),0.78)] px-4 py-2 backdrop-blur-[20px] backdrop-saturate-150 md:grid-cols-[1fr_minmax(250px,430px)_1fr]',
							isAdvancedSearch && 'lg:hidden',
						)}
						style={{ paddingInline: 'max(16px, calc((100vw - 1024px) / 2))' }}
					>
						<Link
							to='/'
							className='text-shadow-emboss flex min-w-0 items-center gap-1.5 font-semibold whitespace-nowrap text-[rgb(var(--vs-text))] no-underline hover:text-[rgba(var(--vs-text),0.8)]'
						>
							<span aria-hidden='true' className='shrink-0'>
								🍤
							</span>
							<span className='truncate'>北科課程好朋友</span>
						</Link>
						<div className='hidden md:block'>
							{!isAdvancedSearch ? <UniversalSearch navbar /> : null}
						</div>
						<div className='flex justify-end gap-2'>
							{/* The navbar search box is desktop-only, so small screens get a shortcut instead. */}
							{location.pathname !== '/' && !isAdvancedSearch ? (
								<Button
									as={Link}
									icon
									to='/advanced-search'
									aria-label='搜尋課程'
									className='md:hidden'
								>
									<Search className='size-4' aria-hidden='true' />
								</Button>
							) : null}
							{semesterButton}
						</div>
					</nav>
				) : null}
				<ContentSurface
					as='main'
					id='main-content'
					tabIndex={-1}
					className={cn(
						'flex-1 scroll-mt-20',
						isAdvancedSearch ? 'w-full' : 'mx-auto w-full max-w-[1024px] px-4 py-8',
						isIframe ? 'pt-0' : '',
					)}
				>
					{error ? (
						<Alert danger className='mb-4 flex items-center justify-between gap-3'>
							<div>
								<p className='font-medium'>
									{hasDataset ? '學期資料暫時無法更新。' : '目前無法載入學期資料。'}
								</p>
								<p className='mt-1 text-sm'>
									{hasDataset
										? '目前仍保留已選的學期，請稍後重試。'
										: '請確認網路連線後重試，載入成功後才能瀏覽課程。'}
								</p>
							</div>
							<Button onClick={() => void retryDataset()} disabled={loadingDataset}>
								重試
							</Button>
						</Alert>
					) : loadingDataset && !hasDataset ? (
						<Alert className='mb-4'>正在載入學期資料…</Alert>
					) : null}
					<Outlet />
				</ContentSurface>
				{isIframe && !isAdvancedSearch ? (
					<div className='my-4 text-center text-[0.75em] opacity-75'>
						本資料由{' '}
						<a href='https://ntut-course.gnehs.net/' target='_blank' rel='noreferrer'>
							北科課程好朋友
						</a>{' '}
						提供
					</div>
				) : null}
				{!isIframe && !isAdvancedSearch ? (
					<footer className='mt-auto w-full bg-[rgb(var(--vs-background))] px-4 py-3 text-center text-sm shadow-[0_-1px_0_var(--hairline)]'>
						<div className='text-foreground-soft mx-auto max-w-[1024px] space-y-2'>
							<div className='flex items-center justify-between gap-2'>
								<div>
									Developed by{' '}
									<a
										href='https://gnehs.net'
										target='_blank'
										rel='noreferrer'
										className='text-[rgb(var(--vs-primary))] underline hover:opacity-80'
									>
										勝勝
									</a>
								</div>
								<div className='flex justify-end'>
									<Button
										as='a'
										icon
										href='https://github.com/gnehs/ntut-course-web'
										aria-label='查看 GitHub 原始碼'
										target='_blank'
										rel='noreferrer'
									>
										<GitBranch className='size-4' />
									</Button>
								</div>
							</div>
						</div>
					</footer>
				) : null}
				<Dialog
					open={datasetDialogOpen}
					title='選擇學期與學制'
					onClose={() => setDatasetDialogOpen(false)}
				>
					<DatasetForm
						// Radix Select keeps a blank trigger when its value arrives after mount.
						key={yearSemItems.length ? 'ready' : 'loading'}
						year={viewYear}
						sem={viewSem}
						department={viewDepartment}
						yearSemItems={yearSemItems}
						departmentItems={departmentItems}
						onSubmit={applyDataset}
					/>
				</Dialog>
			</div>
		</div>
	);
}

function DatasetForm({ year, sem, department, yearSemItems, departmentItems, onSubmit }) {
	// The dialog can open before the semester index arrives, so the default is derived per render.
	const [selectedYearSem, setYearSemValue] = useState<string | null>(null);
	const yearSemValue = selectedYearSem ?? (year && sem ? `${year}-${sem}` : yearSemItems[0] || '');
	const [departmentValue, setDepartmentValue] = useState(displayDepartment(department));
	const ready = yearSemItems.length > 0 && Boolean(yearSemValue);
	return (
		<form
			className='grid gap-4'
			onSubmit={(event) => {
				event.preventDefault();
				if (!ready) return;
				const [nextYear, nextSem] = yearSemValue.split('-');
				onSubmit({ year: nextYear, sem: nextSem, department: storageDepartment(departmentValue) });
			}}
		>
			<Field label='學期'>
				<Select value={yearSemValue} onChange={setYearSemValue}>
					{yearSemItems.map((item) => (
						<SelectOption key={item} value={item}>
							{parseYearSemVal(item)}
						</SelectOption>
					))}
				</Select>
			</Field>
			<Field label='學制'>
				<Select value={departmentValue} onChange={setDepartmentValue}>
					{departmentItems.map((item) => (
						<SelectOption key={item} value={item}>
							{item}
						</SelectOption>
					))}
				</Select>
			</Field>
			<Button primary type='submit' className='w-full' disabled={!ready}>
				{ready ? '套用學期與學制' : '正在載入學期…'}
			</Button>
		</form>
	);
}
