import { useStore } from '@nanostores/react';
import { memo, useEffect, useState } from 'react';
// import { themeStore, toggleTheme } from '~/lib/stores/theme'; // Theme is now fixed
import { IconButton } from './IconButton';

interface ThemeSwitchProps {
  className?: string;
}

export const ThemeSwitch = memo(({ className }: ThemeSwitchProps) => {
  // const theme = useStore(themeStore); // Theme is fixed
  const [domLoaded, setDomLoaded] = useState(false);

  useEffect(() => {
    setDomLoaded(true);
  }, []);

  // Component is no longer needed as theme is fixed. Returning null.
  return null;

  /*
  // Original rendering logic, kept for reference if needed in future but commented out.
  return (
    domLoaded && (
      <IconButton
        className={className}
        icon={theme === 'dark' ? 'i-ph:sun-dim-duotone' : 'i-ph:moon-stars-duotone'}
        size="xl"
        title="Toggle Theme"
        onClick={toggleTheme} // This would cause an error as toggleTheme is removed
      />
    )
  );
  */
});
