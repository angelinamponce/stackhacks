import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import SH from '/SH.png'

const Footer = () => {
  return (
    <footer className="w-full border-t border-white/[0.08] mt-auto relative z-[1]">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand & Mission Column */}
          <div className="md:col-span-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <img src={SH} alt="StackHacks Logo" className="w-7 h-7 object-contain" />
              <span className="font-semibold tracking-tight text-primary text-base">
                Stack<span className="text-accent">Hacks</span>
              </span>
            </div>
            <p className="text-secondary text-sm leading-relaxed max-w-md">
              A student-led tech collective at Binghamton University’s Thomas J. Watson College of Engineering and Applied Science. Building real-world applications, fostering technical leadership, and bridging academia to industry.
            </p>
            <div className="pt-2">
              <span className="text-xs text-secondary/60">
                Binghamton University &middot; Est. 2024
              </span>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="md:col-span-3 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Navigation
            </p>
            <ul className="space-y-2 text-sm text-secondary">
              <li>
                <Link to="/" className="hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/projects" className="hover:text-primary transition-colors">
                  Projects
                </Link>
              </li>
              <li>
                <Link to="/eboard" className="hover:text-primary transition-colors">
                  Executive Board
                </Link>
              </li>
              <li>
                <Link to="/events" className="hover:text-primary transition-colors">
                  Upcoming Events
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect Column */}
          <div className="md:col-span-3 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Connect
            </p>
            <ul className="space-y-2 text-sm text-secondary">
              <li>
                <a
                  href="https://www.linkedin.com/company/stackhacks/posts/?feedView=all"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-accent transition-colors"
                >
                  <span>LinkedIn</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/stackhacksbu/?hl=en"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-accent transition-colors"
                >
                  <span>Instagram</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/stackhacksbu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-accent transition-colors"
                >
                  <span>GitHub</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-secondary/60">
          <p>&copy; {new Date().getFullYear()} StackHacks. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer