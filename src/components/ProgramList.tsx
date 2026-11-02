import { LinkList } from './ui-kit/LinkList';

export { LinkListSkeleton as ProgramListSkeleton } from './ui-kit/LinkList';

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
