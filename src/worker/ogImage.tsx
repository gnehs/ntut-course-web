import { GoogleFont, ImageResponse } from '@cf-wasm/og/workerd';
import type { Course, DepartmentGroup, WithdrawalResponse, WithdrawalStat } from '../types/course';
import { WORKER_PREVIEW_CACHE_CONTROL } from './cache';
import { parseOgImageRoute, type OgImageRoute } from './ogImageRoute';
import { PROGRAM_KINDS, findProgram } from './programs';

const DEFAULT_API_BASE = 'https://gnehs.github.io/ntut-course-crawler-node';
const OG_IMAGE_DEFAULT_FONT = new GoogleFont('Inter Tight', { weight: 400 });
const OG_IMAGE_DEFAULT_FONT_BOLD = new GoogleFont('Inter Tight', { weight: 700 });
const OG_IMAGE_FALLBACK_FONT = new GoogleFont('Noto Sans TC', { weight: 400 });
const OG_IMAGE_FALLBACK_FONT_BOLD = new GoogleFont('Noto Sans TC', { weight: 700 });
const OG_IMAGE_FONT_FAMILY = "'Inter Tight', 'Noto Sans TC'";

const courseStandardList: Record<string, string> = {
	'○': '部訂共同必修',
	'△': '校訂共同必修',
	'☆': '共同選修',
	'●': '部訂專業必修',
	'▲': '校訂專業必修',
	'★': '專業選修',
};

function formatCredit(value: string | number | null | undefined) {
	const text = String(value ?? '')
		.replace(/[０-９]/g, (char) => String(char.charCodeAt(0) - 0xff10))
		.trim();
	if (!text) return '0';
	const credit = Number(text);
	if (!Number.isFinite(credit)) return text;
	return Number.isInteger(credit) ? String(credit) : text;
}

type OgImageConfig = {
	apiBase?: string;
	assets?: { fetch(request: Request): Promise<Response> };
};

type FetchJson = <T>(path: string) => Promise<T>;

export async function handleOgImageRequest(request: Request, config: OgImageConfig) {
	const route = parseOgImageRoute(new URL(request.url));
	if (!route) return null;

	const card = await resolveOgImageCard(route, createApiFetcher(config.apiBase)).catch(() => null);
	if (!card) return null;
	const cover = bookCover(card.college);
	const background = await loadBackground(request, config.assets, cover.name).catch(() => null);

	return ImageResponse.async(<OgCard {...card} cover={cover} background={background} />, {
		width: 1200,
		height: 600,
		emoji: 'fluent',
		defaultFont: OG_IMAGE_DEFAULT_FONT,
		fonts: [
			OG_IMAGE_DEFAULT_FONT,
			OG_IMAGE_DEFAULT_FONT_BOLD,
			OG_IMAGE_FALLBACK_FONT,
			OG_IMAGE_FALLBACK_FONT_BOLD,
		],
		headers: {
			'Cache-Control': WORKER_PREVIEW_CACHE_CONTROL,
		},
	});
}

export async function resolveOgImageCard(
	route: OgImageRoute,
	fetchJson: FetchJson,
): Promise<OgCardProps | null> {
	if (route.type === 'course') {
		const [courses, departments] = await Promise.all([
			fetchJson<Course[]>(`/${route.year}/${route.sem}/${route.department}.json`),
			fetchJson<DepartmentGroup[]>(`/${route.year}/${route.sem}/department.json`).catch(() => []),
		]);
		const course = courses.find((item) => item.id === route.id);
		if (!course) return null;
		const classNames = new Set((course.class || []).map((item) => item.name));
		const college = departments.find((department) =>
			(department.class || []).some((item) => classNames.has(item.name)),
		)?.category;
		return { ...courseCard(route.year, route.sem, course), college };
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
				return {
					period: formatPeriod(route.year, route.sem),
					eyebrow: '班級',
					college: department.category,
					title: classData.name,
					subtitle: department.name,
					details: [
						{ title: '學院', value: department.category },
						{ title: '系所', value: department.name },
					],
				};
			}
		}
		return null;
	}
	if (route.type === 'program') {
		const program = await findProgram(route.kind, route.year, route.sem, route.id, fetchJson);
		return program
			? {
					period: formatPeriod(route.year, route.sem),
					eyebrow: program.id,
					title: program.name,
					subtitle: PROGRAM_KINDS[route.kind].label,
					details: [
						{ title: '類型', value: PROGRAM_KINDS[route.kind].label },
						{ title: '課程', value: `${program.courseCount} 門課程` },
					],
				}
			: null;
	}

	const withdrawal = await fetchJson<WithdrawalResponse>('/analytics/withdrawal.json');
	const teacher = withdrawal.data?.find((item) => item.name === route.name);
	return teacher ? teacherCard(teacher) : null;
}

