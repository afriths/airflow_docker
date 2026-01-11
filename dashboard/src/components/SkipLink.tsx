/**
 * Skip Link Component
 * Provides keyboard navigation skip link for accessibility
 */

import React from 'react';
import { Box, Link, styled } from '@mui/material';
import { useAccessibility } from '../hooks';

const StyledSkipLink = styled(Link)(({ theme }) => ({
  position: 'absolute',
  top: -40,
  left: 6,
  zIndex: theme.zIndex.tooltip + 1,
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(1, 2),
  borderRadius: theme.shape.borderRadius,
  textDecoration: 'none',
  fontSize: '0.875rem',
  fontWeight: 600,
  border: `2px solid ${theme.palette.primary.main}`,
  transition: theme.transitions.create(['top'], {
    duration: theme.transitions.duration.short,
  }),
  '&:focus': {
    top: 6,
    outline: `2px solid ${theme.palette.background.paper}`,
    outlineOffset: 2,
  },
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
    borderColor: theme.palette.primary.dark,
  },
}));

interface SkipLinkProps {
  targetId?: string;
  children?: React.ReactNode;
}

export const SkipLink: React.FC<SkipLinkProps> = ({
  targetId = 'main-content',
  children = 'Skip to main content',
}) => {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLAnchorElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const target = document.getElementById(targetId);
      if (target) {
        target.focus();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <StyledSkipLink
      href={`#${targetId}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      {children}
    </StyledSkipLink>
  );
};

export default SkipLink;