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
  // Provider usernames for persistence
  providerUsernames: { [provider: string]: string };
  // Provider sources for persistence
  providerSources: { [provider: string]: string[] };
}

type ConnectionStatuses = { [key: string]: boolean };

type ConnectionState = {
  connections: ConnectionObject[];
  // Authentication state
  isAuthenticated: boolean;
  authenticatedProviders: string[];
  // Loading states
  isLoading: boolean;
  isConnecting: string | null; // Which provider is currently connecting
  // Methods
  fetchStatuses: () => Promise<void>;
  connect: (provider: string) => Promise<boolean>;
  disconnect: (provider: string) => Promise<boolean>;
  // Source management methods
  addSource: (provider: string, source: string) => void;
  removeSource: (provider: string, source: string) => void;
  updateSources: (provider: string, sources: string[]) => void;
  // Utility methods for access control
  hasProviderAccess: (provider: string) => boolean;
  hasAnyAccess: () => boolean;
  _hydrated: boolean;
};

export interface SettingsStore extends settingState {
  setDownloadPath: (path: string) => Promise<void>;
  setTheme: (theme: string) => Promise<void>;
  // Provider data management
  setProviderUsername: (provider: string, username: string) => Promise<void>;
  clearProviderUsername: (provider: string) => Promise<void>;
  setProviderSources: (provider: string, sources: string[]) => Promise<void>;
  _hydrated: boolean;
}

