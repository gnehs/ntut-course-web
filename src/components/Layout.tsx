import { Link, Outlet, useRouterState } from '@tanstack/react-router';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { displayDepartment, parseYearSemVal, storageDepartment } from '../lib/courseUtils';
import { createSearchParams } from '../lib/urlState';
import { useApp } from '../state/AppContext';
import { Button } from './ui-kit/Button';
import { ContentSurface } from './ui-kit/ContentSurface';
import { Dialog } from './ui-kit/Dialog';
import { Field } from './ui-kit/Field';
import { Select, SelectOption } from './ui-kit/Select';
import { UniversalSearch } from './UniversalSearch';

export function Layout() {
	const { location } = useRouterState();
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
	const [yearSemValue, setYearSemValue] = useState(`${dataset.year}-${dataset.sem}`);
	const [departmentValue, setDepartmentValue] = useState(displayDepartment(dataset.department));

	const rootRef = useRef<HTMLDivElement>(null);

	useLayoutEffect(() => {
		if (rootRef.current) {
			rootRef.current.style.setProperty('min-height', '100svh', 'important');
		}
	}, []);

	const yearSemLabel = useMemo(() => parseYearSemVal(`${dataset.year}-${dataset.sem}`), [dataset]);

	function applyDataset() {
		const [year, sem] = yearSemValue.split('-');
		setDataset({ year, sem, department: storageDepartment(departmentValue) });
		setDatasetDialogOpen(false);
	}

	return (
		<div ref={rootRef} className='flex min-h-screen flex-col bg-[#f4f7f8] text-black dark:bg-[#1d1d1d] dark:text-white'>
			{!isIframe && !isAdvancedSearch ? (
				<nav
					className='fixed inset-x-0 top-0 z-20 grid h-[58px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 bg-[rgba(var(--vs-background),0.9)] px-4 py-2 shadow-[0_5px_25px_0_rgba(0,0,0,var(--vs-shadow-opacity))] backdrop-blur-[16px] md:grid-cols-[1fr_minmax(250px,430px)_1fr]'
					style={{ paddingInline: 'max(16px, calc((100vw - 1024px) / 2))' }}
				>
					<Link
						to='/'
						className='block min-w-0 truncate font-bold whitespace-nowrap text-[rgb(var(--vs-text))] no-underline hover:text-[rgba(var(--vs-text),0.8)]'
					>
						🍤 北科課程好朋友
					</Link>
					<div className='hidden md:block'>
						<UniversalSearch navbar />
					</div>
					<div className='flex justify-end'>
						<Button className='m-0 whitespace-nowrap' onClick={() => setDatasetDialogOpen(true)}>
							{yearSemLabel}
						</Button>
					</div>
				</nav>
			) : null}
			<ContentSurface
				as='main'
				className={`flex-1 ${isAdvancedSearch ? 'w-full' : 'mx-auto w-full max-w-[1024px] px-4 pt-[74px]'} ${isIframe ? 'pt-0' : ''}`}
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
									className='m-0'
									href='https://github.com/gnehs/ntut-course-web'
									target='_blank'
									rel='noreferrer'
								>
									<i className='bx bxl-github' />
								</Button>
							</div>
						</div>
					</div>
				</footer>
			) : null}
			<Dialog
				open={datasetDialogOpen}
				title='選擇資料集'
				onClose={() => setDatasetDialogOpen(false)}
				footer={
					<Button primary className='m-0 w-full' onClick={applyDataset}>
						完成
					</Button>
				}
			>
				<div className='grid gap-3'>
					<Field label='學期'>
						<Select value={yearSemValue} onChange={(value) => setYearSemValue(value)}>
							{yearSemItems.map((item) => (
								<SelectOption key={item} value={item}>
									{parseYearSemVal(item)}
								</SelectOption>
							))}
						</Select>
					</Field>
					<Field label='學制'>
						<Select
							value={departmentValue}
							onChange={(value) => setDepartmentValue(value)}
						>
							{departmentItems.map((item) => (
								<SelectOption key={item} value={item}>
									{item}
								</SelectOption>
							))}
						</Select>
					</Field>
				</div>
			</Dialog>
		</div>
	);
}
