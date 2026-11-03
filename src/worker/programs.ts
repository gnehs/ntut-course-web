import {
	findGeneralProgramDocs,
	findMicroProgramDocs,
	type ProgramDocsDataset,
} from '../lib/programDocs';
import type { MicroProgramDocs, ProgramDocs } from '../types/course';

export const PROGRAM_KINDS = {
	mprogram: { label: '微學程', file: 'mprogram.json', docs: 'mprogram-docs.json' },
	program: { label: '一般學程', file: 'programs.json', docs: 'program-docs.json' },
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
		description: program.description || (await findIntro(kind, program, fetchJson)),
	};
}

// The documents dataset only adds an intro, so a missing or broken file keeps the fallback text.
async function findIntro(kind: ProgramKind, program: RawProgram, fetchJson: FetchJson) {
	const path = `/${PROGRAM_KINDS[kind].docs}`;
	try {
		const docs =
			kind === 'mprogram'
				? findMicroProgramDocs(await fetchJson<ProgramDocsDataset<MicroProgramDocs>>(path), program.id)
				: findGeneralProgramDocs(
						await fetchJson<ProgramDocsDataset<ProgramDocs>>(path),
						program.id,
						program.name,
					);
		return docs?.intro ?? undefined;
	} catch {
		return undefined;
	}
}
