export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  subscriptionTier: SubscriptionTier;
  createdAt: number;
}

export interface InstagramAccount {
  id: string;
  userId: string;
  instagramId: string;
  username: string;
  accessToken: string;
  isConnected: boolean;
  updatedAt: number;
}

export type TriggerType = 'COMMENT' | 'FOLLOW' | 'STORY_REPLY';

export interface Automation {
  id: string;
  userId: string;
  instagramId: string;
  name: string;
  trigger: TriggerType;
  keywords: string[];
  message: string;
  isActive: boolean;
  createdAt: number;
}

export interface AutomationAnalytics {
  automationId: string;
  sentCount: number;
  openCount: number;
  clickCount: number;
  lastRun: number;
}
