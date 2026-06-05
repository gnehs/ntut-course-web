import { describe, expect, it } from 'vitest';
import { parseOgImageRoute } from './ogImageRoute';

describe('og image routes', () => {
	it('parses pretty worker image endpoints', () => {
		expect(parseOgImageRoute(new URL('https://example.com/course/115/1/360744/og.png'))).toEqual({
			type: 'course',
			year: '115',
			sem: '1',
			id: '360744',
			department: 'main',
		});
		expect(parseOgImageRoute(new URL('https://example.com/class/115/1/四技資工一/og.png'))).toEqual(
			{
				type: 'class',
				year: '115',
				sem: '1',
				id: '四技資工一',
			},
		);
		expect(parseOgImageRoute(new URL('https://example.com/teacher/高子漢/og.png'))).toEqual({
			type: 'teacher',
			name: '高子漢',
		});
	});

	it('rejects incomplete image endpoint parameters', () => {
		expect(
			parseOgImageRoute(new URL('https://example.com/api?year=115&sem=1&id=360744')),
		).toBeNull();
		expect(
			parseOgImageRoute(new URL('https://example.com/api/class?year=115&sem=1&id=479')),
		).toBeNull();
		expect(parseOgImageRoute(new URL('https://example.com/api/teacher?name=高子漢'))).toBeNull();
		expect(parseOgImageRoute(new URL('https://example.com/course/115/1/360744'))).toBeNull();
	});
});
