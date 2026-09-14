import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Field } from './Field';
import { Input } from './Input';
import { Select, SelectOption } from './Select';

describe('Field', () => {
	it('associates a label with a native control inside a layout wrapper', () => {
		render(
			<Field label='搜尋關鍵字'>
				<div id='layout-wrapper'>
					<Input />
				</div>
			</Field>,
		);

		const input = screen.getByLabelText('搜尋關鍵字');
		expect(input).toHaveAttribute('id');
		expect(screen.getByText('搜尋關鍵字')).toHaveAttribute('for', input.getAttribute('id'));
	});

	it('exposes the generated label name on the Select trigger', () => {
		render(
			<Field label='學期'>
				<Select value='115-1' onChange={vi.fn()}>
					<SelectOption value='115-1'>115 年上學期</SelectOption>
				</Select>
			</Field>,
		);

		const select = screen.getByRole('combobox', { name: '學期' });
		expect(select).toHaveAttribute('id');
		expect(screen.getAllByRole('combobox')).toHaveLength(1);
	});
});
