'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';

export type AttachedCodeContextData = {
  text: string;
  filePath?: string;
  language?: string;
  startLine?: number;
  endLine?: number;
  truncated?: boolean;
  createdAt: number;
};

type AttachedCodeContextValue = {
  attached: AttachedCodeContextData | null;
  attach: (data: Omit<AttachedCodeContextData, 'createdAt'>) => void;
  clear: () => void;
};

const AttachedCodeContext = createContext<AttachedCodeContextValue | null>(null);

export function AttachedCodeProvider({ children }: { children: React.ReactNode }) {
  const [attached, setAttached] = useState<AttachedCodeContextData | null>(null);

  const value = useMemo<AttachedCodeContextValue>(() => {
    return {
      attached,
      attach: (data) => {
        // Basic validation to avoid storing empty context
        const text = (data.text || '').trim();
        if (!text) return;

        setAttached({
          ...data,
          text,
          createdAt: Date.now(),
        });
      },
      clear: () => setAttached(null),
    };
  }, [attached]);

  return <AttachedCodeContext.Provider value={value}>{children}</AttachedCodeContext.Provider>;
}

export function useAttachedCode() {
  const ctx = useContext(AttachedCodeContext);
  if (!ctx) {
    throw new Error('useAttachedCode must be used inside <AttachedCodeProvider>');
  }
  return ctx;
}
