import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { BrowserRouter } from 'react-router-dom'

// First visit this session: flag the intro before React renders, so the page and nav brand
// start hidden (see index.css) and nothing flashes before the intro overlay mounts.
try {
  if (!sessionStorage.getItem('sh-intro-played')) {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.documentElement.setAttribute('data-intro', reduced ? 'reduced' : 'full')
  }
} catch {
  // sessionStorage unavailable (e.g. privacy mode): skip the intro
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Match the deploy base path (e.g. /stackhacks on GitHub Pages; empty locally) */}
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <App />
    </BrowserRouter>
  </StrictMode>
)
