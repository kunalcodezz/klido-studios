import { z } from 'zod';

const ALLOWED_URL_PROTOCOLS = new Set(['https:', 'http:', 'mailto:', 'tel:']);

/**
 * Validates that URLs are safe relative paths (/about, #pricing) or explicit
 * allowlisted protocols (https:, http:, mailto:, tel:). Blocks javascript:,
 * vbscript:, data:, and protocol-relative injection vectors.
 */
export function isSafeUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('//')) return false;
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) return true;

  try {
    const parsed = new URL(trimmed);
    return ALLOWED_URL_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
}

export const safeUrlSchema = z
  .string()
  .trim()
  .refine(isSafeUrl, 'URL must be a relative path or use https, http, mailto, or tel.');

export const optionalSafeUrlSchema = z
  .string()
  .trim()
  .refine(
    (val) => val === '' || isSafeUrl(val),
    'URL must be empty, a relative path, or use https, http, mailto, or tel.'
  );

export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/avif',
  'image/gif',
]);

export const ALLOWED_VIDEO_MIME_TYPES = new Set(['video/mp4', 'video/webm']);

export const ALLOWED_MEDIA_MIME_TYPES = new Set([
  ...ALLOWED_IMAGE_MIME_TYPES,
  ...ALLOWED_VIDEO_MIME_TYPES,
]);

export const MAX_MEDIA_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const mediaUploadValidationSchema = z.object({
  fileName: z
    .string()
    .trim()
    .min(1, 'File name is required.')
    .max(200, 'File name must be under 200 characters.'),
  mimeType: z
    .string()
    .refine(
      (mime) => ALLOWED_MEDIA_MIME_TYPES.has(mime),
      'Unsupported media format. Allowed: PNG, JPG, WebP, AVIF, GIF, MP4, WebM.'
    ),
  fileSize: z
    .number()
    .int()
    .positive('File cannot be empty.')
    .max(MAX_MEDIA_FILE_SIZE_BYTES, 'File exceeds maximum 10 MB upload limit.'),
  altText: z.string().trim().max(300, 'Alt text must be under 300 characters.').default(''),
});

export function sanitizeFileName(rawName: string): string {
  const leaf = rawName.split(/[/\\]/).pop() ?? rawName;
  const cleaned = leaf
    .toLowerCase()
    .replace(/\.{2,}/g, '.')
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+\./g, '.')
    .replace(/^[.-]+|[.-]+$/g, '');
  return cleaned || 'asset';
}

export const seoMetadataSchema = z.object({
  seoTitle: z.string().trim().max(120, 'SEO title should stay under 120 characters.'),
  metaDescription: z
    .string()
    .trim()
    .max(320, 'Meta description should stay under 320 characters.'),
  canonicalUrl: optionalSafeUrlSchema,
  ogTitle: z.string().trim().max(120),
  ogDescription: z.string().trim().max(320),
  ogImage: optionalSafeUrlSchema,
  robotsIndex: z.boolean(),
  robotsFollow: z.boolean(),
});

export const slugSchema = z
  .string()
  .trim()
  .regex(/^\/[a-z0-9-/]*$/, 'Slug must start with / and contain only lowercase letters, numbers, and hyphens.');

export const pageMetadataSchema = z.object({
  title: z.string().trim().min(1, 'Page title is required.').max(120),
  slug: slugSchema,
  page_type: z.enum(['home', 'services', 'approach', 'about', 'contact', 'landing', 'standard']),
  seo_metadata: seoMetadataSchema,
});
