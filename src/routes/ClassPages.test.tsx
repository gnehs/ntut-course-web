import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClassDetailPage } from './ClassPages';

const mocks = vi.hoisted(() => ({
	dataset: { year: '115', sem: '1', department: 'main' },
	locationSearch: {} as Record<string, string>,
	fetchCourse: vi.fn(),
	fetchDepartment: vi.fn(),
	addCourse: vi.fn(),
	removeCourse: vi.fn(),
	toast: { success: vi.fn() },
}));

vi.mock('../lib/courseApi', () => ({
	fetchCourse: mocks.fetchCourse,
	fetchDepartment: mocks.fetchDepartment,
}));

vi.mock('../state/AppContext', () => ({
	useApp: () => ({
		dataset: mocks.dataset,
		addCourse: mocks.addCourse,
		removeCourse: mocks.removeCourse,
		myCourseClassKey: (year = '115', sem = '1') => `my-couse-class-${year}-${sem}`,
	}),
}));

vi.mock('@tanstack/react-router', () => ({
	useParams: () => ({ year: '115', sem: '1', id: '資工一' }),
	useRouterState: () => ({ location: { search: mocks.locationSearch } }),
}));

vi.mock('../components/CourseList', () => ({
	CourseList: ({ department }: { department?: string }) => (
		<div data-testid='course-list' data-department={department} />
	),
}));

vi.mock('../components/AdsByGoogle', () => ({ AdsByGoogle: () => null }));
vi.mock('../lib/pageTitle', () => ({ usePageTitle: vi.fn() }));
vi.mock('sonner', () => ({ toast: mocks.toast }));

beforeEach(() => {
	vi.clearAllMocks();
	localStorage.clear();
	mocks.dataset = { year: '115', sem: '1', department: 'main' };
	mocks.locationSearch = {};
	mocks.fetchDepartment.mockResolvedValue([
		{
			category: '系所',
			name: '資訊工程系',
			href: '',
			class: [{ id: 'class-1', name: '資工一' }],
		},
	]);
	mocks.fetchCourse.mockResolvedValue([
		{
			id: 'course-1',
			class: [{ name: '資工一' }],
			name: { zh: '測試課程' },
		},
	]);
	vi.stubGlobal(
		'confirm',
		vi.fn(() => true),
	);
});

async function renderPage() {
	render(<ClassDetailPage />);
	await screen.findByRole('heading', { name: '資工一' });
	await waitFor(() => expect(mocks.fetchCourse).toHaveBeenCalled());
}

describe('ClassDetailPage department query', () => {
	it('uses the URL department for a cold visitor and keeps class actions on that department', async () => {
		mocks.locationSearch = { d: '進修部' };

		await renderPage();

		expect(mocks.fetchCourse).toHaveBeenCalledWith('115', '1', '進修部');
		expect(screen.getByTestId('course-list')).toHaveAttribute('data-department', '進修部');

		await userEvent.click(screen.getByRole('button', { name: '加入到我的課程' }));
		expect(mocks.addCourse).toHaveBeenCalledWith('course-1', '115', '1', '進修部');
	});

	it('lets a URL department override a saved other-department dataset and normalizes 日間部', async () => {
		mocks.dataset = { year: '115', sem: '1', department: '進修部' };
		localStorage.setItem('data-department', '進修部');
		localStorage.setItem('my-couse-class-115-1', '資工一');
		mocks.locationSearch = { d: '日間部' };

		await renderPage();

		expect(mocks.fetchCourse).toHaveBeenCalledWith('115', '1', 'main');
		expect(screen.getByTestId('course-list')).toHaveAttribute('data-department', 'main');

		await userEvent.click(screen.getByRole('button', { name: '從我的課程中移除' }));
		expect(mocks.removeCourse).toHaveBeenCalledWith('course-1', '115', '1', 'main');
	});

	it('falls back to the saved dataset for an invalid department query', async () => {
		mocks.dataset = { year: '115', sem: '1', department: '進修部' };
		mocks.locationSearch = { d: 'unknown' };

		await renderPage();

		expect(mocks.fetchCourse).toHaveBeenCalledWith('115', '1', '進修部');
	});

	it('uses the saved dataset when the department query is omitted', async () => {
		mocks.dataset = { year: '115', sem: '1', department: '進修部' };

		await renderPage();

		expect(mocks.fetchCourse).toHaveBeenCalledWith('115', '1', '進修部');
	});

	it('reloads the class courses when the department query changes in place', async () => {
		mocks.dataset = { year: '115', sem: '1', department: '進修部' };
		mocks.locationSearch = { d: '進修部' };
		const view = render(<ClassDetailPage />);
		await waitFor(() => expect(mocks.fetchCourse).toHaveBeenCalledWith('115', '1', '進修部'));

		mocks.fetchCourse.mockClear();
		mocks.locationSearch = { d: '日間部' };
		view.rerender(<ClassDetailPage />);

		await waitFor(() => expect(mocks.fetchCourse).toHaveBeenCalledWith('115', '1', 'main'));
	});
});
