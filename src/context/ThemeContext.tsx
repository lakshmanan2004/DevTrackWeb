import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

export interface WallpaperOption {
  id: string;
  name: string;
  subtitle: string;
  file: string;
}

export const WALLPAPERS: WallpaperOption[] = [
  {
    id: 'none',
    name: 'Default (No Wallpaper)',
    subtitle: 'Clean Apple Liquid Glass & ambient glow',
    file: ''
  },
  {
    id: 'dark-forest',
    name: 'Dark Forest',
    subtitle: 'Moody woodland shadows & mist',
    file: '/DarkForest.jpg'
  },
  {
    id: 'sakura-bloom',
    name: 'Sakura Bloom',
    subtitle: 'Pink cherry blossoms at peak bloom',
    file: '/sakuraBloom.jpg'
  },
  {
    id: 'palm-shore',
    name: 'Palm Shore',
    subtitle: 'Tropical palms against sunset sky',
    file: '/PalmShore.jpg'
  },
  {
    id: 'purple-sand',
    name: 'Purple Sand',
    subtitle: 'Starlit dunes and warm glowing sands',
    file: '/PurpleSand.jpg'
  },
  {
    id: 'milky-way',
    name: 'Milky Way',
    subtitle: 'Starlit galaxy & deep cosmic night',
    file: '/MilkyWay.jpg'
  },
  {
    id: 'sunset',
    name: 'Sun Set',
    subtitle: 'Golden hour sunset vibes & ocean horizon',
    file: '/SunSet.jpg'
  }
];

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
  wallpaper: string;
  setWallpaper: (file: string) => void;
  isWallpaperModalOpen: boolean;
  openWallpaperModal: () => void;
  closeWallpaperModal: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'devtrack-theme';
const WALLPAPER_STORAGE_KEY = 'devtrack-wallpaper';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {
      // Ignore localStorage access errors
    }
    return 'light';
  });

  const [wallpaper, setWallpaperState] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(WALLPAPER_STORAGE_KEY);
      if (stored !== null) return stored;
    } catch {
      // Ignore storage errors
    }
    return '';
  });

  const [isWallpaperModalOpen, setIsWallpaperModalOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Ignore storage errors
    }
  }, [theme]);

  const setWallpaper = (file: string) => {
    setWallpaperState(file);
    try {
      localStorage.setItem(WALLPAPER_STORAGE_KEY, file);
    } catch {
      // Ignore
    }
  };

  // Listen to system theme changes if user hasn't explicitly set preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setThemeState(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        isDark: theme === 'dark',
        wallpaper,
        setWallpaper,
        isWallpaperModalOpen,
        openWallpaperModal: () => setIsWallpaperModalOpen(true),
        closeWallpaperModal: () => setIsWallpaperModalOpen(false)
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
