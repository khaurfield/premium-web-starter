"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { ModelCatalog } from "@/lib/api/contracts";
import { fetchModelCatalog, toErrorInfo } from "@/lib/client/api";
import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  savePreferences,
  type Preferences,
} from "@/lib/client/preferences";
import {
  DEFAULT_PROFILE,
  loadProfile,
  saveProfile,
  type Profile,
} from "@/lib/client/profile";
import {
  clearStored,
  STORAGE_KEYS,
} from "@/lib/client/storage";
import {
  deriveTitle,
  EMPTY_STORE,
  loadConversationStore,
  newConversation,
  saveConversationStore,
  type ChatMessage,
  type Conversation,
  type ConversationStore,
} from "@/lib/client/conversations";

export type CatalogState =
  | { status: "loading" }
  | { status: "ready"; data: ModelCatalog }
  | { status: "error"; message: string };

interface AppContextValue {
  hydrated: boolean;
  storageError: string | null;

  preferences: Preferences;
  updatePreferences: (patch: Partial<Preferences>) => void;

  profile: Profile;
  updateProfile: (patch: Partial<Profile>) => void;

  resolvedTheme: "light" | "dark";

  store: ConversationStore;
  conversations: Conversation[];
  activeConversation: Conversation | null;
  selectConversation: (id: string) => void;
  createConversation: () => string;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  updateMessages: (
    id: string,
    updater: (messages: ChatMessage[]) => ChatMessage[],
  ) => void;
  clearAllData: () => void;

  catalog: CatalogState;
  refreshCatalog: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_WARNING =
  "Local storage is unavailable or full, so changes will not be saved on this device.";

export function AppProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [store, setStore] = useState<ConversationStore>(EMPTY_STORE);
  const [systemDark, setSystemDark] = useState(false);
  const [catalog, setCatalog] = useState<CatalogState>({ status: "loading" });
  const [catalogKey, setCatalogKey] = useState(0);

  const reportStorageFailure = useCallback(() => {
    queueMicrotask(() => setStorageError(STORAGE_WARNING));
  }, []);

  // Reading browser storage is an external-system sync. Defer the state writes
  // by one task so React does not produce a cascading synchronous render.
  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event: MediaQueryListEvent) =>
      setSystemDark(event.matches);
    const timer = window.setTimeout(() => {
      setPreferences(loadPreferences());
      setProfile(loadProfile());
      setStore(loadConversationStore());
      setSystemDark(query.matches);
      setHydrated(true);
    }, 0);
    query.addEventListener("change", onChange);
    return () => {
      window.clearTimeout(timer);
      query.removeEventListener("change", onChange);
    };
  }, []);

  const resolvedTheme: "light" | "dark" =
    preferences.theme === "system"
      ? systemDark
        ? "dark"
        : "light"
      : preferences.theme;

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.setAttribute("data-theme", resolvedTheme);
    document.documentElement.style.colorScheme = resolvedTheme;
    document.documentElement.dataset.fontScale = preferences.fontScale;
  }, [hydrated, resolvedTheme, preferences.fontScale]);

  useEffect(() => {
    if (!hydrated) return;
    if (!savePreferences(preferences)) reportStorageFailure();
  }, [hydrated, preferences, reportStorageFailure]);

  useEffect(() => {
    if (!hydrated) return;
    if (!saveProfile(profile)) reportStorageFailure();
  }, [hydrated, profile, reportStorageFailure]);

  // Streaming updates are frequent; debounce writes so localStorage is not hit
  // once per provider delta.
  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      if (!saveConversationStore(store)) reportStorageFailure();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [hydrated, store, reportStorageFailure]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    void (async () => {
      try {
        const data = await fetchModelCatalog(controller.signal);
        if (active) setCatalog({ status: "ready", data });
      } catch (cause) {
        if (!active || controller.signal.aborted) return;
        setCatalog({ status: "error", message: toErrorInfo(cause).message });
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, [catalogKey]);

  const updatePreferences = useCallback((patch: Partial<Preferences>) => {
    setPreferences((current) => ({ ...current, ...patch }));
  }, []);

  const updateProfile = useCallback((patch: Partial<Profile>) => {
    setProfile((current) => ({ ...current, ...patch }));
  }, []);

  const selectConversation = useCallback((id: string) => {
    setStore((current) =>
      current.conversations.some((item) => item.id === id)
        ? { ...current, activeId: id }
        : current,
    );
  }, []);

  const createConversation = useCallback((): string => {
    const conversation = newConversation();
    setStore((current) => ({
      ...current,
      conversations: [conversation, ...current.conversations].slice(0, 50),
      activeId: conversation.id,
    }));
    return conversation.id;
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setStore((current) => {
      const conversations = current.conversations.filter((item) => item.id !== id);
      return {
        ...current,
        conversations,
        activeId:
          current.activeId === id
            ? (conversations[0]?.id ?? null)
            : current.activeId,
      };
    });
  }, []);

  const renameConversation = useCallback((id: string, title: string) => {
    const clean = title.trim().slice(0, 80);
    if (!clean) return;
    setStore((current) => ({
      ...current,
      conversations: current.conversations.map((item) =>
        item.id === id
          ? { ...item, title: clean, updatedAt: new Date().toISOString() }
          : item,
      ),
    }));
  }, []);

  const updateMessages = useCallback(
    (id: string, updater: (messages: ChatMessage[]) => ChatMessage[]) => {
      setStore((current) => ({
        ...current,
        conversations: current.conversations.map((conversation) => {
          if (conversation.id !== id) return conversation;
          const messages = updater(conversation.messages).slice(-120);
          const firstUser = messages.find((message) => message.role === "user");
          const title =
            conversation.title === "New conversation" && firstUser
              ? deriveTitle(
                  firstUser.displayText ?? firstUser.content,
                  firstUser.attachments?.length ?? 0,
                )
              : conversation.title;
          return {
            ...conversation,
            messages,
            title,
            updatedAt: new Date().toISOString(),
          };
        }),
      }));
    },
    [],
  );

  const clearAllData = useCallback(() => {
    clearStored(...Object.values(STORAGE_KEYS));
    setPreferences(DEFAULT_PREFERENCES);
    setProfile(DEFAULT_PROFILE);
    setStore(EMPTY_STORE);
    setStorageError(null);
  }, []);

  const refreshCatalog = useCallback(() => {
    setCatalog({ status: "loading" });
    setCatalogKey((key) => key + 1);
  }, []);

  const conversations = useMemo(
    () =>
      [...store.conversations].sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt),
      ),
    [store.conversations],
  );

  const activeConversation = useMemo(
    () =>
      store.conversations.find((item) => item.id === store.activeId) ?? null,
    [store.conversations, store.activeId],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      hydrated,
      storageError,
      preferences,
      updatePreferences,
      profile,
      updateProfile,
      resolvedTheme,
      store,
      conversations,
      activeConversation,
      selectConversation,
      createConversation,
      deleteConversation,
      renameConversation,
      updateMessages,
      clearAllData,
      catalog,
      refreshCatalog,
    }),
    [
      hydrated,
      storageError,
      preferences,
      updatePreferences,
      profile,
      updateProfile,
      resolvedTheme,
      store,
      conversations,
      activeConversation,
      selectConversation,
      createConversation,
      deleteConversation,
      renameConversation,
      updateMessages,
      clearAllData,
      catalog,
      refreshCatalog,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside <AppProvider>.");
  return context;
}
