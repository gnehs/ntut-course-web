import { Link, useNavigate, useRouter, useRouterState } from '@tanstack/react-router';
import { createContext, memo, useEffect, useId, useRef, useState } from 'react';
import type React from 'react';
import { Maximize2, X } from 'lucide-react';
import { Drawer } from 'vaul';
import { fetchCourseDetail, fetchWithdrawalRate } from '../lib/courseApi';
import { CourseDetail } from '../routes/CourseDetailPage';
import type { Course } from '../types/course';
import { AdsEnabledContext } from './AdsByGoogle';
import { Button } from './ui-kit/Button';

/** `origin` names the link that opened the peek, so the panel grows out of it and back into it. */
export type CoursePeekState = {
	year: string;
	sem: string;
	id: string;
	depth: number;
	origin: string;
};

declare module '@tanstack/react-router' {
	interface HistoryState {
		coursePeek?: CoursePeekState;
	}
}

type CourseSeed = { course: Course; department?: string };

/**
 * Settles once the peek has finished opening. Fetched data waits for it, because swapping in the
 * syllabus and course lists is a large render that would stall the animation.
 */
export const CoursePeekOpenedContext = createContext<Promise<void>>(Promise.resolve());

function useOpenedSignal() {
	const [signal] = useState(() => {
		let resolve = () => {};
		const promise = new Promise<void>((done) => (resolve = done));
		return { promise, resolve };
	});
	return signal;
}

// Lists already hold the course they link to; the detail view starts from it instead of a skeleton.
const courseSeeds = new Map<string, CourseSeed>();

export function courseSeed(year: string, sem: string, id: string) {
	return courseSeeds.get(`${year}/${sem}/${id}`);
}

type CourseLinkProps = Omit<React.ComponentProps<'a'>, 'href'> & {
	year: string;
	sem: string;
	id: string;
	course?: Course;
	department?: string;
};

/**
 * Opens the course in a peek over the current page. The address bar shows the course page,
 * so modified clicks and copied links still reach the full page.
 */
export function CourseLink({
	year,
	sem,
	id,
	course,
	department,
	onClick,
	onFocus,
	onPointerEnter,
	onPointerLeave,
	...props
}: CourseLinkProps) {
	// Only what the link needs, so opening a peek re-renders the one link it hides and not every list.
	const origin = useId();
	const pathname = useRouterState({ select: (state) => state.location.pathname });
	const hash = useRouterState({ select: (state) => state.location.hash });
	const depth = useRouterState({ select: (state) => state.location.state.coursePeek?.depth ?? 0 });
	const isSource = useRouterState({
		select: (state) => state.location.state.coursePeek?.origin === origin,
	});
	const coursePeek: CoursePeekState = { year, sem, id, depth: depth + 1, origin };
	const hoverRef = useRef<number | undefined>(undefined);
	const prefetch = () => prefetchCourse(year, sem, id);
	return (
		<Link
			{...props}
			data-peek-origin={origin}
			// The source hides while the peek is open, since the panel stands in for it.
			data-peek-source={isSource ? '' : undefined}
			to={pathname}
			search={true}
			hash={hash}
			state={{ coursePeek }}
			mask={{ to: `/course/${year}/${sem}/${id}`, unmaskOnReload: true }}
			resetScroll={false}
			// Resting on a link starts the detail requests, so the data is usually in hand by the time
			// the opening animation ends; passing over a list does not fetch every course.
			onPointerEnter={(event) => {
				if (event.pointerType === 'mouse') hoverRef.current = window.setTimeout(prefetch, 80);
				onPointerEnter?.(event);
			}}
			onPointerLeave={(event) => {
				window.clearTimeout(hoverRef.current);
				onPointerLeave?.(event);
			}}
			onFocus={(event) => {
				prefetch();
				onFocus?.(event);
			}}
			onClick={(event) => {
				window.clearTimeout(hoverRef.current);
				if (course) courseSeeds.set(`${year}/${sem}/${id}`, { course, department });
				prefetch();
				onClick?.(event);
			}}
		/>
	);
}

/**
 * The course sidebar sticks under the panel's top in a peek and under the navbar on the page, so it
 * slides on its own while the rest of the page crossfades in.
 */
export const COURSE_ASIDE_TRANSITION = 'course-detail-aside';

