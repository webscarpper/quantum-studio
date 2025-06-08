import type { TabType } from './types';

// Updated to reflect the new 12-card system + 2 new IDs using @iconify format
export const TAB_ICONS: Record<TabType, string> = {
  'api-config': 'ph:code-block-fill',      // User confirmed
  'github-integration': 'mdi:github',            // User specified
  'supabase-connection': 'ph:database-fill',   // Fallback for simple-icons:supabase as it's not installed
  'service-status': 'mdi:api',                 // For "API Status" (using mdi:api)
  'event-logs': 'mdi:file-document-outline', // For "Logs"
  connection: 'mdi:code-braces-box',         // For "Variables"
  profile: 'lucide:user-cog',                // For "Profile Settings"
  settings: 'lucide:settings',                 // User confirmed
  'tab-management': 'lucide:layout-dashboard', // For "Brain Look"
  'cloud-providers': 'mdi:brain',              // For "Neural Bridge"
  'task-manager': 'mdi:cpu-64-bit',            // For "Resource Pulse"
  debug: 'lucide:activity-square',           // For "Diagnostics Hub"
};

export const TAB_LABELS: Record<TabType, string> = {
  'api-config': 'API Configuration',
  'github-integration': 'GitHub Integration',
  'supabase-connection': 'Supabase Connection',
  'service-status': 'API Status',
  'event-logs': 'Logs',
  connection: 'Variables',
  profile: 'Profile Settings',
  settings: 'Settings',
  'tab-management': 'Brain Look',
  'cloud-providers': 'Neural Bridge',
  'task-manager': 'Resource Pulse',
  debug: 'Diagnostics Hub',
};

export const TAB_DESCRIPTIONS: Record<TabType, string> = {
  'api-config': 'Configure AI providers, models, and API keys',
  'github-integration': 'Connect & manage your GitHub repositories',
  'supabase-connection': 'Link & configure your Supabase projects',
  'service-status': 'Monitor cloud LLM and API service status',
  'event-logs': 'View system events and application logs',
  connection: 'Manage environment variables and connections',
  profile: 'Manage your profile and account settings',
  settings: 'Configure application preferences',
  'tab-management': 'Customize the look and feel of your Brain',
  'cloud-providers': 'Bridge to various neural networks & cloud services',
  'task-manager': 'Monitor system resources and active processes',
  debug: 'Access diagnostic tools and system information',
};

// New DEFAULT_TAB_CONFIG with 12 cards in specified order for the new modal
// Assuming all are 'user' window for now as the new modal doesn't differentiate user/dev for tab visibility.
// All are marked visible: true as they are directly in the grid.
export const DEFAULT_TAB_CONFIG: { id: TabType; visible: boolean; window: 'user'; order: number }[] = [
  // Row 1
  { id: 'api-config', visible: true, window: 'user' as const, order: 0 },
  { id: 'github-integration', visible: true, window: 'user' as const, order: 1 },
  { id: 'supabase-connection', visible: true, window: 'user' as const, order: 2 },
  // Row 2
  { id: 'service-status', visible: true, window: 'user' as const, order: 3 },
  { id: 'event-logs', visible: true, window: 'user' as const, order: 4 },
  { id: 'connection', visible: true, window: 'user' as const, order: 5 },
  // Row 3
  { id: 'profile', visible: true, window: 'user' as const, order: 6 },
  { id: 'settings', visible: true, window: 'user' as const, order: 7 },
  { id: 'tab-management', visible: true, window: 'user' as const, order: 8 },
  // Row 4
  { id: 'cloud-providers', visible: true, window: 'user' as const, order: 9 },
  { id: 'task-manager', visible: true, window: 'user' as const, order: 10 },
  { id: 'debug', visible: true, window: 'user' as const, order: 11 },
];
