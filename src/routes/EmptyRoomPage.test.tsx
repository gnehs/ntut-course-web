import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Course, NamedCourseItem } from '../types/course';
import { EmptyRoomPage, resolveRoomSourceUrl } from './EmptyRoomPage';

const mocks = vi.hoisted(() => ({
	dataset: { year: '115', sem: '1', department: 'main' },
	getCourses: vi.fn(),
}));

vi.mock('../state/AppContext', () => ({
	useApp: () => ({
		dataset: mocks.dataset,
		getCourses: mocks.getCourses,
	}),
}));

vi.mock('@tanstack/react-router', () => ({
	Link: ({ to, children, ...props }) => (
		<a href={to} {...props}>
			{children}
		</a>
	),
}));

beforeEach(() => {
	vi.clearAllMocks();
	mocks.dataset = { year: '115', sem: '1', department: 'main' };
	mocks.getCourses.mockResolvedValue([]);
});

describe('EmptyRoomPage room details', () => {
	it('lists each distinct course in an occupied slot and links to the current semester', async () => {
		const repeated = course('COURSE-001', '資料結構', { mon: ['1'] });
		const second = course('COURSE-002', '作業系統', { mon: ['1'] });
		const later = course('COURSE-003', '網路概論', { mon: ['2'] });
		const duplicateWithOtherRoom = course('COURSE-001', '資料結構', { mon: ['1'] }, 'B202');
		mocks.getCourses.mockImplementation(({ department }) =>
			Promise.resolve(
				department === '研究所(日間部、進修部、週末碩士班)'
					? [later]
					: department === '進修部'
						? [repeated, second]
						: [duplicateWithOtherRoom],
			),
		);

		await renderPage();
		expect(mocks.getCourses).toHaveBeenCalledWith({
			year: '115',
			sem: '1',
			department: '研究所(日間部、進修部、週末碩士班)',
		});
		expect(mocks.getCourses).toHaveBeenCalledWith({
			year: '115',
			sem: '1',
			department: '進修部',
		});
		expect(mocks.getCourses).toHaveBeenCalledWith({
			year: '115',
			sem: '1',
			department: 'main',
		});
		const user = userEvent.setup();
		const mondayButton = screen.getByRole('button', { name: '週一' });
		await user.click(mondayButton);
		expect(mondayButton).toHaveAttribute('aria-pressed', 'true');
		expect(screen.getByRole('group', { name: '節次狀態圖例' })).toHaveTextContent('空堂');
		expect(screen.getByRole('group', { name: '節次狀態圖例' })).toHaveTextContent('有課程');

		const roomCard = screen.getByRole('button', { name: '查看「A101」詳細上課資訊' });
		const statusId = roomCard.getAttribute('aria-describedby');
		expect(statusId && document.getElementById(statusId)).toHaveTextContent('1 有課程');
		expect(
			screen.queryByRole('button', { name: '查看「B202」詳細上課資訊' }),
		).not.toBeInTheDocument();
		expect(roomCard).toHaveAttribute('tabindex', '0');
		roomCard.focus();
		await user.keyboard('{Enter}');

		const dialog = await screen.findByRole('dialog', {
			name: '「A101」詳細上課資訊',
		});
		const firstSlot = slotRow(dialog, '1 - 8:10');
		expect(within(firstSlot).getByRole('link', { name: '資料結構' })).toHaveAttribute(
			'href',
			'/course/115/1/COURSE-001',
		);
		expect(within(firstSlot).getByRole('link', { name: '作業系統' })).toHaveAttribute(
			'href',
			'/course/115/1/COURSE-002',
		);
		expect(screen.getAllByRole('link', { name: '資料結構' })).toHaveLength(1);
		expect(
			within(slotRow(dialog, '2 - 9:10')).getByRole('link', { name: '網路概論' }),
		).toHaveAttribute('href', '/course/115/1/COURSE-003');
		expect(within(slotRow(dialog, '3 - 10:10')).getByText('空堂')).toBeInTheDocument();
		expect(dialog).not.toHaveTextContent('有課程進行');
	});

	it('updates the open details when the selected weekday changes', async () => {
		const monday = course('COURSE-MON', '週一課程', { mon: ['1'] });
		const tuesday = course('COURSE-TUE', '週二課程', { tue: ['1'] });
		mocks.getCourses.mockResolvedValue([monday, tuesday]);

		await renderPage();
		const user = userEvent.setup();
		await user.click(screen.getByRole('button', { name: '週一' }));
		await user.click(screen.getByRole('button', { name: '查看「A101」詳細上課資訊' }));
		const dialog = await screen.findByRole('dialog');
		expect(
			within(slotRow(dialog, '1 - 8:10')).getByRole('link', { name: '週一課程' }),
		).toBeInTheDocument();

		fireEvent.click(screen.getByText('二'));
		await waitFor(() => {
			expect(screen.queryByRole('link', { name: '週一課程' })).not.toBeInTheDocument();
			expect(screen.getByRole('link', { name: '週二課程' })).toHaveAttribute(
				'href',
				'/course/115/1/COURSE-TUE',
			);
		});
	});

	it('resets room details when the selected semester changes', async () => {
		const oldCourse = course('COURSE-OLD', '舊學期課程', { mon: ['1'] });
		const newCourse = course('COURSE-NEW', '新學期課程', { mon: ['1'] });
		mocks.getCourses.mockImplementation(({ year }) =>
			Promise.resolve(year === '116' ? [newCourse] : [oldCourse]),
		);

		const { rerender } = await renderPage();
		const user = userEvent.setup();
		await user.click(screen.getByRole('button', { name: '週一' }));
		await user.click(screen.getByRole('button', { name: '查看「A101」詳細上課資訊' }));
		expect(await screen.findByRole('link', { name: '舊學期課程' })).toHaveAttribute(
			'href',
			'/course/115/1/COURSE-OLD',
		);

		mocks.dataset = { year: '116', sem: '2', department: 'main' };
		rerender(<EmptyRoomPage />);
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		await screen.findByRole('button', { name: '查看「A101」詳細上課資訊' });
		expect(mocks.getCourses).toHaveBeenCalledWith({
			year: '116',
			sem: '2',
			department: 'main',
		});

		await user.click(screen.getByRole('button', { name: '週一' }));
		await user.click(screen.getByRole('button', { name: '查看「A101」詳細上課資訊' }));
		expect(await screen.findByRole('link', { name: '新學期課程' })).toHaveAttribute(
			'href',
			'/course/116/2/COURSE-NEW',
		);
		expect(screen.queryByRole('link', { name: '舊學期課程' })).not.toBeInTheDocument();
	});
});

