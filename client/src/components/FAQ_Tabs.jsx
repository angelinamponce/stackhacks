import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'

export const FAQ_Tabs = ({ 
  title = "Frequently Asked Questions",
  subtitle = "Learn More About StackHacks",
  categories,
  faqData,
  className = "",
  ...props 
}) => {
  const categoryKeys = Object.keys(categories)
  const [selectedCategory, setSelectedCategory] = useState(categoryKeys[0] || "")

  return (
    <section 
      className={`relative w-full max-w-6xl mx-auto py-20 px-6 ${className}`}
      {...props}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        
        {/* Left Column: Eyebrow, Title & Category Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="lg:col-span-4 space-y-6"
        >
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">
              {subtitle}
            </span>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-primary mt-2">
              {title}
            </h2>
          </div>

          <FAQTabs 
            categories={categories}
            selected={selectedCategory} 
            setSelected={setSelectedCategory} 
          />
        </motion.div>

        {/* Right Column: Accordion List */}
        <div className="lg:col-span-8">
          <FAQList 
            faqData={faqData}
            selected={selectedCategory} 
          />
        </div>
      </div>
    </section>
  )
}

const FAQTabs = ({ categories, selected, setSelected }) => (
  <div className="flex flex-col gap-2">
    {Object.entries(categories).map(([key, label]) => {
      const isSelected = selected === key
      return (
        <button
          key={key}
          onClick={() => setSelected(key)}
          type="button"
          className={`text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 cursor-pointer ${
            isSelected
              ? "bg-accent/10 border-accent/60 text-accent shadow-[inset_0_0_0_1px_rgba(254,178,58,0.2)]"
              : "bg-white/[0.02] border-white/10 text-secondary hover:border-white/20 hover:text-primary hover:bg-white/[0.05]"
          }`}
        >
          {label}
        </button>
      )
    })}
  </div>
)

const FAQList = ({ faqData, selected }) => (
  <div className="w-full">
    <AnimatePresence mode="wait">
      <motion.div
        key={selected}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.3 }}
        className="space-y-3"
      >
        {faqData[selected]?.map((faq, index) => (
          <FAQItem key={index} {...faq} />
        ))}
      </motion.div>
    </AnimatePresence>
  </div>
)

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        isOpen 
          ? "bg-white/[0.04] border-accent/40 shadow-[0_4px_24px_rgba(0,0,0,0.3)]" 
          : "bg-white/[0.02] border-white/10 hover:border-white/20"
      }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        className="flex w-full items-center justify-between gap-4 p-5 text-left cursor-pointer focus:outline-none"
      >
        <span className={`text-base font-medium tracking-tight transition-colors ${isOpen ? "text-primary font-semibold" : "text-primary/90"}`}>
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className={`shrink-0 p-1 rounded-full ${isOpen ? "text-accent bg-accent/10" : "text-secondary"}`}
        >
          <Plus size={18} />
        </motion.div>
      </button>
      
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1 text-secondary text-sm leading-relaxed border-t border-white/[0.06] mt-1">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
