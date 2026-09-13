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
const mockFetchSyllabusIndex = vi.hoisted(() => vi.fn().mockResolvedValue(null));

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
	fetchSyllabusIndex: mockFetchSyllabusIndex,
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
		mockFetchSyllabusIndex.mockReset().mockResolvedValue(null);
	});

	it('redirects the legacy search route to advanced search', async () => {
		const history = createMemoryHistory({
			initialEntries: ['/search?year=115&sem=1&d=main'],
		});
		const router = createAppRouter({ history });

		render(<RouterProvider router={router} />);

		await waitFor(() => expect(router.state.location.pathname).toBe('/advanced-search'));
		expect(router.state.location.search).toEqual({
			year: '115',
			sem: '1',
			d: 'main',
		});
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
		expect(await screen.findByText('○ 部訂共同必修')).toBeInTheDocument();
		expect(screen.queryByText('△ 校訂共同必修')).not.toBeInTheDocument();
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

	it('filters AI syllabus data from the semester index without fetching each course', async () => {
		mockGetCourses.mockResolvedValue([
			{
				id: '1',
				courseType: '○',
				name: { zh: '導入 AI 課程' },
				class: [],
				teacher: [{ name: '教師' }],
			},
			{
				id: '2',
				courseType: '○',
				name: { zh: '一般課程' },
				class: [],
				teacher: [{ name: '教師' }],
			},
		]);
		mockFetchSyllabusIndex.mockResolvedValue({
			'1': { ai: ['生成式 AI'], sdgs: [4], resources: [], hasSyllabus: true },
			'2': { ai: [], sdgs: [], resources: [], hasSyllabus: true },
		});
		const history = createMemoryHistory({
			initialEntries: ['/advanced-search?year=115&sem=1&d=main&q=%7B%22ai%22%3Atrue%7D'],
		});
		const router = createAppRouter({ history });

		render(<RouterProvider router={router} />);

		expect(await screen.findByRole('link', { name: /導入 AI 課程/ })).toBeInTheDocument();
		expect(screen.queryByRole('link', { name: /一般課程/ })).not.toBeInTheDocument();
		expect(mockFetchSyllabusIndex).toHaveBeenCalledTimes(1);
		expect(mockGetCourses).toHaveBeenCalled();
	});

	it('updates the shareable query when an AI filter is selected', async () => {
		mockGetCourses.mockResolvedValue([
			{
				id: '1',
				courseType: '○',
				name: { zh: '導入 AI 課程' },
				class: [],
				teacher: [{ name: '教師' }],
			},
			{
				id: '2',
				courseType: '○',
				name: { zh: '一般課程' },
				class: [],
				teacher: [{ name: '教師' }],
			},
		]);
		mockFetchSyllabusIndex.mockResolvedValue({
			'1': { ai: ['生成式 AI'], sdgs: [4], resources: [], hasSyllabus: true },
			'2': { ai: [], sdgs: [], resources: [], hasSyllabus: true },
		});
		const history = createMemoryHistory({
			initialEntries: ['/advanced-search?year=115&sem=1&d=main'],
		});
		const router = createAppRouter({ history });
		const user = userEvent.setup();

		render(<RouterProvider router={router} />);

		await user.click(await screen.findByRole('button', { name: '課綱主題' }));
		const anyAiCheckboxes = await screen.findAllByRole('checkbox', { name: '有導入 AI' });
		await user.click(anyAiCheckboxes.at(-1)!);

		await waitFor(() => {
			expect((router.state.location.search as Record<string, unknown>).q).toEqual({ ai: true });
		});
		expect(screen.getByRole('link', { name: /導入 AI 課程/ })).toBeInTheDocument();
		expect(screen.queryByRole('link', { name: /一般課程/ })).not.toBeInTheDocument();
	});

	it('does not hide courses when an older deployment has no syllabus index', async () => {
		mockGetCourses.mockResolvedValue([
			{
				id: '1',
				courseType: '○',
				name: { zh: '課程一' },
				class: [],
				teacher: [{ name: '教師' }],
			},
			{
				id: '2',
				courseType: '○',
				name: { zh: '課程二' },
				class: [],
				teacher: [{ name: '教師' }],
			},
		]);
		const history = createMemoryHistory({
			initialEntries: ['/advanced-search?year=115&sem=1&d=main&q=%7B%22ai%22%3Atrue%7D'],
		});
		const router = createAppRouter({ history });

		render(<RouterProvider router={router} />);

		expect(await screen.findByRole('link', { name: /課程一/ })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /課程二/ })).toBeInTheDocument();
		expect(screen.getByRole('alert')).toHaveTextContent('沒有課綱索引資料');
	});

	it('treats an available but empty syllabus index as a real zero-match result', async () => {
		mockGetCourses.mockResolvedValue([
			{
				id: '1',
				courseType: '○',
				name: { zh: '沒有 AI 標記的課程' },
				class: [],
				teacher: [{ name: '教師' }],
			},
		]);
		mockFetchSyllabusIndex.mockResolvedValue({});
		const history = createMemoryHistory({
			initialEntries: ['/advanced-search?year=115&sem=1&d=main&q=%7B%22ai%22%3Atrue%7D'],
		});
		const router = createAppRouter({ history });

		render(<RouterProvider router={router} />);

		expect(await screen.findByText('查無資料')).toBeInTheDocument();
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
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
});
