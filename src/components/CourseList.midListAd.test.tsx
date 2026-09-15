import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CourseList } from './CourseList';
import type { Course } from '../types/course';

const mocks = vi.hoisted(() => ({
	getCourses: vi.fn(),
	getMyCourseIds: vi.fn(),
	addCourse: vi.fn(),
	removeCourse: vi.fn(),
}));

vi.mock('./AdsByGoogle', () => ({
	AdsByGoogle: ({ placement }: { placement?: string }) => (
		<div data-testid={`ad-${placement || 'inline'}`} />
	),
}));

vi.mock('../state/AppContext', () => ({
	useApp: () => ({
		dataset: { year: '115', sem: '1', department: 'main' },
		...mocks,
	}),
}));

vi.mock('@tanstack/react-router', () => ({
	Link: ({ to, children, ...props }) => (
		<a href={to} {...props}>
			{children}
		</a>
	),
}));

function makeCourses(count: number, withTimetable = false): Course[] {
	return Array.from({ length: count }, (_, index) => ({
		id: String(index + 1),
		code: `C${index + 1}`,
		courseType: '○',
		name: { zh: `課程 ${index + 1}` },
		credit: '3',
		hours: '3',
		description: { zh: '', en: '' },
		notes: '',
		stage: '',
		time: withTimetable ? { mon: ['1'] } : {},
		teacher: [],
		class: [],
		classroom: [],
		people: '0',
		peopleWithdraw: '0',
		ta: [],
		language: '',
		courseDescriptionLink: '',
		syllabusLinks: [],
	}));
}

beforeEach(() => {
	vi.clearAllMocks();
	mocks.getMyCourseIds.mockReturnValue([]);
	mocks.getCourses.mockResolvedValue([]);
});

describe('CourseList mid-list ads', () => {
	it('inserts one full-span ad after the sixth card without changing course count', () => {
		const courses = makeCourses(13);
		render(<CourseList courses={courses} showMidListAd showToolbar={false} />);

		const cards = screen.getAllByRole('link', { name: /查看 .* 課程詳情/ });
		const ad = screen.getByTestId('ad-section');
		const grid = ad.parentElement?.parentElement;
		const gridChildren = grid ? Array.from(grid.children) : [];

		expect(cards).toHaveLength(13);
		expect(ad.parentElement).toHaveClass('col-span-full');
		expect(gridChildren.indexOf(ad.parentElement!)).toBe(6);
	});

	it('does not insert an ad for a short card list', () => {
		render(<CourseList courses={makeCourses(11)} showMidListAd showToolbar={false} />);

		expect(screen.getAllByRole('link', { name: /查看 .* 課程詳情/ })).toHaveLength(11);
		expect(screen.queryByTestId('ad-section')).not.toBeInTheDocument();
	});

	it('does not insert an ad in table view', () => {
		render(
			<CourseList courses={makeCourses(13)} layout='table' showMidListAd showToolbar={false} />,
		);

		expect(screen.queryByTestId('ad-section')).not.toBeInTheDocument();
		expect(screen.getAllByRole('row')).toHaveLength(14);
	});

	it('does not insert an ad in timetable view', () => {
		render(
			<CourseList
				courses={makeCourses(13, true)}
				layout='timetable'
				showMidListAd
				showToolbar={false}
			/>,
		);

		expect(screen.queryByTestId('ad-section')).not.toBeInTheDocument();
		expect(screen.getAllByRole('link', { name: /課程/ })).toHaveLength(13);
	});
});
