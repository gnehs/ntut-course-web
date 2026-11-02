import {
	IconArcheryArrow,
	IconBallBaseball,
	IconBallBasketball,
	IconBallFootball,
	IconBallTennis,
	IconBallVolleyball,
	IconBarbell,
	IconBowling,
	IconCricket,
	IconDiabolo,
	IconFeather,
	IconGolf,
	IconGymnastics,
	IconPingPong,
	IconRun,
	IconSportBilliard,
	IconSwimming,
	IconWeight,
	IconWheelchair,
	IconYinYang,
	IconYoga,
} from '@tabler/icons-react';
import type { Icon } from '@tabler/icons-react';
import type React from 'react';
import { cn } from '@/lib/utils';

type SportsCourseIconProps = {
	title: string;
	className?: string;
};

const sportsIcons = {
	basketball: IconBallBasketball,
	baseball: IconBallBaseball,
	soccer: IconBallFootball,
	volleyball: IconBallVolleyball,
	tennis: IconBallTennis,
	badminton: IconFeather,
	tableTennis: IconPingPong,
	billiards: IconSportBilliard,
	bowling: IconBowling,
	pickleball: IconPingPong,
	dumbbell: IconBarbell,
	kettlebell: IconWeight,
	yoga: IconYoga,
	dance: IconGymnastics,
	taiChi: IconYinYang,
	diabolo: IconDiabolo,
	adaptive: IconWheelchair,
	golf: IconGolf,
	gateball: IconCricket,
	archery: IconArcheryArrow,
	swimming: IconSwimming,
	running: IconRun,
} satisfies Record<string, Icon>;

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
	const SportIcon = sportsIcons[icon];
	return (
		<span
			aria-hidden='true'
			className={cn(
				'glass-tile inline-flex size-[1.5em] shrink-0 items-center justify-center rounded-[0.4em]',
				className,
			)}
			style={{ '--vs-primary': seaGlass[glass] } as React.CSSProperties}
		>
			<SportIcon stroke={2.25} className='size-[1em]' />
		</span>
	);
}
