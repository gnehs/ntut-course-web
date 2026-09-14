import { Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { useState } from 'react';
import { displayDepartment, parseYearSemVal, storageDepartment } from '../lib/courseUtils';
import { pageTitleForPath, usePageTitle } from '../lib/pageTitle';
import { createSearchParams } from '../lib/urlState';
import { useApp } from '../state/AppContext';
import { GitBranch } from 'lucide-react';
import { Button } from './ui-kit/Button';
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
	} = useApp();
	const viewYear = isAdvancedSearch ? searchParams.get('year') || dataset.year : dataset.year;
	const viewSem = isAdvancedSearch ? searchParams.get('sem') || dataset.sem : dataset.sem;
	const viewDepartment = isAdvancedSearch
		? searchParams.get('d') || dataset.department
		: dataset.department;
	const yearSemLabel = parseYearSemVal(`${viewYear}-${viewSem}`);

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

	return (
		<div className='flex min-h-svh flex-col bg-[#f4f7f8] font-sans text-black dark:bg-[#1d1d1d] dark:text-white'>
			<a
				href='#main-content'
				className='sr-only fixed top-2 left-2 z-50 rounded-lg bg-[rgb(var(--vs-background))] px-4 py-3 text-[rgb(var(--vs-primary))] shadow-lg focus:not-sr-only'
			>
				跳至主要內容
			</a>
			{!isIframe ? (
				<nav
					className={cn(
						'sticky inset-x-0 top-0 z-20 grid h-[58px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 bg-[rgba(var(--vs-background),0.9)] px-4 py-2 shadow-[0_5px_25px_0_rgba(0,0,0,var(--vs-shadow-opacity))] backdrop-blur-[16px] md:grid-cols-[1fr_minmax(250px,430px)_1fr]',
						isAdvancedSearch && 'lg:hidden',
					)}
					style={{ paddingInline: 'max(16px, calc((100vw - 1024px) / 2))' }}
				>
					<Link
						to='/'
						className='block min-w-0 truncate font-semibold whitespace-nowrap text-[rgb(var(--vs-text))] no-underline hover:text-[rgba(var(--vs-text),0.8)]'
					>
						🍤 北科課程好朋友
					</Link>
					<div className='hidden md:block'>
						{!isAdvancedSearch ? <UniversalSearch navbar /> : null}
					</div>
					<div className='flex justify-end'>
						<Button className='whitespace-nowrap' onClick={() => setDatasetDialogOpen(true)}>
							{yearSemLabel}
						</Button>
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
				<footer className='mt-auto w-full bg-[rgb(var(--vs-background))] px-4 py-3 text-center text-sm shadow-[0_5px_25px_0_rgba(0,0,0,var(--vs-shadow-opacity))]'>
					<div className='mx-auto max-w-[1024px] space-y-2 text-[rgb(var(--vs-text))] opacity-75'>
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
					year={viewYear}
					sem={viewSem}
					department={viewDepartment}
					yearSemItems={yearSemItems}
					departmentItems={departmentItems}
					onSubmit={applyDataset}
				/>
			</Dialog>
		</div>
	);
}

function DatasetForm({ year, sem, department, yearSemItems, departmentItems, onSubmit }) {
	const [yearSemValue, setYearSemValue] = useState(`${year}-${sem}`);
	const [departmentValue, setDepartmentValue] = useState(displayDepartment(department));
	return (
		<form
			className='grid gap-4'
			onSubmit={(event) => {
				event.preventDefault();
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
			<Button primary type='submit' className='w-full'>
				套用學期與學制
			</Button>
		</form>
	);
}
