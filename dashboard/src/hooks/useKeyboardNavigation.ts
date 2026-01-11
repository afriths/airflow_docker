/**
 * Custom hook for keyboard navigation support
 * Provides keyboard shortcuts and navigation helpers for accessibility
 */

import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface KeyboardNavigationOptions {
  enableGlobalShortcuts?: boolean;
  enableArrowNavigation?: boolean;
  enableTabNavigation?: boolean;
  onEscape?: () => void;
  onEnter?: () => void;
  customShortcuts?: Record<string, () => void>;
}

interface KeyboardNavigationReturn {
  handleKeyDown: (event: React.KeyboardEvent) => void;
  focusNext: () => void;
  focusPrevious: () => void;
  focusFirst: () => void;
  focusLast: () => void;
  trapFocus: (containerRef: React.RefObject<HTMLElement>) => void;
}

export type { KeyboardNavigationOptions, KeyboardNavigationReturn };

export const useKeyboardNavigation = (
  options: KeyboardNavigationOptions = {}
): KeyboardNavigationReturn => {
  const navigate = useNavigate();
  const {
    enableGlobalShortcuts = true,
    enableArrowNavigation = true,
    enableTabNavigation = true,
    onEscape,
    onEnter,
    customShortcuts = {},
  } = options;

  const focusableElementsSelector = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[role="button"]:not([disabled])',
    '[role="link"]:not([disabled])',
    '[role="menuitem"]:not([disabled])',
    '[role="tab"]:not([disabled])',
  ].join(', ');

  // Get all focusable elements within a container
  const getFocusableElements = useCallback(
    (container: HTMLElement = document.body): HTMLElement[] => {
      return Array.from(
        container.querySelectorAll(focusableElementsSelector)
      ) as HTMLElement[];
    },
    [focusableElementsSelector]
  );

  // Focus management functions
  const focusNext = useCallback(() => {
    const focusableElements = getFocusableElements();
    const currentIndex = focusableElements.indexOf(
      document.activeElement as HTMLElement
    );
    const nextIndex = (currentIndex + 1) % focusableElements.length;
    focusableElements[nextIndex]?.focus();
  }, [getFocusableElements]);

  const focusPrevious = useCallback(() => {
    const focusableElements = getFocusableElements();
    const currentIndex = focusableElements.indexOf(
      document.activeElement as HTMLElement
    );
    const previousIndex =
      currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
    focusableElements[previousIndex]?.focus();
  }, [getFocusableElements]);

  const focusFirst = useCallback(() => {
    const focusableElements = getFocusableElements();
    focusableElements[0]?.focus();
  }, [getFocusableElements]);

  const focusLast = useCallback(() => {
    const focusableElements = getFocusableElements();
    focusableElements[focusableElements.length - 1]?.focus();
  }, [getFocusableElements]);

  // Trap focus within a container (useful for modals/dialogs)
  const trapFocus = useCallback(
    (containerRef: React.RefObject<HTMLElement>) => {
      const handleTabKey = (event: KeyboardEvent) => {
        if (event.key !== 'Tab' || !containerRef.current) return;

        const focusableElements = getFocusableElements(containerRef.current);
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      };

      document.addEventListener('keydown', handleTabKey);
      return () => document.removeEventListener('keydown', handleTabKey);
    },
    [getFocusableElements]
  );

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const { key, ctrlKey, metaKey, altKey, shiftKey } = event;
      const modifierKey = ctrlKey || metaKey;

      // Handle custom shortcuts
      const shortcutKey = [
        modifierKey && 'ctrl',
        altKey && 'alt',
        shiftKey && 'shift',
        key.toLowerCase(),
      ]
        .filter(Boolean)
        .join('+');

      if (customShortcuts[shortcutKey]) {
        event.preventDefault();
        customShortcuts[shortcutKey]();
        return;
      }

      // Handle built-in shortcuts
      switch (key) {
        case 'Escape':
          if (onEscape) {
            event.preventDefault();
            onEscape();
          }
          break;

        case 'Enter':
          if (onEnter && event.target === event.currentTarget) {
            event.preventDefault();
            onEnter();
          }
          break;

        case 'ArrowDown':
          if (enableArrowNavigation) {
            event.preventDefault();
            focusNext();
          }
          break;

        case 'ArrowUp':
          if (enableArrowNavigation) {
            event.preventDefault();
            focusPrevious();
          }
          break;

        case 'Home':
          if (enableArrowNavigation) {
            event.preventDefault();
            focusFirst();
          }
          break;

        case 'End':
          if (enableArrowNavigation) {
            event.preventDefault();
            focusLast();
          }
          break;

        case 'Tab':
          if (!enableTabNavigation) {
            event.preventDefault();
          }
          break;

        default:
          // Global navigation shortcuts
          if (enableGlobalShortcuts && modifierKey) {
            switch (key.toLowerCase()) {
              case '1':
                event.preventDefault();
                navigate('/');
                break;
              case '2':
                event.preventDefault();
                navigate('/dags');
                break;
              case '3':
                event.preventDefault();
                navigate('/history');
                break;
              case 'r':
                event.preventDefault();
                window.location.reload();
                break;
            }
          }
          break;
      }
    },
    [
      customShortcuts,
      onEscape,
      onEnter,
      enableArrowNavigation,
      enableTabNavigation,
      enableGlobalShortcuts,
      focusNext,
      focusPrevious,
      focusFirst,
      focusLast,
      navigate,
    ]
  );

  // Set up global keyboard event listeners
  useEffect(() => {
    if (!enableGlobalShortcuts) return;

    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      // Convert native event to React event-like object
      const reactEvent = {
        key: event.key,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        altKey: event.altKey,
        shiftKey: event.shiftKey,
        preventDefault: () => event.preventDefault(),
        target: event.target,
        currentTarget: event.currentTarget,
      } as React.KeyboardEvent;

      handleKeyDown(reactEvent);
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleKeyDown, enableGlobalShortcuts]);

  return {
    handleKeyDown,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
    trapFocus,
  };
};

export default useKeyboardNavigation;