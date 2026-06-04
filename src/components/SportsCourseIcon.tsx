import type React from 'react';
import {
	Accessibility,
	Activity,
	Circle,
	CircleDot,
	Dumbbell,
	PersonStanding,
	Volleyball,
} from 'lucide-react';

type SportsCourseIconProps = {
	title: string;
	className?: string;
};

const sportsIconRules: [RegExp, React.ComponentType<React.SVGProps<SVGSVGElement>>][] = [
	[/籃球/, CircleDot],
	[/棒球/, CircleDot],
	[/足球/, Circle],
	[/網球/, CircleDot],
	[/保齡球/, CircleDot],
	[/體適能/, Dumbbell],
	[/羽球/, Activity],
	[/排球/, Volleyball],
	[/桌球/, CircleDot],
	[/撞球/, CircleDot],
	[/太極/, PersonStanding],
	[/適應/, Accessibility],
	[/美學/, PersonStanding],
];

export function SportsCourseIcon({ title, className }: SportsCourseIconProps) {
	const Icon = sportsIconRules.find(([pattern]) => pattern.test(title))?.[1];
	return Icon ? <Icon aria-hidden='true' className={className} /> : null;
}