describe('resolveRoomSourceUrl', () => {
	it('resolves relative and absolute HTTP URLs and rejects unsafe protocols', () => {
		expect(resolveRoomSourceUrl('rooms/A101')).toBe('https://aps.ntut.edu.tw/course/tw/rooms/A101');
		expect(resolveRoomSourceUrl('https://example.com/rooms/A101')).toBe(
			'https://example.com/rooms/A101',
		);
		expect(resolveRoomSourceUrl('javascript:alert(1)')).toBeNull();
		expect(resolveRoomSourceUrl('data:text/html,unsafe')).toBeNull();
	});
});

async function renderPage() {
	const rendered = render(<EmptyRoomPage />);
	await screen.findByRole('heading', { name: '尋找空教室' });
	return rendered;
}

function slotRow(dialog: HTMLElement, label: string) {
	const slot = within(dialog).getByText(label, { exact: true });
	return slot.parentElement as HTMLElement;
}

function course(
	id: string,
	name: string,
	time: Course['time'],
	roomName = 'A101',
	roomLink = 'rooms/A101',
): Course {
	const classroom: NamedCourseItem = {
		name: roomName,
		link: roomLink,
	};
	return {
		code: id,
		id,
		courseType: '○',
		name: { zh: name, en: name },
		credit: '3',
		hours: '3',
		description: { zh: '合成課程概要', en: 'Synthetic course description' },
		notes: '',
		stage: '1',
		time: time,
		teacher: [],
		class: [],
		classroom: [classroom],
		people: '30',
		peopleWithdraw: '0',
		ta: [],
		language: '中文',
		courseDescriptionLink: 'https://example.com/course-description',
		syllabusLinks: [],
	};
}
