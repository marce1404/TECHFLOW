
'use client';
import { quotes } from '@/lib/motivational-quotes';
import './ticker-styles.css';
import { useTheme } from 'next-themes';

export default function MotivationalTicker() {
  const { theme } = useTheme();

  return (
    <div className={`ticker-wrap ${theme === 'dark' ? 'dark-theme' : ''} bg-primary text-primary-foreground`}>
      <div className="ticker">
        {quotes.map((quote, index) => (
          <div key={index} className="ticker__item">{quote}</div>
        ))}
        {quotes.map((quote, index) => (
            <div key={`duplicate-${index}`} className="ticker__item">{quote}</div>
        ))}
      </div>
    </div>
  );
}
