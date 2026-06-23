import { useEffect } from 'react';
import { getSportsCourseTitle, isSportsCourse } from './courseUtils';
import type { Course } from '../types/course';

export const SITE_TITLE = '北科課程好朋友';

const routeTitles: [RegExp, string][] = [
	[/^\/advanced-search\/?$/, '搜尋'],
	[/^\/class\/?$/, '班級課表'],
	[/^\/mprogram\/?$/, '微學程'],
	[/^\/my-course\/?$/, '我的課程'],
	[/^\/emptyroom\/?$/, '尋找空教室'],
	[/^\/withdrawal\/?$/, '退選率'],
	[/^\/calendar\/?$/, '行事曆'],
	[/^\/standard\/?$/, '課程標準'],
	[/^\/widget\/?$/, 'iOS 小工具'],
	[/^\/add-calendar\/?$/, '新增課程到行事曆'],
	[/^\/doc\/?$/, '文件'],
	[/^\/about\/?$/, '關於'],
	[/^\/privacy\/?$/, '隱私權政策'],
	[/^\/status\/?$/, '擷取狀態'],
	[/^\/settings\/?$/, '設定'],
	[/^\/changelog\/?$/, '更新日誌'],
	[/^\/not-found\/?$/, '找不到頁面'],
];

export function pageTitleForPath(pathname: string) {
	const title = routeTitles.find(([pattern]) => pattern.test(pathname))?.[1];
	return title || SITE_TITLE;
}

export function coursePageTitle(course: Course) {
	const name = isSportsCourse(course)
		? getSportsCourseTitle(course)
		: course.name?.zh || String(course.name || '');
	return [stylizeCourseId(course.id), name].filter(Boolean).join(' ');
}

export function stylizeCourseId(id: string | number | undefined) {
	return String(id || '').replace(/[0-9]/g, (digit) =>
		String.fromCodePoint(0x1d7ec + Number(digit)),
	);
}

export function usePageTitle(title: string | undefined | null) {
	useEffect(() => {
		if (!title) return;
		document.title = title;
		return () => {
			if (document.title === title) {
				document.title = SITE_TITLE;
			}
		};
	}, [title]);
}
