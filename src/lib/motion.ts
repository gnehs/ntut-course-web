import { gsap } from 'gsap';

export function isReducedMotion() {
	if (typeof window === 'undefined') return true;
	if (typeof window.matchMedia !== 'function') return true;
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function bindInteractiveCard(element) {
	if (!element || isReducedMotion()) return () => {};

	const icon = element.querySelector(':scope > [data-card-icon]');
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
				y: -10,
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
				y: 10,
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

export function animateFilterSection(
	element,
	icon,
	expanded,
	immediate = false,
	onRest = () => {},
) {
	if (!element) return () => {};

	const targets = [element, icon].filter(Boolean);

	if (isReducedMotion()) {
		gsap.killTweensOf(targets);
		gsap.set(element, {
			autoAlpha: expanded ? 1 : 0,
			clearProps: expanded ? 'height,overflow,transform' : 'transform',
			display: expanded ? 'block' : 'none',
			height: expanded ? 'auto' : 0,
		});
		if (icon) gsap.set(icon, { rotate: expanded ? 180 : 0, transformOrigin: '50% 50%' });
		onRest();
		return () => {};
	}

	gsap.killTweensOf(targets);
	if (icon) {
		gsap.to(icon, {
			rotate: expanded ? 180 : 0,
			duration: immediate ? 0 : 0.2,
			ease: 'power3.out',
			transformOrigin: '50% 50%',
			overwrite: 'auto',
		});
	}

	if (expanded) {
		gsap.set(element, { display: 'block', height: 'auto', overflow: 'hidden' });
		const height = element.offsetHeight;
		gsap.fromTo(
			element,
			{ autoAlpha: immediate ? 1 : 0, height: immediate ? 'auto' : 0, y: immediate ? 0 : -6 },
			{
				autoAlpha: 1,
				height,
				y: 0,
				duration: immediate ? 0 : 0.26,
				ease: 'power3.out',
				overwrite: 'auto',
				onComplete: () => {
					gsap.set(element, { clearProps: 'height,overflow,transform' });
					onRest();
				},
			},
		);
	} else {
		gsap.set(element, { display: 'block', height: element.offsetHeight, overflow: 'hidden' });
		gsap.to(element, {
			autoAlpha: 0,
			height: 0,
			y: -4,
			duration: immediate ? 0 : 0.18,
			ease: 'power2.inOut',
			overwrite: 'auto',
			onComplete: () => {
				gsap.set(element, { display: 'none', clearProps: 'overflow,transform' });
				onRest();
			},
		});
	}

	return () => gsap.killTweensOf(targets);
}
