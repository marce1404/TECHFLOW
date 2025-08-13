
'use client';
import { quotes } from '@/lib/motivational-quotes';
import './ticker-styles.css';

export default function MotivationalTicker() {

  return (
    <div className="ticker-wrap bg-primary text-primary-foreground">
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
