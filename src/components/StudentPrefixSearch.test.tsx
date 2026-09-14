import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StudentPrefixSearch } from './StudentPrefixSearch';

const mocks = vi.hoisted(() => ({
	fetchStandardDepartments: vi.fn(),
	findStudentPrefixMatches: vi.fn(),
	parseNtutStudentPrefix: vi.fn(),
	onSelect: vi.fn(),
}));

vi.mock('../lib/courseApi', () => ({
	fetchStandardDepartments: mocks.fetchStandardDepartments,
}));

vi.mock('../lib/studentPrefix', () => ({
	findStudentPrefixMatches: mocks.findStudentPrefixMatches,
	parseNtutStudentPrefix: mocks.parseNtutStudentPrefix,
}));

const entries = [
	{ system: '四技', department: '測試系', division: 'AB0', matric: '7' },
	{ system: '碩士', department: '測試所', division: 'AB0', matric: '8' },
];

function parsePrefix(value: string) {
	const match = /^(\d{3})([A-Z0-9]{2})$/.exec(value.trim().toUpperCase());
	return match ? { year: match[1], departmentCode: match[2] } : null;
}

function matchEntries(parsed: { departmentCode: string } | null, items: typeof entries) {
	return parsed
		? items.filter((entry) => entry.division.slice(0, 2) === parsed.departmentCode)
		: [];
}

beforeEach(() => {
	vi.clearAllMocks();
	mocks.parseNtutStudentPrefix.mockImplementation(parsePrefix);
	mocks.findStudentPrefixMatches.mockImplementation(matchEntries);
	mocks.fetchStandardDepartments.mockResolvedValue(entries);
});

describe('StudentPrefixSearch', () => {
	it('shows every study-system candidate and selects the active result with the keyboard', async () => {
		const user = userEvent.setup();
		render(<StudentPrefixSearch years={['109']} onSelect={mocks.onSelect} />);

		const input = screen.getByRole('combobox', { name: '依學號前綴尋找課程標準' });
		await user.type(input, '109ab');

		await waitFor(() => expect(mocks.fetchStandardDepartments).toHaveBeenCalledWith('109'));
		expect(await screen.findByRole('option', { name: /109 · 四技.*測試系/ })).toBeInTheDocument();
		expect(screen.getByRole('option', { name: /109 · 碩士.*測試所/ })).toBeInTheDocument();

		await user.keyboard('{ArrowDown}{Enter}');
		expect(mocks.onSelect).toHaveBeenCalledWith({
			year: '109',
			system: '四技',
			department: '測試系',
		});
	});

	it('does not fetch until the prefix format is complete', async () => {
		const user = userEvent.setup();
		render(<StudentPrefixSearch years={['109']} onSelect={mocks.onSelect} />);

		await user.type(screen.getByRole('combobox'), '109');
		expect(await screen.findByText('格式：入學年度加兩碼系所代碼，例如 109ab')).toBeInTheDocument();
		expect(mocks.fetchStandardDepartments).not.toHaveBeenCalled();
	});

	it('ignores a slower response from the previous year', async () => {
		const user = userEvent.setup();
		const pending = new Map<string, { resolve: (value: typeof entries) => void }>();
		mocks.fetchStandardDepartments.mockImplementation(
			(year: string) =>
				new Promise((resolve) => {
					pending.set(year, { resolve });
				}),
		);
		render(<StudentPrefixSearch years={['109', '110']} onSelect={mocks.onSelect} />);
		const input = screen.getByRole('combobox');

		await user.type(input, '109ab');
		await waitFor(() => expect(pending.has('109')).toBe(true));
		await user.clear(input);
		await user.type(input, '110ab');
		await waitFor(() => expect(pending.has('110')).toBe(true));

		pending.get('109')?.resolve([{ ...entries[0], department: '舊年度系' }]);
		await waitFor(() => expect(screen.queryByText('舊年度系')).not.toBeInTheDocument());
		pending.get('110')?.resolve([{ ...entries[0], department: '新年度系' }]);
		await expect(screen.findByRole('option', { name: /新年度系/ })).resolves.toBeInTheDocument();
	});

	it('offers retry after an index error and recovers without sending the prefix', async () => {
		const user = userEvent.setup();
		mocks.fetchStandardDepartments
			.mockRejectedValueOnce(new Error('temporary failure'))
			.mockResolvedValueOnce(entries);
		render(<StudentPrefixSearch years={['109']} onSelect={mocks.onSelect} />);
		const input = screen.getByRole('combobox');
		await user.type(input, '109ab');

		await screen.findByText('系所資料載入失敗，請再試一次。');
		await user.click(screen.getByRole('button', { name: '重試' }));
		await screen.findByRole('option', { name: /109 · 四技.*測試系/ });

		expect(mocks.fetchStandardDepartments).toHaveBeenNthCalledWith(1, '109');
		expect(mocks.fetchStandardDepartments).toHaveBeenNthCalledWith(2, '109');
	});
});
