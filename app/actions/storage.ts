'use server';

import { createClient } from '@/lib/supabase/server';

const BUCKET_NAME = 'infographics';

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

/**
 * Upload a base64 image to Supabase Storage
 */
export async function uploadInfographic(
  base64Data: string,
  userId: string,
  generationId: string,
  mimeType: string = 'image/png'
): Promise<UploadResult> {
  const supabase = await createClient();

  try {
    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Determine file extension from mime type
    const extension = mimeType.split('/')[1] || 'png';
    
    // Create unique file path: user_id/generation_id.extension
    const filePath = `${userId}/${generationId}.${extension}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true, // Overwrite if exists
      });

    if (error) {
      console.error('Storage upload error:', error);
      return {
        success: false,
        error: `Failed to upload: ${error.message}`,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error',
    };
  }
}

/**
 * Delete an infographic from storage
 */
export async function deleteInfographic(
  userId: string,
  generationId: string
): Promise<boolean> {
  const supabase = await createClient();

  // Find the file (we don't know the extension)
  const { data: files } = await supabase.storage
    .from(BUCKET_NAME)
    .list(userId, {
      search: generationId,
    });

  if (!files || files.length === 0) {
    return true; // File doesn't exist, consider it deleted
  }

  // Delete all matching files
  const filesToDelete = files.map((file) => `${userId}/${file.name}`);
  
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove(filesToDelete);

  if (error) {
    console.error('Storage delete error:', error);
    return false;
  }

  return true;
}

/**
 * Get a signed URL for private access (if bucket is private)
 */
export async function getSignedUrl(
  filePath: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    console.error('Signed URL error:', error);
    return null;
  }

  return data.signedUrl;
}
