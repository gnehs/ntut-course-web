import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '../lib/utils';

type AdPlacement = 'inline' | 'footer' | 'section';

export function AdsByGoogle({ placement = 'inline' }: { placement?: AdPlacement }) {
	// Embedded pages keep their compact layout without these additional placements.
	if (
		placement !== 'inline' &&
		typeof window !== 'undefined' &&
		new URLSearchParams(window.location.search).get('mode') === 'iframe'
	)
		return null;
	return <AdUnit placement={placement} />;
}

function AdUnit({ placement }: { placement: AdPlacement }) {
	const region = useMemo(() => `page-${Math.random()}`, []);
	const rootRef = useRef<HTMLDivElement | null>(null);
	const [collapsed, setCollapsed] = useState(false);

	useEffect(() => {
		try {
			(window.adsbygoogle = window.adsbygoogle || []).push({});
		} catch {}
	}, []);

	useEffect(() => {
		const root = rootRef.current;
		if (!root) return undefined;

		function updateCollapsed() {
			const ad = root?.querySelector('.adsbygoogle') as HTMLElement | null;
			const hasFrame = Boolean(root?.querySelector('iframe'));
			const status = ad?.getAttribute('data-ad-status');
			const height = ad?.getBoundingClientRect().height || 0;
			setCollapsed(status === 'unfilled' || (status !== 'filled' && !hasFrame && height < 16));
		}

		const timeout = window.setTimeout(updateCollapsed, 2500);
		const observer =
			typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateCollapsed);
		observer?.observe(root);
		const statusObserver = new MutationObserver(updateCollapsed);
		statusObserver.observe(root, {
			subtree: true,
			attributes: true,
			attributeFilter: ['data-ad-status'],
		});
		return () => {
			window.clearTimeout(timeout);
			observer?.disconnect();
			statusObserver.disconnect();
		};
	}, []);

	return (
		<div
			ref={rootRef}
			className={cn(
				'max-w-full min-w-0 overflow-x-clip print:hidden [&_.adsbygoogle]:max-w-full [&_iframe]:!max-w-full [&_iframe]:!min-w-0',
				placement === 'footer' && !collapsed && 'mt-8 pb-4',
				placement === 'section' && !collapsed && 'my-4',
				collapsed && 'h-0 overflow-hidden opacity-0',
			)}
			aria-hidden={collapsed}
		>
			{placement !== 'inline' ? (
				<p className='text-muted-foreground m-0 mb-3 text-center text-xs'>廣告</p>
			) : null}
			<ins
				className='adsbygoogle'
				style={{
					display: 'block',
					width: '100%',
					minWidth: 0,
					maxWidth: '100%',
					overflow: 'hidden',
					backgroundColor: 'transparent',
				}}
				data-ad-client='ca-pub-6834090314855499'
				data-ad-format={placement !== 'inline' ? 'horizontal' : 'auto'}
				data-full-width-responsive={placement !== 'inline' ? 'false' : 'true'}
				data-ad-region={region}
			/>
		</div>
	);
}
