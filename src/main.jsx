import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './styles/index.css'
import App from './App.jsx'

// When deployed to static hosting (e.g. Supreme Center), redirect all /api/
// calls to the Render backend instead of the same origin.
const API_BASE = import.meta.env.VITE_API_BASE || '';
if (API_BASE) {
  const _fetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    if (typeof input === 'string' && input.startsWith('/api/')) {
      input = API_BASE + input;
    }
    return _fetch(input, init);
  };
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
