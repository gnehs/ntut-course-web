import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import {
	BadgeQuestionMark,
	Calendar,
	CalendarDays,
	Check,
	GitCommit,
	Loader,
	RefreshCw,
} from 'lucide-react';
import { Alert } from '../components/ui-kit/Alert';
import { Button } from '../components/ui-kit/Button';
import { StatusSkeleton } from '../components/ui-kit/PageSkeletons';
import { cleanStore } from '../lib/storage';
import type { WorkflowRun } from '../types/course';

type ChangelogChange = {
	title: string;
	details?: string[];
};

type ChangelogEntry = {
	date: string;
	changes: ChangelogChange[];
};

const changelogEntries: ChangelogEntry[] = [
	{ date: '2026-06-05', changes: [{ title: '更新圖示系統，改用更現代的圖示庫。' }] },
	{ date: '2026-06-04', changes: [{ title: '改善整體使用者介面與互動體驗。' }] },
	{ date: '2025-11-13', changes: [{ title: '修正課表時間解析錯誤。' }] },
	{ date: '2025-09-29', changes: [{ title: '新增微學程查詢功能。' }] },
	{ date: '2023-12-21', changes: [{ title: '修正課程資料爬取問題。' }] },
	{ date: '2023-03-26', changes: [{ title: '修正空教室解析問題。' }] },
	{
		date: '2023-02-21',
		changes: [
			{ title: '新增了重設資料庫選項，可以在此重設異常的課程資料庫。' },
			{
				title: '修正了進入課程頁面再返回進階搜尋頁面時，無法載入課程資料的錯誤。',
			},
		],
	},
	{
		date: '2023-01-13',
		changes: [
			{ title: '新增了班級頁面的預覽功能。' },
			{ title: '修正了班級頁面在瀏覽過往班級時，會顯示錯誤建議的錯誤。' },
			{ title: '修改了班級連結格式。' },
		],
	},
	{
		date: '2023-01-12',
		changes: [
			{ title: '新增了預覽功能，發送在 SNS 上的課程與教師的網址會自動顯示預覽。' },
			{ title: '新增 Sitemap 產生器' },
		],
	},
	{ date: '2022-12-30', changes: [{ title: '新增了「行事曆」頁面' }] },
	{
		date: '2022-12-29',
		changes: [
			{
				title: '更新了「新增到行事曆」的自動填寫功能，現在能根據學校行事曆自動填上起始與結束日',
			},
			{ title: '新增了「行事曆」API' },
		],
	},
	{
		date: '2022-12-27',
		changes: [{ title: '新增了廣告' }, { title: '更新了進階搜尋功能，現在能夠產生更短的網址' }],
	},
	{ date: '2022-12-25', changes: [{ title: '推出新版進階搜尋' }] },
	{ date: '2022-12-23', changes: [{ title: '修正博雅課的篩選錯誤' }] },
	{ date: '2022-12-21', changes: [{ title: '修正了當課表出現節次為「D」時的顯示錯誤' }] },
	{
		date: '2022-12-20',
		changes: [{ title: '修正了新課表的博雅篩選' }, { title: '進階搜尋新增了依課程標準篩選' }],
	},
	{
		date: '2022-11-26',
		changes: [{ title: '修正了萬用搜尋的一些錯誤' }, { title: '新增萬用搜尋的搜尋歷史' }],
	},
	{ date: '2022-11-25', changes: [{ title: '新增萬用搜尋' }] },
	{
		date: '2022-11-24',
		changes: [{ title: '新增教師頁面' }, { title: '修正了教師頁面選擇其他學制時的錯誤' }],
	},
	{
		date: '2022-11-23',
		changes: [
			{ title: '重新設計了課程頁面卡片區域' },
			{
				title: '退選率',
				details: [
					'新增退選率 API',
					'除了日間部外，也一起統計了進修部與研究所等課程，提供更加精確的退選率',
					'課程頁面顯示退選率與其介紹',
					'退選率頁面改由 API 提供服務，加快了讀取速度！',
				],
			},
		],
	},
	{ date: '2022-10-05', changes: [{ title: '尋找空教室支援了星期選擇功能' }] },
	{
		date: '2022-10-03',
		changes: [
			{
				title:
					'現在課程資料會自動儲存在瀏覽器中了！除了能夠帶來高速的讀取速度，重新整理時也無需下載新資料了',
			},
			{ title: '修正了重複點擊課程標準中相同科系時，造成的錯誤' },
			{ title: '修正了一些錯字' },
		],
	},
	{
		date: '2022-09-28',
		changes: [
			{
				title: '重新設計的課表',
				details: ['顯示更多有用資訊', '自動合併連堂課程', '課表將依據課程進行動態調整'],
			},
		],
	},
	{ date: '2022-09-27', changes: [{ title: '「退選率」現在預設會抓取十個學期的資料' }] },
	{
		date: '2022-09-19',
		changes: [
			{ title: '新增了「新增到行事曆」自訂區間選項' },
			{ title: '於「課程頁面」瀏覽器標題中新增了課號' },
			{ title: '修正了接下來的課程排序' },
		],
	},
	{
		date: '2022-09-17',
		changes: [{ title: '現在使用「博雅課程」搜尋頁面時，可以透過類別篩選課程了。' }],
	},
	{
		date: '2022-08-31',
		changes: [{ title: '現在使用「課程標準」工具時，會自動儲存上次的位置了。' }],
	},
];

