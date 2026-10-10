import {
	Dialog as ShadcnDialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import type React from 'react';

type DialogProps = {
	open?: boolean;
	title?: React.ReactNode;
	children?: React.ReactNode;
	footer?: React.ReactNode;
	onClose?: () => void;
};

export function Dialog({ open, title, children, footer, onClose }: DialogProps) {
	return (
		<ShadcnDialog open={open} onOpenChange={(value) => !value && onClose?.()}>
			<DialogContent className='rounded-overlay text-foreground bg-sheen-surface shadow-overlay w-[min(420px,calc(100vw-2rem))] gap-4 border-0 bg-[rgb(var(--vs-background))] p-5'>
				<DialogHeader className='text-left'>
					<DialogTitle>{title || '對話框'}</DialogTitle>
					<DialogDescription className='sr-only'>{title || '對話框'}</DialogDescription>
				</DialogHeader>
				{children}
				{footer ? <DialogFooter>{footer}</DialogFooter> : null}
			</DialogContent>
		</ShadcnDialog>
	);
}
