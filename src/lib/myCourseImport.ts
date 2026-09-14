const dataKeyPattern = /^my-couse-data-(\d{1,6})-([12])(?:-(.+))?$/u;
const classKeyPattern = /^my-couse-class-(\d{1,6})-([12])$/u;
const mprogramKeyPattern = /^my-couse-mprogram-(\d{1,6})-([12])$/u;
const departmentPattern = /^[\p{L}\p{N}()[\]、，,._/ -]+$/u;

export const MY_COURSE_BACKUP_FORMAT = 'ntut-course-my-course-backup';
export const MY_COURSE_BACKUP_VERSION = 2;

export type MyCourseImportPayload = {
	key: string;
	data: string | null;
	classKey: string;
	classData: string | null;
};

export type ParsedMyCourseImport = Omit<MyCourseImportPayload, 'data'> & {
	data: string;
	courseIds: string[];
};

export type MyCourseBackupCourseEntry = {
	key: string;
	courseIds: string[];
};

export type MyCourseBackupClassEntry = {
	key: string;
	classData: string | null;
};

export type MyCourseBackupMProgramEntry = {
	key: string;
	programName: string | null;
};

export type MyCourseBackupPayload = {
	format: typeof MY_COURSE_BACKUP_FORMAT;
	version: typeof MY_COURSE_BACKUP_VERSION;
	exportedAt: string;
	courses: MyCourseBackupCourseEntry[];
	classes: MyCourseBackupClassEntry[];
	mprograms: MyCourseBackupMProgramEntry[];
};

export type ParsedMyCourseBackup = {
	payload: MyCourseBackupPayload;
	legacy: boolean;
	semesterCount: number;
	courseCount: number;
};

export type MyCourseBackupTermSummary = {
	year: string;
	sem: '1' | '2';
	courseCount: number;
	classCount: number;
	mprogramCount: number;
};

