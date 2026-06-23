import { useEffect, useMemo, useRef, useState } from 'react';

export function AdsByGoogle() {
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
			setCollapsed(status === 'unfilled' || (!hasFrame && height < 16));
		}

		const timeout = window.setTimeout(updateCollapsed, 2500);
		const observer =
			typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateCollapsed);
		observer?.observe(root);
		return () => {
			window.clearTimeout(timeout);
			observer?.disconnect();
		};
	}, []);

	return (
		<div
			ref={rootRef}
			className={`max-w-full min-w-0 overflow-x-clip transition-[height,opacity] [&_.adsbygoogle]:max-w-full [&_iframe]:!max-w-full [&_iframe]:!min-w-0 ${collapsed ? 'h-0 overflow-hidden opacity-0' : ''}`}
			aria-hidden={collapsed}
		>
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
				data-ad-format='auto'
				data-full-width-responsive='true'
				data-ad-region={region}
			/>
		</div>
	);
}