export const useSettingsStore = create<SettingsStore>()(
  devtools((set, get) => ({
    path: "raaa",
    theme: "reee",
    providerUsernames: {},
    providerSources: {},
    _hydrated: false,
    setDownloadPath: async (path) => {
      set({ path: path });
    },
    setTheme: async (theme) => {
      set({ theme: theme });
    },
    setProviderUsername: async (provider: string, username: string) => {
      const newUsernames = { ...get().providerUsernames, [provider]: username };
      set({ providerUsernames: newUsernames });
      await saveSettings({
        path: get().path,
        theme: get().theme,
        providerUsernames: newUsernames,
        providerSources: get().providerSources
      });
    },
    clearProviderUsername: async (provider: string) => {
      const newUsernames = { ...get().providerUsernames };
      delete newUsernames[provider];
      set({ providerUsernames: newUsernames });
      await saveSettings({
        path: get().path,
        theme: get().theme,
        providerUsernames: newUsernames,
        providerSources: get().providerSources
      });
    },
    setProviderSources: async (provider: string, sources: string[]) => {
      const newSources = { ...get().providerSources, [provider]: sources };
      set({ providerSources: newSources });
      await saveSettings({
        path: get().path,
        theme: get().theme,
        providerUsernames: get().providerUsernames,
        providerSources: newSources
      });
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
  const providerUsernames = await store.get("providerUsernames");
  const providerSources = await store.get("providerSources");

  const parsedPath = z.string().safeParse(path);
  const parsedTheme = z.string().safeParse(theme);
  const parsedUsernames = z.record(z.string()).safeParse(providerUsernames);
  const parsedSources = z
    .record(z.array(z.string()))
    .safeParse(providerSources);

  const updates: Partial<settingState> = {};

  if (parsedPath.success) {
    updates.path = parsedPath.data;
  }

  if (parsedTheme.success) {
    updates.theme = parsedTheme.data;
  }

  if (parsedUsernames.success) {
    updates.providerUsernames = parsedUsernames.data;
  } else {
    updates.providerUsernames = {};
  }

  if (parsedSources.success) {
    updates.providerSources = parsedSources.data;
  } else {
    updates.providerSources = {};
  }

  useSettingsStore.setState({
    ...updates,
    _hydrated: true
  });
};

export const useConnectionStore = create<ConnectionState>()(
  devtools(
    (set, get) => ({
      connections: ConnectionSettingsEnum.map(
        ({ name, src, connect, sources }) => ({
          name,
          src,
          connect,
          active: false,
          sources: sources || [],
          username: undefined
        })
      ),
      // Authentication state
      isAuthenticated: false,
      authenticatedProviders: [],
      // Loading states
      isLoading: false,
      isConnecting: null,
      _hydrated: false,
      fetchStatuses: async () => {
        set({ isLoading: true });
        try {
          // Use the new v2 command that returns a simple boolean
          const isRedditAuthenticated: boolean = await invoke(
            "check_reddit_auth_status_v2"
          );

          const newStatuses: ConnectionStatuses = {
            reddit: isRedditAuthenticated
          };

          console.log("statuses", newStatuses);
          // Update connections and authentication state
          const authenticatedProviders = Object.entries(newStatuses)
            .filter(([, isAuth]) => isAuth)
            .map(([provider]) => provider);

          const isAuthenticated = authenticatedProviders.length > 0;

          // Get persistent data from settings store
          const settingsStore = useSettingsStore.getState();

          set((state) => ({
            connections: state.connections.map((connection) => {
              const providerName = connection.name.toLowerCase();
              const isActive = newStatuses[providerName] || false;

              return {
                ...connection,
                active: isActive,
                username: isActive
                  ? settingsStore.providerUsernames[providerName]
                  : undefined,
                sources:
                  settingsStore.providerSources[providerName] ||
                  connection.sources ||
                  []
              };
            }),
            isAuthenticated,
            authenticatedProviders,
            isLoading: false,
            _hydrated: true
          }));
        } catch (error) {
          console.error("Failed to fetch auth statuses:", error);
          // Set all connections as inactive on error
          set((state) => ({
            connections: state.connections.map((connection) => ({
              ...connection,
              active: false,
              username: undefined
            })),
            isAuthenticated: false,
            authenticatedProviders: [],
            isLoading: false,
            _hydrated: true
          }));
        }
      },
      connect: async (provider: string) => {
        const connection = get().connections.find(
          (conn) => conn.name.toLowerCase() === provider.toLowerCase()
        );

        if (!connection) {
          console.error("Unsupported provider:", provider);
          return false;
        }

        set({ isConnecting: provider });

        try {
          const result: string = await invoke(connection.connect);
          console.log("Auth result:", result);

          // If Reddit, try to fetch username
          if (provider.toLowerCase() === "reddit") {
            try {
              const userInfo: { username: string } = await invoke(
                "get_reddit_user_info"
              );
              const settingsStore = useSettingsStore.getState();
              await settingsStore.setProviderUsername(
                "reddit",
                userInfo.username
              );
              console.log("Retrieved Reddit username:", userInfo.username);
            } catch (usernameError) {
              console.warn("Could not fetch Reddit username:", usernameError);
              // Continue without username - auth was successful
            }
          }

          // Refresh the connection statuses after successful authentication
          await get().fetchStatuses();
          return true;
        } catch (error) {
          console.error("Authentication failed:", error);
          return false;
        } finally {
          set({ isConnecting: null });
        }
      },
      disconnect: async (provider: string) => {
        set({ isConnecting: provider });

        try {
          if (provider.toLowerCase() === "reddit") {
            // Use the new v2 revoke command
            const result: string = await invoke("revoke_reddit_auth_v2");
            console.log("revoke result:", result);

            // Clear username on disconnect
            const settingsStore = useSettingsStore.getState();
            await settingsStore.clearProviderUsername("reddit");

            // Refresh the connection statuses
            await get().fetchStatuses();
            return true;
          } else {
            console.error("Unsupported provider:", provider);
            return false;
          }
        } catch (error) {
          console.error("Failed to disconnect from", provider, ":", error);
          // Still refresh statuses to reflect current state
          await get().fetchStatuses();
          return false;
        } finally {
          set({ isConnecting: null });
        }
      }, // Source management methods
      addSource: (provider: string, source: string) => {
        set((state) => ({
          connections: state.connections.map((connection) =>
            connection.name.toLowerCase() === provider.toLowerCase()
              ? {
                  ...connection,
                  sources: [...(connection.sources || []), source]
                }
              : connection
          )
        }));

        // Also persist to settings store
        const settingsStore = useSettingsStore.getState();
        const currentSources =
          settingsStore.providerSources[provider.toLowerCase()] || [];
        settingsStore.setProviderSources(provider.toLowerCase(), [
          ...currentSources,
          source
        ]);
      },

      removeSource: (provider: string, source: string) => {
        set((state) => ({
          connections: state.connections.map((connection) =>
            connection.name.toLowerCase() === provider.toLowerCase()
              ? {
                  ...connection,
                  sources: (connection.sources || []).filter(
                    (s) => s !== source
                  )
                }
              : connection
          )
        }));

        // Also remove from settings store
        const settingsStore = useSettingsStore.getState();
        const currentSources =
          settingsStore.providerSources[provider.toLowerCase()] || [];
        settingsStore.setProviderSources(
          provider.toLowerCase(),
          currentSources.filter((s) => s !== source)
        );
      },

      updateSources: (provider: string, sources: string[]) => {
        set((state) => ({
          connections: state.connections.map((connection) =>
            connection.name.toLowerCase() === provider.toLowerCase()
              ? { ...connection, sources }
              : connection
          )
        }));

        // Also update settings store
        const settingsStore = useSettingsStore.getState();
        settingsStore.setProviderSources(provider.toLowerCase(), sources);
      },

      // Utility methods for access control
      hasProviderAccess: (provider: string) => {
        const state = get();
        return state.authenticatedProviders.includes(provider.toLowerCase());
      },

      hasAnyAccess: () => {
        const state = get();
        return state.isAuthenticated;
      }
    }),
    { name: "connection-store" }
  )
);

// Initialize connection store
const loadConnectionStore = async () => {
  const store = useConnectionStore.getState();
  await store.fetchStatuses();
};

loadSettingsStore();
loadConnectionStore();

// Helper hooks for authentication access control
export const useAuthState = () => {
  const isAuthenticated = useConnectionStore((state) => state.isAuthenticated);
  const authenticatedProviders = useConnectionStore(
    (state) => state.authenticatedProviders
  );
  const isLoading = useConnectionStore((state) => state.isLoading);
  const hasAnyAccess = useConnectionStore((state) => state.hasAnyAccess);
  const hasProviderAccess = useConnectionStore(
    (state) => state.hasProviderAccess
  );

  return {
    isAuthenticated,
    authenticatedProviders,
    isLoading,
    hasAnyAccess,
    hasProviderAccess
  };
};

export const useConnectionActions = () => {
  const connect = useConnectionStore((state) => state.connect);
  const disconnect = useConnectionStore((state) => state.disconnect);
  const fetchStatuses = useConnectionStore((state) => state.fetchStatuses);
  const isConnecting = useConnectionStore((state) => state.isConnecting);
  const addSource = useConnectionStore((state) => state.addSource);
  const removeSource = useConnectionStore((state) => state.removeSource);
  const updateSources = useConnectionStore((state) => state.updateSources);

  return {
    connect,
    disconnect,
    fetchStatuses,
    isConnecting,
    addSource,
    removeSource,
    updateSources
  };
};
