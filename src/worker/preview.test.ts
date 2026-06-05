import { describe, expect, it } from 'vitest';
import {
	createClassPreview,
	createCoursePreview,
	createTeacherPreview,
	parsePreviewRoute,
	previewTags,
} from './preview';
import type { Course, DepartmentGroup, WithdrawalStat } from '../types/course';

const config = {
	origin: 'https://ntut-course.gnehs.net',
};

describe('preview metadata', () => {
	it('parses dynamic preview routes', () => {
		expect(parsePreviewRoute(new URL('https://example.com/course/115/1/123456?d=進修部'))).toEqual({
			type: 'course',
			year: '115',
			sem: '1',
			id: '123456',
			department: '進修部',
		});
		expect(parsePreviewRoute(new URL('https://example.com/class/115/1/四技資工一'))).toEqual({
			type: 'class',
			year: '115',
			sem: '1',
			id: '四技資工一',
			department: 'main',
		});
		expect(parsePreviewRoute(new URL('https://example.com/teacher/王小明'))).toEqual({
			type: 'teacher',
			id: '王小明',
		});
	});

	it('creates course metadata compatible with the previous generated preview', () => {
		const course = {
			id: '123456',
			name: { zh: '資料結構', en: 'Data Structures' },
			description: { zh: '課程說明', en: '' },
		} as Course;
		const meta = createCoursePreview(
			course,
			{ type: 'course', year: '115', sem: '1', id: '123456', department: 'main' },
			config,
		);

		expect(meta).toEqual({
			title: '𝟭𝟮𝟯𝟰𝟱𝟲 資料結構',
			description: '課程說明',
			image: 'https://ntut-course.gnehs.net/course/115/1/123456/og.png',
			url: 'https://ntut-course.gnehs.net/course/115/1/123456',
		});
	});

	it('uses the preview origin for generated image URLs by default', () => {
		const course = {
			id: '123456',
			name: { zh: '資料結構' },
			description: { zh: '課程說明', en: '' },
		} as Course;
		const meta = createCoursePreview(
			course,
			{ type: 'course', year: '115', sem: '1', id: '123456', department: 'main' },
			{ origin: 'https://ntut-course.gnehs.net' },
		);

		expect(meta.image).toBe('https://ntut-course.gnehs.net/course/115/1/123456/og.png');
	});

	it('creates class metadata with course summary and class og image id', () => {
		const department: DepartmentGroup = {
			category: '電資學院',
			name: '資訊工程系',
			href: '',
			class: [{ id: 'ABCD', name: '四技資工一' }],
		};
		const courses = [
			{ name: { zh: '資料結構' }, class: [{ name: '四技資工一' }] },
			{ name: { zh: '離散數學' }, class: [{ name: '四技資工一' }] },
		] as Course[];
		const meta = createClassPreview(
			department.class?.[0] || { id: 'ABCD', name: '四技資工一' },
			department,
			courses,
			{ type: 'class', year: '115', sem: '1', id: '四技資工一', department: 'main' },
			config,
		);

		expect(meta.title).toBe('四技資工一');
		expect(meta.description).toContain('資料結構、離散數學');
		expect(meta.image).toBe(
			'https://ntut-course.gnehs.net/class/115/1/%E5%9B%9B%E6%8A%80%E8%B3%87%E5%B7%A5%E4%B8%80/og.png',
		);
		expect(meta.url).toBe(
			'https://ntut-course.gnehs.net/class/115/1/%E5%9B%9B%E6%8A%80%E8%B3%87%E5%B7%A5%E4%B8%80',
		);
	});

	it('creates teacher metadata and full preview tags', () => {
		const teacher: WithdrawalStat = {
			name: '王小明',
			course: [{ id: '1', year: '115', sem: '1', department: 'main', name: { zh: '資料結構' } }],
		};
		const meta = createTeacherPreview(teacher, { type: 'teacher', id: '王小明' }, config);
		const tags = previewTags(meta);

		expect(meta.description).toContain('資料結構');
		expect(meta.image).toBe(
			'https://ntut-course.gnehs.net/teacher/%E7%8E%8B%E5%B0%8F%E6%98%8E/og.png',
		);
		expect(tags.map((tag) => tag.key)).toEqual([
			'description',
			'og:type',
			'og:locale',
			'og:site_name',
			'og:title',
			'og:description',
			'og:url',
			'og:image',
			'twitter:card',
			'twitter:title',
			'twitter:description',
			'twitter:image',
		]);
	});
});
