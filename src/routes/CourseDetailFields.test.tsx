import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Course, SyllabusItem } from '../types/course';
import { CourseDetailPage } from './CourseDetailPage';

const mocks = vi.hoisted(() => ({
	fetchCourseDetail: vi.fn(),
	fetchWithdrawalRate: vi.fn(),
	getCourses: vi.fn(),
	getMyCourseIds: vi.fn(),
	addCourse: vi.fn(),
	removeCourse: vi.fn(),
}));

vi.mock('../lib/courseApi', () => ({
	fetchCourseDetail: mocks.fetchCourseDetail,
	fetchWithdrawalRate: mocks.fetchWithdrawalRate,
}));

vi.mock('../state/AppContext', () => ({
	useApp: () => ({
		dataset: { year: '115', sem: '1', department: 'main' },
		getCourses: mocks.getCourses,
		getMyCourseIds: mocks.getMyCourseIds,
		addCourse: mocks.addCourse,
		removeCourse: mocks.removeCourse,
	}),
}));

vi.mock('@tanstack/react-router', () => ({
	Link: ({ to, children, ...props }) => (
		<a href={to} {...props}>
			{children}
		</a>
	),
	useParams: () => ({ year: '115', sem: '1', id: 'COURSE-001' }),
	useRouterState: ({ select = (state) => state } = {}) =>
		select({ location: { pathname: '/course/115/1/COURSE-001', hash: '', state: {} } }),
}));

const baseCourse: Course = {
	code: 'CODE-001',
	id: 'COURSE-001',
	courseType: '○',
	name: { zh: '測試課程', en: 'Test Course' },
	credit: '3',
	hours: '3',
	description: { zh: '測試課程概要', en: 'Test course description' },
	notes: '測試備註',
	stage: '1',
	time: {},
	teacher: [{ name: '測試教師', link: 'https://example.com/teacher' }],
	class: [{ name: '資工一', link: 'https://example.com/class' }],
	classroom: [{ name: '教室 A', link: 'https://example.com/classroom' }],
	people: '30',
	peopleWithdraw: '0',
	ta: [{ name: '測試助教', link: 'https://example.com/ta' }],
	language: '中文',
	courseDescriptionLink: 'https://example.com/course-description',
	syllabusLinks: ['https://example.com/syllabus'],
};

const baseSyllabus: SyllabusItem = {
	teacher: '測試教師',
	email: 'fake.teacher@example.com',
	latestUpdate: '2026-09-01T10:00:00+08:00',
	outline: '測試課程目標內容',
	schedule: '測試課程進度內容',
	scorePolicy: '測試評量標準內容',
	materials: '測試教材內容',
	consultation: '測試課程諮詢內容',
	remarks: '測試課程備註內容',
	foreignLanguageTextbooks: false,
	extra: { 教學方式: '案例討論' },
	covid19: {
		lv2Method: '同步線上授課',
		lv2Description: '透過 example.com 進行',
	},
};

beforeEach(() => {
	vi.clearAllMocks();
	mocks.getCourses.mockResolvedValue([baseCourse]);
	mocks.getMyCourseIds.mockReturnValue([]);
	mocks.fetchCourseDetail.mockResolvedValue([baseSyllabus]);
	mocks.fetchWithdrawalRate.mockResolvedValue({ 測試教師: '0' });
});

function syllabusWithout(...keys: string[]): SyllabusItem {
	const copy = { ...baseSyllabus } as Record<string, unknown>;
	for (const key of keys) delete copy[key];
	return copy as SyllabusItem;
}

async function renderCourseDetail(detail: SyllabusItem[] = [baseSyllabus]) {
	mocks.fetchCourseDetail.mockResolvedValue(detail);
	render(<CourseDetailPage />);
	await screen.findByRole('heading', { name: '測試課程' });
}

function getInfoCard(title: string) {
	const heading = screen.getByText(title, { exact: true });
	const card = heading.closest('section');
	if (!card) throw new Error(`找不到「${title}」資訊卡`);
	return within(card);
}

