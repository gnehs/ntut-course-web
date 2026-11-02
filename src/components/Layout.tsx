import { Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { useState } from 'react';
import { displayDepartment, parseYearSemVal, storageDepartment } from '../lib/courseUtils';
import { SITE_TITLE, pageTitleForPath, usePageTitle } from '../lib/pageTitle';
import { DESKTOP_MEDIA_QUERY, useMediaQuery } from '../lib/useMediaQuery';
import { createSearchParams } from '../lib/urlState';
import { useRouteLocation } from '../lib/routeLocation';
import { useApp } from '../state/AppContext';
import { IconGitBranch, IconSearch, IconSelector } from '@tabler/icons-react';
import { Button } from './ui-kit/Button';
import { CoursePeek } from './CoursePeek';
import { Alert } from './ui-kit/Alert';
import { ContentSurface } from './ui-kit/ContentSurface';
import { cn } from '@/lib/utils';
import { Dialog } from './ui-kit/Dialog';
import { Field } from './ui-kit/Field';
import { Select, SelectOption } from './ui-kit/Select';
import { UniversalSearch } from './UniversalSearch';

export function Layout() {
	const location = useRouteLocation();
	const peekOpen = useRouterState({ select: (state) => Boolean(state.location.state.coursePeek) });
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

	// A course peek titles the tab itself; the page title comes back when the peek closes.
	usePageTitle(peekOpen ? null : pageTitleForPath(location.pathname));

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

	// On desktop, search draws the brand and semester picker at the top of its filter panel instead.
	const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
	const showToolbar = !isIframe && !(isAdvancedSearch && isDesktop);

	return (
		// Grid track sizing survives AdSense's inline height/min-height resets on ad ancestors.
		<div className='text-foreground grid grid-cols-[minmax(0,1fr)] grid-rows-[minmax(100svh,auto)] font-sans'>
			<a
				href='#main-content'
				className='rounded-control shadow-overlay sr-only fixed top-2 left-2 z-50 bg-[rgb(var(--vs-background))] px-4 py-3 text-[rgb(var(--vs-primary))] focus:not-sr-only'
			>
				跳至主要內容
			</a>
			<div className='bg-page flex min-w-0 flex-col'>
				{showToolbar ? (
					<nav
						aria-label='頁面工具列'
						className={cn(
							'shadow-bar sticky inset-x-0 top-0 z-20 bg-[rgba(var(--vs-background),0.8)] px-4 backdrop-blur-[20px] backdrop-saturate-[180%]',
							!isAdvancedSearch && 'lg:px-6',
						)}
					>
						{/* Search spans the full width, so its toolbar lines up with the filter panel instead of centring. */}
						<div
							className={cn(
								'mx-auto grid h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 md:grid-cols-[1fr_minmax(250px,400px)_1fr]',
								!isAdvancedSearch && 'max-w-[1024px]',
							)}
						>
							<div className='flex min-w-0 items-center'>
								<SiteBrand />
							</div>
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
										<IconSearch className='size-4' aria-hidden='true' />
									</Button>
								) : null}
								<SemesterButton label={yearSemLabel} onOpen={() => setDatasetDialogOpen(true)} />
							</div>
						</div>
					</nav>
				) : null}
				<ContentSurface
					as='main'
					id='main-content'
					tabIndex={-1}
					className={cn(
						'flex-1 scroll-mt-20',
						isAdvancedSearch
							? 'w-full'
							: // Padding sits outside the 1024px column, as in the toolbar and footer, so their edges line up.
								'w-full px-[max(1rem,calc((100%-1024px)/2))] py-8 lg:px-[max(1.5rem,calc((100%-1024px)/2))]',
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
					<div className='text-muted-foreground my-4 text-center text-xs'>
						本資料由{' '}
						<a href='https://ntut-course.gnehs.net/' target='_blank' rel='noreferrer'>
							北科課程好朋友
						</a>{' '}
						提供
					</div>
				) : null}
				{!isIframe && !isAdvancedSearch ? (
					<footer className='mt-auto w-full border-t px-4 py-3 text-sm lg:px-6'>
						<div className='text-muted-foreground mx-auto flex max-w-[1024px] items-center justify-between gap-2'>
							<div>
								Developed by{' '}
								<a
									href='https://gnehs.net'
									target='_blank'
									rel='noreferrer'
									className='text-[rgb(var(--vs-primary))] no-underline hover:underline'
								>
									勝勝
								</a>
							</div>
							<Button
								as='a'
								icon
								href='https://github.com/gnehs/ntut-course-web'
								aria-label='查看 GitHub 原始碼'
								target='_blank'
								rel='noreferrer'
								className='bg-transparent'
							>
								<IconGitBranch className='size-4' />
							</Button>
						</div>
					</footer>
				) : null}
			</div>
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
			<CoursePeek />
		</div>
	);
}

export function SiteBrand() {
	return (
		<Link
			to='/'
			className='flex min-w-0 items-center gap-1.5 font-semibold whitespace-nowrap text-[rgb(var(--vs-text))] no-underline hover:text-[rgb(var(--vs-text))]'
		>
			<span aria-hidden='true' className='shrink-0'>
				🍤
			</span>
			<span className='truncate'>{SITE_TITLE}</span>
		</Link>
	);
}

export function SemesterButton({ label, onOpen }: { label: string; onOpen: () => void }) {
	return (
		<Button
			className='whitespace-nowrap'
			aria-haspopup='dialog'
			title='切換學期與學制'
			onClick={onOpen}
		>
			{label}
			<IconSelector className='text-icon-muted size-3.5' aria-hidden='true' />
		</Button>
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
