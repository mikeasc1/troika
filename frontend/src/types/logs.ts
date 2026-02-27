export interface VerificationLog {
  id: number;
  campaign: string;
  participant: string;
  was_following: boolean;
  checked_at: string;
}

export interface DeliveryLog {
  id: number;
  campaign: string;
  participant: string;
  phase: number;
  success: boolean;
  amount: number;
  reward_type: string;
  recipient: string;
  error_message?: string;
  transaction_ref?: string;
  curr_attempt: number;
  created_at: string;
}
