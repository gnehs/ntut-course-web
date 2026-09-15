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
					className='rounded-control bg-muted col-span-2 flex justify-self-center p-1 md:col-span-1 md:col-start-2 md:row-start-1'
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
									? 'bg-background text-foreground hover:bg-background shadow-sm'
									: 'text-muted-foreground hover:bg-background/60 bg-transparent',
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
