import type { MicroProgramDocs, ProgramDocs } from '../types/course';

export type ProgramDocsDataset<T> = { programs: T[] };

// The 教務處 page writes names loosely (「工業4.0_電資學程」 vs APS 「工業 4.0 電資學程」).
function programNameKey(name: string) {
	return name.replace(/[\s_\-‧・.()（）與]/g, '');
}

export function findMicroProgramDocs(
	dataset: ProgramDocsDataset<MicroProgramDocs> | null,
	id: string,
): MicroProgramDocs | null {
	const code = id.toUpperCase();
	return dataset?.programs.find((program) => program.id === code) ?? null;
}

export function findGeneralProgramDocs(
	dataset: ProgramDocsDataset<ProgramDocs> | null,
	id: string,
	name: string,
): ProgramDocs | null {
	const programs = dataset?.programs ?? [];
	const key = programNameKey(name);
	return (
		programs.find((program) => program.code === id) ??
		programs.find((program) => programNameKey(program.name) === key) ??
		null
	);
}
