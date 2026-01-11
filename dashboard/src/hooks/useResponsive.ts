/**
 * Custom hook for responsive design utilities
 * Provides breakpoint detection and responsive helpers
 */

import { useTheme, useMediaQuery, type Breakpoint } from '@mui/material';
import { useMemo } from 'react';

interface ResponsiveValues<T> {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
}

interface ResponsiveReturn {
  // Current breakpoint
  currentBreakpoint: Breakpoint;
  
  // Breakpoint checks
  isXs: boolean;
  isSm: boolean;
  isMd: boolean;
  isLg: boolean;
  isXl: boolean;
  
  // Size checks
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  
  // Direction checks
  isSmUp: boolean;
  isMdUp: boolean;
  isLgUp: boolean;
  isXlUp: boolean;
  
  isSmDown: boolean;
  isMdDown: boolean;
  isLgDown: boolean;
  isXlDown: boolean;
  
  // Utility functions
  getResponsiveValue: <T>(values: ResponsiveValues<T>) => T | undefined;
  getGridColumns: () => number;
  getSidebarWidth: () => number;
  getSpacing: (base: number) => number;
}

export type { ResponsiveReturn };

export const useResponsive = (): ResponsiveReturn => {
  const theme = useTheme();
  
  // Breakpoint queries
  const isXs = useMediaQuery(theme.breakpoints.only('xs'));
  const isSm = useMediaQuery(theme.breakpoints.only('sm'));
  const isMd = useMediaQuery(theme.breakpoints.only('md'));
  const isLg = useMediaQuery(theme.breakpoints.only('lg'));
  const isXl = useMediaQuery(theme.breakpoints.only('xl'));
  
  // Up queries
  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const isLgUp = useMediaQuery(theme.breakpoints.up('lg'));
  const isXlUp = useMediaQuery(theme.breakpoints.up('xl'));
  
  // Down queries
  const isSmDown = useMediaQuery(theme.breakpoints.down('sm'));
  const isMdDown = useMediaQuery(theme.breakpoints.down('md'));
  const isLgDown = useMediaQuery(theme.breakpoints.down('lg'));
  const isXlDown = useMediaQuery(theme.breakpoints.down('xl'));
  
  // Semantic size checks
  const isMobile = isXs || isSm;
  const isTablet = isMd;
  const isDesktop = isLg || isXl;
  
  // Current breakpoint
  const currentBreakpoint: Breakpoint = useMemo(() => {
    if (isXl) return 'xl';
    if (isLg) return 'lg';
    if (isMd) return 'md';
    if (isSm) return 'sm';
    return 'xs';
  }, [isXs, isSm, isMd, isLg, isXl]);
  
  // Get responsive value based on current breakpoint
  const getResponsiveValue = <T>(values: ResponsiveValues<T>): T | undefined => {
    // Check from largest to smallest breakpoint
    if (isXl && values.xl !== undefined) return values.xl;
    if (isLg && values.lg !== undefined) return values.lg;
    if (isMd && values.md !== undefined) return values.md;
    if (isSm && values.sm !== undefined) return values.sm;
    if (isXs && values.xs !== undefined) return values.xs;
    
    // Fallback to largest available value
    if (values.xl !== undefined) return values.xl;
    if (values.lg !== undefined) return values.lg;
    if (values.md !== undefined) return values.md;
    if (values.sm !== undefined) return values.sm;
    if (values.xs !== undefined) return values.xs;
    
    return undefined;
  };
  
  // Get responsive grid columns
  const getGridColumns = (): number => {
    return getResponsiveValue({
      xs: 1,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5,
    }) || 1;
  };
  
  // Get responsive sidebar width
  const getSidebarWidth = (): number => {
    return getResponsiveValue({
      xs: 280,
      sm: 280,
      md: 280,
      lg: 320,
      xl: 360,
    }) || 280;
  };
  
  // Get responsive spacing multiplier
  const getSpacing = (base: number): number => {
    const multiplier = getResponsiveValue({
      xs: 0.5,
      sm: 0.75,
      md: 1,
      lg: 1.25,
      xl: 1.5,
    }) || 1;
    
    return base * multiplier;
  };
  
  return {
    currentBreakpoint,
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    isMobile,
    isTablet,
    isDesktop,
    isSmUp,
    isMdUp,
    isLgUp,
    isXlUp,
    isSmDown,
    isMdDown,
    isLgDown,
    isXlDown,
    getResponsiveValue,
    getGridColumns,
    getSidebarWidth,
    getSpacing,
  };
};

export default useResponsive;