export type MyCourseBackupMergeResult = {
	addedCourseCount: number;
	mergedCourseCount: number;
	classConflictCount: number;
	mprogramConflictCount: number;
	termSummaries: MyCourseBackupTermSummary[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireProperty(payload: Record<string, unknown>, key: keyof MyCourseImportPayload) {
	if (!Object.prototype.hasOwnProperty.call(payload, key)) {
		throw new Error('匯入資料缺少必要欄位');
	}
	return payload[key];
}

type StorageKeyParts = {
	year: string;
	sem: '1' | '2';
	department?: string;
};

function parseStorageKey(
	key: string,
	pattern: RegExp,
	kind: 'data' | 'class' | 'mprogram',
): StorageKeyParts {
	const match = key.match(pattern);
	if (!match) throw new Error('匯入資料的儲存鍵無效');
	if (kind === 'data' && match[3] && (match[3] === 'main' || !departmentPattern.test(match[3]))) {
		throw new Error('匯入資料的學制無效');
	}
	return { year: match[1], sem: match[2] as '1' | '2', department: match[3] };
}

function parseCourseIds(data: string | null) {
	if (data === null) return [];
	let courseIds: unknown;
	try {
		courseIds = JSON.parse(data);
	} catch {
		throw new Error('匯入資料的課程清單不是有效的 JSON');
	}
	if (
		!Array.isArray(courseIds) ||
		!courseIds.every((courseId) => typeof courseId === 'string' && courseId.trim().length > 0)
	) {
		throw new Error('匯入資料的課程清單格式無效');
	}
	return [...new Set(courseIds as string[])];
}

function ensureUniqueKeys(entries: Array<{ key: string }>, label: string) {
	const keys = new Set<string>();
	for (const entry of entries) {
		if (keys.has(entry.key)) throw new Error(`匯入資料含有重複的${label}`);
		keys.add(entry.key);
	}
}

function parseBackupPayload(payload: unknown): MyCourseBackupPayload {
	if (!isRecord(payload)) throw new Error('匯入資料格式無效');
	if (payload.format !== MY_COURSE_BACKUP_FORMAT || payload.version !== MY_COURSE_BACKUP_VERSION) {
		throw new Error('不支援的我的課程備份格式');
	}
	if (typeof payload.exportedAt !== 'string' || !payload.exportedAt.trim()) {
		throw new Error('匯入資料缺少備份時間');
	}
	if (!Array.isArray(payload.courses) || !Array.isArray(payload.classes)) {
		throw new Error('匯入資料缺少課程或班級資料');
	}
	if (payload.mprograms !== undefined && !Array.isArray(payload.mprograms)) {
		throw new Error('匯入資料的微學程資料格式無效');
	}

	const courses: MyCourseBackupCourseEntry[] = payload.courses.map((entry) => {
		if (!isRecord(entry) || typeof entry.key !== 'string' || !Array.isArray(entry.courseIds)) {
			throw new Error('匯入資料的課程項目格式無效');
		}
		parseStorageKey(entry.key, dataKeyPattern, 'data');
		if (
			!entry.courseIds.every(
				(courseId) => typeof courseId === 'string' && courseId.trim().length > 0,
			)
		) {
			throw new Error('匯入資料的課程清單格式無效');
		}
		return { key: entry.key, courseIds: [...new Set(entry.courseIds as string[])] };
	});
	const classes: MyCourseBackupClassEntry[] = payload.classes.map((entry) => {
		if (!isRecord(entry) || typeof entry.key !== 'string') {
			throw new Error('匯入資料的班級項目格式無效');
		}
		parseStorageKey(entry.key, classKeyPattern, 'class');
		if (entry.classData !== null && typeof entry.classData !== 'string') {
			throw new Error('匯入資料的班級資料無效');
		}
		if (typeof entry.classData === 'string' && !entry.classData.trim()) {
			throw new Error('匯入資料的班級資料無效');
		}
		return { key: entry.key, classData: entry.classData as string | null };
	});
	const mprograms: MyCourseBackupMProgramEntry[] = (payload.mprograms || []).map((entry) => {
		if (!isRecord(entry) || typeof entry.key !== 'string') {
			throw new Error('匯入資料的微學程項目格式無效');
		}
		parseStorageKey(entry.key, mprogramKeyPattern, 'mprogram');
		if (entry.programName !== null && typeof entry.programName !== 'string') {
			throw new Error('匯入資料的微學程資料無效');
		}
		if (typeof entry.programName === 'string' && !entry.programName.trim()) {
			throw new Error('匯入資料的微學程資料無效');
		}
		return { key: entry.key, programName: entry.programName as string | null };
	});
	ensureUniqueKeys(courses, '課程儲存鍵');
	ensureUniqueKeys(classes, '班級儲存鍵');
	ensureUniqueKeys(mprograms, '微學程儲存鍵');

	return {
		format: MY_COURSE_BACKUP_FORMAT,
		version: MY_COURSE_BACKUP_VERSION,
		exportedAt: payload.exportedAt,
		courses,
		classes,
		mprograms,
	};
}

function toUnknownPayload(raw: string) {
	try {
		return JSON.parse(raw) as unknown;
	} catch {
		throw new Error('匯入資料不是有效的 JSON');
	}
}

function termKey(parts: Pick<StorageKeyParts, 'year' | 'sem'>) {
	return `${parts.year}-${parts.sem}`;
}

function sortEntries<T extends { key: string }>(entries: T[]) {
	return [...entries].sort((left, right) => left.key.localeCompare(right.key));
}

/**
 * Collect only the localStorage keys owned by the saved-course features.
 * Preferences, cached API data, and other application keys are deliberately omitted.
 */
export function createMyCourseBackup(
	storage: Storage = globalThis.localStorage,
): MyCourseBackupPayload {
	const courses: MyCourseBackupCourseEntry[] = [];
	const classes: MyCourseBackupClassEntry[] = [];
	const mprograms: MyCourseBackupMProgramEntry[] = [];

	for (let index = 0; index < storage.length; index += 1) {
		const key = storage.key(index);
		if (!key) continue;
		if (dataKeyPattern.test(key)) {
			courses.push({ key, courseIds: parseCourseIds(storage.getItem(key)) });
			continue;
		}
		if (classKeyPattern.test(key)) {
			const classData = storage.getItem(key);
			if (classData !== null && !classData.trim()) throw new Error('現有班級資料無效');
			classes.push({ key, classData });
			continue;
		}
		if (mprogramKeyPattern.test(key)) {
			const programName = storage.getItem(key);
			if (programName !== null && !programName.trim()) throw new Error('現有微學程資料無效');
			mprograms.push({ key, programName });
		}
	}

	return {
		format: MY_COURSE_BACKUP_FORMAT,
		version: MY_COURSE_BACKUP_VERSION,
		exportedAt: new Date().toISOString(),
		courses: sortEntries(courses),
		classes: sortEntries(classes),
		mprograms: sortEntries(mprograms),
	};
}

export function serializeMyCourseBackup(payload: MyCourseBackupPayload) {
	return JSON.stringify(payload, null, 2);
}

function parsedBackup(payload: MyCourseBackupPayload, legacy: boolean): ParsedMyCourseBackup {
	const termSummaries = summarizeMyCourseBackup({
		payload,
		legacy,
		semesterCount: 0,
		courseCount: 0,
	});
	return {
		payload,
		legacy,
		semesterCount: termSummaries.length,
		courseCount: payload.courses.reduce((sum, entry) => sum + entry.courseIds.length, 0),
	};
}

/**
 * Parse the current versioned backup format or the old one-semester prompt payload.
 * Parsing is intentionally side-effect free so previewing a file cannot alter storage.
 */
export function parseMyCourseBackup(raw: string): ParsedMyCourseBackup {
	const payload = toUnknownPayload(raw);
	if (isRecord(payload) && Object.prototype.hasOwnProperty.call(payload, 'format')) {
		return parsedBackup(parseBackupPayload(payload), false);
	}

	const legacy = parseMyCourseImport(raw);
	return parsedBackup(
		{
			format: MY_COURSE_BACKUP_FORMAT,
			version: MY_COURSE_BACKUP_VERSION,
			exportedAt: new Date(0).toISOString(),
			courses: [{ key: legacy.key, courseIds: legacy.courseIds }],
			classes: [{ key: legacy.classKey, classData: legacy.classData }],
			mprograms: [],
		},
		true,
	);
}

export function summarizeMyCourseBackup(parsed: ParsedMyCourseBackup): MyCourseBackupTermSummary[] {
	const terms = new Map<string, MyCourseBackupTermSummary>();
	const ensure = (parts: StorageKeyParts) => {
		const key = termKey(parts);
		const current = terms.get(key);
		if (current) return current;
		const created = {
			year: parts.year,
			sem: parts.sem,
			courseCount: 0,
			classCount: 0,
			mprogramCount: 0,
		};
		terms.set(key, created);
		return created;
	};

	for (const entry of parsed.payload.courses) {
		const parts = parseStorageKey(entry.key, dataKeyPattern, 'data');
		ensure(parts).courseCount += entry.courseIds.length;
	}
	for (const entry of parsed.payload.classes) {
		const parts = parseStorageKey(entry.key, classKeyPattern, 'class');
		ensure(parts).classCount += entry.classData === null ? 0 : 1;
	}
	for (const entry of parsed.payload.mprograms) {
		const parts = parseStorageKey(entry.key, mprogramKeyPattern, 'mprogram');
		ensure(parts).mprogramCount += entry.programName === null ? 0 : 1;
	}

	return [...terms.values()].sort((left, right) => {
		const yearDifference = Number(right.year) - Number(left.year);
		return yearDifference || Number(right.sem) - Number(left.sem);
	});
}

function readExistingCourseIds(storage: Storage, key: string) {
	try {
		return parseCourseIds(storage.getItem(key));
	} catch {
		throw new Error(`現有課程資料無效，無法安全合併（${key}）`);
	}
}

/**
 * Merge a validated backup without removing existing courses.
 * Existing class and micro-program selections win when they conflict with the backup.
 * All writes are rolled back if a storage write fails partway through.
 */
export function mergeMyCourseBackup(
	parsed: ParsedMyCourseBackup,
	storage: Storage = globalThis.localStorage,
): MyCourseBackupMergeResult {
	const { payload } = parsed;
	const plannedWrites: Array<{ key: string; value: string | null }> = [];
	let addedCourseCount = 0;
	let mergedCourseCount = 0;
	let classConflictCount = 0;
	let mprogramConflictCount = 0;

	for (const entry of payload.courses) {
		const existing = readExistingCourseIds(storage, entry.key);
		const merged = [...new Set([...existing, ...entry.courseIds])];
		addedCourseCount += merged.length - existing.length;
		mergedCourseCount += merged.length;
		const serialized = JSON.stringify(merged);
		if (storage.getItem(entry.key) !== serialized)
			plannedWrites.push({ key: entry.key, value: serialized });
	}

	for (const entry of payload.classes) {
		const existing = storage.getItem(entry.key);
		if (existing === null && entry.classData !== null) {
			plannedWrites.push({ key: entry.key, value: entry.classData });
		} else if (existing !== null && entry.classData !== null && existing !== entry.classData) {
			classConflictCount += 1;
		}
	}

	for (const entry of payload.mprograms) {
		const existing = storage.getItem(entry.key);
		if (existing === null && entry.programName !== null) {
			plannedWrites.push({ key: entry.key, value: entry.programName });
		} else if (existing !== null && entry.programName !== null && existing !== entry.programName) {
			mprogramConflictCount += 1;
		}
	}

	const originals = plannedWrites.map(({ key }) => ({ key, value: storage.getItem(key) }));
	try {
		for (const write of plannedWrites) {
			if (write.value === null) storage.removeItem(write.key);
			else storage.setItem(write.key, write.value);
		}
	} catch (error) {
		for (const original of originals) {
			try {
				if (original.value === null) storage.removeItem(original.key);
				else storage.setItem(original.key, original.value);
			} catch {
				// Continue restoring every key before reporting the original write failure.
			}
		}
		throw error;
	}

	return {
		addedCourseCount,
		mergedCourseCount,
		classConflictCount,
		mprogramConflictCount,
		termSummaries: summarizeMyCourseBackup(parsed),
	};
}

/**
 * Parse and validate the format generated by MyCoursePage's export action.
 * No storage is accessed while parsing, so malformed input cannot mutate data.
 */
export function parseMyCourseImport(raw: string): ParsedMyCourseImport {
	let payload: unknown;
	try {
		payload = JSON.parse(raw);
	} catch {
		throw new Error('匯入資料不是有效的 JSON');
	}
	if (!isRecord(payload)) throw new Error('匯入資料格式無效');

	const key = requireProperty(payload, 'key');
	const data = requireProperty(payload, 'data');
	const classKey = requireProperty(payload, 'classKey');
	const classData = requireProperty(payload, 'classData');
	if (typeof key !== 'string' || typeof classKey !== 'string') {
		throw new Error('匯入資料的儲存鍵無效');
	}
	if (typeof data !== 'string' && data !== null) {
		throw new Error('匯入資料的課程清單無效');
	}
	if (typeof classData !== 'string' && classData !== null) {
		throw new Error('匯入資料的班級資料無效');
	}
	if (typeof classData === 'string' && !classData.trim()) {
		throw new Error('匯入資料的班級資料無效');
	}

	const dataKey = parseStorageKey(key, dataKeyPattern, 'data');
	const savedClassKey = parseStorageKey(classKey, classKeyPattern, 'class');
	if (dataKey.year !== savedClassKey.year || dataKey.sem !== savedClassKey.sem) {
		throw new Error('匯入資料的學期不一致');
	}

	let courseIds: unknown = [];
	if (data !== null) {
		try {
			courseIds = JSON.parse(data);
		} catch {
			throw new Error('匯入資料的課程清單不是有效的 JSON');
		}
	}
	if (
		!Array.isArray(courseIds) ||
		!courseIds.every((courseId) => typeof courseId === 'string' && courseId.trim().length > 0)
	) {
		throw new Error('匯入資料的課程清單格式無效');
	}

	return {
		key,
		data: data ?? JSON.stringify([]),
		classKey,
		classData,
		courseIds,
	};
}

/**
 * Apply a previously validated import as one best-effort transaction.
 * If either key cannot be written, restore both keys to their original values.
 */
export function writeMyCourseImport(
	imported: ParsedMyCourseImport,
	storage: Storage = globalThis.localStorage,
) {
	const entries = [
		{ key: imported.key, value: storage.getItem(imported.key) },
		{ key: imported.classKey, value: storage.getItem(imported.classKey) },
	];

	try {
		storage.setItem(imported.key, imported.data);
		if (imported.classData === null) storage.removeItem(imported.classKey);
		else storage.setItem(imported.classKey, imported.classData);
	} catch (error) {
		for (const entry of entries) {
			try {
				if (entry.value === null) storage.removeItem(entry.key);
				else storage.setItem(entry.key, entry.value);
			} catch {
				// Keep attempting to restore the other key, then report the original failure.
			}
		}
		throw error;
	}
}

export function importMyCourseData(raw: string, storage: Storage = globalThis.localStorage) {
	const imported = parseMyCourseImport(raw);
	writeMyCourseImport(imported, storage);
	return imported;
}
