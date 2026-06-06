import { describe, expect, it } from 'vitest';
import {
	classifyWithdrawalRate,
	createWithdrawalRateDistribution,
	formatWithdrawalRate,
} from './withdrawalStats';

describe('withdrawalStats', () => {
	it('calculates normal distribution thresholds from withdrawal rates', () => {
		const distribution = createWithdrawalRateDistribution([1, 2, 3, 4, 5]);

		expect(distribution).toMatchObject({
			mean: 3,
			sampleSize: 5,
		});
		expect(distribution?.standardDeviation).toBeCloseTo(Math.sqrt(2));
		expect(distribution?.lowThreshold).toBeCloseTo(3 - Math.sqrt(2));
		expect(distribution?.highThreshold).toBeCloseTo(3 + Math.sqrt(2));
	});

	it('keeps zero rates but ignores empty values', () => {
		const distribution = createWithdrawalRateDistribution([0, '', null, undefined, 2]);

		expect(distribution).toMatchObject({
			mean: 1,
			sampleSize: 2,
		});
	});

	it('classifies rates by one standard deviation from the mean', () => {
		const distribution = createWithdrawalRateDistribution([1, 2, 3, 4, 5]);

		expect(classifyWithdrawalRate(5, distribution).level).toBe('high');
		expect(classifyWithdrawalRate(3, distribution).level).toBe('normal');
		expect(classifyWithdrawalRate(1, distribution).level).toBe('low');
	});

	it('falls back to normal when the distribution is not meaningful', () => {
		const distribution = createWithdrawalRateDistribution([2, 2, 2]);

		expect(classifyWithdrawalRate(10, distribution).level).toBe('normal');
		expect(classifyWithdrawalRate(0, null).level).toBe('normal');
	});

	it('formats rates without unnecessary trailing zeroes', () => {
		expect(formatWithdrawalRate(3)).toBe('3');
		expect(formatWithdrawalRate(2.5)).toBe('2.5');
		expect(formatWithdrawalRate(1.234)).toBe('1.23');
	});
});