function formatPeriod(year: string, sem: string) {
	return `${year} 年${sem === '1' ? '上' : '下'}學期`;
}

function courseCard(year: string, sem: string, course: Course): OgCardProps {
	const names = (items?: { name: string }[]) => (items || []).map((item) => item.name).join('、');
	return {
		period: formatPeriod(year, sem),
		eyebrow: [course.id, courseStandardList[course.courseType]].filter(Boolean).join('・'),
		coverEyebrow: course.id,
		title: course.name?.zh || course.id,
		subtitle: course.name?.en || undefined,
		details: [
			{ title: '教師', value: names(course.teacher) },
			{ title: '學分', value: `${formatCredit(course.credit)} 學分` },
		],
	};
}

function teacherCard(teacher: WithdrawalStat): OgCardProps {
	return {
		eyebrow: '教師',
		title: teacher.name,
		subtitle: `${teacher.course?.length || 0} 堂課程`,
		details: [
			{ title: '退選率', value: teacher.rate_percent ? `${Number(teacher.rate_percent)}%` : '' },
			{ title: '退選', value: teacher.withdraw ? `${teacher.withdraw} 人` : '' },
			{ title: '選課', value: teacher.people ? `${teacher.people} 人` : '' },
		],
	};
}

// One book render per college, named after its sea glass colour. tint is the cover
// lettering, white with a little of the glass mixed in; accent tints the labels beside
// the book and shade is the cover's darker disc, both as dark as the glass.
const BOOK_COVERS = {
	seafoam: { tint: '#c9ebe4', accent: '#23806f', shade: '14, 76, 64' },
	cobalt: { tint: '#c8d7f3', accent: '#2f5bb8', shade: '22, 44, 120' },
	amber: { tint: '#fff4e8', accent: '#a5651c', shade: '105, 58, 12' },
	aqua: { tint: '#c6e8f0', accent: '#1d8099', shade: '10, 72, 92' },
	kelly: { tint: '#cbe8d1', accent: '#2d8641', shade: '20, 82, 36' },
	rose: { tint: '#f6dbe1', accent: '#b4566c', shade: '120, 38, 58' },
	lavender: { tint: '#e0d9f2', accent: '#6a52b0', shade: '62, 42, 122' },
	citrine: { tint: '#fffbea', accent: '#8a760c', shade: '98, 82, 10' },
};

type BookCover = (typeof BOOK_COVERS)[keyof typeof BOOK_COVERS] & {
	name: keyof typeof BOOK_COVERS;
};

const COLLEGE_COVERS: Record<string, keyof typeof BOOK_COVERS> = {
	機電學院: 'cobalt',
	工程學院: 'amber',
	電資學院: 'aqua',
	管理學院: 'kelly',
	設計學院: 'rose',
	人文與社會科學學院: 'lavender',
	創新前瞻科技研究學院: 'citrine',
};

function bookCover(college?: string): BookCover {
	const name = (college && COLLEGE_COVERS[college]) || 'seafoam';
	return { name, ...BOOK_COVERS[name] };
}

// The background is a pre-rendered sea glass book (scripts/og-background). It is
// shot with an orthographic camera, so the flat label on its cover lands in the
// image as a parallelogram and a 2D transform maps the text box onto it exactly.
// COVER is the front face of the cover.
const COVER = {
	width: 315,
	height: 415,
	topLeft: [756.7, 72.2],
	topRight: [1041.9, 125.6],
	bottomLeft: [707.6, 479.5],
};

