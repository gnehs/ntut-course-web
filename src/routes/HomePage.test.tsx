import { render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HomePage } from './HomePage';

const fixtures = vi.hoisted(() => ({
	dataset: { year: '112', sem: '1', department: 'main' },
	setDatasetDialogOpen: vi.fn(),
	getCourses: vi.fn().mockResolvedValue([]),
	getMyCourseIds: vi.fn((): string[] => []),
}));

vi.mock('../state/AppContext', () => ({
	useApp: () => fixtures,
}));

vi.mock('../lib/courseApi', () => ({
	fetchCalendar: vi.fn().mockResolvedValue([]),
}));

vi.mock('../components/AdsByGoogle', () => ({
	AdsByGoogle: ({ placement }: { placement?: string }) => (
		<div data-testid={`ad-${placement || 'inline'}`} />
	),
}));

vi.mock('@tanstack/react-router', () => ({
	Link: ({ to, children, ...props }) => (
		<a href={to} {...props}>
			{children}
		</a>
	),
	useNavigate: () => vi.fn(),
}));

describe('HomePage', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	beforeEach(() => {
		vi.clearAllMocks();
		fixtures.dataset = { year: '112', sem: '1', department: 'main' };
		fixtures.getCourses.mockResolvedValue([]);
		fixtures.getMyCourseIds.mockReturnValue([]);
	});

	it('prioritizes the three ways to start planning the semester', () => {
		render(<HomePage />);

		expect(screen.getByRole('heading', { level: 1, name: '112 年上學期' })).toBeInTheDocument();
		expect(screen.getByText('日間部')).toBeInTheDocument();

		const startSection = screen.getByRole('region', { name: '常用功能' });
		expect(startSection).not.toBeNull();
		expect(within(startSection!).getByRole('link', { name: /搜尋課程/ })).toHaveAttribute(
			'href',
			'/advanced-search?year=112&sem=1&d=main',
		);
		expect(within(startSection!).getByRole('link', { name: /我的課程/ })).toHaveAttribute(
			'href',
			'/my-course',
		);
		expect(within(startSection!).getByRole('link', { name: /班級課表/ })).toHaveAttribute(
			'href',
			'/class',
		);
	});

	it('groups planning, campus tools, and site links by purpose', () => {
		render(<HomePage />);

		const planning = screen.getByRole('heading', { name: '探索與規劃' }).closest('section');
		const tools = screen.getByRole('heading', { name: '課表與校園工具' }).closest('section');
		const siteLinks = screen.getByRole('navigation', { name: '網站與資料連結' });

		expect(within(planning!).getByRole('link', { name: /課程標準/ })).toHaveAttribute(
			'href',
			'/standard',
		);
		expect(within(planning!).getByRole('link', { name: /退選率/ })).toHaveAttribute(
			'href',
			'/withdrawal',
		);
		expect(within(tools!).getByRole('link', { name: /匯入行事曆/ })).toHaveAttribute(
			'href',
			'/add-calendar?year=112',
		);
		expect(within(siteLinks).getByRole('link', { name: /設定/ })).toHaveAttribute(
			'href',
			'/settings',
		);
		expect(within(siteLinks).getByRole('link', { name: /隱私權政策/ })).toHaveAttribute(
			'href',
			'/privacy',
		);
		expect(within(siteLinks).getAllByRole('link')).toHaveLength(6);
		expect(within(siteLinks).queryByRole('button')).not.toBeInTheDocument();
		for (const link of within(siteLinks).getAllByRole('link')) {
			expect(link).not.toHaveAttribute('type');
			expect(link).toHaveClass('rounded-surface', 'min-h-11');
		}
	});

	it('does not show the ad between the primary actions and planning links', () => {
		render(<HomePage />);

		expect(screen.queryByTestId('ad-section')).not.toBeInTheDocument();
		expect(screen.getByTestId('ad-footer')).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: '探索與規劃' })).toBeInTheDocument();
	});

	it('falls back to valid routes while the semester is loading', () => {
		fixtures.dataset = { year: '', sem: '', department: 'main' };
		render(<HomePage />);

		expect(screen.getByRole('heading', { level: 1, name: /正在載入學期/ })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /搜尋課程/ })).toHaveAttribute(
			'href',
			'/advanced-search',
		);
		expect(screen.getByRole('link', { name: /匯入行事曆/ })).toHaveAttribute(
			'href',
			'/add-calendar',
		);
		expect(screen.getByRole('link', { name: /iOS 小工具/ })).toHaveAttribute('href', '/widget');
	});

	it('orders today courses by their first class period', async () => {
		vi.spyOn(Date.prototype, 'getDay').mockReturnValue(1);
		fixtures.getMyCourseIds.mockReturnValue(['late', 'early']);
		fixtures.getCourses.mockResolvedValue([
			{ id: 'late', name: { zh: '下午課' }, teacher: [], time: { mon: ['5'] } },
			{ id: 'early', name: { zh: '早上課' }, teacher: [], time: { mon: ['1'] } },
		] as never);

		render(<HomePage />);
		const section = (await screen.findByRole('heading', { name: '今天的課程' })).closest('section');
		const courseLinks = within(section!).getAllByRole('link');

		expect(courseLinks.map((link) => link.textContent)).toEqual([
			expect.stringContaining('早上課'),
			expect.stringContaining('下午課'),
		]);
	});
});
