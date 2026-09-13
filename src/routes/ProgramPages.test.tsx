import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProgramDetailPage, ProgramIndexPage, safeProgramHref } from './ProgramPages';

const mocks = vi.hoisted(() => ({
	fetchPrograms: vi.fn(),
	fetchCourse: vi.fn(),
	addCourse: vi.fn(),
	removeCourse: vi.fn(),
	getMyCourseIds: vi.fn(() => []),
	params: { year: '115', sem: '1', id: 'P-001' },
}));

vi.mock('../lib/courseApi', () => ({
	fetchPrograms: mocks.fetchPrograms,
	fetchCourse: mocks.fetchCourse,
}));

vi.mock('../state/AppContext', () => ({
	useApp: () => ({
		dataset: { year: '115', sem: '1', department: 'main' },
		addCourse: mocks.addCourse,
		removeCourse: mocks.removeCourse,
		getMyCourseIds: mocks.getMyCourseIds,
	}),
}));

vi.mock('../components/CourseList', () => ({
	CourseList: ({
		courses,
		department,
		savedVersion,
		onSavedChange,
	}: {
		courses: { id: string }[];
		department?: string;
		savedVersion?: number;
		onSavedChange?: () => void;
	}) => (
		<div data-testid={`course-list-${department}`}>
			<div data-testid={`saved-version-${department}`}>{savedVersion}</div>
			{courses.map((course) => (
				<span key={course.id}>
					{course.id}
					<button type='button' onClick={onSavedChange}>
						模擬單筆 {course.id}
					</button>
				</span>
			))}
		</div>
	),
}));

vi.mock('@tanstack/react-router', () => ({
	Link: ({ to, children, ...props }: { to: string; children: React.ReactNode }) => (
		<a href={to} {...props}>
			{children}
		</a>
	),
	useParams: () => mocks.params,
}));

const program = {
	id: 'P-001',
	name: '人工智慧學程',
	href: 'SearchProgram.jsp?format=-2&code=P-001',
	courses: ['C-MAIN', 'C-EVENING', 'C-GRAD'],
	description: '跨領域學習人工智慧。',
};

function course(id: string) {
	return {
		id,
		code: id,
		courseType: '★',
		name: { zh: `課程 ${id}` },
		credit: '3',
		hours: '3',
		description: { zh: '', en: '' },
		notes: '',
		stage: '',
		time: {},
		teacher: [],
		class: [],
		classroom: [],
		people: '',
		peopleWithdraw: '',
		ta: [],
		language: '',
		courseDescriptionLink: '',
		syllabusLinks: [],
	};
}

describe('ProgramIndexPage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.params.id = 'P-001';
	});

	it('lists programs for the selected dataset and links to their detail page', async () => {
		mocks.fetchPrograms.mockResolvedValue([program]);

		render(<ProgramIndexPage />);

		expect(await screen.findByRole('heading', { name: '一般學程' })).toBeInTheDocument();
		const link = screen.getByRole('link', { name: /人工智慧學程/ });
		expect(link).toHaveAttribute('href', '/program/115/1/P-001');
		expect(screen.getByText('3 門課程')).toBeInTheDocument();
		expect(mocks.fetchPrograms).toHaveBeenCalledWith('115', '1');
	});

	it('distinguishes a not-yet-published 404 from an empty program list', async () => {
		mocks.fetchPrograms.mockResolvedValue(null);
		render(<ProgramIndexPage />);
		expect(await screen.findByText('本學期尚未提供一般學程資料')).toBeInTheDocument();

		mocks.fetchPrograms.mockResolvedValue([]);
		render(<ProgramIndexPage />);
		expect(await screen.findByText('本學期目前沒有一般學程資料。')).toBeInTheDocument();
	});

	it('does not show an empty state when loading programs fails', async () => {
		mocks.fetchPrograms.mockRejectedValue(new Error('伺服器暫時無法回應'));
		render(<ProgramIndexPage />);

		expect(await screen.findByText('一般學程資料載入失敗')).toBeInTheDocument();
		expect(screen.queryByText('本學期目前沒有一般學程資料。')).not.toBeInTheDocument();
	});
});

