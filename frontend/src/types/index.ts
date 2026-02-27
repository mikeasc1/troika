/**
 * Shared TypeScript types matching backend Pydantic schemas.
 * Keep in sync with backend/app/schemas/
 */

// ============= Auth Types =============

export interface UserCreate {
  email: string;
  password: string;
  full_name?: string | null;
  twitter_username?: string | null;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface UserResponse {
  id: number;
  email: string;
  full_name: string | null;
  twitter_username: string | null;
}

// ============= Campaign Types =============

export interface CampaignCreate {
  name: string;
  slug: string;
  twitter_account_to_follow: string;
  start_date?: string | null;
  end_date?: string | null;
  
  // Airtime Reward Configuration
  reward_amount?: number | null;  // Amount per participant (Standard)
  currency?: string;  // "NGN"

  // Prize Pool (Spinner campaigns)
  prize_pool_amount?: number;

  // Distribution Strategy
  distribution_strategy?: string; // "INSTANT" | "SCHEDULED" | "SPLIT"
  distribution_split_immediate_percentage?: number; // 0-100
  distribution_delay_min_minutes?: number | null;  // e.g., 1440 for 24h
  distribution_delay_max_minutes?: number | null;  // e.g., 2880 for 48h
  distribution_winners_count?: number;
  
  // Type
  type?: string; // "STANDARD" | "SPINNER"
}

export interface CampaignResponse {
  id: number;
  slug: string;
  name: string;
  twitter_account_to_follow: string;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  
  // Airtime Reward Configuration
  reward_amount?: number | null;
  currency: string;

  // Prize Pool (Spinner)
  prize_pool_amount: number;

  // Distribution
  distribution_strategy: string;
  distribution_split_immediate_percentage: number;
  distribution_delay_min_minutes?: number | null;
  distribution_delay_max_minutes?: number | null;
  distribution_winners_count: number;
  type: string;

  created_at: string;
}

// ============= Participant Types =============

export interface ParticipantJoin {
  twitter_username: string;
  phone_number: string;
  referrer_twitter?: string | null;
}

export interface ParticipantResponse {
  id: number;
  twitter_username: string;
  is_verified_follower: boolean;
  referral_count: number;
  created_at: string;
}

export interface JoinStatusResponse {
  is_following: boolean;
  twitter_account_to_follow: string;
  message: string;
}

// ============= Public Campaign Info =============

export interface CampaignPublicInfo {
  name: string;
  twitter_account_to_follow: string;
  slug: string;
}

// ============= Settings / Credentials Types =============

export interface CredentialInfo {
  id: number;
  label: string | null;
  is_active: boolean;
  masked_value: string;
}

export interface CredentialsResponse {
  apify: CredentialInfo[];
  vtu: CredentialInfo[];
}

export interface ApifySave {
  api_key: string;
  label?: string;
}

export interface VTUSave {
  username: string;
  password: string;
  label?: string;
}

// ============= API Error =============

export interface APIError {
  detail: string;
}
