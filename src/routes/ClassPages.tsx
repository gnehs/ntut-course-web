import { AdsByGoogle } from '../components/AdsByGoogle';
import { Link, useParams } from '@tanstack/react-router';
import { useRouteLocation } from '../lib/routeLocation';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { CourseCollectionPage, CourseCollectionSkeleton } from '../components/CourseCollectionPage';
import {
	IconBook,
	IconBriefcase,
	IconBuilding,
	IconChevronDown,
	IconCpu,
	IconFlask,
	IconMinus,
	IconPlus,
	IconRocket,
	IconSchool,
	IconSettings,
	IconStar,
	IconVectorBezier,
	type TablerIcon,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { Alert } from '../components/ui-kit/Alert';
import { Button } from '../components/ui-kit/Button';
import { Card } from '../components/ui-kit/Card';
import { CardTitle } from '../components/ui-kit/CardTitle';
import { Input } from '../components/ui-kit/Input';
import { ClassIndexSkeleton } from '../components/ui-kit/PageSkeletons';
import { fetchCourse, fetchDepartment } from '../lib/courseApi';
import { departmentItems, storageDepartment } from '../lib/courseUtils';
import { usePageTitle } from '../lib/pageTitle';
import { createSearchParams } from '../lib/urlState';
import { useApp } from '../state/AppContext';
import type { Course, DepartmentClass, DepartmentGroup } from '../types/course';
import { errorMessage } from '../lib/error';
import { groupClassNames } from '../lib/classGroups';
import { useMediaQuery } from '../lib/useMediaQuery';
import { animateFilterSection, isReducedMotion } from '../lib/motion';
import { cn } from '../lib/utils';

const validClassDepartments = new Set(departmentItems.map(storageDepartment));

function resolveClassDepartment(queryDepartment: string | null, fallback: string) {
	if (!queryDepartment) return fallback;
	const department = storageDepartment(queryDepartment);
	return validClassDepartments.has(department) ? department : fallback;
}

export function ClassIndexPage() {
	const { dataset, myCourseClassKey, getCourses } = useApp();
	const [departments, setDepartments] = useState<DepartmentGroup[] | null>(null);
	const [recommendClass, setRecommendClass] = useState<
		(DepartmentClass & { description?: string })[]
	>([]);
	const [filter, setFilter] = useState('');
	const [error, setError] = useState<unknown>(null);

	useEffect(() => {
		if (!dataset.year || !dataset.sem) return undefined;
		let cancelled = false;
		setDepartments(null);
		setRecommendClass([]);
		setError(null);
		async function load() {
			try {
				const data = await fetchDepartment(dataset.year, dataset.sem);
				if (cancelled) return;
				setDepartments(data);
				const classData = data.flatMap((department) => department.class || []);
				const savedClassName = localStorage.getItem(myCourseClassKey());
				if (savedClassName && !localStorage.getItem('my-class')) {
					const found = classData.find((item) => item.name === savedClassName);
					if (found) localStorage.setItem('my-class', found.id);
				}
				const classId = localStorage.getItem('my-class');
				const userClass = classData.find(
					(item) => item.id === classId || item.name === savedClassName,
				);
				const recommendations: (DepartmentClass & { description?: string })[] = [];
				if (userClass) {
					recommendations.push({ ...userClass, description: '你的班級' });
					const courses = await getCourses({ year: dataset.year, sem: dataset.sem });
					const generalEducationClassNames = courses
						.filter((course) => (course.class || []).some((item) => item.name === userClass.name))
						.filter((course) => course.notes?.startsWith('請選：通識中心'))
						.map((course) =>
							(course.notes || '').replace('請選：通識中心', '').replace(/ |\//g, ''),
						);
					for (const name of [...new Set(generalEducationClassNames)]) {
						const found = classData.find((item) => item.name.replace(/ |\//g, '') === name);
						if (found) recommendations.push({ ...found, description: '博雅課程' });
					}
				}
				if (!cancelled) setRecommendClass(recommendations);
			} catch (e) {
				if (!cancelled) {
					setError(e);
					setDepartments([]);
				}
			}
		}
		load();
		return () => {
			cancelled = true;
		};
	}, [dataset.year, dataset.sem]);

	const filteredDepartmentData = useMemo(() => {
		if (!departments) return null;
		if (!filter) return departments;
		try {
			return departments
				.filter(
					(department) =>
						(department.name || '').match(filter) ||
						(department.class || [])
							.map((item) => item.name)
							.join('')
							.match(filter),
				)
				.map((department) => ({
					...department,
					class: (department.class || []).filter((item) => item.name.match(filter)),
				}))
				.filter((department) => department.class.length);
		} catch (e) {
			setError(e);
			return [];
		}
	}, [departments, filter]);

	const colleges = useMemo(() => {
		const byCategory = new Map<string, DepartmentGroup[]>();
		for (const department of filteredDepartmentData || []) {
			const name = department.category || '其他';
			byCategory.set(name, [...(byCategory.get(name) || []), department]);
		}
		return [...byCategory].map(([name, departments]) => ({ name, departments }));
	}, [filteredDepartmentData]);

	const isWide = useMediaQuery('(min-width: 48rem)');
	const [expandedDepartment, setExpandedDepartment] = useState<string | null>(null);
	const userClassName = recommendClass.find((item) => item.description === '你的班級')?.name;
	const userDepartment = (departments || []).find((department) =>
		(department.class || []).some((item) => item.name === userClassName),
	)?.name;
	// Until someone opens a department on mobile, open the one holding their saved class.
	const openDepartment = expandedDepartment ?? userDepartment;
	const departmentNames = useMemo(
		() => (filteredDepartmentData || []).map((department) => department.name),
		[filteredDepartmentData],
	);
	const spiedDepartment = useScrollSpy(isWide ? departmentNames : [], departmentAnchor);
	const navRef = useRef<HTMLElement | null>(null);
	const classHref = (name: string) =>
		`/class/${dataset.year}/${dataset.sem}/${name}?d=${dataset.department}`;

	useEffect(() => {
		// Keep the highlighted entry inside the nav's own scroll box without moving the page.
		const nav = navRef.current;
		const item = nav?.querySelector<HTMLElement>('[aria-current="true"]');
		if (!nav || !item) return;
		const navBox = nav.getBoundingClientRect();
		const itemBox = item.getBoundingClientRect();
		const margin = 48;
		if (itemBox.top < navBox.top + margin) nav.scrollTop -= navBox.top + margin - itemBox.top;
		else if (itemBox.bottom > navBox.bottom - margin)
			nav.scrollTop += itemBox.bottom - (navBox.bottom - margin);
	}, [spiedDepartment]);

	if (!departments) return <ClassIndexSkeleton />;

	return (
		<div className='space-y-4'>
			<h1>選擇班級</h1>
			<Input
				value={filter}
				onChange={(event) => setFilter(event.target.value)}
				placeholder='輸入關鍵字來篩選...'
			/>
			{error ? (
				<Alert danger>
					<strong>搜尋時發生了錯誤</strong>
					<pre>{errorMessage(error)}</pre>
				</Alert>
			) : null}
			{recommendClass.length ? (
				<>
					<h3>建議</h3>
					<p>根據你先前儲存的班級所提供的建議</p>
					<div className='grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-3'>
						{recommendClass.map((item, index) => (
							<Card
								className='px-4 py-3'
								key={`${item.id}-${index}`}
								to={`/class/${dataset.year}/${dataset.sem}/${item.name}?d=${dataset.department}`}
							>
								<CardTitle>{item.name}</CardTitle>
								<p>{item.description}</p>
								<IconStar data-card-icon />
							</Card>
						))}
					</div>
				</>
			) : null}
			{colleges.length ? (
				isWide ? (
					<div className='grid grid-cols-[13rem_minmax(0,1fr)] items-start gap-6'>
						<nav
							aria-label='系所'
							className='sticky top-20 -mx-2 max-h-[calc(100dvh-6rem)] space-y-4 overflow-y-auto px-2 pb-4'
							ref={navRef}
						>
							{colleges.map((college) => (
								<div key={college.name}>
									<p className='m-0 mb-1 flex items-center gap-1.5 px-2 text-xs font-medium text-[var(--muted-foreground)]'>
										<CollegeIcon className='size-3.5' name={college.name} />
										{college.name}
									</p>
									{college.departments.map((department) => (
										<DepartmentNavItem
											active={department.name === spiedDepartment}
											department={department}
											key={department.name}
											onSelect={() => scrollToDepartment(department.name)}
										/>
									))}
								</div>
							))}
						</nav>
						<div className='space-y-10'>
							{colleges.map((college) => (
								<section className='flex flex-col gap-3' key={college.name}>
									<h2 className='m-0 flex items-center gap-2 px-1 pt-2 pb-1 text-xl font-bold'>
										<CollegeIcon className='size-5' name={college.name} />
										{college.name}
									</h2>
									{college.departments.map((department) => (
										<section
											className='scroll-mt-20 rounded-xl bg-[rgb(var(--vs-background))] p-5 shadow-[var(--shadow-rest)]'
											id={departmentAnchor(department.name)}
											key={department.name}
										>
											<h3 className='m-0 mb-4 text-lg font-bold'>
												{department.name}
											</h3>
											<DepartmentClasses department={department} href={classHref} />
										</section>
									))}
								</section>
							))}
						</div>
					</div>
				) : (
					colleges.map((college) => (
						<section className='flex flex-col gap-3 pt-3 first:pt-0' key={college.name}>
							<h2 className='m-0 flex items-center gap-2 px-1 text-lg font-bold'>
								<CollegeIcon className='size-5' name={college.name} />
								{college.name}
							</h2>
							<div className='divide-y divide-[rgba(var(--vs-text),0.08)] overflow-hidden rounded-xl bg-[rgb(var(--vs-background))] shadow-[var(--shadow-rest)]'>
								{college.departments.map((department) => (
									<DepartmentDisclosure
										department={department}
										href={classHref}
										key={department.name}
										onToggle={(open) => setExpandedDepartment(open ? department.name : '')}
										open={department.name === openDepartment}
									/>
								))}
							</div>
						</section>
					))
				)
			) : null}
		</div>
	);
}

const collegeIcons: Record<string, TablerIcon> = {
	校院級: IconSchool,
	機電學院: IconSettings,
	工程學院: IconFlask,
	管理學院: IconBriefcase,
	設計學院: IconVectorBezier,
	人文與社會科學學院: IconBook,
	電資學院: IconCpu,
	創新前瞻科技研究學院: IconRocket,
};

function CollegeIcon({ name, className }: { name: string; className?: string }) {
	const Icon = collegeIcons[name] ?? IconBuilding;
	return <Icon aria-hidden className={cn('shrink-0 text-[var(--icon-muted)]', className)} />;
}

function departmentAnchor(name: string) {
	return `department-${name}`;
}

const SECTION_GAP = 16;

/** Where content stops being hidden: the bottom edge of the sticky page toolbar, if one is shown. */
function stickyToolbarBottom() {
	const toolbar = document.querySelector('nav[aria-label="頁面工具列"]');
	return Math.max(0, toolbar?.getBoundingClientRect().bottom ?? 0);
}

function scrollToDepartment(name: string) {
	const element = document.getElementById(departmentAnchor(name));
	if (!element) return;
	window.scrollTo({
		top: element.getBoundingClientRect().top + window.scrollY - stickyToolbarBottom() - SECTION_GAP,
		behavior: isReducedMotion() ? 'auto' : 'smooth',
	});
}

/** The section whose top last slid under the sticky toolbar is the one being read. */
function useScrollSpy(names: string[], anchor: (name: string) => string) {
	const [active, setActive] = useState<string | undefined>(names[0]);
	useEffect(() => {
		if (!names.length) return undefined;
		let frame = 0;
		function update() {
			frame = 0;
			const atBottom =
				window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
			// A jump lands a section SECTION_GAP below the toolbar, so allow that much slack plus rounding.
			const line = stickyToolbarBottom() + SECTION_GAP + 2;
			let current = names[0];
			for (const name of names) {
				const element = document.getElementById(anchor(name));
				if (!element) continue;
				if (atBottom || element.getBoundingClientRect().top <= line) current = name;
				else break;
			}
			setActive(current);
		}
		function schedule() {
			if (!frame) frame = requestAnimationFrame(update);
		}
		update();
		window.addEventListener('scroll', schedule, { passive: true });
		window.addEventListener('resize', schedule);
		return () => {
			cancelAnimationFrame(frame);
			window.removeEventListener('scroll', schedule);
			window.removeEventListener('resize', schedule);
		};
	}, [names, anchor]);
	return active;
}

function DepartmentDisclosure({
	department,
	href,
	open,
	onToggle,
}: {
	department: DepartmentGroup;
	href: (name: string) => string;
	open: boolean;
	onToggle: (open: boolean) => void;
}) {
	// Mirrors the advanced search filter sections: content stays mounted until it has animated shut.
	const [rendered, setRendered] = useState(open);
	const contentRef = useRef<HTMLDivElement | null>(null);
	const iconRef = useRef<SVGSVGElement | null>(null);
	const mountedRef = useRef(false);
	const initiallyRenderedRef = useRef(open);

	useEffect(() => {
		if (open) setRendered(true);
	}, [open]);

	useEffect(() => {
		if (!rendered) return undefined;
		const cleanup = animateFilterSection(
			contentRef.current,
			iconRef.current,
			open,
			!mountedRef.current && initiallyRenderedRef.current,
			() => {
				if (!open) setRendered(false);
			},
		);
		mountedRef.current = true;
		return cleanup;
	}, [open, rendered]);

	return (
		<div>
			<button
				aria-expanded={open}
				className='flex min-h-12 w-full items-center gap-2 px-4 text-left text-[0.95rem] font-medium'
				onClick={() => onToggle(!open)}
				type='button'
			>
				<span className='flex-1'>{department.name}</span>
				<IconChevronDown aria-hidden className='size-4 text-[var(--icon-muted)]' ref={iconRef} />
			</button>
			{rendered ? (
				// The clip box starts a few px above the buttons so their shadow rims are not cut off.
				<div aria-hidden={!open} className='overflow-hidden' ref={contentRef}>
					<div className='px-4 pt-1 pb-4'>
						<DepartmentClasses department={department} href={href} />
					</div>
				</div>
			) : null}
		</div>
	);
}

function DepartmentNavItem({
	department,
	active,
	onSelect,
}: {
	department: DepartmentGroup;
	active: boolean;
	onSelect: () => void;
}) {
	return (
		<button
			aria-current={active ? 'true' : undefined}
			className={cn(
				'flex w-full items-baseline gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors duration-150',
				active
					? 'bg-[rgba(var(--vs-primary),0.12)] font-medium text-[color-mix(in_srgb,rgb(var(--vs-primary))_86%,rgb(var(--vs-text)))]'
					: 'text-foreground hover:bg-[rgba(var(--vs-text),0.05)]',
			)}
			onClick={onSelect}
			type='button'
		>
			<span className='flex-1'>{department.name}</span>
		</button>
	);
}

function ClassButton({ name, label, href }: { name: string; label: string; href: string }) {
	return (
		<Button
			aria-label={name === label ? undefined : name}
			as={Link}
			className='min-w-11 !no-underline'
			title={name}
			to={href}
		>
			{label}
		</Button>
	);
}

function DepartmentClasses({
	department,
	href,
}: {
	department: DepartmentGroup;
	href: (name: string) => string;
}) {
	const groups = groupClassNames((department.class || []).map((item) => item.name));
	// 化工系's numbers are grades of 化工, so they need no prefix; 體育室's 體育專項 does.
	const captionFor = (prefix: string, fallback: string) =>
		department.name.startsWith(prefix) ? fallback : prefix;
	const singles = groups.flatMap((group) => (group.kind === 'single' ? [group.name] : []));
	const hasPatterns = singles.length < groups.length;
	const caption = (text: string) =>
		text ? (
			<p className='m-0 mb-2 text-xs font-medium text-[var(--muted-foreground)]'>{text}</p>
		) : null;
	return (
		<div className='space-y-5'>
			{groups.map((group) => {
				if (group.kind === 'grades')
					return (
						<div key={group.prefix}>
							{caption(captionFor(group.prefix, ''))}
							<div className='grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2'>
								{group.rows.map((row) => (
									<Fragment key={row.label}>
										<span className='text-sm text-[var(--muted-foreground)]'>{row.label}</span>
										<div className='flex flex-wrap gap-2'>
											{row.items.map((item) => (
												<ClassButton {...item} href={href(item.name)} key={item.name} />
											))}
										</div>
									</Fragment>
								))}
							</div>
						</div>
					);
				if (group.kind === 'series' || group.kind === 'variants')
					return (
						<div key={group.prefix}>
							{caption(group.kind === 'series' ? captionFor(group.prefix, '年級') : group.prefix)}
							<div className='flex flex-wrap gap-2'>
								{group.kind === 'variants' && group.base ? (
									<ClassButton name={group.base} label={group.base} href={href(group.base)} />
								) : null}
								{group.items.map((item) => (
									<ClassButton {...item} href={href(item.name)} key={item.name} />
								))}
							</div>
						</div>
					);
				return null;
			})}
			{singles.length ? (
				<div>
					{caption(hasPatterns ? '其他' : '')}
					<div className='flex flex-wrap gap-2'>
						{singles.map((name) => (
							<ClassButton href={href(name)} key={name} label={name} name={name} />
						))}
					</div>
				</div>
			) : null}
		</div>
	);
}

export function ClassDetailPage() {
	const { year, sem, id } = useParams({ from: '/class/$year/$sem/$id' });
	const location = useRouteLocation();
	const { dataset, addCourse, removeCourse, myCourseClassKey } = useApp();
	const searchParams = useMemo(() => createSearchParams(location.search), [location.search]);
	const requestedDepartment = searchParams.get('d');
	const department = useMemo(
		() => resolveClassDepartment(requestedDepartment, dataset.department),
		[requestedDepartment, dataset.department],
	);
	const [courses, setCourses] = useState<Course[] | null>(null);
	const [classData, setClassData] = useState<DepartmentClass | null>(null);
	const [version, setVersion] = useState(0);
	const isInMyCourse = localStorage.getItem(myCourseClassKey(year, sem)) === id;
	usePageTitle(classData?.name || id);

	useEffect(() => {
		let cancelled = false;
		setCourses(null);
		setClassData(null);
		async function load() {
			const [departments, allCourses] = await Promise.all([
				fetchDepartment(year, sem),
				fetchCourse(year, sem, department),
			]);
			const foundClass = departments
				.flatMap((item) => item.class || [])
				.find((item) => item.name === id || item.id === id);
			const result = allCourses.filter((course) =>
				(course.class || []).some((item) => item.name === id || item.id === id),
			);
			if (!cancelled) {
				setClassData(foundClass || null);
				setCourses(result);
			}
		}
		load().catch(() => {
			if (!cancelled) setCourses([]);
		});
		return () => {
			cancelled = true;
		};
	}, [year, sem, id, version, department]);

	function addClassCourses() {
		const previous = localStorage.getItem(myCourseClassKey(year, sem));
		if (
			previous &&
			previous !== id &&
			!confirm(`你先前已將「${previous}」之課程加入我的課程，此行為會導致課程過多，要繼續嗎？`)
		) {
			return;
		}
		localStorage.setItem('my-class', classData?.id || id);
		localStorage.setItem(myCourseClassKey(year, sem), id);
		for (const course of courses || []) addCourse(course.id, year, sem, department);
		toast.success(`已加入 ${courses?.length || 0} 門課程`, {
			description: `${id} 已加入我的課程`,
		});
		setVersion((value) => value + 1);
	}

	function removeClassCourses() {
		for (const course of courses || []) removeCourse(course.id, year, sem, department);
		localStorage.removeItem(myCourseClassKey(year, sem));
		toast.success(`已移除 ${courses?.length || 0} 門課程`, {
			description: `${id} 已從我的課程移除`,
		});
		setVersion((value) => value + 1);
	}

	if (!courses) return <CourseCollectionSkeleton label='載入班級課程' />;

	return (
		<CourseCollectionPage
			title={id}
			year={year}
			sem={sem}
			groups={[{ key: 'class', department, courses }]}
			actions={
				!isInMyCourse ? (
					<Button primary onClick={addClassCourses}>
						<IconPlus className='size-4' />
						加入到我的課程
					</Button>
				) : (
					<Button danger onClick={removeClassCourses}>
						<IconMinus className='size-4' />
						從我的課程中移除
					</Button>
				)
			}
			emptyState={classData ? <Alert>此班級目前沒有課程。</Alert> : undefined}
			savedVersion={version}
			footer={
				<section className='border-t border-[rgba(var(--vs-text),0.1)] pt-4 has-[[data-ad-collapsed]]:hidden'>
					<AdsByGoogle title='贊助商廣告' />
				</section>
			}
		/>
	);
}
