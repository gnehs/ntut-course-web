import type { ReactNode } from 'react';
import { Clock, PanelTop, Table } from 'lucide-react';
import type { CourseListLayout } from './CourseList';
import { Button } from './ui-kit/Button';
import { cn } from '../lib/utils';

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
		<div className='mb-4 grid grid-cols-2 items-center gap-3 md:grid-cols-[1fr_auto_1fr]'>
			{toolbarStart ? (
				<div className='col-start-1 row-start-1 justify-self-start'>{toolbarStart}</div>
			) : null}
			<div className='contents'>
				<div
					role='group'
					aria-label='課程顯示方式'
					className='rounded-control bg-sheen-well shadow-well col-span-2 flex gap-1 justify-self-center bg-[rgba(var(--vs-text),0.06)] p-1 md:col-span-1 md:col-start-2 md:row-start-1'
				>
					{(
						[
							{ value: 'table', label: '表格', icon: Table },
							{ value: 'card', label: '卡片', icon: PanelTop },
							...(showTimetable ? [{ value: 'timetable', label: '課表', icon: Clock }] : []),
						] as const
					).map(({ value, label, icon: Icon }) => (
						<Button
							key={value}
							aria-pressed={layout === value}
							className={cn(
								'm-0 px-2.5',
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
				{toolbarEnd ? (
					<div className='col-start-2 row-start-1 justify-self-end md:col-start-3'>
						{toolbarEnd}
					</div>
				) : null}
			</div>
		</div>
	);
}
