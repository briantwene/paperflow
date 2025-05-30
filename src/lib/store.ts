import { invoke } from "@tauri-apps/api/core";
import { createStore } from "@tauri-apps/plugin-store";
import { create } from "zustand";
import { z } from "zod";
import { devtools } from "zustand/middleware";
import { ConnectionObject, ConnectionSettingsEnum } from "@/components/enums";

// Helper function to get the store instance
const getStore = () => createStore("settings.json", { autoSave: true });

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
    const newStatuses: ConnectionStatuses = await invoke("auth_status");
    console.log("statues", newStatuses);
    set((state) => ({
      connections: state.connections.map((connection) => ({
        ...connection,
        active: newStatuses[connection.name.toLowerCase()] || false
      }))
    }));
  },
  disconnect: async (provider: string) => {
    // call the disconnect function
    const revokeStatus: { message: string; status: string } = await invoke(
      "disconnect",
      { provider }
    );
    console.log("revoke", revokeStatus);

    if (revokeStatus.status == "error") {
      console.log("failed disconnect");
    } else {
      // then fetch the state again
      await get().fetchStatuses();
    }
  }
}));

loadSettingsStore();
