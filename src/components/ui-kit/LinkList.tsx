import { Link } from '@tanstack/react-router';
import { IconChevronRight } from '@tabler/icons-react';
import type React from 'react';
import { Skeleton } from '../ui/skeleton';

export type LinkListItem = {
	key: string;
	to: string;
	title: React.ReactNode;
	subtitle?: React.ReactNode;
	detail?: React.ReactNode;
};

export const linkGroupClassName =
	'divide-y divide-[rgba(var(--vs-text),0.08)] overflow-hidden rounded-xl bg-[rgb(var(--vs-background))] shadow-[var(--shadow-rest)]';

const rowClassName = 'flex min-h-14 items-center gap-3';
const titleClassName = 'text-[0.95rem] leading-snug font-medium';
const subtitleClassName = 'flex min-w-0 gap-2 text-xs leading-snug';

/** A grouped, iOS-style list of navigation rows. */
export function LinkList({ items }: { items: LinkListItem[] }) {
	return (
		<ul className={`m-0 list-none p-0 ${linkGroupClassName}`}>
			{items.map((item) => (
				<li key={item.key}>
					<Link
						to={item.to}
						className={`${rowClassName} text-foreground hover:text-foreground px-4 py-2.5 !no-underline transition-colors duration-150 hover:bg-[rgba(var(--vs-text),0.05)] focus-visible:bg-[rgba(var(--vs-text),0.05)] focus-visible:outline-none active:bg-[rgba(var(--vs-text),0.08)]`}
					>
						<span className='flex min-w-0 flex-1 flex-col gap-0.5'>
							<span className={titleClassName}>{item.title}</span>
							{item.subtitle ? (
								<span className={`text-muted-foreground ${subtitleClassName}`}>
									{item.subtitle}
								</span>
							) : null}
						</span>
						{item.detail ? (
							<span className='text-muted-foreground shrink-0 text-sm tabular-nums'>
								{item.detail}
							</span>
						) : null}
						<IconChevronRight aria-hidden className='size-4 shrink-0 text-[var(--icon-subtle)]' />
					</Link>
				</li>
			))}
		</ul>
	);
}

export function LinkListSkeleton({ count = 8 }: { count?: number }) {
	return (
		<div className={linkGroupClassName}>
			{Array.from({ length: count }, (_, index) => (
				<div key={index} className={`${rowClassName} px-4 py-2.5`}>
					<span className='flex min-w-0 flex-1 flex-col gap-0.5'>
						<span className={titleClassName}>
							<Skeleton className='h-[1lh] w-2/5' />
						</span>
						<span className={subtitleClassName}>
							<Skeleton className='h-[1lh] w-1/4' />
						</span>
					</span>
					<Skeleton className='size-4 shrink-0' />
				</div>
			))}
		</div>
	);
}
