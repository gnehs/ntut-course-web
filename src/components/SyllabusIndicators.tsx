import {
	IconBook,
	IconCheck,
	IconCpu,
	IconDevices,
	IconMinus,
	IconUsers,
} from '@tabler/icons-react';
import type React from 'react';

const sdgField = '課程對應SDGs指標';
const aiField = '課程是否導入AI';
const teachingField = '延伸教學與資源';

// These fields are checklists, so ticking "none" is an answer worth showing rather than a blank.
export const checklistFields = new Set([aiField, teachingField]);

// Few readers look at these form answers, so they start collapsed to keep the syllabus short.
export const collapsedFields = new Set([sdgField, aiField, teachingField]);

// Fields filled from fixed options on the school's form get a visual summary; text that does not
// match the form returns null and is shown as written.
export function renderSyllabusIndicator(field: string | undefined, text: string) {
	if (field === sdgField) {
		const goals = parseSdgGoals(text);
		return goals ? <SdgGoals goals={goals} /> : null;
	}
	if (field === aiField) {
		const adopted = parseAiAdoption(text);
		return adopted ? <AiAdoption adopted={adopted} /> : null;
	}
	if (field === teachingField) {
		const methods = parseTeachingMethods(text);
		return methods ? <TeachingMethods methods={methods} /> : null;
	}
	return null;
}

const sdgNames: Record<number, string> = {
	1: '消除貧窮',
	2: '消除飢餓',
	3: '良好健康和福祉',
	4: '優質教育',
	5: '性別平等',
	6: '潔淨水與衛生',
	7: '可負擔的潔淨能源',
	8: '尊嚴就業與經濟發展',
	9: '產業創新與基礎設施',
	10: '減少不平等',
	11: '永續城市與社區',
	12: '負責任的消費與生產',
	13: '氣候行動',
	14: '水下生命',
	15: '陸域生命',
	16: '和平正義與有力的制度',
	17: '夥伴關係',
};

// The school's form lists each chosen goal on its own line as "SDG4：優質教育（Quality Education）".
// A few teachers left "無（None）" ticked beside real goals, so that line is ignored.
export function parseSdgGoals(text: string) {
	const lines = text.split('\n').filter((line) => line.trim() && !/^\s*無/.test(line));
	const goals = lines.map((line) => Number(line.match(/^\s*SDG\s*(\d{1,2})\s*[:：]/i)?.[1]));
	return goals.length && goals.every((goal) => sdgNames[goal]) ? goals : null;
}

// Icons are the UN's official goal icons from sdgs.un.org, shown for information as its usage
// guidelines allow.
function SdgGoals({ goals }: { goals: number[] }) {
	return (
		<ul className='m-0 flex list-none flex-wrap gap-3 p-0'>
			{goals.map((goal) => (
				<li key={goal} className='flex w-18 flex-col items-center gap-1.5 text-center'>
					<img
						src={`/img/sdg/${goal}.webp`}
						alt={`SDG ${goal}：${sdgNames[goal]}`}
						width={72}
						height={72}
						loading='lazy'
						className='size-18 rounded-md'
					/>
					<span aria-hidden='true' className='text-muted-foreground text-xs leading-snug'>
						{sdgNames[goal]}
					</span>
				</li>
			))}
		</ul>
	);
}

// Listed from the lightest use of AI to the deepest; the meter counts how many of them a course ticks.
const aiOptions = [
	'簡單介紹 AI 的基本概念',
	'鼓勵學生使用生成式 AI 工具',
	'使用生成式 AI 作為教學過程的輔助工具',
	'使用生成式 AI 進行課堂即時互動',
	'深入探討 AI 的原理與應用',
];

