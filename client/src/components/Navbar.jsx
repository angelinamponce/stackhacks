import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import SH from '/SH.png'
import StaggeredMenu from './StaggeredMenu'

const menuItems = [
  { label: 'Projects', ariaLabel: 'View projects', link: '/projects' },
  { label: 'About',    ariaLabel: 'About us',       link: '/about' },
  { label: 'E-Board',  ariaLabel: 'View E-Board',   link: '/eboard' },
  { label: 'Community', ariaLabel: 'View community events', link: '/community' },
  { label: 'Events',   ariaLabel: 'View events',    link: '/events' },
  { label: 'Contact',  ariaLabel: 'Contact us',     link: '/contact' },
]

const Navbar = () => {
  // Slim nav: transparent over the hero, a subtle solid charcoal background once the page scrolls
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-[500] w-full">
      {/* Backdrop layer: only its opacity animates */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 -z-10 border-b border-white/[0.06] bg-[#0e0e0f]/92 backdrop-blur-md transition-opacity duration-500 ${scrolled ? 'opacity-100' : 'opacity-0'}`}
      />
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <NavLink
          to="/"
          data-nav-brand
          className="flex items-center gap-2.5 text-primary text-[15px] focus:outline-none"
        >
          <img src={SH} alt="StackHacks Logo" className="w-6 h-6 object-contain" />
          <span className="font-medium tracking-tight text-primary">
            Stack<span className="text-accent">Hacks</span>
          </span>
        </NavLink>

        {/* Desktop: small muted links, then one pill button */}
        <div className="hidden lg:flex items-center gap-8">
        <nav className="flex items-center gap-6" aria-label="Main Navigation">
          {menuItems.map((item) => (
            <NavLink
              key={item.link}
              to={item.link}
              className={({ isActive }) =>
                `group relative py-1 text-[13px] transition-colors duration-300 ${
                  isActive
                    ? 'text-primary'
                    : 'text-secondary hover:text-primary'
                }`
              }
            >
              {({ isActive }) => (
                <div className="relative flex flex-col items-center">
                  <span>{item.label}</span>
                  {/* Active link: a thin gold underline that slides between links */}
                  {isActive && (
                    <motion.span
                      layoutId="navbar-underline"
                      className="absolute -bottom-1 left-0 right-0 h-px bg-accent"
                      transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                    />
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </nav>
          <NavLink to="/community" className="btn-primary !px-4 !py-1.5 !text-[13px]">Join</NavLink>
        </div>

        {/* Mobile View with StaggeredMenu */}
        <div className="lg:hidden flex items-center">
          <StaggeredMenu
            position="right"
            items={menuItems}
            logoUrl={SH}
            colors={['var(--color-accent)', 'var(--color-tertiary)']}
            menuButtonColor="var(--color-secondary)"
            displaySocials={false}
            displayItemNumbering={false}
            closeOnClickAway={true}
          />
        </div>
      </div>
    </header>
  )
}

export default Navbar
