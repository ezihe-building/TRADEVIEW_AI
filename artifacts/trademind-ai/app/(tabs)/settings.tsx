import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
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
import { GlassCard } from "@/components/GlassCard";

const RISK_LEVELS = ["Conservative", "Moderate", "Aggressive"];
const AI_MODES = ["Balanced", "Detailed", "Quick"];
const LANGUAGES = ["English", "French", "Spanish", "Arabic", "Portuguese"];

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { analyses, clearHistory } = useAnalysis();
  const { plan, isPro, isBase, scansRemaining, cancelSubscription } = useSubscription();
  const { signOut } = useAuth();
  const { user } = useUser();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const [notifMarket, setNotifMarket] = useState(true);
  const [notifSignals, setNotifSignals] = useState(true);
  const [notifNews, setNotifNews] = useState(true);
  const [notifPrice, setNotifPrice] = useState(false);
  const [riskLevel, setRiskLevel] = useState("Moderate");
  const [aiMode, setAiMode] = useState("Balanced");
  const [language, setLanguage] = useState("English");
  const [showRiskPicker, setShowRiskPicker] = useState(false);
  const [showAiPicker, setShowAiPicker] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);

  const planLabel = plan.tier === "pro" ? "Pro" : plan.tier === "base" ? "Base" : "Free";
  const planColor = plan.tier === "pro" ? colors.primary : plan.tier === "base" ? colors.accent : colors.mutedForeground;

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
          } catch {
          } finally {
            router.replace("/(auth)/sign-in");
          }
        },
      },
    ]);
  }

  function confirmClear() {
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
          },
        },
      ]
    );
  }

  function confirmCancel() {
    Alert.alert(
      "Cancel Subscription",
      "Your plan will revert to Free. You will lose access to premium features.",
      [
        { text: "Keep Plan", style: "cancel" },
        {
          text: "Cancel",
          style: "destructive",
          onPress: () => {
            cancelSubscription();
            Alert.alert("Cancelled", "Your subscription has been cancelled.");
          },
        },
      ]
    );
  }

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName ?? ""}`.trim()
    : "Trader";
  const email = user?.emailAddresses[0]?.emailAddress ?? "";
  const initial = displayName[0]?.toUpperCase() ?? "T";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: topInset + 16, paddingBottom: 120 }]}
      >
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Settings</Text>

        <SectionHeader label="Account" colors={colors} />
        <GlassCard style={styles.profileCard}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "44" }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>{initial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color: colors.foreground }]}>{displayName}</Text>
            <Text style={[styles.profileEmail, { color: colors.mutedForeground }]}>{email}</Text>
          </View>
          <View style={[styles.planPill, { backgroundColor: planColor + "22", borderColor: planColor + "44" }]}>
            <Text style={[styles.planPillText, { color: planColor }]}>{planLabel}</Text>
          </View>
        </GlassCard>

        <GlassCard style={styles.menuCard}>
          <MenuItem
            icon="user"
            label="Edit Profile"
            onPress={() => Alert.alert("Coming Soon", "Profile editing will be available in the next update.")}
            colors={colors}
          />
          <Divider colors={colors} />
          <MenuItem
            icon="lock"
            label="Change Password"
            onPress={() => Alert.alert("Change Password", "A password reset link has been sent to your email.")}
            colors={colors}
          />
          <Divider colors={colors} />
          <MenuItem
            icon="shield"
            label="Two-Factor Authentication"
            onPress={() => Alert.alert("Coming Soon", "2FA will be available soon.")}
            colors={colors}
          />
        </GlassCard>

        <SectionHeader label="Subscription" colors={colors} />
        <GlassCard glow={isPro ? "green" : isBase ? "blue" : "none"} style={styles.subCard}>
          <View style={styles.subTop}>
            <View>
              <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>Current Plan</Text>
              <Text style={[styles.subPlan, { color: planColor }]}>
                {planLabel}{plan.interval ? ` · ${plan.interval}` : ""}
              </Text>
            </View>
            <View style={[styles.scansPill, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "33" }]}>
              <Feather name="zap" size={12} color={colors.primary} />
              <Text style={[styles.scansPillText, { color: colors.primary }]}>
                {isPro ? "Unlimited" : `${scansRemaining} scans left`}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.upgradeBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/subscription")}
            activeOpacity={0.85}
          >
            <Feather name="zap" size={15} color={colors.primaryForeground} />
            <Text style={[styles.upgradeBtnText, { color: colors.primaryForeground }]}>
              {isPro ? "Manage Plan" : isBase ? "Upgrade to Pro" : "Upgrade Plan"}
            </Text>
          </TouchableOpacity>
          {(isPro || isBase) && (
            <TouchableOpacity onPress={confirmCancel} style={styles.manageSubBtn}>
              <Text style={[styles.manageSubText, { color: colors.mutedForeground }]}>
                Cancel subscription
              </Text>
            </TouchableOpacity>
          )}
        </GlassCard>

        <SectionHeader label="Notifications" colors={colors} />
        <GlassCard style={styles.menuCard}>
          <ToggleRow
            icon="activity"
            label="Market Movements"
            desc="Alerts for big price changes"
            value={notifMarket}
            onChange={setNotifMarket}
            colors={colors}
          />
          <Divider colors={colors} />
          <ToggleRow
            icon="cpu"
            label="AI Trade Signals"
            desc="Notify when new signal is ready"
            value={notifSignals}
            onChange={setNotifSignals}
            colors={colors}
          />
          <Divider colors={colors} />
          <ToggleRow
            icon="rss"
            label="Market News"
            desc="Breaking crypto and forex news"
            value={notifNews}
            onChange={setNotifNews}
            colors={colors}
          />
          <Divider colors={colors} />
          <ToggleRow
            icon="bell"
            label="Price Alerts"
            desc="Custom price target alerts"
            value={notifPrice}
            onChange={setNotifPrice}
            colors={colors}
          />
        </GlassCard>

        <SectionHeader label="Trading Accounts" colors={colors} />
        <GlassCard style={styles.menuCard}>
          {[
            { name: "Binance", icon: "link", desc: "Connect via API key" },
            { name: "Bybit", icon: "link", desc: "Connect via API key" },
            { name: "TradingView", icon: "bar-chart-2", desc: "Sync watchlist & alerts" },
            { name: "MetaTrader 4/5", icon: "server", desc: "Connect via bridge" },
          ].map((acc, i, arr) => (
            <View key={acc.name}>
              <MenuItem
                icon={acc.icon as any}
                label={acc.name}
                sublabel={acc.desc}
                badge="Connect"
                badgeColor={colors.accent}
                onPress={() =>
                  Alert.alert(
                    `Connect ${acc.name}`,
                    `Enter your ${acc.name} API key and secret to link your account. Your credentials are encrypted and stored securely.`,
                    [
                      { text: "Cancel", style: "cancel" },
                      { text: "Enter Keys", onPress: () => Alert.alert("Coming Soon", "Account connection will be available in v1.1") },
                    ]
                  )
                }
                colors={colors}
              />
              {i < arr.length - 1 && <Divider colors={colors} />}
            </View>
          ))}
        </GlassCard>

        <SectionHeader label="AI Analysis" colors={colors} />
        <GlassCard style={styles.menuCard}>
          <PickerRow
            icon="cpu"
            label="Analysis Mode"
            value={aiMode}
            options={AI_MODES}
            open={showAiPicker}
            onToggle={() => setShowAiPicker(!showAiPicker)}
            onSelect={(v) => { setAiMode(v); setShowAiPicker(false); }}
            colors={colors}
          />
          <Divider colors={colors} />
          <PickerRow
            icon="sliders"
            label="Risk Tolerance"
            value={riskLevel}
            options={RISK_LEVELS}
            open={showRiskPicker}
            onToggle={() => setShowRiskPicker(!showRiskPicker)}
            onSelect={(v) => { setRiskLevel(v); setShowRiskPicker(false); }}
            colors={colors}
          />
        </GlassCard>

        <SectionHeader label="Appearance & Language" colors={colors} />
        <GlassCard style={styles.menuCard}>
          <PickerRow
            icon="globe"
            label="Language"
            value={language}
            options={LANGUAGES}
            open={showLangPicker}
            onToggle={() => setShowLangPicker(!showLangPicker)}
            onSelect={(v) => { setLanguage(v); setShowLangPicker(false); }}
            colors={colors}
          />
        </GlassCard>

        <SectionHeader label="Statistics" colors={colors} />
        <GlassCard style={styles.statsCard}>
          <View style={styles.statsRow}>
            <StatItem label="Analyzed" value={analyses.length.toString()} color={colors.accent} />
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <StatItem
              label="Bullish"
              value={analyses.filter((a) => a.sentiment === "bullish").length.toString()}
              color={colors.bullish}
            />
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <StatItem
              label="Bearish"
              value={analyses.filter((a) => a.sentiment === "bearish").length.toString()}
              color={colors.bearish}
            />
          </View>
        </GlassCard>

        <SectionHeader label="Privacy & Security" colors={colors} />
        <GlassCard style={styles.menuCard}>
          <MenuItem
            icon="file-text"
            label="Privacy Policy"
            onPress={() => Alert.alert("Privacy Policy", "TradeMind AI does not sell your data. All analysis is processed securely.")}
            colors={colors}
          />
          <Divider colors={colors} />
          <MenuItem
            icon="shield"
            label="Terms of Service"
            onPress={() => Alert.alert("Terms", "TradeMind AI provides analysis tools for informational purposes only.")}
            colors={colors}
          />
          <Divider colors={colors} />
          <MenuItem
            icon="smartphone"
            label="Device Management"
            onPress={() => Alert.alert("Devices", "Session management will be available in v1.1")}
            colors={colors}
          />
        </GlassCard>

        <SectionHeader label="Help & Support" colors={colors} />
        <GlassCard style={styles.menuCard}>
          <MenuItem
            icon="help-circle"
            label="FAQ"
            onPress={() => Alert.alert("FAQ", "Visit trademindai.com/help for full documentation.")}
            colors={colors}
          />
          <Divider colors={colors} />
          <MenuItem
            icon="message-circle"
            label="Contact Support"
            onPress={() => Alert.alert("Support", "Email us at support@trademindai.com")}
            colors={colors}
          />
          <Divider colors={colors} />
          <MenuItem
            icon="star"
            label="Rate the App"
            onPress={() => Alert.alert("Rate TradeMind AI", "Thank you! Head to the Play Store / App Store to leave a review.")}
            colors={colors}
          />
        </GlassCard>

        <View style={styles.dangerZone}>
          {analyses.length > 0 && (
            <TouchableOpacity
              style={[styles.dangerBtn, { borderColor: colors.bearish + "55", backgroundColor: colors.bearish + "11" }]}
              onPress={confirmClear}
              activeOpacity={0.8}
            >
              <Feather name="trash-2" size={16} color={colors.bearish} />
              <Text style={[styles.dangerBtnText, { color: colors.bearish }]}>Clear Analysis History</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.dangerBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
            onPress={handleSignOut}
            activeOpacity={0.8}
          >
            <Feather name="log-out" size={16} color={colors.mutedForeground} />
            <Text style={[styles.dangerBtnText, { color: colors.mutedForeground }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.versionText, { color: colors.mutedForeground }]}>
          TradeMind AI v1.0.0 · Built for serious traders
        </Text>
      </ScrollView>
    </View>
  );
}

function SectionHeader({ label, colors }: { label: string; colors: any }) {
  return (
    <Text style={[sectionStyles.header, { color: colors.mutedForeground }]}>{label.toUpperCase()}</Text>
  );
}
const sectionStyles = StyleSheet.create({
  header: { fontFamily: "Inter_700Bold", fontSize: 11, letterSpacing: 1.2, marginTop: 4, marginBottom: -4 },
});

function Divider({ colors }: { colors: any }) {
  return <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 16 }} />;
}

function MenuItem({
  icon, label, sublabel, badge, badgeColor, onPress, colors,
}: {
  icon: string; label: string; sublabel?: string; badge?: string; badgeColor?: string;
  onPress: () => void; colors: any;
}) {
  return (
    <TouchableOpacity style={menuStyles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[menuStyles.iconBox, { backgroundColor: colors.primary + "15" }]}>
        <Feather name={icon as any} size={15} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[menuStyles.label, { color: colors.foreground }]}>{label}</Text>
        {sublabel && (
          <Text style={[menuStyles.sublabel, { color: colors.mutedForeground }]}>{sublabel}</Text>
        )}
      </View>
      {badge ? (
        <View style={[menuStyles.badge, { backgroundColor: (badgeColor ?? colors.primary) + "22", borderColor: (badgeColor ?? colors.primary) + "44" }]}>
          <Text style={[menuStyles.badgeText, { color: badgeColor ?? colors.primary }]}>{badge}</Text>
        </View>
      ) : (
        <Feather name="chevron-right" size={15} color={colors.mutedForeground} />
      )}
    </TouchableOpacity>
  );
}
const menuStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  iconBox: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  sublabel: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  badgeText: { fontFamily: "Inter_700Bold", fontSize: 10 },
});

function ToggleRow({
  icon, label, desc, value, onChange, colors,
}: {
  icon: string; label: string; desc: string; value: boolean; onChange: (v: boolean) => void; colors: any;
}) {
  return (
    <View style={toggleStyles.row}>
      <View style={[toggleStyles.iconBox, { backgroundColor: colors.primary + "15" }]}>
        <Feather name={icon as any} size={15} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[toggleStyles.label, { color: colors.foreground }]}>{label}</Text>
        <Text style={[toggleStyles.desc, { color: colors.mutedForeground }]}>{desc}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: "#333", true: colors.primary + "88" }}
        thumbColor={value ? colors.primary : "#666"}
      />
    </View>
  );
}
const toggleStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  iconBox: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  desc: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
});

function PickerRow({
  icon, label, value, options, open, onToggle, onSelect, colors,
}: {
  icon: string; label: string; value: string; options: string[];
  open: boolean; onToggle: () => void; onSelect: (v: string) => void; colors: any;
}) {
  return (
    <View>
      <TouchableOpacity style={menuStyles.row} onPress={onToggle} activeOpacity={0.7}>
        <View style={[menuStyles.iconBox, { backgroundColor: colors.primary + "15" }]}>
          <Feather name={icon as any} size={15} color={colors.primary} />
        </View>
        <Text style={[menuStyles.label, { color: colors.foreground, flex: 1 }]}>{label}</Text>
        <Text style={[{ color: colors.primary, fontFamily: "Inter_600SemiBold", fontSize: 13, marginRight: 6 }]}>{value}</Text>
        <Feather name={open ? "chevron-up" : "chevron-down"} size={15} color={colors.mutedForeground} />
      </TouchableOpacity>
      {open && (
        <View style={[pickerStyles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[pickerStyles.option, { borderBottomColor: colors.border }]}
              onPress={() => onSelect(opt)}
            >
              <Text style={[pickerStyles.optionText, { color: opt === value ? colors.primary : colors.foreground }]}>
                {opt}
              </Text>
              {opt === value && <Feather name="check" size={14} color={colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
const pickerStyles = StyleSheet.create({
  dropdown: {
    marginHorizontal: 16, marginBottom: 8, borderRadius: 10, borderWidth: 1, overflow: "hidden",
  },
  option: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, borderBottomWidth: 1 },
  optionText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
});

function StatItem({ label, value, color }: { label: string; value: string; color: string }) {
  const colors = useColors();
  return (
    <View style={statStyles.item}>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={[statStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}
const statStyles = StyleSheet.create({
  item: { flex: 1, alignItems: "center", gap: 4 },
  value: { fontFamily: "Inter_700Bold", fontSize: 22 },
  label: { fontFamily: "Inter_400Regular", fontSize: 11, textAlign: "center" },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 14 },
  pageTitle: { fontFamily: "Inter_700Bold", fontSize: 24, marginBottom: 4 },
  profileCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16 },
  avatar: {
    width: 52, height: 52, borderRadius: 16, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontFamily: "Inter_700Bold", fontSize: 22 },
  profileName: { fontFamily: "Inter_700Bold", fontSize: 16 },
  profileEmail: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  planPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  planPillText: { fontFamily: "Inter_700Bold", fontSize: 11 },
  menuCard: { gap: 0, padding: 0, overflow: "hidden" },
  subCard: { gap: 14 },
  subTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  subLabel: { fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 2 },
  subPlan: { fontFamily: "Inter_700Bold", fontSize: 18 },
  scansPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1,
  },
  scansPillText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  upgradeBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 13, borderRadius: 12,
  },
  upgradeBtnText: { fontFamily: "Inter_700Bold", fontSize: 14 },
  manageSubBtn: { alignItems: "center" },
  manageSubText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  statsCard: { padding: 20 },
  statsRow: { flexDirection: "row", alignItems: "center" },
  statDivider: { width: 1, height: 40, marginHorizontal: 8 },
  dangerZone: { gap: 10, marginTop: 4 },
  dangerBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1,
  },
  dangerBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  versionText: { fontFamily: "Inter_400Regular", fontSize: 12, textAlign: "center", marginTop: 4, marginBottom: 8 },
});
