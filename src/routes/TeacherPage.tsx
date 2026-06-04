import { AdsByGoogle } from '../components/AdsByGoogle';
import { Link, useParams } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Alert } from '../components/ui-kit/Alert';
import { Button } from '../components/ui-kit/Button';
import { Card } from '../components/ui-kit/Card';
import { CardTitle } from '../components/ui-kit/CardTitle';
import { TeacherSkeleton } from '../components/ui-kit/PageSkeletons';
import { fetchWithdrawal, fetchWithdrawalRate } from '../lib/courseApi';
import type { TeacherWithdrawalCourse, WithdrawalRateMap, WithdrawalStat } from '../types/course';

export function TeacherPage() {
	const { id } = useParams({ from: '/teacher/$id' });
	const [department, setDepartment] = useState(localStorage.getItem('data-department') || 'main');
	const [teacher, setTeacher] = useState<WithdrawalStat | false | null>(null);
	const [rates, setRates] = useState<{
		all: WithdrawalRateMap;
		r3: WithdrawalRateMap;
		r5: WithdrawalRateMap;
	} | null>(null);
	const [error, setError] = useState<unknown>(null);
	useEffect(() => {
		let cancelled = false;
		Promise.all([
			fetchWithdrawalRate(''),
			fetchWithdrawalRate('-recent-3-years'),
			fetchWithdrawalRate('-recent-5-years'),
			fetchWithdrawal(''),
		])
			.then(([all, r3, r5, data]) => {
				if (cancelled) return;
				if (!all[id]) {
					setError('找不到教師');
					setTeacher(false);
					return;
				}
				setTeacher(data.data?.find((item) => item.name === id) || false);
				setRates({ all, r3, r5 });
			})
			.catch((e) => {
				if (!cancelled) {
					setError(e);
					setTeacher(false);
				}
			});
		return () => {
			cancelled = true;
		};
	}, [id]);
	if (id === '朴維鎮') {
		globalThis.location.href = '/not-found';
		return null;
	}
	if (teacher === false) return <Alert danger>{String(error || '找不到教師')}</Alert>;
	if (!teacher || !rates) return <TeacherSkeleton />;
	const courses = (teacher.course || []).filter((item) => item.department === department);
	const stats = [
		{ name: '近三年退選率', value: rates.r3[id] ?? '無資料' },
		{ name: '近五年退選率', value: rates.r5[id] ?? '無資料' },
		{ name: '全期間退選率', value: rates.all[id] },
	];
	function selectDepartment(value: string) {
		setDepartment(value);
		localStorage.setItem('data-department', value);
	}
	return (
		<div>
			<h1 className='mb-3'>{id}</h1>
			<div className='grid gap-3 sm:grid-cols-3 lg:grid-cols-6'>
				<Card>
					<CardTitle>{teacher.withdraw}</CardTitle>
					<p>退選人數</p>
				</Card>
				<Card>
					<CardTitle>{teacher.people}</CardTitle>
					<p>選課人數</p>
				</Card>
				<Card>
					<CardTitle>{teacher.course?.length || 0}</CardTitle>
					<p>課程數</p>
				</Card>
				{stats.map((item) => (
					<Card key={item.name}>
						<CardTitle>{item.value}%</CardTitle>
						<p>{item.name}</p>
					</Card>
				))}
			</div>
			<div className='flex flex-wrap items-center justify-between gap-2'>
				<div>
					<h3>課程</h3>
				</div>
				<div className='flex flex-wrap justify-end gap-1'>
					<Button
						className='m-0'
						active={department === 'main'}
						onClick={() => selectDepartment('main')}
					>
						日間部
					</Button>
					<Button
						className='m-0'
						active={department === '進修部'}
						onClick={() => selectDepartment('進修部')}
					>
						進修部
					</Button>
					<Button
						className='m-0'
						active={department === '研究所(日間部、進修部、週末碩士班)'}
						onClick={() => selectDepartment('研究所(日間部、進修部、週末碩士班)')}
					>
						研究所
					</Button>
				</div>
			</div>
			<div className='mt-2 grid gap-3 md:grid-cols-2'>
				{courses.map((course: TeacherWithdrawalCourse) => (
					<Link
						className='grid cursor-pointer grid-cols-[auto_1fr_auto_auto] items-center gap-x-2 gap-y-0 rounded-lg bg-[rgb(var(--vs-background))] p-2 shadow-[0_5px_20px_0_rgba(0,0,0,var(--vs-shadow-opacity,0.05))] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_10px_20px_0_rgba(0,0,0,var(--vs-shadow-opacity,0.05))] active:translate-y-[5px] active:shadow-none'
						to={`/course/${course.year}/${course.sem}/${course.id}`}
						key={`${course.year}-${course.sem}-${course.id}`}
					>
						<div>
							<div className='text-base font-semibold'>{course.id}</div>
							<div className='text-xs opacity-80'>
								{course.year} 年{course.sem === '1' ? '上' : '下'}學期
							</div>
						</div>
						<div>
							<div className='text-base font-semibold'>
								{course.courseType} {course.name?.zh}
							</div>
							<div className='text-xs opacity-80'>{course.name?.en}</div>
						</div>
						<div className='flex flex-col items-center justify-center px-2'>
							<div className='text-base font-semibold'>{course.peopleWithdraw}</div>
							<div className='text-xs opacity-80'>退選</div>
						</div>
						<div className='flex flex-col items-center justify-center px-2'>
							<div className='text-base font-semibold'>{course.people}</div>
							<div className='text-xs opacity-80'>選課</div>
						</div>
					</Link>
				))}
			</div>
			{courses.length ? null : <p>尚無課程，請選擇其他分類</p>}
			<h3 className='mb-4'>贊助商廣告</h3>
			<AdsByGoogle />
		</div>
	);
}
