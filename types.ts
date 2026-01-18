
export enum UserRole {
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR'
}

export type User = {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
};

export enum PublisherStatus {
  Joined = 'Joined',
  Left = 'Left',
  REJECTED = 'Rejected',
  PARTNERSHIP_ENDED = 'Partnership Ended'
}

export enum OutreachStatus {
  COLD = 'cold',
  WORKING = 'working',
  REPLIED = 'replied',
  PAUSED = 'paused',
  NOT_FIT = 'not_fit'
}

export enum PriorityTier {
  A = 'A',
  B = 'B',
  C = 'C'
}

export interface PerformancePoint {
  date: string;
  clicks: number;
  conversions: number;
  sales: number;
  commission: number;
}

export interface MediaKitDocument {
  id: string;
  name: string;
  size: string;
  type: string;
  upload_date: string;
  url: string;
}

export interface Publisher {
  id: string;
  company: string;
  contact_person: string;
  website: string;
  type: string;
  join_date: string;
  state: string;
  country: string;
  status: PublisherStatus;
  email_encrypted?: string;
  priority_tier: PriorityTier;
  outreach_status: OutreachStatus;
  last_contacted_at: string | null;
  vertical_fit: string[];
  traffic_estimate: string;
  bio: string;
  avatar_url: string;
  promo_methods: string[];
  categories: string[];
  promoted_countries: string[];
  performance: PerformancePoint[];
  media_kits?: MediaKitDocument[];
}

export interface Thread {
  id: string;
  publisher_id: string;
  thread_token: string;
  status: 'open' | 'waiting_reply' | 'closed' | 'suppressed';
  last_message_at: string;
  subject: string;
}

export interface Message {
  id: string;
  thread_id: string;
  direction: 'inbound' | 'outbound';
  subject: string;
  body_text: string;
  created_by_user_id?: string;
  sent_at: string;
}

export interface Template {
  id: string;
  name: string;
  prompt_system: string;
  prompt_user: string;
}

export interface SendingProfile {
  id: string;
  domain: string;
  provider: 'Mailgun' | 'SendGrid' | 'Postmark';
  status: 'active' | 'warmup' | 'paused';
  current_daily_limit: number;
  max_target_limit: number;
  sent_today: number;
  warmup_start_date: string;
  warmup_duration_days: number;
  reputation_score: number;
}

export interface WarmupSchedule {
  id: string;
  name: string;
  steps: { day: number; limit: number }[];
}
