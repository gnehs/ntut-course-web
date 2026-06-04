import type {
	CalendarCourse,
	Course,
	CourseName,
	CourseTime,
	NamedCourseItem,
	WeekdayKey,
} from '../types/course';

type CourseTitleLike = {
	courseType?: string;
	name?: Partial<CourseName>;
	notes?: string;
	class?: NamedCourseItem[];
};

type SearchableCourse = CourseTitleLike & {
	id?: string;
	teacher?: NamedCourseItem[];
	classroom?: NamedCourseItem[];
};

export const API_BASE = (
	import.meta.env.VITE_API_BASE || 'https://gnehs.github.io/ntut-course-crawler-node'
).replace(/\/$/, '');

export const departmentItems = ['日間部', '進修部', '研究所(日間部、進修部、週末碩士班)'];
export const timetable = ['1', '2', '3', '4', 'N', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D'];
export const timetableWithEnd = [
	'1',
	'2',
	'3',
	'4',
	'N',
	'5',
	'6',
	'7',
	'8',
	'9',
	'A',
	'B',
	'C',
	'D',
];
export const timetableTime = {
	'1': { start: '8:10', end: '9:00' },
	'2': { start: '9:10', end: '10:00' },
	'3': { start: '10:10', end: '11:00' },
	'4': { start: '11:10', end: '12:00' },
	N: { start: '12:10', end: '13:00' },
	'5': { start: '13:10', end: '14:00' },
	'6': { start: '14:10', end: '15:00' },
	'7': { start: '15:10', end: '16:00' },
	'8': { start: '16:10', end: '17:00' },
	'9': { start: '17:10', end: '18:00' },
	A: { start: '18:30', end: '19:20' },
	B: { start: '19:20', end: '20:10' },
	C: { start: '20:20', end: '21:10' },
	D: { start: '21:10', end: '22:00' },
};
export const dateEng2zh: Record<WeekdayKey, string> = {
	sun: '週日',
	mon: '週一',
	tue: '週二',
	wed: '週三',
	thu: '週四',
	fri: '週五',
	sat: '週六',
};
export const courseStandard = {
	'○': '部訂共同必修',
	'△': '校訂共同必修',
	'☆': '共同選修',
	'●': '部訂專業必修',
	'▲': '校訂專業必修',
	'★': '專業選修',
};
export const categoryFilterList = {
	創新與創業: '創新與創業',
	人文與藝術: '人文與藝術',
	社會與法治: '社會與法治',
	自然向度: '自然',
};

export function displayDepartment(department: string) {
	return department === 'main' ? '日間部' : department;
}

export function storageDepartment(value: string) {
	return value === '日間部' ? 'main' : value;
}

export function parseYearSemVal(value: string) {
	const [year, sem] = String(value || '-').split('-');
	return `${year} 年${sem === '1' ? '上' : '下'}學期`;
}

export function trimEllip(value: unknown, length: number) {
	const text = String(value ?? '');
	return text.length > length ? `${text.slice(0, length)}...` : text;
}

export function isSportsCourse(course?: CourseTitleLike | null) {
	return (course?.class || []).some((item) => /體育/.test(item.name));
}

export function getSportsCourseTitle(course?: CourseTitleLike | null) {
	if (!isSportsCourse(course)) return '';
	return (
		String(course?.notes || '')
			.replace(/^\*|\/(.+)|\((.+)\)| |[A-z]/g, '')
			.trim() ||
		course?.name?.zh ||
		''
	);
}

export function getGeneralCourseTags(course: Course) {
	if (!(course?.class || []).some((item) => /^博雅/.test(item.name))) return [];
	const colors: [RegExp, string][] = [
		[/創新與創業|創創/, '#FFC107'],
		[/文化|美學與藝術|人文與藝術/, '#FF5722'],
		[/自然與科學|自然向度/, '#03A9F4'],
		[/社會|法治/, '#2196F3'],
	];
	return String(course?.notes || '')
		.replace(/◎|\*/g, '')
		.split(/106-108：|。109 \(含\) 後：/)
		.map((item) => item.trim())
		.filter(Boolean)
		.map((name) => ({
			name,
			color: colors.find(([pattern]) => pattern.test(name))?.[1] || '#777',
			textColor: '#FFF',
		}));
}

export function getCourseDisplayTitle(course: CourseTitleLike) {
	if (isSportsCourse(course)) return getSportsCourseTitle(course);
	return `${course?.courseType || ''}${course?.name?.zh || ''}`;
}

export function courseTitle(course: CourseTitleLike) {
	return getCourseDisplayTitle(course);
}

export function parseCourseTime(time?: CourseTime) {
	if (!time) return [];
	return (Object.entries(time) as [string, string[]][])
		.filter(([, items]) => items?.length)
		.map(([date, items]) => ({
			title: dateEng2zh[date] || date,
			content: mergeCourseSlots(items),
		}));
}

export function mergeCourseSlots(items: string[]) {
	const sortedTimes = [...items].sort((a, b) => {
		if (a === 'N') return -1;
		if (b === 'N') return 1;
		return a.localeCompare(b);
	});
	const mergedTimes: string[] = [];
	let start = sortedTimes[0];
	let prev = start;
	for (let i = 1; i <= sortedTimes.length; i++) {
		const current = sortedTimes[i];
		if (
			i === sortedTimes.length ||
			current === 'N' ||
			prev === 'N' ||
			Number.parseInt(current, 10) !== Number.parseInt(prev, 10) + 1
		) {
			if (start === 'N' || start === prev) mergedTimes.push(start);
			else mergedTimes.push(`${start}~${prev}`);
			if (i < sortedTimes.length) start = current;
		}
		prev = current;
	}
	return mergedTimes.join('、');
}

export function hasTimeConflict(a: Course, b: Course) {
	if (!a?.time || !b?.time) return false;
	for (const [date, slots] of Object.entries(a.time) as [string, string[]][]) {
		for (const slot of slots || []) {
			if (b.time?.[date]?.includes(slot)) return true;
		}
	}
	return false;
}

export function searchCourseList<T extends SearchableCourse>(courses: T[], keyword: string) {
	const value = keyword.trim().toLowerCase();
	if (!value) return courses;
	if (!Number.isNaN(Number(value)) && value.length >= 3) {
		return courses.filter((course) => course.id?.includes(value));
	}
	const keywords = value.split(' ').filter(Boolean);
	return courses.filter((course) => {
		const haystack = [
			course.id,
			courseTitle(course),
			course.name?.en,
			course.notes,
			...(course.teacher || []).map((x) => x.name),
			...(course.class || []).map((x) => x.name),
			...(course.classroom || []).map((x) => x.name),
		]
			.join(' ')
			.toLowerCase();
		return keywords.every((item) => haystack.includes(item));
	});
}

export function filterPlaceholderCourses<T extends { id?: string }>(courses: T[]) {
	return courses.filter((course) => !String(course.id || '').match(/^placeholder/i));
}

export function createIcsEvent({
	title,
	location,
	start,
	end,
	description,
}: {
	title: string;
	location?: string;
	start: Date;
	end: Date;
	description?: string;
}) {
	const format = (date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
	return [
		'BEGIN:VEVENT',
		`UID:${crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`}@ntut-course-web`,
		`DTSTAMP:${format(new Date())}`,
		`DTSTART:${format(start)}`,
		`DTEND:${format(end)}`,
		`SUMMARY:${title}`,
		`LOCATION:${location || ''}`,
		`DESCRIPTION:${description || ''}`,
		'END:VEVENT',
	].join('\r\n');
}

export function formatIcsDate(date: Date) {
	const pad = (value) => String(value).padStart(2, '0');
	return [
		date.getFullYear(),
		pad(date.getMonth() + 1),
		pad(date.getDate()),
		'T',
		pad(date.getHours()),
		pad(date.getMinutes()),
		pad(date.getSeconds()),
	].join('');
}

export function escapeIcsText(value: unknown) {
	return String(value || '')
		.replaceAll('\\', '\\\\')
		.replaceAll(';', '\\;')
		.replaceAll(',', '\\,')
		.replaceAll('\n', '\\n');
}

export function firstWeekdayOnOrAfter(startDate: string | Date, weekdayKey: string) {
	const order = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
	const date = parseLocalDate(startDate);
	const diff = (order[weekdayKey] - date.getDay() + 7) % 7;
	date.setDate(date.getDate() + diff);
	return date;
}

export function parseLocalDate(value: string | Date) {
	if (value instanceof Date) return new Date(value);
	const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
	return new Date(value);
}

export function buildCourseCalendar({
	courses,
	startDate,
	untilDate,
	year,
	sem,
}: {
	courses: CalendarCourse[];
	startDate: string;
	untilDate: string;
	year: string;
	sem: string;
}) {
	const events: string[] = [];
	for (const course of courses) {
		for (const [weekday, slots] of Object.entries(course.time || {}) as [string, string[]][]) {
			if (!slots.length) continue;
			const startSlot = timetableTime[slots[0]];
			const endSlot = timetableTime[slots[slots.length - 1]];
			if (!startSlot || !endSlot) continue;
			const eventDay = firstWeekdayOnOrAfter(startDate, weekday);
			const [startHour, startMinute] = startSlot.start.split(':').map(Number);
			const [endHour, endMinute] = endSlot.end.split(':').map(Number);
			const begin = new Date(eventDay);
			begin.setHours(startHour, startMinute, 0, 0);
			const stop = new Date(eventDay);
			stop.setHours(endHour, endMinute, 0, 0);
			events.push(
				[
					'BEGIN:VEVENT',
					`UID:${escapeIcsText(`${course.id || course.name}-${weekday}-${slots.join('')}`)}@ntut-course-web`,
					`DTSTAMP;TZID=Asia/Taipei:${formatIcsDate(new Date())}`,
					`DTSTART;TZID=Asia/Taipei:${formatIcsDate(begin)}`,
					`DTEND;TZID=Asia/Taipei:${formatIcsDate(stop)}`,
					`RRULE:FREQ=WEEKLY;INTERVAL=1;UNTIL=${formatIcsDate(parseLocalDate(untilDate))}`,
					`SUMMARY:${escapeIcsText(course.name)}`,
					`DESCRIPTION:${escapeIcsText(course.description)}`,
					`LOCATION:${escapeIcsText(course.classroom)}`,
					`URL:${escapeIcsText(course.link)}`,
					'ORGANIZER;CN=北科課程好朋友:MAILTO:ntut-course-web@gnehs.net',
					'END:VEVENT',
				].join('\r\n'),
			);
		}
	}
	const calendarName = `${year} 學年度${sem === '1' ? '上' : '下'}學期課程`;
	return [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//ntut-course-web//React//ZH-TW',
		'CALSCALE:GREGORIAN',
		'X-WR-TIMEZONE:Asia/Taipei',
		`X-WR-CALNAME:${escapeIcsText(calendarName)}`,
		'X-WR-CALDESC:行事曆資訊由北科課程好朋友產生',
		...events,
		'END:VCALENDAR',
	].join('\r\n');
}
