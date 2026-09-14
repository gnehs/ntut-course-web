import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CalendarPage } from './CalendarPage';

const fetchCalendar = vi.hoisted(() => vi.fn());

vi.mock('../lib/courseApi', () => ({ fetchCalendar }));

describe('CalendarPage loading and empty states', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('shows a retryable error instead of an empty calendar when loading fails', async () => {
		fetchCalendar.mockRejectedValueOnce(new Error('行事曆服務暫時無法回應'));
		const user = userEvent.setup();

		render(<CalendarPage />);

		expect(await screen.findByText('行事曆資料載入失敗')).toBeInTheDocument();
		expect(screen.queryByText('目前沒有行事曆資料')).not.toBeInTheDocument();

		fetchCalendar.mockResolvedValueOnce([]);
		await user.click(screen.getByRole('button', { name: '重新載入' }));

		expect(await screen.findByText('目前沒有行事曆資料')).toBeInTheDocument();
	});

	it('explains when the important filter has no matching events and lets users clear it', async () => {
		const start = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
		fetchCalendar.mockResolvedValueOnce([
			{ type: 'event', uid: 'ordinary', summary: '一般課程日', start, end: start },
		]);
		const user = userEvent.setup();

		render(<CalendarPage />);

		expect(await screen.findByText('一般課程日')).toBeInTheDocument();
		await user.click(screen.getByRole('button', { name: '僅顯示重要日程' }));

		expect(await screen.findByText('目前沒有符合的重要日程')).toBeInTheDocument();
		await user.click(screen.getByRole('button', { name: '顯示全部日程' }));
		expect(await screen.findByText('一般課程日')).toBeInTheDocument();
	});
});