export function AboutPage() {
	return (
		<div className='space-y-4'>
			<h1>關於</h1>
			<p>
				本網站與爬蟲由{' '}
				<a
					href='https://gnehs.net'
					target='_blank'
					rel='noreferrer'
					className='underline underline-offset-2'
				>
					勝勝
				</a>{' '}
				開發。
			</p>
			<h2>功能</h2>
			<ul className='list-disc space-y-1 pl-6'>
				<li>能依條件篩選且快速響應的搜尋功能</li>
				<li>自動偵測衝堂課程</li>
				<li>記錄課程供選課參考</li>
				<li>
					提供{' '}
					<Link to='/doc' className='underline underline-offset-2'>
						API
					</Link>{' '}
					供公眾使用
				</li>
			</ul>
			<h2>技術細節</h2>
			<p>
				本站資料擷取自{' '}
				<a
					href='https://aps.ntut.edu.tw/course/tw/course.jsp'
					target='_blank'
					rel='noreferrer'
					className='underline underline-offset-2'
				>
					國立臺北科技大學課程系統
				</a>
				，資料僅供參考，可能會有所遺漏或錯誤，正式資料仍以學校公佈為主。若資料有問題或有任何建議，歡迎於
				GitHub 提出 Issue 或發送 Pull Request。
			</p>
			<h2>聯絡開發者</h2>
			<p>
				若對北科好朋友有任何建議或找到 Bug，請聯繫 ntut-course-web[at]gnehs.net（請將 [at] 替換為
				@），或在{' '}
				<a
					href='https://github.com/gnehs/ntut-course-web'
					target='_blank'
					rel='noreferrer'
					className='underline underline-offset-2'
				>
					GitHub
				</a>{' '}
				上發 issue。
			</p>
			<h2>Special Thanks</h2>
			<ul className='list-disc space-y-1 pl-6'>
				<li>
					<a
						href='https://lucide.dev/'
						target='_blank'
						rel='noreferrer'
						className='underline underline-offset-2'
					>
						Lucide
					</a>
				</li>
				<li>
					<a
						href='https://react.dev/'
						target='_blank'
						rel='noreferrer'
						className='underline underline-offset-2'
					>
						React
					</a>
				</li>
				<li>
					<a
						href='https://vite.dev/'
						target='_blank'
						rel='noreferrer'
						className='underline underline-offset-2'
					>
						Vite
					</a>
				</li>
				<li>
					<a
						href='https://tanstack.com/router/latest'
						target='_blank'
						rel='noreferrer'
						className='underline underline-offset-2'
					>
						TanStack Router
					</a>
				</li>
			</ul>
		</div>
	);
}

