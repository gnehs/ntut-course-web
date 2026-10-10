import { clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Keep in sync with the custom shadow, text-shadow and sheen utilities in styles.css.
const twMerge = extendTailwindMerge({
	extend: {
		theme: {
			shadow: [
				'rest',
				'raised',
				'lifted',
				'pressed',
				'overlay',
				'bar',
				'well',
				'thumb',
				'soft',
				'soft-hover',
				'solid',
				'solid-hover',
			],
			'text-shadow': ['emboss', 'solid', 'ink'],
		},
		classGroups: {
			'bg-image': [{ 'bg-sheen': ['surface', 'glow', 'gloss', 'soft', 'well'] }],
		},
	},
});

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}