function coverTransform() {
	const { width, height, topLeft, topRight, bottomLeft } = COVER;
	const a = (topRight[0] - topLeft[0]) / width;
	const b = (topRight[1] - topLeft[1]) / width;
	const c = (bottomLeft[0] - topLeft[0]) / height;
	const d = (bottomLeft[1] - topLeft[1]) / height;
	// Decompose [a c; b d] into rotate(angle) · skewX(skew) · scale(scaleX, scaleY).
	const angle = Math.atan2(b, a);
	const scaleX = Math.hypot(a, b);
	const shear = Math.cos(angle) * c + Math.sin(angle) * d;
	const scaleY = -Math.sin(angle) * c + Math.cos(angle) * d;
	const toDeg = (radians: number) => ((radians * 180) / Math.PI).toFixed(3);
	return `rotate(${toDeg(angle)}deg) skewX(${toDeg(Math.atan2(shear, scaleY))}deg) scale(${scaleX.toFixed(4)}, ${scaleY.toFixed(4)})`;
}

const COVER_TRANSFORM = coverTransform();

async function loadBackground(
	request: Request,
	assets: OgImageConfig['assets'],
	cover: BookCover['name'],
) {
	if (!assets) return null;
	const response = await assets.fetch(new Request(new URL(`/og/book-${cover}.jpg`, request.url)));
	if (!response.ok) return null;
	const bytes = new Uint8Array(await response.arrayBuffer());
	let binary = '';
	for (let index = 0; index < bytes.length; index += 0x8000) {
		binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
	}
	return `data:image/jpeg;base64,${btoa(binary)}`;
}

const INK = '#123532';
const MUTED = '#4f716c';

type OgCardProps = {
	period?: string;
	eyebrow: string;
	title: string;
	subtitle?: string;
	coverEyebrow?: string;
	college?: string;
	details: { title: string; value?: string }[];
};

function OgCard({
	period,
	eyebrow,
	title,
	subtitle,
	coverEyebrow,
	details,
	cover,
	background,
}: OgCardProps & { cover: BookCover; background: string | null }) {
	return (
		<div
			style={{
				width: '100%',
				height: '100%',
				display: 'flex',
				position: 'relative',
				backgroundColor: '#e7efed',
				fontFamily: OG_IMAGE_FONT_FAMILY,
				color: INK,
				fontSize: 24,
			}}
			lang='zh-TW'
		>
			{background && (
				<img
					src={background}
					width={1200}
					height={600}
					style={{ position: 'absolute', top: 0, left: 0 }}
				/>
			)}
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					width: 640,
					height: '100%',
					padding: '48px 0 48px 64px',
				}}
			>
				<Header />
				<div
					style={{
						flex: 1,
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'center',
					}}
				>
					<div style={{ fontSize: 22, fontWeight: 700, color: cover.accent, letterSpacing: 1 }}>
						{eyebrow}
					</div>
					<div
						style={{
							display: 'block',
							fontSize: title.length > 16 ? 44 : title.length > 9 ? 50 : 64,
							fontWeight: 700,
							lineHeight: 1.15,
							letterSpacing: -1,
							marginTop: 6,
							lineClamp: 2,
						}}
					>
						{title}
					</div>
					{subtitle && (
						<div
							style={{
								fontSize: 28,
								color: MUTED,
								marginTop: 8,
								whiteSpace: 'nowrap',
								overflow: 'hidden',
								textOverflow: 'ellipsis',
							}}
						>
							{subtitle}
						</div>
					)}
				</div>
				<div style={{ display: 'flex', flexWrap: 'wrap', columnGap: 40, rowGap: 14 }}>
					{details.map((item) => (
						<Detail key={item.title} accent={cover.accent} {...item} />
					))}
				</div>
			</div>
			<BookCoverDesign
				code={coverEyebrow ?? eyebrow}
				title={title}
				subtitle={subtitle}
				period={period}
				cover={cover}
			/>
		</div>
	);
}

function Header() {
	return <div style={{ display: 'flex', fontSize: 24, fontWeight: 700 }}>🍤 北科課程好朋友</div>;
}

function Detail({ title, value, accent }: { title: string; value?: string; accent: string }) {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 260 }}>
			<div style={{ fontSize: 18, lineHeight: '24px', fontWeight: 700, color: accent }}>
				{title}
			</div>
			<div
				style={{
					fontSize: 24,
					lineHeight: '32px',
					fontWeight: 700,
					whiteSpace: 'nowrap',
					overflow: 'hidden',
					textOverflow: 'ellipsis',
				}}
			>
				{value || '無'}
			</div>
		</div>
	);
}

