"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";

export const READABLE_STORAGE_KEY = "readable-mode";
const READABLE_CLASS = "readable";

/**
 * Blocking inline script — mirrors next-themes' technique. Runs before paint
 * to add the `readable` class to <html> so there is no flash of unreadable
 * (branded/small) content on load. Injected in layout.tsx.
 */
export const READABLE_MODE_SCRIPT = `(function(){try{if(localStorage.getItem("${READABLE_STORAGE_KEY}")==="true"){document.documentElement.classList.add("${READABLE_CLASS}")}}catch(e){}})();`;

type ReadableModeContextValue = {
  readable: boolean;
  setReadable: (value: boolean) => void;
  toggleReadable: () => void;
};

const ReadableModeContext = createContext<ReadableModeContextValue | undefined>(
  undefined
);

export function ReadableModeProvider({ children }: PropsWithChildren) {
  // Start false to match SSR output; the blocking script may already have
  // added the class, so we reconcile from the DOM after mount (no flash,
  // no hydration mismatch since the toggle icon also starts in this state).
  const [readable, setReadableState] = useState(false);

  useEffect(() => {
    setReadableState(
      document.documentElement.classList.contains(READABLE_CLASS)
    );
  }, []);

  const setReadable = useCallback((value: boolean) => {
    setReadableState(value);
    const root = document.documentElement;
    root.classList.toggle(READABLE_CLASS, value);
    try {
      localStorage.setItem(READABLE_STORAGE_KEY, value ? "true" : "false");
    } catch {
      /* ignore storage errors (private mode, etc.) */
    }
  }, []);

  const toggleReadable = useCallback(() => {
    setReadable(!document.documentElement.classList.contains(READABLE_CLASS));
  }, [setReadable]);

  return (
    <ReadableModeContext.Provider
      value={{ readable, setReadable, toggleReadable }}
    >
      {children}
    </ReadableModeContext.Provider>
  );
}

export function useReadableMode() {
  const ctx = useContext(ReadableModeContext);
  if (!ctx) {
    throw new Error(
      "useReadableMode must be used within a ReadableModeProvider"
    );
  }
  return ctx;
}
