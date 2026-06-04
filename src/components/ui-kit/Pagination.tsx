import { Button } from './Button';

export function Pagination({ page, length, onChange }) {
	if (length <= 1) return null;
	const items = getPaginationItems(page, length);
	return (
		<div className='flex flex-wrap items-center justify-center gap-2 py-5'>
			<Button
				icon
				disabled={page <= 1}
				aria-label='上一頁'
				className='size-9'
				onClick={() => onChange(Math.max(page - 1, 1))}
			>
				<i className='bx bx-chevron-left' />
			</Button>
			{items.map((item, index) =>
				item === 'ellipsis' ? (
					<span
						key={`ellipsis-${index}`}
						className='inline-flex h-9 min-w-9 items-center justify-center px-1 text-[0.8em] opacity-60'
					>
						...
					</span>
				) : (
					<Button
						key={item}
						active={item === page}
						className='h-9 min-w-9'
						onClick={() => onChange(item)}
					>
						{item}
					</Button>
				),
			)}
			<Button
				icon
				disabled={page >= length}
				aria-label='下一頁'
				className='size-9'
				onClick={() => onChange(Math.min(page + 1, length))}
			>
				<i className='bx bx-chevron-right' />
			</Button>
		</div>
	);
}

function getPaginationItems(page, length) {
	if (length <= 9) return Array.from({ length }, (_, index) => index + 1);

	if (page <= 4) {
		return [1, 2, 3, 4, 'ellipsis', length - 3, length - 2, length - 1, length];
	}

	if (page >= length - 3) {
		return [1, 2, 3, 4, 'ellipsis', length - 3, length - 2, length - 1, length];
	}

	return [1, 'ellipsis', page - 2, page - 1, page, page + 1, page + 2, 'ellipsis', length];
}
