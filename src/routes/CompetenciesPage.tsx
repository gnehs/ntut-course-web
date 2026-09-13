import { Link } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';
import { Alert } from '../components/ui-kit/Alert';
import { Card } from '../components/ui-kit/Card';
import { CardTitle } from '../components/ui-kit/CardTitle';
import { Input } from '../components/ui-kit/Input';
import { Select, SelectOption } from '../components/ui-kit/Select';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { fetchCompetencies } from '../lib/courseApi';
import { errorMessage } from '../lib/error';
import { usePageTitle } from '../lib/pageTitle';
import type { CompetencyDepartment } from '../types/course';

const APS_COURSE_ROOT = 'https://aps.ntut.edu.tw/course/tw/';

/** Keep the link contract used by AdvancedSearchPage: q is a JSON object with k. */
export function advancedSearchCourseHref(courseName: string) {
	const params = new URLSearchParams();
	params.set('q', JSON.stringify({ k: courseName }));
	return `/advanced-search?${params.toString()}`;
}

export function safeCompetencyHref(href: string | undefined | null) {
	if (!href) return null;
	try {
		const url = new URL(href, APS_COURSE_ROOT);
		return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
	} catch {
		return null;
	}
}

function normalized(value: unknown) {
	return String(value ?? '')
		.trim()
		.toLocaleLowerCase();
}

