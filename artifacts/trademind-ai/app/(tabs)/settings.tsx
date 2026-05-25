import React, { useRef, useEffect } from "react";
import {
  Alert,
  Animated,
  Linking,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth, useUser } from "@clerk/expo";
import { useColors } from "@/hooks/useColors";
import { useAnalysis } from "@/context/AnalysisContext";
import { useSubscription } from "@/context/SubscriptionContext";

function openUrl(url: string) {
  Linking.openURL(url).catch(() => Alert.alert("Could not open link", url));
}

function openStore() {
  if (Platform.OS === "ios") {
    openUrl("https://apps.apple.com/app/trademind-ai");
  } else {
    openUrl("https://play.google.com/store/apps/details?id=com.trademindai.app");
  }
}

export default function MenuScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { analyses } = useAnalysis();
  const { plan, isPro, isBase } = useSubscription();
  const { signOut } = useAuth();
  const { user } = useUser();
  const topInset = Platform.OS === "web" ? 0 : insets.top;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  const planLabel = plan.tier === "pro" ? "PRO" : plan.tier === "base" ? "BASE" : "BASIC";
  const displayName =
    user?.username ??
    (user?.firstName
      ? `${user.firstName}${user.lastName ?? ""}`.toLowerCase()
      : "trader");
  const email = user?.emailAddresses[0]?.emailAddress ?? "";
  const initial = (user?.firstName?.[0] ?? user?.username?.[0] ?? "T").toUpperCase();
  const ideasCount = analyses.length;

  async function handleSignOut() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          } catch {}
          await signOut();
        },
      },
    ]);
  }

  async function handleRefer() {
    const code = user?.id?.slice(-8).toUpperCase() ?? "TRADEMIND";
    try {
      await Share.share({
        message: `I use TradeMind AI for AI-powered chart analysis — it's incredible!\n\nJoin me and get 5 bonus free AI scans.\n\nReferral code: ${code}\nhttps://trademindai.com/ref/${code}`,
        title: "TradeMind AI — Trade Smarter with AI",
      });
    } catch {}
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[s.scroll, { paddingTop: topInset + 16, paddingBottom: 100 }]}
        >
          <View style={s.header}>
            <Text style={[s.headerTitle, { color: colors.foreground }]}>Menu</Text>
            <TouchableOpacity
              style={[s.gearBtn, { borderColor: colors.border }]}
              onPress={() => Alert.alert("Settings", "App settings coming soon.")}
              activeOpacity={0.7}
            >
              <Feather name="settings" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[s.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => Alert.alert("Profile", `Signed in as ${email || "user"}`)}
            activeOpacity={0.8}
          >
            <View style={s.profileRow}>
              <View style={[s.avatarCircle, { backgroundColor: "#8B6E4E" }]}>
                <Text style={s.avatarLetter}>{initial}</Text>
              </View>
              <View style={s.profileInfo}>
                <Text style={[s.profileName, { color: colors.foreground }]}>{displayName}</Text>
                <View style={[s.planBadge, { borderColor: colors.mutedForeground }]}>
                  <Text style={[s.planBadgeText, { color: colors.mutedForeground }]}>{planLabel}</Text>
                </View>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </View>

            <View style={[s.statsDivider, { backgroundColor: colors.border }]} />

            <View style={s.statsRow}>
              <View style={s.stat}>
                <Text style={[s.statNum, { color: colors.foreground }]}>{ideasCount}</Text>
                <Text style={[s.statLabel, { color: colors.mutedForeground }]}>Ideas</Text>
              </View>
              <View style={[s.statSep, { backgroundColor: colors.border }]} />
              <View style={s.stat}>
                <Text style={[s.statNum, { color: colors.foreground }]}>0</Text>
                <Text style={[s.statLabel, { color: colors.mutedForeground }]}>Followers</Text>
              </View>
              <View style={[s.statSep, { backgroundColor: colors.border }]} />
              <View style={s.stat}>
                <Text style={[s.statNum, { color: colors.foreground }]}>0</Text>
                <Text style={[s.statLabel, { color: colors.mutedForeground }]}>Following</Text>
              </View>
            </View>
          </TouchableOpacity>

          <View style={s.twoCol}>
            <TouchableOpacity
              style={[s.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push("/subscription")}
              activeOpacity={0.75}
            >
              <View style={s.actionCardTop}>
                <Feather name="layers" size={22} color={colors.foreground} />
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </View>
              <Text style={[s.actionCardTitle, { color: colors.foreground }]}>Subscription</Text>
              <Text style={[s.actionCardSub, { color: colors.mutedForeground }]}>
                {isPro ? "Pro · Active" : isBase ? "Base · Active" : "Get the full power of\nTradeMind AI"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleRefer}
              activeOpacity={0.75}
            >
              <View style={s.actionCardTop}>
                <Feather name="user-plus" size={22} color={colors.foreground} />
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </View>
              <Text style={[s.actionCardTitle, { color: colors.foreground }]}>Refer a friend</Text>
              <Text style={[s.actionCardSub, { color: colors.mutedForeground }]}>Share what you love</Text>
            </TouchableOpacity>
          </View>

          {!isPro && (
            <TouchableOpacity onPress={() => router.push("/subscription")} activeOpacity={0.85}>
              <LinearGradient
                colors={["#4A2FBF", "#2D6AE0", "#1A9EE0"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.banner}
              >
                <View style={s.bannerLeft}>
                  <Text style={s.bannerSparkles}>✦  ✦  ✦</Text>
                  <Text style={s.bannerTitle}>{isBase ? "Upgrade to Pro" : "30-day free trial"}</Text>
                  <Text style={s.bannerSub}>Upgrade now</Text>
                </View>
                <View style={s.bannerLogo}>
                  <Text style={s.bannerLogoText}>AI</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          <View style={[s.menuList, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity
              style={s.menuItem}
              onPress={() => {
                Alert.alert("Rate TradeMind AI", "Enjoying the app? Leave us a 5-star review!", [
                  { text: "Not Now", style: "cancel" },
                  { text: "Rate Now", onPress: openStore },
                ]);
              }}
              activeOpacity={0.7}
            >
              <View style={s.menuIconWrap}>
                <Feather name="star" size={19} color={colors.mutedForeground} />
              </View>
              <Text style={[s.menuLabel, { color: colors.foreground }]}>Rate us</Text>
            </TouchableOpacity>

            <View style={[s.menuDivider, { backgroundColor: colors.border }]} />

            <TouchableOpacity
              style={s.menuItem}
              onPress={() => openUrl("https://trademindai.com/help")}
              activeOpacity={0.7}
            >
              <View style={s.menuIconWrap}>
                <Feather name="help-circle" size={19} color={colors.mutedForeground} />
              </View>
              <Text style={[s.menuLabel, { color: colors.foreground }]}>Help Center</Text>
            </TouchableOpacity>

            <View style={[s.menuDivider, { backgroundColor: colors.border }]} />

            <TouchableOpacity
              style={s.menuItem}
              onPress={() => router.push("/about" as any)}
              activeOpacity={0.7}
            >
              <View style={s.menuIconWrap}>
                <Feather name="info" size={19} color={colors.mutedForeground} />
              </View>
              <Text style={[s.menuLabel, { color: colors.foreground }]}>About</Text>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} style={{ marginLeft: "auto" }} />
            </TouchableOpacity>

            <View style={[s.menuDivider, { backgroundColor: colors.border }]} />

            <TouchableOpacity style={s.menuItem} onPress={handleSignOut} activeOpacity={0.7}>
              <View style={s.menuIconWrap}>
                <Feather name="log-out" size={19} color={colors.bearish} />
              </View>
              <Text style={[s.menuLabel, { color: colors.bearish }]}>Sign Out</Text>
            </TouchableOpacity>
          </View>

          <Text style={[s.version, { color: colors.mutedForeground }]}>
            TradeMind AI v1.0.0 · Powered by GPT-4.1
          </Text>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, gap: 12 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 28 },
  gearBtn: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },

  profileCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  avatarCircle: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  avatarLetter: { fontFamily: "Inter_700Bold", fontSize: 22, color: "#fff" },
  profileInfo: { flex: 1, gap: 5 },
  profileName: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  planBadge: { alignSelf: "flex-start", borderWidth: 1, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2 },
  planBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 0.5 },
  statsDivider: { height: 1 },
  statsRow: { flexDirection: "row", paddingVertical: 14, paddingHorizontal: 16 },
  stat: { flex: 1, alignItems: "flex-start", gap: 3 },
  statNum: { fontFamily: "Inter_700Bold", fontSize: 17 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 12 },
  statSep: { width: 1, marginVertical: 4 },

  twoCol: { flexDirection: "row", gap: 10 },
  actionCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 16, gap: 8 },
  actionCardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  actionCardTitle: { fontFamily: "Inter_700Bold", fontSize: 15 },
  actionCardSub: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },

  banner: { borderRadius: 14, flexDirection: "row", alignItems: "center", paddingVertical: 18, paddingHorizontal: 20, gap: 12, overflow: "hidden" },
  bannerLeft: { flex: 1, gap: 3 },
  bannerSparkles: { fontFamily: "Inter_400Regular", fontSize: 11, color: "#ffffff99", letterSpacing: 2, marginBottom: 2 },
  bannerTitle: { fontFamily: "Inter_700Bold", fontSize: 17, color: "#fff" },
  bannerSub: { fontFamily: "Inter_400Regular", fontSize: 13, color: "#ffffffCC" },
  bannerLogo: { width: 56, height: 56, borderRadius: 12, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  bannerLogoText: { fontFamily: "Inter_700Bold", fontSize: 20, color: "#131722" },

  menuList: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 15, gap: 14 },
  menuIconWrap: { width: 28, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontFamily: "Inter_500Medium", fontSize: 15 },
  menuDivider: { height: 1, marginLeft: 58 },

  version: { fontFamily: "Inter_400Regular", fontSize: 12, textAlign: "center", marginTop: 4 },
});