type CoverContent = {
	code: string;
	title: string;
	subtitle?: string;
	period?: string;
};

// The cover is laid out like a printed book: flat artwork with the lettering
// printed on top in a pale tint of the glass, then the glass's frosted grain
// clipped to the lettering so the print sits in the same surface.
function BookCoverDesign({ cover, ...content }: CoverContent & { cover: BookCover }) {
	return (
		<div
			style={{
				position: 'absolute',
				top: 0,
				left: 0,
				width: 1200,
				height: 600,
				display: 'flex',
			}}
		>
			<CoverArt cover={cover} />
			<CoverText {...content} color={cover.tint} />
			<CoverText {...content} color='transparent' grain={coverGrainUri(cover)} />
		</div>
	);
}

function coverFace() {
	return {
		position: 'absolute',
		left: COVER.topLeft[0],
		top: COVER.topLeft[1],
		width: COVER.width,
		height: COVER.height,
		display: 'flex',
		transformOrigin: 'top left',
		transform: COVER_TRANSFORM,
	} as const;
}

// Each college prints its own motif on the lower half of the cover, in a pale
// and a dark tint of the glass so it reads as part of the same print run. A
// layer draws its shapes opaque and fades them as one group, so shapes that
// cross inside a layer keep a single tone instead of stacking their alpha.
type MotifLayer = { ink: 'light' | 'dark'; alpha: number; shapes: string };

const W = COVER.width;
const H = COVER.height;

function gear(cx: number, cy: number, radius: number, teeth: number) {
	const points: string[] = [];
	for (let index = 0; index < teeth * 4; index++) {
		const angle = (index / (teeth * 4)) * Math.PI * 2;
		const r = index % 4 < 2 ? radius : radius * 0.84;
		points.push(
			`${(cx + Math.cos(angle) * r).toFixed(1)},${(cy + Math.sin(angle) * r).toFixed(1)}`,
		);
	}
	return points.join(' ');
}

const range = (length: number) => Array.from({ length }, (_, index) => index);

