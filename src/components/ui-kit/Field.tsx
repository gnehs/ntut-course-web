import { Children, Fragment, cloneElement, isValidElement, useId } from 'react';
import type { ReactElement, ReactNode } from 'react';

type FieldProps = {
	label?: ReactNode;
	children?: ReactNode;
	id?: string;
};

const labelableElements = new Set([
	'button',
	'input',
	'meter',
	'output',
	'progress',
	'select',
	'textarea',
]);

export function Field({ label, children, id }: FieldProps) {
	const generatedId = `field-${useId().replaceAll(':', '')}`;
	const controlId = id || generatedId;
	const linked = label ? linkControl(children, controlId) : { children, controlId: undefined };

	return (
		<div className='grid gap-1'>
			{label ? (
				<label htmlFor={linked.controlId} className='block text-[0.85em] opacity-75'>
					{label}
				</label>
			) : null}
			{linked.children}
		</div>
	);
}

function linkControl(children: ReactNode, id: string): { children: ReactNode; controlId?: string } {
	let linked = false;
	let controlId: string | undefined;

	const enhancedChildren = Children.map(children, (child) => {
		if (linked || !isValidElement(child)) return child;
		const element = child as ReactElement<Record<string, unknown>>;
		const props = element.props as { id?: unknown; children?: ReactNode };

		const shouldDescend =
			element.type === Fragment ||
			(typeof element.type === 'string' && !labelableElements.has(element.type));
		if (shouldDescend) {
			const nested = linkControl(props.children, id);
			if (!nested.controlId) return element;
			linked = true;
			controlId = nested.controlId;
			return cloneElement(element, { children: nested.children });
		}

		const childId = typeof props.id === 'string' && props.id ? props.id : undefined;
		if (childId) {
			linked = true;
			controlId = childId;
			return child;
		}

		linked = true;
		controlId = id;
		return cloneElement(element, { id });
	});

	return { children: enhancedChildren, controlId };
}
