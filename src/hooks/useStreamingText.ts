'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseStreamingTextOptions {
  text: string;
  speed?: number; // ms per word
  enabled?: boolean;
  onComplete?: () => void;
}

export function useStreamingText({ 
  text, 
  speed = 50, 
  enabled = true,
  onComplete 
}: UseStreamingTextOptions) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Split into words for more natural streaming
  const words = text.split(/(\s+)/);

  useEffect(() => {
    if (!enabled) {
      setDisplayedText(text);
      setIsComplete(true);
      return;
    }

    if (currentIndex >= words.length) {
      if (!isComplete) {
        setIsComplete(true);
        onComplete?.();
      }
      return;
    }

    const timer = setTimeout(() => {
      const nextText = words.slice(0, currentIndex + 1).join('');
      setDisplayedText(nextText);
      setCurrentIndex(prev => prev + 1);
    }, speed);

    return () => clearTimeout(timer);
  }, [currentIndex, words, speed, enabled, isComplete, onComplete]);

  // Reset when text changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
    setIsComplete(false);
  }, [text]);

  const skip = useCallback(() => {
    setDisplayedText(text);
    setCurrentIndex(words.length);
    setIsComplete(true);
  }, [text, words.length]);

  return {
    displayedText,
    isComplete,
    progress: currentIndex / words.length,
    skip,
  };
}
