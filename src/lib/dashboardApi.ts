import { getSupabaseClient, isSupabaseConfigured } from './supabase';
import {
  filterAndSortApprovedPages,
  isApprovedCmsSlug,
} from '../data/pageRegistry';
import type {
  AuditLogRecord,
  MediaAsset,
  PageRecord,
  PageRevision,
  Profile,
} from '../types/database';

export interface RevisionWithPage extends PageRevision {
  pages?: { title: string; slug: string } | null;
}

export interface DashboardOverviewData {
  schemaReady: boolean;
  schemaMessage?: string;
  totalPages: number;
  publishedPages: number;
  draftPages: number;
  archivedPages: number;
  lastPublishedAt: string | null;
  homepageId: string | null;
  mediaCount: number;
  mediaTotalBytes: number;
  recentRevisions: RevisionWithPage[];
  recentActivity: AuditLogRecord[];
}

function isMissingSchemaError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('could not find the table') ||
    lower.includes('does not exist') ||
    lower.includes('schema cache')
  );
}

export async function fetchDashboardOverview(): Promise<DashboardOverviewData> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase credentials are not configured.');
  }

  const supabase = getSupabaseClient();

  const [pagesRes, revisionsRes, logsRes, mediaRes] = await Promise.all([
    supabase
      .from('pages')
      .select('id, title, slug, page_type, status, published_at, updated_at')
      .order('updated_at', { ascending: false }),
    supabase
      .from('page_revisions')
      .select('id, page_id, revision_number, status, created_at, published_at, change_summary, pages:page_id(title, slug)')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('media_assets').select('id, file_size'),
  ]);

  const firstError = pagesRes.error ?? revisionsRes.error ?? logsRes.error ?? mediaRes.error;
  if (firstError) {
    if (isMissingSchemaError(firstError.message)) {
      return {
        schemaReady: false,
        schemaMessage: firstError.message,
        totalPages: 0,
        publishedPages: 0,
        draftPages: 0,
        archivedPages: 0,
        lastPublishedAt: null,
        homepageId: null,
        mediaCount: 0,
        mediaTotalBytes: 0,
        recentRevisions: [],
        recentActivity: [],
      };
    }
    throw new Error(firstError.message);
  }

  const rawPages = (pagesRes.data ?? []) as Pick<
    PageRecord,
    'id' | 'title' | 'slug' | 'page_type' | 'status' | 'published_at' | 'updated_at'
  >[];
  const pages = filterAndSortApprovedPages(rawPages);
  const media = (mediaRes.data ?? []) as Pick<MediaAsset, 'id' | 'file_size'>[];

  const publishedPages = pages.filter((p) => p.status === 'published');
  const draftPages = pages.filter((p) => p.status === 'draft');
  const archivedPages = rawPages.filter((p) => p.status === 'archived');
  const homepage = pages.find((p) => p.page_type === 'home' || p.slug === '/') ?? pages[0] ?? null;

  const latestPublishedDates = publishedPages
    .map((p) => p.published_at)
    .filter((d): d is string => Boolean(d))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const mediaTotalBytes = media.reduce((sum, item) => sum + (Number(item.file_size) || 0), 0);

  const recentRevisions = ((revisionsRes.data ?? []) as unknown as RevisionWithPage[]).filter(
    (rev) => rev.pages?.slug && isApprovedCmsSlug(rev.pages.slug)
  );

  return {
    schemaReady: true,
    totalPages: pages.length,
    publishedPages: publishedPages.length,
    draftPages: draftPages.length,
    archivedPages: archivedPages.length,
    lastPublishedAt: latestPublishedDates[0] ?? null,
    homepageId: homepage?.id ?? null,
    mediaCount: media.length,
    mediaTotalBytes,
    recentRevisions,
    recentActivity: (logsRes.data ?? []) as AuditLogRecord[],
  };
}

export async function fetchAllPages(): Promise<PageRecord[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return filterAndSortApprovedPages((data ?? []) as PageRecord[]);
}

export async function fetchAuditLogs(limit = 50): Promise<AuditLogRecord[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as AuditLogRecord[];
}

export async function fetchAdminProfiles(): Promise<Profile[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Profile[];
}
