import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CourseCollectionPage } from './CourseCollectionPage';
import type { Course } from '../types/course';

vi.mock('./CourseList', () => ({
	CourseList: ({
		department,
		layout,
		showConflictCourse,
		showToolbar,
		year,
		sem,
	}: {
		department: string;
		layout: string;
		showConflictCourse: boolean;
		showToolbar: boolean;
		year: string;
		sem: string;
	}) => (
		<div
			data-testid={department}
			data-layout={layout}
			data-conflicts={String(showConflictCourse)}
			data-toolbar={String(showToolbar)}
			data-term={`${year}/${sem}`}
		/>
	),
}));

const groups = [
	{ key: 'main', label: '日間部', department: 'main', courses: [{ id: 'sample-1' } as Course] },
	{
		key: 'evening',
		label: '進修部',
		department: '進修部',
		courses: [{ id: 'sample-2' } as Course],
	},
];

describe('CourseCollectionPage', () => {
	it('shares one layout and conflict control while preserving each department scope', async () => {
		const user = userEvent.setup();
		render(
			<CourseCollectionPage
				title='範例學程'
				year='115'
				sem='1'
				groups={groups}
				actions={<button>全部加入</button>}
			/>,
		);
		expect(screen.getByText('共 2 門課程')).toBeInTheDocument();
		const toolbar = screen.getByRole('group', { name: '課程顯示方式' });
		expect(screen.getAllByRole('group', { name: '課程顯示方式' })).toHaveLength(1);
		for (const mode of ['表格', '課表', '卡片']) {
			await user.click(within(toolbar).getByRole('button', { name: mode }));
			const layout = { 表格: 'table', 課表: 'timetable', 卡片: 'card' }[mode];
			for (const department of ['main', '進修部']) {
				expect(screen.getByTestId(department)).toHaveAttribute('data-layout', layout);
				expect(screen.getByTestId(department)).toHaveAttribute('data-toolbar', 'false');
				expect(screen.getByTestId(department)).toHaveAttribute('data-term', '115/1');
			}
		}
		await user.click(screen.getByRole('button', { name: '衝堂課程' }));
		for (const department of ['main', '進修部'])
			expect(screen.getByTestId(department)).toHaveAttribute('data-conflicts', 'false');
	});
	it('keeps error and empty content visible without offering an empty batch operation', () => {
		render(
			<CourseCollectionPage
				title='範例班級'
				year='115'
				sem='1'
				groups={[]}
				actions={<button>全部加入</button>}
				notice={<p>部分資料無法載入</p>}
				emptyState={<p>尚無課程</p>}
				footer={<p>資料來源</p>}
			/>,
		);
		expect(screen.getByText('部分資料無法載入')).toBeInTheDocument();
		expect(screen.getByText('尚無課程')).toBeInTheDocument();
		expect(screen.getByText('資料來源')).toBeInTheDocument();
		expect(screen.queryByRole('button')).not.toBeInTheDocument();
	});
});
