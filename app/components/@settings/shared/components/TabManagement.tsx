import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@nanostores/react';
import { Switch } from '~/components/ui/Switch';
import { Icon } from '@iconify/react'; // Import Icon component
import { classNames } from '~/utils/classNames';
import { tabConfigurationStore, updateTabConfiguration } from '~/lib/stores/settings';
import { TAB_LABELS, TAB_ICONS, DEFAULT_TAB_CONFIG } from '~/components/@settings/core/constants';
import type { TabType, TabVisibilityConfig } from '~/components/@settings/core/types';
import { toast } from 'react-toastify';
import { TbLayoutGrid } from 'react-icons/tb'; // Icon for the header of this section

// BETA_TABS can be imported from constants.ts if needed for this view, or defined locally if specific to TabManagement
// For now, let's assume no BETA labels are shown in this specific management UI for simplicity.
// const BETA_TABS = new Set<TabType>(['task-manager', 'service-status']);
// const BetaLabel = () => (
//   <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-purple-500/10 text-purple-500 font-medium">BETA</span>
// );

export const TabManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const currentTabConfig = useStore(tabConfigurationStore);

  const handleTabVisibilityChange = (tabId: TabType, checked: boolean) => {
    const tabToUpdate = currentTabConfig.userTabs.find((tab) => tab.id === tabId);

    if (tabToUpdate) {
      // Create a new object for the updated tab to ensure store reactivity
      const updatedTab = { ...tabToUpdate, visible: checked };
      updateTabConfiguration(updatedTab); // This function should handle updating the store and persisting
      toast.success(`"${TAB_LABELS[tabId]}" visibility ${checked ? 'enabled' : 'disabled'}`);
    } else {
      // This case should ideally not happen if userTabs is always populated with all 12 from DEFAULT_TAB_CONFIG
      // and DEFAULT_TAB_CONFIG itself is the source of truth for tab IDs.
      console.error(`Tab with id ${tabId} not found in current configuration. This might indicate an issue with store initialization or DEFAULT_TAB_CONFIG.`);
      // Attempt to add it if it's in DEFAULT_TAB_CONFIG but missing from store (should not happen with proper init)
      const defaultTabInfo = DEFAULT_TAB_CONFIG.find(dt => dt.id === tabId);
      if (defaultTabInfo) {
        updateTabConfiguration({ ...defaultTabInfo, visible: checked, window: 'user' });
        toast.success(`"${TAB_LABELS[tabId]}" visibility ${checked ? 'enabled' : 'disabled'} (added)`);
      } else {
        toast.error('Error updating tab visibility: Tab definition missing.');
      }
    }
  };

  // Get all 12 system cards from DEFAULT_TAB_CONFIG.
  // Their visibility state comes from the tabConfigurationStore.userTabs.
  const allSystemTabs = useMemo(() => {
    return DEFAULT_TAB_CONFIG.map(defaultTab => {
      const storedTab = currentTabConfig.userTabs.find(t => t.id === defaultTab.id);
      return {
        ...defaultTab, // Includes id, default visibility (true), order, window ('user')
        label: TAB_LABELS[defaultTab.id],
        icon: TAB_ICONS[defaultTab.id],
        // Crucially, take the 'visible' state from the store if available, otherwise default
        visible: storedTab ? storedTab.visible : defaultTab.visible, 
      };
    }).sort((a, b) => a.order - b.order); // Ensure sorted by predefined order
  }, [currentTabConfig.userTabs]);

  const filteredTabs = useMemo(() => {
    if (!searchQuery.trim()) {
      return allSystemTabs;
    }
    return allSystemTabs.filter((tab) =>
      tab.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allSystemTabs, searchQuery]);

  return (
    <div className="bg-black p-6 rounded-xl h-full text-gray-200 space-y-6"> {/* Applied new root styles */}
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mt-0 mb-6"> {/* Adjusted margins */}
          <div className="flex items-center gap-3"> {/* Increased gap */}
            <div
              className={classNames(
                'w-10 h-10 flex items-center justify-center rounded-lg', // Slightly larger icon container
                'bg-bolt-elements-background-depth-3',
                'text-bolt-accent-primary', // Use accent color for icon
              )}
            >
              <TbLayoutGrid className="w-6 h-6" /> {/* Larger icon */}
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-100">Brain Look</h4> {/* Text color updated */}
              <p className="text-sm text-gray-400">Configure visible cards in the Quantum Neuronal Settings.</p> {/* Text color updated */}
            </div>
          </div>

          {/* Search */}
          <div className="relative w-72"> 
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"> 
              <div className="i-ph:magnifying-glass w-4 h-4 text-gray-500" /> {/* Icon color updated */}
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cards..."
              className={classNames(
                'w-full pl-10 pr-4 py-2 rounded-lg',
                'bg-gray-900', // Darker input bg
                'border border-gray-700', // Darker border
                'text-gray-100', // Lighter text
                'placeholder-gray-500', // Placeholder color
                'focus:outline-none focus:ring-2 focus:ring-bolt-accent-primary/50', 
                'transition-all duration-200',
              )}
            />
          </div>
        </div>

        {/* Tab Grid - List of all 12 cards with checkboxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTabs.map((tab, index) => (
            <motion.div
              key={tab.id}
              className={classNames(
                'rounded-lg border border-gray-700 bg-gray-900', // Adjusted item bg and border
                'hover:bg-gray-800', // Adjusted item hover bg
                'transition-all duration-200',
                'relative overflow-hidden group p-4', 
              )}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }} // Faster stagger
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={classNames(
                      'w-8 h-8 flex items-center justify-center rounded-lg', // Icon container
                      'bg-bolt-elements-background-depth-3', 
                      // Icon color will be handled by Icon component's className or default
                    )}
                  >
                    <Icon 
                      icon={tab.icon} 
                      className={classNames(
                        'w-5 h-5',
                        tab.visible ? 'text-bolt-accent-primary' : 'text-bolt-elements-textSecondary'
                      )} 
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-100"> {/* Text color updated */}
                      {tab.label}
                    </h4>
                    {/* Optional: Add description if needed, or remove this p tag */}
                    {/* <p className="text-xs text-bolt-elements-textSecondary mt-0.5">
                      Toggle visibility
                    </p> */}
                  </div>
                </div>
                <Switch
                  checked={tab.visible}
                  onCheckedChange={(checked) => {
                    handleTabVisibilityChange(tab.id, checked);
                  }}
                  className="data-[state=checked]:bg-bolt-accent-primary" // Use accent color for checked state
                />
              </div>
            </motion.div>
          ))}
          {filteredTabs.length === 0 && (
             <p className="col-span-full text-center text-gray-400 py-4">No cards match your search.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
};
