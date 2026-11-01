import { Link, useNavigate, useRouter, useRouterState } from '@tanstack/react-router';
import {
	createContext,
	memo,
	useEffect,
	useId,
	useRef,
	useState,
	useSyncExternalStore,
} from 'react';
import type React from 'react';
import { Maximize2, X } from 'lucide-react';
import { AnimatePresence, MotionConfig, motion, usePresence } from 'motion/react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { Drawer } from 'vaul';
import { fetchCourseDetail, fetchWithdrawalRate } from '../lib/courseApi';
import { CourseDetail } from '../routes/CourseDetailPage';
import type { Course } from '../types/course';
import { AdsEnabledContext } from './AdsByGoogle';
import { cn } from '@/lib/utils';

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
	backdrop.className = 'bg-backdrop fixed inset-0';
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

/** Starts the requests the detail view makes; requests already in flight are shared. */
function prefetchCourse(year: string, sem: string, id: string) {
	fetchCourseDetail(year, sem, id).catch(() => {});
	fetchWithdrawalRate('').catch(() => {});
}

export function CoursePeek() {
	const peek = useRouterState({ select: (state) => state.location.state.coursePeek });
	const router = useRouter();
	const navigate = useNavigate();
	const compact = useMediaQuery('(max-width: 767px)');
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
		document.startViewTransition(async () => {
			const arrived = new Promise<void>((resolve) => {
				pendingExpand = { contentTop: top, arrived: resolve };
				// The page normally has the peek's data at once; never hold the screen long.
				window.setTimeout(resolve, 500);
			});
			await go();
			await arrived;
		});
	}

	// Expanding hands the peek over to the page in a view transition, so it leaves at once instead
	// of playing its closing animation into the new page's snapshot.
	const expanded = !peek && shown && pathname === `/course/${shown.year}/${shown.sem}/${shown.id}`;
	if (expanded) return null;

	return (
		<MotionConfig reducedMotion='user'>
			{compact ? (
				shown ? (
					<PeekSheet
						open={Boolean(peek)}
						peek={shown}
						onClose={close}
						onExpand={() => expand(shown)}
					/>
				) : null
			) : (
				<AnimatePresence>
					{peek ? (
						<PeekDialog
							key={peekKey(peek)}
							peek={peek}
							onClose={close}
							onExpand={() => expand(peek)}
						/>
					) : null}
				</AnimatePresence>
			)}
		</MotionConfig>
	);
}

type PeekViewProps = { peek: CoursePeekState; onClose: () => void; onExpand: () => void };

