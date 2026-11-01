import { useRouterState } from '@tanstack/react-router';

/**
 * The path and parsed search of the current location. Each is selected on its own so a page only
 * re-renders when they change, not when a course peek pushes history state over the same URL.
 */
export function useRouteLocation() {
	const pathname = useRouterState({ select: (state) => state.location.pathname });
	const search = useRouterState({
		select: (state): Record<string, unknown> => state.location.search,
	});
	return { pathname, search };
}
