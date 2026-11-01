import { useId } from 'react';
import type React from 'react';
import { cn } from '@/lib/utils';

type SportsCourseIconProps = {
	title: string;
	className?: string;
};

// Drawn on lucide's 24-unit grid with its 2px round strokes, so they sit beside the other icons.
const sportsIcons = {
	basketball: (
		<>
			<circle cx='12' cy='12' r='10' />
			<path d='M12 2v20M2 12h20' />
			<path d='M4.9 4.9C8 8 8 16 4.9 19.1M19.1 4.9C16 8 16 16 19.1 19.1' />
		</>
	),
	baseball: (
		<>
			<circle cx='12' cy='12' r='10' />
			<path d='M6.2 3.9c3.3 4.1 3.3 12.1 0 16.2M17.8 3.9c-3.3 4.1-3.3 12.1 0 16.2' />
			<path d='M7.1 7.9 9 7.3M7.7 12h2M7.1 16.1l1.9.6M16.9 7.9 15 7.3M14.3 12h2M16.9 16.1l-1.9.6' />
		</>
	),
	soccer: <SoccerBall />,
	volleyball: (
		<>
			<circle cx='12' cy='12' r='9' />
			<path d='M12 12a8 8 0 0 0 8 4M7.5 13.5a12 12 0 0 0 8.5 6.5M12 12a8 8 0 0 0-7.464 4.928M12.951 7.353a12 12 0 0 0-9.88 4.111M12 12a8 8 0 0 0-.536-8.928M15.549 15.147a12 12 0 0 0 1.38-10.611' />
		</>
	),
	tennis: (
		<>
			<ellipse cx='10' cy='10' rx='5.5' ry='7' transform='rotate(-45 10 10)' />
			<path d='M6.1 13.9 13.9 6.1M15 15l5.5 5.5' />
			<circle cx='19' cy='5' r='2' />
		</>
	),
	badminton: (
		<>
			<path d='M4 5.5 8.5 16v2a3.5 3.5 0 0 0 7 0v-2L20 5.5' />
			<path d='M4 5.5c1.5-1 3-1.2 4.5-.6 2-2.6 5-2.6 7 0 1.5-.6 3-.4 4.5.6' />
			<path d='M8.5 16h7M8.5 4.9 11 16M15.5 4.9 13 16' />
		</>
	),
	tableTennis: (
		<>
			<circle cx='10' cy='10' r='6.5' />
			<path d='m13.5 15.7 3.8 3.8a1.5 1.5 0 0 0 2.1-2.1l-3.8-3.8' />
			<circle cx='19.5' cy='4.5' r='1.5' />
		</>
	),
	billiards: <EightBall />,
	bowling: (
		<>
			<circle cx='7.5' cy='16' r='5' />
			<path d='M6 14h.01M8.5 13h.01M7 16.5h.01' />
			<path d='M17 2.5c-1.4 0-2 1.3-2 2.6 0 1 .5 1.8.5 2.9 0 1.6-1.5 3-1.5 6 0 2.6.8 5 1.2 7.5h3.6c.4-2.5 1.2-4.9 1.2-7.5 0-3-1.5-4.4-1.5-6 0-1.1.5-1.9.5-2.9 0-1.3-.6-2.6-2-2.6Z' />
			<path d='M15.4 9h3.2' />
		</>
	),
	pickleball: (
		<>
			<path d='M6 2h4a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3Z' />
			<path d='M6.5 14v6a1.5 1.5 0 0 0 3 0v-6' />
			<circle cx='18' cy='17' r='3.5' />
			<path d='M17 15.8h.01M19.2 16.8h.01M17.6 18.4h.01' />
		</>
	),
	dumbbell: (
		<>
			<rect x='4.5' y='6' width='3' height='12' rx='1' />
			<rect x='16.5' y='6' width='3' height='12' rx='1' />
			<path d='M2.5 9.5v5M21.5 9.5v5M7.5 12h9' />
		</>
	),
	kettlebell: (
		<>
			<circle cx='12' cy='15' r='6' />
			<path d='M8.5 10.1V7a3.5 3.5 0 0 1 7 0v3.1' />
		</>
	),
	yoga: (
		<>
			<circle cx='12' cy='4.5' r='2' />
			<path d='M12 8v6M12 9.5l-4 3.5-2.5-.5M12 9.5l4 3.5 2.5-.5' />
			<path d='M5 18.5c2-1.6 4.5-2.5 7-2.5s5 .9 7 2.5M7.5 21h9' />
		</>
	),
	dance: (
		<>
			<circle cx='14' cy='4' r='2' />
			<path d='m13 8-2 6M13.4 8.6l4-2.5 1.5-3M12.6 9l-4 1-2-2' />
			<path d='m11 14 3 3.5-1 4M11 14l-3.5 3-3 .5' />
		</>
	),
	taiChi: (
		<>
			<circle cx='12' cy='12' r='10' />
			<path d='M12 2a5 5 0 0 1 0 10 5 5 0 0 0 0 10' />
			<path d='M12 7h.01M12 17h.01' />
		</>
	),
	diabolo: (
		<>
			<path d='M3 6v12l8-5h2l8 5V6l-8 5h-2Z' />
			<path d='M6 7.9v8.2M18 7.9v8.2' />
		</>
	),
	adaptive: (
		<>
			<circle cx='9' cy='4' r='2' />
			<path d='M9 8v5h5l2.5 5H19M9 10h4.5' />
			<path d='M6.5 12.5a5 5 0 1 0 7 7' />
		</>
	),
	golf: (
		<>
			<path d='M10 18V3l8 3.5-8 3.5' />
			<path d='M4 18.5c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5' />
			<circle cx='19.5' cy='19' r='1.5' />
		</>
	),
	gateball: (
		<>
			<path d='m3 3 7.6 7.6' />
			<rect x='7.5' y='10' width='9' height='4' rx='1' transform='rotate(-45 12 12)' />
			<circle cx='6.5' cy='18.5' r='2.5' />
			<path d='M15 21v-4a2.5 2.5 0 0 1 5 0v4' />
		</>
	),
	archery: (
		<>
			<circle cx='11' cy='13' r='8' />
			<circle cx='11' cy='13' r='4' />
			<path d='M11 13h.01M11 13l9-9M15.5 5.5v3h3M18 3v3h3' />
		</>
	),
	swimming: (
		<>
			<circle cx='17' cy='8' r='2' />
			<path d='m3 13 5-4.5 3.5 3L8 14M11.5 11.5 14 9' />
			<path d='M2 18c1.7 1.3 3.3 1.3 5 0s3.3-1.3 5 0 3.3 1.3 5 0 3.3-1.3 5 0' />
		</>
	),
	running: (
		<>
			<circle cx='15' cy='4' r='2' />
			<path d='m14 8-2 6M13.6 9l3 2 3-1M13.6 9l-3.5 1.5-2 2.5' />
			<path d='m12 14 3 3v4.5M12 14l-3 4H5' />
		</>
	),
} satisfies Record<string, React.ReactNode>;

