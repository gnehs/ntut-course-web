// Maps data published before the crawler's field rename onto the new shape. Delete this file, and
// the normalizeDataset calls that import it, once every dataset has been republished.

const syllabusRenames: Record<string, string> = {
	name: 'teacher',
	objective: 'outline',
	延伸教學與資源: 'resources',
	課程對應SDGs指標: 'sdgs',
	課程是否導入AI: 'aiUsage',
};

const syllabusFields = new Set([
	'teacher',
	'email',
	'officeHoursLink',
	'latestUpdate',
	'outline',
	'schedule',
	'scorePolicy',
	'materials',
	'consultation',
	'remarks',
	'resources',
	'sdgs',
	'aiUsage',
	'foreignLanguageTextbooks',
	'covid19',
	'extra',
]);

type Row = Record<string, unknown>;

const isRow = (value: unknown): value is Row =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

function rename(row: Row, renames: Record<string, string>): Row {
	const result: Row = {};
	for (const [key, value] of Object.entries(row)) {
		const next = renames[key] ?? key;
		if (next === key || !(next in row)) result[next] = value;
	}
	return result;
}

function extraText(value: unknown) {
	if (typeof value === 'string') return value;
	if (typeof value === 'boolean') return value ? '是' : '否';
	if (typeof value === 'number' && Number.isFinite(value)) return String(value);
	return undefined;
}

function syllabus(row: Row): Row {
	const { extra, ...renamed } = rename(row, syllabusRenames);
	const result: Row = {};
	const moved: Record<string, string> = {};
	for (const [key, value] of Object.entries(renamed)) {
		if (syllabusFields.has(key)) result[key] = value;
		else {
			const text = extraText(value);
			if (text !== undefined) moved[key] = text;
		}
	}
	const merged = { ...moved, ...(isRow(extra) ? extra : {}) };
	if (Object.keys(merged).length) result.extra = merged;
	return result;
}

const link = (row: Row) => rename(row, { href: 'link' });

function department(group: Row): Row {
	const result = link(group);
	if (Array.isArray(result.class)) result.class = mapRows(result.class, link);
	return result;
}

function microProgram(row: Row): Row {
	return rename(link(row), { course: 'courses' });
}

function mapRows(data: unknown, map: (row: Row) => Row): unknown {
	return Array.isArray(data) ? data.map((row) => (isRow(row) ? map(row) : row)) : data;
}

const datasets: [RegExp, (row: Row) => Row][] = [
	[/(^|\/)course\/[^/]+\.json$/, syllabus],
	[/(^|\/)department\.json$/, department],
	[/(^|\/)mprogram\.json$/, microProgram],
	[/(^|\/)programs\.json$/, link],
	[/(^|\/)competencies\.json$/, link],
];

/** Applies the legacy mapping for the dataset at `path`; other paths and new-shape data pass through. */
export function normalizeDataset<T>(path: string, data: unknown): T {
	const entry = datasets.find(([pattern]) => pattern.test(path));
	return (entry ? mapRows(data, entry[1]) : data) as T;
}