/**
 * A peek being expanded: where its content sat on screen, so the page can scroll to match, and a
 * callback the page calls once it is ready, which ends the view transition's update.
 */
export type PendingExpand = { contentTop: number | undefined; arrived: () => void };
let pendingExpand: PendingExpand | undefined;

export function takePendingExpand() {
	const pending = pendingExpand;
	pendingExpand = undefined;
	return pending;
}

/** Left edge of the page's content column, from the padding `Layout` gives its main element. */
function pageContentLeft() {
	const width = document.documentElement.clientWidth;
	return Math.max(width >= 1024 ? 24 : 16, (width - 1024) / 2);
}

/**
 * Grows the peek's backdrop out to the whole window and slides its content onto the page's column.
 * Only the compositor works here; the page's render comes after, while the screen is still.
 */
function growPeekIntoPage() {
	const frame = document.querySelector<HTMLElement>('[data-peek-frame]');
	const content = document.querySelector('[data-peek-body] > *');
	if (!frame || !content) return Promise.resolve();
	const from = frame.getBoundingClientRect();
	const root = document.documentElement;
	const backdrop = document.createElement('div');
	backdrop.className = 'bg-backdrop fixed inset-0 z-50';
	// It sits outside React (the drawer portals into <body>), so whoever expands removes it after.
	backdrop.setAttribute('data-peek-expand-backdrop', '');
	frame.before(backdrop);
	const timing: KeyframeAnimationOptions = { duration: 300, easing: panelEasing, fill: 'forwards' };
	const inset = [
		from.top,
		root.clientWidth - from.right,
		window.innerHeight - from.bottom,
		from.left,
	];
	backdrop.animate(
		[
			{ clipPath: `inset(${inset.map((value) => `${value}px`).join(' ')} round 18px)` },
			{ clipPath: 'inset(0px 0px 0px 0px round 0px)' },
		],
		timing,
	);
	document
		.querySelector('[data-peek-actions]')
		?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: 'forwards' });
	const dx = pageContentLeft() - content.getBoundingClientRect().left;
	return frame
		.animate([{ transform: 'none' }, { transform: `translateX(${dx}px)` }], timing)
		.finished.then(
			() => {},
			() => {},
		);
}

function removeExpandBackdrops() {
	for (const backdrop of document.querySelectorAll('[data-peek-expand-backdrop]'))
		backdrop.remove();
}

/** Starts the requests the detail view makes; requests already in flight are shared. */
function prefetchCourse(year: string, sem: string, id: string) {
	fetchCourseDetail(year, sem, id).catch(() => {});
	fetchWithdrawalRate('').catch(() => {});
}

export function CoursePeek() {
	const peek = useRouterState({ select: (state) => state.location.state.coursePeek });
	const router = useRouter();
	const navigate = useNavigate();
	const pathname = useRouterState({ select: (state) => state.location.pathname });
	// The sheet keeps the last peek rendered after its history entry is gone, so it can slide out.
	const [shown, setShown] = useState(peek);
	if (peek && peekKey(peek) !== peekKey(shown)) setShown(peek);

	// Read at call time: an exiting panel still holds the peek it was rendered with.
	// Every peek in the stack is its own history entry, so closing walks back past all of them.
	function close() {
		const current = router.state.location.state.coursePeek;
		if (current) router.history.go(-current.depth);
	}

	// The page's render is too heavy to start during an animation, so the peek first grows to fill
	// the window on its own, then the page is swapped in under a short crossfade while nothing moves.
	// The transition is started here rather than by the router, which updates its location before
	// capturing the old state and would drop the peek from that snapshot.
	async function expand({ year, sem, id }: CoursePeekState) {
		const go = () =>
			navigate({ to: `/course/${year}/${sem}/${id}`, replace: true, resetScroll: false });
		const contentTop = () =>
			document.querySelector('[data-peek-body] > *')?.getBoundingClientRect().top;
		if (reducedMotion() || typeof document.startViewTransition !== 'function') {
			pendingExpand = { contentTop: contentTop(), arrived: () => {} };
			void go();
			return;
		}
		await growPeekIntoPage();
		const top = contentTop();
		const transition = document.startViewTransition(async () => {
			const arrived = new Promise<void>((resolve) => {
				pendingExpand = { contentTop: top, arrived: resolve };
				// The page normally has the peek's data at once; never hold the screen long.
				window.setTimeout(resolve, 500);
			});
			await go();
			await arrived;
			// The new state is the page alone; the old snapshot already holds the backdrop.
			removeExpandBackdrops();
		});
		void transition.finished.finally(removeExpandBackdrops);
	}

	// Expanding hands the peek over to the page in a view transition, so it leaves at once instead
	// of playing its closing animation into the new page's snapshot.
	const expanded = !peek && shown && pathname === `/course/${shown.year}/${shown.sem}/${shown.id}`;
	if (expanded) return null;

	return shown ? (
		<PeekSheet open={Boolean(peek)} peek={shown} onClose={close} onExpand={() => expand(shown)} />
	) : null;
}

