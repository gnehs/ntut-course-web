import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProvider, useApp } from './AppContext';

const apiMocks = vi.hoisted(() => ({
	fetchCourse: vi.fn(),
	fetchYearData: vi.fn(),
}));

vi.mock('../lib/courseApi', () => ({
	fetchCourse: apiMocks.fetchCourse,
	fetchYearData: apiMocks.fetchYearData,
}));

function DatasetProbe() {
	const { dataset, setDataset, error, loadingDataset, retryDataset, getCourses } = useApp();

	return (
		<>
			<button type='button' onClick={() => setDataset({ department: '進修部' })}>
				{dataset.year}-{dataset.sem}-{dataset.department}
			</button>
			<button type='button' onClick={() => void retryDataset()}>
				重試學期
			</button>
			<button type='button' onClick={() => void getCourses()}>
				載入課程
			</button>
			<div data-testid='dataset-loading'>{String(loadingDataset)}</div>
			{error ? <div role='alert'>{String(error)}</div> : null}
		</>
	);
}

describe('AppContext', () => {
	beforeEach(() => {
		apiMocks.fetchYearData.mockReset().mockResolvedValue({ 112: [1] });
		apiMocks.fetchCourse.mockReset();
		localStorage.clear();
		sessionStorage.clear();
		localStorage.setItem('data-year', '112');
		localStorage.setItem('data-sem', '1');
		localStorage.setItem('data-department', 'main');
	});

	it('preserves the current year and semester when partially updating the dataset', () => {
		render(
			<AppProvider>
				<DatasetProbe />
			</AppProvider>,
		);

		fireEvent.click(screen.getByRole('button', { name: '112-1-main' }));

		expect(screen.getByRole('button', { name: '112-1-進修部' })).toBeInTheDocument();
		expect(localStorage.getItem('data-year')).toBe('112');
		expect(localStorage.getItem('data-sem')).toBe('1');
		expect(localStorage.getItem('data-department')).toBe('進修部');
	});

	it('keeps a cold start empty when the semester index fails', async () => {
		apiMocks.fetchYearData.mockRejectedValue(new Error('網路暫時無法連線'));
		localStorage.removeItem('data-year');
		localStorage.removeItem('data-sem');

		render(
			<AppProvider>
				<DatasetProbe />
			</AppProvider>,
		);

		expect(await screen.findByRole('alert')).toHaveTextContent('網路暫時無法連線');
		expect(screen.getByRole('button', { name: '--main' })).toBeInTheDocument();
		expect(localStorage.getItem('data-year')).toBeNull();
		expect(localStorage.getItem('data-sem')).toBeNull();
		expect(apiMocks.fetchCourse).not.toHaveBeenCalled();

		fireEvent.click(screen.getByRole('button', { name: '載入課程' }));
		expect(apiMocks.fetchCourse).not.toHaveBeenCalled();
	});

	it('preserves an existing dataset when refreshing the semester index fails', async () => {
		apiMocks.fetchYearData.mockRejectedValue(new Error('服務暫時無法回應'));

		render(
			<AppProvider>
				<DatasetProbe />
			</AppProvider>,
		);

		expect(await screen.findByRole('alert')).toHaveTextContent('服務暫時無法回應');
		expect(screen.getByRole('button', { name: '112-1-main' })).toBeInTheDocument();
		expect(localStorage.getItem('data-year')).toBe('112');
		expect(localStorage.getItem('data-sem')).toBe('1');
		expect(localStorage.getItem('data-department')).toBe('main');
	});

	it('recovers from an initial failure when retry succeeds', async () => {
		apiMocks.fetchYearData
			.mockRejectedValueOnce(new Error('第一次載入失敗'))
			.mockResolvedValueOnce({ 115: [2, 1], 114: [2] });
		localStorage.removeItem('data-year');
		localStorage.removeItem('data-sem');

		render(
			<AppProvider>
				<DatasetProbe />
			</AppProvider>,
		);

		expect(await screen.findByRole('alert')).toHaveTextContent('第一次載入失敗');
		fireEvent.click(screen.getByRole('button', { name: '重試學期' }));

		expect(await screen.findByRole('button', { name: '115-1-main' })).toBeInTheDocument();
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
		expect(localStorage.getItem('data-year')).toBe('115');
		expect(localStorage.getItem('data-sem')).toBe('1');
		expect(localStorage.getItem('data-department')).toBe('main');
	});

	it('chooses the newest available semester when the newest year has no semesters', async () => {
		apiMocks.fetchYearData.mockResolvedValue({ 115: [], 114: [2] });
		localStorage.removeItem('data-year');
		localStorage.removeItem('data-sem');

		render(
			<AppProvider>
				<DatasetProbe />
			</AppProvider>,
		);

		expect(await screen.findByRole('button', { name: '114-2-main' })).toBeInTheDocument();
	});
});