export function DocPage() {
	return (
		<div className='space-y-4'>
			<h1>嵌入功能</h1>
			<ul className='list-disc space-y-1 pl-6'>
				<li>你可以透過嵌入功能，將課程資訊嵌入到你的網站中。</li>
				<li>啟用嵌入功能後，導航欄與頁尾將會被隱藏。</li>
				<li>
					在任一網址後方加入 <code>?mode=iframe</code> 即可使用嵌入功能。
				</li>
			</ul>
			<h1>API 文件</h1>
			<h2>注意</h2>
			<ul className='list-disc space-y-1 pl-6'>
				<li>這不是學校官方提供的 API</li>
				<li>這份文件非即時更新，可能會有 API 失效</li>
				<li>資料擷取自國立臺北科技大學課程系統，資料僅供參考。</li>
			</ul>
			<h2>API Endpoint</h2>
			<div className='rounded-lg border border-[rgba(var(--vs-text),0.1)] bg-[rgb(var(--vs-background))] px-4 py-3'>
				<code>https://gnehs.github.io/ntut-course-crawler-node/</code>
			</div>
			<h2>API 清單</h2>
			{[
				'/main.json 取得所有可用之年份與學期',
				'/{year}/{sem}/{system}.json 取得某學期某學制課程資料',
				'/{year}/{sem}/course/{id}.json 取得課程詳細資料',
				'/{year}/{sem}/department.json 取得系所班級清單',
				'/standards.json 取得課程標準可用年份',
				'/calendar.json 取得行事曆',
			].map((item) => (
				<div
					key={item}
					className='rounded-lg border border-[rgba(var(--vs-text),0.1)] bg-[rgb(var(--vs-background))] px-4 py-3'
				>
					<h3 className='m-0'>{item}</h3>
				</div>
			))}
		</div>
	);
}