const COVER_MOTIFS: Record<BookCover['name'], () => MotifLayer[]> = {
	// school-wide: graph paper with two discs
	seafoam: () => [
		{
			ink: 'light',
			alpha: 0.13,
			shapes: [
				...range(Math.ceil(W / 15)).map(
					(i) => `<line x1="${i * 15}" y1="0" x2="${i * 15}" y2="${H}"/>`,
				),
				...range(Math.ceil(H / 15)).map(
					(i) => `<line x1="0" y1="${i * 15}" x2="${W}" y2="${i * 15}"/>`,
				),
			].join(''),
		},
		{ ink: 'light', alpha: 0.2, shapes: '<circle cx="270" cy="290" r="115"/>' },
		{ ink: 'dark', alpha: 0.18, shapes: '<circle cx="140" cy="440" r="85"/>' },
	],
	// mechanical & electrical: meshing gears
	cobalt: () => [
		{ ink: 'light', alpha: 0.18, shapes: `<polygon points="${gear(235, 300, 110, 14)}"/>` },
		{
			ink: 'dark',
			alpha: 0.25,
			shapes: '<circle cx="235" cy="300" r="36" fill="none" stroke-width="10"/>',
		},
		{ ink: 'dark', alpha: 0.2, shapes: `<polygon points="${gear(85, 390, 66, 10)}"/>` },
		{ ink: 'light', alpha: 0.25, shapes: '<circle cx="85" cy="390" r="20"/>' },
	],
	// engineering: a steel truss
	amber: () => {
		const top = 250;
		const bottom = 340;
		const step = 70;
		const web = range(Math.ceil((W + 2 * step) / step)).map((i) => {
			const x = -35 + i * step;
			return `<polyline points="${x},${bottom} ${x + step / 2},${top} ${x + step},${bottom}" fill="none" stroke-width="6" stroke-linejoin="round"/>`;
		});
		return [
			{
				ink: 'light',
				alpha: 0.12,
				shapes: `<rect x="0" y="${bottom + 4}" width="${W}" height="${H}"/>`,
			},
			{ ink: 'dark', alpha: 0.22, shapes: web.join('') },
			{
				ink: 'light',
				alpha: 0.3,
				shapes: [top, bottom]
					.map((y) => `<line x1="-10" y1="${y}" x2="${W + 10}" y2="${y}" stroke-width="8"/>`)
					.join(''),
			},
		];
	},
	// electrical engineering & computer science: circuit traces
	aqua: () => {
		const traces = [
			'M -5 260 H 120 L 150 290 H 330',
			'M -5 300 H 60 L 90 330 H 200 L 230 360 H 330',
			'M 40 430 V 380 L 70 350 H 150',
			'M 250 230 V 250 L 280 280 V 330',
			'M 180 430 V 400 L 210 370',
		];
		const nodes = [
			[150, 290],
			[230, 360],
			[150, 350],
			[280, 330],
			[210, 370],
			[60, 300],
		];
		return [
			{ ink: 'dark', alpha: 0.18, shapes: '<rect x="200" y="260" width="56" height="56" rx="6"/>' },
			{
				ink: 'light',
				alpha: 0.32,
				shapes: [
					...traces.map(
						(d) => `<path d="${d}" fill="none" stroke-width="5" stroke-linejoin="round"/>`,
					),
					...nodes.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10.5"/>`),
				].join(''),
			},
			{
				ink: 'dark',
				alpha: 0.3,
				shapes: nodes.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7.5"/>`).join(''),
			},
		];
	},
	// management: rising bars and a trend line
	kelly: () => {
		const heights = [60, 95, 80, 130, 165];
		const bar = (h: number, i: number) =>
			`<rect x="${24 + i * 56}" y="${H - 45 - h}" width="40" height="${h + 60}" rx="4"/>`;
		const points = heights.map((h, i) => [44 + i * 56, H - 75 - h]);
		return [
			{
				ink: 'dark',
				alpha: 0.18,
				shapes: heights
					.map(bar)
					.filter((_, i) => i % 2 === 0)
					.join(''),
			},
			{
				ink: 'light',
				alpha: 0.22,
				shapes: heights
					.map(bar)
					.filter((_, i) => i % 2 === 1)
					.join(''),
			},
			{
				ink: 'light',
				alpha: 0.55,
				shapes: [
					`<polyline points="${points.join(' ')}" fill="none" stroke-width="5" stroke-linejoin="round"/>`,
					...points.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7"/>`),
				].join(''),
			},
		];
	},
	// design: a Bauhaus composition
	rose: () => [
		{ ink: 'dark', alpha: 0.18, shapes: '<rect x="30" y="300" width="130" height="130"/>' },
		{ ink: 'light', alpha: 0.2, shapes: '<circle cx="230" cy="300" r="95"/>' },
		{ ink: 'light', alpha: 0.3, shapes: '<polygon points="120,230 210,390 30,390"/>' },
		{ ink: 'dark', alpha: 0.22, shapes: '<rect x="250" y="190" width="40" height="40"/>' },
	],
	// humanities & social sciences: ripples and a dot field
	lavender: () => {
		const ring = (r: number) =>
			`<circle cx="${W}" cy="${H}" r="${r}" fill="none" stroke-width="12"/>`;
		return [
			{ ink: 'light', alpha: 0.26, shapes: [60, 140, 220].map(ring).join('') },
			{ ink: 'dark', alpha: 0.2, shapes: [100, 180].map(ring).join('') },
			{
				ink: 'light',
				alpha: 0.3,
				shapes: range(36)
					.map(
						(i) => `<circle cx="${24 + (i % 6) * 18}" cy="${250 + Math.floor(i / 6) * 18}" r="4"/>`,
					)
					.join(''),
			},
		];
	},
	// innovation & frontier technology: orbits around a core
	citrine: () => {
		const [cx, cy, rx, ry] = [W / 2, 285, 110, 38];
		const orbits = [0, 60, 120];
		// a point on the orbit tilted by `tilt` degrees, `t` radians around it
		const electron = (tilt: number, t: number) => {
			const a = (tilt * Math.PI) / 180;
			const x = cx + rx * Math.cos(t) * Math.cos(a) - ry * Math.sin(t) * Math.sin(a);
			const y = cy + rx * Math.cos(t) * Math.sin(a) + ry * Math.sin(t) * Math.cos(a);
			return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9"/>`;
		};
		return [
			{
				ink: 'light',
				alpha: 0.32,
				shapes: orbits
					.map(
						(tilt) =>
							`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke-width="5" transform="rotate(${tilt} ${cx} ${cy})"/>`,
					)
					.join(''),
			},
			{ ink: 'dark', alpha: 0.22, shapes: `<circle cx="${cx}" cy="${cy}" r="24"/>` },
			{
				ink: 'light',
				alpha: 0.6,
				shapes: electron(0, 0) + electron(60, Math.PI) + electron(120, Math.PI / 2),
			},
		];
	},
};

