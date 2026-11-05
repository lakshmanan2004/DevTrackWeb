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
  },
  {
    id: 'mountain',
    name: 'Mountain',
    subtitle: 'Alpine summits & verdant green ridges',
    file: '/Mountain.jpg'
  }
];

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
  isLiteMode: boolean;
  toggleLiteMode: () => void;
  setLiteMode: (enabled: boolean) => void;
  wallpaper: string;
  setWallpaper: (file: string) => void;
  isWallpaperModalOpen: boolean;
  openWallpaperModal: () => void;
  closeWallpaperModal: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'devtrack-theme';
const WALLPAPER_STORAGE_KEY = 'devtrack-wallpaper';
const LITE_MODE_STORAGE_KEY = 'devtrack-lite-mode';

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

  const [isLiteMode, setIsLiteModeState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(LITE_MODE_STORAGE_KEY);
      return stored === 'true';
    } catch {
      return false;
    }
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
    // Disable all CSS transitions globally during theme class flip to prevent awkward mid-transition lag
    const css = document.createElement('style');
    css.appendChild(
      document.createTextNode(
        `*, *::before, *::after {
          -webkit-transition: none !important;
          -moz-transition: none !important;
          -o-transition: none !important;
          -ms-transition: none !important;
          transition: none !important;
        }`
      )
    );
    document.head.appendChild(css);

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

    // Force layout reflow so the browser registers the theme change with transitions disabled
    (() => window.getComputedStyle(document.body).opacity)();

    // Re-enable normal UI transitions on the next animation frame
    const timer = setTimeout(() => {
      if (css.parentNode) {
        css.parentNode.removeChild(css);
      }
    }, 20);

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Ignore storage errors
    }

    return () => {
      clearTimeout(timer);
      if (css.parentNode) {
        css.parentNode.removeChild(css);
      }
    };
  }, [theme]);

  // Synchronize Lite Mode class on root element and localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (isLiteMode) {
      root.classList.add('lite-mode');
    } else {
      root.classList.remove('lite-mode');
    }
    try {
      localStorage.setItem(LITE_MODE_STORAGE_KEY, String(isLiteMode));
    } catch {
      // Ignore
    }
  }, [isLiteMode]);

  const toggleLiteMode = () => {
    setIsLiteModeState((prev) => !prev);
  };

  const setLiteMode = (enabled: boolean) => {
    setIsLiteModeState(enabled);
  };

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
        isLiteMode,
        toggleLiteMode,
        setLiteMode,
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