export function PrivacyPage() {
	return (
		<div className='space-y-4'>
			<h1>隱私權政策</h1>
			<p>上次更新：2022/6/15</p>
			<p>
				非常歡迎您光臨「北科課程好朋友」（以下簡稱本網站），為了讓您能夠安心使用本網站的各項服務與資訊，特此向您說明本網站的隱私權保護政策，以保障您的權益，請您詳閱下列內容：
			</p>
			<h3>一、隱私權保護政策的適用範圍</h3>
			<p>
				隱私權保護政策內容，包括本網站如何處理在您使用網站服務時收集到的個人識別資料。隱私權保護政策不適用於本網站以外的相關連結網站，也不適用於非本網站所委託或參與管理的人員。
			</p>
			<h3>二、個人資料的蒐集、處理及利用方式</h3>
			<ul className='list-disc space-y-1 pl-6'>
				<li>
					當您造訪本網站或使用本網站所提供之功能服務時，我們將視該服務功能性質，請您提供必要的個人資料，並在該特定目的範圍內處理及利用您的個人資料；非經您書面同意，本網站不會將個人資料用於其他用途。
				</li>
				<li>
					本網站在您使用服務信箱、問卷調查等互動性功能時，會保留您所提供的姓名、電子郵件地址、聯絡方式及使用時間等。
				</li>
				<li>
					於一般瀏覽時，伺服器會自行記錄相關行徑，包括您使用連線設備的 IP
					位址、使用時間、使用的瀏覽器、瀏覽及點選資料記錄等，做為我們增進網站服務的參考依據，此記錄為內部應用，決不對外公佈。
				</li>
				<li>
					為提供精確的服務，我們會將收集的問卷調查內容進行統計與分析，分析結果之統計數據或說明文字呈現，除供內部研究外，我們會視需要公佈統計數據及說明文字，但不涉及特定個人之資料。
				</li>
				<li>
					您可以隨時向我們提出請求，以更正或刪除您的帳戶或本網站所蒐集的個人資料等隱私資訊。聯繫方式請見最下方聯繫管道。
				</li>
			</ul>
			<h3>三、資料之保護</h3>
			<ul className='list-disc space-y-1 pl-6'>
				<li>
					本網站主機均設有防火牆、防毒系統等相關的各項資訊安全設備及必要的安全防護措施，加以保護網站及您的個人資料採用嚴格的保護措施，只由經過授權的人員才能接觸您的個人資料，相關處理人員皆簽有保密合約，如有違反保密義務者，將會受到相關的法律處分。
				</li>
				<li>
					如因業務需要有必要委託其他單位提供服務時，本網站亦會嚴格要求其遵守保密義務，並且採取必要檢查程序以確定其將確實遵守。
				</li>
			</ul>
			<h3>四、網站對外的相關連結</h3>
			<p>
				本網站的網頁提供其他網站的網路連結，您也可經由本網站所提供的連結，點選進入其他網站。但該連結網站不適用本網站的隱私權保護政策，您必須參考該連結網站中的隱私權保護政策。
			</p>
			<h3>五、與第三人共用個人資料之政策</h3>
			<p>
				本網站絕不會提供、交換、出租或出售任何您的個人資料給其他個人、團體、私人企業或公務機關，但有法律依據或合約義務者，不在此限。
			</p>
			<p>前項但書之情形包括不限於：</p>
			<ul className='list-disc space-y-1 pl-6'>
				<li>經由您書面同意。</li>
				<li>法律明文規定。</li>
				<li>為免除您生命、身體、自由或財產上之危險。</li>
				<li>
					與公務機關或學術研究機構合作，基於公共利益為統計或學術研究而有必要，且資料經過提供者處理或蒐集者依其揭露方式無從識別特定之當事人。
				</li>
				<li>
					當您在網站的行為，違反服務條款或可能損害或妨礙網站與其他使用者權益或導致任何人遭受損害時，經網站管理單位研析揭露您的個人資料是為了辨識、聯絡或採取法律行動所必要者。
				</li>
				<li>有利於您的權益。</li>
				<li>
					本網站委託廠商協助蒐集、處理或利用您的個人資料時，將對委外廠商或個人善盡監督管理之責。
				</li>
			</ul>
			<h3>六、Cookie 之使用</h3>
			<p>
				為了提供您最佳的服務，本網站會在您的電腦中放置並取用我們的 Cookie，若您不願接受 Cookie
				的寫入，您可在您使用的瀏覽器功能項中設定隱私權等級為高，即可拒絕 Cookie
				的寫入，但可能會導致網站某些功能無法正常執行。
			</p>
			<h3>七、隱私權保護政策之修正</h3>
			<p>本網站隱私權保護政策將因應需求隨時進行修正，修正後的條款將刊登於網站上。</p>
			<h3>八、聯繫管道</h3>
			<p>
				對於本站之隱私權政策有任何疑問，或者想提出變更、移除個人資料之請求，請聯繫
				ntut-course-web[at]gnehs.net（請將 [at] 替換為 @）。
			</p>
		</div>
	);
}

