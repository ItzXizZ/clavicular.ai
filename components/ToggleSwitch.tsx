'use client';

import { motion } from 'framer-motion';

interface ToggleSwitchProps {
  leftLabel: string;
  rightLabel: string;
  isRight: boolean;
  onChange: (isRight: boolean) => void;
  size?: 'sm' | 'md';
}

export default function ToggleSwitch({
  leftLabel,
  rightLabel,
  isRight,
  onChange,
  size = 'md'
}: ToggleSwitchProps) {
  const sizes = {
    sm: {
      track: 'w-10 h-5',
      thumb: 'w-4 h-4',
      translate: 'translateX(20px)',
      text: 'text-xs'
    },
    md: {
      track: 'w-11 h-6',
      thumb: 'w-5 h-5',
      translate: 'translateX(20px)',
      text: 'text-sm'
    }
  };

  const s = sizes[size];

  return (
    <div className="flex items-center gap-3">
      <span className={`${s.text} font-medium transition-colors duration-200 ${
        !isRight ? 'text-white' : 'text-zinc-500'
      }`}>
        {leftLabel}
      </span>
      
      <button
        onClick={() => onChange(!isRight)}
        className={`relative ${s.track} rounded-full transition-colors duration-200 ${
          isRight ? 'bg-[#22c55e]' : 'bg-zinc-700'
        }`}
        aria-label={`Toggle between ${leftLabel} and ${rightLabel}`}
      >
        <motion.div
          className={`absolute top-0.5 left-0.5 ${s.thumb} bg-white rounded-full shadow-md`}
          animate={{
            x: isRight ? 20 : 0
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30
          }}
        />
      </button>
      
      <span className={`${s.text} font-medium transition-colors duration-200 ${
        isRight ? 'text-white' : 'text-zinc-500'
      }`}>
        {rightLabel}
      </span>
    </div>
  );
}

