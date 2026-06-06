export type WithdrawalRateLevel = 'high' | 'normal' | 'low';

export type WithdrawalRateDistribution = {
	mean: number;
	standardDeviation: number;
	highThreshold: number;
	lowThreshold: number;
	sampleSize: number;
};

export type WithdrawalRateClassification = {
	level: WithdrawalRateLevel;
	label: string;
};

const LABELS: Record<WithdrawalRateLevel, string> = {
	high: '高退選率',
	normal: '一般退選率',
	low: '低退選率',
};

export function createWithdrawalRateDistribution(
	values: unknown[],
): WithdrawalRateDistribution | null {
	const rates = values.flatMap((value) => {
		const rate = finiteNumberOrNull(value);
		return rate === null ? [] : [rate];
	});
	if (!rates.length) return null;

	const mean = rates.reduce((sum, value) => sum + value, 0) / rates.length;
	const variance = rates.reduce((sum, value) => sum + (value - mean) ** 2, 0) / rates.length;
	const standardDeviation = Math.sqrt(variance);

	return {
		mean,
		standardDeviation,
		highThreshold: mean + standardDeviation,
		lowThreshold: Math.max(0, mean - standardDeviation),
		sampleSize: rates.length,
	};
}

export function classifyWithdrawalRate(
	value: unknown,
	distribution: WithdrawalRateDistribution | null,
): WithdrawalRateClassification {
	const rate = numberValue(value);
	if (!distribution || distribution.sampleSize < 2 || distribution.standardDeviation === 0) {
		return { level: 'normal', label: LABELS.normal };
	}
	if (rate >= distribution.highThreshold) return { level: 'high', label: LABELS.high };
	if (rate <= distribution.lowThreshold) return { level: 'low', label: LABELS.low };
	return { level: 'normal', label: LABELS.normal };
}

export function formatWithdrawalRate(value: unknown) {
	const rate = numberValue(value);
	return Number.isInteger(rate)
		? String(rate)
		: rate.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

export function formatWithdrawalThreshold(value: number) {
	return `${formatWithdrawalRate(value)}%`;
}

export function numberValue(value: unknown) {
	const number = Number(value);
	return Number.isFinite(number) ? number : 0;
}

function finiteNumberOrNull(value: unknown) {
	if (value === null || value === undefined) return null;
	if (typeof value === 'string' && value.trim() === '') return null;
	const number = Number(value);
	return Number.isFinite(number) ? number : null;
}
