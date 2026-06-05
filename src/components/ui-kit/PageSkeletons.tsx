import type React from 'react';

function SkeletonBlock({ className = '' }: { className?: string }) {
	return <div className={`animate-pulse rounded-lg bg-[rgba(var(--vs-text),0.1)] ${className}`} />;
}

function SkeletonCard({
	children,
	className = '',
}: {
	children?: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={`rounded-lg bg-[rgb(var(--vs-background))] p-4 shadow-[0_5px_20px_0_rgba(0,0,0,var(--vs-shadow-opacity,0.05))] ${className}`}
		>
			{children}
		</div>
	);
}

function SkeletonHeading({ withActions = false }: { withActions?: boolean }) {
	return (
		<div className='flex flex-wrap items-center justify-between gap-3'>
			<div className='grid min-w-[180px] flex-1 gap-2'>
				<SkeletonBlock className='h-8 w-48 max-w-full' />
				<SkeletonBlock className='h-4 w-72 max-w-full' />
			</div>
			{withActions ? (
				<div className='flex gap-2'>
					<SkeletonBlock className='h-10 w-24' />
					<SkeletonBlock className='h-10 w-32' />
				</div>
			) : null}
		</div>
	);
}

function StatCardsSkeleton({
	count = 3,
	className = 'grid-cols-1 sm:grid-cols-3',
}: {
	count?: number;
	className?: string;
}) {
	return (
		<div className={`grid gap-3 ${className}`}>
			{Array.from({ length: count }, (_, index) => (
				<SkeletonCard key={index}>
					<SkeletonBlock className='h-7 w-16' />
					<SkeletonBlock className='mt-2 h-4 w-20' />
				</SkeletonCard>
			))}
		</div>
	);
}

function ListRowsSkeleton({ rows = 6, compact = false }: { rows?: number; compact?: boolean }) {
	return (
		<div className='overflow-hidden rounded-lg border border-[rgba(var(--vs-text),0.1)] bg-[rgb(var(--vs-background))]'>
			{Array.from({ length: rows }, (_, index) => (
				<div
					key={index}
					className={`grid gap-2 px-4 ${compact ? 'py-2' : 'py-3'} ${index > 0 ? 'border-t border-[rgba(var(--vs-text),0.1)]' : ''}`}
				>
					<SkeletonBlock className='h-4 w-3/5' />
					{!compact ? <SkeletonBlock className='h-3 w-2/5' /> : null}
				</div>
			))}
		</div>
	);
}

function CourseResultToolbarSkeleton({ showTimetable = false }: { showTimetable?: boolean }) {
	return (
		<div className='flex flex-wrap items-center justify-center gap-1 py-4'>
			<SkeletonBlock className='h-10 w-20' />
			<SkeletonBlock className='h-10 w-20' />
			{showTimetable ? <SkeletonBlock className='h-10 w-20' /> : null}
		</div>
	);
}

function CourseCardSkeleton() {
	return (
		<SkeletonCard className='px-4 py-3'>
			<div className='flex items-start justify-between gap-3'>
				<div className='min-w-0 flex-1 space-y-2'>
					<SkeletonBlock className='h-5 w-36 max-w-full' />
					<SkeletonBlock className='h-3 w-28 max-w-full' />
				</div>
				<SkeletonBlock className='h-6 w-14 rounded-full' />
			</div>
			<div className='mt-3 flex gap-1'>
				<SkeletonBlock className='h-5 w-12 rounded-full' />
				<SkeletonBlock className='h-5 w-16 rounded-full' />
			</div>
			<div className='mt-2 grid grid-cols-[repeat(auto-fit,minmax(64px,1fr))] gap-2'>
				{Array.from({ length: 4 }, (_, index) => (
					<div key={index} className='grid gap-1 px-0 py-1'>
						<SkeletonBlock className='h-5 w-12' />
						<SkeletonBlock className='h-3 w-10' />
					</div>
				))}
			</div>
			<div className='mt-3 grid gap-2'>
				<SkeletonBlock className='h-4 w-11/12' />
				<SkeletonBlock className='h-4 w-4/5' />
				<SkeletonBlock className='h-4 w-3/5' />
			</div>
		</SkeletonCard>
	);
}

function CourseCardsSkeleton({
	count = 6,
	showToolbar = true,
	showTimetable = false,
}: {
	count?: number;
	showToolbar?: boolean;
	showTimetable?: boolean;
}) {
	return (
		<div>
			{showToolbar ? <CourseResultToolbarSkeleton showTimetable={showTimetable} /> : null}
			<div className='grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-3'>
				{Array.from({ length: count }, (_, index) => (
					<CourseCardSkeleton key={index} />
				))}
			</div>
		</div>
	);
}

