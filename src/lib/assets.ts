// Keep local assets valid both at a domain root and under a Vite base subpath.
export function asset(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${import.meta.env?.BASE_URL ?? '/'}${path.replace(/^\//, '')}`;
}
