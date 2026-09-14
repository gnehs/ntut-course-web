import userEvent from '@testing-library/user-event';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { StandardPage } from './StandardPage';

const mocks = vi.hoisted(() => ({
	fetchStandards: vi.fn(),
	fetchStandardYear: vi.fn(),
	navigate: vi.fn(),
}));
vi.mock('../lib/courseApi', () => ({
	fetchStandards: mocks.fetchStandards,
	fetchStandardYear: mocks.fetchStandardYear,
}));
vi.mock('@tanstack/react-router', () => ({
	useNavigate: () => mocks.navigate,
	useRouterState: () => ({ location: { pathname: '/standard', search: {} } }),
}));
vi.mock('../components/StudentPrefixSearch', () => ({
	StudentPrefixSearch: ({ onSelect }) => (
		<>
			<button onClick={() => onSelect({ year: '109', system: '四技', department: '測試系' })}>
				選擇 109 候選
			</button>
			<button onClick={() => onSelect({ year: '115', system: '碩士班', department: '測試所' })}>
				選擇 115 候選
			</button>
		</>
	),
}));

beforeEach(() => {
	vi.clearAllMocks();
	localStorage.clear();
	mocks.fetchStandards.mockResolvedValue(['115', '109']);
});

it('applies all three candidate fields and only saves the selected course query', async () => {
	mocks.fetchStandardYear.mockResolvedValue({
		四技: { 測試系: { courses: [{ type: '★', name: '測試課程', credit: 3 }] } },
	});
	render(<StandardPage />);
	fireEvent.click(await screen.findByText('選擇 109 候選'));
	expect(await screen.findByText('測試課程')).toBeInTheDocument();
	expect(mocks.navigate).toHaveBeenCalledWith({
		to: '/standard',
		search: { year: '109', system: '四技', department: '測試系' },
	});
	expect(JSON.parse(localStorage.getItem('data-standard-query')!)).toEqual({
		year: '109',
		system: '四技',
		department: '測試系',
	});
});

it('does not let a slower previous year replace the selected year data', async () => {
	let finishOld!: (data: unknown) => void;
	mocks.fetchStandardYear.mockImplementation((year) =>
		year === '109'
			? new Promise((resolve) => {
					finishOld = resolve;
				})
			: Promise.resolve({
					碩士班: { 測試所: { courses: [{ type: '★', name: '新年度課程', credit: 3 }] } },
				}),
	);
	render(<StandardPage />);
	fireEvent.click(await screen.findByText('選擇 109 候選'));
	fireEvent.click(screen.getByText('選擇 115 候選'));
	expect(await screen.findByText('新年度課程')).toBeInTheDocument();
	await act(async () => finishOld({ 四技: { 測試系: { courses: [] } } }));
	expect(screen.getByText('新年度課程')).toBeInTheDocument();
});

it('shows one query method at a time and preserves the selected result when switching', async () => {
	mocks.fetchStandardYear.mockResolvedValue({
		四技: { 測試系: { courses: [{ type: '★', name: '測試課程', credit: 3 }] } },
	});
	render(<StandardPage />);
	fireEvent.click(await screen.findByText('選擇 109 候選'));
	await screen.findByText('測試課程');
	expect(screen.queryByRole('combobox', { name: '入學年度' })).not.toBeInTheDocument();
	const user = userEvent.setup();
	const manualTab = screen.getByRole('tab', { name: '條件選擇' });
	const searchTab = screen.getByRole('tab', { name: '快速搜尋' });
	await user.click(manualTab);
	expect(manualTab).toHaveAttribute('aria-selected', 'true');
	expect(searchTab).toHaveAttribute('aria-selected', 'false');
	expect(screen.queryByText('選擇 109 候選')).not.toBeInTheDocument();
	expect(screen.getByRole('combobox', { name: '入學年度' })).toHaveTextContent('109 年');
	expect(screen.getByRole('combobox', { name: '學制' })).toHaveTextContent('四技');
	expect(screen.getByRole('combobox', { name: '系所' })).toHaveTextContent('測試系');
	await user.keyboard('{ArrowLeft}');
	expect(searchTab).toHaveFocus();
	expect(searchTab).toHaveAttribute('aria-selected', 'true');
	expect(manualTab).toHaveAttribute('aria-selected', 'false');
	expect(screen.getByText('選擇 109 候選')).toBeInTheDocument();
	expect(screen.getByText('測試課程')).toBeInTheDocument();
	expect(screen.getByText('109 年入學 · 四技 · 測試系')).toBeInTheDocument();
});
