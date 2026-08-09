/**
 * Typewriter Component
 * Displays text with a word-by-word typing animation effect
 */

import React, { useState, useEffect } from 'react';
import { useReducedMotion } from "framer-motion";

export interface TypewriterProps {
  text: string;
  delay: number;
}

export function Typewriter({ text, delay }: TypewriterProps): React.ReactElement {
  const [currentText, setCurrentText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) {
      return undefined;
    }

    const words = text.split(' ');
    if (currentIndex < words.length) {
      const timeout = setTimeout(() => {
        setCurrentText((prevText) => prevText + words[currentIndex] + ' ');
        setCurrentIndex((prevIndex) => prevIndex + 1);
      }, delay);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, delay, shouldReduceMotion, text]);

  return (
    <span data-testid="typewriter-text">
      {shouldReduceMotion ? text : currentText}
    </span>
  );
}
