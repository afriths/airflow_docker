/**
 * Test utilities for responsive design and accessibility
 * Used for development and testing purposes
 */

// Test responsive breakpoints
export const testBreakpoints = () => {
  const breakpoints = {
    xs: 0,
    sm: 600,
    md: 900,
    lg: 1200,
    xl: 1536,
  };

  console.log('Current viewport width:', window.innerWidth);
  
  Object.entries(breakpoints).forEach(([name, width]) => {
    const matches = window.innerWidth >= width;
    console.log(`${name} (${width}px+):`, matches);
  });
};

// Test accessibility features
export const testAccessibility = () => {
  const tests = {
    'Focus visible elements': () => {
      const focusableElements = document.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      );
      console.log(`Found ${focusableElements.length} focusable elements`);
      return focusableElements.length > 0;
    },
    
    'ARIA labels present': () => {
      const elementsWithAria = document.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby]');
      console.log(`Found ${elementsWithAria.length} elements with ARIA attributes`);
      return elementsWithAria.length > 0;
    },
    
    'Skip links present': () => {
      const skipLinks = document.querySelectorAll('a[href^="#"]');
      console.log(`Found ${skipLinks.length} skip links`);
      return skipLinks.length > 0;
    },
    
    'Semantic HTML': () => {
      const semanticElements = document.querySelectorAll('main, nav, header, footer, section, article, aside');
      console.log(`Found ${semanticElements.length} semantic HTML elements`);
      return semanticElements.length > 0;
    },
  };

  console.log('Accessibility Test Results:');
  Object.entries(tests).forEach(([testName, testFn]) => {
    const result = testFn();
    console.log(`✓ ${testName}:`, result ? 'PASS' : 'FAIL');
  });
};

// Test keyboard navigation
export const testKeyboardNavigation = () => {
  console.log('Testing keyboard navigation...');
  
  // Test Tab navigation
  const focusableElements = Array.from(
    document.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    )
  ) as HTMLElement[];

  if (focusableElements.length === 0) {
    console.log('No focusable elements found');
    return;
  }

  console.log(`Found ${focusableElements.length} focusable elements`);
  
  // Test focus order
  focusableElements.forEach((element, index) => {
    const tabIndex = element.tabIndex;
    const hasVisibleFocus = getComputedStyle(element).outline !== 'none';
    console.log(`Element ${index + 1}: ${element.tagName.toLowerCase()}${element.id ? '#' + element.id : ''}${element.className ? '.' + element.className.split(' ')[0] : ''} (tabIndex: ${tabIndex})`);
  });
};

// Test responsive grid
export const testResponsiveGrid = () => {
  const gridElements = document.querySelectorAll('[class*="grid"], .MuiGrid-root');
  console.log(`Found ${gridElements.length} grid elements`);
  
  gridElements.forEach((element, index) => {
    const computedStyle = getComputedStyle(element);
    const display = computedStyle.display;
    const gridTemplateColumns = computedStyle.gridTemplateColumns;
    
    console.log(`Grid ${index + 1}:`, {
      display,
      gridTemplateColumns: gridTemplateColumns !== 'none' ? gridTemplateColumns : 'Not set',
      className: element.className,
    });
  });
};

// Run all tests
export const runAllTests = () => {
  console.log('=== Responsive Design & Accessibility Tests ===');
  testBreakpoints();
  console.log('\n');
  testAccessibility();
  console.log('\n');
  testKeyboardNavigation();
  console.log('\n');
  testResponsiveGrid();
  console.log('=== Tests Complete ===');
};

// Make tests available globally in development
if (process.env.NODE_ENV === 'development') {
  (window as any).testResponsive = {
    testBreakpoints,
    testAccessibility,
    testKeyboardNavigation,
    testResponsiveGrid,
    runAllTests,
  };
}