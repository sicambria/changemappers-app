'use client';

import { useState } from 'react';
import { MessageSquareIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { FeedbackModal } from './FeedbackModal';
import { Z_CLASS } from '@/lib/z-index';

interface FeedbackButtonProps {
  enabled?: boolean;
  position?: 'bottom-right' | 'bottom-left';
}

export function FeedbackButton({ enabled = true, position = 'bottom-right' }: Readonly<FeedbackButtonProps>) {
  const [isOpen, setIsOpen] = useState(false);

  if (!enabled) return null;

  const positionClasses = position === 'bottom-right' ? 'bottom-6 right-6' : 'bottom-6 left-6';

  return (
    <>
      <div className={`fixed ${positionClasses} ${Z_CLASS.floatingButton}`}>
        <motion.button
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-3 px-5 py-3 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-2xl shadow-emerald-500/40 border border-white/20 backdrop-blur-sm group transition-all"
        >
          <div className="relative">
            <MessageSquareIcon className="w-5 h-5" />
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full border border-emerald-600"
            />
          </div>
          <span className="font-bold text-sm tracking-wide hidden sm:inline-block">
            Feedback
          </span>
        </motion.button>
      </div>

      <FeedbackModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
