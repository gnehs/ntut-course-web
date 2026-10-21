export const PROGRAM_KINDS = {
	mprogram: { label: '微學程', file: 'mprogram.json' },
	program: { label: '一般學程', file: 'programs.json' },
} as const;

export type ProgramKind = keyof typeof PROGRAM_KINDS;

export type ProgramSummary = {
	id: string;
	name: string;
	courseCount: number;
	description?: string;
};

type RawProgram = {
	id: string;
	name: string;
	courses?: string[];
	course?: string[];
	description?: string;
};

type FetchJson = <T>(path: string) => Promise<T>;

export function isProgramKind(value: string): value is ProgramKind {
	return Object.hasOwn(PROGRAM_KINDS, value);
}

export async function findProgram(
	kind: ProgramKind,
	year: string,
	sem: string,
	id: string,
	fetchJson: FetchJson,
): Promise<ProgramSummary | null> {
	const programs = await fetchJson<RawProgram[]>(
		`/${year}/${sem}/${PROGRAM_KINDS[kind].file}`,
	);
	const program = programs.find((item) => item.id === id);
	if (!program) return null;
	return {
		id: program.id,
		name: program.name,
		courseCount: (program.courses ?? program.course ?? []).length,
		description: program.description,
	};
}
