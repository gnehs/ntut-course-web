import { describe, expect, it } from 'vitest';
import { chineseNumeral, groupClassNames } from './classGroups';

describe('chineseNumeral', () => {
	it('reads one and two digit numerals', () => {
		expect(['一', '九', '十', '十一', '十六', '二十', '二十三'].map(chineseNumeral)).toEqual([
			1, 9, 10, 11, 16, 20, 23,
		]);
	});
});

describe('groupClassNames', () => {
	it('lays sectioned classes out by grade, youngest first', () => {
		expect(groupClassNames(['材資四甲', '材資一甲', '材資四乙', '材資一乙', '材料所'])).toEqual([
			{
				kind: 'grades',
				prefix: '材資',
				rows: [
					{
						label: '一年級',
						items: [
							{ name: '材資一甲', label: '甲' },
							{ name: '材資一乙', label: '乙' },
						],
					},
					{
						label: '四年級',
						items: [
							{ name: '材資四甲', label: '甲' },
							{ name: '材資四乙', label: '乙' },
						],
					},
				],
			},
			{ kind: 'single', name: '材料所' },
		]);
	});

	it('keeps a grade without sections in the grid under its full name', () => {
		const [group] = groupClassNames(['資財四甲', '資財三', '資財四乙']);
		expect(group).toMatchObject({
			kind: 'grades',
			rows: [{ label: '三年級', items: [{ name: '資財三', label: '資財三' }] }, { label: '四年級' }],
		});
	});

	it('folds bracketed and bare numerals into a series', () => {
		expect(groupClassNames(['體育選修', '體育專項(十一)', '體育專項(二)'])).toEqual([
			{ kind: 'single', name: '體育選修' },
			{
				kind: 'series',
				prefix: '體育專項',
				items: [
					{ name: '體育專項(二)', label: '二' },
					{ name: '體育專項(十一)', label: '十一' },
				],
			},
		]);
		expect(groupClassNames(['攜四車四', '攜四車三', '訓四車四'])).toEqual([
			{
				kind: 'series',
				prefix: '攜四車',
				items: [
					{ name: '攜四車三', label: '三' },
					{ name: '攜四車四', label: '四' },
				],
			},
			{ kind: 'single', name: '訓四車四' },
		]);
	});

	it('gathers one class offered by several schools under its base class', () => {
		expect(
			groupClassNames(['跨校選課(大)', '輔導課程', '跨校選課(大)－國立臺北大學', '跨校選課(大)－臺北醫學大學']),
		).toEqual([
			{
				kind: 'variants',
				prefix: '跨校選課(大)',
				base: '跨校選課(大)',
				items: [
					{ name: '跨校選課(大)－國立臺北大學', label: '國立臺北大學' },
					{ name: '跨校選課(大)－臺北醫學大學', label: '臺北醫學大學' },
				],
			},
			{ kind: 'single', name: '輔導課程' },
		]);
	});

	it('leaves a lone member of a pattern as a single link', () => {
		expect(groupClassNames(['半導體三', '機電所', '職機電所'])).toEqual([
			{ kind: 'single', name: '半導體三' },
			{ kind: 'single', name: '機電所' },
			{ kind: 'single', name: '職機電所' },
		]);
	});
});
