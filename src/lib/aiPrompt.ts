import {
	displayDepartment,
	formatCredit,
	getCourseDisplayTitle,
	parseCourseTime,
} from './courseUtils';
import type { Course } from '../types/course';

const SITE = 'https://ntut-course.gnehs.net';

type CourseAdviceInput = {
	year: string;
	sem: string;
	department: string;
	courses: Course[];
};

function names(items: { name: string }[]) {
	return items.map((item) => item.name).join('、');
}

function courseLine(course: Course) {
	const time = parseCourseTime(course.time)
		.map((slot) => `${slot.title} ${slot.content}`)
		.join('、');
	return [
		`${course.id} ${getCourseDisplayTitle(course)}`,
		`${formatCredit(course.credit)} 學分`,
		names(course.teacher || []),
		time || '無固定時間',
		names(course.classroom || []),
	]
		.filter(Boolean)
		.join('｜');
}

export function buildCourseAdvicePrompt({ year, sem, department, courses }: CourseAdviceInput) {
	const credit = courses.reduce((sum, course) => sum + Number(course.credit || 0), 0);
	return [
		`我是國立臺北科技大學的學生，正在規劃 ${year} 學年度第 ${sem} 學期（${displayDepartment(department)}）的課表。`,
		`請先閱讀 ${SITE}/llms.txt 了解課程資料，再依我目前的課表推薦適合加選的課程，並確認不會衝堂。`,
		'',
		`目前課表（${courses.length} 門，共 ${formatCredit(credit)} 學分）：`,
		...courses.map((course) => `- ${courseLine(course)}`),
		'',
		`推薦時請附上課號、上課時間、學分與課程頁面（${SITE}/course/${year}/${sem}/{課號}）。如果需要知道我的系級或興趣，請先問我。`,
	].join('\n');
}

export const aiChatLinks = [
	{
		name: 'ChatGPT',
		url: (prompt: string) => `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`,
	},
	{
		name: 'Claude',
		url: (prompt: string) => `https://claude.ai/new?q=${encodeURIComponent(prompt)}`,
	},
];
