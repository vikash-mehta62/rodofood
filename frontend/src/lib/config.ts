/**
 * Central config — all env variables read from here.
 * Never import process.env directly in components; use this file.
 */

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';

/** Base server URL (strips /api/v1) — used for image paths */
export const BASE_URL = API_URL.replace('/api/v1', '');

export const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? BASE_URL;

/**
 * Resolve an image path returned by the backend.
 * If it's already an absolute URL, return as-is.
 * Otherwise prepend BASE_URL.
 */
export function resolveImage(path?: string | null): string | null {
  if (!path) return null;
  return path.startsWith('http') ? path : `${BASE_URL}${path}`;
}
