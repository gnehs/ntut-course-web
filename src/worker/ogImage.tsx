import { GoogleFont, ImageResponse } from '@cf-wasm/og/workerd';
import type { ReactNode } from 'react';
import type { Course, DepartmentGroup, WithdrawalResponse, WithdrawalStat } from '../types/course';
import { WORKER_PREVIEW_CACHE_CONTROL } from './cache';
import { parseOgImageRoute, type OgImageRoute } from './ogImageRoute';

const DEFAULT_API_BASE = 'https://gnehs.github.io/ntut-course-crawler-node';

const courseStandardList: Record<string, string> = {
	'○': '部訂共同必修',
	'△': '校訂共同必修',
	'☆': '共同選修',
	'●': '部訂專業必修',
	'▲': '校訂專業必修',
	'★': '專業選修',
};

type OgImageConfig = {
	apiBase?: string;
};

type FetchJson = <T>(path: string) => Promise<T>;

export async function handleOgImageRequest(request: Request, config: OgImageConfig) {
	const route = parseOgImageRoute(new URL(request.url));
	if (!route) return null;

	const element = await resolveOgImageElement(route, createApiFetcher(config.apiBase)).catch(
		() => null,
	);
	if (!element) return null;

	return ImageResponse.async(element, {
		width: 1200,
		height: 600,
		emoji: 'fluent',
		fonts: [new GoogleFont('Lato')],
		headers: {
			'Cache-Control': WORKER_PREVIEW_CACHE_CONTROL,
		},
	});
}

export async function resolveOgImageElement(route: OgImageRoute, fetchJson: FetchJson) {
	if (route.type === 'course') {
		const courses = await fetchJson<Course[]>(
			`/${route.year}/${route.sem}/${route.department}.json`,
		);
		const course = courses.find((item) => item.id === route.id);
		return course ? renderCourseImage(route.year, route.sem, course) : null;
	}
	if (route.type === 'class') {
		const departments = await fetchJson<DepartmentGroup[]>(
			`/${route.year}/${route.sem}/department.json`,
		);
		for (const department of departments) {
			const classData = (department.class || []).find(
				(item) => item.id === route.id || item.name === route.id,
			);
			if (classData) {
				return renderClassImage(
					route.year,
					route.sem,
					classData.name,
					department.name,
					department.category,
				);
			}
		}
		return null;
	}

	const withdrawal = await fetchJson<WithdrawalResponse>('/analytics/withdrawal.json');
	const teacher = withdrawal.data?.find((item) => item.name === route.name);
	return teacher ? renderTeacherImage(teacher) : null;
}

function renderCourseImage(year: string, sem: string, course: Course) {
	const courseStandard = `📕 ${courseStandardList[course.courseType]}`;
	return (
		<Container>
			<Header>
				<div>{`${year} 年${sem === '1' ? '上' : '下'}學期`}</div>
			</Header>
			<Spacer />
			<Content>
				{course.id}
				<Title>{course.name?.zh || course.id}</Title>
				<SubTitle>{course.name?.en || ''}</SubTitle>
				<Tags>
					<Tag>{courseStandard}</Tag>
					<Tag>{`🎓 ${Number.parseFloat(course.credit || '0')} 學分`}</Tag>
					{(course.classroom || [])
						.map((item) => `🚪 ${item.name}`)
						.map((item) => (
							<Tag key={item}>{item}</Tag>
						))}
				</Tags>
			</Content>
			<Spacer />
			<Footer>
				<FooterItem
					title='教師'
					value={(course.teacher || []).map((item) => item.name).join('、')}
				/>
				<FooterItem title='班級' value={(course.class || []).map((item) => item.name).join('、')} />
				<FooterItem title='備註' value={course.notes} />
			</Footer>
		</Container>
	);
}

function renderClassImage(
	year: string,
	sem: string,
	className: string,
	departmentName: string,
	categoryName: string,
) {
	return (
		<Container>
			<Header>
				<div>{`${year} 年${sem === '1' ? '上' : '下'}學期`}</div>
			</Header>
			<Spacer />
			<Content>
				<Title>{className}</Title>
				<SubTitle>{departmentName}</SubTitle>
			</Content>
			<Spacer />
			<Footer>
				<FooterItem title='學院' value={categoryName} />
			</Footer>
		</Container>
	);
}