export function CompetenciesPage() {
	const [departments, setDepartments] = useState<CompetencyDepartment[] | null>(null);
	const [unavailable, setUnavailable] = useState(false);
	const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
	const [filter, setFilter] = useState('');
	const [error, setError] = useState<unknown>(null);
	usePageTitle('核心能力');

	useEffect(() => {
		let cancelled = false;
		setDepartments(null);
		setUnavailable(false);
		setSelectedDepartmentId('');
		setError(null);

		fetchCompetencies()
			.then((data) => {
				if (cancelled) return;
				setUnavailable(data === null);
				setDepartments(data || []);
				setSelectedDepartmentId(data?.[0]?.id || '');
			})
			.catch((reason) => {
				if (cancelled) return;
				setError(reason);
				setDepartments([]);
			});

		return () => {
			cancelled = true;
		};
	}, []);

	const selectedDepartment = useMemo(() => {
		if (!departments?.length) return undefined;
		return (
			departments.find((department) => department.id === selectedDepartmentId) || departments[0]
		);
	}, [departments, selectedDepartmentId]);

	const abilityById = useMemo(
		() => new Map((selectedDepartment?.abilities || []).map((ability) => [ability.id, ability])),
		[selectedDepartment],
	);
	const visibleCourses = useMemo(() => {
		const keyword = normalized(filter);
		if (!selectedDepartment) return [];
		return selectedDepartment.courses.filter((course) => {
			if (!keyword) return true;
			const abilityNames = course.abilityIds
				.map((abilityId) => abilityById.get(abilityId)?.name)
				.filter(Boolean);
			return [course.code, course.name, ...course.abilityIds, ...abilityNames].some((value) =>
				normalized(value).includes(keyword),
			);
		});
	}, [abilityById, filter, selectedDepartment]);

	const visibleAbilities = useMemo(() => {
		if (!selectedDepartment) return [];
		const keyword = normalized(filter);
		if (!keyword) return selectedDepartment.abilities;
		const relatedAbilityIds = new Set(visibleCourses.flatMap((course) => course.abilityIds));
		return selectedDepartment.abilities.filter(
			(ability) => normalized(ability.name).includes(keyword) || relatedAbilityIds.has(ability.id),
		);
	}, [filter, selectedDepartment, visibleCourses]);

	if (!departments)
		return (
			<div className='flex flex-col gap-4' aria-busy='true' aria-label='載入核心能力'>
				<Skeleton className='h-8 w-32' />
				<Skeleton className='h-11 w-full' />
				<div className='grid gap-3 sm:grid-cols-2'>
					<Skeleton className='h-48 w-full' />
					<Skeleton className='h-48 w-full' />
				</div>
			</div>
		);

	return (
		<div className='flex flex-col gap-4'>
			<div>
				<h1>核心能力</h1>
				<p className='m-0 text-sm opacity-70'>查看系所課程與核心能力的對照關係</p>
			</div>

			<Alert>資料僅供課程與核心能力對照，不代表個人的畢業資格或修課認定。</Alert>

			{error ? (
				<Alert danger>
					<strong>核心能力資料載入失敗</strong>
					<p className='mt-1 mb-0 text-sm'>{errorMessage(error)}</p>
				</Alert>
			) : null}

			{unavailable ? (
				<Alert>
					<strong>目前尚未提供核心能力資料</strong>
					<p className='mt-1 mb-0 text-sm opacity-75'>資料發布後會在此顯示。</p>
				</Alert>
			) : null}

			{!error && !unavailable && !departments.length ? <Alert>目前沒有核心能力資料。</Alert> : null}

			{departments.length ? (
				<>
					<div className='grid gap-3 sm:grid-cols-2'>
						<div className='flex flex-col gap-1'>
							<span className='text-sm font-medium'>系所</span>
							<Select
								value={selectedDepartment?.id || ''}
								onChange={setSelectedDepartmentId}
								aria-label='選擇系所'
							>
								{departments.map((department) => (
									<SelectOption key={department.id} value={department.id}>
										{department.name}
									</SelectOption>
								))}
							</Select>
						</div>

						<div className='flex flex-col gap-1'>
							<label htmlFor='competency-search' className='text-sm font-medium'>
								搜尋能力或課程
							</label>
							<div className='relative'>
								<Search className='pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 opacity-50' />
								<Input
									id='competency-search'
									value={filter}
									onChange={(event) => setFilter(event.target.value)}
									placeholder='輸入能力名稱、課程代碼或課程名稱'
									className='pl-10'
								/>
							</div>
						</div>
					</div>

					{selectedDepartment ? (
						<div className='flex flex-col gap-4'>
							<div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
								<div>
									<h2 className='text-lg font-semibold'>{selectedDepartment.name}</h2>
									<p className='m-0 text-sm opacity-65'>
										{visibleCourses.length} 門課程・{visibleAbilities.length} 項核心能力
									</p>
								</div>
								{safeCompetencyHref(selectedDepartment.href) ? (
									<a
										href={safeCompetencyHref(selectedDepartment.href)!}
										target='_blank'
										rel='noreferrer'
										className='inline-flex items-center gap-1 text-sm underline underline-offset-2'
									>
										學校原始資料 <ExternalLink className='size-4' />
									</a>
								) : null}
							</div>

							<div className='grid gap-4 lg:grid-cols-[minmax(14rem,0.8fr)_minmax(0,1.6fr)]'>
								<section className='flex flex-col gap-2' aria-labelledby='ability-heading'>
									<h3 id='ability-heading' className='text-base font-semibold'>
										核心能力
									</h3>
									<Card className='flex flex-col gap-2 px-4 py-3'>
										{visibleAbilities.length ? (
											visibleAbilities.map((ability) => (
												<div
													key={ability.id}
													className='flex items-start gap-2 border-b border-[rgba(var(--vs-text),0.08)] py-2 first:pt-0 last:border-0 last:pb-0'
												>
													<Badge variant='outline' className='font-mono'>
														{ability.id}
													</Badge>
													<span className='min-w-0 text-sm'>{ability.name}</span>
												</div>
											))
										) : (
											<p className='m-0 text-sm opacity-70'>沒有符合的核心能力。</p>
										)}
									</Card>
								</section>

								<section className='flex flex-col gap-2' aria-labelledby='course-heading'>
									<h3 id='course-heading' className='text-base font-semibold'>
										課程對照
									</h3>
									<div className='grid gap-3'>
										{visibleCourses.length ? (
											visibleCourses.map((course) => {
												const abilities = course.abilityIds
													.map((abilityId) => abilityById.get(abilityId))
													.filter(Boolean);
												return (
													<Card key={course.code} className='flex flex-col gap-3 px-4 py-3'>
														<div>
															<Link
																to={advancedSearchCourseHref(course.name)}
																className='font-mono text-sm underline underline-offset-2'
															>
																{course.code}
															</Link>
															<CardTitle className='mt-1'>{course.name}</CardTitle>
														</div>
														<div
															className='flex flex-wrap gap-1'
															aria-label={`${course.name}的核心能力`}
														>
															{abilities.length ? (
																abilities.map((ability) => (
																	<Badge key={ability!.id} variant='secondary'>
																		{ability!.name}
																	</Badge>
																))
															) : (
																<span className='text-sm opacity-65'>未提供核心能力對應</span>
															)}
														</div>
													</Card>
												);
											})
										) : (
											<Alert>沒有符合的課程。</Alert>
										)}
									</div>
								</section>
							</div>
						</div>
					) : null}
				</>
			) : null}
		</div>
	);
}
