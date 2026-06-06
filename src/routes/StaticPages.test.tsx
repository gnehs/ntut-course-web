import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StatusPage } from './StaticPages';

describe('StatusPage', () => {
	beforeEach(() => {
		vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-06-03T12:00:00.000Z').getTime());
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('renders GitHub Actions runs with relative time', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: vi.fn().mockResolvedValue({
					workflow_runs: [
						{
							id: 1,
							name: 'fetch current courses',
							status: 'completed',
							event: 'schedule',
							created_at: '2026-06-03T11:55:00.000Z',
							html_url: 'https://github.com/gnehs/ntut-course-crawler-node/actions/runs/1',
						},
						{
							id: 2,
							name: 'fetch current mprograms',
							status: 'completed',
							event: 'schedule',
							created_at: '2026-06-03T11:50:00.000Z',
							html_url: 'https://github.com/gnehs/ntut-course-crawler-node/actions/runs/2',
						},
					],
				}),
			}),
		);

		render(<StatusPage />);

		expect(await screen.findByText('取得本學期課程')).toBeInTheDocument();
		expect(screen.getByText('取得本學期微學程')).toBeInTheDocument();
		expect(screen.getByText('5 分鐘', { exact: false })).toBeInTheDocument();
	});

	it('shows an error message when the status API fails', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: false,
				status: 403,
				statusText: 'rate limit exceeded',
			}),
		);

		render(<StatusPage />);

		expect(await screen.findByText('無法取得擷取狀態，請稍後再試。')).toBeInTheDocument();
	});
});