export function CourseListSkeleton() {
	return <CourseCardsSkeleton showTimetable />;
}

export function CardGridSkeleton({
	count = 10,
	columns = 'grid-cols-3 lg:grid-cols-5',
}: {
	count?: number;
	columns?: string;
}) {
	return (
		<div className={`grid gap-3 ${columns}`}>
			{Array.from({ length: count }, (_, index) => (
				<SkeletonCard key={index} className='px-4 py-3'>
					<SkeletonBlock className='h-5 w-24' />
					<SkeletonBlock className='mt-2 h-4 w-20' />
				</SkeletonCard>
			))}
		</div>
	);
}

export function ClassIndexSkeleton() {
	return (
		<div className='space-y-4'>
			<SkeletonBlock className='h-9 w-32' />
			<SkeletonBlock className='h-10 w-full' />
			<SkeletonBlock className='h-6 w-16' />
			<div>
				<CardGridSkeleton count={10} />
			</div>
		</div>
	);
}

export function ClassDetailSkeleton() {
	return (
		<div className='space-y-4'>
			<SkeletonHeading withActions />
			<SkeletonBlock className='h-6 w-28' />
			<CourseCardsSkeleton count={6} showTimetable />
		</div>
	);
}

export function StepsPageSkeleton({ codeBlock = false }: { codeBlock?: boolean }) {
	return (
		<div>
			<SkeletonHeading />
			{Array.from({ length: 4 }, (_, index) => (
				<section key={index} className='mt-5'>
					<SkeletonBlock className='h-7 w-64 max-w-full' />
					<SkeletonBlock className='mt-2 h-4 w-4/5' />
					{index === 1 ? (
						codeBlock ? (
							<SkeletonBlock className='mt-3 h-[360px] w-full' />
						) : (
							<ListRowsSkeleton rows={4} compact />
						)
					) : null}
				</section>
			))}
		</div>
	);
}