describe('CourseDetailPage course and syllabus fields', () => {
	it('renders course code, TA, language, zero withdrawals, and source links', async () => {
		await renderCourseDetail();

		const courseInfo = getInfoCard('課程資訊');
		expect(courseInfo.getByText('課程代碼')).toBeInTheDocument();
		expect(courseInfo.getByText('CODE-001', { exact: true })).toBeInTheDocument();
		expect(courseInfo.getByText('退選')).toBeInTheDocument();
		expect(courseInfo.getByText('0 人', { exact: true })).toBeInTheDocument();
		expect(courseInfo.queryByText('階段')).not.toBeInTheDocument();

		const teachingInfo = getInfoCard('授課資訊');
		expect(teachingInfo.getByText('助教')).toBeInTheDocument();
		expect(teachingInfo.getByText('測試助教', { exact: true })).toBeInTheDocument();
		expect(teachingInfo.getByText('授課語言')).toBeInTheDocument();
		expect(teachingInfo.getByText('中文', { exact: true })).toBeInTheDocument();

		const sourceLinks = within(
			screen.getByRole('heading', { name: '學校原始資料' }).closest('section')!,
		);
		expect(sourceLinks.getByRole('link', { name: '原始課程概述' })).toHaveAttribute(
			'href',
			'https://example.com/course-description',
		);
		expect(sourceLinks.getByRole('link', { name: '原始課綱 1' })).toHaveAttribute(
			'href',
			'https://example.com/syllabus',
		);
		expect(sourceLinks.getByRole('link', { name: '教師：測試教師' })).toHaveAttribute(
			'href',
			'https://example.com/teacher',
		);
		expect(sourceLinks.getByRole('link', { name: '班級：資工一' })).toHaveAttribute(
			'href',
			'https://example.com/class',
		);
		expect(sourceLinks.getByRole('link', { name: '教室：教室 A' })).toHaveAttribute(
			'href',
			'https://example.com/classroom',
		);
		expect(sourceLinks.getByRole('link', { name: '助教：測試助教' })).toHaveAttribute(
			'href',
			'https://example.com/ta',
		);
	});

	it('keeps school source links after the internal course content', async () => {
		await renderCourseDetail();

		const headings = Array.from(document.querySelectorAll('h2, h3')).map((heading) =>
			heading.textContent?.trim(),
		);
		expect(headings.at(-1)).toBe('學校原始資料');
	});

	it('accepts a zero withdrawal rate returned as a string', async () => {
		await renderCourseDetail();

		expect(screen.getByRole('button', { name: /退選率 0%/ })).toBeInTheDocument();
	});

	it('renders a positive withdrawal rate returned as a string', async () => {
		mocks.fetchWithdrawalRate.mockResolvedValue({ 測試教師: '12.5' });
		await renderCourseDetail();

		expect(screen.getByRole('button', { name: /退選率 12\.5%/ })).toBeInTheDocument();
	});

	it('opens the withdrawal explanation as a keyboard-dismissible surface', async () => {
		await renderCourseDetail();

		const user = userEvent.setup();
		await user.click(screen.getByRole('button', { name: /退選率 0%/ }));
		const explanations = await screen.findAllByText('什麼是退選率？');
		const content = explanations
			.map((explanation) => explanation.closest('[data-slot="tooltip-content"]'))
			.find(Boolean);
		expect(content).toHaveClass('rounded-panel');

		await user.keyboard('{Escape}');
		expect(screen.queryAllByText('什麼是退選率？')).toHaveLength(0);
	});

	it('uses the danger treatment when removing a saved course', async () => {
		mocks.getMyCourseIds.mockReturnValue(['COURSE-001']);
		await renderCourseDetail();

		expect(screen.getByRole('button', { name: '從我的課程移除' })).toHaveClass(
			'text-[rgb(var(--vs-danger))]',
		);
	});

	it('renders an unknown Chinese syllabus field with its original label', async () => {
		await renderCourseDetail();

		expect(screen.getByRole('heading', { name: '教學方式' })).toBeInTheDocument();
		expect(screen.getByText('案例討論', { exact: true })).toBeInTheDocument();
	});

	it('collapses the three syllabus form fields until expanded', async () => {
		await renderCourseDetail([
			{
				...baseSyllabus,
				resources: '延伸教學資源測試',
				sdgs: 'SDG4：優質教育測試',
				aiUsage: '導入 AI 測試',
			},
		]);

		const user = userEvent.setup();
		for (const [label, value] of [
			['延伸教學與資源', '延伸教學資源測試'],
			['課程是否導入AI', '導入 AI 測試'],
		]) {
			expect(screen.getByRole('heading', { name: label })).toBeInTheDocument();
			expect(screen.queryByText(value, { exact: true })).not.toBeInTheDocument();
			const toggle = screen.getByRole('button', { name: label });
			expect(toggle).toHaveAttribute('aria-expanded', 'false');
			await user.click(toggle);
			expect(toggle).toHaveAttribute('aria-expanded', 'true');
			expect(screen.getByText(value, { exact: true })).toBeInTheDocument();
		}
		expect(screen.getByRole('heading', { name: '課程對應SDGs指標' })).toBeInTheDocument();
		expect(screen.queryByRole('img', { name: 'SDG 4：優質教育' })).not.toBeInTheDocument();
		await user.click(screen.getByRole('button', { name: '課程對應SDGs指標' }));
		expect(screen.getByRole('img', { name: 'SDG 4：優質教育' })).toBeInTheDocument();
	});

	it('renders office hours as one safe dedicated link without exposing its raw key', async () => {
		const officeHoursLink = 'https://example.com/office-hours';
		await renderCourseDetail([{ ...baseSyllabus, officeHoursLink }]);

		const link = screen.getByRole('link', { name: '教師諮商時間' });
		expect(link).toHaveAttribute('href', officeHoursLink);
		expect(link).toHaveAttribute('target', '_blank');
		expect(link).toHaveAttribute('rel', 'noreferrer');
		expect(screen.queryByText('officeHoursLink', { exact: true })).not.toBeInTheDocument();
	});

	it('finds a course in another department and uses that department for course actions', async () => {
		mocks.getCourses.mockImplementation(async ({ department } = {}) =>
			department === '進修部' ? [baseCourse] : [],
		);
		await renderCourseDetail();

		expect(mocks.getCourses).toHaveBeenCalledWith({ year: '115', sem: '1' });
		expect(mocks.getCourses).toHaveBeenCalledWith({
			year: '115',
			sem: '1',
			department: '進修部',
		});
		expect(mocks.getMyCourseIds).toHaveBeenCalledWith('115', '1', '進修部');

		const user = userEvent.setup();
		await user.click(screen.getByRole('button', { name: '加入我的課程' }));

		expect(mocks.addCourse).toHaveBeenCalledWith('COURSE-001', '115', '1', '進修部');
	});

	it('renders 16+2 syllabus progress fields even when schedule is absent', async () => {
		await renderCourseDetail([
			{
				...syllabusWithout('schedule'),
				extra: {
					'課程進度(1-16週)': '16+2 課程進度測試',
					'彈性學習(17-18週)': '16+2 彈性學習測試',
				},
			},
		]);

		expect(screen.queryByRole('heading', { name: '課程進度' })).not.toBeInTheDocument();
		expect(screen.getByRole('heading', { name: '課程進度(1-16週)' })).toBeInTheDocument();
		expect(screen.getByText('16+2 課程進度測試', { exact: true })).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: '彈性學習(17-18週)' })).toBeInTheDocument();
		expect(screen.getByText('16+2 彈性學習測試', { exact: true })).toBeInTheDocument();
	});

	it('renders every populated standard syllabus field', async () => {
		await renderCourseDetail();

		expect(screen.getByRole('heading', { name: '教師' })).toBeInTheDocument();
		expect(screen.getByText(/測試教師 fake\.teacher@example\.com/)).toBeInTheDocument();
		for (const value of [
			'測試課程目標內容',
			'測試課程進度內容',
			'測試評量標準內容',
			'測試教材內容',
			'測試課程諮詢內容',
			'測試課程備註內容',
		]) {
			expect(screen.getByText(value, { exact: true })).toBeInTheDocument();
		}
	});

	it('drops the copyright reminder the form adds to every textbook list', async () => {
		const notice = '【遵守智慧財產權觀念，請使用正版教科書，不得使用非法影印教科書】';
		await renderCourseDetail([{ ...baseSyllabus, materials: `${notice}\n\n\n\n測試教科書` }]);

		expect(screen.getByText('測試教科書', { exact: true })).toBeInTheDocument();
		expect(screen.queryByText(/遵守智慧財產權觀念/)).not.toBeInTheDocument();
	});

	it('hides the textbook section when it only holds the copyright reminder', async () => {
		await renderCourseDetail([
			{
				...baseSyllabus,
				materials: '【遵守智慧財產權觀念，請使用正版教科書，不得使用非法影印教科書】',
			},
		]);

		expect(
			screen.queryByRole('heading', { name: '使用教材、參考書目或其他' }),
		).not.toBeInTheDocument();
	});

	it('preserves meaningful syllabus line breaks while limiting repeated blank lines', async () => {
		await renderCourseDetail([
			{
				...baseSyllabus,
				materials: '第一段\r\n \n \n第二段\r\n第三段',
			},
		]);

		const heading = screen.getByRole('heading', { name: '使用教材、參考書目或其他' });
		const content = heading.nextElementSibling;
		expect(content?.textContent).toBe('第一段\n\n第二段\n第三段');
	});

	it.each([
		[
			'讓學生了解投資的基本觀念，課程內容介紹證券、期貨與選擇權的投資，以及 CAPM 等訂價模式。\n\nThe course helps students understand the knowledge of investment.',
			'讓學生了解投資的基本觀念，課程內容介紹證券、期貨與選擇權的投資，以及 CAPM 等訂價模式。',
		],
		[
			'This course is taught in English and covers investment fundamentals.',
			'This course is taught in English and covers investment fundamentals.',
		],
		[
			'Course Title: Dynamics (動力學)\nCourse Contents: Force, mass, and acceleration, particle kinematics, particle dynamics, work and energy.',
			'Course Title: Dynamics (動力學)\n\nCourse Contents: Force, mass, and acceleration, particle kinematics, particle dynamics, work and energy.',
		],
		[
			'讓學生了解投資的基本觀念，以及證券、期貨與選擇權的投資和評價模式。請參閱連結:\nhttps://example.com/course\nStudents learn the basic ideas of investment and how securities are valued.',
			'讓學生了解投資的基本觀念，以及證券、期貨與選擇權的投資和評價模式。請參閱連結:\nhttps://example.com/course',
		],
	])(
		'drops only the English translation of a Chinese course outline',
		async (outline, expected) => {
			await renderCourseDetail([{ ...baseSyllabus, outline }]);

			const heading = screen.getByRole('heading', { name: '課程大綱' });
			expect(heading.nextElementSibling?.textContent).toBe(expected);
		},
	);

	it('renders populated audit, lab, and interdisciplinary course attributes', async () => {
		mocks.getCourses.mockResolvedValue([
			{
				...baseCourse,
				audit: '可列入隨班附讀學分',
				lab: '需完成實驗實習',
				interdisciplinary: '跨領域合作課程',
			},
		]);
		await renderCourseDetail();

		const courseInfo = getInfoCard('課程資訊');
		for (const [label, value] of [
			['隨班附讀', '可列入隨班附讀學分'],
			['實驗實習', '需完成實驗實習'],
			['跨領域', '跨領域合作課程'],
		]) {
			expect(courseInfo.getByText(label, { exact: true })).toBeInTheDocument();
			expect(courseInfo.getByText(value, { exact: true })).toBeInTheDocument();
		}
	});

	it.each([
		['否', '無', '不適用'],
		['● 無', '● 無 (None)', '● 無（None）'],
	])('hides course attribute placeholders %s / %s / %s', async (audit, lab, interdisciplinary) => {
		mocks.getCourses.mockResolvedValue([
			{
				...baseCourse,
				audit,
				lab,
				interdisciplinary,
			},
		]);
		await renderCourseDetail();

		const courseInfo = getInfoCard('課程資訊');
		for (const label of ['隨班附讀', '實驗實習', '跨領域']) {
			expect(courseInfo.queryByText(label, { exact: true })).not.toBeInTheDocument();
		}
	});

	it('hides exact syllabus placeholders but keeps false, zero, and useful None text', async () => {
		await renderCourseDetail([
			{
				...baseSyllabus,
				extra: {
					測試空欄位一: '無',
					測試空欄位二: '● 無 (None)',
					測試空欄位三: '無（None）',
					測試空欄位四: '● 無（None）',
					測試布林欄位: '否',
					測試數值欄位: '0',
					測試含None有效內容: '● 無 (None)；仍有實際內容：測試資料',
				},
			},
		]);

		for (const label of ['測試空欄位一', '測試空欄位二', '測試空欄位三', '測試空欄位四']) {
			expect(screen.queryByRole('heading', { name: label })).not.toBeInTheDocument();
		}
		expect(screen.getByRole('heading', { name: '測試布林欄位' })).toBeInTheDocument();
		expect(screen.getByText('否', { exact: true })).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: '測試數值欄位' })).toBeInTheDocument();
		expect(screen.getByText('0', { exact: true })).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: '測試含None有效內容' })).toBeInTheDocument();
		expect(screen.getByText(/仍有實際內容：測試資料/)).toBeInTheDocument();
	});

	it('hides ambiguous legacy false values for foreign language textbooks', async () => {
		await renderCourseDetail();

		expect(screen.queryByRole('heading', { name: /使用外文原文書籍/ })).not.toBeInTheDocument();
	});

	it('renders the foreign language textbook field only when it is true', async () => {
		await renderCourseDetail([{ ...baseSyllabus, foreignLanguageTextbooks: true }]);

		expect(screen.getByRole('heading', { name: '使用外文原文書籍：是' })).toBeInTheDocument();
	});

	it('does not treat a missing foreign language textbook value as false', async () => {
		await renderCourseDetail([syllabusWithout('foreignLanguageTextbooks')]);

		expect(screen.queryByRole('heading', { name: /使用外文原文書籍/ })).not.toBeInTheDocument();
	});

	it('does not render a latest-update section when latestUpdate is missing', async () => {
		await renderCourseDetail([syllabusWithout('latestUpdate')]);

		expect(screen.queryByRole('heading', { name: '最後更新' })).not.toBeInTheDocument();
		expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
	});

	it('keeps an invalid latestUpdate value without rendering NaN', async () => {
		const invalidUpdate = { ...baseSyllabus, latestUpdate: 'not-a-date' };
		await renderCourseDetail([invalidUpdate]);

		expect(screen.getByRole('heading', { name: '最後更新' })).toBeInTheDocument();
		expect(screen.getByText('not-a-date', { exact: true })).toBeInTheDocument();
		expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
	});

	it('keeps both COVID level-two method and description when both are present', async () => {
		await renderCourseDetail();

		expect(screen.getByRole('heading', { name: '二級警戒上課方式' })).toBeInTheDocument();
		expect(screen.getByText('同步線上授課', { exact: true })).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: '二級警戒上課說明' })).toBeInTheDocument();
		expect(screen.getByText('透過 example.com 進行', { exact: true })).toBeInTheDocument();
	});

	it('hides empty TA, language, and COVID sections', async () => {
		mocks.getCourses.mockResolvedValue([{ ...baseCourse, ta: [], language: '   ' }]);
		await renderCourseDetail([{ ...baseSyllabus, covid19: {} }]);

		const teachingInfo = getInfoCard('授課資訊');
		expect(teachingInfo.queryByText('助教')).not.toBeInTheDocument();
		expect(teachingInfo.queryByText('授課語言')).not.toBeInTheDocument();
		expect(
			screen.queryByRole('heading', { name: '因應疫情所致之上課方式' }),
		).not.toBeInTheDocument();
	});

	it('hides the COVID section when its only value is a placeholder', async () => {
		await renderCourseDetail([{ ...baseSyllabus, covid19: { lv2Method: '無' } }]);

		expect(
			screen.queryByRole('heading', { name: '因應疫情所致之上課方式' }),
		).not.toBeInTheDocument();
	});

	it('does not expose javascript source links as clickable links', async () => {
		const unsafeLink = 'javascript:alert(1)';
		mocks.getCourses.mockResolvedValue([
			{
				...baseCourse,
				courseDescriptionLink: unsafeLink,
				syllabusLinks: [unsafeLink],
				teacher: [{ name: '測試教師', link: unsafeLink }],
				class: [{ name: '資工一', link: unsafeLink }],
				classroom: [{ name: '教室 A', link: unsafeLink }],
				ta: [{ name: '測試助教', link: unsafeLink }],
			},
		]);
		await renderCourseDetail();

		expect(screen.queryByRole('heading', { name: '學校原始資料' })).not.toBeInTheDocument();
		expect(screen.queryByRole('link', { name: '原始課程概述' })).not.toBeInTheDocument();
		expect(screen.queryByRole('link', { name: '原始課綱 1' })).not.toBeInTheDocument();
		expect(screen.queryByRole('link', { name: '教師：測試教師' })).not.toBeInTheDocument();
	});

	it('keeps the main course visible when the syllabus API fails', async () => {
		mocks.fetchCourseDetail.mockRejectedValue(new Error('syllabus unavailable'));
		render(<CourseDetailPage />);

		expect(await screen.findByRole('heading', { name: '測試課程' })).toBeInTheDocument();
		expect(screen.getByText('CODE-001', { exact: true })).toBeInTheDocument();
		expect(screen.getByRole('alert')).toHaveTextContent('課程大綱暫時無法載入，請稍後再試。');
	});
});
