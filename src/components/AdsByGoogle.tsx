import { useEffect, useMemo } from 'react';

export function AdsByGoogle() {
	const region = useMemo(() => `page-${Math.random()}`, []);

	useEffect(() => {
		try {
			(window.adsbygoogle = window.adsbygoogle || []).push({});
		} catch {}
	}, []);

	return (
		<div className='min-w-0 max-w-full overflow-x-clip [&_.adsbygoogle]:max-w-full [&_iframe]:!max-w-full [&_iframe]:!min-w-0'>
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
