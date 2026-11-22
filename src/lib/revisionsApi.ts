import { z } from 'zod';
import { getSupabaseClient } from './supabase';
import { fetchPageForBuilder, OptimisticConcurrencyError } from './builderApi';
import { validatePageContentTree } from './schemaValidator';
import type { BlockNode, PageContentTree } from '../schemas/blocks';
import { optionalSafeUrlSchema, slugSchema } from '../schemas/validation';
import type { PageRecord, PageRevision, PageType, SeoMetadata } from '../types/database';

export interface RevisionWithDetails extends PageRevision {
  pages?: {
    id: string;
    title: string;
    slug: string;
    published_revision_id: string | null;
    draft_revision_id: string | null;
  } | null;
}

export interface SectionDiffItem {
  id: string;
  name: string;
  type: string;
  status: 'added' | 'removed' | 'modified' | 'reordered' | 'unchanged';
}

export interface RevisionDiffSummary {
  addedCount: number;
  removedCount: number;
  modifiedCount: number;
  reorderedCount: number;
  items: SectionDiffItem[];
}

export const seoMetadataInputSchema = z.object({
  seoTitle: z.string().trim().max(160).default(''),
  metaDescription: z.string().trim().max(320).default(''),
  canonicalUrl: optionalSafeUrlSchema.default(''),
  ogTitle: z.string().trim().max(160).default(''),
  ogDescription: z.string().trim().max(320).default(''),
  ogImage: optionalSafeUrlSchema.default(''),
  robotsIndex: z.boolean().default(true),
  robotsFollow: z.boolean().default(true),
});

export const createPageInputSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120),
  slug: slugSchema,
  page_type: z
    .enum(['home', 'services', 'approach', 'about', 'contact', 'landing', 'standard'])
    .default('landing'),
});

export async function sha256Hex(raw: string): Promise<string> {
  const bytes = new TextEncoder().encode(raw);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function generateSecurePreviewToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function computeRevisionDiffSummary(
  targetTree: PageContentTree,
  baselineTree: PageContentTree | null
): RevisionDiffSummary {
  const targetSections = targetTree.sections ?? [];
  const baseSections = baselineTree?.sections ?? [];

  const baseMap = new Map<string, { node: BlockNode; index: number }>();
  baseSections.forEach((node, idx) => baseMap.set(node.id, { node, index: idx }));

  const targetIds = new Set(targetSections.map((s) => s.id));
  const items: SectionDiffItem[] = [];

  let addedCount = 0;
  let removedCount = 0;
  let modifiedCount = 0;
  let reorderedCount = 0;

  targetSections.forEach((node, idx) => {
    const prev = baseMap.get(node.id);
    if (!prev) {
      addedCount += 1;
      items.push({ id: node.id, name: node.name, type: node.type, status: 'added' });
      return;
    }

    const contentChanged = JSON.stringify(prev.node) !== JSON.stringify(node);
    const indexChanged = prev.index !== idx;

    if (contentChanged) {
      modifiedCount += 1;
      items.push({ id: node.id, name: node.name, type: node.type, status: 'modified' });
    } else if (indexChanged) {
      reorderedCount += 1;
      items.push({ id: node.id, name: node.name, type: node.type, status: 'reordered' });
    } else {
      items.push({ id: node.id, name: node.name, type: node.type, status: 'unchanged' });
    }
  });

  baseSections.forEach((node) => {
    if (!targetIds.has(node.id)) {
      removedCount += 1;
      items.push({ id: node.id, name: node.name, type: node.type, status: 'removed' });
    }
  });

  return {
    addedCount,
    removedCount,
    modifiedCount,
    reorderedCount,
    items,
  };
}

export async function publishPageRevision(
  pageId: string,
  expectedDraftRevisionId: string | null,
  changeSummary = 'Published update'
): Promise<PageRevision> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('publish_page_revision', {
    p_page_id: pageId,
    p_expected_draft_revision_id: expectedDraftRevisionId,
    p_change_summary: changeSummary,
  });

  if (error) {
    const lower = error.message.toLowerCase();
    if (lower.includes('conflict')) {
      throw new OptimisticConcurrencyError(error.message);
    }
    throw new Error(error.message);
  }

  return data as PageRevision;
}