function PeekDialog({ peek, onClose, onExpand }: PeekViewProps) {
	const panelRef = useRef<HTMLDivElement | null>(null);
	const bodyRef = useRef<HTMLDivElement>(null);
	const openingRef = useRef<Animation | null>(null);
	const [isPresent, safeToRemove] = usePresence();
	const opened = useOpenedSignal();

	// The panel is laid out at full size from the first frame and only its visible window moves, so
	// the content renders at once and never stretches the way a scaled box would.
	// Radix mounts portal content a render late, so the animation starts when the panel attaches.
	function attachPanel(panel: HTMLDivElement | null) {
		panelRef.current = panel;
		if (!panel || openingRef.current) return;
		const source = peekSource(peek.origin);
		if (!source) {
			openingRef.current = panel.animate([{ opacity: 0 }, { opacity: 1 }], openTiming());
		} else {
			openingRef.current = panel.animate([sourceFrame(panel, source), openFrame], openTiming());
		}
		const opening = openingRef.current;
		// A peek closed mid-open reverses this same animation; its data never needs to land then.
		void opening.finished.then(
			() => opening.playbackRate > 0 && opened.resolve(),
			() => {},
		);
		if (!source) return;
		// The card fades out before the page fades in, so the two never sit half-visible on top of each other.
		cardGhost(panel, source).animate([{ opacity: 1 }, { opacity: 0 }], fadeTiming(0, 90));
		bodyRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], fadeTiming(60, 140));
	}

	useEffect(() => {
		if (isPresent) return;
		const panel = panelRef.current;
		const source = peekSource(peek.origin);
		if (!panel || !source) return safeToRemove();
		// The page fades back into the card while the panel shrinks onto it.
		bodyRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], fadeTiming(0, 100));
		cardGhost(panel, source).animate([{ opacity: 0 }, { opacity: 1 }], fadeTiming(80, 140));
		const opening = openingRef.current;
		// Closing mid-open runs the same motion backwards from wherever it got to.
		if (opening?.playState === 'running') {
			opening.reverse();
			void opening.finished.then(safeToRemove, safeToRemove);
			return;
		}
		void panel
			.animate([openFrame, sourceFrame(panel, source)], closeTiming())
			.finished.then(safeToRemove, safeToRemove);
	}, [isPresent]);

	return (
		<DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
			<DialogPrimitive.Portal forceMount>
				<DialogPrimitive.Overlay asChild forceMount>
					<motion.div
						data-peek-overlay
						className='fixed inset-0 z-50 bg-black/45 backdrop-blur-[3px]'
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
					/>
				</DialogPrimitive.Overlay>
				{/* The content box fills the screen to lay out the panel and its buttons, so any press off those surfaces counts as outside. */}
				<DialogPrimitive.Content
					forceMount
					aria-describedby={undefined}
					className='fixed inset-0 z-50 flex justify-center gap-3 p-4 outline-none md:px-6 md:py-8'
					onPointerDown={(event) => {
						// React bubbles presses from portals (tooltips, the syllabus select) through here too; only
						// a press in this box's own DOM, off the panel and its buttons, is outside.
						const target = event.target as Element;
						if (event.currentTarget.contains(target) && !target.closest('[data-peek-surface]')) {
							onClose();
						}
					}}
				>
					<DialogPrimitive.Title className='sr-only'>課程預覽</DialogPrimitive.Title>
					<div
						ref={attachPanel}
						data-peek-surface
						data-peek-frame
						className='bg-backdrop text-foreground rounded-overlay relative w-full max-w-[1072px] overflow-hidden'
					>
						{/* Starts as the card's surface and settles into the page backdrop. */}
						<motion.div
							aria-hidden='true'
							className='absolute inset-0 bg-[rgb(var(--vs-background))]'
							initial={{ opacity: 1 }}
							animate={{ opacity: 0, transition: { duration: 0.25 } }}
							exit={{ opacity: 1, transition: { duration: 0.2 } }}
						/>
						<div
							ref={bodyRef}
							data-peek-body
							className='relative h-full overflow-y-auto overscroll-contain px-6 py-6 [--course-sticky-top:0px]'
						>
							<PeekDetail peek={peek} opened={opened.promise} />
						</div>
					</div>
					<motion.div
						data-peek-actions
						className='flex flex-col gap-2 self-start'
						initial={{ opacity: 0 }}
						animate={{ opacity: 1, transition: { delay: 0.1, duration: 0.15 } }}
						exit={{ opacity: 0, transition: { duration: 0.08 } }}
					>
						<PeekActions onClose={onClose} onExpand={onExpand} />
					</motion.div>
				</DialogPrimitive.Content>
			</DialogPrimitive.Portal>
		</DialogPrimitive.Root>
	);
}

const openFrame: Keyframe = { transform: 'none', clipPath: 'inset(0px 0px 0px 0px round 18px)' };

/** What the peek grows out of: the card around the link that opened it, or the link itself. */
function peekSource(origin: string) {
	const link = document.querySelector(`[data-peek-origin="${CSS.escape(origin)}"]`);
	return (link?.closest<HTMLElement>('[data-peek-card]') ?? link) as HTMLElement | null;
}

/** The panel moved onto the source and cropped to its box. */
function sourceFrame(panel: HTMLElement, source: HTMLElement): Keyframe {
	const from = source.getBoundingClientRect();
	const to = panel.getBoundingClientRect();
	const right = Math.max(0, to.width - from.width);
	const bottom = Math.max(0, to.height - from.height);
	return {
		transform: `translate(${from.left - to.left}px, ${from.top - to.top}px)`,
		clipPath: `inset(0px ${right}px ${bottom}px 0px round 12px)`,
	};
}

