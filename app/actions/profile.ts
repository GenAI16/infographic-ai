'use server';

import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/database.types';

const SIGNUP_BONUS_CREDITS = 100;

/**
 * Ensures that a profile exists for the current user.
 * If the profile doesn't exist (e.g., for users who signed up before the trigger was created),
 * this function will create the profile and give them 100 free credits.
 */
export async function ensureUserProfile(): Promise<{
  success: boolean;
  profile?: Profile;
  isNewProfile?: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { 
      success: false, 
      error: 'Not authenticated' 
    };
  }

  // Check if profile already exists
  const { data: existingProfile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Profile exists, return it
  if (existingProfile && !profileError) {
    // Also ensure credits record exists
    await ensureCreditsRecord(user.id);
    
    return { 
      success: true, 
      profile: existingProfile,
      isNewProfile: false
    };
  }

  // Profile doesn't exist, create it
  const { data: newProfile, error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.full_name || '',
      avatar_url: user.user_metadata?.avatar_url || ''
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error creating profile:', insertError);
    return { 
      success: false, 
      error: 'Failed to create profile' 
    };
  }

  // Create credits record with 100 free credits
  const creditsCreated = await createCreditsWithBonus(user.id);
  
  if (!creditsCreated) {
    console.error('Failed to create credits for user:', user.id);
  }

  return { 
    success: true, 
    profile: newProfile,
    isNewProfile: true
  };
}

/**
 * Ensures a credits record exists for the user.
 * If it doesn't exist, creates one with 100 free credits.
 */
async function ensureCreditsRecord(userId: string): Promise<boolean> {
  const supabase = await createClient();
  
  // Check if credits record exists
  const { data: existingCredits } = await supabase
    .from('credits')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (existingCredits) {
    return true; // Credits already exist
  }

  // Create credits record with bonus
  return await createCreditsWithBonus(userId);
}

/**
 * Creates a credits record with the signup bonus (100 credits).
 */
async function createCreditsWithBonus(userId: string): Promise<boolean> {
  const supabase = await createClient();
  
  // Create credits record
  const { error: creditsError } = await supabase
    .from('credits')
    .insert({
      user_id: userId,
      balance: SIGNUP_BONUS_CREDITS,
      lifetime_credits: SIGNUP_BONUS_CREDITS
    });

  if (creditsError) {
    console.error('Error creating credits:', creditsError);
    return false;
  }

  // Record the bonus transaction
  const { error: txError } = await supabase
    .from('credit_transactions')
    .insert({
      user_id: userId,
      amount: SIGNUP_BONUS_CREDITS,
      type: 'bonus',
      balance_after: SIGNUP_BONUS_CREDITS,
      description: 'Welcome bonus - 100 free credits'
    });

  if (txError) {
    console.error('Error recording transaction:', txError);
    // Don't fail if transaction logging fails
  }

  return true;
}

/**
 * Get the current user's profile.
 * This will also ensure the profile exists.
 */
export async function getProfile(): Promise<Profile | null> {
  const result = await ensureUserProfile();
  return result.profile || null;
}

/**
 * Update the current user's profile.
 */
export async function updateProfile(updates: {
  full_name?: string;
  avatar_url?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Ensure profile exists first
  await ensureUserProfile();

  const { error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id);

  if (error) {
    console.error('Error updating profile:', error);
    return { success: false, error: 'Failed to update profile' };
  }

  return { success: true };
}
