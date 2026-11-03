import { IconFileDescription, IconFileText, IconTable } from '@tabler/icons-react';
import { ActionList, type ActionListItem } from './ui-kit/ActionList';

type Documents = { rules: string | null; plan: string | null; apply: string | null };

const formLabels: Record<string, string> = { odt: 'ODT 格式', docx: 'Word 格式', doc: 'Word 格式' };

/** 一般學程 publish a 學程規劃書 where 微學程 publish a 施行細則. */
export function documentLinks(docs: Documents | null, rulesTitle = '施行細則'): ActionListItem[] {
	if (!docs) return [];
	const extension = docs.apply?.split('.').pop()?.toLowerCase() ?? '';
	return [
		...(docs.rules ? [{ href: docs.rules, title: rulesTitle, icon: IconFileText }] : []),
		...(docs.plan ? [{ href: docs.plan, title: '課程規劃表', icon: IconTable }] : []),
		...(docs.apply
			? [{ href: docs.apply, title: '修畢申請表', text: formLabels[extension], icon: IconFileDescription }]
			: []),
	];
}

export function ProgramDocsSection({ links }: { links: ActionListItem[] }) {
	return (
		<section className='flex flex-col gap-2'>
			<h2 className='m-0 text-lg font-semibold'>相關連結</h2>
			<ActionList items={links} />
		</section>
	);
}
