import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MyCoursePage } from './MyCoursePage';

const mocks = vi.hoisted(() => ({
	dataset: { year: '115', sem: '1', department: 'main' },
	getCourses: vi.fn(),
	getMyCourseIds: vi.fn(),
	myCourseKey: vi.fn(() => 'my-couse-data-115-1'),
	myCourseClassKey: vi.fn(() => 'my-couse-class-115-1'),
	toastSuccess: vi.fn(),
	toastError: vi.fn(),
}));

vi.mock('../state/AppContext', () => ({
	useApp: () => ({
		dataset: mocks.dataset,
		getCourses: mocks.getCourses,
		getMyCourseIds: mocks.getMyCourseIds,
		myCourseKey: mocks.myCourseKey,
		myCourseClassKey: mocks.myCourseClassKey,
	}),
}));

vi.mock('../components/CourseList', () => ({
	CourseList: ({ courses }: { courses: { id: string }[] }) => (
		<div data-testid='course-list'>{courses.map((course) => course.id).join(',')}</div>
	),
}));

vi.mock('../components/AdsByGoogle', () => ({ AdsByGoogle: () => <div /> }));

vi.mock('../components/ui-kit/PageSkeletons', () => ({
	ClassDetailSkeleton: () => <div>載入中</div>,
}));

vi.mock('@tanstack/react-router', () => ({
	Link: ({ to, children, ...props }: { to: string; children: React.ReactNode }) => (
		<a href={to} {...props}>
			{children}
		</a>
	),
}));

vi.mock('sonner', () => ({
	toast: {
		success: mocks.toastSuccess,
		error: mocks.toastError,
	},
}));

describe('MyCoursePage loading states', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.dataset.year = '115';
		mocks.dataset.sem = '1';
		mocks.dataset.department = 'main';
		mocks.getMyCourseIds.mockReturnValue([]);
		mocks.getCourses.mockResolvedValue([]);
		localStorage.clear();
	});

	it('shows a retryable error instead of the empty state when courses fail to load', async () => {
		mocks.getCourses.mockRejectedValueOnce(new Error('資料服務暫時無法回應'));
		const user = userEvent.setup();

		render(<MyCoursePage />);

		expect(await screen.findByText('我的課程資料載入失敗')).toBeInTheDocument();
		expect(screen.queryByText('尚未儲存任何課程')).not.toBeInTheDocument();

		mocks.getCourses.mockResolvedValueOnce([]);
		await user.click(screen.getByRole('button', { name: '重新載入' }));

		expect(await screen.findByText('尚未儲存任何課程')).toBeInTheDocument();
	});

	it('ignores a late response from the previous dataset', async () => {
		let resolveOld: (courses: { id: string }[]) => void = () => undefined;
		const oldResponse = new Promise<{ id: string }[]>((resolve) => {
			resolveOld = resolve;
		});
		mocks.getMyCourseIds.mockImplementation(() =>
			mocks.dataset.year === '115' ? ['OLD-COURSE'] : ['NEW-COURSE'],
		);
		mocks.getCourses.mockReturnValueOnce(oldResponse).mockResolvedValueOnce([{ id: 'NEW-COURSE' }]);
		const rendered = render(<MyCoursePage />);

		mocks.dataset.year = '114';
		rendered.rerender(<MyCoursePage />);

		expect(await screen.findByTestId('course-list')).toHaveTextContent('NEW-COURSE');
		resolveOld([{ id: 'OLD-COURSE' }]);
		await waitFor(() => expect(screen.getByTestId('course-list')).toHaveTextContent('NEW-COURSE'));
		expect(screen.getByTestId('course-list')).not.toHaveTextContent('OLD-COURSE');
	});
});
