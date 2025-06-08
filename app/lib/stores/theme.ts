import { atom } from 'nanostores';
// import { logStore } from './logs'; // logStore might not be needed if toggleTheme is removed

// Define the single theme name
export type Theme = 'quantum-dark';

export const kTheme = 'bolt_theme'; // This constant might become obsolete

// This function will always return true for the single dark theme
export function themeIsDark() {
  return true; 
}

export const DEFAULT_THEME: Theme = 'quantum-dark';

// Initialize the store with the fixed theme
export const themeStore = atom<Theme>(DEFAULT_THEME);

// initStore is no longer needed as the theme is fixed
// function initStore() {
//   if (!import.meta.env.SSR) {
//     // Always set to quantum-dark, ignore persisted theme
//     document.querySelector('html')?.setAttribute('data-theme', DEFAULT_THEME);
//     localStorage.setItem(kTheme, DEFAULT_THEME);
//     return DEFAULT_THEME;
//   }
//   return DEFAULT_THEME;
// }

// toggleTheme function is no longer needed as there's only one theme
// export function toggleTheme() {
//   // No operation as theme is fixed
//   // console.warn("Theme is fixed, toggleTheme has no effect.");
// }

// Ensure html attribute is set on client side if not already by entry.server.tsx
if (typeof window !== 'undefined' && !import.meta.env.SSR) {
  const currentHtmlTheme = document.documentElement.getAttribute('data-theme');
  if (currentHtmlTheme !== DEFAULT_THEME) {
    document.documentElement.setAttribute('data-theme', DEFAULT_THEME);
  }
  // Persist to localStorage for consistency, though it won't be read for theme switching
  if (localStorage.getItem(kTheme) !== DEFAULT_THEME) {
    localStorage.setItem(kTheme, DEFAULT_THEME);
  }
}