export function CalendarSkeleton() {
	return (
		<div>
			<SkeletonHeading withActions />
			<div className='mt-4 overflow-hidden rounded-[4px] border border-[rgba(var(--vs-text),0.1)]'>
				{Array.from({ length: 8 }, (_, index) => (
					<div
						key={index}
						className={`flex items-center gap-2 bg-[rgb(var(--vs-background))] p-2.5 ${index > 0 ? 'border-t border-[rgba(var(--vs-text),0.1)]' : ''}`}
					>
						<CalendarDateSkeleton />
						<div className='grid flex-1 gap-2'>
							<SkeletonBlock className='h-5 w-56 max-w-full' />
							<SkeletonBlock className='h-4 w-40 max-w-full' />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

export function WithdrawalSkeleton() {
	return (
		<>
			<StatCardsSkeleton count={2} className='grid-cols-1 lg:grid-cols-2' />
			<div className='mt-4 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2'>
				{Array.from({ length: 12 }, (_, index) => (
					<SkeletonCard key={index} className='px-4 py-3'>
						<SkeletonBlock className='h-5 w-20' />
						<SkeletonBlock className='mt-2 h-6 w-14' />
						<SkeletonBlock className='mt-2 h-3 w-32' />
					</SkeletonCard>
				))}
			</div>
		</>
	);
}

export function TeacherSkeleton() {
	return (
		<div className='space-y-4'>
			<SkeletonHeading />
			<div>
				<StatCardsSkeleton count={6} className='sm:grid-cols-3 lg:grid-cols-6' />
			</div>
			<div className='flex flex-wrap items-center justify-between gap-3'>
				<SkeletonBlock className='h-6 w-20' />
				<div className='flex flex-wrap justify-end gap-1'>
					<SkeletonBlock className='h-10 w-20' />
					<SkeletonBlock className='h-10 w-20' />
					<SkeletonBlock className='h-10 w-20' />
				</div>
			</div>
			<div className='grid gap-3 md:grid-cols-2'>
				{Array.from({ length: 6 }, (_, index) => (
					<SkeletonCard
						key={index}
						className='grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 p-2'
					>
						<div className='grid gap-2'>
							<SkeletonBlock className='h-5 w-16' />
							<SkeletonBlock className='h-3 w-20' />
						</div>
						<div className='grid min-w-0 gap-2'>
							<SkeletonBlock className='h-5 w-40 max-w-full' />
							<SkeletonBlock className='h-3 w-32 max-w-full' />
						</div>
						<SkeletonBlock className='h-9 w-10' />
						<SkeletonBlock className='h-9 w-10' />
					</SkeletonCard>
				))}
			</div>
		</div>
	);
}

export function StandardPickerSkeleton({ content = false }: { content?: boolean } = {}) {
	if (content) {
		return (
			<div className='space-y-4'>
				<div>
					<SkeletonBlock className='h-6 w-32' />
					<div className='mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5'>
						{Array.from({ length: 5 }, (_, index) => (
							<SkeletonCard key={index}>
								<SkeletonBlock className='h-7 w-14' />
								<SkeletonBlock className='mt-2 h-4 w-20' />
							</SkeletonCard>
						))}
					</div>
				</div>
				<div>
					<SkeletonBlock className='h-6 w-32' />
					<div className='mt-3'>
						<ListRowsSkeleton rows={4} />
					</div>
				</div>
				<div>
					<SkeletonBlock className='h-6 w-24' />
					<div className='mt-3 grid gap-4 lg:grid-cols-2'>
						<ListRowsSkeleton rows={6} compact />
						<ListRowsSkeleton rows={6} compact />
					</div>
				</div>
			</div>
		);
	}
	return (
		<div className='flex flex-col gap-3 sm:flex-row'>
			{Array.from({ length: 3 }, (_, index) => (
				<div key={index} className='flex-1 space-y-1.5'>
					<SkeletonBlock className='h-4 w-20' />
					<SkeletonBlock className='h-10 w-full' />
				</div>
			))}
		</div>
	);
}

function EmptyRoomCardSkeleton() {
	return (
		<SkeletonCard className='px-4 py-3'>
			<SkeletonBlock className='h-5 w-24' />
			<div className='mt-3 flex flex-wrap gap-1'>
				{Array.from({ length: 14 }, (_, dotIndex) => (
					<SkeletonBlock key={dotIndex} className='h-5 w-5 rounded-full' />
				))}
			</div>
		</SkeletonCard>
	);
}

function CalendarDateSkeleton() {
	return (
		<div className='flex size-12 shrink-0 flex-col overflow-hidden rounded-lg bg-[rgba(var(--vs-text),0.08)] shadow-md'>
			<SkeletonBlock className='h-5 w-full rounded-none bg-[rgba(var(--vs-danger),0.22)]' />
			<div className='flex flex-1 items-center justify-center'>
				<SkeletonBlock className='h-5 w-5' />
			</div>
		</div>
	);
}

export function EmptyRoomSkeleton() {
	return (
		<div className='space-y-4'>
			<SkeletonBlock className='h-16 w-full' />
			<SkeletonBlock className='h-9 w-40' />
			<div className='mt-4 flex flex-wrap items-center justify-center gap-1'>
				{Array.from({ length: 7 }, (_, index) => (
					<SkeletonBlock key={index} className='h-10 w-14' />
				))}
			</div>
			<div className='mt-4 space-y-4'>
				{Array.from({ length: 3 }, (_, index) => (
					<section key={index}>
						<SkeletonBlock className='h-6 w-16' />
						<div className='mt-3 grid grid-cols-1 gap-3 md:grid-cols-2'>
							{Array.from({ length: 4 }, (_, cardIndex) => (
								<EmptyRoomCardSkeleton key={cardIndex} />
							))}
						</div>
					</section>
				))}
			</div>
		</div>
	);
}

export function CourseDetailSkeleton() {
	return (
		<div>
			<SkeletonHeading withActions />
			<div className='mt-4'>
				<StatCardsSkeleton count={3} className='sm:grid-cols-3' />
			</div>
			<div className='mt-3 grid gap-3 lg:grid-cols-3'>
				{Array.from({ length: 3 }, (_, index) => (
					<SkeletonCard key={index}>
						<SkeletonBlock className='h-6 w-8' />
						<SkeletonBlock className='mt-2 h-5 w-24' />
						<div className='mt-3 grid grid-cols-2 gap-2'>
							<SkeletonBlock className='h-10' />
							<SkeletonBlock className='h-10' />
							<SkeletonBlock className='h-10' />
							<SkeletonBlock className='h-10' />
						</div>
					</SkeletonCard>
				))}
			</div>
			<SkeletonBlock className='mt-6 h-6 w-28' />
			<SkeletonBlock className='mt-3 h-24 w-full' />
		</div>
	);
}

export function StatusSkeleton() {
	return (
		<div>
			<SkeletonHeading />
			<div className='mt-4 space-y-2'>
				{Array.from({ length: 8 }, (_, index) => (
					<SkeletonCard key={index} className='flex items-center gap-2 p-2'>
						<SkeletonBlock className='h-8 w-8 rounded-full' />
						<div className='grid flex-1 gap-2'>
							<SkeletonBlock className='h-4 w-52 max-w-full' />
							<SkeletonBlock className='h-3 w-32 max-w-full' />
						</div>
					</SkeletonCard>
				))}
			</div>
		</div>
	);
}

export function AdvancedSearchPageSkeleton() {
	return <CourseCardsSkeleton count={8} />;
}