export function ChangelogPage() {
	const yearGroups = changelogEntries.reduce<Array<{ year: string; entries: ChangelogEntry[] }>>(
		(groups, entry) => {
			const year = entry.date.slice(0, 4);
			const group = groups.find((item) => item.year === year);
			if (group) {
				group.entries.push(entry);
			} else {
				groups.push({ year, entries: [entry] });
			}
			return groups;
		},
		[],
	);

	return (
		<div className='space-y-5'>
			<h1>更新日誌</h1>

			<nav aria-label='更新日誌年份' className='flex flex-wrap gap-2'>
				{yearGroups.map(({ year, entries }) => (
					<a
						key={year}
						href={`#changelog-${year}`}
						className='inline-flex items-center gap-2 rounded-full border border-[rgba(var(--vs-text),0.12)] bg-[rgb(var(--vs-background))] px-3 py-1.5 text-sm text-[rgb(var(--vs-text))] no-underline transition-colors hover:border-[rgba(var(--vs-primary),0.45)] hover:bg-[rgba(var(--vs-primary),0.08)]'
					>
						<span>{year}</span>
						<span className='text-[rgba(var(--vs-text),0.58)]'>{entries.length}</span>
					</a>
				))}
			</nav>

			<div className='space-y-8'>
				{yearGroups.map(({ year, entries }) => (
					<section key={year} id={`changelog-${year}`} className='scroll-mt-20 space-y-3'>
						<div className='flex items-center gap-3'>
							<h2 className='m-0 text-xl font-semibold'>{year}</h2>
							<div className='h-px flex-1 bg-[rgba(var(--vs-text),0.12)]' />
						</div>
						<ol className='space-y-3'>
							{entries.map((entry) => (
								<li
									key={entry.date}
									className='grid overflow-hidden rounded-lg border border-[rgba(var(--vs-text),0.1)] bg-[rgb(var(--vs-background))] shadow-[0_5px_20px_0_rgba(0,0,0,var(--vs-shadow-opacity,0.04))] sm:grid-cols-[10rem_minmax(0,1fr)]'
								>
									<div className='flex items-center gap-2 border-b border-[rgba(var(--vs-text),0.08)] bg-[rgba(var(--vs-text),0.025)] px-4 py-3 text-sm text-[rgba(var(--vs-text),0.65)] sm:border-r sm:border-b-0'>
										<CalendarDays className='size-4 shrink-0' />
										<time dateTime={entry.date} className='tabular-nums'>
											{entry.date}
										</time>
									</div>
									<div className='px-4 py-3'>
										<ul className='divide-y divide-[rgba(var(--vs-text),0.08)]'>
											{entry.changes.map((change) => (
												<li key={change.title} className='py-2 first:pt-0 last:pb-0'>
													<p className='m-0 leading-relaxed'>{change.title}</p>
													{change.details ? (
														<div className='mt-2 space-y-1 rounded-lg bg-[rgba(var(--vs-text),0.035)] px-3 py-2 text-sm text-[rgba(var(--vs-text),0.76)]'>
															{change.details.map((detail) => (
																<p key={detail} className='m-0 leading-relaxed'>
																	{detail}
																</p>
															))}
														</div>
													) : null}
												</li>
											))}
										</ul>
									</div>
								</li>
							))}
						</ol>
					</section>
				))}
			</div>
		</div>
	);
}

export function NotFoundPage() {
	return (
		<div className='space-y-4'>
			<h1>找不到頁面</h1>
			<p>你要找的頁面不存在。</p>
			<Button as={Link} to='/'>
				回首頁
			</Button>
		</div>
	);
}

export function SettingsPage() {
	const [done, setDone] = useState(false);
	async function clear() {
		await cleanStore();
		setDone(true);
	}
	return (
		<div className='space-y-4'>
			<h1>設定</h1>
			<Alert>
				<strong>快取資料</strong>
				<br />
				清空快取資料並不會清空您儲存的課表，僅會清空已被快取課程資料，並在下次使用時重新下載，在通常情況下，您不需要清空快取資料。
				<div className='mt-3'>
					<Button onClick={clear}>清空網站快取</Button>
				</div>
			</Alert>
			{done ? <Alert className='mt-3'>已清空網站快取。</Alert> : null}
		</div>
	);
}

