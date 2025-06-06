import { invoke } from "@tauri-apps/api/core";
import { load } from "@tauri-apps/plugin-store";
import { create } from "zustand";
import { z } from "zod";
import { devtools } from "zustand/middleware";
import { ConnectionObject, ConnectionSettingsEnum } from "@/components/enums";

// Helper function to get the store instance
const getStore = async () => await load("settings.json", { autoSave: true });

// original idea: https://youtu.be/CzkIGF3Z7qA

interface settingState {
  path: string;
  theme: string;
}

type ConnectionStatuses = { [key: string]: boolean };

type ConnectionState = {
  connections: ConnectionObject[];
  fetchStatuses: () => Promise<void>;
  disconnect: (provider: string) => Promise<void>;
};

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

  const store = await getStore();
  const stateKeys = Object.keys(newState);

  for (const key of stateKeys) {
    await store.set(key, newState[key as keyof settingState]);
  }

  await store.save();
};

const loadSettingsStore = async () => {
  const store = await getStore();
  const path = await store.get("path");
  const theme = await store.get("theme");

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

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  connections: ConnectionSettingsEnum.map(({ name, src, connect }) => ({
    name,
    src,
    connect,
    active: false
  })),
  fetchStatuses: async () => {
    try {
      // Use the new v2 command that returns a simple boolean
      const isRedditAuthenticated: boolean = await invoke(
        "check_reddit_auth_status_v2"
      );

      const newStatuses: ConnectionStatuses = {
        reddit: isRedditAuthenticated
      };

      console.log("statuses", newStatuses);
      set((state) => ({
        connections: state.connections.map((connection) => ({
          ...connection,
          active: newStatuses[connection.name.toLowerCase()] || false
        }))
      }));
    } catch (error) {
      console.error("Failed to fetch auth statuses:", error);
      // Set all connections as inactive on error
      set((state) => ({
        connections: state.connections.map((connection) => ({
          ...connection,
          active: false
        }))
      }));
    }
  },
  disconnect: async (provider: string) => {
    try {
      if (provider.toLowerCase() === "reddit") {
        // Use the new v2 revoke command
        const result: string = await invoke("revoke_reddit_auth_v2");
        console.log("revoke result:", result);

        // Refresh the connection statuses
        await get().fetchStatuses();
      } else {
        console.error("Unsupported provider:", provider);
      }
    } catch (error) {
      console.error("Failed to disconnect from", provider, ":", error);
      // Still refresh statuses to reflect current state
      await get().fetchStatuses();
    }
  }
}));

loadSettingsStore();
