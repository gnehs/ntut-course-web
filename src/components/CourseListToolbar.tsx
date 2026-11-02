import type { ReactNode } from 'react';
import { IconClock, IconLayoutNavbar, IconTable } from '@tabler/icons-react';
import type { CourseListLayout } from './CourseList';
import { Button } from './ui-kit/Button';
import { Skeleton } from './ui/skeleton';
import { cn } from '../lib/utils';

const toolbarClassName = 'mb-4 grid grid-cols-2 items-center gap-3 md:grid-cols-[1fr_auto_1fr]';
const toolbarStartClassName = 'col-start-1 row-start-1 justify-self-start';
const toolbarEndClassName = 'col-start-2 row-start-1 justify-self-end md:col-start-3';
const layoutGroupClassName =
	'bg-sheen-well shadow-well col-span-2 flex gap-0.5 justify-self-center rounded-[calc(var(--radius-control)+3px)] bg-[rgba(var(--vs-text),0.06)] p-[3px] md:col-span-1 md:col-start-2 md:row-start-1';

export function CourseListToolbar({
	layout,
	onLayoutChange,
	showTimetable = false,
	toolbarStart,
	toolbarEnd,
}: {
	layout: CourseListLayout;
	onLayoutChange: (layout: CourseListLayout) => void;
	showTimetable?: boolean;
	toolbarStart?: ReactNode;
	toolbarEnd?: ReactNode;
}) {
	return (
		<div className={toolbarClassName}>
			{toolbarStart ? <div className={toolbarStartClassName}>{toolbarStart}</div> : null}
			<div className='contents'>
				<div role='group' aria-label='課程顯示方式' className={layoutGroupClassName}>
					{(
						[
							{ value: 'table', label: '表格', icon: IconTable },
							{ value: 'card', label: '卡片', icon: IconLayoutNavbar },
							...(showTimetable ? [{ value: 'timetable', label: '課表', icon: IconClock }] : []),
						] as const
					).map(({ value, label, icon: Icon }) => (
						<Button
							key={value}
							aria-pressed={layout === value}
							className={cn(
								'm-0 px-2.5 py-1 sm:min-h-8',
								layout === value
									? 'bg-background bg-sheen-surface text-foreground hover:bg-background shadow-thumb hover:shadow-thumb'
									: 'text-muted-foreground hover:text-foreground bg-transparent bg-none shadow-none hover:bg-[rgba(var(--vs-text),0.06)] hover:shadow-none',
							)}
							onClick={() => onLayoutChange(value as CourseListLayout)}
						>
							<Icon className='size-4' />
							{label}
						</Button>
					))}
				</div>
				{toolbarEnd ? <div className={toolbarEndClassName}>{toolbarEnd}</div> : null}
			</div>
		</div>
	);
}

export function CourseListToolbarSkeleton({
	showTimetable = false,
	toolbarStart,
	toolbarEnd,
}: {
	showTimetable?: boolean;
	toolbarStart?: ReactNode;
	toolbarEnd?: ReactNode;
}) {
	return (
		<div className={toolbarClassName}>
			{toolbarStart ? <div className={toolbarStartClassName}>{toolbarStart}</div> : null}
			<div className={layoutGroupClassName}>
				{Array.from({ length: showTimetable ? 3 : 2 }, (_, index) => (
					// A segment is a 16px icon plus two characters, 44px tall until `sm` like the real Button.
					<Skeleton key={index} className='h-11 w-[70px] sm:h-8' />
				))}
			</div>
			{toolbarEnd ? <div className={toolbarEndClassName}>{toolbarEnd}</div> : null}
		</div>
	);
}