export async function restorePageRevision(
  pageId: string,
  sourceRevisionId: string
): Promise<PageRevision> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('restore_page_revision', {
    p_page_id: pageId,
    p_source_revision_id: sourceRevisionId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as PageRevision;
}

export async function fetchPageRevisions(pageId?: string): Promise<RevisionWithDetails[]> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('page_revisions')
    .select(
      '*, pages:page_id(id, title, slug, published_revision_id, draft_revision_id)'
    )
    .order('created_at', { ascending: false })
    .limit(100);

  if (pageId) {
    query = query.eq('page_id', pageId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as RevisionWithDetails[];
}

export async function fetchPublishedBaselineTree(
  publishedRevisionId: string | null
): Promise<PageContentTree | null> {
  if (!publishedRevisionId) return null;
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from('page_revisions')
    .select('content_json')
    .eq('id', publishedRevisionId)
    .maybeSingle();

  if (!data?.content_json) return null;
  return validatePageContentTree(data.content_json).tree;
}

export async function createExpiringPreviewLink(
  pageId: string,
  revisionId: string,
  ttlHours = 24
): Promise<{ rawToken: string; previewPath: string; fullUrl: string; expiresAt: string }> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Authentication required to generate preview links.');
  }

  const rawToken = generateSecurePreviewToken();
  const tokenHash = await sha256Hex(rawToken);
  const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000).toISOString();

  const { error } = await supabase.from('preview_tokens').insert({
    token_hash: tokenHash,
    page_id: pageId,
    revision_id: revisionId,
    expires_at: expiresAt,
    created_by: user.id,
  });

  if (error) {
    throw new Error(error.message);
  }

  const previewPath = `/preview/${pageId}?token=${rawToken}`;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return {
    rawToken,
    previewPath,
    fullUrl: `${origin}${previewPath}`,
    expiresAt,
  };
}

export interface ResolvedPreviewPayload {
  page: PageRecord;
  tree: PageContentTree;
  revisionNumber: number;
  expiresAt: string | null;
  mode: 'token' | 'staff';
}

export async function resolvePreviewPage(
  pageId: string,
  rawToken?: string | null
): Promise<ResolvedPreviewPayload> {
  const supabase = getSupabaseClient();

  if (rawToken && rawToken.trim().length > 0) {
    const { data, error } = await supabase.rpc('resolve_preview_token', {
      p_raw_token: rawToken.trim(),
    });

    if (error || !data) {
      throw new Error(error?.message ?? 'Preview token expired or invalid.');
    }

    const payload = data as {
      page: PageRecord;
      revision: PageRevision;
      expires_at: string;
    };

    if (payload.page.id !== pageId) {
      throw new Error('Preview token does not match the requested page.');
    }

    const validated = validatePageContentTree(payload.revision?.content_json ?? {});
    return {
      page: payload.page,
      tree: validated.tree,
      revisionNumber: payload.revision?.revision_number ?? 1,
      expiresAt: payload.expires_at,
      mode: 'token',
    };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Sign in or provide a valid preview token to view this draft.');
  }

  const loaded = await fetchPageForBuilder(pageId);
  return {
    page: loaded.page,
    tree: loaded.tree,
    revisionNumber: loaded.revisionNumber,
    expiresAt: null,
    mode: 'staff',
  };
}

export async function createNewCmsPage(input: {
  title: string;
  slug: string;
  page_type: PageType;
}): Promise<PageRecord> {
  const parsed = createPageInputSchema.parse(input);
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Authentication required to create pages.');
  }

  const { data: inserted, error } = await supabase
    .from('pages')
    .insert({
      title: parsed.title,
      slug: parsed.slug,
      page_type: parsed.page_type,
      status: 'draft',
      seo_metadata: {
        seoTitle: `${parsed.title} | Klido`,
        metaDescription: '',
        canonicalUrl: `https://www.klido.in${parsed.slug === '/' ? '/' : parsed.slug}`,
        ogTitle: `${parsed.title} | Klido`,
        ogDescription: '',
        ogImage: 'https://www.klido.in/klido_Logo.png',
        robotsIndex: true,
        robotsFollow: true,
      },
      created_by: user.id,
      updated_by: user.id,
    })
    .select('*')
    .single();

  if (error || !inserted) {
    throw new Error(error?.message ?? 'Unable to create page.');
  }

  const { error: revErr } = await supabase.rpc('save_page_draft', {
    p_page_id: inserted.id,
    p_expected_draft_revision_id: null,
    p_content_json: { version: 1, sections: [] },
    p_change_summary: 'Initial empty draft',
  });

  if (revErr) {
    throw new Error(revErr.message);
  }

  return inserted as PageRecord;
}

export async function updatePageMetadata(
  pageId: string,
  updates: {
    title: string;
    slug: string;
    page_type: PageType;
    status?: 'draft' | 'archived' | 'published';
    seo_metadata: SeoMetadata;
  }
): Promise<PageRecord> {
  const validSlug = slugSchema.parse(updates.slug);
  const validSeo = seoMetadataInputSchema.parse(updates.seo_metadata);
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('pages')
    .update({
      title: updates.title.trim(),
      slug: validSlug,
      page_type: updates.page_type,
      ...(updates.status ? { status: updates.status } : {}),
      seo_metadata: validSeo,
      updated_by: user?.id ?? null,
    })
    .eq('id', pageId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Unable to update page settings.');
  }

  return data as PageRecord;
}
