export type OgImageRoute =
	| { type: 'course'; year: string; sem: string; id: string; department: string }
	| { type: 'class'; year: string; sem: string; id: string }
	| { type: 'teacher'; name: string };

export function parseOgImageRoute(url: URL): OgImageRoute | null {
	const parts = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
	if (parts.at(-1) !== 'og.png') return null;

	if (parts[0] === 'course' && parts.length === 5) {
		return {
			type: 'course',
			year: parts[1],
			sem: parts[2],
			id: parts[3],
			department: url.searchParams.get('d') || 'main',
		};
	}
	if (parts[0] === 'class' && parts.length === 5) {
		return {
			type: 'class',
			year: parts[1],
			sem: parts[2],
			id: parts[3],
		};
	}
	if (parts[0] === 'teacher' && parts.length === 3) {
		return {
			type: 'teacher',
			name: parts[1],
		};
	}
	return null;
}
