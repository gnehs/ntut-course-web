import { useSyncExternalStore } from 'react';

export const DESKTOP_MEDIA_QUERY = '(min-width: 64rem)';

export function useMediaQuery(query: string) {
	return useSyncExternalStore(
		(onChange) => {
			if (typeof window.matchMedia !== 'function') return () => {};
			const mediaQuery = window.matchMedia(query);
			mediaQuery.addEventListener('change', onChange);
			return () => mediaQuery.removeEventListener('change', onChange);
		},
		() => typeof window.matchMedia === 'function' && window.matchMedia(query).matches,
		() => false,
	);
}
