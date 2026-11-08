import { RouterProvider, createMemoryHistory } from '@tanstack/react-router';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAppRouter } from '../router';

const mockGetCourses = vi.hoisted(() =>
	vi.fn().mockResolvedValue([
		{
			id: '123456',
			courseType: '○',
			name: { zh: '共同必修' },
			class: [],
			teacher: [],
		},
	]),
);
const mockGetMyCourseIds = vi.hoisted(() => vi.fn(() => []));

vi.mock('../state/AppContext', () => ({
	useApp: () => ({
		dataset: { year: '115', sem: '1', department: 'main' },
		setDataset: vi.fn(),
		yearSemItems: ['115-1'],
		departmentItems: ['日間部'],
		datasetDialogOpen: false,
		setDatasetDialogOpen: vi.fn(),
		getCourses: mockGetCourses,
		getMyCourseIds: mockGetMyCourseIds,
	}),
}));

vi.mock('../lib/courseApi', () => ({
	fetchCalendar: vi.fn().mockResolvedValue([]),
	fetchDepartment: vi.fn().mockResolvedValue([]),
	fetchWithdrawalRate: vi.fn().mockResolvedValue({}),
}));

describe('AdvancedSearchPage navigation', () => {
	beforeEach(() => {
		mockGetCourses.mockReset().mockResolvedValue([
			{
				id: '123456',
				courseType: '○',
				name: { zh: '共同必修' },
				class: [],
				teacher: [],
			},
		]);
	});

	it('redirects the legacy search route to advanced search', async () => {
		const history = createMemoryHistory({
			initialEntries: ['/search?year=115&sem=1&d=main'],
		});
		const router = createAppRouter({ history });

		render(<RouterProvider router={router} />);

		await waitFor(() => expect(router.state.location.pathname).toBe('/advanced-search'));
		const search = router.state.location.search as Record<string, unknown>;
		expect(search).toMatchObject({ d: 'main' });
		expect(String(search.year)).toBe('115');
		expect(String(search.sem)).toBe('1');
	});

	it('returns to the home page when the site title is clicked', async () => {
		const history = createMemoryHistory({
			initialEntries: ['/advanced-search?year=115&sem=1&d=main'],
		});
		const router = createAppRouter({ history });
		const user = userEvent.setup();

		render(<RouterProvider router={router} />);

		await user.click(await screen.findByRole('link', { name: /北科課程好朋友/ }));

		await waitFor(() => expect(router.state.location.pathname).toBe('/'));
		expect(await screen.findByText('探索與規劃')).toBeInTheDocument();
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

	it('shows mobile search input and filter chips without a drawer trigger', async () => {
		const history = createMemoryHistory({
			initialEntries: ['/advanced-search?year=115&sem=1&d=main'],
		});
		const router = createAppRouter({ history });
		const user = userEvent.setup();

		render(<RouterProvider router={router} />);

		expect(await screen.findByPlaceholderText('搜尋課程、教師、課號、班級')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: '搜尋' })).not.toBeInTheDocument();
		await user.click(screen.getByRole('button', { name: '課程標準' }));
		expect(await screen.findByText('部訂共同必修')).toBeInTheDocument();
		expect(screen.queryByText('校訂共同必修')).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: '博雅類別' })).toBeInTheDocument();
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

	it('passes the URL dataset to course links and conflict lookups', async () => {
		mockGetCourses.mockResolvedValue([
			{
				id: '1',
				courseType: '○',
				name: { zh: '跨資料集課程' },
				class: [],
				teacher: [{ name: '教師' }],
			},
		]);
		const history = createMemoryHistory({
			initialEntries: ['/advanced-search?year=114&sem=2&d=night'],
		});
		const router = createAppRouter({ history });

		render(<RouterProvider router={router} />);

		const courseLink = await screen.findByRole('link', { name: /跨資料集課程/ });
		expect(courseLink).toHaveAttribute('href', '/course/114/2/1');
		expect(mockGetCourses).toHaveBeenCalledWith({ year: '114', sem: '2', department: 'night' });
	});

	it('applies the English shortcut from the URL and keeps it shareable', async () => {
		mockGetCourses.mockResolvedValue([
			{
				id: '1',
				courseType: '○',
				name: { zh: '英文課程' },
				language: '英文',
				class: [],
				teacher: [{ name: '教師' }],
			},
			{
				id: '2',
				courseType: '○',
				name: { zh: '中文課程' },
				language: '中文',
				class: [],
				teacher: [{ name: '教師' }],
			},
		]);
		const history = createMemoryHistory({
			initialEntries: ['/advanced-search?year=115&sem=1&d=main&language=English'],
		});
		const router = createAppRouter({ history });

		render(<RouterProvider router={router} />);

		expect(await screen.findByRole('link', { name: /英文課程/ })).toBeInTheDocument();
		expect(screen.queryByRole('link', { name: /中文課程/ })).not.toBeInTheDocument();
		expect((router.state.location.search as Record<string, unknown>).language).toBe('English');
	});

	it('ends loading and hides the normal empty state when the course API fails', async () => {
		mockGetCourses.mockRejectedValue(new Error('課程資料暫時無法取得'));
		const history = createMemoryHistory({
			initialEntries: ['/advanced-search?year=115&sem=1&d=main'],
		});
		const router = createAppRouter({ history });

		render(<RouterProvider router={router} />);

		await waitFor(() => expect(mockGetCourses).toHaveBeenCalled());
		expect(await screen.findByRole('alert')).toHaveTextContent('課程資料暫時無法取得');
		expect(screen.queryByText('查無資料')).not.toBeInTheDocument();
		expect(document.querySelector('.animate-pulse')).not.toBeInTheDocument();
	});

	it('restores result page and layout from the URL without resetting them on mount', async () => {
		mockGetCourses.mockResolvedValue(
			Array.from({ length: 108 }, (_, index) => ({
				id: String(index + 1),
				courseType: '○',
				name: { zh: `新關鍵字 課程 ${index + 1}` },
				class: [],
				teacher: [],
			})),
		);
		const history = createMemoryHistory({
			initialEntries: ['/advanced-search?year=115&sem=1&d=main&page=2&view=table'],
		});
		const router = createAppRouter({ history });
		const user = userEvent.setup();

		render(<RouterProvider router={router} />);

		expect(await screen.findByRole('link', { name: /課程 55/ })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: '表格' })).toHaveAttribute('aria-pressed', 'true');
		expect(screen.getByRole('button', { name: '第 2 頁' })).toHaveAttribute('aria-current', 'page');

		await user.click(screen.getByRole('button', { name: '卡片' }));
		await waitFor(() => {
			expect(router.state.location.search).not.toHaveProperty('page');
			expect(router.state.location.search).not.toHaveProperty('view');
		});
	});

	it('applies a newly navigated URL before syncing local filter state back', async () => {
		mockGetCourses.mockResolvedValue(
			Array.from({ length: 108 }, (_, index) => ({
				id: String(index + 1),
				courseType: '○',
				name: { zh: `新關鍵字 課程 ${index + 1}` },
				class: [],
				teacher: [],
			})),
		);
		const history = createMemoryHistory({
			initialEntries: ['/advanced-search?year=115&sem=1&d=main&q=%7B%22k%22%3A%22舊關鍵字%22%7D'],
		});
		const router = createAppRouter({ history });

		render(<RouterProvider router={router} />);
		expect(await screen.findAllByDisplayValue('舊關鍵字')).toHaveLength(2);

		await router.navigate({
			to: '/advanced-search',
			search: {
				year: '114',
				sem: '2',
				d: 'night',
				page: 2,
				view: 'table',
				q: { k: '新關鍵字' },
			},
		});

		await waitFor(() => {
			expect(screen.getAllByDisplayValue('新關鍵字')).toHaveLength(2);
			expect(router.state.location.search).toMatchObject({
				year: '114',
				sem: '2',
				d: 'night',
				page: 2,
				view: 'table',
			});
		});
	});

	it('keeps a cleared keyword cleared in the URL and both search inputs', async () => {
		mockGetCourses.mockResolvedValue([
			{
				id: '1',
				courseType: '○',
				name: { zh: '舊關鍵字課程' },
				class: [],
				teacher: [],
			},
		]);
		const history = createMemoryHistory({
			initialEntries: ['/advanced-search?year=115&sem=1&d=main&q=%7B%22k%22%3A%22舊關鍵字%22%7D'],
		});
		const router = createAppRouter({ history });
		const user = userEvent.setup();

		render(<RouterProvider router={router} />);
		const inputs = await screen.findAllByDisplayValue('舊關鍵字');

		await user.clear(inputs[0]);

		await waitFor(() => {
			expect(screen.queryAllByDisplayValue('舊關鍵字')).toHaveLength(0);
			expect(router.state.location.search).not.toHaveProperty('q');
		});
	});

	it('clears a filter error once the filters that caused it change', async () => {
		mockGetCourses.mockResolvedValue([
			{ id: '1', courseType: '○', name: { zh: '格式錯誤課程' }, class: [], teacher: '王老師' },
		]);
		const history = createMemoryHistory({
			initialEntries: ['/advanced-search?year=115&sem=1&d=main&q=%7B%22k%22%3A%22abc%22%7D'],
		});
		const router = createAppRouter({ history });
		const user = userEvent.setup();

		render(<RouterProvider router={router} />);
		expect(await screen.findByText('搜尋時發生錯誤')).toBeInTheDocument();

		const inputs = await screen.findAllByDisplayValue('abc');
		await user.clear(inputs[0]);

		await waitFor(() => expect(screen.queryByText('搜尋時發生錯誤')).not.toBeInTheDocument());
	});
});
