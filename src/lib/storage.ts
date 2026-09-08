// src/lib/storage.ts
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';

export const MOBILE_STORAGE_BUCKET = 'mobile-receipts';

export interface UploadResult {
  url: string | null;
  path: string | null;
  error?: string | null;
  isLocalFallback?: boolean;
}

/**
 * Uploads a receipt image to the dedicated 'mobile-receipts' Supabase Storage bucket.
 * If the bucket has not been configured in Supabase yet, gracefully returns the local URI
 * with a notice so the app continues functioning seamlessly.
 */
export async function uploadReceiptImage(
  uri: string,
  householdId: string
): Promise<UploadResult> {
  try {
    const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const cleanExt = ext.includes('?') ? ext.split('?')[0] : ext;
    const contentType = cleanExt === 'png' ? 'image/png' : 'image/jpeg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${cleanExt}`;
    const filePath = `${householdId}/${fileName}`;

    // Read local image file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });

    const arrayBuffer = decode(base64);

    const { data, error } = await supabase.storage
      .from(MOBILE_STORAGE_BUCKET)
      .upload(filePath, arrayBuffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.warn(`[Supabase Storage] Notice for bucket '${MOBILE_STORAGE_BUCKET}':`, error.message);
      // Return local URI as fallback so user can still see their receipt preview
      return {
        url: uri,
        path: filePath,
        error: error.message,
        isLocalFallback: true,
      };
    }

    // Retrieve public URL
    const { data: publicData } = supabase.storage
      .from(MOBILE_STORAGE_BUCKET)
      .getPublicUrl(filePath);

    return {
      url: publicData.publicUrl,
      path: filePath,
      error: null,
      isLocalFallback: false,
    };
  } catch (err: any) {
    console.warn('[uploadReceiptImage] Exception:', err);
    return {
      url: uri,
      path: null,
      error: err?.message || 'Failed to process image',
      isLocalFallback: true,
    };
  }
}

