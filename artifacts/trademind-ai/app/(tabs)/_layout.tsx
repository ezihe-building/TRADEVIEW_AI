import { Tabs, router } from "expo-router";
import { useAuth } from "@clerk/expo";
import React, { useEffect } from "react";
import { Platform, StyleSheet, View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

function TVTabIcon({ name, label, focused, colors }: { name: string; label: string; focused: boolean; colors: any }) {
  return (
    <View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}>
      <Feather name={name as any} size={20} color={focused ? colors.foreground : colors.mutedForeground} />
      <Text style={[tabStyles.label, { color: focused ? colors.foreground : colors.mutedForeground }]}>
        {label}
      </Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: { alignItems: "center", justifyContent: "center", gap: 3, paddingVertical: 6 },
  iconWrapActive: {},
  label: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
});

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/");
    }
  }, [isLoaded, isSignedIn]);

  const tabBarHeight = Platform.OS === "ios" ? 60 + insets.bottom : 60;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#1E222D",
          borderTopWidth: 1,
          borderTopColor: "#2A2E39",
          height: tabBarHeight,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TVTabIcon name="bookmark" label="Watchlist" focused={focused} colors={colors} />
          ),
        }}
      />
      <Tabs.Screen
        name="chart"
        options={{
          tabBarIcon: ({ focused }) => (
            <TVTabIcon name="trending-up" label="Chart" focused={focused} colors={colors} />
          ),
        }}
      />
      <Tabs.Screen
        name="markets"
        options={{
          tabBarIcon: ({ focused }) => (
            <TVTabIcon name="compass" label="Explore" focused={focused} colors={colors} />
          ),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          tabBarIcon: ({ focused }) => (
            <TVTabIcon name="users" label="Community" focused={focused} colors={colors} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => (
            <TVTabIcon name="menu" label="Menu" focused={focused} colors={colors} />
          ),
        }}
      />
      <Tabs.Screen
        name="analyzer"
        options={{ href: null }}
      />
    </Tabs>
  );
}
