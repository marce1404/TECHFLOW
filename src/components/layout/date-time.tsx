
'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function DateTime() {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    // Set initial date to avoid hydration mismatch, then start the interval.
    setCurrentDateTime(new Date());
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000); // Update every second

    return () => {
      clearInterval(timer); // Cleanup on component unmount
    };
  }, []);

  // To prevent hydration errors, we can return a placeholder or null on the initial server render
  if (typeof window === 'undefined') {
    return null;
  }
  
  const formattedDateTime = format(currentDateTime, "EEEE, d 'de' MMMM 'de' yyyy - HH:mm:ss", { locale: es });

  return (
    <div className="hidden text-right text-sm text-muted-foreground md:block">
      <div className="font-medium capitalize">{formattedDateTime}</div>
    </div>
  );
}
