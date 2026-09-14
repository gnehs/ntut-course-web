import type { Course } from '../types/course';

// Honor the teacher-requested takedown recorded in commit 59db7c77c (2023-07-08).
// Keep this policy shared by page access checks and sitemap generation.
const hiddenTeachers = new Set(['朴維鎮']);

export function isTeacherHidden(name: string) {
	return hiddenTeachers.has(name);
}

export function isCourseHidden(course: Pick<Course, 'teacher'>) {
	return (course.teacher || []).some((teacher) => isTeacherHidden(teacher.name));
}
