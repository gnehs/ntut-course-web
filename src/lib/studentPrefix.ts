/** The part of a student number that can be used to find standard departments. */
export type ParsedStudentPrefix = {
	year: string;
	departmentCode: string;
};

/** A standard-department entry exposed by the crawler or its generated index. */
export type StandardDepartmentEntry = {
	system: string;
	department: string;
	division: string;
	matric: string;
};

// These are the formal study systems. Program/common-course entries use other
// matric values and should not be suggested from a student-number prefix.
const FORMAL_MATRIC_CODES = new Set(['5', '7', '8', '9', 'A', 'D', 'F']);

// The standard-course data covers modern ROC years. Keeping this range
// explicit makes numeric two-digit prefixes unambiguous without depending on
// the current date or guessing from the trailing student-number digits.
const STUDENT_PREFIX_PATTERN = /^(8\d|9\d|1\d{2})([A-Z0-9]{2})\d*$/;

/**
 * Parse a Taiwan ROC student-number prefix.
 *
 * The input is an ROC year (two or three digits), followed by a two-character
 * alphanumeric department code. A complete student number may append digits;
 * those digits are intentionally ignored because they do not identify the
 * study system reliably.
 */
export function parseNtutStudentPrefix(input: string): ParsedStudentPrefix | null {
	const value = input.trim().toUpperCase();
	const match = STUDENT_PREFIX_PATTERN.exec(value);
	if (!match) return null;

	return {
		year: match[1],
		departmentCode: match[2],
	};
}

/**
 * Find every formal standard-department entry belonging to a parsed prefix.
 *
 * A department prefix can occur in several study systems or groups. Keep all
 * such entries and leave the eventual system choice to the caller.
 */
export function findStudentPrefixMatches(
	parsed: ParsedStudentPrefix | null,
	entries: readonly StandardDepartmentEntry[],
): StandardDepartmentEntry[] {
	if (!parsed) return [];

	const departmentCode = parsed.departmentCode.trim().toUpperCase();
	if (!/^[A-Z0-9]{2}$/.test(departmentCode)) return [];

	return entries.filter((entry) => {
		const matric = String(entry.matric ?? '')
			.trim()
			.toUpperCase();
		if (!FORMAL_MATRIC_CODES.has(matric)) return false;

		return (
			String(entry.division ?? '')
				.trim()
				.slice(0, 2)
				.toUpperCase() === departmentCode
		);
	});
}
