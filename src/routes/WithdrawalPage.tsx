import { useEffect, useMemo, useState } from 'react';
import { Card } from '../components/ui-kit/Card';
import { CardTitle } from '../components/ui-kit/CardTitle';
import { Input } from '../components/ui-kit/Input';
import { WithdrawalSkeleton } from '../components/ui-kit/PageSkeletons';
import { Select, SelectOption } from '../components/ui-kit/Select';
import { fetchWithdrawal } from '../lib/courseApi';
import {
	classifyWithdrawalRate,
	createWithdrawalRateDistribution,
	formatWithdrawalRate,
	formatWithdrawalThreshold,
	numberValue,
	type WithdrawalRateDistribution,
	type WithdrawalRateLevel,
} from '../lib/withdrawalStats';
import type { WithdrawalResponse, WithdrawalStat } from '../types/course';

type SortMode = 'rate-desc' | 'rate-asc' | 'withdraw-desc' | 'people-desc' | 'name-asc';
type GroupMode = 'risk' | 'none';

export function WithdrawalPage() {
	const [period, setPeriod] = useState('-recent-3-years');
	const [keyword, setKeyword] = useState('');
	const [sortBy, setSortBy] = useState<SortMode>('rate-desc');
	const [groupBy, setGroupBy] = useState<GroupMode>('risk');
	const [data, setData] = useState<WithdrawalStat[] | null>(null);
	const [stat, setStat] = useState<WithdrawalResponse['stat'] | null>(null);
	const suffix = period === 'all' ? '' : period;
	useEffect(() => {
		let cancelled = false;
		setData(null);
		setStat(null);
		fetchWithdrawal(suffix)
			.then((value) => {
				if (!cancelled) {
					setData(value.data || []);
					setStat(value.stat || []);
				}
			})
			.catch(() => {
				if (!cancelled) {
					setData([]);
					setStat([]);
				}
			});
		return () => {
			cancelled = true;
		};
	}, [suffix]);
	const rows = useMemo(() => data || [], [data]);
	const distribution = useMemo(
		() => createWithdrawalRateDistribution(rows.map((item) => rateValue(item))),
		[rows],
	);
	const filteredRows = useMemo(() => {
		const normalizedKeyword = keyword.trim().toLowerCase();
		const filtered = normalizedKeyword
			? rows.filter((item) => matchesKeyword(item, normalizedKeyword))
			: rows;
		return [...filtered].sort((a, b) => compareWithdrawalRows(a, b, sortBy));
	}, [rows, keyword, sortBy]);
	const groupedRows = useMemo(
		() =>
			groupBy === 'risk'
				? groupWithdrawalRows(filteredRows, distribution)
				: [{ title: '全部教師', rows: filteredRows }],
		[filteredRows, groupBy, distribution],
	);
	return (
		<div className='space-y-4'>
			<h1>退選率</h1>
			<p>這是期間中所有教師的退選率統計頁面</p>
			<div className='grid gap-3 rounded-lg border border-[rgba(var(--vs-text),0.1)] bg-[rgb(var(--vs-background))] p-3 md:grid-cols-[minmax(180px,1fr)_160px_180px_160px]'>
				<label className='grid gap-1 text-sm font-medium'>
					<span>搜尋教師或課程</span>
					<Input
						value={keyword}
						onChange={(event) => setKeyword(event.target.value)}
						placeholder='輸入教師、課程名稱'
					/>
				</label>
				<label className='grid gap-1 text-sm font-medium'>
					<span>期間</span>
					<Select value={period} onChange={(value) => setPeriod(value)}>
						<SelectOption value='-recent-3-years'>過去三年</SelectOption>
						<SelectOption value='-recent-5-years'>過去五年</SelectOption>
						<SelectOption value='all'>所有期間</SelectOption>
					</Select>
				</label>
				<label className='grid gap-1 text-sm font-medium'>
					<span>排序</span>
					<Select value={sortBy} onChange={(value) => setSortBy(value as SortMode)}>
						<SelectOption value='rate-desc'>退選率高到低</SelectOption>
						<SelectOption value='rate-asc'>退選率低到高</SelectOption>
						<SelectOption value='withdraw-desc'>退選人數多到少</SelectOption>
						<SelectOption value='people-desc'>選課人數多到少</SelectOption>
						<SelectOption value='name-asc'>教師姓名</SelectOption>
					</Select>
				</label>
				<label className='grid gap-1 text-sm font-medium'>
					<span>分組</span>
					<Select value={groupBy} onChange={(value) => setGroupBy(value as GroupMode)}>
						<SelectOption value='risk'>依退選率</SelectOption>
						<SelectOption value='none'>不分組</SelectOption>
					</Select>
				</label>
			</div>
			{!data ? (
				<WithdrawalSkeleton />
			) : (
				<>
					{stat ? (
						<div className='grid gap-3 sm:grid-cols-1 lg:grid-cols-2'>
							{Array.isArray(stat)
								? stat.map((item, index) => (
										<Card key={`${item.title}-${index}`}>
											<CardTitle>{item.value}</CardTitle>
											<p>{item.title}</p>
										</Card>
									))
								: Object.entries(stat).map(([key, value]) => (
										<Card key={key}>
											<CardTitle>{value}</CardTitle>
											<p>{key}</p>
										</Card>
									))}
						</div>
					) : null}
					<div className='flex items-center justify-between gap-3 text-sm opacity-75'>
						<div>
							顯示 {filteredRows.length} / {rows.length} 位教師
						</div>
						{distribution ? (
							<div className='text-right'>
								平均 {formatWithdrawalThreshold(distribution.mean)}，標準差{' '}
								{formatWithdrawalThreshold(distribution.standardDeviation)}
							</div>
						) : null}
					</div>
					{filteredRows.length ? (
						<div className='grid gap-5'>
							{groupedRows
								.filter((group) => group.rows.length)
								.map((group) => (
									<section key={group.title} className='relative grid'>
										<div className='sticky top-14.5 z-10 -mx-4 flex items-baseline justify-between gap-3 bg-linear-to-b from-[rgb(var(--vs-gray-1))] to-[rgb(var(--vs-gray-1))]/0 p-4'>
											<h2 className='text-lg font-semibold'>{group.title}</h2>
											<div className='text-sm opacity-70'>{group.rows.length} 位教師</div>
										</div>
										<div className='grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-2'>
											{group.rows.map((item) => (
												<WithdrawalTeacherCard
													item={item}
													distribution={distribution}
													key={item.name}
												/>
											))}
										</div>
									</section>
								))}
						</div>
					) : (
						<Card>
							<CardTitle>查無資料</CardTitle>
							<p>請調整搜尋關鍵字或期間。</p>
						</Card>
					)}
				</>
			)}
		</div>
	);
}

