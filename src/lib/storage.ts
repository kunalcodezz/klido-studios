import { getSupabaseClient } from './supabase';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  mediaUploadValidationSchema,
  sanitizeFileName,
} from '../schemas/validation';
import type { MediaAsset, MediaUsageResult } from '../types/database';

const MEDIA_BUCKET = 'klido-media';

async function extractImageDimensions(
  file: File
): Promise<{ width?: number; height?: number }> {
  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
    return {};
  }

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const dims = { width: img.naturalWidth, height: img.naturalHeight };
      URL.revokeObjectURL(objectUrl);
      resolve(dims);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({});
    };
    img.src = objectUrl;
  });
}

export async function uploadMediaAsset(file: File, altText = ''): Promise<MediaAsset> {
  const parsed = mediaUploadValidationSchema.safeParse({
    fileName: file.name,
    mimeType: file.type,
    fileSize: file.size,
    altText,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid media file.');
  }

  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Authentication required to upload media assets.');
  }

  const cleanName = sanitizeFileName(parsed.data.fileName);
  const storagePath = `uploads/${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}-${cleanName}`;

  const { error: uploadError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(storagePath, file, {
      contentType: parsed.data.mimeType,
      upsert: false,
      cacheControl: '31536000',
    });

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from(MEDIA_BUCKET)
    .getPublicUrl(storagePath);

  const dimensions = await extractImageDimensions(file);
  const fileType = ALLOWED_IMAGE_MIME_TYPES.has(parsed.data.mimeType) ? 'image' : 'video';

  const { data: inserted, error: dbError } = await supabase
    .from('media_assets')
    .insert({
      file_name: parsed.data.fileName,
      file_type: fileType,
      mime_type: parsed.data.mimeType,
      storage_bucket: MEDIA_BUCKET,
      storage_path: storagePath,
      public_url: publicUrlData.publicUrl,
      alt_text: parsed.data.altText,
      file_size: parsed.data.fileSize,
      dimensions,
      uploaded_by: user.id,
    })
    .select('*')
    .single();

  if (dbError) {
    // Roll back storage object if metadata insert fails
    await supabase.storage.from(MEDIA_BUCKET).remove([storagePath]);
    throw new Error(`Media metadata save failed: ${dbError.message}`);
  }

  return inserted as MediaAsset;
}

export async function checkMediaAssetUsage(assetId: string): Promise<MediaUsageResult> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('check_media_asset_usage', {
    p_asset_id: assetId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as MediaUsageResult;
}

export async function deleteMediaAssetSafely(asset: MediaAsset): Promise<void> {
  const usage = await checkMediaAssetUsage(asset.id);
  if (usage.in_use) {
    throw new Error(
      `Cannot delete "${asset.file_name}": referenced by ${usage.published_refs} published page(s) and ${usage.collection_refs} content record(s).`
    );
  }

  const supabase = getSupabaseClient();
  const { error: dbError } = await supabase.from('media_assets').delete().eq('id', asset.id);
  if (dbError) {
    throw new Error(dbError.message);
  }

  const { error: storageError } = await supabase.storage
    .from(asset.storage_bucket)
    .remove([asset.storage_path]);

  if (storageError) {
    console.warn('[Storage] Asset row removed, storage cleanup warning:', storageError.message);
  }
}
