import React, { useState, useEffect } from 'react';

interface StreamingTextProps {
  text: string;
  onComplete?: () => void;
  className?: string;
}

export const StreamingText: React.FC<StreamingTextProps> = ({ 
  text, 
  onComplete,
  className = ""
}) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 20); // Faster typing speed

      return () => clearTimeout(timeout);
    } else if (onComplete && displayText.length === text.length) {
      onComplete();
    }
  }, [currentIndex, text, displayText.length, onComplete]);

  useEffect(() => {
    setDisplayText('');
    setCurrentIndex(0);
  }, [text]);

  return (
    <div className={className}>
      <div className="whitespace-pre-wrap leading-relaxed">
        {displayText}
        {currentIndex < text.length && (
          <span className="animate-pulse text-blue-600">|</span>
        )}
      </div>
    </div>
  );
};