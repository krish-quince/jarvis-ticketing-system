import { useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "auto";

export const useThemeMode = () => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem("theme-mode") as ThemeMode) || "auto";
  });

  const resolvedTheme = (() => {
    if (themeMode === "dark") return "dark";
    if (themeMode === "light") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  })();
  const isDark = resolvedTheme === "dark";

  const setThemeMode = (mode: ThemeMode) => {
    localStorage.setItem("theme-mode", mode);
    setThemeModeState(mode);
  };

  useEffect(() => {
    const applyTheme = (mode: string) => {
      const root = document.documentElement;
      root.classList.remove("dark-theme", "light-theme");
      if (mode === "dark") {
        root.classList.add("dark-theme");
      } else if (mode === "light") {
        root.classList.add("light-theme");
      } else {
        const isDarkSystem = window.matchMedia(
          "(prefers-color-scheme: dark)",
        ).matches;
        root.classList.add(isDarkSystem ? "dark-theme" : "light-theme");
      }
    };

    applyTheme(themeMode);

    if (themeMode === "auto") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent) => {
        const root = document.documentElement;
        root.classList.remove("dark-theme", "light-theme");
        root.classList.add(e.matches ? "dark-theme" : "light-theme");
      };
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [themeMode]);

  return { themeMode, setThemeMode, isDark };
};