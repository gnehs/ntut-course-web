import { describe, expect, it } from 'vitest';
import { parseOgImageRoute } from './ogImageRoute';

describe('og image routes', () => {
	it('parses worker image endpoints', () => {
		expect(parseOgImageRoute(new URL('https://example.com/api?year=115&sem=1&id=360744'))).toEqual({
			type: 'course',
			year: '115',
			sem: '1',
			id: '360744',
			department: 'main',
		});
		expect(
			parseOgImageRoute(new URL('https://example.com/api/class?year=115&sem=1&id=479')),
		).toEqual({
			type: 'class',
			year: '115',
			sem: '1',
			id: '479',
		});
		expect(parseOgImageRoute(new URL('https://example.com/api/teacher?name=高子漢'))).toEqual({
			type: 'teacher',
			name: '高子漢',
		});
	});

	it('rejects incomplete image endpoint parameters', () => {
		expect(parseOgImageRoute(new URL('https://example.com/api?year=115&sem=1'))).toBeNull();
		expect(parseOgImageRoute(new URL('https://example.com/api/class?year=115&id=479'))).toBeNull();
		expect(parseOgImageRoute(new URL('https://example.com/api/teacher'))).toBeNull();
	});
});
