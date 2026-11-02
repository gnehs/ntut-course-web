import { LinkList, LinkListSkeleton } from './ui-kit/LinkList';
import { Skeleton } from './ui/skeleton';

export type ProgramListItem = {
	id: string;
	name: string;
	description?: string;
	courseCount: number;
	to: string;
};

export function ProgramList({ items }: { items: ProgramListItem[] }) {
	return (
		<LinkList
			items={items.map((item) => ({
				key: item.id,
				to: item.to,
				title: item.name,
				subtitle: (
					<>
						<span className='shrink-0 font-mono'>{item.id}</span>
						{item.description ? <span className='truncate'>{item.description}</span> : null}
					</>
				),
				detail: `${item.courseCount} 門課程`,
			}))}
		/>
	);
}

export function ProgramIndexSkeleton({ title }: { title: string }) {
	return (
		<div className='flex flex-col gap-4' aria-busy='true' aria-label={`載入${title}`}>
			<h1>{title}</h1>
			<Skeleton className='h-11 w-full md:h-9' />
			<LinkListSkeleton />
		</div>
	);
}
