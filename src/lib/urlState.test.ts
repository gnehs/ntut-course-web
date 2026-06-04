import { describe, expect, it } from 'vitest';
import { createSearchParams, replaceQuery } from './urlState';

describe('urlState', () => {
	it('writes plain query strings without JSON quoting values', () => {
		replaceQuery('/advanced-search', {
			year: '115',
			sem: '1',
			d: 'main',
			q: JSON.stringify({ k: '國文' }),
		});
		expect(window.location.pathname).toBe('/advanced-search');
		expect(window.location.search).toContain('year=115');
		expect(window.location.search).toContain('sem=1');
		expect(window.location.search).not.toContain('%22115%22');
		expect(new URLSearchParams(window.location.search).get('q')).toBe(
			JSON.stringify({ k: '國文' }),
		);
	});

	it('serializes object values before writing query strings', () => {
		const timetableFilter = { mon: ['1', '2', '3'], tue: ['4'], wed: [], thu: [], fri: [] };

		replaceQuery('/advanced-search', { year: '115', sem: '1', q: { tf: timetableFilter } });

		expect(JSON.parse(new URLSearchParams(window.location.search).get('q') ?? '')).toEqual({
			tf: timetableFilter,
		});
	});

	it('normalizes router search objects with nested values', () => {
		const timetableFilter = { mon: ['1', '2', '3'], tue: ['4'], wed: [], thu: [], fri: [] };

		const params = createSearchParams({ year: '115', sem: '1', q: { tf: timetableFilter } });

		expect(params.get('year')).toBe('115');
		expect(JSON.parse(params.get('q') ?? '')).toEqual({ tf: timetableFilter });
	});
});
