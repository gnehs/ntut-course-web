import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UniversalSearch } from './UniversalSearch';

const mocks = vi.hoisted(() => ({
	getCourses: vi.fn(),
	navigate: vi.fn(),
}));

vi.mock('../state/AppContext', () => ({
	useApp: () => ({
		dataset: { year: '115', sem: '1', department: 'main' },
		getCourses: mocks.getCourses,
	}),
}));

vi.mock('@tanstack/react-router', () => ({
	Link: ({ to, children, ...props }) => (
		<a href={to} {...props}>
			{children}
		</a>
	),
	useNavigate: () => mocks.navigate,
}));

beforeEach(() => {
	vi.clearAllMocks();
	mocks.getCourses.mockResolvedValue([
		{
			id: 'CS101',
			code: 'CS101',
			courseType: '○',
			name: { zh: '資料結構', en: 'Data Structures' },
			teacher: [{ name: '王老師' }],
			class: [],
			classroom: [],
			notes: '',
		},
	]);
	Element.prototype.scrollIntoView = vi.fn();
});

describe('UniversalSearch accessibility and keyboard navigation', () => {
	it('has an accessible name and moves the active result without smooth scrolling', async () => {
		const user = userEvent.setup();
		render(<UniversalSearch />);

		const input = screen.getByRole('combobox', { name: '搜尋課程、教師、課號、班級' });
		await user.type(input, '資料');
		const option = await screen.findByRole('option', { name: /資料結構/ });
		expect(input).toHaveAttribute('aria-expanded', 'true');

		await user.keyboard('{ArrowDown}');
		await waitFor(() => {
			expect(option.scrollIntoView).toHaveBeenCalledWith({
				behavior: 'auto',
				block: 'nearest',
				inline: 'nearest',
			});
		});
	});
});
