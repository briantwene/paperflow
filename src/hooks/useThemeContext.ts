import { createContext, useContext } from "react";
import { ThemeProviderState } from "../types/theme";

export const initialThemeState: ThemeProviderState = {
  theme: "system",
  effectiveTheme: "light",
  setTheme: () => null
};

export const ThemeProviderContext = createContext<ThemeProviderState>(initialThemeState);

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
