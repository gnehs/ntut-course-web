import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { CourseList } from './CourseList';
import type { Course } from '../types/course';

const mocks = vi.hoisted(() => ({
	getCourses: vi.fn(),
	getMyCourseIds: vi.fn(),
	addCourse: vi.fn(),
	removeCourse: vi.fn(),
}));
vi.mock('../state/AppContext', () => ({
	useApp: () => ({ dataset: { year: '115', sem: '1', department: 'main' }, ...mocks }),
}));
vi.mock('@tanstack/react-router', () => ({
	Link: ({ to, children, ...props }) => (
		<a href={to} {...props}>
			{children}
		</a>
	),
}));

const course = {
	id: '101',
	code: 'A101',
	name: { zh: '測試課程' },
	credit: '3',
	hours: '3',
	stage: '1',
	courseType: '★',
	description: { zh: '', en: '' },
	notes: '',
	time: {},
	teacher: [],
	class: [],
	classroom: [],
	people: '0',
	peopleWithdraw: '0',
	ta: [],
	language: '',
	courseDescriptionLink: '',
	syllabusLinks: [],
} satisfies Course;

beforeEach(() => {
	vi.clearAllMocks();
	mocks.getCourses.mockResolvedValue([course]);
	mocks.getMyCourseIds.mockReturnValue([]);
});

it('saves and checks conflicts in the displayed semester and department', async () => {
	render(<CourseList courses={[course]} year='114' sem='2' department='進修部' />);
	await waitFor(() =>
		expect(mocks.getCourses).toHaveBeenCalledWith({ year: '114', sem: '2', department: '進修部' }),
	);
	fireEvent.click(screen.getByRole('button', { name: '加入我的課程' }));
	expect(mocks.addCourse).toHaveBeenCalledWith('101', '114', '2', '進修部');
	expect(mocks.getMyCourseIds).toHaveBeenCalledWith('114', '2', '進修部');
	expect(screen.getByRole('link', { name: /查看.*測試課程/ })).toHaveAttribute(
		'href',
		'/course/114/2/101',
	);
});

it('removes a saved course from its displayed department', () => {
	mocks.getMyCourseIds.mockReturnValue(['101']);
	render(<CourseList courses={[course]} year='114' sem='2' department='進修部' />);
	fireEvent.click(screen.getByRole('button', { name: '從我的課程移除' }));
	expect(mocks.removeCourse).toHaveBeenCalledWith('101', '114', '2', '進修部');
});

it('refreshes external bulk saves and notifies the parent of single-course changes', () => {
	const onSavedChange = vi.fn();
	const { rerender } = render(
		<CourseList courses={[course]} savedVersion={0} onSavedChange={onSavedChange} />,
	);
	mocks.getMyCourseIds.mockReturnValue(['101']);
	rerender(<CourseList courses={[course]} savedVersion={1} onSavedChange={onSavedChange} />);
	fireEvent.click(screen.getByRole('button', { name: '從我的課程移除' }));
	expect(onSavedChange).toHaveBeenCalledOnce();
	expect(mocks.removeCourse).toHaveBeenCalledWith('101', '115', '1', 'main');
});
