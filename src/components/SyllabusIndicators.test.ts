import { describe, expect, it } from 'vitest';
import { parseAiAdoption, parseSdgGoals, parseTeachingMethods } from './SyllabusIndicators';

describe('parseSdgGoals', () => {
	it('reads each listed goal and skips a leftover "none"', () => {
		expect(
			parseSdgGoals(
				'無（None）\nSDG4：優質教育（Quality Education）\nSDG9：產業創新與基礎設施（Industry, Innovation and Infrastructure）',
			),
		).toEqual([4, 9]);
	});

	it('leaves text it does not recognise to be shown as written', () => {
		expect(parseSdgGoals('本課程對應優質教育')).toBeNull();
		expect(parseSdgGoals('無（None）')).toBeNull();
	});
});

describe('parseAiAdoption', () => {
	it('collects the ticked options', () => {
		expect(
			parseAiAdoption(
				'● 鼓勵學生使用生成式 AI 工具（Encourage students to use generative AI tools）\n● 簡單介紹 AI 的基本概念（Briefly introduce the basic concept of AI）',
			),
		).toEqual(new Set(['鼓勵學生使用生成式 AI 工具', '簡單介紹 AI 的基本概念']));
	});

	it('treats "none" as no options rather than unknown text', () => {
		expect(parseAiAdoption('● 無（None）')).toEqual(new Set());
	});

	it('leaves text it does not recognise to be shown as written', () => {
		expect(parseAiAdoption('● 使用 AI 批改作業')).toBeNull();
	});
});

describe('parseTeachingMethods', () => {
	it('reads the ticked options and skips their fixed descriptions', () => {
		expect(
			parseTeachingMethods(
				'● 混成學習 (Blended Learning)\n課程結合實體授課與線上學習（同步視訊／非同步活動）。\nCombines face-to-face instruction with online learning.\n● 數位科技融入 (Digital Technology Integration)\n運用生成式 AI 等新興科技輔助教學與評量。',
			),
		).toEqual(new Set(['混成學習', '數位科技融入']));
	});

	it('treats "none" as no options and leaves free text as written', () => {
		expect(parseTeachingMethods('● 無 (None)')).toEqual(new Set());
		expect(parseTeachingMethods('延伸教學資源測試')).toBeNull();
	});
});
