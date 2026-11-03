import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MProgramDetailPage } from './MProgramPage';

const mocks = vi.hoisted(() => ({
	fetchMicroPrograms: vi.fn(),
	fetchMicroProgramDocs: vi.fn(),
	fetchCourse: vi.fn(),
}));

vi.mock('../lib/courseApi', () => ({
	fetchMicroPrograms: mocks.fetchMicroPrograms,
	fetchMicroProgramDocs: mocks.fetchMicroProgramDocs,
	fetchCourse: mocks.fetchCourse,
}));

vi.mock('../state/AppContext', () => ({
	useApp: () => ({ addCourse: vi.fn(), removeCourse: vi.fn() }),
}));

vi.mock('../components/CourseList', () => ({
	CourseList: ({ courses }: { courses: { id: string }[] }) => (
		<div>
			{courses.map((course) => (
				<span key={course.id}>{course.id}</span>
			))}
		</div>
	),
	CourseListSkeleton: () => null,
}));

vi.mock('../components/AdsByGoogle', () => ({ AdsByGoogle: () => null }));

vi.mock('@tanstack/react-router', () => ({
	Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
	useParams: () => ({ year: '115', sem: '1', id: 'AZ9' }),
}));

const docs = {
	id: 'AZ9',
	name: '先進電動自駕車輛微學程',
	rules: 'https://oaa.ntut.edu.tw/var/file/8/1008/img/2880/AZ9.pdf',
	plan: 'https://oaa.ntut.edu.tw/var/file/8/1008/img/2880/AZ9_.pdf',
	apply: null,
	intro: '本微學程為配合國家政策培養電動車與自駕車產業領域之專業人才。',
};

describe('MProgramDetailPage', () => {
	beforeEach(() => {
		mocks.fetchMicroPrograms.mockResolvedValue([
			{ id: 'AZ9', name: '先進電動自駕車輛微學程', course: ['C1'] },
		]);
		mocks.fetchCourse.mockResolvedValue([{ id: 'C1', time: {} }]);
	});

	it('shows the scraped intro and document links', async () => {
		mocks.fetchMicroProgramDocs.mockResolvedValue(docs);
		render(<MProgramDetailPage />);

		expect(await screen.findByText(docs.intro)).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /施行細則/ })).toHaveAttribute('href', docs.rules);
		expect(screen.getByRole('link', { name: /課程規劃表/ })).toHaveAttribute('href', docs.plan);
		expect(screen.queryByRole('link', { name: /修畢申請表/ })).not.toBeInTheDocument();
	});

	it('still lists the courses when the documents dataset is unavailable', async () => {
		mocks.fetchMicroProgramDocs.mockRejectedValue(new Error('503'));
		render(<MProgramDetailPage />);

		expect(await screen.findByText('C1')).toBeInTheDocument();
		expect(screen.queryByRole('link', { name: /施行細則/ })).not.toBeInTheDocument();
		expect(screen.getByRole('link', { name: /教務處微學程專區/ })).toBeInTheDocument();
	});
});
