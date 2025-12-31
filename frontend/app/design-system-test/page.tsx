'use client';

/**
 * Design System Test Page
 *
 * This page demonstrates all the design tokens and utility classes
 * from the Figma design system. Use this to verify the design system
 * is working correctly.
 */

export default function DesignSystemTest() {
  return (
    <div className="container" style={{ padding: 'var(--space-6)' }}>
      <h1>Design System Test Page</h1>
      <p className="text-secondary">
        This page demonstrates the Figma design system implementation
      </p>

      <div className="divider" />

      {/* Typography */}
      <section style={{ marginBottom: 'var(--space-6)' }}>
        <h2>Typography</h2>

        <h1>Heading 1 (EB Garamond 40px)</h1>
        <h2>Heading 2 (EB Garamond 28px)</h2>
        <h3>Heading 3 (EB Garamond 24px)</h3>
        <h4>Heading 4 (20px)</h4>
        <h5>Heading 5 (18px)</h5>
        <h6>Heading 6 (16px)</h6>

        <p>Body text (Geist 16px) with normal weight</p>
        <p className="text-secondary">Secondary text with 70% opacity</p>
        <p className="text-tertiary">Tertiary text with 50% opacity</p>

        <label>Label text (Geist 14px medium)</label>
        <br />
        <small>Small text (12px)</small>
        <br />
        <code>Code text (Geist Mono 14px)</code>
      </section>

      <div className="divider" />

      {/* Colors */}
      <section style={{ marginBottom: 'var(--space-6)' }}>
        <h2>Colors</h2>

        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <div>
            <div style={{
              width: '100px',
              height: '100px',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)'
            }} />
            <small>Background</small>
          </div>

          <div>
            <div style={{
              width: '100px',
              height: '100px',
              background: 'var(--color-bg-subtle)'
            }} />
            <small>Subtle</small>
          </div>

          <div>
            <div style={{
              width: '100px',
              height: '100px',
              background: 'var(--color-text-primary)'
            }} />
            <small>Primary</small>
          </div>

          <div>
            <div style={{
              width: '100px',
              height: '100px',
              background: 'var(--color-text-secondary)'
            }} />
            <small>Secondary</small>
          </div>

          <div>
            <div style={{
              width: '100px',
              height: '100px',
              background: 'var(--color-text-tertiary)'
            }} />
            <small>Tertiary</small>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* Spacing */}
      <section style={{ marginBottom: 'var(--space-6)' }}>
        <h2>Spacing Scale</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ width: 'var(--space-1)', height: '20px', background: '#000' }} />
            <small>space-1 (4px)</small>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ width: 'var(--space-2)', height: '20px', background: '#000' }} />
            <small>space-2 (8px)</small>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ width: 'var(--space-3)', height: '20px', background: '#000' }} />
            <small>space-3 (16px)</small>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ width: 'var(--space-4)', height: '20px', background: '#000' }} />
            <small>space-4 (24px)</small>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ width: 'var(--space-5)', height: '20px', background: '#000' }} />
            <small>space-5 (32px)</small>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ width: 'var(--space-6)', height: '20px', background: '#000' }} />
            <small>space-6 (48px)</small>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* Buttons */}
      <section style={{ marginBottom: 'var(--space-6)' }}>
        <h2>Buttons</h2>

        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <button className="btn btn-primary">Primary Button</button>
          <button className="btn btn-secondary">Secondary Button</button>
          <button className="btn btn-ghost">Ghost Button</button>
          <button className="btn btn-primary" disabled>Disabled Button</button>
        </div>
      </section>

      <div className="divider" />

      {/* Inputs */}
      <section style={{ marginBottom: 'var(--space-6)' }}>
        <h2>Form Inputs</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', maxWidth: '400px' }}>
          <div>
            <label>Default Input</label>
            <input className="input" type="text" placeholder="Enter text..." />
          </div>

          <div>
            <label>Focused Input (click to see)</label>
            <input className="input" type="text" placeholder="Click to focus..." />
          </div>

          <div>
            <label>Disabled Input</label>
            <input className="input" type="text" placeholder="Disabled..." disabled />
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* Cards */}
      <section style={{ marginBottom: 'var(--space-6)' }}>
        <h2>Cards</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-4)' }}>
          <div className="card">
            <h3>Basic Card</h3>
            <p className="text-secondary">This is a basic card with default styling</p>
          </div>

          <div className="card card-hover">
            <h3>Hoverable Card</h3>
            <p className="text-secondary">Hover over this card to see the effect</p>
          </div>

          <div className="card">
            <h3>Card with Badge</h3>
            <span className="badge">New</span>
            <p className="text-secondary">Cards can contain other components</p>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* Badges */}
      <section style={{ marginBottom: 'var(--space-6)' }}>
        <h2>Badges</h2>

        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <span className="badge">Default</span>
          <span className="badge">Label</span>
          <span className="badge">Status</span>
          <span className="badge">Count: 5</span>
        </div>
      </section>

      <div className="divider" />

      {/* Shadows */}
      <section style={{ marginBottom: 'var(--space-6)' }}>
        <h2>Shadows</h2>

        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          <div className="shadow-sm" style={{ padding: 'var(--space-4)', background: '#fff' }}>
            <p>Small Shadow</p>
          </div>

          <div className="shadow-md" style={{ padding: 'var(--space-4)', background: '#fff' }}>
            <p>Medium Shadow</p>
          </div>

          <div className="shadow-lg" style={{ padding: 'var(--space-4)', background: '#fff' }}>
            <p>Large Shadow</p>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* Text Utilities */}
      <section style={{ marginBottom: 'var(--space-6)' }}>
        <h2>Text Utilities</h2>

        <div style={{ maxWidth: '500px' }}>
          <p className="truncate-1">
            Single line truncation: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>

          <p className="truncate-2" style={{ marginTop: 'var(--space-2)' }}>
            Two line truncation: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
          </p>

          <p className="truncate-3" style={{ marginTop: 'var(--space-2)' }}>
            Three line truncation: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit.
          </p>
        </div>
      </section>

      <div className="divider" />

      {/* CSS Variables Test */}
      <section style={{ marginBottom: 'var(--space-6)' }}>
        <h2>CSS Variables (for developers)</h2>

        <div style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '12px' }}>
          <p>Open browser DevTools Console and run:</p>
          <pre style={{ background: 'var(--color-bg-subtle)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
{`getComputedStyle(document.documentElement).getPropertyValue('--color-bg')
getComputedStyle(document.documentElement).getPropertyValue('--color-text-primary')
getComputedStyle(document.body).fontFamily`}
          </pre>
        </div>
      </section>
    </div>
  );
}
