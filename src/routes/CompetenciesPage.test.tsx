import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { advancedSearchCourseHref, CompetenciesPage, safeCompetencyHref } from './CompetenciesPage';

const mockFetchCompetencies = vi.hoisted(() => vi.fn());

vi.mock('../lib/courseApi', () => ({
	fetchCompetencies: mockFetchCompetencies,
}));

vi.mock('../components/ui-kit/Select', () => ({
	Select: ({
		value,
		onChange,
		children,
		...props
	}: {
		value: string;
		onChange: (value: string) => void;
		children: React.ReactNode;
	}) => (
		<select value={value} onChange={(event) => onChange(event.target.value)} {...props}>
			{children}
		</select>
	),
	SelectOption: ({ value, children }: { value: string; children: React.ReactNode }) => (
		<option value={value}>{children}</option>
	),
}));

vi.mock('@tanstack/react-router', () => ({
	Link: ({ to, children, ...props }: { to: string; children: React.ReactNode }) => (
		<a href={to} {...props}>
			{children}
		</a>
	),
}));

const data = [
	{
		id: 'cs',
		name: '資訊工程系',
		href: 'SearchCompetency.jsp?code=cs',
		abilities: [
			{ id: 'A1', name: '程式設計能力' },
			{ id: 'A2', name: '團隊合作能力' },
		],
		courses: [
			{ code: 'CS101', name: '資料結構', abilityIds: ['A1'] },
			{ code: 'CS102', name: '專案管理', abilityIds: ['A2'] },
		],
	},
	{
		id: 'ee',
		name: '電機工程系',
		href: 'SearchCompetency.jsp?code=ee',
		abilities: [{ id: 'E1', name: '電路分析能力' }],
		courses: [{ code: 'EE101', name: '電路學', abilityIds: ['E1'] }],
	},
];

describe('CompetenciesPage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockFetchCompetencies.mockResolvedValue(data);
	});

	it('shows the department mapping and links each course to advanced search', async () => {
		render(<CompetenciesPage />);

		expect((await screen.findAllByText('資訊工程系')).length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText('程式設計能力').length).toBeGreaterThanOrEqual(1);
		expect(screen.getByText('資料結構')).toBeInTheDocument();
		expect(screen.getAllByText('團隊合作能力').length).toBeGreaterThanOrEqual(1);

		const courseLink = screen.getByRole('link', { name: 'CS101' });
		expect(courseLink).toHaveAttribute('href', advancedSearchCourseHref('資料結構'));
		const query = new URL(courseLink.getAttribute('href')!, 'https://example.test').searchParams;
		expect(JSON.parse(query.get('q') || '{}')).toEqual({ k: '資料結構' });
		expect(screen.getByRole('link', { name: /學校原始資料/ })).toHaveAttribute(
			'href',
			'https://aps.ntut.edu.tw/course/tw/SearchCompetency.jsp?code=cs',
		);
	});

	it('filters courses by a course or ability keyword', async () => {
		const user = userEvent.setup();
		render(<CompetenciesPage />);

		const input = await screen.findByLabelText('搜尋能力或課程');
		await user.type(input, '團隊');
		expect(screen.getByText('專案管理')).toBeInTheDocument();
		expect(screen.queryByText('資料結構')).not.toBeInTheDocument();
		expect(screen.getAllByText('團隊合作能力').length).toBeGreaterThanOrEqual(1);
	});

	it('switches departments with the picker', async () => {
		const user = userEvent.setup();
		render(<CompetenciesPage />);

		const select = await screen.findByRole('combobox', { name: '選擇系所' });
		await user.selectOptions(select, 'ee');
		expect(await screen.findByText('電路學')).toBeInTheDocument();
		expect(screen.queryByText('資料結構')).not.toBeInTheDocument();
	});

	it('distinguishes unavailable data from an empty but available response', async () => {
		mockFetchCompetencies.mockResolvedValue(null);
		render(<CompetenciesPage />);
		expect(await screen.findByText('目前尚未提供核心能力資料')).toBeInTheDocument();

		mockFetchCompetencies.mockResolvedValue([]);
		render(<CompetenciesPage />);
		expect(await screen.findByText('目前沒有核心能力資料。')).toBeInTheDocument();
	});

	it('does not show an empty state when loading competencies fails', async () => {
		mockFetchCompetencies.mockRejectedValue(new Error('伺服器暫時無法回應'));
		render(<CompetenciesPage />);

		expect(await screen.findByText('核心能力資料載入失敗')).toBeInTheDocument();
		expect(screen.queryByText('目前沒有核心能力資料。')).not.toBeInTheDocument();
	});

	it('rejects executable source links', () => {
		expect(safeCompetencyHref('javascript:alert(1)')).toBeNull();
		expect(safeCompetencyHref('data:text/html,unsafe')).toBeNull();
		expect(safeCompetencyHref('SearchCompetency.jsp?code=cs')).toBe(
			'https://aps.ntut.edu.tw/course/tw/SearchCompetency.jsp?code=cs',
		);
	});
});
