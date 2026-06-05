import { useCallback, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "local:mpc-theme";

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyThemeClass(mode: ThemeMode) {
  const resolved = mode === "system" ? getSystemTheme() : mode;
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>("system");

  useEffect(() => {
    storage.getItem<string>(STORAGE_KEY).then((saved) => {
      if (saved === "light" || saved === "dark" || saved === "system") {
        setTheme(saved);
      }
    });
  }, []);

  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  const changeTheme = useCallback((mode: ThemeMode) => {
    setTheme(mode);
    storage.setItem(STORAGE_KEY, mode);
  }, []);

  return { theme, changeTheme };
}
