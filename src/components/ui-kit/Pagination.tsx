import { Button } from './Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type React from 'react';

type PaginationProps = {
	page: number;
	length: number;
	onChange: (page: number) => void;
};

export function Pagination({ page, length, onChange }: PaginationProps) {
	if (length <= 1) return null;
	const items = getPaginationItems(page, length);
	return (
		<nav aria-label='課程列表分頁' className='py-5'>
			<div className='flex items-center justify-center gap-3 sm:hidden'>
				<PaginationArrow
					label='上一頁'
					disabled={page <= 1}
					onClick={() => onChange(Math.max(page - 1, 1))}
				>
					<ChevronLeft className='size-4' />
				</PaginationArrow>
				<span aria-live='polite' className='min-w-20 text-center text-sm tabular-nums'>
					第 {page} / {length} 頁
				</span>
				<PaginationArrow
					label='下一頁'
					disabled={page >= length}
					onClick={() => onChange(Math.min(page + 1, length))}
				>
					<ChevronRight className='size-4' />
				</PaginationArrow>
			</div>
			<div className='hidden flex-wrap items-center justify-center gap-2 sm:flex'>
				<PaginationArrow
					label='上一頁'
					disabled={page <= 1}
					onClick={() => onChange(Math.max(page - 1, 1))}
				>
					<ChevronLeft className='size-4' />
				</PaginationArrow>
				{items.map((item, index) =>
					item === 'ellipsis' ? (
						<span
							key={`ellipsis-${index}`}
							aria-hidden='true'
							className='inline-flex h-11 min-w-11 items-center justify-center px-1 text-[0.8em] opacity-60'
						>
							…
						</span>
					) : (
						<Button
							key={item}
							active={item === page}
							aria-current={item === page ? 'page' : undefined}
							aria-label={`第 ${item} 頁`}
							className='min-w-11'
							onClick={() => onChange(item)}
						>
							{item}
						</Button>
					),
				)}
				<PaginationArrow
					label='下一頁'
					disabled={page >= length}
					onClick={() => onChange(Math.min(page + 1, length))}
				>
					<ChevronRight className='size-4' />
				</PaginationArrow>
			</div>
		</nav>
	);
}

function PaginationArrow({
	label,
	disabled,
	onClick,
	children,
}: {
	label: string;
	disabled: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<Button icon disabled={disabled} aria-label={label} onClick={onClick}>
			{children}
		</Button>
	);
}

function getPaginationItems(page: number, length: number): Array<number | 'ellipsis'> {
	if (length <= 9) return Array.from({ length }, (_, index) => index + 1);

	if (page <= 4 || page >= length - 3) {
		return [1, 2, 3, 4, 'ellipsis', length - 3, length - 2, length - 1, length];
	}

	return [1, 'ellipsis', page - 2, page - 1, page, page + 1, page + 2, 'ellipsis', length];
}
