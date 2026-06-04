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
	className = 'grid-cols-3',
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

function CourseCardsSkeleton({ count = 6 }: { count?: number }) {
	return (
		<div>
			<div className='flex flex-wrap items-center justify-center gap-1 py-4'>
				<SkeletonBlock className='h-10 w-20' />
				<SkeletonBlock className='h-10 w-20' />
				<SkeletonBlock className='h-10 w-20' />
			</div>
			<div className='grid [grid-template-columns:repeat(auto-fill,minmax(250px,1fr))] gap-3'>
				{Array.from({ length: count }, (_, index) => (
					<SkeletonCard key={index} className='grid gap-3'>
						<div className='flex items-start justify-between gap-3'>
							<SkeletonBlock className='h-5 w-32' />
							<SkeletonBlock className='h-6 w-14 rounded-full' />
						</div>
						<div className='flex gap-1'>
							<SkeletonBlock className='h-5 w-12 rounded-full' />
							<SkeletonBlock className='h-5 w-16 rounded-full' />
						</div>
						<div className='grid grid-cols-3 gap-2'>
							<SkeletonBlock className='h-10' />
							<SkeletonBlock className='h-10' />
							<SkeletonBlock className='h-10' />
						</div>
						<SkeletonBlock className='h-4 w-4/5' />
						<SkeletonBlock className='h-4 w-3/5' />
					</SkeletonCard>
				))}
			</div>
		</div>
	);
}

export function CourseListSkeleton() {
	return <CourseCardsSkeleton />;
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
		<div>
			<SkeletonHeading />
			<div className='mt-4 grid grid-cols-1 gap-3 lg:grid-cols-4'>
				<SkeletonCard>
					<SkeletonBlock className='h-4 w-32' />
					<SkeletonBlock className='mt-3 h-10 w-full' />
				</SkeletonCard>
			</div>
			<SkeletonBlock className='mt-6 h-6 w-28' />
			<div className='mt-3'>
				<CardGridSkeleton count={10} />
			</div>
		</div>
	);
}

export function ClassDetailSkeleton() {
	return (
		<div>
			<SkeletonHeading withActions />
			<SkeletonBlock className='mt-6 h-6 w-28' />
			<CourseCardsSkeleton count={6} />
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
						<SkeletonBlock className='h-12 w-12 shrink-0' />
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
			<StatCardsSkeleton count={4} className='sm:grid-cols-1 lg:grid-cols-2' />
			<div className='mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4'>
				{Array.from({ length: 12 }, (_, index) => (
					<SkeletonCard key={index}>
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
		<div>
			<SkeletonHeading />
			<div className='mt-3'>
				<StatCardsSkeleton count={6} className='sm:grid-cols-3 lg:grid-cols-6' />
			</div>
			<div className='mt-6 flex items-center justify-between gap-3'>
				<SkeletonBlock className='h-6 w-20' />
				<div className='flex gap-1'>
					<SkeletonBlock className='h-10 w-20' />
					<SkeletonBlock className='h-10 w-20' />
					<SkeletonBlock className='h-10 w-20' />
				</div>
			</div>
			<div className='mt-2 grid gap-3 md:grid-cols-2'>
				{Array.from({ length: 6 }, (_, index) => (
					<SkeletonCard key={index} className='h-20' />
				))}
			</div>
		</div>
	);
}

export function StandardPickerSkeleton() {
	return (
		<div>
			<SkeletonBlock className='h-6 w-36' />
			<div className='mt-3'>
				<ListRowsSkeleton rows={7} compact />
			</div>
		</div>
	);
}

export function EmptyRoomSkeleton() {
	return (
		<div>
			<SkeletonBlock className='h-16 w-full' />
			<SkeletonHeading />
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
								<SkeletonCard key={cardIndex}>
									<SkeletonBlock className='h-5 w-24' />
									<div className='mt-3 flex gap-1'>
										{Array.from({ length: 10 }, (_, dotIndex) => (
											<SkeletonBlock key={dotIndex} className='h-5 w-5 rounded-full' />
										))}
									</div>
								</SkeletonCard>
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

export function SearchPageSkeleton() {
	return <CourseCardsSkeleton count={8} />;
}
