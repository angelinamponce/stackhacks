import { createRoot } from 'react-dom/client'
import '../index.css'
import OgCard from './OgCard'

const variant = new URLSearchParams(window.location.search).get('variant') || 'home'
createRoot(document.getElementById('root')).render(<OgCard variant={variant} />)
