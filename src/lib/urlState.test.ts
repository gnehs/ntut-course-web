import { defaultParseSearch, defaultStringifySearch } from '@tanstack/react-router';
import { describe, expect, it } from 'vitest';
import { createSearchObject, createSearchParams } from './urlState';

describe('urlState', () => {
	it('serializes router search objects without writing history directly', () => {
		const timetableFilter = { mon: ['1', '2', '3'], tue: ['4'], wed: [], thu: [], fri: [] };

		const search = createSearchObject({ year: '115', sem: '1', q: { tf: timetableFilter } });

		expect(search.year).toBe('115');
		expect(search.sem).toBe('1');
		expect(search.q).toEqual({ tf: timetableFilter });
	});

	it('lets TanStack Router stringify nested search values only once', () => {
		const search = createSearchObject({ year: '115', sem: '1', q: { k: '國文' } });

		const searchString = defaultStringifySearch(search);

		expect(searchString).toContain('q=%7B');
		expect(searchString).not.toContain('q=%22%7B');
		const parsedSearch = defaultParseSearch(searchString) as Record<string, unknown>;
		expect(parsedSearch.q).toEqual({ k: '國文' });
	});

	it('normalizes router search objects with nested values', () => {
		const timetableFilter = { mon: ['1', '2', '3'], tue: ['4'], wed: [], thu: [], fri: [] };

		const params = createSearchParams({ year: '115', sem: '1', q: { tf: timetableFilter } });

		expect(params.get('year')).toBe('115');
		expect(JSON.parse(params.get('q') ?? '')).toEqual({ tf: timetableFilter });
	});
});