function coverArtUri(cover: BookCover) {
	const colors = { light: 'rgb(255, 255, 255)', dark: `rgb(${cover.shade})` };
	const layers = COVER_MOTIFS[cover.name]()
		.map(
			({ ink, alpha, shapes }) =>
				`<g opacity="${alpha}" fill="${colors[ink]}" stroke="${colors[ink]}">${shapes}</g>`,
		)
		.join('');
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${layers}</svg>`;
	return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function CoverArt({ cover }: { cover: BookCover }) {
	return (
		<div style={{ ...coverFace(), borderRadius: 8, overflow: 'hidden' }}>
			<img src={coverArtUri(cover)} width={W} height={H} />
		</div>
	);
}

// Tileable speckles: sparse dark flecks of the glass colour and fainter white ones,
// the same frost the render's bump map gives the book.
function coverGrainUri(cover: BookCover) {
	const speckles = (
		channel: number,
		color: string,
		alpha: string,
		opacity: number,
		seed: number,
	) => `
		<filter id="s${seed}" x="0" y="0" width="100%" height="100%">
			<feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="${seed}" stitchTiles="stitch"/>
			<feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${[0, 1, 2].map((i) => (i === channel ? 3.2 : 0)).join(' ')} 0 ${alpha}"/>
			<feComposite operator="in" in="SourceGraphic"/>
		</filter>
		<rect width="96" height="96" fill="${color}" opacity="${opacity}" filter="url(#s${seed})"/>`;
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96">${speckles(0, `rgb(${cover.shade})`, '-2.05', 0.35, 1)}${speckles(1, '#ffffff', '-1.95', 0.8, 2)}</svg>`;
	return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

function CoverText({
	code,
	title,
	subtitle,
	period,
	color,
	grain,
}: CoverContent & { color: string; grain?: string }) {
	const titleSize =
		title.length <= 2
			? 92
			: title.length <= 3
				? 76
				: title.length <= 4
					? 60
					: title.length <= 6
						? 46
						: title.length <= 10
							? 40
							: 32;
	const paint = grain
		? ({ backgroundImage: grain, backgroundClip: 'text' } as const)
		: ({} as const);
	const rule = grain
		? ({ height: 2, width: '100%', backgroundImage: grain } as const)
		: ({ height: 2, width: '100%', background: color } as const);
	return (
		<div
			style={{
				...coverFace(),
				flexDirection: 'column',
				padding: '22px 24px',
				color,
				...paint,
				fontWeight: 700,
			}}
		>
			<div
				style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, letterSpacing: 1 }}
			>
				<div>北科課程好朋友</div>
				<div>{period}</div>
			</div>
			<div style={{ ...rule, marginTop: 8 }} />
			<div
				style={{
					display: 'block',
					width: COVER.width - 48,
					marginTop: 22,
					fontSize: titleSize,
					lineHeight: 1.05,
					letterSpacing: -1,
					lineClamp: 3,
				}}
			>
				{title}
			</div>
			{subtitle && (
				<div
					style={{
						display: 'block',
						width: COVER.width - 48,
						marginTop: 12,
						fontSize: 15,
						lineHeight: 1.3,
						lineClamp: 2,
					}}
				>
					{subtitle}
				</div>
			)}
			<div style={{ flex: 1 }} />
			<div style={rule} />
			<div style={{ marginTop: 8, fontSize: 22, letterSpacing: 1 }}>{code}</div>
		</div>
	);
}

function createApiFetcher(apiBase = DEFAULT_API_BASE): FetchJson {
	const base = apiBase.replace(/\/$/, '');
	return async function fetchJson<T>(path: string) {
		const response = await fetch(`${base}${path}`);
		if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
		return response.json() as Promise<T>;
	};
}
