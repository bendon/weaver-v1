# Design System Implementation Steps

## Step 1: Install Tailwind CSS ✓

Run in the `frontend` directory:

```bash
npm install -D tailwindcss
```

## Step 2: Files Created/Updated ✓

The following files have been created or updated:

1. **`tailwind.config.ts`** - Tailwind configuration with design tokens
2. **`postcss.config.js`** - Updated to include Tailwind
3. **`src/styles/globals-new.css`** - New global stylesheet with Figma design system
4. **`DESIGN_SYSTEM_MIGRATION.md`** - Complete migration strategy

## Step 3: Apply the New Global Styles

Choose one of these approaches:

### Option A: Replace Existing (Recommended for new projects)

```bash
cd frontend
mv src/index.css src/index-old.css.backup
mv src/styles/globals-new.css src/index.css
```

### Option B: Incremental Migration (Recommended for existing projects)

Keep both files temporarily:

1. Import the new styles in `app/layout.tsx`:

```tsx
import '../src/styles/globals-new.css' // New Figma design system
import '../src/index.css' // Old styles for backward compatibility
```

2. Gradually update components to use new utilities
3. Remove old CSS after all components migrated

## Step 4: Update Next.js Layout

Update `app/layout.tsx` to use the new global styles:

```tsx
import type { Metadata } from 'next'
import '../src/styles/globals-new.css' // or '../src/index.css' if you chose Option A

export const metadata: Metadata = {
  title: 'TravelWeaver',
  description: 'Professional travel management platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

## Step 5: Test the Design System

### 5.1 Start Development Server

```bash
cd frontend
npm run dev
```

### 5.2 Verify Fonts Loading

Open browser DevTools > Network tab and check:
- ✓ EB Garamond loading from Google Fonts
- ✓ Geist fonts loading
- ✓ Geist Mono loading

### 5.3 Test Design Tokens

Open browser DevTools > Console and run:

```javascript
// Check CSS variables
getComputedStyle(document.documentElement).getPropertyValue('--color-bg')
getComputedStyle(document.documentElement).getPropertyValue('--color-text-primary')

// Check font families
getComputedStyle(document.body).fontFamily
```

### 5.4 Test Utility Classes

Create a test component to verify utilities work:

```tsx
// test-design-system.tsx
export default function TestDesignSystem() {
  return (
    <div className="container">
      <h1 className="font-serif">Heading (EB Garamond)</h1>
      <p className="text-secondary">Secondary text</p>
      <button className="btn btn-primary">Primary Button</button>
      <button className="btn btn-secondary">Secondary Button</button>
      <div className="card">Card Component</div>
      <span className="badge">Badge</span>
    </div>
  )
}
```

## Step 6: Update Components

Prioritize updating components in this order:

### High Priority
1. ✓ Global styles applied
2. [ ] AI Chat Interface
3. [ ] Dashboard
4. [ ] Booking views
5. [ ] Flight search

### Medium Priority
6. [ ] Forms
7. [ ] Tables
8. [ ] Navigation
9. [ ] Modals

### Low Priority
10. [ ] Settings pages
11. [ ] Admin views

## Step 7: Component Migration Example

**Before (using old CSS):**
```tsx
<div className="booking-card">
  <h3>Booking Title</h3>
  <p className="text-gray-600">Description</p>
  <button className="primary-btn">View</button>
</div>
```

**After (using new design system):**
```tsx
<div className="card card-hover">
  <h3 className="font-serif">Booking Title</h3>
  <p className="text-secondary">Description</p>
  <button className="btn btn-primary">View</button>
</div>
```

## Step 8: Remove Old Styles (Final Step)

After all components are migrated:

1. Remove `src/index-old.css.backup`
2. Remove legacy CSS variable mappings from `globals-new.css`
3. Clean up any unused CSS files
4. Run build to check for issues:

```bash
npm run build
```

## Troubleshooting

### Fonts Not Loading
- Check Google Fonts URL is correct
- Verify font names match exactly
- Clear browser cache

### Tailwind Classes Not Working
- Verify `tailwind.config.ts` content paths include your component files
- Check `postcss.config.js` has `tailwindcss` plugin
- Restart dev server after config changes

### CSS Variables Not Available
- Check `:root` selector in `@layer base`
- Verify browser supports CSS custom properties
- Check for typos in variable names

### Styles Conflicting
- Check order of CSS imports (new should come after old during migration)
- Use browser DevTools to inspect which styles are applying
- Check for `!important` overrides

## Success Checklist

- [ ] Tailwind CSS installed
- [ ] Config files created/updated
- [ ] New global styles applied
- [ ] Fonts loading correctly
- [ ] CSS variables accessible
- [ ] Utility classes working
- [ ] No console errors
- [ ] Visual appearance matches design
- [ ] Responsive on mobile/tablet/desktop
- [ ] No performance degradation

## Next Steps

After completing the implementation:

1. Create component library documentation
2. Set up Storybook (optional) for component showcase
3. Create design system usage guide for team
4. Set up automated visual regression testing
