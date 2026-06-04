import { gsap } from 'gsap';

export function isReducedMotion() {
	if (typeof window === 'undefined') return true;
	if (typeof window.matchMedia !== 'function') return true;
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function bindInteractiveCard(element) {
	if (!element || isReducedMotion()) return () => {};

	const icon = element.querySelector(':scope > i');
	const shadowOpacity =
		Number.parseFloat(
			getComputedStyle(document.documentElement).getPropertyValue('--vs-shadow-opacity'),
		) || 0.05;
	const baseShadow = `0 5px 20px 0 rgba(0,0,0,${shadowOpacity})`;
	const liftShadow = `0 10px 24px 0 rgba(0,0,0,${Math.min(shadowOpacity * 1.5, 0.18)})`;
	let hovered = false;

	gsap.set(element, { transformOrigin: '50% 50%', willChange: 'transform' });
	if (icon) gsap.set(icon, { transformOrigin: '100% 100%' });

	function enter() {
		hovered = true;
		gsap.to(element, {
			y: -3,
			scale: 1.002,
			boxShadow: liftShadow,
			duration: 0.2,
			ease: 'power3.out',
			overwrite: 'auto',
		});
		if (icon) {
			gsap.to(icon, {
				autoAlpha: 0.34,
				y: -1,
				scale: 1.025,
				duration: 0.24,
				ease: 'power3.out',
				overwrite: 'auto',
			});
		}
	}

	function leave() {
		hovered = false;
		gsap.to(element, {
			y: 0,
			scale: 1,
			boxShadow: baseShadow,
			duration: 0.22,
			ease: 'power3.out',
			overwrite: 'auto',
		});
		if (icon) {
			gsap.to(icon, {
				autoAlpha: 0.2,
				y: 0,
				scale: 1,
				duration: 0.24,
				ease: 'power2.out',
				overwrite: 'auto',
			});
		}
	}

	function press() {
		gsap.to(element, {
			y: 1,
			scale: 0.998,
			boxShadow: `0 3px 10px 0 rgba(0,0,0,${Math.max(shadowOpacity * 0.7, 0.03)})`,
			duration: 0.08,
			ease: 'power2.out',
			overwrite: 'auto',
		});
	}

	function release() {
		if (hovered) enter();
		else leave();
	}

	element.addEventListener('pointerenter', enter);
	element.addEventListener('pointerleave', leave);
	element.addEventListener('pointerdown', press);
	element.addEventListener('pointerup', release);
	element.addEventListener('pointercancel', leave);
	element.addEventListener('focus', enter);
	element.addEventListener('blur', leave);

	return () => {
		element.removeEventListener('pointerenter', enter);
		element.removeEventListener('pointerleave', leave);
		element.removeEventListener('pointerdown', press);
		element.removeEventListener('pointerup', release);
		element.removeEventListener('pointercancel', leave);
		element.removeEventListener('focus', enter);
		element.removeEventListener('blur', leave);
		gsap.killTweensOf([element, icon].filter(Boolean));
		gsap.set([element, icon].filter(Boolean), { clearProps: 'all' });
	};
}

export function animateSearchResults(element, visible) {
	if (!element || isReducedMotion()) return () => {};

	gsap.to(element, {
		autoAlpha: visible ? 1 : 0,
		y: visible ? 0 : -8,
		scale: visible ? 1 : 0.985,
		duration: visible ? 0.22 : 0.14,
		ease: visible ? 'power3.out' : 'power2.in',
		transformOrigin: '50% 0%',
		overwrite: 'auto',
	});

	if (visible) {
		gsap.fromTo(
			element.querySelectorAll('[data-search-result-item]'),
			{ autoAlpha: 0, x: -6 },
			{ autoAlpha: 1, x: 0, duration: 0.22, ease: 'power2.out', stagger: 0.018, overwrite: 'auto' },
		);
	}

	return () => gsap.killTweensOf(element);
}
