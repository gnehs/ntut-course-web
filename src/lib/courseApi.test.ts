import { beforeEach, describe, expect, it, vi } from 'vitest';
import { API_BASE } from './courseUtils';
import { fetchCompetencies, fetchPrograms, fetchSyllabusIndex } from './courseApi';

const mocks = vi.hoisted(() => ({
	fetch: vi.fn(),
	getStore: vi.fn(),
	setStore: vi.fn(),
}));

vi.mock('./storage', () => ({
	getStore: mocks.getStore,
	setStore: mocks.setStore,
}));

const datasets = {
	programs: [
		{
			id: 'program-001',
			name: '測試學程',
			href: 'https://example.com/program',
			courses: ['CODE-001'],
		},
	],
	competencies: [
		{
			id: 'department-001',
			name: '測試系所',
			href: 'https://example.com/department',
			abilities: [{ id: 'ability-001', name: '測試能力' }],
			courses: [{ code: 'CODE-001', name: '測試課程', abilityIds: ['ability-001'] }],
		},
	],
	syllabusIndex: {
		'COURSE-001': {
			ai: ['導入 AI 測試'],
			sdgs: [4],
			resources: ['延伸資源測試'],
			hasSyllabus: true,
		},
	},
} as const;

const requests = [
	{
		name: 'programs',
		path: '115/1/programs.json',
		call: () => fetchPrograms('115', '1'),
		data: datasets.programs,
	},
	{
		name: 'competencies',
		path: 'competencies.json',
		call: () => fetchCompetencies(),
		data: datasets.competencies,
	},
	{
		name: 'syllabus index',
		path: '115/1/syllabus-index.json',
		call: () => fetchSyllabusIndex('115', '1'),
		data: datasets.syllabusIndex,
	},
] as const;

beforeEach(() => {
	vi.clearAllMocks();
	vi.stubGlobal('fetch', mocks.fetch);
	mocks.getStore.mockResolvedValue(null);
	mocks.setStore.mockResolvedValue(undefined);
});

function response(data: unknown, status = 200) {
	return {
		status,
		statusText: status === 200 ? 'OK' : 'Server Error',
		ok: status >= 200 && status < 300,
		json: vi.fn().mockResolvedValue(data),
	};
}

describe('optional course datasets', () => {
	it.each(requests)(
		'fetches $name from its dedicated API path and caches success',
		async (request) => {
			mocks.getStore.mockResolvedValueOnce(null).mockResolvedValueOnce(request.data);
			mocks.fetch.mockResolvedValue(response(request.data));

			await expect(request.call()).resolves.toEqual(request.data);
			await expect(request.call()).resolves.toEqual(request.data);

			expect(mocks.fetch).toHaveBeenCalledTimes(1);
			expect(mocks.fetch).toHaveBeenCalledWith(`${API_BASE}/${request.path}`);
			expect(mocks.getStore).toHaveBeenCalledWith(`optional_${request.path}`);
			expect(mocks.setStore).toHaveBeenCalledTimes(1);
			expect(mocks.setStore).toHaveBeenCalledWith(`optional_${request.path}`, request.data);
		},
	);

	it.each(requests)('returns null without caching a 404 for $name', async (request) => {
		mocks.fetch.mockResolvedValue(response(null, 404));

		await expect(request.call()).resolves.toBeNull();
		await expect(request.call()).resolves.toBeNull();

		expect(mocks.fetch).toHaveBeenCalledTimes(2);
		expect(mocks.fetch).toHaveBeenCalledWith(`${API_BASE}/${request.path}`);
		expect(mocks.setStore).not.toHaveBeenCalled();
	});

	it.each(requests)('throws on a non-404 error for $name', async (request) => {
		mocks.fetch.mockResolvedValue(response(null, 500));

		await expect(request.call()).rejects.toThrow('500 Server Error');
		expect(mocks.setStore).not.toHaveBeenCalled();
	});
});
