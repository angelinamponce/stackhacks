import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Send, Mail, MapPin, Loader2 } from "lucide-react"
import Modal from '../components/Modal'
import FAQ from '../components/FAQ'

const Contact = () => {
  const [result, setResult] = useState("")
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const faqRef = useRef(null)

  const scrollToFAQ = () => {
    faqRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const submitForm = async (event) => {
    event.preventDefault()
    setLoading(true)

    const formData = new FormData(event.target)
    formData.append("access_key", "a47c824e-36f7-494b-aca9-73233e59fff7")

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      })
      const data = await response.json()
      setResult(data.success ? "Message sent successfully! Our team will get back to you soon." : "There was an error sending your message. Please try again.")
    } catch {
      setResult("Unable to reach the server. Please check your connection and try again.")
    } finally {
      setLoading(false)
      setOpen(true)
      event.target.reset()
    }
  }

  return (
    <div className="w-full">
      <div data-circuit-section className="screen-section max-w-6xl mx-auto px-6">
        <div className="min-h-[70vh] grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Editorial Copy & Context */}
          <motion.div 
            className="lg:col-span-5 space-y-6"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }} 
          >
            <p className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-accent mb-2">
              Get In Touch
            </p>

            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-primary leading-[1.15]">
              Any questions <br />
              <span className="text-accent">for our team?</span>
            </h1>

            <p className="text-secondary text-base leading-relaxed">
              Have questions about project tracks, executive board applications, partnerships, or upcoming workshops? Leave a message and our team will get back to you promptly.
            </p>

            <div className="pt-4 space-y-3.5 border-t border-white/[0.08]">
              <div className="flex items-center gap-3 text-sm text-secondary">
                <MapPin className="w-4 h-4 text-accent shrink-0" />
                <span>Binghamton University &middot; Watson College</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-secondary">
                <Mail className="w-4 h-4 text-accent shrink-0" />
                <span>stackhacksbu@gmail.com</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Architectural Form Card */}
          <motion.div
            className="lg:col-span-7"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <div className="tech-card p-6 sm:p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

              <form className="space-y-5 relative z-10" onSubmit={submitForm}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs uppercase tracking-wider text-secondary font-medium">
                      Your Name <span className="text-accent">*</span>
                    </label>
                    <input
                      required
                      className="input"
                      name="name"
                      type="text"
                      placeholder="e.g. David Ponce"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs uppercase tracking-wider text-secondary font-medium">
                      Email Address <span className="text-accent">*</span>
                    </label>
                    <input
                      required
                      className="input"
                      name="email"
                      type="email"
                      placeholder="e.g. user@binghamton.edu"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs uppercase tracking-wider text-secondary font-medium">
                    Message <span className="text-accent">*</span>
                  </label>
                  <textarea
                    required
                    className="input resize-none"
                    name="message"
                    rows="5"
                    placeholder="Tell us about your background, questions, or what you'd like to collaborate on..."
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full sm:w-auto"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending Message...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Message</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <span className="text-xs text-secondary/60">
                    We usually respond within 24–48 hours.
                  </span>
                </div>
              </form>
            </div>
          </motion.div>

        </div>

        {/* Transition indicator to FAQ */}
        <motion.div 
          onClick={scrollToFAQ}
          className="cursor-pointer flex flex-col items-center gap-2 pt-16 group mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <span className="text-secondary/70 text-xs uppercase tracking-wider group-hover:text-primary transition-colors">
            Frequently Asked Questions
          </span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="text-secondary/70 group-hover:text-accent transition-colors" size={20} />
          </motion.div>
        </motion.div>
      </div>

      {/* FAQ SECTION */}
      <div ref={faqRef} data-circuit-section className="scroll-mt-16 border-t border-white/[0.08] bg-white/[0.01]">
        <FAQ />
      </div>

      <AnimatePresence>
        {open && <Modal result={result} closeModal={() => setOpen(false)} />}
      </AnimatePresence>
    </div> 
  )
}

export default Contact