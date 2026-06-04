import localforage from 'localforage';
import { deflate, inflate } from 'pako';

localforage.config({
	name: 'ntut-course',
	version: 1.0,
	storeName: 'course_compressed',
	description: 'course data',
});

const memoryCache = new Map();

export async function getStore(key) {
	if (memoryCache.has(key)) return memoryCache.get(key);
	const raw = await localforage.getItem(key);
	if (!raw) return null;
	const data = JSON.parse(new TextDecoder('utf-8').decode(inflate(raw)));
	if (data.expiration < Date.now()) return null;
	memoryCache.set(key, data.data);
	return data.data;
}

export async function setStore(key, value, expiration = 1) {
	memoryCache.set(key, value);
	const data = new TextEncoder().encode(
		JSON.stringify({
			expiration: Date.now() + expiration * 24 * 60 * 60 * 1000,
			data: value,
		}),
	);
	await localforage.setItem(key, deflate(data, { level: 6 }));
}

export async function cleanStore() {
	memoryCache.clear();
	await localforage.clear();
}

export function readJsonStorage(key, fallback) {
	try {
		return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
	} catch {
		return fallback;
	}
}

export function writeJsonStorage(key, value) {
	localStorage.setItem(key, JSON.stringify(value));
}