/** A static copy of the source pinned to the panel's corner, so the two can crossfade. */
function cardGhost(panel: HTMLElement, source: HTMLElement) {
	panel.querySelector('[data-peek-ghost]')?.remove();
	const { width, height } = source.getBoundingClientRect();
	const ghost = source.cloneNode(true) as HTMLElement;
	for (const element of [ghost, ...ghost.querySelectorAll('*')]) {
		element.removeAttribute('data-peek-source');
		element.removeAttribute('data-peek-origin');
		element.removeAttribute('id');
	}
	ghost.setAttribute('data-peek-ghost', '');
	ghost.setAttribute('aria-hidden', 'true');
	ghost.inert = true;
	Object.assign(ghost.style, {
		position: 'absolute',
		top: '0',
		left: '0',
		zIndex: '1',
		width: `${width}px`,
		height: `${height}px`,
		margin: '0',
		transform: 'none',
		translate: 'none',
		pointerEvents: 'none',
	});
	panel.append(ghost);
	return ghost;
}

// Even enough that the growth reads as motion rather than a jump in the first few frames.
const panelEasing = 'cubic-bezier(0.2, 0, 0, 1)';

function openTiming(): KeyframeAnimationOptions {
	return { duration: reducedMotion() ? 0 : 320, easing: panelEasing };
}

function closeTiming(): KeyframeAnimationOptions {
	return {
		duration: reducedMotion() ? 0 : 260,
		easing: panelEasing,
		fill: 'forwards',
	};
}

function fadeTiming(delay: number, duration: number): KeyframeAnimationOptions {
	if (reducedMotion()) return { duration: 0, fill: 'both' };
	return { delay, duration, easing: 'ease-in-out', fill: 'both' };
}

function reducedMotion() {
	return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

function PeekSheet({ open, peek, onClose, onExpand }: PeekViewProps & { open: boolean }) {
	const opened = useOpenedSignal();
	return (
		<Drawer.Root
			open={open}
			onOpenChange={(value) => !value && onClose()}
			onAnimationEnd={(value) => value && opened.resolve()}
		>
			<Drawer.Portal>
				<Drawer.Overlay className='fixed inset-0 z-50 bg-black/45' />
				<Drawer.Content
					aria-describedby={undefined}
					data-peek-frame
					className='rounded-t-overlay shadow-overlay bg-backdrop text-foreground fixed inset-x-0 bottom-0 z-50 flex h-[calc(100dvh-2.5rem)] flex-col outline-none'
				>
					<Drawer.Title className='sr-only'>課程預覽</Drawer.Title>
					<div className='relative flex h-14 shrink-0 items-center justify-end gap-2 px-3'>
						<Drawer.Handle className='absolute! top-2 left-1/2 -translate-x-1/2' />
						<PeekActions onClose={onClose} onExpand={onExpand} />
					</div>
					<div
						data-peek-body
						className='min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]'
					>
						<PeekDetail peek={peek} opened={opened.promise} />
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
			<PeekButton label='關閉預覽' onClick={onClose}>
				<X />
			</PeekButton>
			<PeekButton label='開啟完整頁面' onClick={onExpand}>
				<Maximize2 />
			</PeekButton>
		</>
	);
}

function peekKey(peek: CoursePeekState | undefined) {
	return peek ? `${peek.year}/${peek.sem}/${peek.id}/${peek.depth}` : '';
}

function useMediaQuery(query: string) {
	return useSyncExternalStore(
		(onChange) => {
			if (typeof window.matchMedia !== 'function') return () => {};
			const media = window.matchMedia(query);
			media.addEventListener('change', onChange);
			return () => media.removeEventListener('change', onChange);
		},
		() => typeof window.matchMedia === 'function' && window.matchMedia(query).matches,
		() => false,
	);
}

function PeekButton({
	label,
	className,
	...props
}: React.ComponentProps<'button'> & { label: string }) {
	return (
		<button
			type='button'
			data-peek-surface
			aria-label={label}
			title={label}
			className={cn(
				'shadow-overlay flex size-10 items-center justify-center rounded-full bg-[rgb(var(--vs-background))] text-[rgb(var(--vs-text))] transition-colors hover:bg-[color-mix(in_srgb,rgb(var(--vs-background)),rgb(var(--vs-text))_8%)] focus-visible:ring-[3px] focus-visible:ring-[rgba(var(--vs-primary),0.28)] focus-visible:outline-none [&_svg]:size-4',
				className,
			)}
			{...props}
		/>
	);
}
