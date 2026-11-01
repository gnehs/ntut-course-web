import { describe, expect, it } from 'vitest';
import { aiChatLinks, buildCourseAdvicePrompt } from './aiPrompt';
import type { Course } from '../types/course';

const course = {
	id: '360750',
	courseType: '▲',
	name: { zh: '通訊與網路' },
	credit: '3.0',
	teacher: [{ name: '李政宏' }],
	classroom: [{ name: '六教526' }],
	time: { mon: ['2'], wed: ['5', '6'], fri: [] },
} as unknown as Course;

describe('buildCourseAdvicePrompt', () => {
	it('lists each saved course with its schedule and points the AI at llms.txt', () => {
		const prompt = buildCourseAdvicePrompt({
			year: '115',
			sem: '1',
			department: 'main',
			courses: [course],
		});
		expect(prompt).toContain('115 學年度第 1 學期（日間部）');
		expect(prompt).toContain('https://ntut-course.gnehs.net/llms.txt');
		expect(prompt).toContain('1 門，共 3 學分');
		expect(prompt).toContain('- 360750 ▲通訊與網路｜3 學分｜李政宏｜週一 2、週三 5~6｜六教526');
	});
});

describe('aiChatLinks', () => {
	it('round-trips the prompt through the query string', () => {
		const prompt = '推薦課程\n週一 2｜3 學分';
		for (const chat of aiChatLinks) {
			expect(new URL(chat.url(prompt)).searchParams.get('q')).toBe(prompt);
		}
	});
});