export function StatusPage() {
	const [runs, setRuns] = useState<WorkflowRun[] | null>(null);
	const [error, setError] = useState(false);

	useEffect(() => {
		let cancelled = false;
		fetch('https://api.github.com/repos/gnehs/ntut-course-crawler-node/actions/runs')
			.then((res) => {
				if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
				return res.json();
			})
			.then((data) => {
				if (cancelled) return;
				const workflowRuns = Array.isArray(data.workflow_runs) ? data.workflow_runs : [];
				setRuns(workflowRuns.slice(0, 50));
				setError(false);
			})
			.catch(() => {
				if (cancelled) return;
				setRuns([]);
				setError(true);
			});
		return () => {
			cancelled = true;
		};
	}, []);
	if (!runs) return <StatusSkeleton />;
	return (
		<div className='space-y-4'>
			<h1>擷取狀態</h1>
			<p>僅顯示最新 50 筆資料</p>
			{error ? (
				<Alert danger className='mb-3'>
					無法取得擷取狀態，請稍後再試。
				</Alert>
			) : null}
			{!error && runs.length === 0 ? <Alert className='mb-3'>目前沒有擷取紀錄。</Alert> : null}
			<div className='space-y-2'>
				{runs.map((run) => (
					<a
						key={run.id}
						href={run.html_url}
						target='_blank'
						rel='noreferrer'
						className='flex items-center gap-2 rounded-lg bg-[rgb(var(--vs-background))] p-2 shadow-[0_5px_20px_0_rgba(0,0,0,var(--vs-shadow-opacity,0.05))] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_10px_20px_0_rgba(0,0,0,var(--vs-shadow-opacity,0.05))]'
					>
						<div
							className={`grid h-8 w-8 place-items-center rounded-full text-lg ${run.status === 'completed' ? 'bg-[rgba(70,201,58,0.2)] text-[rgb(70,201,58)]' : 'bg-[rgba(var(--vs-primary),0.2)] text-[rgb(var(--vs-primary))]'}`}
						>
							{run.status === 'in_progress' ? (
								<Loader className='size-4 animate-spin' />
							) : run.status === 'completed' ? (
								<Check className='size-4' />
							) : (
								<BadgeQuestionMark className='size-4' />
							)}
						</div>
						<div className='min-w-0 flex-1'>
							<div className='font-semibold'>{parseName(run.name)}</div>
							<div className='text-sm opacity-75'>
								{run.event === 'schedule' ? (
									<Calendar className='inline-block size-4 align-[-0.125em]' />
								) : run.event === 'push' ? (
									<GitCommit className='inline-block size-4 align-[-0.125em]' />
								) : run.event === 'dynamic' ? (
									<RefreshCw className='inline-block size-4 align-[-0.125em]' />
								) : (
									<BadgeQuestionMark className='inline-block size-4 align-[-0.125em]' />
								)}
								<span> • </span>
								{timeSince(new Date(run.created_at))}前
							</div>
						</div>
					</a>
				))}
			</div>
		</div>
	);
}

function parseName(name: string) {
	if (name === 'fetch current courses') return '取得本學期課程';
	if (name === 'fetch current departments') return '取得本學期科系';
	if (name === 'fetch current mprograms') return '取得本學期微學程';
	if (name === 'fetch standards') return '取得課程標準';
	if (name === 'pages build and deployment') return 'API 資料建置與部署';
	if (name === 'Run Analytics & Fatch calendar') return '分析課程資料與取得行事曆';
	if (name === 'Run Analytics') return '分析課程資料';
	return name;
}

function timeSince(date: Date) {
	const timestamp = date.getTime();
	if (!Number.isFinite(timestamp)) return '未知時間';

	const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
	const units: [string, number][] = [
		['年', 60 * 60 * 24 * 365],
		['個月', 60 * 60 * 24 * 30],
		['天', 60 * 60 * 24],
		['小時', 60 * 60],
		['分鐘', 60],
	];

	for (const [label, size] of units) {
		const value = Math.floor(seconds / size);
		if (value >= 1) return `${value} ${label}`;
	}

	return '剛剛';
}
