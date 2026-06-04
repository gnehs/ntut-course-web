export type WeekdayKey = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

export type CourseTime = Partial<Record<WeekdayKey | string, string[]>>;

export type NamedCourseItem = {
	id?: string;
	name: string;
	link?: string;
};

export type CourseName = {
	zh: string;
	en?: string;
};

export type CourseDescription = {
	zh: string;
	en: string;
};

export type SyllabusItem = {
	name?: string;
	filename?: string;
	url?: string;
	text?: string;
	semester?: string;
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
	courseDescriptionLink: string;
	syllabusLinks: SyllabusItem[];
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
	href?: string;
};

export type DepartmentGroup = {
	category: string;
	name: string;
	href: string;
	class?: DepartmentClass[];
};

export type YearSemData = Record<string, number[]>;

export type WithdrawalRateMap = Record<string, number>;

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
	href?: string;
	courses?: string[];
	course?: string[];
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
	course?: Course;
};
