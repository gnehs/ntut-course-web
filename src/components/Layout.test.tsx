import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Layout } from './Layout';

const fixtures = vi.hoisted(() => ({
	navigate: vi.fn(),
	setDataset: vi.fn(),
	location: {
		pathname: '/advanced-search',
		search: { year: '114', sem: '2', d: 'main', page: 3, q: { k: '測試' } },
	},
}));

vi.mock('@tanstack/react-router', () => ({
	Link: ({ to, children, ...props }) => (
		<a href={to} {...props}>
			{children}
		</a>
	),
	Outlet: () => <div>頁面內容</div>,
	useRouterState: () => ({ location: fixtures.location }),
	useNavigate: () => fixtures.navigate,
}));
vi.mock('./UniversalSearch', () => ({ UniversalSearch: () => null }));
vi.mock('../state/AppContext', async () => {
	const { useState } = await import('react');
	return {
		useApp: () => {
			const [datasetDialogOpen, setDatasetDialogOpen] = useState(false);
			return {
				dataset: { year: '115', sem: '1', department: 'main' },
				setDataset: fixtures.setDataset,
				yearSemItems: ['115-1', '114-2'],
				departmentItems: ['日間部'],
				datasetDialogOpen,
				setDatasetDialogOpen,
			};
		},
	};
});

describe('dataset dialog', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		Element.prototype.scrollIntoView = vi.fn();
	});

	it('opens the query semester and discards a cancelled draft on reopening', async () => {
		const user = userEvent.setup();
		render(<Layout />);
		await user.click(screen.getByRole('button', { name: '114 年下學期' }));
		const semester = screen.getAllByRole('combobox')[0];
		expect(semester).toHaveTextContent('114 年下學期');
		fireEvent.keyDown(semester, { key: 'ArrowDown' });
		await user.click(await screen.findByRole('option', { name: '115 年上學期' }));
		expect(semester).toHaveTextContent('115 年上學期');
		await user.keyboard('{Escape}');
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		await user.click(screen.getByRole('button', { name: '114 年下學期' }));
		expect(screen.getAllByRole('combobox')[0]).toHaveTextContent('114 年下學期');
		expect(fixtures.setDataset).not.toHaveBeenCalled();
	});

	it('applies the chosen semester to search without losing filters', async () => {
		const user = userEvent.setup();
		render(<Layout />);
		await user.click(screen.getByRole('button', { name: '114 年下學期' }));
		fireEvent.keyDown(screen.getAllByRole('combobox')[0], { key: 'ArrowDown' });
		await user.click(await screen.findByRole('option', { name: '115 年上學期' }));
		await user.click(screen.getByRole('button', { name: '套用學期與學制' }));
		expect(fixtures.setDataset).toHaveBeenCalledWith({ year: '115', sem: '1', department: 'main' });
		const navigation = fixtures.navigate.mock.calls[0][0];
		expect(navigation.search(fixtures.location.search)).toEqual({
			year: '115',
			sem: '1',
			d: 'main',
			page: undefined,
			q: { k: '測試' },
		});
	});
});
