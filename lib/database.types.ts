/**
 * Database types for the Infographic AI application
 * These types match the Supabase database schema
 */

// Enums
export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentProvider = 'stripe' | 'paypal' | 'razorpay' | 'manual';
export type TransactionType = 'purchase' | 'usage' | 'bonus' | 'refund' | 'adjustment';

// =====================================================
// TABLE TYPES
// =====================================================

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Credits {
  id: string;
  user_id: string;
  balance: number;
  lifetime_credits: number;
  created_at: string;
  updated_at: string;
}

export interface Generation {
  id: string;
  user_id: string;
  prompt: string;
  image_url: string | null;
  image_data: string | null;
  aspect_ratio: string;
  image_size: string;
  status: GenerationStatus;
  credits_used: number;
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  completed_at: string | null;
}

export interface Purchase {
  id: string;
  user_id: string;
  credits_purchased: number;
  amount_paid: number;
  currency: string;
  payment_provider: PaymentProvider;
  payment_status: PaymentStatus;
  transaction_id: string | null;
  receipt_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  completed_at: string | null;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: TransactionType;
  balance_after: number;
  reference_id: string | null;
  reference_type: string | null;
  description: string | null;
  created_at: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  description: string | null;
  credits: number;
  price: number;
  currency: string;
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

// =====================================================
// INSERT TYPES (for creating new records)
// =====================================================

export interface ProfileInsert {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
}

export interface GenerationInsert {
  user_id: string;
  prompt: string;
  aspect_ratio?: string;
  image_size?: string;
  status?: GenerationStatus;
  credits_used?: number;
}

export interface GenerationUpdate {
  image_url?: string | null;
  image_data?: string | null;
  status?: GenerationStatus;
  error_message?: string | null;
  metadata?: Record<string, unknown>;
  completed_at?: string | null;
}

export interface PurchaseInsert {
  user_id: string;
  credits_purchased: number;
  amount_paid: number;
  currency?: string;
  payment_provider: PaymentProvider;
  payment_status?: PaymentStatus;
  transaction_id?: string | null;
  metadata?: Record<string, unknown>;
}

// =====================================================
// VIEW TYPES (for UI display)
// =====================================================

export interface UserWithCredits extends Profile {
  credits: Credits;
}

export interface GenerationWithUser extends Generation {
  user: Profile;
}

export interface PurchaseWithPackage extends Purchase {
  package_name?: string;
}

// =====================================================
// API RESPONSE TYPES
// =====================================================

export interface CreditsResponse {
  balance: number;
  lifetime_credits: number;
}

export interface GenerationHistoryItem {
  id: string;
  prompt: string;
  image_url: string | null;
  status: GenerationStatus;
  created_at: string;
}

export interface TransactionHistoryItem {
  id: string;
  amount: number;
  type: TransactionType;
  description: string | null;
  created_at: string;
}

export interface PurchaseHistoryItem {
  id: string;
  credits_purchased: number;
  amount_paid: number;
  currency: string;
  payment_status: PaymentStatus;
  created_at: string;
}

// =====================================================
// DATABASE TYPE (for Supabase client)
// =====================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: Partial<ProfileInsert>;
      };
      credits: {
        Row: Credits;
        Insert: Omit<Credits, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Credits, 'id' | 'user_id' | 'created_at'>>;
      };
      generations: {
        Row: Generation;
        Insert: GenerationInsert;
        Update: GenerationUpdate;
      };
      purchases: {
        Row: Purchase;
        Insert: PurchaseInsert;
        Update: Partial<PurchaseInsert>;
      };
      credit_transactions: {
        Row: CreditTransaction;
        Insert: Omit<CreditTransaction, 'id' | 'created_at'>;
        Update: never; // Transactions are immutable
      };
      credit_packages: {
        Row: CreditPackage;
        Insert: Omit<CreditPackage, 'id' | 'created_at'>;
        Update: Partial<Omit<CreditPackage, 'id' | 'created_at'>>;
      };
    };
    Functions: {
      deduct_credits: {
        Args: { p_user_id: string; p_amount: number; p_generation_id: string };
        Returns: boolean;
      };
      add_credits_from_purchase: {
        Args: { p_user_id: string; p_amount: number; p_purchase_id: string };
        Returns: number;
      };
    };
  };
}