// The form is a fixed checklist: each ticked option is a "● 中文（English）" line, or "● 無（None）".
export function parseAiAdoption(text: string) {
	const lines = text
		.split('\n')
		.map((line) =>
			line
				.replace(/^\s*●\s*/, '')
				.replace(/[（(].*$/, '')
				.trim(),
		)
		.filter(Boolean);
	if (lines.length === 1 && lines[0] === '無') return new Set<string>();
	return lines.length && lines.every((line) => aiOptions.includes(line)) ? new Set(lines) : null;
}

function AiAdoption({ adopted }: { adopted: Set<string> }) {
	return (
		<div className='flex min-w-0 flex-col gap-3'>
			<div className='flex items-center gap-3'>
				<div
					role='meter'
					aria-label='AI 導入項目'
					aria-valuemin={0}
					aria-valuemax={aiOptions.length}
					aria-valuenow={adopted.size}
					className='flex gap-1'
				>
					{aiOptions.map((option, index) => (
						<span
							key={option}
							className={`h-2 w-7 rounded-full ${index < adopted.size ? 'bg-primary' : 'bg-[rgba(var(--vs-text),0.08)]'}`}
						/>
					))}
				</div>
				<span className='text-sm font-medium tabular-nums'>
					{adopted.size ? `${adopted.size} / ${aiOptions.length} 項` : '未導入 AI'}
				</span>
			</div>
			<ul className='m-0 flex list-none flex-col gap-1.5 p-0 text-sm'>
				{aiOptions.map((option) => {
					const checked = adopted.has(option);
					return (
						<li
							key={option}
							className={`flex items-start gap-2 ${checked ? '' : 'text-muted-foreground'}`}
						>
							{checked ? (
								<IconCheck aria-hidden='true' className='text-primary mt-0.5 size-4 shrink-0' />
							) : (
								<IconMinus aria-hidden='true' className='text-icon-subtle mt-0.5 size-4 shrink-0' />
							)}
							<span>
								<span className='sr-only'>{checked ? '有：' : '無：'}</span>
								{option}
							</span>
						</li>
					);
				})}
			</ul>
		</div>
	);
}

const teachingMethods: { title: string; description: string; icon: React.ReactNode }[] = [
	{
		title: '混成學習',
		description: '課程結合實體授課與線上學習（同步視訊／非同步活動）。',
		icon: <IconDevices />,
	},
	{
		title: '數位教材資源應用',
		description: '採用影音多媒體或具開放授權之資源（如 OCW、開放教科書）作為主要或輔助教材。',
		icon: <IconBook />,
	},
	{
		title: '參與式創新教學',
		description: '強調學生參與與產出，導入翻轉、PBL/專題、設計思考或遊戲化等策略。',
		icon: <IconUsers />,
	},
	{
		title: '數位科技融入',
		description: '運用生成式 AI、VR/AR、IoT、IRS 等新興科技輔助教學與評量。',
		icon: <IconCpu />,
	},
];

// Each ticked option is a "● 中文 (English)" line followed by the form's fixed description in both
// languages, so only the bullet lines carry the answer.
export function parseTeachingMethods(text: string) {
	const titles = text
		.split('\n')
		.filter((line) => /^\s*●/.test(line))
		.map((line) =>
			line
				.replace(/^\s*●\s*/, '')
				.replace(/\s*[（(].*$/, '')
				.trim(),
		);
	if (titles.length === 1 && titles[0] === '無') return new Set<string>();
	const known = teachingMethods.map((method) => method.title);
	return titles.length && titles.every((title) => known.includes(title)) ? new Set(titles) : null;
}

function TeachingMethods({ methods }: { methods: Set<string> }) {
	return (
		<ul className='m-0 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2'>
			{teachingMethods.map(({ title, description, icon }) => {
				const used = methods.has(title);
				return (
					<li
						key={title}
						className={`flex min-w-0 gap-3 rounded-lg p-3 ${used ? 'bg-[rgba(var(--vs-primary),0.08)]' : 'text-muted-foreground shadow-[inset_0_0_0_1px_var(--hairline)]'}`}
					>
						<span
							aria-hidden='true'
							className={`mt-0.5 shrink-0 [&>svg]:size-5 ${used ? 'text-primary' : 'text-icon-subtle'}`}
						>
							{icon}
						</span>
						<div className='flex min-w-0 flex-col gap-0.5'>
							<span className='text-sm font-medium'>
								<span className='sr-only'>{used ? '有：' : '無：'}</span>
								{title}
							</span>
							<span className='text-xs leading-relaxed'>{description}</span>
						</div>
					</li>
				);
			})}
		</ul>
	);
}
