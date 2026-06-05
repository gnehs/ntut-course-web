import {
	parsePreviewRoute,
	previewTags,
	resolvePreviewMeta,
	type PreviewMeta,
} from './worker/preview';
import { cache } from '@cf-wasm/og/workerd';
import { WORKER_PREVIEW_CACHE_CONTROL } from './worker/cache';
import { handleOgImageRequest } from './worker/ogImage';

type AssetFetcher = {
	fetch(request: Request): Promise<Response>;
};

type Env = {
	ASSETS: AssetFetcher;
	API_BASE?: string;
	DOMAIN_NAME?: string;
	OG_IMAGE_BASE?: string;
};

type ExecutionContext = {
	waitUntil(promise: Promise<unknown>): void;
	passThroughOnException(): void;
};

type HTMLRewriterElement = {
	getAttribute(name: string): string | null;
	setInnerContent(content: string): void;
	remove(): void;
	append(content: string, options?: { html?: boolean }): void;
};

declare class HTMLRewriter {
	on(
		selector: string,
		handlers: {
			element(element: HTMLRewriterElement): void;
		},
	): HTMLRewriter;
	transform(response: Response): Response;
}

const MANAGED_META_KEYS = new Set(previewTags(emptyMeta()).map((tag) => tag.key));

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		if (!['GET', 'HEAD'].includes(request.method)) return env.ASSETS.fetch(request);

		cache.setExecutionContext(ctx);
		const url = new URL(request.url);
		const imageResponse = await handleOgImageRequest(request, { apiBase: env.API_BASE });
		if (imageResponse) return imageResponse;

		const route = parsePreviewRoute(url);
		if (!route) return env.ASSETS.fetch(request);

		const meta = await resolvePreviewMeta(route, {
			apiBase: env.API_BASE,
			ogImageBase: env.OG_IMAGE_BASE,
			origin: env.DOMAIN_NAME ? `https://${env.DOMAIN_NAME}` : url.origin,
		}).catch(() => null);
		if (!meta) return env.ASSETS.fetch(request);

		const htmlRequest = new Request(new URL('/', url), request);
		const response = await env.ASSETS.fetch(htmlRequest);
		return rewritePreviewHtml(response, meta);
	},
};

export function rewritePreviewHtml(response: Response, meta: PreviewMeta) {
	const rewritten = new HTMLRewriter()
		.on('title', {
			element(element) {
				element.setInnerContent(meta.title);
			},
		})
		.on('meta', {
			element(element) {
				const key = element.getAttribute('property') || element.getAttribute('name');
				if (key && MANAGED_META_KEYS.has(key)) element.remove();
			},
		})
		.on('head', {
			element(element) {
				element.append(`\n${renderPreviewTags(meta)}\n`, { html: true });
			},
		})
		.transform(response);
	const cachedResponse = new Response(rewritten.body, rewritten);
	cachedResponse.headers.set('Cache-Control', WORKER_PREVIEW_CACHE_CONTROL);
	return cachedResponse;
}

function renderPreviewTags(meta: PreviewMeta) {
	return previewTags(meta)
		.map((tag) => {
			const keyAttr = tag.property
				? `property="${escapeHtml(tag.property)}"`
				: `name="${escapeHtml(tag.name || '')}"`;
			return `<meta ${keyAttr} content="${escapeHtml(tag.content)}">`;
		})
		.join('\n');
}

function escapeHtml(value: string) {
	return value
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

function emptyMeta(): PreviewMeta {
	return {
		title: '',
		description: '',
		url: '',
		image: '',
	};
}
