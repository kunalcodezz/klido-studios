import { getSupabaseClient } from './supabase';
import { validatePageContentTree } from './schemaValidator';
import type { BlockNode, PageContentTree } from '../schemas/blocks';
import type { MediaAsset, PageRecord, PageRevision } from '../types/database';

export interface LoadedBuilderPage {
  page: PageRecord;
  tree: PageContentTree;
  draftRevisionId: string | null;
  revisionNumber: number;
}

export interface SavedSectionTemplate {
  id: string;
  name: string;
  category: string;
  createdAt: string;
  block: BlockNode;
}

export class OptimisticConcurrencyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OptimisticConcurrencyError';
  }
}

export async function fetchPageForBuilder(pageId: string): Promise<LoadedBuilderPage> {
  const supabase = getSupabaseClient();

  const { data: page, error: pageErr } = await supabase
    .from('pages')
    .select('*')
    .eq('id', pageId)
    .single();

  if (pageErr || !page) {
    throw new Error(pageErr?.message ?? 'Page not found.');
  }

  const typedPage = page as PageRecord;
  const targetRevisionId = typedPage.draft_revision_id ?? typedPage.published_revision_id;

  let revision: PageRevision | null = null;
  if (targetRevisionId) {
    const { data: revData } = await supabase
      .from('page_revisions')
      .select('*')
      .eq('id', targetRevisionId)
      .maybeSingle();
    if (revData) {
      revision = revData as PageRevision;
    }
  } else {
    const { data: latestRev } = await supabase
      .from('page_revisions')
      .select('*')
      .eq('page_id', pageId)
      .order('revision_number', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latestRev) {
      revision = latestRev as PageRevision;
    }
  }

  const validation = validatePageContentTree(
    revision?.content_json ?? { version: 1, sections: [] }
  );

  return {
    page: typedPage,
    tree: validation.tree,
    draftRevisionId: typedPage.draft_revision_id,
    revisionNumber: revision?.revision_number ?? 0,
  };
}

export async function saveBuilderDraft(
  pageId: string,
  expectedDraftRevisionId: string | null,
  tree: PageContentTree,
  changeSummary = 'Updated layout and content in visual builder'
): Promise<{ revisionId: string; revisionNumber: number }> {
  const validation = validatePageContentTree(tree);
  if (!validation.valid) {
    throw new Error(
      `Cannot save invalid page schema: ${validation.diagnostics[0]?.message ?? 'Unknown error'}`
    );
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('save_page_draft', {
    p_page_id: pageId,
    p_expected_draft_revision_id: expectedDraftRevisionId,
    p_content_json: validation.tree,
    p_change_summary: changeSummary,
  });

  if (error) {
    const lower = error.message.toLowerCase();
    if (lower.includes('concurrency') || lower.includes('modified by another')) {
      throw new OptimisticConcurrencyError(
        'This draft was updated in another session. Reload latest draft before overwriting.'
      );
    }
    throw new Error(error.message);
  }

  const result = data as { id?: string; revision_id?: string; revision_number?: number } | null;
  const savedRevisionId = result?.id ?? result?.revision_id;
  if (!savedRevisionId) {
    throw new Error('Draft saved but revision identifier was not returned.');
  }

  return {
    revisionId: savedRevisionId,
    revisionNumber: result?.revision_number ?? 1,
  };
}

const SAVED_SECTIONS_KEY = 'saved_sections_library';

export async function fetchSavedSections(): Promise<SavedSectionTemplate[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('site_settings')
    .select('setting_value')
    .eq('setting_key', SAVED_SECTIONS_KEY)
    .maybeSingle();

  if (error || !data?.setting_value) {
    return [];
  }

  const items = (data.setting_value as { items?: SavedSectionTemplate[] }).items;
  return Array.isArray(items) ? items : [];
}

export async function saveReusableSectionTemplate(
  name: string,
  category: string,
  block: BlockNode
): Promise<SavedSectionTemplate[]> {
  const supabase = getSupabaseClient();
  const existing = await fetchSavedSections();
  const template: SavedSectionTemplate = {
    id: crypto.randomUUID(),
    name: name.trim() || block.name,
    category,
    createdAt: new Date().toISOString(),
    block: structuredClone(block) as BlockNode,
  };

  const next = [template, ...existing].slice(0, 40);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from('site_settings').upsert(
    {
      setting_key: SAVED_SECTIONS_KEY,
      setting_value: { items: next },
      is_public: false,
      description: 'Reusable section templates saved from the Klido Visual Builder',
      updated_by: user?.id ?? null,
    },
    { onConflict: 'setting_key' }
  );

  if (error) {
    throw new Error(error.message);
  }

  return next;
}

export async function deleteReusableSectionTemplate(id: string): Promise<SavedSectionTemplate[]> {
  const supabase = getSupabaseClient();
  const existing = await fetchSavedSections();
  const next = existing.filter((item) => item.id !== id);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from('site_settings').upsert(
    {
      setting_key: SAVED_SECTIONS_KEY,
      setting_value: { items: next },
      is_public: false,
      description: 'Reusable section templates saved from the Klido Visual Builder',
      updated_by: user?.id ?? null,
    },
    { onConflict: 'setting_key' }
  );

  if (error) {
    throw new Error(error.message);
  }

  return next;
}

export async function fetchMediaAssetsForPicker(): Promise<MediaAsset[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('media_assets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(60);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as MediaAsset[];
}
