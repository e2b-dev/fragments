import { useState, useEffect } from 'react'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function useRandomId() {
  const [randomId, setRandomId] = useState<string | null>(null);

  useEffect(() => {
    const storedId = localStorage.getItem('randomId');
    if (storedId) {
      setRandomId(storedId);
    } else {
      const newId = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('randomId', newId);
      setRandomId(newId);
    }
  }, []);

  return randomId;
}