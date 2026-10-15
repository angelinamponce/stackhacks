import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import ScrollToTop from './components/ScrollToTop'
import { ScrollProgress } from './components/Interactive'
import CircuitBoard from './components/os/CircuitBoard'
import IntroSplash from './components/IntroSplash'
import { useScreenSections } from './lib/screenSections'
import Footer from './components/Footer'
import Home from './pages/Home'
import Projects from './pages/Projects'
import About from './pages/About'
import Eboard from './pages/Eboard'
import Events from './pages/Events'
import Contact from './pages/Contact'
import SanityRedirect from './pages/SanityRedirect'

function App() {
  const { pathname } = useLocation()
  useScreenSections(pathname)

  // Lets CSS pause decorative animations while the browser tab is hidden
  useEffect(() => {
    const sync = () => document.documentElement.toggleAttribute('data-tab-hidden', document.hidden)
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [])

  return (
    <div className="relative min-h-screen flex flex-col bg-background text-primary selection:bg-accent/30 selection:text-white">
      <IntroSplash />
      <CircuitBoard />
      <ScrollToTop />
      <Navbar />
      <ScrollProgress />

      <main className="relative z-[1] flex-grow pt-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/about" element={<About />} />
          <Route path="/eboard" element={<Eboard />} />
          <Route path="/events" element={<Events />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/sanity" element={<SanityRedirect />} />
          <Route path="/studio" element={<SanityRedirect />} />
        </Routes>
      </main>

      <Footer />
    </div>
  )
}

export default App