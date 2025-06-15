import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useTheme } from "@/components/theme-provider";
import { useSettingsStore, useConnectionStore } from "@/lib/store";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

export type ProviderType = "reddit" | "wallhaven";

export type ProviderConnection = {
  type: ProviderType;
  isConnected: boolean;
  username?: string;
  sources: string[];
};

export type SettingsContextType = {
  theme: "dark" | "light" | "system";
  setTheme: (theme: "dark" | "light" | "system") => void;
  downloadLocation: string;
  setDownloadLocation: (path: string) => void;
  providers: ProviderConnection[];
  connectProvider: (provider: ProviderType, username?: string) => Promise<void>;
  disconnectProvider: (provider: ProviderType) => Promise<void>;
  addSource: (provider: ProviderType, source: string) => void;
  removeSource: (provider: ProviderType, source: string) => void;
  isAuthenticated: boolean;
  bypassAuth: boolean;
  setBypassAuth: (bypass: boolean) => void;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const { theme, setTheme: setAppTheme } = useTheme();
  const settingsStore = useSettingsStore();
  const connectionStore = useConnectionStore();
  
  const [providers, setProviders] = useState<ProviderConnection[]>([
    {
      type: "reddit",
      isConnected: false,
      sources: ["wallpapers", "wallpaper", "EarthPorn", "CityPorn"],
    },
    {
      type: "wallhaven",
      isConnected: false,
      sources: [],
    },
  ]);
  
  const [bypassAuth, setBypassAuth] = useState(false);

  // Sync providers with connection store
  useEffect(() => {
    setProviders(prev => prev.map(provider => {
      const connection = connectionStore.connections.find(
        conn => conn.name.toLowerCase() === provider.type
      );
      return {
        ...provider,
        isConnected: connection?.active || false,
        username: connection?.active ? "authenticated_user" : undefined
      };
    }));
  }, [connectionStore.connections]);

  const handleSetTheme = (newTheme: "dark" | "light" | "system") => {
    setAppTheme(newTheme);
    settingsStore.setTheme(newTheme);
  };

  const setDownloadLocation = async (path: string) => {
    try {
      await settingsStore.setDownloadPath(path);
    } catch (error) {
      console.error("Failed to set download location:", error);
    }
  };

  const connectProvider = async (provider: ProviderType, username?: string) => {
    try {
      const success = await connectionStore.connect(provider);
      if (success) {
        setProviders(prev => prev.map(p => 
          p.type === provider 
            ? { ...p, isConnected: true, username: username || "authenticated_user" }
            : p
        ));
      }
    } catch (error) {
      console.error(`Failed to connect to ${provider}:`, error);
    }
  };

  const disconnectProvider = async (provider: ProviderType) => {
    try {
      const success = await connectionStore.disconnect(provider);
      if (success) {
        setProviders(prev => prev.map(p => 
          p.type === provider 
            ? { ...p, isConnected: false, username: undefined }
            : p
        ));
      }
    } catch (error) {
      console.error(`Failed to disconnect from ${provider}:`, error);
    }
  };

  const addSource = (provider: ProviderType, source: string) => {
    setProviders(prev => prev.map(p => 
      p.type === provider 
        ? { ...p, sources: [...p.sources, source] }
        : p
    ));
  };

  const removeSource = (provider: ProviderType, source: string) => {
    setProviders(prev => prev.map(p => 
      p.type === provider 
        ? { ...p, sources: p.sources.filter(s => s !== source) }
        : p
    ));
  };

  const value: SettingsContextType = {
    theme,
    setTheme: handleSetTheme,
    downloadLocation: settingsStore.path,
    setDownloadLocation,
    providers,
    connectProvider,
    disconnectProvider,
    addSource,
    removeSource,
    isAuthenticated: connectionStore.isAuthenticated,
    bypassAuth,
    setBypassAuth,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
