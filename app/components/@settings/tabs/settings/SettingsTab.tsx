import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { classNames } from '~/utils/classNames';
import { Switch } from '~/components/ui/Switch';
import type { UserProfile } from '~/components/@settings/core/types';
import { isMac } from '~/utils/os';

// Helper to get modifier key symbols/text
const getModifierSymbol = (modifier: string): string => {
  switch (modifier) {
    case 'meta':
      return isMac ? '⌘' : 'Win';
    case 'alt':
      return isMac ? '⌥' : 'Alt';
    case 'shift':
      return '⇧';
    default:
      return modifier;
  }
};

export default function SettingsTab() {
  const [currentTimezone, setCurrentTimezone] = useState('');
  const [settings, setSettings] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('bolt_user_profile');
    return saved
      ? JSON.parse(saved)
      : {
          notifications: true,
          language: 'en',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
  });

  useEffect(() => {
    setCurrentTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  // Save settings automatically when they change
  useEffect(() => {
    try {
      const existingProfile = JSON.parse(localStorage.getItem('bolt_user_profile') || '{}');
      const updatedProfile = {
        ...existingProfile,
        notifications: settings.notifications,
        language: settings.language,
        timezone: settings.timezone,
      };
      localStorage.setItem('bolt_user_profile', JSON.stringify(updatedProfile));
      // toast.success('Settings updated'); // Toast can be noisy for auto-save
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to update settings');
    }
  }, [settings]);

  return (
    <div className="bg-black p-6 rounded-xl h-full text-gray-200 space-y-6"> {/* Applied new root styles */}
      {/* Language & Notifications Section */}
      <motion.div
        className="space-y-4" // Removed old bg, shadow, padding
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="i-ph:palette-fill w-4 h-4 text-purple-500" />
          <span className="text-sm font-medium text-gray-100">Preferences</span> {/* Text color updated */}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="i-ph:translate-fill w-4 h-4 text-gray-400" />
            <label className="block text-sm text-gray-400">Language</label>
          </div>
          <select
            value={settings.language}
            onChange={(e) => setSettings((prev) => ({ ...prev, language: e.target.value }))}
            className={classNames(
              'w-full px-3 py-2 rounded-lg text-sm',
              'bg-gray-900 border border-gray-700 text-gray-100', // Updated styles
              'focus:outline-none focus:ring-2 focus:ring-purple-500/30',
              'transition-all duration-200',
            )}
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            {/* Add other languages as needed */}
          </select>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="i-ph:bell-fill w-4 h-4 text-gray-400" />
            <label className="block text-sm text-gray-400">Notifications</label>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">
              {settings.notifications ? 'Notifications are enabled' : 'Notifications are disabled'}
            </span>
            <Switch
              checked={settings.notifications}
              onCheckedChange={(checked) => {
                setSettings((prev) => ({ ...prev, notifications: checked }));
                // localStorage update is handled by useEffect on settings change
                // Dispatching storage event can be kept if other parts of app listen to it directly
                window.dispatchEvent( new StorageEvent('storage', { key: 'bolt_user_profile', /* ... */ }) );
                toast.success(`Notifications ${checked ? 'enabled' : 'disabled'}`);
              }}
              className="data-[state=checked]:bg-purple-600" // Adjusted for better contrast on black
            />
          </div>
        </div>
      </motion.div>

      {/* Timezone Section */}
      <motion.div
        className="space-y-4" // Removed old bg, shadow, padding
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="i-ph:clock-fill w-4 h-4 text-purple-500" />
          <span className="text-sm font-medium text-gray-100">Time Settings</span>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="i-ph:globe-fill w-4 h-4 text-gray-400" />
            <label className="block text-sm text-gray-400">Timezone</label>
          </div>
          <select
            value={settings.timezone}
            onChange={(e) => setSettings((prev) => ({ ...prev, timezone: e.target.value }))}
            className={classNames(
              'w-full px-3 py-2 rounded-lg text-sm',
              'bg-gray-900 border border-gray-700 text-gray-100', // Updated styles
              'focus:outline-none focus:ring-2 focus:ring-purple-500/30',
              'transition-all duration-200',
            )}
          >
            <option value={currentTimezone}>{currentTimezone} (Current)</option>
            {/* Add other timezones if needed, or use a library for a full list */}
          </select>
        </div>
      </motion.div>

      {/* Keyboard Shortcuts Section */}
      <motion.div
        className="space-y-4" // Removed old bg, shadow, padding
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="i-ph:keyboard-fill w-4 h-4 text-purple-500" />
          <span className="text-sm font-medium text-gray-100">Keyboard Shortcuts</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-900"> {/* Updated styles */}
            <div className="flex flex-col">
              <span className="text-sm text-gray-100">Toggle Theme</span>
              <span className="text-xs text-gray-400">Switch between light and dark mode</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-300 bg-gray-800 border border-gray-700 rounded shadow-sm">
                {getModifierSymbol('meta')}
              </kbd>
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-300 bg-gray-800 border border-gray-700 rounded shadow-sm">
                {getModifierSymbol('alt')}
              </kbd>
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-300 bg-gray-800 border border-gray-700 rounded shadow-sm">
                {getModifierSymbol('shift')}
              </kbd>
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-300 bg-gray-800 border border-gray-700 rounded shadow-sm">
                D
              </kbd>
            </div>
          </div>
          {/* Add more shortcuts as needed */}
        </div>
      </motion.div>
    </div>
  );
}