function WithdrawalTeacherCard({
	item,
	distribution,
}: {
	item: WithdrawalStat;
	distribution: WithdrawalRateDistribution | null;
}) {
	const classification = classifyWithdrawalRate(rateValue(item), distribution);
	const courseSummary = (item.course || [])
		.map((course) => course.name?.zh)
		.filter(Boolean)
		.slice(0, 2)
		.join('、');

	return (
		<Card to={`/teacher/${item.name}`} className='padding hoverable'>
			<CardTitle>{item.name}</CardTitle>
			<div className='text-lg font-semibold'>{formatWithdrawalRate(rateValue(item))}%</div>
			<p>
				{item.withdraw ?? 0} 人退選 / {item.people ?? 0} 人選課
			</p>
			{courseSummary ? <p>{courseSummary}</p> : null}
		</Card>
	);
}

function matchesKeyword(item: WithdrawalStat, keyword: string) {
	const haystack = [
		item.name,
		...(item.course || []).flatMap((course) => [
			course.id,
			course.name?.zh,
			course.name?.en,
			course.year,
			course.sem,
		]),
	]
		.filter(Boolean)
		.join(' ')
		.toLowerCase();
	return haystack.includes(keyword);
}

function compareWithdrawalRows(a: WithdrawalStat, b: WithdrawalStat, sortBy: SortMode) {
	if (sortBy === 'rate-asc') return rateValue(a) - rateValue(b) || a.name.localeCompare(b.name);
	if (sortBy === 'withdraw-desc')
		return numberValue(b.withdraw) - numberValue(a.withdraw) || rateValue(b) - rateValue(a);
	if (sortBy === 'people-desc')
		return numberValue(b.people) - numberValue(a.people) || rateValue(b) - rateValue(a);
	if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
	return rateValue(b) - rateValue(a) || numberValue(b.withdraw) - numberValue(a.withdraw);
}

function groupWithdrawalRows(
	rows: WithdrawalStat[],
	distribution: WithdrawalRateDistribution | null,
) {
	const highRows = rows.filter(
		(item) => classifyWithdrawalRate(rateValue(item), distribution).level === 'high',
	);
	const normalRows = rows.filter(
		(item) => classifyWithdrawalRate(rateValue(item), distribution).level === 'normal',
	);
	const lowRows = rows.filter(
		(item) => classifyWithdrawalRate(rateValue(item), distribution).level === 'low',
	);
	if (!distribution) {
		return [{ title: '一般退選率', rows: normalRows }];
	}
	return [
		{
			title: `高退選率（${formatWithdrawalThreshold(distribution.highThreshold)} 以上）`,
			rows: highRows,
		},
		{
			title: `一般退選率（${formatWithdrawalThreshold(distribution.lowThreshold)} 到 ${formatWithdrawalThreshold(distribution.highThreshold)}）`,
			rows: normalRows,
		},
		{
			title: `低退選率（${formatWithdrawalThreshold(distribution.lowThreshold)} 以下）`,
			rows: lowRows,
		},
	];
}

function rateValue(item: WithdrawalStat) {
	return numberValue(item.rate_percent ?? item.rate);
}
