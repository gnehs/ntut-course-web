export type OgImageRoute =
	| { type: 'course'; year: string; sem: string; id: string; department: string }
	| { type: 'class'; year: string; sem: string; id: string }
	| { type: 'teacher'; name: string };

export function parseOgImageRoute(url: URL): OgImageRoute | null {
	if (url.pathname === '/api') {
		const year = url.searchParams.get('year');
		const sem = url.searchParams.get('sem');
		const id = url.searchParams.get('id');
		if (!year || !sem || !id) return null;
		return {
			type: 'course',
			year,
			sem,
			id,
			department: url.searchParams.get('d') || 'main',
		};
	}
	if (url.pathname === '/api/class') {
		const year = url.searchParams.get('year');
		const sem = url.searchParams.get('sem');
		const id = url.searchParams.get('id');
		if (!year || !sem || !id) return null;
		return { type: 'class', year, sem, id };
	}
	if (url.pathname === '/api/teacher') {
		const name = url.searchParams.get('name');
		if (!name) return null;
		return { type: 'teacher', name };
	}
	return null;
}