function renderTeacherImage(teacher: WithdrawalStat) {
	return (
		<Container>
			<Header />
			<Spacer />
			<Content>
				<Title>{teacher.name}</Title>
				<SubTitle>教師</SubTitle>
				<Tags>
					<Tag>{`🎓 ${teacher.course?.length || 0} 堂課程`}</Tag>
				</Tags>
			</Content>
			<Spacer />
			<Footer>
				<FooterItem
					title='退選率'
					value={teacher.rate_percent ? `${teacher.rate_percent}%` : '無'}
				/>
				<FooterItem title='退選' value={teacher.withdraw ? `${teacher.withdraw} 人` : '無'} />
				<FooterItem title='選課' value={teacher.people ? `${teacher.people} 人` : '無'} />
			</Footer>
		</Container>
	);
}

function FooterItem({ title, value }: { title: string; value: ReactNode }) {
	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				maxWidth: '33.33%',
			}}
		>
			<div
				style={{
					fontSize: 24,
				}}
			>
				{title}
			</div>
			<div
				style={{
					fontSize: 24,
					opacity: 0.5,
					width: '100%',
				}}
			>
				{value && value !== '' ? value : '無'}
			</div>
		</div>
	);
}

function Container({ children }: { children: ReactNode }) {
	return (
		<div
			style={{
				backgroundColor: 'white',
				width: '100%',
				height: '100%',
				display: 'flex',
				textAlign: 'left',
				flexDirection: 'column',
				justifyContent: 'flex-start',
				fontFamily: 'Lato',
				alignItems: 'flex-start',
				fontSize: 24,
			}}
			lang='zh-TW'
		>
			{children}
		</div>
	);
}

function Tag({ children }: { children: ReactNode }) {
	return (
		<div
			style={{
				fontSize: 24,
				border: '1px solid #f2f2f2',
				padding: '8px 16px',
				borderRadius: 12,
				boxShadow: '0 4px 8px rgba(0, 0, 0, .1)',
			}}
		>
			{children}
		</div>
	);
}

function Tags({ children }: { children: ReactNode }) {
	return (
		<div
			style={{
				display: 'flex',
				gap: 8,
				marginTop: 16,
			}}
		>
			{children}
		</div>
	);
}

function Footer({ children }: { children: ReactNode }) {
	return (
		<div
			style={{
				display: 'flex',
				gap: 64,
				padding: '32px 64px',
				background: '#f2f2f2',
				width: '100%',
			}}
		>
			{children}
		</div>
	);
}

function Header({ children }: { children?: ReactNode }) {
	return (
		<div
			style={{
				padding: '32px 64px',
				paddingBottom: 0,
				display: 'flex',
				justifyContent: 'space-between',
				width: '100%',
			}}
		>
			<div>🍤 北科課程好朋友</div>
			{children}
		</div>
	);
}

function Content({ children }: { children: ReactNode }) {
	return (
		<div
			style={{
				display: 'flex',
				textAlign: 'left',
				flexDirection: 'column',
				justifyContent: 'flex-start',
				alignItems: 'flex-start',
				padding: '32px 64px',
				position: 'relative',
			}}
		>
			{children}
		</div>
	);
}

function Title({ children }: { children: ReactNode }) {
	return <div style={{ fontSize: 56 }}>{children}</div>;
}

function SubTitle({ children }: { children: ReactNode }) {
	return <div style={{ fontSize: 36, opacity: 0.5 }}>{children}</div>;
}

function Spacer() {
	return <div style={{ flex: 1 }} />;
}

function createApiFetcher(apiBase = DEFAULT_API_BASE): FetchJson {
	const base = apiBase.replace(/\/$/, '');
	return async function fetchJson<T>(path: string) {
		const response = await fetch(`${base}${path}`);
		if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
		return response.json() as Promise<T>;
	};
}
