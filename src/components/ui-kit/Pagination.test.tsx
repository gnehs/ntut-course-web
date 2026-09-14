import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Pagination } from './Pagination';

describe('Pagination', () => {
	it('exposes the selected page and a compact mobile position indicator', () => {
		render(<Pagination page={4} length={10} onChange={vi.fn()} />);

		expect(screen.getByRole('navigation', { name: '課程列表分頁' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: '第 4 頁' })).toHaveAttribute('aria-current', 'page');
		expect(screen.getByText('第 4 / 10 頁')).toBeInTheDocument();
		expect(screen.getAllByText('…')).toHaveLength(1);
		expect(screen.queryByText('...')).not.toBeInTheDocument();
	});

	it('reports page changes through the public callback', () => {
		const onChange = vi.fn();
		render(<Pagination page={2} length={3} onChange={onChange} />);

		fireEvent.click(screen.getByRole('button', { name: '第 3 頁' }));

		expect(onChange).toHaveBeenCalledWith(3);
	});
});
