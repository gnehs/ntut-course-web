export type ClassChip = { name: string; label: string };

export type ClassGroup =
	| { kind: 'grades'; prefix: string; rows: { label: string; items: ClassChip[] }[] }
	| { kind: 'series'; prefix: string; items: ClassChip[] }
	| { kind: 'variants'; prefix: string; base?: string; items: ClassChip[] }
	| { kind: 'single'; name: string };

const DIGITS = '一二三四五六七八九';
const SECTIONS = '甲乙丙丁戊';
const seriesPattern = new RegExp(
	`^(.+?)(?:\\(([${DIGITS}十]+)\\)|([${DIGITS}十]+))([${SECTIONS}])?$`,
);
const variantPattern = /^(.+?)[－—](.+)$/;

export function chineseNumeral(text: string) {
	const [tens, ones] = text.includes('十') ? text.split('十') : ['', text];
	const digit = (char: string) => DIGITS.indexOf(char) + 1;
	if (!text.includes('十')) return digit(ones);
	return (tens ? digit(tens) : 1) * 10 + (ones ? digit(ones) : 0);
}

type Parsed =
	| { kind: 'series'; prefix: string; numeral: string; section?: string }
	| { kind: 'variant'; prefix: string; suffix: string };

function parse(name: string): Parsed | null {
	const series = name.match(seriesPattern);
	if (series) {
		const [, prefix, bracketed, bare, section] = series;
		return { kind: 'series', prefix, numeral: bracketed || bare, section };
	}
	const variant = name.match(variantPattern);
	if (variant) return { kind: 'variant', prefix: variant[1], suffix: variant[2] };
	return null;
}

/**
 * Folds a department's class names into the shapes they repeat in: a grade × section grid
 * (化工一甲), a numbered series (體育專項(三)), or one class offered by several schools
 * (跨校選課(大)－國立臺北大學). A shape needs two members; anything else stays a single link.
 */
export function groupClassNames(names: string[]): ClassGroup[] {
	const buckets = new Map<string, { name: string; parsed: Parsed }[]>();
	for (const name of names) {
		const parsed = parse(name);
		if (!parsed) continue;
		const key = `${parsed.kind}:${parsed.prefix}`;
		buckets.set(key, [...(buckets.get(key) || []), { name, parsed }]);
	}
	const grouped = new Map<string, ClassGroup>();
	const claimed = new Set<string>();
	for (const [key, members] of buckets) {
		if (members.length < 2) continue;
		const prefix = members[0].parsed.prefix;
		for (const { name } of members) claimed.add(name);
		if (members[0].parsed.kind === 'variant') {
			const base = names.includes(prefix) ? prefix : undefined;
			if (base) claimed.add(base);
			grouped.set(key, {
				kind: 'variants',
				prefix,
				base,
				items: members.map(({ name, parsed }) => ({
					name,
					label: parsed.kind === 'variant' ? parsed.suffix : name,
				})),
			});
			continue;
		}
		const series = members.map(({ name, parsed }) => {
			const { numeral, section } = parsed as Extract<Parsed, { kind: 'series' }>;
			return { name, numeral, section, value: chineseNumeral(numeral) };
		});
		series.sort(
			(a, b) =>
				a.value - b.value || SECTIONS.indexOf(a.section || '') - SECTIONS.indexOf(b.section || ''),
		);
		if (series.some((item) => item.section)) {
			const rows: { label: string; items: ClassChip[] }[] = [];
			for (const item of series) {
				const label = `${item.numeral}年級`;
				let row = rows.find((candidate) => candidate.label === label);
				if (!row) rows.push((row = { label, items: [] }));
				row.items.push({ name: item.name, label: item.section || item.name });
			}
			grouped.set(key, { kind: 'grades', prefix, rows });
		} else {
			grouped.set(key, {
				kind: 'series',
				prefix,
				items: series.map((item) => ({ name: item.name, label: item.numeral })),
			});
		}
	}
	// Groups keep the position of their first member so the page follows the source order.
	const result: ClassGroup[] = [];
	const placed = new Set<string>();
	for (const name of names) {
		if (!claimed.has(name)) {
			result.push({ kind: 'single', name });
			continue;
		}
		const parsed = parse(name);
		const key = parsed ? `${parsed.kind}:${parsed.prefix}` : `variant:${name}`;
		if (placed.has(key) || !grouped.has(key)) continue;
		placed.add(key);
		result.push(grouped.get(key)!);
	}
	return result;
}