// The 8 is cut out of a solid disc so it shows the glass through it; the mask id is per instance.
function EightBall() {
	const maskId = useId();
	return (
		<>
			<mask id={maskId}>
				<circle cx='12' cy='11' r='5.5' fill='white' stroke='none' />
				<g stroke='black' strokeWidth='1.5'>
					<circle cx='12' cy='9.2' r='1.4' />
					<circle cx='12' cy='12.5' r='1.8' />
				</g>
			</mask>
			<circle cx='12' cy='12' r='10' />
			<circle cx='12' cy='11' r='5.5' fill='currentColor' stroke='none' mask={`url(#${maskId})`} />
		</>
	);
}

// Patches at the rim are clipped to the ball, so the clip id is per instance like the eight ball's mask.
function SoccerBall() {
	const clipId = useId();
	return (
		<>
			<clipPath id={clipId}>
				<circle cx='12' cy='12' r='10' />
			</clipPath>
			<circle cx='12' cy='12' r='10' />
			<g fill='currentColor' strokeWidth='1'>
				<path d='M12.00 8.00 15.80 10.76 14.35 15.24 9.65 15.24 8.20 10.76Z' />
				<path d='M12.00 5.10 8.77 2.75 10.00 -1.05 14.00 -1.05 15.23 2.75Z M18.56 9.87 19.80 6.07 23.79 6.07 25.03 9.87 21.80 12.22Z M16.06 17.58 20.05 17.58 21.29 21.38 18.05 23.73 14.82 21.38Z M7.94 17.58 9.18 21.38 5.95 23.73 2.71 21.38 3.95 17.58Z M5.44 9.87 2.20 12.22 -1.03 9.87 0.21 6.07 4.20 6.07Z' clipPath={`url(#${clipId})`} />
			</g>
			<path d='M12.00 8.00 12.00 5.10 M15.80 10.76 18.56 9.87 M14.35 15.24 16.06 17.58 M9.65 15.24 7.94 17.58 M8.20 10.76 5.44 9.87' />
		</>
	);
}

