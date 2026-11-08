import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AddCalendarPage } from './AddCalendarPage';

const mocks = vi.hoisted(() => ({ getCourses: vi.fn() }));

vi.mock('../lib/courseApi', () => ({
	fetchCalendar: vi.fn().mockResolvedValue([]),
	fetchHolidays: vi.fn().mockResolvedValue([]),
}));
vi.mock('../state/AppContext', () => ({
	useApp: () => ({
		dataset: { year: '115', sem: '1', department: 'main' },
		getCourses: mocks.getCourses,
		getMyCourseIds: () => ['C1'],
	}),
}));
vi.mock('@tanstack/react-router', () => ({
	Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
		<a href={to}>{children}</a>
	),
}));

describe('AddCalendarPage loading', () => {
	it('reports a failed course load instead of asking the user to add courses', async () => {
		mocks.getCourses.mockRejectedValue(new Error('503 Service Unavailable'));
		render(<AddCalendarPage />);

		expect(await screen.findByText('課程資料載入失敗')).toBeInTheDocument();
		expect(screen.getByText('503 Service Unavailable')).toBeInTheDocument();
		expect(screen.queryByText('先新增課程')).not.toBeInTheDocument();
	});
});
