import type React from 'react';
import { parseCourseTime } from '../lib/courseUtils';
import type { CourseTime } from '../types/course';

// One chip per weekday, shared by course cards, tables and the detail page so time reads the same everywhere.
export function CourseTimeChips({
	time,
	fallback = '無資料',
	wrap = true,
	children,
}: {
	time?: CourseTime;
	fallback?: string;
	/** Table cells keep every chip on one line. */
	wrap?: boolean;
	/** Extra badges that belong beside the time, such as a conflict warning. */
	children?: React.ReactNode;
}) {
	const items = parseCourseTime(time);
	if (!items.length) return <span className='text-muted-foreground'>{fallback}</span>;
	return (
		<span className={wrap ? 'flex flex-wrap gap-1' : 'flex gap-1'}>
			{items.map((item) => (
				<span
					key={item.title}
					className='rounded-sm bg-[rgba(var(--vs-text),0.07)] px-1.5 font-medium whitespace-nowrap tabular-nums'
				>
					{item.title} {item.content}
				</span>
			))}
			{children}
		</span>
	);
}
