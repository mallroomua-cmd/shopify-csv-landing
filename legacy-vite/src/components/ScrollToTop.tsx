import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export const ScrollToTop: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 350);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Вгору"
      title="Прокрутити сторінку вгору"
      className="fixed bottom-20 sm:bottom-6 left-3 sm:left-6 z-30 w-10 h-10 bg-white hover:bg-black hover:text-white text-black hairline-all shadow-md flex items-center justify-center font-mono text-xs transition-all active:scale-95 animate-fade-in"
    >
      <ArrowUp className="w-4 h-4" />
    </button>
  );
};

export default ScrollToTop;
