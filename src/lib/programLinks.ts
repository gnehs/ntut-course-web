export const MPROGRAM_OFFICIAL_URL = 'https://oaa.ntut.edu.tw/p/412-1008-13057.php?Lang=zh-tw';
export const PROGRAM_OFFICIAL_URL = 'https://oaa.ntut.edu.tw/p/412-1008-14809.php?Lang=zh-tw';

export const programOfficialLinks = {
	regulation: 'https://oaa.ntut.edu.tw/var/file/8/1008/img/2966/F1.pdf',
	register: 'https://oaa.ntut.edu.tw/p/412-1008-15588.php?Lang=zh-tw',
	contacts: 'https://oaa.ntut.edu.tw/p/412-1008-17837.php?Lang=zh-tw',
	certificate: 'https://forms.gle/BwD9T5xFeVrATugL9',
};

/** The crawler stored relative links before it switched to absolute ones. */
export function mprogramSourceUrl(link: string) {
	return /^https?:\/\//.test(link) ? link : `https://aps.ntut.edu.tw/course/tw/${link}`;
}
