import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { Link, router } from "expo-router";
import { useSignUp, useSSO, useAuth } from "@clerk/expo";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signUp, errors, fetchStatus } = useSignUp();
  const { startSSOFlow } = useSSO();
  const { isSignedIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [code, setCode] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (Platform.OS === "android") {
      WebBrowser.warmUpAsync();
      return () => { WebBrowser.coolDownAsync(); };
    }
  }, []);

  useEffect(() => {
    if (isSignedIn) router.replace("/(tabs)");
  }, [isSignedIn]);

  async function handleSignUp() {
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    setPasswordError("");
    const { error } = await signUp.password({ emailAddress: email, password });
    if (error) return;
    await signUp.verifications.sendEmailCode();
  }

  async function handleVerify() {
    await signUp.verifications.verifyEmailCode({ code });
    if (signUp.status === "complete") {
      await signUp.finalize({
        navigate: ({ decorateUrl }) => {
          router.replace("/(tabs)");
        },
      });
    }
  }

  async function handleGoogleSignUp() {
    try {
      setGoogleLoading(true);
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: AuthSession.makeRedirectUri(),
      });
      if (createdSessionId) {
        await setActive!({
          session: createdSessionId,
          navigate: async () => {
            router.replace("/(tabs)");
          },
        });
      }
    } catch (err) {
      Alert.alert("Google Sign-Up Failed", "Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  }

  if (
    signUp.status === "missing_requirements" &&
    signUp.unverifiedFields.includes("email_address") &&
    signUp.missingFields.length === 0
  ) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient colors={["#00FF8808", "#080C14"]} style={styles.gradientTop} />
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 40, paddingBottom: 60 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoRow}>
            <View style={[styles.logoIcon, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "44" }]}>
              <Feather name="mail" size={32} color={colors.primary} />
            </View>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Verify Email</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            We sent a 6-digit code to{"\n"}{email}
          </Text>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.inputWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Feather name="hash" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.foreground, fontSize: 22, letterSpacing: 8 }]}
                value={code}
                onChangeText={setCode}
                placeholder="000000"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                maxLength={6}
                autoFocus
              />
            </View>
            {errors?.fields?.code && (
              <Text style={[styles.errorText, { color: colors.bearish }]}>{errors.fields.code.message}</Text>
            )}

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: code.length < 6 ? 0.6 : 1 }]}
              onPress={handleVerify}
              disabled={fetchStatus === "fetching" || code.length < 6}
              activeOpacity={0.85}
            >
              {fetchStatus === "fetching" ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <>
                  <Feather name="check-circle" size={18} color={colors.primaryForeground} />
                  <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>Verify & Create Account</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => signUp.verifications.sendEmailCode()} style={styles.linkBtn}>
              <Text style={[styles.linkText, { color: colors.accent }]}>Resend code</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  const isLoading = fetchStatus === "fetching";
  const canSubmit = email && password && confirmPassword && agreed && !isLoading;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={["#00FF8808", "#080C14"]} style={styles.gradientTop} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoRow}>
            <View style={[styles.logoIcon, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "44" }]}>
              <Feather name="cpu" size={32} color={colors.primary} />
            </View>
          </View>
          <Text style={[styles.appName, { color: colors.mutedForeground }]}>TRADEMIND AI</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Join thousands of traders using AI analysis
          </Text>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>Email Address</Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Feather name="mail" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your@email.com"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors?.fields?.emailAddress && (
                <Text style={[styles.errorText, { color: colors.bearish }]}>{errors.fields.emailAddress.message}</Text>
              )}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Feather name="lock" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Feather name={showPassword ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
              {errors?.fields?.password && (
                <Text style={[styles.errorText, { color: colors.bearish }]}>{errors.fields.password.message}</Text>
              )}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>Confirm Password</Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Feather name="lock" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!showPassword}
                />
              </View>
              {passwordError ? (
                <Text style={[styles.errorText, { color: colors.bearish }]}>{passwordError}</Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={styles.agreeRow}
              onPress={() => setAgreed(!agreed)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.checkbox,
                {
                  backgroundColor: agreed ? colors.primary : "transparent",
                  borderColor: agreed ? colors.primary : colors.border,
                },
              ]}>
                {agreed && <Feather name="check" size={12} color={colors.primaryForeground} />}
              </View>
              <Text style={[styles.agreeText, { color: colors.mutedForeground }]}>
                I agree to the{" "}
                <Text style={{ color: colors.accent }}>Terms of Service</Text>
                {" "}and{" "}
                <Text style={{ color: colors.accent }}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: canSubmit ? 1 : 0.6 }]}
              onPress={handleSignUp}
              disabled={!canSubmit}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <>
                  <Feather name="user-plus" size={18} color={colors.primaryForeground} />
                  <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>Create Account</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>or</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            <TouchableOpacity
              style={[styles.googleBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={handleGoogleSignUp}
              disabled={googleLoading}
              activeOpacity={0.85}
            >
              {googleLoading ? (
                <ActivityIndicator color={colors.foreground} size="small" />
              ) : (
                <>
                  <Text style={styles.googleG}>G</Text>
                  <Text style={[styles.googleBtnText, { color: colors.foreground }]}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View nativeID="clerk-captcha" />

          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Already have an account? </Text>
            <Link href="/(auth)/sign-in" asChild>
              <TouchableOpacity>
                <Text style={[styles.footerLink, { color: colors.primary }]}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradientTop: { position: "absolute", top: 0, left: 0, right: 0, height: 300 },
  scroll: { paddingHorizontal: 24, gap: 16 },
  logoRow: { alignItems: "center", marginBottom: 8 },
  logoIcon: {
    width: 72, height: 72, borderRadius: 22,
    borderWidth: 1, alignItems: "center", justifyContent: "center",
  },
  appName: { textAlign: "center", fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 3 },
  title: { fontFamily: "Inter_700Bold", fontSize: 28, textAlign: "center" },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 20 },
  card: { borderRadius: 20, borderWidth: 1, padding: 20, gap: 16 },
  fieldGroup: { gap: 8 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  inputWrap: {
    flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, height: 50,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15 },
  eyeBtn: { padding: 4 },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  agreeRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  checkbox: {
    width: 20, height: 20, borderRadius: 6, borderWidth: 1.5,
    alignItems: "center", justifyContent: "center", marginTop: 1,
  },
  agreeText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20, flex: 1 },
  primaryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, height: 52, borderRadius: 14,
  },
  primaryBtnText: { fontFamily: "Inter_700Bold", fontSize: 16 },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontFamily: "Inter_400Regular", fontSize: 12 },
  googleBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 12, height: 50, borderRadius: 14, borderWidth: 1,
  },
  googleG: { fontFamily: "Inter_700Bold", fontSize: 18, color: "#4285F4" },
  googleBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  footerRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 4 },
  footerText: { fontFamily: "Inter_400Regular", fontSize: 14 },
  footerLink: { fontFamily: "Inter_700Bold", fontSize: 14 },
  inner: { flex: 1, paddingHorizontal: 24, gap: 16 },
  linkBtn: { alignItems: "center", paddingVertical: 8 },
  linkText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
});
