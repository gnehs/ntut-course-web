type QueryInputValue =
	| string
	| number
	| boolean
	| bigint
	| null
	| undefined
	| Record<string, unknown>
	| unknown[];

type QueryInput = Record<string, QueryInputValue>;

export function createSearchParams(search: URLSearchParams | string | Record<string, unknown> | null | undefined) {
	if (search instanceof URLSearchParams) return new URLSearchParams(search);
	if (typeof search === 'string') return new URLSearchParams(search);
	if (!search || typeof search !== 'object') return new URLSearchParams();

	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(search)) {
		const serialized = serializeQueryValue(value);
		if (serialized === null) continue;
		params.set(key, serialized);
	}
	return params;
}

export function createSearchObject(params: QueryInput): QueryInput {
	const search: QueryInput = {};
	for (const [key, value] of Object.entries(params)) {
		if (value === undefined || value === null || value === '') continue;
		search[key] = value;
	}
	return search;
}

function serializeQueryValue(value: QueryInputValue | unknown) {
	if (value === undefined || value === null || value === '') return null;
	if (typeof value === 'string') return value;
	if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint')
		return String(value);
	return JSON.stringify(value);
}
