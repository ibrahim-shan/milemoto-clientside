'use client';

import { useState, type ReactNode } from 'react';

import { motion } from 'framer-motion'; // <-- 1. Import motion

// (No changes to types)
type Tab = {
  label: string;
  content: ReactNode;
};
type Props = {
  tabs: Tab[];
  className?: string;
  contentClassName?: string;
};

export function Tabs({ tabs, className = '', contentClassName = '' }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className={className}>
      {/* Tab Navigation */}
      <nav
        // 2. Add `relative` for positioning the underline
        className="border-border/60 relative -mb-px flex space-x-6 border-b"
        aria-label="Tabs"
      >
        {tabs.map((tab, index) => (
          // 3. Change <Button> to a styled <button>
          <button
            key={tab.label}
            onClick={() => setActiveIndex(index)}
            aria-selected={activeIndex === index}
            role="tab"
            // 4. Add `relative` and new styles for the button itself
            className={`relative border-b-2 border-transparent px-1 py-4 text-sm font-medium transition-colors duration-150 ${
              activeIndex === index
                ? 'text-primary' // Active text
                : 'text-muted-foreground hover:text-foreground' // Inactive text
            } `}
          >
            {/* The text label */}
            {tab.label}

            {/* 5. The Animated Underline */}
            {activeIndex === index && (
              <motion.div
                layoutId="tab-underline" // This ID tells Framer to animate
                className="bg-primary absolute right-0 bottom-[-1px] left-0 h-0.5"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
          </button>
        ))}
      </nav>

      {/* Tab Content Panels (no changes here) */}
      <div className={contentClassName}>
        {tabs.map((tab, index) => (
          <div
            key={tab.label}
            role="tabpanel"
            aria-labelledby={`tab-${index}`}
            hidden={activeIndex !== index}
          >
            {activeIndex === index && tab.content}
          </div>
        ))}
      </div>
    </div>
  );
}
