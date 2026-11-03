import { useState, type ReactNode } from 'react';
import { IconCheck, IconX } from '@tabler/icons-react';
import { CourseList, CourseListSkeleton, type CourseListLayout } from './CourseList';
import { CourseListToolbar } from './CourseListToolbar';
import { Button } from './ui-kit/Button';
import { Alert } from './ui-kit/Alert';
import { Skeleton } from './ui/skeleton';
import type { Course } from '../types/course';

const pageClassName = 'flex flex-col gap-4';
const headerClassName = 'flex flex-col gap-1';
const metaClassName = 'm-0 flex items-baseline gap-2 text-sm';

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
		<div className={pageClassName}>
			<header className={headerClassName}>
				<p className={metaClassName}>
					{code ? (
						<>
							<span className='font-mono opacity-65'>{code}</span>
							<span aria-hidden className='opacity-40'>·</span>
						</>
					) : null}
					<span className='opacity-70'>共 {count} 門課程</span>
				</p>
				<h1 className='m-0'>{title}</h1>
				{description ? <div className='opacity-75'>{description}</div> : null}
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
										: 'text-muted-foreground bg-transparent hover:bg-[rgba(var(--vs-text),0.06)]'
								}
							>
								{showConflictCourse ? (
									<IconCheck className='size-4' />
								) : (
									<IconX className='size-4' />
								)}
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

/** Pass `title` and `code` when the route already knows them, and `description` when the page will show one. */
export function CourseCollectionSkeleton({
	label = '載入課程',
	title,
	code,
	description = false,
}: {
	label?: string;
	title?: string;
	code?: string;
	description?: boolean;
}) {
	return (
		<div className={pageClassName} aria-busy='true' aria-label={label}>
			<header className={headerClassName}>
				<p className={metaClassName}>
					{code ? (
						<>
							<span className='font-mono opacity-65'>{code}</span>
							<span aria-hidden className='opacity-40'>·</span>
						</>
					) : null}
					<Skeleton className='h-[1lh] w-24' />
				</p>
				<h1 className='m-0'>{title ?? <Skeleton className='h-[1lh] w-64 max-w-full' />}</h1>
				{description ? (
					<div>
						<Skeleton className='h-[1lh] w-full' />
						<Skeleton className='h-[1lh] w-3/4' />
					</div>
				) : null}
			</header>
			<CourseListSkeleton
				showTimetable
				toolbarStart={<Skeleton className='h-11 w-[102px] sm:h-9' />}
				toolbarEnd={<Skeleton className='h-11 w-36 sm:h-9' />}
			/>
		</div>
	);
}
