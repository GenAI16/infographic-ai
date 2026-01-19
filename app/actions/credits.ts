'use server';

import { createClient } from '@/lib/supabase/server';
import { ensureUserProfile } from './profile';
import type { 
  CreditsResponse, 
  CreditPackage, 
  TransactionHistoryItem,
  PurchaseHistoryItem 
} from '@/lib/database.types';

/**
 * Get the current user's credit balance.
 * This will also ensure the user profile and credits record exist.
 */
export async function getUserCredits(): Promise<CreditsResponse | null> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Ensure profile and credits exist (creates with 100 free credits if new user)
  await ensureUserProfile();

  const { data, error } = await supabase
    .from('credits')
    .select('balance, lifetime_credits')
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Error fetching credits:', error);
    return null;
  }

  return data;
}

/**
 * Check if user has enough credits for a generation
 */
export async function hasEnoughCredits(requiredCredits: number = 1): Promise<boolean> {
  const credits = await getUserCredits();
  return credits !== null && credits.balance >= requiredCredits;
}

/**
 * Get available credit packages
 */
export async function getCreditPackages(): Promise<CreditPackage[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('credit_packages')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching packages:', error);
    return [];
  }

  return data || [];
}

/**
 * Get user's credit transaction history
 */
export async function getCreditTransactions(
  limit: number = 20
): Promise<TransactionHistoryItem[]> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('credit_transactions')
    .select('id, amount, type, description, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }

  return data || [];
}

/**
 * Get user's purchase history
 */
export async function getPurchaseHistory(
  limit: number = 20
): Promise<PurchaseHistoryItem[]> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('purchases')
    .select('id, credits_purchased, amount_paid, currency, payment_status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching purchases:', error);
    return [];
  }

  return data || [];
}

/**
 * Add bonus credits to user (for admin/promo use)
 */
export async function addBonusCredits(
  userId: string,
  amount: number,
  description: string = 'Bonus credits'
): Promise<boolean> {
  const supabase = await createClient();

  // Get current balance first
  const { data: currentCredits, error: fetchError } = await supabase
    .from('credits')
    .select('balance, lifetime_credits')
    .eq('user_id', userId)
    .single();

  if (fetchError || !currentCredits) {
    console.error('Error fetching current credits:', fetchError);
    return false;
  }

  const newBalance = currentCredits.balance + amount;
  const newLifetimeCredits = currentCredits.lifetime_credits + amount;

  // Update balance
  const { error: updateError } = await supabase
    .from('credits')
    .update({ 
      balance: newBalance,
      lifetime_credits: newLifetimeCredits
    })
    .eq('user_id', userId);

  if (updateError) {
    console.error('Error adding bonus credits:', updateError);
    return false;
  }

  // Record transaction
  const { error: txError } = await supabase
    .from('credit_transactions')
    .insert({
      user_id: userId,
      amount: amount,
      type: 'bonus',
      balance_after: newBalance,
      description: description
    });

  if (txError) {
    console.error('Error recording transaction:', txError);
    return false;
  }

  return true;
}
