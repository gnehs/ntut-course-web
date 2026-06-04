import { RouterProvider, createMemoryHistory } from '@tanstack/react-router';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createAppRouter } from '../router';

vi.mock('../state/AppContext', () => ({
	useApp: () => ({
		dataset: { year: '115', sem: '1', department: 'main' },
		setDataset: vi.fn(),
		yearSemItems: ['115-1'],
		departmentItems: ['日間部'],
		datasetDialogOpen: false,
		setDatasetDialogOpen: vi.fn(),
		getCourses: vi.fn().mockResolvedValue([]),
		getMyCourseIds: vi.fn(() => []),
	}),
}));

vi.mock('../lib/courseApi', () => ({
	fetchCalendar: vi.fn().mockResolvedValue([]),
	fetchDepartment: vi.fn().mockResolvedValue([]),
	fetchWithdrawalRate: vi.fn().mockResolvedValue({}),
}));

describe('AdvancedSearchPage navigation', () => {
	it('returns to the home page when the site title is clicked', async () => {
		const history = createMemoryHistory({
			initialEntries: ['/advanced-search?year=115&sem=1&d=main'],
		});
		const router = createAppRouter({ history });
		const user = userEvent.setup();

		render(<RouterProvider router={router} />);

		await user.click(await screen.findByRole('link', { name: /北科課程好朋友/ }));

		await waitFor(() => expect(router.state.location.pathname).toBe('/'));
		expect(await screen.findByText('實用')).toBeInTheDocument();
	});

	it('keeps the URL valid when filter options change', async () => {
		const history = createMemoryHistory({
			initialEntries: ['/advanced-search?year=115&sem=1&d=main'],
		});
		const router = createAppRouter({ history });
		const user = userEvent.setup();

		render(<RouterProvider router={router} />);

		await user.click(await screen.findByText('顯示佔位課程'));

		await waitFor(() => {
			expect(router.state.location.href).toContain('q=%7B');
			expect(router.state.location.href).not.toContain('q=%22%7B');
		});
		expect((router.state.location.search as Record<string, unknown>).q).toEqual({ sph: true });
	});

	it('keeps accumulated filters after multiple option changes', async () => {
		const history = createMemoryHistory({
			initialEntries: ['/advanced-search?year=115&sem=1&d=main'],
		});
		const router = createAppRouter({ history });
		const user = userEvent.setup();

		render(<RouterProvider router={router} />);

		await user.click(await screen.findByText('顯示佔位課程'));
		await user.click(await screen.findByText('顯示衝堂課程'));

		await waitFor(() => {
			expect((router.state.location.search as Record<string, unknown>).q).toEqual({
				sph: true,
				c: false,
			});
		});
		expect(router.state.location.href).toContain('q=%7B');
		expect(router.state.location.href).not.toContain('q=%22%7B');
	});
});