describe('ProgramDetailPage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.params.id = 'P-001';
		mocks.fetchPrograms.mockResolvedValue([program]);
		mocks.fetchCourse.mockImplementation((_year: string, _sem: string, department: string) => {
			if (department === 'main') return Promise.resolve([course('C-MAIN')]);
			if (department === '進修部') return Promise.resolve([course('C-EVENING')]);
			return Promise.resolve([course('C-GRAD')]);
		});
	});

	it('checks all three departments and keeps the source link on a safe protocol', async () => {
		render(<ProgramDetailPage />);

		expect(await screen.findByText('人工智慧學程')).toBeInTheDocument();
		expect(screen.getByTestId('course-list-main')).toHaveTextContent('C-MAIN');
		expect(screen.getByTestId('course-list-進修部')).toHaveTextContent('C-EVENING');
		expect(screen.getByTestId('course-list-研究所(日間部、進修部、週末碩士班)')).toHaveTextContent(
			'C-GRAD',
		);
		expect(mocks.fetchCourse).toHaveBeenCalledWith('115', '1', 'main');
		expect(mocks.fetchCourse).toHaveBeenCalledWith('115', '1', '進修部');
		expect(mocks.fetchCourse).toHaveBeenCalledWith(
			'115',
			'1',
			'研究所(日間部、進修部、週末碩士班)',
		);
		expect(screen.getByRole('link', { name: '學校原始資料' })).toHaveAttribute(
			'href',
			'https://aps.ntut.edu.tw/course/tw/SearchProgram.jsp?format=-2&code=P-001',
		);
	});

	it('saves every matched course under its source semester and department', async () => {
		const user = userEvent.setup();
		render(<ProgramDetailPage />);

		await user.click(await screen.findByRole('button', { name: '全部加入我的課程' }));
		expect(mocks.addCourse).toHaveBeenCalledWith('C-MAIN', '115', '1', 'main');
		expect(mocks.addCourse).toHaveBeenCalledWith('C-EVENING', '115', '1', '進修部');
		expect(mocks.addCourse).toHaveBeenCalledWith(
			'C-GRAD',
			'115',
			'1',
			'研究所(日間部、進修部、週末碩士班)',
		);
	});

	it('keeps the first department copy when a course appears more than once', async () => {
		const user = userEvent.setup();
		mocks.fetchPrograms.mockResolvedValue([
			{ ...program, courses: ['C-SHARED', 'C-EVENING', 'C-GRAD'] },
		]);
		mocks.fetchCourse.mockImplementation((_year: string, _sem: string, department: string) => {
			if (department === 'main') return Promise.resolve([course('C-SHARED')]);
			if (department === '進修部')
				return Promise.resolve([course('C-SHARED'), course('C-EVENING')]);
			return Promise.resolve([course('C-GRAD')]);
		});

		render(<ProgramDetailPage />);

		const eveningList = await screen.findByTestId('course-list-進修部');
		expect(screen.getByTestId('course-list-main')).toHaveTextContent('C-SHARED');
		expect(within(eveningList).queryByText('C-SHARED')).not.toBeInTheDocument();
		expect(eveningList).toHaveTextContent('C-EVENING');

		await user.click(await screen.findByRole('button', { name: '全部加入我的課程' }));
		expect(mocks.addCourse).toHaveBeenCalledWith('C-SHARED', '115', '1', 'main');
		expect(mocks.addCourse).not.toHaveBeenCalledWith('C-SHARED', '115', '1', '進修部');
	});

	it('refreshes grouped course lists after a single course changes', async () => {
		const user = userEvent.setup();
		render(<ProgramDetailPage />);

		expect(await screen.findByTestId('saved-version-main')).toHaveTextContent('0');
		await user.click(await screen.findByRole('button', { name: '模擬單筆 C-MAIN' }));
		expect(screen.getByTestId('saved-version-main')).toHaveTextContent('1');
	});

	it('does not render unsafe source URLs', async () => {
		mocks.fetchPrograms.mockResolvedValue([{ ...program, href: 'javascript:alert(1)' }]);
		render(<ProgramDetailPage />);

		await screen.findByText('人工智慧學程');
		expect(screen.queryByRole('link', { name: '學校原始資料' })).not.toBeInTheDocument();
		expect(safeProgramHref('data:text/html,not-safe')).toBeNull();
		expect(safeProgramHref('SearchProgram.jsp?code=P-001')).toBe(
			'https://aps.ntut.edu.tw/course/tw/SearchProgram.jsp?code=P-001',
		);
	});

	it('reports a missing program instead of showing unrelated courses', async () => {
		mocks.fetchPrograms.mockResolvedValue([]);
		mocks.params.id = 'MISSING';
		render(<ProgramDetailPage />);

		expect(await screen.findByText('找不到代碼為「MISSING」的一般學程。')).toBeInTheDocument();
		expect(screen.queryByTestId('course-list-main')).not.toBeInTheDocument();
	});

	it('keeps available department courses when one department request fails', async () => {
		mocks.fetchCourse.mockImplementation((_year: string, _sem: string, department: string) => {
			if (department === '進修部') return Promise.reject(new Error('暫時無資料'));
			return Promise.resolve([course(department === 'main' ? 'C-MAIN' : 'C-GRAD')]);
		});
		render(<ProgramDetailPage />);

		expect(await screen.findByText('部分學制的課程資料無法載入')).toBeInTheDocument();
		expect(screen.getByTestId('course-list-main')).toHaveTextContent('C-MAIN');
		expect(screen.getByTestId('course-list-研究所(日間部、進修部、週末碩士班)')).toHaveTextContent(
			'C-GRAD',
		);
	});

	it('does not claim no matching courses when every department request fails', async () => {
		mocks.fetchCourse.mockRejectedValue(new Error('課程資料暫時無法取得'));
		render(<ProgramDetailPage />);

		expect(await screen.findByText('部分學制的課程資料無法載入')).toBeInTheDocument();
		expect(screen.getByText('目前無法確認此學程的課程清單')).toBeInTheDocument();
		expect(
			screen.queryByText('此學程在目前三個學制的課程清單中沒有找到對應課程。'),
		).not.toBeInTheDocument();
	});
});
