import { Link } from '@tanstack/react-router';
import { IconArrowUpRight, IconChevronRight } from '@tabler/icons-react';
import type React from 'react';
import { Card } from './Card';

export type ActionListItem = {
	/** An in-app route. */
	to?: string;
	/** An external page, opened in a new tab. */
	href?: string;
	title: React.ReactNode;
	text?: React.ReactNode;
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const rowClassName =
	'group flex min-h-14 items-center gap-3 border-t px-4 py-2.5 !text-[rgb(var(--vs-text))] !no-underline first:border-t-0';
const linkRowClassName =
	'transition-colors duration-200 hover:bg-[rgba(var(--vs-text),0.04)] focus-visible:bg-[rgba(var(--vs-text),0.06)] focus-visible:outline-none';
const trailingIconClassName =
	'text-icon-subtle group-hover:text-icon-muted size-4 shrink-0 transition-[color,translate] duration-200';

// Secondary destinations share one surface so they read as a list, not as competing cards.
// A row with neither `to` nor `href` keeps its place but stays inert.
export function ActionList({ items }: { items: ActionListItem[] }) {
	return (
		<Card className='!p-0'>
			{items.map((item, index) => {
				const key = item.to ?? item.href ?? index;
				const Icon = item.icon;
				const content = (
					<>
						<Icon className='text-muted-foreground size-5 shrink-0' aria-hidden='true' />
						<div className='min-w-0 flex-1'>
							<div className='font-medium'>{item.title}</div>
							{item.text ? <p>{item.text}</p> : null}
						</div>
						{item.href ? (
							<IconArrowUpRight
								className={`${trailingIconClassName} group-hover:translate-x-0.5 group-hover:-translate-y-0.5`}
								aria-hidden='true'
							/>
						) : (
							<IconChevronRight
								className={`${trailingIconClassName} group-hover:translate-x-0.5`}
								aria-hidden='true'
							/>
						)}
					</>
				);
				if (item.to) {
					return (
						<Link key={key} to={item.to} className={`${rowClassName} ${linkRowClassName}`}>
							{content}
						</Link>
					);
				}
				if (item.href) {
					return (
						<a
							key={key}
							href={item.href}
							target='_blank'
							rel='noreferrer'
							className={`${rowClassName} ${linkRowClassName}`}
						>
							{content}
						</a>
					);
				}
				return (
					<div key={key} className={rowClassName}>
						{content}
					</div>
				);
			})}
		</Card>
	);
}
