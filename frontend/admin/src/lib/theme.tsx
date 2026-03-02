"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { STORAGE_KEYS } from "./auth";

type ThemeMode = "light" | "dark";

interface ThemeContextValue {
  mode: ThemeMode;
  toggle: (e?: MouseEvent) => void;
}

const ThemeContext = createContext<ThemeContextValue>({ mode: "light", toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("light");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME) as ThemeMode | null;
    if (saved === "dark" || saved === "light") setMode(saved);
  }, []);

  const toggle = useCallback(() => {
    const next = mode === "light" ? "dark" : "light";

    const doc = document as any;
    if (doc.startViewTransition) {
      doc.startViewTransition(() => {
        flushSync(() => {
          setMode(next);
        });
        localStorage.setItem(STORAGE_KEYS.THEME, next);
      });
    } else {
      setMode(next);
      localStorage.setItem(STORAGE_KEYS.THEME, next);
    }
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  return useContext(ThemeContext);
}
