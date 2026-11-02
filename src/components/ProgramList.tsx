import { Link } from '@tanstack/react-router';
import { IconChevronRight } from '@tabler/icons-react';
import { Skeleton } from './ui/skeleton';

export type ProgramListItem = {
	id: string;
	name: string;
	description?: string;
	courseCount: number;
	to: string;
};

const groupClassName =
	'divide-y divide-[rgba(var(--vs-text),0.08)] overflow-hidden rounded-xl bg-[rgb(var(--vs-background))] shadow-[var(--shadow-rest)]';

export function ProgramList({ items }: { items: ProgramListItem[] }) {
	return (
		<ul className={`m-0 list-none p-0 ${groupClassName}`}>
			{items.map((item) => (
				<li key={item.id}>
					<Link
						to={item.to}
						className='text-foreground hover:text-foreground flex min-h-14 items-center gap-3 px-4 py-2.5 !no-underline transition-colors duration-150 hover:bg-[rgba(var(--vs-text),0.05)] focus-visible:bg-[rgba(var(--vs-text),0.05)] focus-visible:outline-none active:bg-[rgba(var(--vs-text),0.08)]'
					>
						<span className='flex min-w-0 flex-1 flex-col gap-0.5'>
							<span className='text-[0.95rem] leading-snug font-medium'>{item.name}</span>
							<span className='text-muted-foreground flex min-w-0 gap-2 text-xs leading-snug'>
								<span className='shrink-0 font-mono'>{item.id}</span>
								{item.description ? <span className='truncate'>{item.description}</span> : null}
							</span>
						</span>
						<span className='text-muted-foreground shrink-0 text-sm tabular-nums'>
							{item.courseCount} 門課程
						</span>
						<IconChevronRight aria-hidden className='size-4 shrink-0 text-[var(--icon-subtle)]' />
					</Link>
				</li>
			))}
		</ul>
	);
}

export function ProgramListSkeleton() {
	return (
		<div className={groupClassName}>
			{Array.from({ length: 8 }, (_, index) => (
				<div key={index} className='flex min-h-14 items-center gap-3 px-4 py-2.5'>
					<div className='flex flex-1 flex-col gap-1.5'>
						<Skeleton className='h-4 w-2/5' />
						<Skeleton className='h-3 w-1/4' />
					</div>
					<Skeleton className='h-4 w-14' />
				</div>
			))}
		</div>
	);
}
