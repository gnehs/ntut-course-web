import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdsByGoogle } from './AdsByGoogle';

afterEach(() => {
	cleanup();
	vi.useRealTimers();
	delete window.adsbygoogle;
	window.history.replaceState({}, '', '/');
});

describe('footer ads', () => {
	it.each(['footer', 'section'] as const)(
		'does not request %s ads in embedded pages',
		(placement) => {
			window.history.replaceState({}, '', '/program?mode=iframe');
			const { container } = render(<AdsByGoogle placement={placement} />);
			expect(container).toBeEmptyDOMElement();
			expect(window.adsbygoogle).toBeUndefined();
		},
	);

	it('uses a labeled horizontal placement within the mobile content width', () => {
		const { container } = render(<AdsByGoogle placement='footer' />);
		const ad = container.querySelector('ins')!;
		expect(screen.getByText('廣告')).toBeInTheDocument();
		expect(ad).toHaveAttribute('data-ad-format', 'horizontal');
		expect(ad).toHaveAttribute('data-full-width-responsive', 'false');
		expect(window.adsbygoogle).toHaveLength(1);
	});

	it('collapses empty space and restores an ad that fills after the timeout', async () => {
		vi.useFakeTimers();
		const { container } = render(<AdsByGoogle placement='footer' />);
		const root = container.firstElementChild!;
		const ad = container.querySelector('ins')!;
		act(() => vi.advanceTimersByTime(2500));
		expect(root).toHaveAttribute('aria-hidden', 'true');
		expect(root).not.toHaveClass('mt-8');
		await act(async () => ad.setAttribute('data-ad-status', 'filled'));
		expect(root).toHaveAttribute('aria-hidden', 'false');
		expect(root).toHaveClass('mt-8');
		await act(async () => ad.setAttribute('data-ad-status', 'unfilled'));
		expect(root).toHaveAttribute('aria-hidden', 'true');
	});
});
