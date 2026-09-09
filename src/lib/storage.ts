// src/lib/storage.ts
import { Platform } from 'react-native';
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
 * Universally uploads a receipt image to the dedicated 'mobile-receipts' Supabase Storage bucket.
 * Supports:
 * - Web blob URIs (blob:http://...) and data URIs via native browser fetch/blob conversion
 * - Mobile native file URIs (file://...) via FileSystem base64 decoding
 * - Android content URIs (content://...) via fetch/blob fallback
 * Guaranteed never to save temporary local/blob URIs to the database.
 */
export async function uploadReceiptImage(
  uri: string,
  householdId: string
): Promise<UploadResult> {
  try {
    if (!uri) {
      return { url: null, path: null, error: 'No image URI provided', isLocalFallback: false };
    }

    // 1. Determine safe file extension and content type
    let cleanExt = 'jpg';
    let contentType = 'image/jpeg';

    const extMatch = uri.match(/\.([a-zA-Z0-9]{3,4})(?:\?|#|$)/);
    if (extMatch) {
      const parsed = extMatch[1].toLowerCase();
      if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'pdf'].includes(parsed)) {
        cleanExt = parsed === 'jpeg' ? 'jpg' : parsed;
        contentType = cleanExt === 'pdf' ? 'application/pdf' : `image/${cleanExt === 'jpg' ? 'jpeg' : cleanExt}`;
      }
    }

    const safeHousehold = (householdId || 'default-household').replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const fileName = `receipt_${uniqueSuffix}.${cleanExt}`;
    const filePath = `${safeHousehold}/${fileName}`;

    let fileData: ArrayBuffer | Blob | null = null;

    // 2. Fetch or read into ArrayBuffer based on environment
    if (Platform.OS === 'web' || uri.startsWith('blob:') || uri.startsWith('data:') || uri.startsWith('http')) {
      const response = await fetch(uri);
      const blob = await response.blob();
      if (blob.type && blob.type.startsWith('image/')) {
        contentType = blob.type;
      }
      fileData = await blob.arrayBuffer();
    } else {
      // Native environment (iOS / Android)
      try {
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: 'base64',
        });
        fileData = decode(base64);
      } catch (fsError) {
        // Fallback for content:// URIs on Android using React Native's fetch
        const response = await fetch(uri);
        const blob = await response.blob();
        if (blob.type && blob.type.startsWith('image/')) {
          contentType = blob.type;
        }
        fileData = await blob.arrayBuffer();
      }
    }

    if (!fileData) {
      throw new Error('Failed to read image binary data');
    }

    // 3. Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(MOBILE_STORAGE_BUCKET)
      .upload(filePath, fileData, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error(`[Supabase Storage] Error uploading to '${MOBILE_STORAGE_BUCKET}':`, uploadError.message);
      return {
        url: null,
        path: null,
        error: uploadError.message,
        isLocalFallback: false,
      };
    }

    // 4. Retrieve permanent public URL
    const { data: publicData } = supabase.storage
      .from(MOBILE_STORAGE_BUCKET)
      .getPublicUrl(filePath);

    if (!publicData?.publicUrl) {
      throw new Error('Supabase Storage did not return a valid public URL');
    }

    return {
      url: publicData.publicUrl,
      path: filePath,
      error: null,
      isLocalFallback: false,
    };
  } catch (err: any) {
    console.error('[uploadReceiptImage] Unexpected error:', err);
    return {
      url: null,
      path: null,
      error: err?.message || 'Failed to process receipt image',
      isLocalFallback: false,
    };
  }
}
