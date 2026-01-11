/**
 * Responsive Grid Component
 * Provides responsive grid layout with Material-UI breakpoints
 */

import React from 'react';
import { Grid, type GridProps, useTheme } from '@mui/material';
import { useResponsive } from '../hooks';

interface ResponsiveGridProps extends Omit<GridProps, 'container' | 'item'> {
  children: React.ReactNode;
  variant?: 'container' | 'item';
  responsive?: {
    xs?: number | boolean;
    sm?: number | boolean;
    md?: number | boolean;
    lg?: number | boolean;
    xl?: number | boolean;
  };
  spacing?: number | {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  variant = 'container',
  responsive,
  spacing = 2,
  alignItems,
  justifyContent,
  ...props
}) => {
  const theme = useTheme();
  const { getResponsiveValue } = useResponsive();

  // Calculate responsive spacing
  const getSpacingValue = () => {
    if (typeof spacing === 'number') {
      return spacing * (theme.spacing(1) as number) / 8;
    }
    return getResponsiveValue(spacing) || 2;
  };

  const gridProps: any = {
    ...props,
    container: variant === 'container',
    item: variant === 'item',
    spacing: variant === 'container' ? getSpacingValue() : undefined,
    alignItems,
    justifyContent,
  };

  // Add responsive props for items
  if (variant === 'item' && responsive) {
    Object.entries(responsive).forEach(([breakpoint, value]) => {
      if (value !== undefined) {
        (gridProps as any)[breakpoint] = value;
      }
    });
  }

  return <Grid {...gridProps}>{children}</Grid>;
};

// Predefined responsive grid configurations
export const ResponsiveCardGrid: React.FC<{
  children: React.ReactNode;
  spacing?: number;
}> = ({ children, spacing = 3 }) => {
  const { getResponsiveValue } = useResponsive();

  const columns = getResponsiveValue({
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 5,
  });

  return (
    <ResponsiveGrid variant="container" spacing={spacing}>
      {React.Children.map(children, (child, index) => (
        <ResponsiveGrid
          key={index}
          variant="item"
          responsive={{
            xs: 12,
            sm: 6,
            md: 4,
            lg: 3,
            xl: Math.floor(12 / (columns || 1)),
          }}
        >
          {child}
        </ResponsiveGrid>
      ))}
    </ResponsiveGrid>
  );
};

export const ResponsiveListGrid: React.FC<{
  children: React.ReactNode;
  spacing?: number;
}> = ({ children, spacing = 2 }) => (
  <ResponsiveGrid variant="container" spacing={spacing}>
    {React.Children.map(children, (child, index) => (
      <ResponsiveGrid
        key={index}
        variant="item"
        responsive={{
          xs: 12,
        }}
      >
        {child}
      </ResponsiveGrid>
    ))}
  </ResponsiveGrid>
);

export const ResponsiveTwoColumnGrid: React.FC<{
  children: React.ReactNode;
  spacing?: number;
  leftWeight?: number;
  rightWeight?: number;
}> = ({ children, spacing = 3, leftWeight = 8, rightWeight = 4 }) => {
  const childrenArray = React.Children.toArray(children);
  
  return (
    <ResponsiveGrid variant="container" spacing={spacing}>
      {childrenArray[0] && (
        <ResponsiveGrid
          variant="item"
          responsive={{
            xs: 12,
            md: leftWeight,
          }}
        >
          {childrenArray[0]}
        </ResponsiveGrid>
      )}
      {childrenArray[1] && (
        <ResponsiveGrid
          variant="item"
          responsive={{
            xs: 12,
            md: rightWeight,
          }}
        >
          {childrenArray[1]}
        </ResponsiveGrid>
      )}
    </ResponsiveGrid>
  );
};

export default ResponsiveGrid;