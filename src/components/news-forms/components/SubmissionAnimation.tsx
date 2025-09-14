import { useState, useEffect } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';

interface SubmissionAnimationProps {
  isSubmitting: boolean;
  isSubmitted: boolean;
  onComplete?: () => void;
}

export const SubmissionAnimation = ({ isSubmitting, isSubmitted, onComplete }: SubmissionAnimationProps) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isSubmitted) {
      setShowConfetti(true);
      const timer = setTimeout(() => {
        setShowConfetti(false);
        onComplete?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSubmitted, onComplete]);

  if (!isSubmitting && !isSubmitted) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 max-w-sm mx-4 text-center relative overflow-hidden">
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-red-500 rounded-full animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random()}s`
                }}
              />
            ))}
          </div>
        )}
        
        <div className="relative z-10">
          {isSubmitting ? (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Submitting your form...
              </h3>
              <p className="text-gray-600">
                Please wait while we process your submission.
              </p>
            </>
          ) : isSubmitted ? (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Success! 🎉
              </h3>
              <p className="text-gray-600">
                Your form has been submitted successfully. Thank you for signing up!
              </p>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};