import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsPage } from './StaticPages';

const mocks = vi.hoisted(() => ({
	cleanStore: vi.fn(),
	toastSuccess: vi.fn(),
	toastError: vi.fn(),
}));

vi.mock('../lib/storage', () => ({
	cleanStore: mocks.cleanStore,
}));

vi.mock('sonner', () => ({
	toast: {
		success: mocks.toastSuccess,
		error: mocks.toastError,
	},
}));

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
		vi.clearAllMocks();
		mocks.cleanStore.mockResolvedValue(undefined);
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
		expect(mocks.toastSuccess).toHaveBeenCalledWith(
			'已下載全部學期的我的課程備份（1 組課程資料）。',
		);
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
		expect(mocks.toastSuccess).toHaveBeenCalledWith('匯入完成：新增 1 門課程，涵蓋 1 個學期。');
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
			expect(mocks.toastError).toHaveBeenCalledWith('備份操作失敗', {
				description: '匯入資料不是有效的 JSON',
			}),
		);
		expect(screen.queryByRole('button', { name: '確認匯入' })).not.toBeInTheDocument();

		await user.upload(
			input,
			new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'too-large.json', {
				type: 'application/json',
			}),
		);
		await waitFor(() =>
			expect(screen.queryByRole('button', { name: '確認匯入' })).not.toBeInTheDocument(),
		);
		expect(mocks.toastError).toHaveBeenLastCalledWith('備份操作失敗', {
			description: '備份檔過大，請選擇 5 MB 以下的 JSON 檔案',
		});
	});

	it('shows a toast when a backup file cannot be read', async () => {
		vi.spyOn(FileReader.prototype, 'readAsText').mockImplementation(() => {
			throw new Error('無法讀取備份檔');
		});
		const user = userEvent.setup();
		const { container } = render(<SettingsPage />);
		const input = container.querySelector('input[type="file"]') as HTMLInputElement;

		await user.upload(input, new File(['{}'], 'unreadable.json', { type: 'application/json' }));

		await waitFor(() =>
			expect(mocks.toastError).toHaveBeenCalledWith('備份操作失敗', {
				description: '無法讀取備份檔',
			}),
		);
	});

	it('shows a success toast when clearing the website cache succeeds', async () => {
		const user = userEvent.setup();
		render(<SettingsPage />);

		await user.click(screen.getByRole('button', { name: '清空網站快取' }));

		await waitFor(() => expect(mocks.cleanStore).toHaveBeenCalledOnce());
		expect(mocks.toastSuccess).toHaveBeenCalledWith('已清空網站快取。');
	});

	it('shows an error toast when clearing the website cache fails', async () => {
		mocks.cleanStore.mockRejectedValueOnce(new Error('快取服務失敗'));
		const user = userEvent.setup();
		render(<SettingsPage />);

		await user.click(screen.getByRole('button', { name: '清空網站快取' }));

		await waitFor(() =>
			expect(mocks.toastError).toHaveBeenCalledWith('清空網站快取失敗', {
				description: '快取服務失敗',
			}),
		);
	});
});
