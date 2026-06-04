export function Field({ label, children }) {
	return (
		<div className='grid gap-1'>
			{label ? <label className='block text-[0.85em] opacity-75'>{label}</label> : null}
			{children}
		</div>
	);
}
