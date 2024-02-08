import { Store } from "tauri-plugin-store-api";
import { create } from "zustand";
import { z } from "zod";
import { devtools } from "zustand/middleware";

const tauriStore = new Store("settings.json");

// original idea: https://youtu.be/CzkIGF3Z7qA

interface settingState {
  path: string;
  theme: string;
}

export interface SettingsStore extends settingState {
  setDownloadPath: (path: string) => Promise<void>;
  setTheme: (theme: string) => Promise<void>;
  _hydrated: boolean;
}

export const useSettingsStore = create<SettingsStore>()(
  devtools((set) => ({
    path: "raaa",
    theme: "reee",
    _hydrated: false,
    setDownloadPath: async (path) => {
      set({ path: path });
    },
    setTheme: async (theme) => {
      set({ theme: theme });
    }
  }))
);

export const saveSettings = async (newState: settingState) => {
  //update the settings in the tauri store
  //then save the file
  await useSettingsStore.setState(newState);

  const stateKeys = Object.keys(newState);

  for (const key of stateKeys) {
    await tauriStore.set(key, newState[key as keyof settingState]);
  }

  await tauriStore.save();
};

const loadSettingsStore = async () => {
  await tauriStore.load();
  const path = await tauriStore.get("path");
  const theme = await tauriStore.get("theme");

  const parsedPath = z.string().safeParse(path);
  const parsedTheme = z.string().safeParse(theme);

  if (parsedPath.success) {
    useSettingsStore.setState({
      path: parsedPath.data
    });
  }

  if (parsedTheme.success) {
    useSettingsStore.setState({
      theme: parsedTheme.data
    });
  }

  useSettingsStore.setState({
    _hydrated: true
  });
};

loadSettingsStore();