// The sea glass colours of the link-preview books, as RGB triplets so glass-tile can tint with them.
const seaGlass = {
	seafoam: '35, 128, 111',
	cobalt: '47, 91, 184',
	amber: '165, 101, 28',
	aqua: '29, 128, 153',
	kelly: '45, 134, 65',
	rose: '180, 86, 108',
	lavender: '106, 82, 176',
	citrine: '138, 118, 12',
};

const sportsIconRules: [RegExp, keyof typeof sportsIcons, keyof typeof seaGlass][] = [
	[/籃球/, 'basketball', 'amber'],
	[/棒球|壘/, 'baseball', 'rose'],
	[/足球/, 'soccer', 'kelly'],
	[/排球/, 'volleyball', 'cobalt'],
	[/匹克球/, 'pickleball', 'aqua'],
	[/網球/, 'tennis', 'citrine'],
	[/羽球/, 'badminton', 'aqua'],
	[/桌球/, 'tableTennis', 'rose'],
	[/撞球/, 'billiards', 'seafoam'],
	[/保齡球/, 'bowling', 'lavender'],
	[/肌力/, 'kettlebell', 'cobalt'],
	[/適能|重量訓練/, 'dumbbell', 'cobalt'],
	[/瑜珈|瑜伽|身心|皮拉提斯/, 'yoga', 'lavender'],
	[/肢體|舞/, 'dance', 'rose'],
	[/太極/, 'taiChi', 'seafoam'],
	[/民俗/, 'diabolo', 'amber'],
	[/適應/, 'adaptive', 'cobalt'],
	[/高爾夫/, 'golf', 'kelly'],
	[/槌球/, 'gateball', 'amber'],
	[/射箭/, 'archery', 'rose'],
	[/游泳/, 'swimming', 'aqua'],
];

// Each sport sits on its own piece of sea glass, sized from the heading's font so it scales with the title.
export function SportsCourseIcon({ title, className }: SportsCourseIconProps) {
	const [, icon, glass] = sportsIconRules.find(([pattern]) => pattern.test(title)) ?? [
		null,
		'running',
		'seafoam',
	];
	return (
		<span
			aria-hidden='true'
			className={cn(
				'glass-tile inline-flex size-[1.5em] shrink-0 items-center justify-center rounded-[0.4em]',
				className,
			)}
			style={{ '--vs-primary': seaGlass[glass] } as React.CSSProperties}
		>
			<svg
				xmlns='http://www.w3.org/2000/svg'
				viewBox='0 0 24 24'
				fill='none'
				stroke='currentColor'
				strokeWidth='2.25'
				strokeLinecap='round'
				strokeLinejoin='round'
				className='size-[1em]'
			>
				{sportsIcons[icon]}
			</svg>
		</span>
	);
}
