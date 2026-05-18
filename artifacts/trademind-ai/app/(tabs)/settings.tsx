import React, { useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth, useUser } from "@clerk/expo";
import { useColors } from "@/hooks/useColors";
import { useAnalysis } from "@/context/AnalysisContext";
import { useSubscription } from "@/context/SubscriptionContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

function open(url: string) {
  Linking.openURL(url).catch(() =>
    Alert.alert("Could not open link", url)
  );
}

function openEmail(to: string, subject: string) {
  open(`mailto:${to}?subject=${encodeURIComponent(subject)}`);
}

function openStore() {
  if (Platform.OS === "ios") {
    open("https://apps.apple.com/app/trademind-ai");
  } else {
    open("https://play.google.com/store/apps/details?id=com.trademindai.app");
  }
}

export default function MenuScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { analyses, clearHistory } = useAnalysis();
  const { plan, isPro, isBase, scansRemaining, cancelSubscription } = useSubscription();
  const { signOut } = useAuth();
  const { user } = useUser();
  const topInset = Platform.OS === "web" ? 0 : insets.top;

  const [notifMarket, setNotifMarket] = useState(true);
  const [notifSignals, setNotifSignals] = useState(true);
  const [notifNews, setNotifNews] = useState(true);
  const [notifPrice, setNotifPrice] = useState(false);

  const [connectModal, setConnectModal] = useState<{ name: string; keyLabel: string; secretLabel: string } | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [saving, setSaving] = useState(false);

  const [showAbout, setShowAbout] = useState(false);

  const planLabel = plan.tier === "pro" ? "Pro" : plan.tier === "base" ? "Base" : "Free";
  const planColor = plan.tier === "pro" ? colors.primary : plan.tier === "base" ? colors.accent : colors.mutedForeground;
  const displayName = user?.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : "Trader";
  const email = user?.emailAddresses[0]?.emailAddress ?? "";
  const initial = displayName[0]?.toUpperCase() ?? "T";

  async function handleSignOut() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await signOut();
          } catch {}
          finally {
            router.replace("/");
          }
        },
      },
    ]);
  }

  async function saveConnection() {
    if (!apiKey.trim()) {
      Alert.alert("Required", "Please enter an API key.");
      return;
    }
    setSaving(true);
    await AsyncStorage.setItem(
      `@trademind_conn_${connectModal?.name}`,
      JSON.stringify({ apiKey: apiKey.trim(), apiSecret: apiSecret.trim(), connectedAt: Date.now() })
    );
    setSaving(false);
    setApiKey("");
    setApiSecret("");
    setConnectModal(null);
    Alert.alert("Connected!", `${connectModal?.name} account linked successfully.`);
  }

  const TRADING_ACCOUNTS = [
    {
      name: "Binance",
      icon: "link",
      desc: "Connect via API key",
      keyLabel: "Binance API Key",
      secretLabel: "Binance Secret Key",
    },
    {
      name: "Bybit",
      icon: "link",
      desc: "Connect via API key",
      keyLabel: "Bybit API Key",
      secretLabel: "Bybit Secret Key",
    },
    {
      name: "TradingView",
      icon: "bar-chart-2",
      desc: "Sync watchlist & alerts",
      keyLabel: "TradingView Username",
      secretLabel: "Session Token (optional)",
    },
    {
      name: "MetaTrader",
      icon: "server",
      desc: "MT4 / MT5 via broker API",
      keyLabel: "Broker API URL",
      secretLabel: "Broker API Key",
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: topInset + 16, paddingBottom: 120 }]}
      >
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Menu</Text>

        <TouchableOpacity
          style={[styles.signInRow, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => Alert.alert("Account", `Signed in as ${email || "user"}`)}
          activeOpacity={0.8}
        >
          <View style={[styles.avatar, { backgroundColor: colors.primary + "22" }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>{initial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.signInName, { color: colors.foreground }]}>{displayName}</Text>
            <Text style={[styles.signInEmail, { color: colors.mutedForeground }]}>{email}</Text>
          </View>
          <View style={[styles.planPill, { backgroundColor: planColor + "22", borderColor: planColor + "44" }]}>
            <Text style={[styles.planPillText, { color: planColor }]}>{planLabel}</Text>
          </View>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>

        <View style={styles.twoCol}>
          <TouchableOpacity
            style={[styles.twoColCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push("/subscription")}
            activeOpacity={0.8}
          >
            <Feather name="zap" size={22} color={colors.primary} />
            <Text style={[styles.twoColTitle, { color: colors.foreground }]}>Subscription</Text>
            <Text style={[styles.twoColDesc, { color: colors.mutedForeground }]}>
              {isPro ? "Pro active" : isBase ? "Base active" : "Get the full power"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.twoColCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => Alert.alert("Refer a Friend", "Share TradeMind AI with friends!\n\nYour referral link:\nhttps://trademindai.com/ref/you\n\nBoth you and your friend get 1 week free Base plan.")}
            activeOpacity={0.8}
          >
            <Feather name="user-plus" size={22} color={colors.accent} />
            <Text style={[styles.twoColTitle, { color: colors.foreground }]}>Refer a friend</Text>
            <Text style={[styles.twoColDesc, { color: colors.mutedForeground }]}>Share what you love</Text>
          </TouchableOpacity>
        </View>

        {!isPro && (
          <TouchableOpacity
            style={[styles.trialBanner, { backgroundColor: colors.primary + "11", borderColor: colors.primary + "22" }]}
            onPress={() => router.push("/subscription")}
            activeOpacity={0.85}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.trialTitle, { color: colors.foreground }]}>Start free trial</Text>
              <Text style={[styles.trialSub, { color: colors.mutedForeground }]}>
                Get unlimited AI analysis with Pro
              </Text>
            </View>
            <View style={[styles.trialBadge, { backgroundColor: colors.primary }]}>
              <Feather name="zap" size={20} color="#000" />
            </View>
          </TouchableOpacity>
        )}

        <MenuSection label="ACCOUNT" colors={colors} />
        <MenuCard colors={colors}>
          <MenuItem
            icon="user" label="Edit Profile"
            onPress={() => Alert.alert("Edit Profile", `Name: ${displayName}\nEmail: ${email}\n\nProfile editing coming in v1.1.`)}
            colors={colors}
          />
          <Div colors={colors} />
          <MenuItem
            icon="lock" label="Change Password"
            onPress={() => {
              Alert.alert(
                "Change Password",
                "A password reset email will be sent to:\n" + email,
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Send Email", onPress: () => Alert.alert("Sent!", "Check your inbox for the reset link.") },
                ]
              );
            }}
            colors={colors}
          />
          <Div colors={colors} />
          <MenuItem
            icon="shield" label="Two-Factor Authentication"
            onPress={() => Alert.alert("2FA", "Two-factor authentication can be managed at:\n\nclerk.trademindai.com/user/security")}
            colors={colors}
          />
        </MenuCard>

        <MenuSection label="SUBSCRIPTION" colors={colors} />
        <MenuCard colors={colors}>
          <MenuItem
            icon="zap" label={isPro ? "Manage Pro Plan" : isBase ? "Upgrade to Pro" : "Upgrade Plan"}
            sublabel={isPro ? "Unlimited · Active" : isBase ? `${scansRemaining} scans left today` : `${scansRemaining} free scans left`}
            badge={!isPro ? "Upgrade" : undefined}
            badgeColor={colors.primary}
            onPress={() => router.push("/subscription")}
            colors={colors}
          />
          {(isPro || isBase) && (
            <>
              <Div colors={colors} />
              <MenuItem
                icon="x-circle" label="Cancel Subscription"
                onPress={() => {
                  Alert.alert(
                    "Cancel Subscription",
                    "Your plan will revert to Free at the end of the billing period.",
                    [
                      { text: "Keep Plan", style: "cancel" },
                      {
                        text: "Cancel",
                        style: "destructive",
                        onPress: () => { cancelSubscription(); Alert.alert("Cancelled", "Plan reverted to Free."); },
                      },
                    ]
                  );
                }}
                colors={colors}
              />
            </>
          )}
        </MenuCard>

        <MenuSection label="NOTIFICATIONS" colors={colors} />
        <MenuCard colors={colors}>
          <ToggleRow icon="activity" label="Market Movements" desc="Big price change alerts" value={notifMarket} onChange={setNotifMarket} colors={colors} />
          <Div colors={colors} />
          <ToggleRow icon="cpu" label="AI Trade Signals" desc="New signal ready" value={notifSignals} onChange={setNotifSignals} colors={colors} />
          <Div colors={colors} />
          <ToggleRow icon="rss" label="Market News" desc="Breaking crypto & forex news" value={notifNews} onChange={setNotifNews} colors={colors} />
          <Div colors={colors} />
          <ToggleRow icon="bell" label="Price Alerts" desc="Custom price targets" value={notifPrice} onChange={setNotifPrice} colors={colors} />
        </MenuCard>

        <MenuSection label="CONNECTED ACCOUNTS" colors={colors} />
        <MenuCard colors={colors}>
          {TRADING_ACCOUNTS.map((acc, i, arr) => (
            <View key={acc.name}>
              <MenuItem
                icon={acc.icon as any}
                label={acc.name}
                sublabel={acc.desc}
                badge="Connect"
                badgeColor={colors.accent}
                onPress={() => {
                  setApiKey("");
                  setApiSecret("");
                  setConnectModal(acc);
                }}
                colors={colors}
              />
              {i < arr.length - 1 && <Div colors={colors} />}
            </View>
          ))}
        </MenuCard>

        <MenuSection label="AI ANALYSIS HISTORY" colors={colors} />
        <MenuCard colors={colors}>
          <MenuItem
            icon="clock"
            label="View All Analyses"
            sublabel={`${analyses.length} total analyses`}
            onPress={() => router.push("/(tabs)/journal" as any)}
            colors={colors}
          />
          {analyses.length > 0 && (
            <>
              <Div colors={colors} />
              <MenuItem
                icon="trash-2"
                label="Clear History"
                sublabel="Remove all saved analyses"
                onPress={() => {
                  Alert.alert(
                    "Clear History",
                    "Remove all analyzed charts? This cannot be undone.",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Clear All",
                        style: "destructive",
                        onPress: async () => {
                          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                          clearHistory();
                          Alert.alert("Cleared", "All analysis history removed.");
                        },
                      },
                    ]
                  );
                }}
                colors={colors}
              />
            </>
          )}
        </MenuCard>

        <MenuSection label="SUPPORT" colors={colors} />
        <MenuCard colors={colors}>
          <MenuItem
            icon="star"
            label="Rate Us"
            onPress={() => {
              Alert.alert(
                "Rate TradeMind AI",
                "Enjoying the app? Leave us a 5-star review!",
                [
                  { text: "Not Now", style: "cancel" },
                  { text: "Rate Now", onPress: openStore },
                ]
              );
            }}
            colors={colors}
          />
          <Div colors={colors} />
          <MenuItem
            icon="help-circle"
            label="Help Center"
            onPress={() => open("https://trademindai.com/help")}
            colors={colors}
          />
          <Div colors={colors} />
          <MenuItem
            icon="message-circle"
            label="Contact Support"
            onPress={() => openEmail("support@trademindai.com", "TradeMind AI Support")}
            colors={colors}
          />
          <Div colors={colors} />
          <MenuItem
            icon="info"
            label="About"
            onPress={() => setShowAbout(true)}
            colors={colors}
          />
        </MenuCard>

        <MenuSection label="LEGAL" colors={colors} />
        <MenuCard colors={colors}>
          <MenuItem
            icon="file-text"
            label="Privacy Policy"
            onPress={() => open("https://trademindai.com/privacy")}
            colors={colors}
          />
          <Div colors={colors} />
          <MenuItem
            icon="book-open"
            label="Terms of Service"
            onPress={() => open("https://trademindai.com/terms")}
            colors={colors}
          />
          <Div colors={colors} />
          <MenuItem
            icon="alert-triangle"
            label="Risk Disclaimer"
            onPress={() => Alert.alert(
              "Risk Disclaimer",
              "TradeMind AI provides technical analysis tools for informational purposes only. All trading involves risk. Past performance is not indicative of future results. Never risk more than you can afford to lose. This is not financial advice."
            )}
            colors={colors}
          />
        </MenuCard>

        <TouchableOpacity
          style={[styles.signOutBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <Feather name="log-out" size={16} color={colors.bearish} />
          <Text style={[styles.signOutText, { color: colors.bearish }]}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={[styles.versionText, { color: colors.mutedForeground }]}>
          TradeMind AI v1.0.0 · Powered by GPT-4.1
        </Text>
      </ScrollView>

      <Modal
        visible={connectModal !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setConnectModal(null)}
      >
        <View style={modalStyles.overlay}>
          <TouchableOpacity style={modalStyles.dismiss} onPress={() => setConnectModal(null)} />
          <View style={[modalStyles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={modalStyles.handle} />
            <Text style={[modalStyles.title, { color: colors.foreground }]}>
              Connect {connectModal?.name}
            </Text>
            <Text style={[modalStyles.subtitle, { color: colors.mutedForeground }]}>
              Your API keys are stored securely on your device and never shared.
            </Text>
            <View style={modalStyles.inputs}>
              <Text style={[modalStyles.inputLabel, { color: colors.mutedForeground }]}>
                {connectModal?.keyLabel}
              </Text>
              <TextInput
                style={[modalStyles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
                value={apiKey}
                onChangeText={setApiKey}
                placeholder={`Enter ${connectModal?.keyLabel}`}
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={[modalStyles.inputLabel, { color: colors.mutedForeground }]}>
                {connectModal?.secretLabel}
              </Text>
              <TextInput
                style={[modalStyles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
                value={apiSecret}
                onChangeText={setApiSecret}
                placeholder={`Enter ${connectModal?.secretLabel}`}
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
              />
            </View>
            <TouchableOpacity
              style={[modalStyles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={saveConnection}
              disabled={saving}
              activeOpacity={0.85}
            >
              <Text style={[modalStyles.saveBtnText, { color: "#000" }]}>
                {saving ? "Saving…" : `Connect ${connectModal?.name}`}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setConnectModal(null)} style={modalStyles.cancelBtn}>
              <Text style={[modalStyles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showAbout} animationType="fade" transparent onRequestClose={() => setShowAbout(false)}>
        <View style={modalStyles.overlay}>
          <TouchableOpacity style={modalStyles.dismiss} onPress={() => setShowAbout(false)} />
          <View style={[modalStyles.aboutBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[modalStyles.aboutIcon, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "33" }]}>
              <Feather name="cpu" size={32} color={colors.primary} />
            </View>
            <Text style={[modalStyles.aboutTitle, { color: colors.foreground }]}>TradeMind AI</Text>
            <Text style={[modalStyles.aboutVersion, { color: colors.mutedForeground }]}>Version 1.0.0</Text>
            <Text style={[modalStyles.aboutDesc, { color: colors.mutedForeground }]}>
              AI-powered trading assistant with real-time market analysis, live charts, and smart trade signals.
            </Text>
            <Text style={[modalStyles.aboutDesc, { color: colors.mutedForeground }]}>
              Powered by GPT-4.1 · TradingView Charts
            </Text>
            <TouchableOpacity
              style={[modalStyles.saveBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
              onPress={() => setShowAbout(false)}
            >
              <Text style={[modalStyles.saveBtnText, { color: colors.foreground }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function MenuSection({ label, colors }: { label: string; colors: any }) {
  return <Text style={[secStyles.header, { color: colors.mutedForeground }]}>{label}</Text>;
}
const secStyles = StyleSheet.create({
  header: { fontFamily: "Inter_700Bold", fontSize: 11, letterSpacing: 1.2 },
});

function MenuCard({ children, colors }: { children: React.ReactNode; colors: any }) {
  return (
    <View style={[cardStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {children}
    </View>
  );
}
const cardStyles = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
});

function Div({ colors }: { colors: any }) {
  return <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 58 }} />;
}

function MenuItem({
  icon, label, sublabel, badge, badgeColor, onPress, colors,
}: {
  icon: string; label: string; sublabel?: string; badge?: string;
  badgeColor?: string; onPress: () => void; colors: any;
}) {
  return (
    <TouchableOpacity style={itemStyles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[itemStyles.iconBox, { backgroundColor: colors.surface }]}>
        <Feather name={icon as any} size={16} color={colors.foreground} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[itemStyles.label, { color: colors.foreground }]}>{label}</Text>
        {sublabel && <Text style={[itemStyles.sublabel, { color: colors.mutedForeground }]}>{sublabel}</Text>}
      </View>
      {badge ? (
        <View style={[itemStyles.badge, { backgroundColor: (badgeColor ?? colors.primary) + "22", borderColor: (badgeColor ?? colors.primary) + "44" }]}>
          <Text style={[itemStyles.badgeText, { color: badgeColor ?? colors.primary }]}>{badge}</Text>
        </View>
      ) : (
        <Feather name="chevron-right" size={15} color={colors.mutedForeground} />
      )}
    </TouchableOpacity>
  );
}
const itemStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  iconBox: { width: 34, height: 34, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  sublabel: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  badgeText: { fontFamily: "Inter_700Bold", fontSize: 11 },
});

function ToggleRow({
  icon, label, desc, value, onChange, colors,
}: {
  icon: string; label: string; desc: string; value: boolean; onChange: (v: boolean) => void; colors: any;
}) {
  return (
    <View style={toggleStyles.row}>
      <View style={[toggleStyles.iconBox, { backgroundColor: colors.surface }]}>
        <Feather name={icon as any} size={16} color={colors.foreground} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[toggleStyles.label, { color: colors.foreground }]}>{label}</Text>
        <Text style={[toggleStyles.desc, { color: colors.mutedForeground }]}>{desc}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: "#2A2E39", true: "#00FF8866" }}
        thumbColor={value ? "#00FF88" : "#787B86"}
      />
    </View>
  );
}
const toggleStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  iconBox: { width: 34, height: 34, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  desc: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  dismiss: { flex: 1 },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderBottomWidth: 0, padding: 24, gap: 16,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#2A2E39", alignSelf: "center" },
  title: { fontFamily: "Inter_700Bold", fontSize: 20 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20 },
  inputs: { gap: 8 },
  inputLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  input: {
    borderRadius: 10, borderWidth: 1, padding: 13,
    fontFamily: "Inter_400Regular", fontSize: 14,
  },
  saveBtn: { paddingVertical: 15, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  saveBtnText: { fontFamily: "Inter_700Bold", fontSize: 15 },
  cancelBtn: { alignItems: "center", paddingVertical: 4 },
  cancelText: { fontFamily: "Inter_400Regular", fontSize: 14 },
  aboutBox: {
    margin: 32, borderRadius: 20, borderWidth: 1, padding: 28,
    alignItems: "center", gap: 12,
  },
  aboutIcon: {
    width: 72, height: 72, borderRadius: 20, borderWidth: 1,
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  aboutTitle: { fontFamily: "Inter_700Bold", fontSize: 24 },
  aboutVersion: { fontFamily: "Inter_400Regular", fontSize: 14 },
  aboutDesc: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", lineHeight: 20 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, gap: 12 },
  pageTitle: { fontFamily: "Inter_700Bold", fontSize: 26, marginBottom: 4 },
  signInRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 16, borderRadius: 12, borderWidth: 1,
  },
  avatar: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: "Inter_700Bold", fontSize: 20 },
  signInName: { fontFamily: "Inter_700Bold", fontSize: 16 },
  signInEmail: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  planPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  planPillText: { fontFamily: "Inter_700Bold", fontSize: 11 },
  twoCol: { flexDirection: "row", gap: 12 },
  twoColCard: {
    flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, gap: 6,
  },
  twoColTitle: { fontFamily: "Inter_700Bold", fontSize: 14 },
  twoColDesc: { fontFamily: "Inter_400Regular", fontSize: 12 },
  trialBanner: {
    flexDirection: "row", alignItems: "center",
    padding: 16, borderRadius: 12, borderWidth: 1, gap: 12,
  },
  trialTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  trialSub: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 2 },
  trialBadge: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  signOutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1, marginTop: 4,
  },
  signOutText: { fontFamily: "Inter_700Bold", fontSize: 15 },
  versionText: { fontFamily: "Inter_400Regular", fontSize: 12, textAlign: "center" },
});
