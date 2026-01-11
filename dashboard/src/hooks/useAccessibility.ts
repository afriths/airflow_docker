/**
 * Custom hook for accessibility utilities
 * Provides ARIA helpers, screen reader support, and accessibility features
 */

import { useEffect, useRef, useCallback, useState } from 'react';

interface AccessibilityOptions {
  announcePageChanges?: boolean;
  enableSkipLinks?: boolean;
  enableLandmarkNavigation?: boolean;
  respectReducedMotion?: boolean;
}

interface AccessibilityReturn {
  // Screen reader utilities
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  announcePageChange: (title: string) => void;
  
  // Focus management
  setFocusToMain: () => void;
  setFocusToHeading: (level?: number) => void;
  restoreFocus: () => void;
  saveFocus: () => void;
  
  // ARIA utilities
  generateId: (prefix?: string) => string;
  getAriaLabel: (text: string, context?: string) => string;
  getAriaDescribedBy: (description: string) => string;
  
  // Accessibility state
  prefersReducedMotion: boolean;
  isHighContrast: boolean;
  
  // Skip link utilities
  skipLinkProps: {
    href: string;
    onClick: (event: React.MouseEvent) => void;
    onKeyDown: (event: React.KeyboardEvent) => void;
  };
}

export type { AccessibilityOptions, AccessibilityReturn };

let idCounter = 0;

export const useAccessibility = (
  options: AccessibilityOptions = {}
): AccessibilityReturn => {
  const {
    announcePageChanges = true,
    enableLandmarkNavigation = true,
    respectReducedMotion = true,
  } = options;

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const liveRegionRef = useRef<HTMLDivElement | null>(null);

  // Initialize live region for announcements
  useEffect(() => {
    if (!liveRegionRef.current) {
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.position = 'absolute';
      liveRegion.style.left = '-10000px';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.overflow = 'hidden';
      document.body.appendChild(liveRegion);
      liveRegionRef.current = liveRegion;
    }

    return () => {
      if (liveRegionRef.current) {
        document.body.removeChild(liveRegionRef.current);
        liveRegionRef.current = null;
      }
    };
  }, []);

  // Check for user preferences
  useEffect(() => {
    if (respectReducedMotion) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [respectReducedMotion]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Screen reader announcement
  const announce = useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      if (!liveRegionRef.current) return;

      liveRegionRef.current.setAttribute('aria-live', priority);
      liveRegionRef.current.textContent = message;

      // Clear after announcement
      setTimeout(() => {
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = '';
        }
      }, 1000);
    },
    []
  );

  // Announce page changes
  const announcePageChange = useCallback(
    (title: string) => {
      if (announcePageChanges) {
        announce(`Navigated to ${title}`, 'polite');
        document.title = `${title} - Airflow Dashboard`;
      }
    },
    [announce, announcePageChanges]
  );

  // Focus management
  const setFocusToMain = useCallback(() => {
    const main = document.querySelector('main, [role="main"]') as HTMLElement;
    if (main) {
      main.focus();
      main.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const setFocusToHeading = useCallback((level: number = 1) => {
    const heading = document.querySelector(
      `h${level}, [role="heading"][aria-level="${level}"]`
    ) as HTMLElement;
    if (heading) {
      heading.focus();
      heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const saveFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
  }, []);

  const restoreFocus = useCallback(() => {
    if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, []);

  // ARIA utilities
  const generateId = useCallback((prefix: string = 'aria') => {
    return `${prefix}-${++idCounter}`;
  }, []);

  const getAriaLabel = useCallback((text: string, context?: string) => {
    return context ? `${text}, ${context}` : text;
  }, []);

  const getAriaDescribedBy = useCallback((description: string) => {
    const id = generateId('description');
    
    // Create hidden description element
    const descElement = document.createElement('div');
    descElement.id = id;
    descElement.textContent = description;
    descElement.style.position = 'absolute';
    descElement.style.left = '-10000px';
    descElement.style.width = '1px';
    descElement.style.height = '1px';
    descElement.style.overflow = 'hidden';
    document.body.appendChild(descElement);

    return id;
  }, [generateId]);

  // Skip link functionality
  const skipLinkProps = {
    href: '#main-content',
    onClick: (event: React.MouseEvent) => {
      event.preventDefault();
      setFocusToMain();
    },
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setFocusToMain();
      }
    },
  };

  // Set up landmark navigation
  useEffect(() => {
    if (!enableLandmarkNavigation) return;

    const handleLandmarkNavigation = (event: KeyboardEvent) => {
      // Alt + number keys for landmark navigation
      if (event.altKey && !event.ctrlKey && !event.metaKey) {
        let target: HTMLElement | null = null;

        switch (event.key) {
          case '1':
            target = document.querySelector('main, [role="main"]') as HTMLElement;
            break;
          case '2':
            target = document.querySelector('nav, [role="navigation"]') as HTMLElement;
            break;
          case '3':
            target = document.querySelector('aside, [role="complementary"]') as HTMLElement;
            break;
          case '4':
            target = document.querySelector('header, [role="banner"]') as HTMLElement;
            break;
          case '5':
            target = document.querySelector('footer, [role="contentinfo"]') as HTMLElement;
            break;
        }

        if (target) {
          event.preventDefault();
          target.focus();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          announce(`Navigated to ${target.tagName.toLowerCase()}`, 'polite');
        }
      }
    };

    document.addEventListener('keydown', handleLandmarkNavigation);
    return () => document.removeEventListener('keydown', handleLandmarkNavigation);
  }, [enableLandmarkNavigation, announce]);

  return {
    announce,
    announcePageChange,
    setFocusToMain,
    setFocusToHeading,
    restoreFocus,
    saveFocus,
    generateId,
    getAriaLabel,
    getAriaDescribedBy,
    prefersReducedMotion,
    isHighContrast,
    skipLinkProps,
  };
};

export default useAccessibility;