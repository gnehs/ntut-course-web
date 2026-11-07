export type WeekdayKey = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

export type CourseTime = Partial<Record<WeekdayKey | string, string[]>>;

export type NamedCourseItem = {
	id?: string;
	code?: string;
	name: string;
	link?: string;
};

export type CourseName = {
	zh: string;
	en?: string | null;
};

export type CourseDescription = {
	zh: string;
	en: string;
};

export type SyllabusItem = {
	teacher?: string;
	email?: string;
	officeHoursLink?: string;
	latestUpdate?: string;
	outline?: string;
	schedule?: string;
	scorePolicy?: string;
	materials?: string;
	consultation?: string;
	remarks?: string;
	resources?: string;
	sdgs?: string;
	aiUsage?: string;
	foreignLanguageTextbooks?: boolean | null;
	covid19?: CovidCourseInfo | null;
	/** Rows the school's form added that have no field of their own, keyed by their Chinese label. */
	extra?: Record<string, string>;
};

export type CovidCourseInfo = {
	[field: string]: string | null | undefined;
	lv2Method?: string | null;
	lv2Description?: string | null;
	courseScoreMethod?: string | null;
	courseInfo?: string | null;
	courseURL?: string | null;
	contactInfo?: string | null;
	additionalInfo?: string | null;
};

export type Course = {
	code: string;
	id: string;
	courseType: string;
	name?: CourseName;
	credit: string;
	hours: string;
	description: CourseDescription;
	notes: string;
	stage: string;
	time: CourseTime;
	teacher: NamedCourseItem[];
	class: NamedCourseItem[];
	classroom: NamedCourseItem[];
	people: string;
	peopleWithdraw: string;
	ta: NamedCourseItem[];
	language: string;
	audit?: string;
	lab?: string;
	interdisciplinary?: string;
	courseDescriptionLink: string;
	syllabusLinks: string[];
	syllabus?: SyllabusItem[];
};

export type CalendarCourse = {
	id: string;
	courseType?: string;
	name: string;
	description: string;
	time?: CourseTime;
	teacher?: string;
	classroom?: string;
	link: string;
};

export type DepartmentClass = {
	id: string;
	name: string;
	department?: string;
	year?: string;
	sem?: string;
	description?: string;
	link?: string;
};

export type DepartmentGroup = {
	category: string;
	name: string;
	link: string;
	class?: DepartmentClass[];
};

export type YearSemData = Record<string, number[]>;

export type WithdrawalRateMap = Record<string, string | number>;

export type WithdrawalStat = {
	name: string;
	title?: string;
	value?: string | number;
	rate?: number;
	rate_percent?: string | number;
	withdraw?: string | number;
	people?: string | number;
	course?: TeacherWithdrawalCourse[];
};

export type TeacherWithdrawalCourse = {
	id: string;
	year: string;
	sem: string;
	department: string;
	courseType?: string;
	name?: CourseName;
	peopleWithdraw?: string | number;
	people?: string | number;
};

export type WithdrawalResponse = {
	data?: WithdrawalStat[];
	stat?: WithdrawalStat[] | Record<string, string | number>;
};

/** A day off, as `YYYY-MM-DD`. */
export type Holiday = {
	date: string;
	name: string;
};

export type CalendarEvent = {
	type: string;
	uid?: string;
	summary?: string;
	start: string;
	end: string;
	datetype?: string;
	dtstamp?: string;
	created?: string;
	description?: string;
	location?: string;
	lastmodified?: string;
	sequence?: number;
	status?: string;
	transparency?: string;
	method?: string;
};

export type StandardCourse = {
	type: string;
	name: string;
	credit: string | number;
	year?: string;
	sem?: string;
};

export type StandardDepartment = {
	division?: string;
	matric?: string;
	credits?: Record<string, string | number>;
	rules?: string[];
	courses?: StandardCourse[];
};

export type StandardYearData = Record<string, Record<string, StandardDepartment>>;

export type GroupedStandardDepartment = Omit<StandardDepartment, 'courses'> & {
	courses?: Record<string, Record<string, StandardCourse[]>>;
};

export type MicroProgram = {
	id: string;
	name: string;
	link?: string;
	courses: string[];
};

/** Scraped from the 教務處 pages and each program's 施行細則 PDF. */
type ProgramDocsBase = {
	name: string;
	rules: string | null;
	plan: string | null;
	apply: string | null;
	intro: string | null;
};

/** One entry of `mprogram-docs.json`. */
export type MicroProgramDocs = ProgramDocsBase & {
	id: string;
};

/** One entry of `program-docs.json`; most rows carry no APS code, so they match by name. */
export type ProgramDocs = ProgramDocsBase & {
	code: string | null;
};

export type Program = {
	id: string;
	name: string;
	link: string;
	courses: string[];
	description?: string;
};

export type CompetencyDepartment = {
	id: string;
	name: string;
	link: string;
	abilities: { id: string; name: string }[];
	courses: { code: string; name: string; abilityIds: string[] }[];
};

export type WorkflowRun = {
	id: number;
	html_url: string;
	status: string;
	event: string;
	name: string;
	created_at: string;
};

export type QueryValue = string | number | boolean | string[] | Record<string, unknown>;

export type SearchHistoryItem = {
	id?: string;
	key?: string;
	to?: string;
	category?: string;
	text?: string;
	description?: string;
	history?: boolean;
	transient?: boolean;
	course?: Course;
};
