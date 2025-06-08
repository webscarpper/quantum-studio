import type { ReactNode } from 'react';

export type SettingCategory = 'profile' | 'file_sharing' | 'connectivity' | 'system' | 'services' | 'preferences';

export type TabType =
  | 'api-config'
  | 'github-integration' // New
  | 'supabase-connection' // New
  | 'service-status' // Renamed to API Status
  | 'event-logs'     // Renamed to Logs
  | 'connection'       // Renamed to Variables
  | 'profile'          // Renamed to Profile Settings
  | 'settings'
  | 'tab-management'   // Renamed to Brain Look
  | 'cloud-providers'  // Renamed to Neural Bridge
  | 'task-manager'     // Renamed to Resource Pulse
  | 'debug';           // Renamed to Diagnostics Hub
  // Removed: 'notifications', 'features', 'data', 'local-providers', 'update'

export type WindowType = 'user' | 'developer';

export interface UserProfile {
  nickname: any;
  name: string;
  email: string;
  avatar?: string;
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  password?: string;
  bio?: string;
  language: string;
  timezone: string;
}

export interface SettingItem {
  id: TabType;
  label: string;
  icon: string;
  category: SettingCategory;
  description?: string;
  component: () => ReactNode;
  badge?: string;
  keywords?: string[];
}

export interface TabVisibilityConfig {
  id: TabType;
  visible: boolean;
  window: WindowType;
  order: number;
  isExtraDevTab?: boolean;
  locked?: boolean;
}

export interface DevTabConfig extends TabVisibilityConfig {
  window: 'developer';
}

export interface UserTabConfig extends TabVisibilityConfig {
  window: 'user';
}

export interface TabWindowConfig {
  userTabs: UserTabConfig[];
  developerTabs: DevTabConfig[];
}

// Removed TAB_LABELS from here, it should be solely in constants.ts to avoid duplication and circular dependencies.

export const categoryLabels: Record<SettingCategory, string> = {
  profile: 'Profile & Account',
  file_sharing: 'File Sharing',
  connectivity: 'Connectivity',
  system: 'System',
  services: 'Services',
  preferences: 'Preferences',
};

export const categoryIcons: Record<SettingCategory, string> = {
  profile: 'i-ph:user-circle',
  file_sharing: 'i-ph:folder-simple',
  connectivity: 'i-ph:wifi-high',
  system: 'i-ph:gear',
  services: 'i-ph:cube',
  preferences: 'i-ph:sliders',
};

export interface Profile {
  username?: string;
  bio?: string;
  avatar?: string;
  preferences?: {
    notifications?: boolean;
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    timezone?: string;
  };
}
