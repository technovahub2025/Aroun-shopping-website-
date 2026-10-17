const LEGACY_API_ORIGINS = new Set([
'https://aroun-shopping-website-5nnj.onrender.com'
]);

// Resolve at render time so persisted products, carts and orders also migrate.
export function resolveImageUrl(value, apiBaseUrl = import.meta.env?.VITE_API_BASE_URL) {
  if (typeof value !== 'string' || !apiBaseUrl) return value;

  try {
    const image = new URL(value);
    const api = new URL(apiBaseUrl);
    if (
      LEGACY_API_ORIGINS.has(image.origin) &&
      image.pathname.startsWith('/api/drive-images/') &&
      ['http:', 'https:'].includes(api.protocol)
    ) {
      return `${api.origin}${image.pathname}${image.search}${image.hash}`;
    }
  } catch {
    // Relative paths, local previews and invalid values keep their existing behavior.
  }
  return value;
}