type PeekViewProps = { peek: CoursePeekState; onClose: () => void; onExpand: () => void };

// Even enough that the motion reads as movement rather than a jump in the first few frames.
const panelEasing = 'cubic-bezier(0.2, 0, 0, 1)';

function reducedMotion() {
	return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/** A sheet from the bottom of the screen, on phones and desktops alike; centred and capped when wide. */
function PeekSheet({ open, peek, onClose, onExpand }: PeekViewProps & { open: boolean }) {
	const opened = useOpenedSignal();
	const seed = courseSeed(peek.year, peek.sem, peek.id);
	// The slide runs on animation frames, which a background tab never gets; the data must not wait on it.
	useEffect(() => {
		const timeout = window.setTimeout(opened.resolve, 500);
		return () => window.clearTimeout(timeout);
	}, []);
	return (
		<Drawer.Root
			open={open}
			onOpenChange={(value) => !value && onClose()}
			onAnimationEnd={(value) => value && opened.resolve()}
		>
			<Drawer.Portal>
				<Drawer.Overlay className='bg-sea-glass fixed inset-0 z-50 bg-black/20 backdrop-blur-[2px]' />
				<Drawer.Content
					aria-describedby={undefined}
					data-peek-frame
					className='rounded-t-overlay shadow-overlay bg-backdrop text-foreground fixed inset-x-0 bottom-0 z-50 mx-auto flex h-[calc(100dvh-2.5rem)] w-full max-w-[1072px] flex-col outline-none'
				>
					<Drawer.Title className='sr-only'>
						{seed ? `${peek.id} ${seed.course.name?.zh || ''}` : peek.id}
					</Drawer.Title>
					<Drawer.Handle className='absolute! top-2 left-1/2 z-10 -translate-x-1/2' />
					{/* The buttons float over the content so the course title starts at the top of the sheet. */}
					<div data-peek-actions className='absolute top-3 right-3 z-10 flex gap-2'>
						<PeekActions onClose={onClose} onExpand={onExpand} />
					</div>
					<div
						data-peek-body
						className='min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] [--course-header-inset:7rem] [--course-sticky-top:3.5rem] sm:px-6'
					>
						<div className='@container'>
							<PeekDetail peek={peek} opened={opened.promise} />
						</div>
					</div>
				</Drawer.Content>
			</Drawer.Portal>
		</Drawer.Root>
	);
}

// Memoized so the panel re-rendering as it leaves does not re-render the whole course page mid-animation.
const PeekDetail = memo(function PeekDetail({
	peek,
	opened,
}: {
	peek: CoursePeekState;
	opened: Promise<void>;
}) {
	return (
		<AdsEnabledContext value={false}>
			<CoursePeekOpenedContext value={opened}>
				<CourseDetail
					key={peekKey(peek)}
					year={peek.year}
					sem={peek.sem}
					id={peek.id}
					asideTransition
					handOff
				/>
			</CoursePeekOpenedContext>
		</AdsEnabledContext>
	);
});

function PeekActions({ onClose, onExpand }: { onClose: () => void; onExpand: () => void }) {
	return (
		<>
			<Button icon aria-label='開啟完整頁面' title='開啟完整頁面' onClick={onExpand}>
				<Maximize2 className='size-4' aria-hidden='true' />
			</Button>
			<Button icon aria-label='關閉預覽' title='關閉預覽' onClick={onClose}>
				<X className='size-4' aria-hidden='true' />
			</Button>
		</>
	);
}

function peekKey(peek: CoursePeekState | undefined) {
	return peek ? `${peek.year}/${peek.sem}/${peek.id}/${peek.depth}` : '';
}
