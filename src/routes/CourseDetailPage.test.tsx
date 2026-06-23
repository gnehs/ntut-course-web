import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HtmlText } from './CourseDetailPage';

describe('HtmlText', () => {
	it('renders course URLs as underlined links that can wrap', () => {
		const classNoteUrl =
			'https://example.com/course-materials/path/to/very-long-handout-file?ref=syllabus';
		const meetingUrl = 'https://example.com/live-class';
		const { container } = render(
			<HtmlText as='p' text={`Class Note: ${classNoteUrl}\nOnline Class Link: ${meetingUrl}`} />,
		);

		expect(container.querySelector('p')).toHaveClass('whitespace-pre-wrap', 'break-words');

		const classNoteLink = screen.getByRole('link', { name: classNoteUrl });
		expect(classNoteLink).toHaveAttribute('href', classNoteUrl);
		expect(classNoteLink).toHaveAttribute('target', '_blank');
		expect(classNoteLink).toHaveClass('underline', 'break-all');
		expect(classNoteLink.className).toContain('[overflow-wrap:anywhere]');

		expect(screen.getByRole('link', { name: meetingUrl })).toHaveAttribute('href', meetingUrl);
	});

	it('keeps trailing punctuation outside the link', () => {
		const meetingUrl = 'https://example.com/live-class';
		const { container } = render(<HtmlText text={`備註：${meetingUrl}。`} />);

		expect(screen.getByRole('link', { name: meetingUrl })).toHaveAttribute('href', meetingUrl);
		expect(container).toHaveTextContent(`備註：${meetingUrl}。`);
	});

	it('renders HTML-looking text as plain text', () => {
		const { container } = render(
			<HtmlText text={'<strong>Class Note</strong>: https://example.com/course'} />,
		);

		expect(container.querySelector('strong')).not.toBeInTheDocument();
		expect(screen.getByText('<strong>Class Note</strong>:', { exact: false })).toBeInTheDocument();
	});
});
