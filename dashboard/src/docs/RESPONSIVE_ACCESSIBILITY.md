# Responsive Design & Accessibility Guide

This document outlines the responsive design and accessibility features implemented in the Airflow UI Dashboard.

## Responsive Design Features

### Breakpoints

The application uses Material-UI's responsive breakpoint system:

- **xs**: 0px and up (mobile phones)
- **sm**: 600px and up (tablets)
- **md**: 900px and up (small laptops)
- **lg**: 1200px and up (desktops)
- **xl**: 1536px and up (large screens)

### Responsive Components

#### 1. DashboardLayout
- Adaptive sidebar that collapses on mobile
- Responsive header with collapsible elements
- Dynamic spacing based on screen size
- Touch-friendly navigation on mobile

#### 2. ResponsiveGrid
- Flexible grid system with breakpoint-aware columns
- Predefined layouts: CardGrid, ListGrid, TwoColumnGrid
- Automatic spacing adjustment

#### 3. DAGList
- Responsive card layout
- Mobile-optimized search and filters
- Touch-friendly buttons and interactions

### CSS Custom Properties

The application uses CSS custom properties for consistent responsive behavior:

```css
:root {
  --header-height: 64px;
  --sidebar-width: 280px;
  --content-max-width: 1200px;
  --border-radius: 8px;
}
```

### Mobile-First Approach

All components are designed mobile-first with progressive enhancement:

1. Base styles for mobile (xs)
2. Enhanced layouts for tablets (sm, md)
3. Full-featured desktop experience (lg, xl)

## Accessibility Features

### WCAG 2.1 Compliance

The application follows WCAG 2.1 AA guidelines:

#### 1. Perceivable
- **Color Contrast**: All text meets minimum contrast ratios
- **Responsive Text**: Text scales appropriately across devices
- **Alternative Text**: Images and icons have appropriate alt text
- **Color Independence**: Information is not conveyed by color alone

#### 2. Operable
- **Keyboard Navigation**: Full keyboard accessibility
- **Focus Management**: Visible focus indicators
- **Touch Targets**: Minimum 44px touch targets
- **Motion Preferences**: Respects `prefers-reduced-motion`

#### 3. Understandable
- **Semantic HTML**: Proper heading hierarchy and landmarks
- **ARIA Labels**: Comprehensive ARIA labeling
- **Error Messages**: Clear, actionable error messages
- **Consistent Navigation**: Predictable navigation patterns

#### 4. Robust
- **Valid HTML**: Semantic, valid markup
- **Screen Reader Support**: Compatible with assistive technologies
- **Progressive Enhancement**: Works without JavaScript

### Keyboard Navigation

#### Global Shortcuts
- `Ctrl/Cmd + 1`: Navigate to Dashboard
- `Ctrl/Cmd + 2`: Navigate to DAGs
- `Ctrl/Cmd + 3`: Navigate to History
- `Ctrl/Cmd + R`: Refresh page
- `Ctrl/Cmd + M`: Toggle sidebar

#### Navigation Shortcuts
- `Tab`: Move to next focusable element
- `Shift + Tab`: Move to previous focusable element
- `Enter/Space`: Activate buttons and links
- `Escape`: Close modals and menus
- `Arrow Keys`: Navigate within lists and menus
- `Home/End`: Jump to first/last item in lists

#### Landmark Navigation
- `Alt + 1`: Jump to main content
- `Alt + 2`: Jump to navigation
- `Alt + 3`: Jump to sidebar
- `Alt + 4`: Jump to header
- `Alt + 5`: Jump to footer

### Screen Reader Support

#### ARIA Implementation
- **Landmarks**: `main`, `navigation`, `banner`, `complementary`
- **Live Regions**: Dynamic content announcements
- **Labels**: Descriptive labels for all interactive elements
- **States**: Current state of expandable/collapsible elements
- **Descriptions**: Additional context where needed

#### Screen Reader Testing
Tested with:
- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (macOS)
- TalkBack (Android)

### Focus Management

#### Focus Indicators
- High-contrast focus rings
- 2px solid outline with 2px offset
- Consistent across all interactive elements

#### Focus Trapping
- Modal dialogs trap focus
- Sidebar navigation maintains focus
- Skip links for efficient navigation

#### Focus Restoration
- Focus returns to trigger element after modal close
- Maintains focus position during dynamic updates

## Custom Hooks

### useResponsive
Provides responsive design utilities:

```typescript
const {
  isMobile,
  isTablet,
  isDesktop,
  currentBreakpoint,
  getResponsiveValue,
  getGridColumns,
} = useResponsive();
```

### useAccessibility
Provides accessibility utilities:

```typescript
const {
  announce,
  announcePageChange,
  setFocusToMain,
  generateId,
  getAriaLabel,
  prefersReducedMotion,
} = useAccessibility();
```

### useKeyboardNavigation
Provides keyboard navigation support:

```typescript
const {
  handleKeyDown,
  focusNext,
  focusPrevious,
  trapFocus,
} = useKeyboardNavigation({
  enableGlobalShortcuts: true,
  customShortcuts: {
    'ctrl+m': toggleSidebar,
  },
});
```

## Testing

### Manual Testing Checklist

#### Responsive Design
- [ ] Test on mobile devices (320px - 767px)
- [ ] Test on tablets (768px - 1023px)
- [ ] Test on desktop (1024px+)
- [ ] Verify touch targets are at least 44px
- [ ] Check text readability at all sizes
- [ ] Ensure horizontal scrolling is not required

#### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Verify focus indicators are visible
- [ ] Test keyboard shortcuts
- [ ] Ensure no keyboard traps
- [ ] Verify skip links work

#### Screen Reader Testing
- [ ] Test with screen reader enabled
- [ ] Verify all content is announced
- [ ] Check landmark navigation
- [ ] Test form labels and error messages
- [ ] Verify dynamic content announcements

### Automated Testing

Use the built-in test utilities:

```javascript
// In browser console (development only)
window.testResponsive.runAllTests();
```

### Browser Testing

Tested browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Considerations

### Responsive Images
- Use `srcset` for different screen densities
- Lazy load images below the fold
- Optimize image formats (WebP, AVIF)

### CSS Optimization
- Use CSS custom properties for theming
- Minimize media query duplication
- Leverage CSS Grid and Flexbox

### JavaScript Performance
- Debounce resize event handlers
- Use `IntersectionObserver` for visibility detection
- Minimize layout thrashing

## Browser Support

### Modern Browsers
Full support for all features:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Legacy Browser Fallbacks
Graceful degradation for:
- Internet Explorer 11 (basic functionality)
- Older mobile browsers (simplified layouts)

## Maintenance

### Regular Audits
- Run Lighthouse accessibility audits
- Test with real users and assistive technologies
- Monitor Web Vitals metrics
- Review and update ARIA labels

### Updates
- Keep dependencies updated
- Monitor WCAG guideline changes
- Test new browser versions
- Gather user feedback

## Resources

### Documentation
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material-UI Accessibility](https://mui.com/guides/accessibility/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

### Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WAVE](https://wave.webaim.org/)
- [Color Contrast Analyzer](https://www.tpgi.com/color-contrast-checker/)