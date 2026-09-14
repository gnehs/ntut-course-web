import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsPage } from './StaticPages';

function backup(overrides: Record<string, unknown> = {}) {
	return JSON.stringify({
		format: 'ntut-course-my-course-backup',
		version: 2,
		exportedAt: '2026-09-14T00:00:00.000Z',
		courses: [{ key: 'my-couse-data-115-1', courseIds: ['IMPORTED'] }],
		classes: [],
		mprograms: [],
		...overrides,
	});
}

describe('SettingsPage my course backup', () => {
	const originalCreateObjectURL = URL.createObjectURL;
	const originalRevokeObjectURL = URL.revokeObjectURL;

	beforeEach(() => {
		localStorage.clear();
	});

	afterEach(() => {
		Object.defineProperty(URL, 'createObjectURL', {
			configurable: true,
			value: originalCreateObjectURL,
		});
		Object.defineProperty(URL, 'revokeObjectURL', {
			configurable: true,
			value: originalRevokeObjectURL,
		});
		vi.restoreAllMocks();
	});

	it('downloads a backup from settings', async () => {
		localStorage.setItem('my-couse-data-115-1', JSON.stringify(['COURSE-001']));
		const createObjectURL = vi.fn(() => 'blob:test');
		const revokeObjectURL = vi.fn();
		Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
		Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });
		const user = userEvent.setup();

		render(<SettingsPage />);
		await user.click(screen.getByRole('button', { name: '下載全部學期' }));

		expect(createObjectURL).toHaveBeenCalledOnce();
		expect(await screen.findByText(/已下載全部學期的我的課程備份/)).toBeInTheDocument();
	});

	it('previews a selected file and merges only after confirmation', async () => {
		localStorage.setItem('my-couse-data-115-1', JSON.stringify(['EXISTING']));
		const user = userEvent.setup();
		const { container } = render(<SettingsPage />);
		const input = container.querySelector('input[type="file"]') as HTMLInputElement;
		const file = new File([backup()], 'my-course-backup.json', { type: 'application/json' });

		await user.upload(input, file);
		expect(await screen.findByRole('button', { name: '確認匯入' })).toBeInTheDocument();
		expect(localStorage.getItem('my-couse-data-115-1')).toBe(JSON.stringify(['EXISTING']));

		await user.click(screen.getByRole('button', { name: '確認匯入' }));
		expect(localStorage.getItem('my-couse-data-115-1')).toBe(
			JSON.stringify(['EXISTING', 'IMPORTED']),
		);
		expect(await screen.findByText(/匯入完成：新增 1 門課程/)).toBeInTheDocument();
	});

	it('supports the legacy paste flow without writing before confirmation', async () => {
		const user = userEvent.setup();
		render(<SettingsPage />);
		await user.click(screen.getByRole('button', { name: '貼上舊版資料' }));
		fireEvent.change(screen.getByLabelText('貼上舊版單學期備份內容'), {
			target: {
				value: JSON.stringify({
					key: 'my-couse-data-115-1',
					data: JSON.stringify(['LEGACY']),
					classKey: 'my-couse-class-115-1',
					classData: '四技電機四',
				}),
			},
		});

		await user.click(screen.getByRole('button', { name: '檢查資料' }));
		expect(
			await screen.findByText('這是舊版單學期格式，確認後會與目前資料合併。'),
		).toBeInTheDocument();
		expect(localStorage.getItem('my-couse-data-115-1')).toBeNull();
		await user.click(screen.getByRole('button', { name: '確認匯入' }));
		expect(localStorage.getItem('my-couse-data-115-1')).toBe(JSON.stringify(['LEGACY']));
		expect(localStorage.getItem('my-couse-class-115-1')).toBe('四技電機四');
	});

	it('clears an old pending preview when a later file is invalid or oversized', async () => {
		const user = userEvent.setup();
		const { container } = render(<SettingsPage />);
		const input = container.querySelector('input[type="file"]') as HTMLInputElement;

		await user.upload(input, new File([backup()], 'valid.json', { type: 'application/json' }));
		expect(await screen.findByRole('button', { name: '確認匯入' })).toBeInTheDocument();

		await user.upload(input, new File(['not json'], 'broken.json', { type: 'application/json' }));
		await waitFor(() =>
			expect(screen.queryByRole('button', { name: '確認匯入' })).not.toBeInTheDocument(),
		);
		expect(await screen.findByText('備份操作失敗')).toBeInTheDocument();

		await user.upload(
			input,
			new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'too-large.json', {
				type: 'application/json',
			}),
		);
		await waitFor(() =>
			expect(screen.queryByRole('button', { name: '確認匯入' })).not.toBeInTheDocument(),
		);
		expect(screen.getByText('備份檔過大，請選擇 5 MB 以下的 JSON 檔案')).toBeInTheDocument();
	});
});
