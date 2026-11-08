import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WithdrawalPage } from './WithdrawalPage';

const mocks = vi.hoisted(() => ({ fetchWithdrawal: vi.fn() }));

vi.mock('../lib/courseApi', () => ({ fetchWithdrawal: mocks.fetchWithdrawal }));
vi.mock('../components/AdsByGoogle', () => ({ AdsByGoogle: () => null }));
vi.mock('@tanstack/react-router', () => ({
	Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
		<a href={to}>{children}</a>
	),
}));

beforeEach(() => {
	vi.clearAllMocks();
});

describe('WithdrawalPage', () => {
	it('reports a failed load instead of an empty result and reloads on request', async () => {
		mocks.fetchWithdrawal.mockRejectedValueOnce(new Error('503 Service Unavailable'));
		mocks.fetchWithdrawal.mockResolvedValue({
			data: [{ name: '王老師', withdraw: 1, people: 10, course: [] }],
			stat: [],
		});
		render(<WithdrawalPage />);

		expect(await screen.findByText('退選率資料載入失敗')).toBeInTheDocument();
		expect(screen.getByText('503 Service Unavailable')).toBeInTheDocument();
		expect(screen.queryByText('查無資料')).not.toBeInTheDocument();

		await userEvent.click(screen.getByRole('button', { name: '重新載入' }));
		expect(await screen.findByText('王老師')).toBeInTheDocument();
		expect(screen.queryByText('退選率資料載入失敗')).not.toBeInTheDocument();
	});
});
