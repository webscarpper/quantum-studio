import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@nanostores/react';
import { classNames } from '~/utils/classNames';
import { TabTile } from '~/components/@settings/shared/components/TabTile';
import {
  tabConfigurationStore,
  developerModeStore,
  // setDeveloperMode, // Not handled here for now
  resetTabConfiguration,
} from '~/lib/stores/settings';
import { profileStore } from '~/lib/stores/profile';
import type { TabType, TabVisibilityConfig, Profile } from '~/components/@settings/core/types';
import { TAB_LABELS, DEFAULT_TAB_CONFIG, TAB_DESCRIPTIONS } from '~/components/@settings/core/constants'; // Assuming TAB_DESCRIPTIONS is also here
import { useUpdateCheck } from '~/lib/hooks/useUpdateCheck';
import { useFeatures } from '~/lib/hooks/useFeatures';
import { useNotifications } from '~/lib/hooks/useNotifications';
import { useConnectionStatus } from '~/lib/hooks/useConnectionStatus';
import { useDebugStatus } from '~/lib/hooks/useDebugStatus';

// Import all tab components (same as ControlPanel)
import ProfileTab from '~/components/@settings/tabs/profile/ProfileTab';
import SettingsTab from '~/components/@settings/tabs/settings/SettingsTab';
import NotificationsTab from '~/components/@settings/tabs/notifications/NotificationsTab';
import FeaturesTab from '~/components/@settings/tabs/features/FeaturesTab';
import { DataTab } from '~/components/@settings/tabs/data/DataTab';
import DebugTab from '~/components/@settings/tabs/debug/DebugTab';
import { EventLogsTab } from '~/components/@settings/tabs/event-logs/EventLogsTab';
import UpdateTab from '~/components/@settings/tabs/update/UpdateTab';
import ConnectionsTab from '~/components/@settings/tabs/connections/ConnectionsTab';
import CloudProvidersTab from '~/components/@settings/tabs/providers/cloud/CloudProvidersTab';
import ServiceStatusTab from '~/components/@settings/tabs/providers/status/ServiceStatusTab';
import LocalProvidersTab from '~/components/@settings/tabs/providers/local/LocalProvidersTab';
import TaskManagerTab from '~/components/@settings/tabs/task-manager/TaskManagerTab';
import ApiConfigView from '~/components/@settings/tabs/api-config/ApiConfigView';
import { TabManagement } from '~/components/@settings/shared/components/TabManagement';
import GitHubIntegrationTab from '~/components/@settings/tabs/github/GitHubIntegrationTab'; // New
import SupabaseConnectionTab from '~/components/@settings/tabs/supabase/SupabaseConnectionTab'; // New


// Copied from ControlPanel, might need adjustment
const BETA_TABS = new Set<TabType>(['task-manager', 'service-status']); // Updated to reflect new TabTypes

const BetaLabel = () => (
  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-purple-500/10 dark:bg-purple-500/20">
    <span className="text-[10px] font-medium text-purple-600 dark:text-purple-400">BETA</span>
  </div>
);

interface TabWithDevType extends TabVisibilityConfig {
  isExtraDevTab?: boolean;
}

interface ExtendedTabConfig extends TabVisibilityConfig {
  isExtraDevTab?: boolean;
}

interface BaseTabConfig {
  id: TabType;
  visible: boolean;
  window: 'user' | 'developer';
  order: number;
}


