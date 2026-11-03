import {
	IconCircle,
	IconCircleFilled,
	IconStar,
	IconStarFilled,
	IconTriangle,
	IconTriangleFilled,
} from '@tabler/icons-react';
import type { Icon } from '@tabler/icons-react';
import { courseStandard } from '@/lib/courseUtils';
import { cn } from '@/lib/utils';

// The school marks each course standard with a glyph; the icons keep its shapes but render evenly across fonts.
const courseTypeIcons = {
	'○': IconCircle,
	'△': IconTriangle,
	'☆': IconStar,
	'●': IconCircleFilled,
	'▲': IconTriangleFilled,
	'★': IconStarFilled,
} satisfies Record<keyof typeof courseStandard, Icon>;

// Tabler's triangles sit high in their viewBox, so a box-centered one rides above the CJK ink.
const opticalShift: Partial<Record<keyof typeof courseTypeIcons, string>> = {
	'△': 'translate-y-[0.04em]',
	'▲': 'translate-y-[0.04em]',
};

type CourseTypeIconProps = {
	type?: string;
	className?: string;
};

export function CourseTypeIcon({ type, className }: CourseTypeIconProps) {
	if (!type) return null;
	const Icon = courseTypeIcons[type as keyof typeof courseTypeIcons];
	if (!Icon) return <span className={className}>{type}</span>;
	return (
		<Icon
			aria-label={courseStandard[type as keyof typeof courseStandard]}
			className={cn(
				'inline-block size-[0.9em] shrink-0 align-[-0.1em]',
				opticalShift[type as keyof typeof courseTypeIcons],
				className,
			)}
			role='img'
			stroke={2}
		/>
	);
}
