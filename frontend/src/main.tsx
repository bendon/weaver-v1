import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Register service worker for PWA (optional, won't break app if it fails)
// This is done asynchronously so it doesn't block app rendering
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  import('virtual:pwa-register')
    .then(({ registerSW }) => {
      registerSW({
        immediate: true,
        onRegisteredSW(swScriptUrl) {
          console.log('SW Registered: ', swScriptUrl)
        },
        onRegisterError(error) {
          console.error('SW registration error', error)
        },
      })
    })
    .catch((error) => {
      // Silently fail if PWA registration isn't available
      console.warn('PWA registration not available:', error)
    })
}

// Ensure root element exists before rendering
const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found. Make sure index.html has a <div id="root"></div> element.')
}

// Render the app
try {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
  console.log('App rendered successfully')
} catch (error) {
  console.error('Failed to render app:', error)
  // Show error message in the DOM
  rootElement.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif;">
      <h1>Error loading application</h1>
      <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
      <p>Please check the console for more details.</p>
    </div>
  `
}

