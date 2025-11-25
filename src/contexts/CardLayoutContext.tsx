import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { CardLayoutMode } from '@/projects/types/CardConfig';
import { getSearchParam, updateSearchParams } from '@/utils/url';

interface CardLayoutContextType {
  layoutMode: CardLayoutMode;
  setLayoutMode: (mode: CardLayoutMode) => void;
}

const CardLayoutContext = createContext<CardLayoutContextType | undefined>(undefined);

const DEFAULT_LAYOUT_MODE: CardLayoutMode = 'small';
const LAYOUT_PARAM = 'layout';

export const CardLayoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Read initial layout mode from URL
  const urlLayout = getSearchParam(LAYOUT_PARAM);
  const initialLayout = (urlLayout as CardLayoutMode) || DEFAULT_LAYOUT_MODE;
  const [layoutMode, setLayoutModeState] = useState<CardLayoutMode>(initialLayout);

  // Update URL when layout mode changes
  const setLayoutMode = (mode: CardLayoutMode) => {
    setLayoutModeState(mode);
    
    // Update URL search params without reloading
    // If it's the default, remove the param; otherwise set it
    if (mode === DEFAULT_LAYOUT_MODE) {
      // Remove param if it's the default
      updateSearchParams({ [LAYOUT_PARAM]: undefined });
    } else {
      // Set param if it's not the default
      updateSearchParams({ [LAYOUT_PARAM]: mode });
    }
  };

  // Listen for browser navigation events (back/forward buttons)
  // This only fires when user uses browser back/forward, not when we update URL programmatically
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handlePopState = () => {
        const urlLayout = getSearchParam(LAYOUT_PARAM);
        const newLayout = (urlLayout as CardLayoutMode) || DEFAULT_LAYOUT_MODE;
        setLayoutModeState(newLayout);
      };

      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, []); // Empty deps - only set up listener once

  return (
    <CardLayoutContext.Provider
      value={{
        layoutMode,
        setLayoutMode,
      }}
    >
      {children}
    </CardLayoutContext.Provider>
  );
};

export const useCardLayout = (): CardLayoutContextType => {
  const context = useContext(CardLayoutContext);
  if (!context) {
    throw new Error('useCardLayout must be used within a CardLayoutProvider');
  }
  return context;
};

