
import { Publisher, PublisherStatus, OutreachStatus, PriorityTier, Thread, Message, Template, SendingProfile, WarmupSchedule, PerformancePoint } from './types';

const generatePerformance = (): PerformancePoint[] => {
  const points: PerformancePoint[] = [];
  for (let i = 0; i < 30; i++) {
    points.push({
      date: `2024-05-${String(i + 1).padStart(2, '0')}`,
      clicks: Math.floor(Math.random() * 200) + 50,
      conversions: Math.floor(Math.random() * 20) + 2,
      sales: Math.floor(Math.random() * 2000) + 500,
      commission: Math.floor(Math.random() * 200) + 50
    });
  }
  return points;
};

export const mockPublishers: Publisher[] = [
  {
    id: 'p1',
    company: 'Affilink',
    contact_person: 'Sam Jenkins',
    website: 'affilink.co.uk',
    type: 'Content',
    join_date: '2023-11-12',
    state: 'CA',
    country: 'USA',
    status: PublisherStatus.Joined,
    email_encrypted: 'sam@affilink.co.uk',
    priority_tier: PriorityTier.A,
    outreach_status: OutreachStatus.WORKING,
    last_contacted_at: '2024-05-20T14:30:00Z',
    vertical_fit: ['Tech', 'SaaS', 'Finance'],
    traffic_estimate: '2.5M/mo',
    bio: "Hey there, I'm Sam from Affilink. We're an affiliate marketing agency currently promoting products, brands and software across the US & UK.",
    avatar_url: 'https://i.pravatar.cc/150?u=p1',
    promo_methods: ['Media buyer', 'Content creator'],
    categories: ['Office Products', 'Automotive', 'Tools & Home Improvement', 'Toys & Games', 'Pet Supplies', 'Industrial & Scientific'],
    promoted_countries: ['US', 'UK', 'CA'],
    performance: generatePerformance(),
    media_kits: [
      {
        id: 'doc1',
        name: 'Affilink_Q1_Performance.pdf',
        size: '2.4 MB',
        type: 'application/pdf',
        upload_date: '2024-02-15',
        url: '#'
      }
    ]
  },
  {
    id: 'p2',
    company: 'Cache Media Limited',
    contact_person: 'Sarah Thompson',
    website: 'cachemedia.net',
    type: 'Coupon',
    join_date: '2024-01-05',
    state: 'London',
    country: 'UK',
    status: PublisherStatus.Joined,
    email_encrypted: 'partnerships@affglobal.net',
    priority_tier: PriorityTier.B,
    outreach_status: OutreachStatus.REPLIED,
    last_contacted_at: '2024-05-22T09:15:00Z',
    vertical_fit: ['E-commerce', 'Lifestyle'],
    traffic_estimate: '800K/mo',
    bio: "Consumer Tested Reviews & Best Budget is a hub for people to make smart choices in their online purchases. Thousands of readers visit us every day.",
    avatar_url: 'https://i.pravatar.cc/150?u=p2',
    promo_methods: ['Media buyer'],
    categories: ['Patio, Lawn & Garden', 'Toys & Games', 'Health & Personal Care', 'Appliances'],
    promoted_countries: ['US', 'UK'],
    performance: generatePerformance(),
    media_kits: []
  }
];

export const mockThreads: Thread[] = [
  {
    id: 't1',
    publisher_id: 'p1',
    thread_token: 'abc123xyz',
    status: 'waiting_reply',
    last_message_at: '2024-05-20T14:30:00Z',
    subject: 'Question about your affiliate program rates'
  },
  {
    id: 't2',
    publisher_id: 'p2',
    thread_token: 'pqr456uvw',
    status: 'open',
    last_message_at: '2024-05-22T09:15:00Z',
    subject: 'New partnership proposal - Xark'
  }
];

export const mockMessages: Message[] = [
  {
    id: 'm1',
    thread_id: 't1',
    direction: 'outbound',
    subject: 'Question about your affiliate program rates',
    body_text: 'Hi TechInsider team, we are interested in expanding our partnership. What are your current CPAs for tech verticals?',
    created_by_user_id: 'user1',
    sent_at: '2024-05-20T14:00:00Z'
  },
  {
    id: 'm2',
    thread_id: 't1',
    direction: 'inbound',
    subject: 'Re: Question about your affiliate program rates',
    body_text: 'Hello! Thanks for reaching out. Our standard CPA is $50, but for high-volume partners like Xark, we can discuss $65.',
    sent_at: '2024-05-20T14:30:00Z'
  },
  {
    id: 'm3',
    thread_id: 't2',
    direction: 'outbound',
    subject: 'New partnership proposal - Xark',
    body_text: 'Hey SavingsGuru, we have a new campaign launching next month and your audience fits perfectly.',
    created_by_user_id: 'user1',
    sent_at: '2024-05-22T09:15:00Z'
  }
];

export const mockTemplates: Template[] = [
  {
    id: 'tmp1',
    name: 'First time outreach',
    prompt_system: 'You are an outreach specialist at Xark. Your tone is professional and enthusiastic.',
    prompt_user: 'Write a warm introductory email to {{company}} proposing a new affiliate partnership. Mention we love their website {{website}}.'
  },
  {
    id: 'tmp2',
    name: 'Move forward',
    prompt_system: 'You are an outreach specialist. The tone is decisive and encouraging.',
    prompt_user: 'The publisher {{company}} has shown interest. Write an email to move forward with the partnership integration steps.'
  },
  {
    id: 'tmp3',
    name: 'Schedule meeting',
    prompt_system: 'You are an outreach specialist. Professional and efficient tone.',
    prompt_user: 'Ask {{company}} for their availability next week to discuss deeper strategic alignment.'
  },
  {
    id: 'tmp4',
    name: 'Next month media plan discussion',
    prompt_system: 'Strategic and collaborative tone.',
    prompt_user: 'Reach out to {{company}} to start planning the media placements and promotional calendar for next month.'
  }
];

export const mockSendingProfiles: SendingProfile[] = [
  {
    id: 'sp1',
    domain: 'xark.io',
    provider: 'Postmark',
    status: 'active',
    current_daily_limit: 5000,
    max_target_limit: 5000,
    sent_today: 1240,
    warmup_start_date: '2023-10-01',
    warmup_duration_days: 30,
    reputation_score: 98
  },
  {
    id: 'sp2',
    domain: 'outreach.xark.net',
    provider: 'Mailgun',
    status: 'warmup',
    current_daily_limit: 50,
    max_target_limit: 1000,
    sent_today: 42,
    warmup_start_date: '2024-05-15',
    warmup_duration_days: 14,
    reputation_score: 85
  }
];

export const mockWarmupSchedules: WarmupSchedule[] = [
  {
    id: 'ws1',
    name: 'Conservative Growth',
    steps: [
      { day: 1, limit: 10 },
      { day: 2, limit: 25 },
      { day: 3, limit: 50 },
      { day: 4, limit: 75 },
      { day: 5, limit: 100 },
      { day: 7, limit: 250 },
      { day: 10, limit: 500 },
      { day: 14, limit: 1000 },
    ]
  },
  {
    id: 'ws2',
    name: 'Aggressive Expansion',
    steps: [
      { day: 1, limit: 50 },
      { day: 3, limit: 200 },
      { day: 5, limit: 500 },
      { day: 7, limit: 1000 },
    ]
  }
];
