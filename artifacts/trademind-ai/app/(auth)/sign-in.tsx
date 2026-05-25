import React, { useState, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSignIn, useSSO, useAuth } from "@clerk/expo";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { useSafeAreaInsets } from "react-native-safe-area-context";

WebBrowser.maybeCompleteAuthSession();

const GREEN = "#00FF88";
const BG = "#000000";
const CARD = "#0D0D12";
const BORDER = "#1E1E2A";
const TEXT = "#E0E3EB";
const MUTED = "#787B86";
const RED = "#F23645";

const FEATURES = [
  { icon: "cpu", label: "AI Chart Analysis", desc: "GPT-4.1 reads your chart instantly" },
  { icon: "bar-chart-2", label: "Live TradingView Charts", desc: "40+ pairs, crypto · forex · stocks" },
  { icon: "shield", label: "Risk Management", desc: "Auto entry, stop-loss & take-profit" },
];

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, errors, fetchStatus } = useSignIn();
  const { startSSOFlow } = useSSO();
  const { isSignedIn } = useAuth();

  const [mode, setMode] = useState<"landing" | "signin">("landing");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroY = useRef(new Animated.Value(40)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formY = useRef(new Animated.Value(60)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const glowPulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(heroOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.spring(heroY, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.4, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (Platform.OS === "android") {
      WebBrowser.warmUpAsync();
      return () => { WebBrowser.coolDownAsync(); };
    }
  }, []);

  useEffect(() => {
    if (isLoaded && isSignedIn) router.replace("/(tabs)");
  }, [isLoaded, isSignedIn]);

  function showSignInForm() {
    setMode("signin");
    Animated.parallel([
      Animated.timing(formOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(formY, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
    ]).start();
  }

  function backToLanding() {
    Animated.parallel([
      Animated.timing(formOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(formY, { toValue: 60, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setMode("landing");
      formY.setValue(60);
    });
  }

  async function handleSignIn() {
    const { error } = await signIn.password({ emailAddress: email, password });
    if (error) return;
    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ decorateUrl }) => {
          const url = decorateUrl("/");
          if (url.startsWith("http")) return;
          router.replace("/(tabs)");
        },
      });
    }
  }

  async function handleGoogleSignIn() {
    try {
      setGoogleLoading(true);
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: AuthSession.makeRedirectUri(),
      });
      if (createdSessionId) {
        await setActive!({
          session: createdSessionId,
          navigate: async () => { router.replace("/(tabs)"); },
        });
      }
    } catch {
      Alert.alert("Google Sign-In Failed", "Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleVerify() {
    await signIn.mfa.verifyEmailCode({ code });
    if (signIn.status === "complete") {
      await signIn.finalize({ navigate: () => { router.replace("/(tabs)"); } });
    }
  }

  if (signIn.status === "needs_client_trust") {
    return (
      <View style={[s.root, { paddingTop: insets.top + 40 }]}>
        <View style={{ alignItems: "center", marginBottom: 32 }}>
          <View style={s.logoBox}>
            <Feather name="shield" size={30} color={GREEN} />
          </View>
        </View>
        <Text style={s.title}>Verify Identity</Text>
        <Text style={s.subtitle}>Enter the code sent to your email</Text>
        <View style={[s.inputWrap, { marginTop: 24 }]}>
          <Feather name="hash" size={16} color={MUTED} style={{ marginRight: 10 }} />
          <TextInput
            style={s.input} value={code} onChangeText={setCode}
            placeholder="000000" placeholderTextColor={MUTED}
            keyboardType="numeric" autoFocus
          />
        </View>
        {errors?.fields?.code && <Text style={s.errorText}>{errors.fields.code.message}</Text>}
        <TouchableOpacity style={s.primaryBtn} onPress={handleVerify} disabled={fetchStatus === "fetching"}>
          {fetchStatus === "fetching"
            ? <ActivityIndicator color="#000" />
            : <Text style={s.primaryBtnText}>Verify</Text>
          }
        </TouchableOpacity>
      </View>
    );
  }

  const isLoading = fetchStatus === "fetching";

  if (mode === "signin") {
    return (
      <View style={s.root}>
        <LinearGradient colors={["#00FF8808", "#000000"]} style={s.gradientTop} />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={[s.formScroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity style={s.backBtn} onPress={backToLanding}>
              <Feather name="arrow-left" size={20} color={MUTED} />
              <Text style={s.backText}>Back</Text>
            </TouchableOpacity>

            <Animated.View style={{ opacity: heroOpacity, transform: [{ scale: logoScale }], alignItems: "center", marginVertical: 24 }}>
              <View style={s.logoBox}>
                <Feather name="cpu" size={30} color={GREEN} />
              </View>
              <Text style={s.appName}>TRADEMIND AI</Text>
            </Animated.View>

            <Text style={s.title}>Welcome back</Text>
            <Text style={[s.subtitle, { marginBottom: 24 }]}>Sign in to your trading account</Text>

            <Animated.View style={[s.card, { opacity: formOpacity, transform: [{ translateY: formY }] }]}>
              <View style={s.fieldGroup}>
                <Text style={s.label}>Email Address</Text>
                <View style={s.inputWrap}>
                  <Feather name="mail" size={16} color={MUTED} style={{ marginRight: 10 }} />
                  <TextInput
                    style={s.input} value={email} onChangeText={setEmail}
                    placeholder="your@email.com" placeholderTextColor={MUTED}
                    keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
                  />
                </View>
                {errors?.fields?.identifier && <Text style={s.errorText}>{errors.fields.identifier.message}</Text>}
              </View>

              <View style={s.fieldGroup}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={s.label}>Password</Text>
                  <TouchableOpacity>
                    <Text style={[s.label, { color: "#2962FF" }]}>Forgot?</Text>
                  </TouchableOpacity>
                </View>
                <View style={s.inputWrap}>
                  <Feather name="lock" size={16} color={MUTED} style={{ marginRight: 10 }} />
                  <TextInput
                    style={s.input} value={password} onChangeText={setPassword}
                    placeholder="••••••••" placeholderTextColor={MUTED}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                    <Feather name={showPassword ? "eye-off" : "eye"} size={16} color={MUTED} />
                  </TouchableOpacity>
                </View>
                {errors?.fields?.password && <Text style={s.errorText}>{errors.fields.password.message}</Text>}
              </View>

              <TouchableOpacity
                style={[s.primaryBtn, { opacity: (!email || !password || isLoading) ? 0.5 : 1 }]}
                onPress={handleSignIn} disabled={!email || !password || isLoading} activeOpacity={0.85}
              >
                {isLoading ? <ActivityIndicator color="#000" /> : <Text style={s.primaryBtnText}>Sign In</Text>}
              </TouchableOpacity>

              <View style={s.dividerRow}>
                <View style={s.dividerLine} />
                <Text style={s.dividerText}>or continue with</Text>
                <View style={s.dividerLine} />
              </View>

              <TouchableOpacity style={s.googleBtn} onPress={handleGoogleSignIn} disabled={googleLoading} activeOpacity={0.85}>
                {googleLoading
                  ? <ActivityIndicator color={TEXT} size="small" />
                  : <>
                      <Text style={{ fontFamily: "Inter_700Bold", fontSize: 18, color: "#4285F4" }}>G</Text>
                      <Text style={[s.label, { color: TEXT }]}>Continue with Google</Text>
                    </>
                }
              </TouchableOpacity>
            </Animated.View>

            <View style={s.footerRow}>
              <Text style={s.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.replace("/(auth)/sign-up")}>
                <Text style={[s.footerText, { color: GREEN, fontFamily: "Inter_700Bold" }]}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <LinearGradient
        colors={["#00FF8810", "#00000000"]}
        style={s.gradientTop}
      />

      <ScrollView
        contentContainerStyle={[s.landingScroll, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[s.heroSection, { opacity: heroOpacity, transform: [{ translateY: heroY }] }]}>
          <Animated.View style={[s.logoGlow, { opacity: glowPulse }]} />
          <Animated.View style={[s.logoBox, { transform: [{ scale: logoScale }] }]}>
            <Feather name="cpu" size={36} color={GREEN} />
          </Animated.View>
          <Text style={s.appName}>TRADEMIND AI</Text>
          <Text style={s.heroTitle}>Smarter Trades.{"\n"}In Seconds.</Text>
          <Text style={s.heroSub}>
            AI-powered chart analysis that reads{"\n"}your chart and builds your trade plan.
          </Text>
        </Animated.View>

        <Animated.View style={[s.featuresBox, { opacity: heroOpacity }]}>
          {FEATURES.map((f, i) => (
            <View key={i} style={s.featureRow}>
              <View style={s.featureIcon}>
                <Feather name={f.icon as any} size={18} color={GREEN} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.featureLabel}>{f.label}</Text>
                <Text style={s.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        <Animated.View style={[s.ctaSection, { opacity: heroOpacity }]}>
          <TouchableOpacity
            style={s.getStartedBtn}
            onPress={() => router.replace("/(auth)/sign-up")}
            activeOpacity={0.85}
          >
            <Text style={s.getStartedText}>GET STARTED TODAY</Text>
            <Feather name="arrow-right" size={18} color="#000" />
          </TouchableOpacity>

          <TouchableOpacity style={s.signInLink} onPress={showSignInForm} activeOpacity={0.7}>
            <Text style={s.signInLinkText}>Already have an account? </Text>
            <Text style={[s.signInLinkText, { color: GREEN, fontFamily: "Inter_700Bold" }]}>Sign In</Text>
          </TouchableOpacity>
        </Animated.View>

        <Text style={s.disclaimer}>
          By continuing you agree to our Terms of Service{"\n"}and Privacy Policy
        </Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  gradientTop: { position: "absolute", top: 0, left: 0, right: 0, height: 320 },

  landingScroll: { paddingHorizontal: 24, gap: 32 },
  formScroll: { paddingHorizontal: 24, gap: 12 },

  heroSection: { alignItems: "center", gap: 12 },
  logoGlow: {
    position: "absolute",
    top: -20, width: 160, height: 160,
    borderRadius: 80,
    backgroundColor: "#00FF8820",
  },
  logoBox: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: "#00FF8812",
    borderWidth: 1, borderColor: "#00FF8830",
    alignItems: "center", justifyContent: "center",
  },
  appName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11, letterSpacing: 4,
    color: MUTED, marginTop: 4,
  },
  heroTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 38, color: TEXT,
    textAlign: "center", lineHeight: 46,
    marginTop: 8,
  },
  heroSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 15, color: MUTED,
    textAlign: "center", lineHeight: 22,
  },

  featuresBox: {
    backgroundColor: CARD,
    borderRadius: 16, borderWidth: 1, borderColor: BORDER,
    overflow: "hidden",
  },
  featureRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: 18, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  featureIcon: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: "#00FF8810", borderWidth: 1, borderColor: "#00FF8820",
    alignItems: "center", justifyContent: "center",
  },
  featureLabel: { fontFamily: "Inter_700Bold", fontSize: 14, color: TEXT },
  featureDesc: { fontFamily: "Inter_400Regular", fontSize: 12, color: MUTED, marginTop: 2 },

  ctaSection: { gap: 14 },
  getStartedBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, height: 58, borderRadius: 16,
    backgroundColor: GREEN,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
  },
  getStartedText: { fontFamily: "Inter_700Bold", fontSize: 17, color: "#000" },
  signInLink: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  signInLinkText: { fontFamily: "Inter_500Medium", fontSize: 15, color: MUTED },

  disclaimer: {
    fontFamily: "Inter_400Regular", fontSize: 11,
    color: "#444452", textAlign: "center", lineHeight: 17,
  },

  backBtn: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  backText: { fontFamily: "Inter_500Medium", fontSize: 14, color: MUTED },

  title: { fontFamily: "Inter_700Bold", fontSize: 26, color: TEXT, textAlign: "center" },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 14, color: MUTED, textAlign: "center", lineHeight: 20 },

  card: { backgroundColor: CARD, borderRadius: 18, borderWidth: 1, borderColor: BORDER, padding: 20, gap: 16 },
  fieldGroup: { gap: 8 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: TEXT },
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#000000", borderRadius: 12,
    borderWidth: 1, borderColor: BORDER,
    paddingHorizontal: 14, height: 50,
  },
  input: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15, color: TEXT },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 12, color: RED, marginTop: 2 },
  primaryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, height: 52, borderRadius: 14, backgroundColor: GREEN,
  },
  primaryBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#000" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: BORDER },
  dividerText: { fontFamily: "Inter_400Regular", fontSize: 12, color: MUTED },
  googleBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 12, height: 50, borderRadius: 14,
    backgroundColor: "#000000", borderWidth: 1, borderColor: BORDER,
  },
  footerRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 8 },
  footerText: { fontFamily: "Inter_400Regular", fontSize: 14, color: MUTED },
});