export const SettingsGrid: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType | null>(null);
  const [loadingTab, setLoadingTab] = useState<TabType | null>(null);
  const [showTabManagement, setShowTabManagement] = useState(false); // If tab management is a special case

  const tabConfiguration = useStore(tabConfigurationStore);
  const developerMode = useStore(developerModeStore);
  const profile = useStore(profileStore) as Profile;

  // Status hooks (copied from ControlPanel)
  const { hasUpdate, currentVersion, acknowledgeUpdate } = useUpdateCheck();
  const { hasNewFeatures, unviewedFeatures, acknowledgeAllFeatures } = useFeatures();
  const { hasUnreadNotifications, unreadNotifications, markAllAsRead } = useNotifications();
  const { hasConnectionIssues, currentIssue, acknowledgeIssue } = useConnectionStatus();
  const { hasActiveWarnings, activeIssues, acknowledgeAllIssues } = useDebugStatus();
  
  const baseTabConfig = useMemo(() => {
    return new Map(DEFAULT_TAB_CONFIG.map((tab) => [tab.id, tab]));
  }, []);

  const visibleTabs = useMemo(() => {
    if (!tabConfiguration?.userTabs || !Array.isArray(tabConfiguration.userTabs)) {
      console.warn('Invalid tab configuration, resetting to defaults');
      resetTabConfiguration(); // This will load DEFAULT_TAB_CONFIG into userTabs
      // Return DEFAULT_TAB_CONFIG directly for the initial render after reset,
      // as tabConfiguration store might not update immediately for this useMemo.
      return DEFAULT_TAB_CONFIG.map(tab => ({...tab, window: 'user' as const}));
    }

    // The new design implies all 12 cards are always potentially available.
    // Their visibility is controlled by the 'visible' flag in tabConfiguration.userTabs,
    // which will be managed by "Brain Look" (TabManagement).
    // DeveloperMode might influence content *within* tabs, or other features,
    // but not which of the 12 cards are in the grid.
    // Thus, we always filter tabConfiguration.userTabs by tab.visible.
    return tabConfiguration.userTabs
      .filter((tab) => tab.visible) // Only show tabs marked as visible in the store
      .sort((a, b) => a.order - b.order);
  }, [tabConfiguration]); // Removed developerMode, profile from dependencies as they no longer affect grid visibility directly

  const gridLayoutVariants = { /* ... (copied from ControlPanel or simplified) ... */ };
  const itemVariants = { /* ... (copied from ControlPanel or simplified) ... */ };

  const handleBack = () => {
    if (showTabManagement) setShowTabManagement(false);
    else if (activeTab) setActiveTab(null);
  };

  const getTabComponent = (tabId: TabType | 'tab-management') => {
    if (tabId === 'tab-management') return <TabManagement />;
    switch (tabId) {
      case 'api-config': return <ApiConfigView />;
      case 'profile': return <ProfileTab />;
      case 'settings': return <SettingsTab />;
      // case 'notifications': return <NotificationsTab />; // Removed
      // case 'features': return <FeaturesTab />; // Removed
      // case 'data': return <DataTab />; // Removed
      case 'cloud-providers': return <CloudProvidersTab />;
      // case 'local-providers': return <LocalProvidersTab />; // Removed
      case 'connection': return <ConnectionsTab />;
      case 'debug': return <DebugTab />;
      case 'event-logs': return <EventLogsTab />;
      // case 'update': return <UpdateTab />; // Removed
      case 'task-manager': return <TaskManagerTab />;
      case 'service-status': return <ServiceStatusTab />;
      // New Tabs - use imported components
      case 'github-integration': return <GitHubIntegrationTab />;
      case 'supabase-connection': return <SupabaseConnectionTab />;
      default: return null;
    }
  };
  
  const getTabUpdateStatus = (tabId: TabType): boolean => { /* ... (copied from ControlPanel) ... */ 
    switch (tabId) {
      // case 'update': return hasUpdate; // Removed
      // case 'features': return hasNewFeatures; // Removed
      // case 'notifications': return hasUnreadNotifications; // Removed
      case 'connection': return hasConnectionIssues;
      case 'debug': return hasActiveWarnings;
      default: return false;
    }
  };
  const getStatusMessage = (tabId: TabType): string => { /* ... (copied from ControlPanel) ... */ 
    switch (tabId) {
      // case 'update': return `New update available (v${currentVersion})`; // Removed
      // case 'features': return `${unviewedFeatures.length} new feature${unviewedFeatures.length === 1 ? '' : 's'} to explore`; // Removed
      // case 'notifications': return `${unreadNotifications.length} unread notification${unreadNotifications.length === 1 ? '' : 's'}`; // Removed
      case 'connection': return currentIssue === 'disconnected' ? 'Connection lost' : currentIssue === 'high-latency' ? 'High latency detected' : 'Connection issues detected';
      case 'debug': {
        const warnings = activeIssues.filter((i) => i.type === 'warning').length;
        const errors = activeIssues.filter((i) => i.type === 'error').length;
        return `${warnings} warning${warnings === 1 ? '' : 's'}, ${errors} error${errors === 1 ? '' : 's'}`;
      }
      default: return '';
    }
  };

  const handleTabClick = (tabId: TabType) => {
    setLoadingTab(tabId);
    setActiveTab(tabId);
    setShowTabManagement(false);
    switch (tabId) { /* ... (acknowledgement logic from ControlPanel) ... */ 
      // case 'update': acknowledgeUpdate(); break; // Removed
      // case 'features': acknowledgeAllFeatures(); break; // Removed
      // case 'notifications': markAllAsRead(); break; // Removed
      case 'connection': acknowledgeIssue(); break;
      case 'debug': acknowledgeAllIssues(); break;
    }
    setTimeout(() => setLoadingTab(null), 500);
  };

  return (
    <div className="h-full flex flex-col">
      {(activeTab || showTabManagement) && (
        <div className="p-0 mb-4"> {/* Adjusted padding for back button container */}
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-sm text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary"
          >
            <span className="i-ph:arrow-left w-4 h-4" />
            Back to Control Hub
          </button>
        </div>
      )}
      <motion.div
        key={activeTab || 'home_settings_grid'} // Changed key to avoid conflict if used elsewhere
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="flex-1 overflow-y-auto modern-scrollbar" // Ensure this part scrolls if content overflows
      >
        {showTabManagement ? (
          <TabManagement />
        ) : activeTab ? (
          getTabComponent(activeTab) // Remove wrapper, styling will be in individual tab components
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" // Max 3 columns, increased gap to 6
            // variants={gridLayoutVariants} // Simplified, can add back if needed
            initial="hidden"
            animate="visible"
          >
            {(visibleTabs as TabWithDevType[]).map((tab: TabWithDevType) => (
              <motion.div key={tab.id} /* variants={itemVariants} */ className="aspect-[1.7/1]"> {/* Adjusted aspect ratio for "slightly smaller" cards */}
                <TabTile
                  tab={tab}
                  onClick={() => handleTabClick(tab.id as TabType)}
                  isActive={activeTab === tab.id} // This might always be false if activeTab shows component directly
                  hasUpdate={getTabUpdateStatus(tab.id)}
                  statusMessage={getStatusMessage(tab.id)}
                  description={TAB_DESCRIPTIONS[tab.id as TabType]} // Ensure TAB_DESCRIPTIONS is complete
                  isLoading={loadingTab === tab.id}
                  className="h-full relative"
                >
                  {BETA_TABS.has(tab.id) && <BetaLabel />}
                </TabTile>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default SettingsGrid;
