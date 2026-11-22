export type AppRole = 'SUPER_ADMIN' | 'EDITOR' | 'VIEWER';
export type PageStatus = 'draft' | 'published' | 'archived';
export type RevisionStatus = 'draft' | 'published' | 'superseded';
export type PageType =
  | 'home'
  | 'services'
  | 'approach'
  | 'about'
  | 'contact'
  | 'landing'
  | 'standard';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: AppRole;
  is_active: boolean;
  last_sign_in_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SeoMetadata {
  seoTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
}

export interface PageRecord {
  id: string;
  title: string;
  slug: string;
  page_type: PageType;
  status: PageStatus;
  seo_metadata: SeoMetadata;
  published_revision_id: string | null;
  draft_revision_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface PageContentJson {
  version: number;
  sections: Record<string, unknown>[];
}

export interface PageRevision {
  id: string;
  page_id: string;
  revision_number: number;
  content_json: PageContentJson;
  status: RevisionStatus;
  created_at: string;
  created_by: string | null;
  published_at: string | null;
  change_summary: string;
}

export interface SiteSetting {
  id: string;
  setting_key: string;
  setting_value: Record<string, unknown>;
  is_public: boolean;
  description: string;
  updated_at: string;
  updated_by: string | null;
}

export interface MediaAsset {
  id: string;
  file_name: string;
  file_type: 'image' | 'video' | 'document';
  mime_type: string;
  storage_bucket: string;
  storage_path: string;
  public_url: string;
  alt_text: string;
  file_size: number;
  dimensions: {
    width?: number;
    height?: number;
  };
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceRecord {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  service_kind: 'plan' | 'practice_area';
  price_display: string;
  original_price_display: string;
  discount_label: string;
  billing_period: string;
  image_asset_id: string | null;
  features: string[];
  deliverables: string[];
  tooling: string[];
  mapped_disciplines: string[];
  cadence: string;
  cta_label: string;
  cta_url: string;
  is_featured: boolean;
  is_visible: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface ProjectRecord {
  id: string;
  slug: string;
  title: string;
  client_name: string;
  summary: string;
  description: string;
  category: string;
  cover_asset_id: string | null;
  gallery_asset_ids: string[];
  external_url: string;
  metrics: { label: string; value: string }[];
  is_featured: boolean;
  is_visible: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface BrandRecord {
  id: string;
  slug: string;
  name: string;
  logo_asset_id: string | null;
  preview_asset_id: string | null;
  description: string;
  scopes: string[];
  filter_keys: string[];
  website_url: string;
  instagram_url: string;
  layout_variant: 'card' | 'wide';
  display_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface TestimonialRecord {
  id: string;
  author_name: string;
  author_designation: string;
  company_name: string;
  quote: string;
  avatar_asset_id: string | null;
  project_id: string | null;
  service_id: string | null;
  is_featured: boolean;
  is_visible: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface NavigationItemRecord {
  id: string;
  location: 'header' | 'footer_practice' | 'footer_engage' | 'footer_legal';
  parent_id: string | null;
  label: string;
  href: string;
  is_external: boolean;
  is_cta: boolean;
  display_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface RedirectRecord {
  id: string;
  source_path: string;
  destination_path: string;
  status_code: 301 | 302 | 307 | 308;
  is_active: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface AuditLogRecord {
  id: string;
  actor_id: string | null;
  actor_email: string;
  actor_role: AppRole | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface MediaUsageResult {
  exists: boolean;
  published_refs: number;
  collection_refs: number;
  in_use: boolean;
}
