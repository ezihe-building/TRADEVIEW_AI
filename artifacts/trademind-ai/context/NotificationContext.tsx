import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowAlert: true,
    shouldShowList: true,
  }),
});

interface NotificationPrefs {
  enabled: boolean;
  marketMovements: boolean;
  aiSignals: boolean;
  newsAlerts: boolean;
  priceAlerts: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  enabled: false,
  marketMovements: true,
  aiSignals: true,
  newsAlerts: true,
  priceAlerts: false,
};

interface NotificationContextValue {
  prefs: NotificationPrefs;
  updatePrefs: (updates: Partial<NotificationPrefs>) => Promise<void>;
  requestPermission: () => Promise<boolean>;
  sendLocalNotification: (title: string, body: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

const STORAGE_KEY = "@trademind_notif_prefs";

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as NotificationPrefs;
          setPrefs(parsed);
        } catch {}
      }
    });
  }, []);

  async function updatePrefs(updates: Partial<NotificationPrefs>) {
    const next = { ...prefs, ...updates };
    setPrefs(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  async function requestPermission(): Promise<boolean> {
    if (Platform.OS === "web") return false;
    try {
      const { status: existing } = await Notifications.getPermissionsAsync();
      if (existing === "granted") {
        await updatePrefs({ enabled: true });
        return true;
      }
      const { status } = await Notifications.requestPermissionsAsync();
      const granted = status === "granted";
      await updatePrefs({ enabled: granted });
      return granted;
    } catch {
      return false;
    }
  }

  async function sendLocalNotification(title: string, body: string) {
    if (Platform.OS === "web") return;
    if (!prefs.enabled) return;
    try {
      await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: true },
        trigger: null,
      });
    } catch {}
  }

  return (
    <NotificationContext.Provider value={{ prefs, updatePrefs, requestPermission, sendLocalNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationProvider");
  return ctx;
}
