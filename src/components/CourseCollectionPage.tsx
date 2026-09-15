import { useState, type ReactNode } from 'react';
import { Check, X } from 'lucide-react';
import { CourseList, type CourseListLayout } from './CourseList';
import { CourseListToolbar } from './CourseListToolbar';
import { Button } from './ui-kit/Button';
import { Alert } from './ui-kit/Alert';
import { Skeleton } from './ui/skeleton';
import type { Course } from '../types/course';

type CourseCollectionGroup = {
	key: string;
	label?: string;
	department?: string;
	courses: Course[];
};

type CourseCollectionPageProps = {
	title: string;
	code?: string;
	description?: ReactNode;
	year: string;
	sem: string;
	groups: CourseCollectionGroup[];
	actions?: ReactNode;
	notice?: ReactNode;
	emptyState?: ReactNode;
	footer?: ReactNode;
	savedVersion?: number;
	onSavedChange?: () => void;
};

export function CourseCollectionPage({
	title,
	code,
	description,
	year,
	sem,
	groups,
	actions,
	notice,
	emptyState,
	footer,
	savedVersion,
	onSavedChange,
}: CourseCollectionPageProps) {
	const [layout, setLayout] = useState<CourseListLayout>('card');
	const [showConflictCourse, setShowConflictCourse] = useState(true);
	const visibleGroups = groups.filter((group) => group.courses.length);
	const count = visibleGroups.reduce((total, group) => total + group.courses.length, 0);
	return (
		<div className='flex flex-col gap-4'>
			<header className='flex flex-col gap-1'>
				{code ? <p className='m-0 font-mono text-sm opacity-65'>{code}</p> : null}
				<h1 className='m-0'>{title}</h1>
				{description ? <div className='opacity-75'>{description}</div> : null}
				<p className='m-0 text-sm opacity-70'>共 {count} 門課程</p>
			</header>
			{notice}
			{count ? (
				<div>
					<CourseListToolbar
						layout={layout}
						onLayoutChange={setLayout}
						showTimetable
						toolbarStart={
							<Button
								aria-pressed={showConflictCourse}
								onClick={() => setShowConflictCourse((value) => !value)}
								className={
									showConflictCourse
										? 'bg-[rgba(var(--vs-primary),0.08)] text-[rgb(var(--vs-primary))] hover:bg-[rgba(var(--vs-primary),0.14)]'
										: 'bg-transparent text-[rgba(var(--vs-text),0.7)] hover:bg-[rgba(var(--vs-text),0.06)]'
								}
							>
								{showConflictCourse ? <Check className='size-4' /> : <X className='size-4' />}
								衝堂課程
							</Button>
						}
						toolbarEnd={actions}
					/>
					<div className='flex flex-col gap-5'>
						{visibleGroups.map((group) => (
							<section key={group.key} className='flex flex-col gap-2'>
								{group.label ? <h2 className='m-0 text-lg font-semibold'>{group.label}</h2> : null}
								<CourseList
									courses={group.courses}
									year={year}
									sem={sem}
									department={group.department}
									layout={layout}
									onLayoutChange={setLayout}
									showToolbar={false}
									showTimetable
									showConflictCourse={showConflictCourse}
									savedVersion={savedVersion}
									onSavedChange={onSavedChange}
								/>
							</section>
						))}
					</div>
				</div>
			) : (
				(emptyState ?? <Alert>目前沒有課程。</Alert>)
			)}
			{footer}
		</div>
	);
}

export function CourseCollectionSkeleton({ label = '載入課程' }: { label?: string }) {
	return (
		<div className='flex flex-col gap-4' aria-busy='true' aria-label={label}>
			<div className='flex flex-col gap-2'>
				<Skeleton className='h-4 w-24' />
				<Skeleton className='h-8 w-64 max-w-full' />
				<Skeleton className='h-4 w-28' />
			</div>
			<div className='grid grid-cols-2 items-center gap-3 md:grid-cols-[1fr_auto_1fr]'>
				<Skeleton className='col-start-1 row-start-1 h-11 w-24 md:h-9' />
				<Skeleton className='col-span-2 h-11 w-56 justify-self-center md:col-span-1 md:col-start-2 md:row-start-1' />
				<Skeleton className='col-start-2 row-start-1 h-11 w-32 justify-self-end md:col-start-3 md:h-9' />
			</div>
			<div className='grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-3'>
				{Array.from({ length: 6 }, (_, index) => (
					<Skeleton key={index} className='h-48 w-full' />
				))}
			</div>
		</div>
	);
}
