import { describe, expect, it } from 'vitest';
import {
	findStudentPrefixMatches,
	parseNtutStudentPrefix,
	type StandardDepartmentEntry,
} from './studentPrefix';

describe('parseNtutStudentPrefix', () => {
	it('parses three-digit years and normalizes case and surrounding whitespace', () => {
		expect(parseNtutStudentPrefix(' 109ab ')).toEqual({
			year: '109',
			departmentCode: 'AB',
		});
	});

	it('parses two-digit years and numeric department codes', () => {
		expect(parseNtutStudentPrefix('99 30')).toBeNull();
		expect(parseNtutStudentPrefix('9930')).toEqual({
			year: '99',
			departmentCode: '30',
		});
		expect(parseNtutStudentPrefix('10930')).toEqual({
			year: '109',
			departmentCode: '30',
		});
	});

	it('accepts a complete student number with a numeric suffix', () => {
		expect(parseNtutStudentPrefix('109ab0743')).toEqual({
			year: '109',
			departmentCode: 'AB',
		});
		expect(parseNtutStudentPrefix('99301234')).toEqual({
			year: '99',
			departmentCode: '30',
		});
	});

	it('keeps syntactically valid but unknown department codes for lookup', () => {
		expect(parseNtutStudentPrefix('109zz')).toEqual({
			year: '109',
			departmentCode: 'ZZ',
		});
	});

	it('rejects incomplete prefixes and non-numeric student-number suffixes', () => {
		for (const value of [
			'',
			'1AB',
			'1',
			'79AB',
			'200AB',
			'109A',
			'109AB12C',
			'109AB-1',
			'109 AB',
		]) {
			expect(parseNtutStudentPrefix(value)).toBeNull();
		}
	});
});

describe('findStudentPrefixMatches', () => {
	const entries: StandardDepartmentEntry[] = [
		{ system: '日間部', department: '資財系', division: 'AB0', matric: '7' },
		{ system: '日間部', department: '資財系', division: 'AB1', matric: '7' },
		{ system: '碩士班', department: '資財系', division: 'AB0', matric: '8' },
		{ system: '博士班', department: '資財系', division: 'AB0', matric: '9' },
		{ system: '學程', department: '資財系', division: 'AB0', matric: '1' },
		{ system: '共同課程', department: '共同', division: 'AB0', matric: 'G' },
		{ system: '日間部', department: '機械系', division: '30', matric: '7' },
	];

	it('keeps all matching groups and formal study systems', () => {
		const parsed = parseNtutStudentPrefix('109ab8009');
		expect(findStudentPrefixMatches(parsed, entries)).toEqual(entries.slice(0, 4));
	});

	it('does not infer a study system from the student-number suffix', () => {
		const parsed = parseNtutStudentPrefix('109ab8009');
		const matches = findStudentPrefixMatches(parsed, entries);
		expect(matches.map((entry) => entry.matric)).toEqual(['7', '7', '8', '9']);
	});

	it('matches numeric prefixes and ignores unknown prefixes', () => {
		expect(findStudentPrefixMatches(parseNtutStudentPrefix('9930'), entries)).toEqual([entries[6]]);
		expect(findStudentPrefixMatches(parseNtutStudentPrefix('109ZZ'), entries)).toEqual([]);
		expect(findStudentPrefixMatches(null, entries)).toEqual([]);
	});

	it('normalizes entry values without changing their order or identity', () => {
		const candidates: StandardDepartmentEntry[] = [
			{ system: '日間部', department: '資財系', division: ' ab0 ', matric: ' a ' },
			{ system: '日間部', department: '資財系', division: 'AB2', matric: 'F' },
		];
		const matches = findStudentPrefixMatches(parseNtutStudentPrefix('109ab'), candidates);
		expect(matches).toEqual(candidates);
		expect(matches[0]).toBe(candidates[0]);
	});
});
