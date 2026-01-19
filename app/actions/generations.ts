'use server';

import { createClient } from '@/lib/supabase/server';
import type { Generation, GenerationHistoryItem } from '@/lib/database.types';

/**
 * Create a new generation record and deduct credits
 */
export async function createGeneration(
  prompt: string,
  aspectRatio: string = '9:16',
  imageSize: string = '2K',
  creditsRequired: number = 1
): Promise<{ success: boolean; generationId?: string; error?: string }> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Check credits balance
  const { data: credits } = await supabase
    .from('credits')
    .select('balance')
    .eq('user_id', user.id)
    .single();

  if (!credits || credits.balance < creditsRequired) {
    return { success: false, error: 'Insufficient credits' };
  }

  // Create generation record
  const { data: generation, error: genError } = await supabase
    .from('generations')
    .insert({
      user_id: user.id,
      prompt: prompt,
      aspect_ratio: aspectRatio,
      image_size: imageSize,
      status: 'pending',
      credits_used: creditsRequired
    })
    .select('id')
    .single();

  if (genError || !generation) {
    console.error('Error creating generation:', genError);
    return { success: false, error: 'Failed to create generation record' };
  }

  // Deduct credits using the database function
  const { data: deducted, error: deductError } = await supabase
    .rpc('deduct_credits', {
      p_user_id: user.id,
      p_amount: creditsRequired,
      p_generation_id: generation.id
    });

  if (deductError || !deducted) {
    // Rollback - delete the generation record
    await supabase
      .from('generations')
      .delete()
      .eq('id', generation.id);

    console.error('Error deducting credits:', deductError);
    return { success: false, error: 'Failed to deduct credits' };
  }

  return { success: true, generationId: generation.id };
}

/**
 * Update generation with result
 * @param generationId - The generation record ID
 * @param imageData - Either a storage URL or base64 data
 * @param textResponse - Optional AI text response
 * @param isStorageUrl - If true, imageData is a storage URL; if false, it's base64
 */
export async function updateGenerationResult(
  generationId: string,
  imageData: string,
  textResponse?: string,
  isStorageUrl: boolean = false
): Promise<boolean> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const updateData: Record<string, unknown> = {
    status: 'completed',
    metadata: textResponse ? { text_response: textResponse } : {},
    completed_at: new Date().toISOString()
  };

  // Store in appropriate field based on type
  if (isStorageUrl) {
    updateData.image_url = imageData;
    updateData.image_data = null; // Clear base64 if using URL
  } else {
    updateData.image_data = imageData;
  }

  const { error } = await supabase
    .from('generations')
    .update(updateData)
    .eq('id', generationId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error updating generation:', error);
    return false;
  }

  return true;
}

/**
 * Mark generation as failed
 */
export async function markGenerationFailed(
  generationId: string,
  errorMessage: string
): Promise<boolean> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // Get the generation to find credits used
  const { data: generation } = await supabase
    .from('generations')
    .select('credits_used')
    .eq('id', generationId)
    .eq('user_id', user.id)
    .single();

  // Update generation status
  const { error } = await supabase
    .from('generations')
    .update({
      status: 'failed',
      error_message: errorMessage,
      completed_at: new Date().toISOString()
    })
    .eq('id', generationId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error marking generation failed:', error);
    return false;
  }

  // Refund credits
  if (generation?.credits_used) {
    const { data: credits } = await supabase
      .from('credits')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    const newBalance = (credits?.balance || 0) + generation.credits_used;

    await supabase
      .from('credits')
      .update({ balance: newBalance })
      .eq('user_id', user.id);

    // Record refund transaction
    await supabase
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        amount: generation.credits_used,
        type: 'refund',
        balance_after: newBalance,
        reference_id: generationId,
        reference_type: 'generation',
        description: 'Refund for failed generation'
      });
  }

  return true;
}

/**
 * Get user's generation history
 */
export async function getGenerationHistory(
  limit: number = 20
): Promise<GenerationHistoryItem[]> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('generations')
    .select('id, prompt, image_url, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching history:', error);
    return [];
  }

  return data || [];
}

/**
 * Get a specific generation by ID
 */
export async function getGeneration(
  generationId: string
): Promise<Generation | null> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('generations')
    .select('*')
    .eq('id', generationId)
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Error fetching generation:', error);
    return null;
  }

  return data;
}

/**
 * Delete a generation
 */
export async function deleteGeneration(generationId: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('generations')
    .delete()
    .eq('id', generationId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting generation:', error);
    return false;
  }

  return true;
}
