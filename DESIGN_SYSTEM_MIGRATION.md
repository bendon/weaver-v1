# Design System Migration Plan

## Overview
Migrating to Figma's monochromatic design system with Tailwind CSS support.

## Current State
- ✅ Geist font package already installed
- ✅ Monochromatic color scheme (black/white) already in place
- ✅ CSS variables defined in index.css
- ❌ Tailwind CSS not installed
- ❌ EB Garamond font not imported

## Implementation Steps

### Phase 1: Install Dependencies
```bash
cd frontend
npm install -D tailwindcss
npx tailwindcss init -p
```

### Phase 2: Configuration Files

#### 1. `tailwind.config.ts`
Configure Tailwind with custom design tokens matching Figma design system.

#### 2. `postcss.config.js`
Update to include Tailwind CSS plugin.

#### 3. Update global CSS
Replace current `src/index.css` with Figma's design system including:
- Google Fonts imports (EB Garamond, Geist, Geist Mono)
- Tailwind directives (@tailwind base, components, utilities)
- CSS variables in @layer base
- Utility classes in @layer utilities

### Phase 3: Component Migration Priority

**High Priority (User-facing):**
1. AI Chat Interface (`AIChatInterface.tsx`)
2. Dashboard (`DashboardPage.tsx`)
3. Booking Detail Views
4. Flight Search Interface

**Medium Priority:**
5. Forms and inputs
6. Tables and lists
7. Navigation components

**Low Priority:**
8. Admin/settings pages
9. Edge case views

### Phase 4: Testing

- Visual regression testing
- Responsive behavior on mobile/tablet/desktop
- Dark mode compatibility (if needed)
- Accessibility checks

## Design Tokens Reference

### Colors (Monochromatic)
```css
--color-bg: #ffffff
--color-bg-subtle: rgba(0, 0, 0, 0.02)
--color-text-primary: #000000
--color-text-secondary: rgba(0, 0, 0, 0.7)
--color-text-tertiary: rgba(0, 0, 0, 0.5)
--color-border: rgba(0, 0, 0, 0.1)
```

### Typography
- **Headings**: EB Garamond (serif, 600 weight)
- **Body**: Geist (sans-serif, 400 weight)
- **Code**: Geist Mono (monospace)

### Spacing Scale
```
--space-1: 4px
--space-2: 8px
--space-3: 16px
--space-4: 24px
--space-5: 32px
--space-6: 48px
```

### Shadows
```
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05)
--shadow-md: 0 2px 4px rgba(0, 0, 0, 0.08)
--shadow-lg: 0 4px 12px rgba(0, 0, 0, 0.1)
```

### Border Radius
```
--radius-sm: 4px
--radius-md: 8px
--radius-lg: 12px
--radius-xl: 16px
--radius-full: 9999px
```

## Migration Strategy

### Option A: Big Bang (Not Recommended)
Replace all CSS at once - high risk, difficult to debug.

### Option B: Incremental (Recommended)
1. Install Tailwind alongside existing CSS
2. Update global styles
3. Migrate components one by one
4. Test each component before moving to next
5. Remove old CSS after all components migrated

## Backward Compatibility

Keep legacy CSS variables during migration:
```css
/* Legacy support */
--color-primary: #000000;
--color-text: #000000;
/* ... etc */
```

Remove once all components migrated.

## Success Criteria

- [ ] Tailwind CSS installed and configured
- [ ] All fonts loading correctly (EB Garamond, Geist, Geist Mono)
- [ ] CSS variables available globally
- [ ] No visual regressions
- [ ] Responsive design maintained
- [ ] Performance not degraded
- [ ] All components using new design tokens
