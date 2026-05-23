import React, { useRef, useEffect, useState } from "react";
import {
  Animated,
  Dimensions,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const { width: W } = Dimensions.get("window");

const FEATURES = [
  { icon: "cpu", title: "AI-Powered Chart Analysis", desc: "GPT-4.1 reads your chart and delivers institutional-grade technical analysis with entry zones, stop loss and take profit — all in seconds.", color: "#00FF88" },
  { icon: "bar-chart-2", title: "Live TradingView Charts", desc: "Full TradingView integration with RSI, MACD, and custom overlays. Switch between 30+ pairs including crypto, forex, stocks and indices.", color: "#4A90D9" },
  { icon: "trending-up", title: "Trade Level Plotter", desc: "AI automatically calculates your entry zone, stop loss and take profit levels with a visual risk/reward chart showing the full trade plan.", color: "#F7931A" },
  { icon: "globe", title: "Real-Time Market Data", desc: "Live crypto prices from CoinGecko, forex rates refreshed every 60 seconds, real news from CoinDesk, CoinTelegraph, MarketWatch and Reuters.", color: "#9B59B6" },
  { icon: "shield", title: "Risk Management Engine", desc: "Every signal includes a risk rating (Low / Med / High), risk/reward ratio, and trade management guidance — protecting your capital always.", color: "#E74C3C" },
  { icon: "book-open", title: "Trading Journal", desc: "Log every trade with entry, result and notes. Track your win rate, P&L and patterns over time to improve your trading performance.", color: "#1ABC9C" },
  { icon: "users", title: "Community Ideas", desc: "Discover trade ideas shared by other traders. React, comment, and learn from the community in real-time from your mobile device.", color: "#F39C12" },
  { icon: "zap", title: "Subscription Plans", desc: "Start free with 3 daily AI scans. Upgrade to Base (15 scans) or Pro (unlimited) to unlock the full power of TradeMind AI.", color: "#00FF88" },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Open any chart", desc: "Choose from 40+ trading pairs including crypto, forex, stocks and indices. Switch timeframes from 1-minute to weekly." },
  { step: "02", title: "Tap AI Analyze", desc: "TradeMind AI reads the chart's current market structure, indicators (RSI, MACD, EMA) and recent price action." },
  { step: "03", title: "Get your trade plan", desc: "Receive a full trade plan in seconds: direction, confidence score, entry zone, stop loss, take profit, key levels and AI reasoning." },
];

const STATS = [
  { value: "40+", label: "Trading Pairs" },
  { value: "GPT-4.1", label: "AI Engine" },
  { value: "90%+", label: "Setup Accuracy" },
  { value: "< 5s", label: "Analysis Speed" },
];

const FAQ_ITEMS = [
  {
    q: "Is TradeMind AI suitable for beginners?",
    a: "Yes. TradeMind AI explains every signal in plain language, including what patterns were detected, why the AI recommends the trade, and exactly where to place your stop loss and take profit.",
  },
  {
    q: "What markets does TradeMind AI support?",
    a: "We support cryptocurrency (BTC, ETH, SOL and more), forex (EUR/USD, GBP/USD, XAU/USD and all major pairs), stocks (AAPL, NVDA, TSLA) and global indices (S&P 500, Nasdaq, Dow, FTSE 100).",
  },
  {
    q: "How accurate is the AI analysis?",
    a: "TradeMind AI uses GPT-4.1 vision to analyze real TradingView chart data. While no analysis tool can guarantee profits, our model is trained to identify high-probability setups with clearly defined risk levels.",
  },
  {
    q: "Is my data safe?",
    a: "Yes. We use Clerk for authentication (bank-grade security), and we never store your trading account credentials. API keys for broker connections are encrypted on your device and never transmitted to our servers.",
  },
  {
    q: "Can I use TradeMind AI for live trading?",
    a: "TradeMind AI provides analysis and signals for informational purposes. You execute trades through your own broker. We support API connections for Binance, Bybit, TradingView, and MetaTrader for portfolio viewing.",
  },
  {
    q: "What is the difference between Free, Base and Pro?",
    a: "Free gives you 3 AI chart scans per day. Base (₦24,000/month) gives 15 scans with full analysis. Pro (₦48,000/month) gives unlimited scans, priority processing and advanced AI features.",
  },
  {
    q: "How does the referral program work?",
    a: "Share your unique referral link from the Menu tab. When a friend signs up and verifies their account, you both receive 5 bonus free AI scans. There is no limit to how many people you can refer.",
  },
];

const TECH_STACK = [
  { name: "GPT-4.1", desc: "OpenAI's most capable model", icon: "cpu" },
  { name: "TradingView", desc: "Professional chart platform", icon: "bar-chart-2" },
  { name: "CoinGecko API", desc: "Real-time crypto pricing", icon: "dollar-sign" },
  { name: "Expo / React Native", desc: "Cross-platform mobile app", icon: "smartphone" },
  { name: "Clerk Auth", desc: "Enterprise-grade security", icon: "shield" },
  { name: "Express.js API", desc: "Lightweight, fast backend", icon: "server" },
];

function AnimatedSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 500, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

function FAQItem({ item, colors }: { item: typeof FAQ_ITEMS[0]; colors: any }) {
  const [open, setOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  function toggle() {
    setOpen((prev) => {
      Animated.timing(anim, { toValue: prev ? 0 : 1, duration: 220, useNativeDriver: false }).start();
      return !prev;
    });
  }

  const maxH = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 200] });

  return (
    <View style={[faqSt.wrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity style={faqSt.question} onPress={toggle} activeOpacity={0.8}>
        <Text style={[faqSt.qText, { color: colors.foreground }]}>{item.q}</Text>
        <Animated.View style={{ transform: [{ rotate: anim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] }) }] }}>
          <Feather name="chevron-down" size={18} color={colors.mutedForeground} />
        </Animated.View>
      </TouchableOpacity>
      <Animated.View style={{ maxHeight: maxH, overflow: "hidden" }}>
        <Text style={[faqSt.answer, { color: colors.mutedForeground }]}>{item.a}</Text>
      </Animated.View>
    </View>
  );
}

const faqSt = StyleSheet.create({
  wrap: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  question: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  qText: { fontFamily: "Inter_600SemiBold", fontSize: 14, flex: 1, lineHeight: 20 },
  answer: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 21, padding: 16, paddingTop: 0 },
});

export default function AboutScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 0 : insets.top;

  const logoAnim = useRef(new Animated.Value(0)).current;
  const logoPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(logoAnim, { toValue: 1, duration: 700, useNativeDriver: true }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, { toValue: 1.06, duration: 1800, useNativeDriver: true }),
        Animated.timing(logoPulse, { toValue: 1, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#00FF8814", "#000000"]}
        style={s.heroBg}
      />

      <View style={[s.navbar, { paddingTop: topInset + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[s.backBtn, { backgroundColor: colors.surface }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={18} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[s.navTitle, { color: colors.foreground }]}>About TradeMind AI</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, { paddingBottom: 80 }]}>

        {/* ── Hero ── */}
        <Animated.View style={[s.hero, { opacity: logoAnim }]}>
          <Animated.View
            style={[
              s.logoCircle,
              { backgroundColor: colors.primary + "18", borderColor: colors.primary + "44", transform: [{ scale: logoPulse }] },
            ]}
          >
            <Feather name="cpu" size={44} color={colors.primary} />
          </Animated.View>
          <Text style={[s.heroTitle, { color: colors.foreground }]}>TradeMind AI</Text>
          <Text style={[s.heroTagline, { color: colors.primary }]}>Trade Smarter. Not Harder.</Text>
          <Text style={[s.heroDesc, { color: colors.mutedForeground }]}>
            The AI-powered trading assistant that reads the market like a pro trader — delivering institutional-grade chart analysis, real-time signals and trade management guidance directly to your phone.
          </Text>
          <View style={s.versionRow}>
            <View style={[s.versionPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Feather name="check-circle" size={12} color={colors.bullish} />
              <Text style={[s.versionText, { color: colors.mutedForeground }]}>v1.0.0 · Stable</Text>
            </View>
            <View style={[s.versionPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Feather name="cpu" size={12} color={colors.primary} />
              <Text style={[s.versionText, { color: colors.mutedForeground }]}>Powered by GPT-4.1</Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Stats ── */}
        <AnimatedSection delay={100}>
          <View style={s.statsGrid}>
            {STATS.map((st) => (
              <View key={st.label} style={[s.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[s.statValue, { color: colors.primary }]}>{st.value}</Text>
                <Text style={[s.statLabel, { color: colors.mutedForeground }]}>{st.label}</Text>
              </View>
            ))}
          </View>
        </AnimatedSection>

        {/* ── What We Do ── */}
        <AnimatedSection delay={150}>
          <View style={[s.sectionHeader, { borderLeftColor: colors.primary }]}>
            <Text style={[s.sectionTitle, { color: colors.foreground }]}>What is TradeMind AI?</Text>
          </View>
          <View style={[s.textCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.bodyText, { color: colors.foreground }]}>
              TradeMind AI is a next-generation trading tool built for both beginner and experienced traders. We combine real-time market data with OpenAI's most capable model to deliver fast, accurate and actionable trading signals — all from your mobile device.
            </Text>
            <View style={{ height: 12 }} />
            <Text style={[s.bodyText, { color: colors.foreground }]}>
              Unlike traditional trading apps that only show charts and prices, TradeMind AI actually thinks about the market for you. It identifies chart patterns, reads indicator confluences, calculates optimal risk levels, and tells you exactly what the trade looks like — entry, stop loss, take profit and why.
            </Text>
            <View style={{ height: 12 }} />
            <Text style={[s.bodyText, { color: colors.foreground }]}>
              Whether you trade Bitcoin, EUR/USD, Gold, NVIDIA or the S&P 500 — TradeMind AI has you covered with professional-grade analysis at a fraction of the cost of a human analyst.
            </Text>
          </View>
        </AnimatedSection>

        {/* ── How It Works ── */}
        <AnimatedSection delay={200}>
          <View style={[s.sectionHeader, { borderLeftColor: colors.accent }]}>
            <Text style={[s.sectionTitle, { color: colors.foreground }]}>How It Works</Text>
          </View>
          {HOW_IT_WORKS.map((step, i) => (
            <View
              key={step.step}
              style={[s.stepRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[s.stepNum, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "33" }]}>
                <Text style={[s.stepNumText, { color: colors.primary }]}>{step.step}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.stepTitle, { color: colors.foreground }]}>{step.title}</Text>
                <Text style={[s.stepDesc, { color: colors.mutedForeground }]}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </AnimatedSection>

        {/* ── Features ── */}
        <AnimatedSection delay={250}>
          <View style={[s.sectionHeader, { borderLeftColor: "#F7931A" }]}>
            <Text style={[s.sectionTitle, { color: colors.foreground }]}>Key Features</Text>
          </View>
          <View style={s.featureGrid}>
            {FEATURES.map((f) => (
              <View
                key={f.title}
                style={[s.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[s.featureIcon, { backgroundColor: f.color + "18", borderColor: f.color + "33" }]}>
                  <Feather name={f.icon as any} size={20} color={f.color} />
                </View>
                <Text style={[s.featureTitle, { color: colors.foreground }]}>{f.title}</Text>
                <Text style={[s.featureDesc, { color: colors.mutedForeground }]}>{f.desc}</Text>
              </View>
            ))}
          </View>
        </AnimatedSection>

        {/* ── AI Technology ── */}
        <AnimatedSection delay={300}>
          <View style={[s.sectionHeader, { borderLeftColor: colors.primary }]}>
            <Text style={[s.sectionTitle, { color: colors.foreground }]}>AI Technology</Text>
          </View>
          <View style={[s.textCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.aiLogoRow}>
              <View style={[s.aiLogo, { backgroundColor: colors.primary + "18" }]}>
                <Feather name="cpu" size={22} color={colors.primary} />
              </View>
              <View>
                <Text style={[s.aiModelName, { color: colors.foreground }]}>GPT-4.1 Vision</Text>
                <Text style={[s.aiModelSub, { color: colors.mutedForeground }]}>OpenAI's most capable multimodal model</Text>
              </View>
            </View>
            <Text style={[s.bodyText, { color: colors.foreground }]}>
              TradeMind AI is built on top of OpenAI's GPT-4.1, one of the world's most advanced large language models. We use it with a specialized financial trading prompt that instructs the AI to think and reason like a professional technical analyst.
            </Text>
            <View style={{ height: 10 }} />
            <Text style={[s.bodyText, { color: colors.foreground }]}>
              The AI analyzes the current chart pair, timeframe and market context simultaneously. It identifies support and resistance levels, trend direction, momentum indicators, candlestick patterns and volume signals — then synthesizes all of this into one clear, actionable trade recommendation.
            </Text>
            <View style={{ height: 10 }} />
            <Text style={[s.bodyText, { color: colors.foreground }]}>
              Each analysis includes a confidence score (0–100%), a risk rating, risk/reward ratio and detailed reasoning so you understand exactly why the AI is recommending the trade.
            </Text>
          </View>
        </AnimatedSection>

        {/* ── Tech Stack ── */}
        <AnimatedSection delay={350}>
          <View style={[s.sectionHeader, { borderLeftColor: colors.accent }]}>
            <Text style={[s.sectionTitle, { color: colors.foreground }]}>Technology Stack</Text>
          </View>
          <View style={s.techGrid}>
            {TECH_STACK.map((t) => (
              <View
                key={t.name}
                style={[s.techCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Feather name={t.icon as any} size={18} color={colors.primary} />
                <Text style={[s.techName, { color: colors.foreground }]}>{t.name}</Text>
                <Text style={[s.techDesc, { color: colors.mutedForeground }]}>{t.desc}</Text>
              </View>
            ))}
          </View>
        </AnimatedSection>

        {/* ── FAQ ── */}
        <AnimatedSection delay={400}>
          <View style={[s.sectionHeader, { borderLeftColor: "#9B59B6" }]}>
            <Text style={[s.sectionTitle, { color: colors.foreground }]}>Frequently Asked Questions</Text>
          </View>
          <View style={{ gap: 10 }}>
            {FAQ_ITEMS.map((item) => (
              <FAQItem key={item.q} item={item} colors={colors} />
            ))}
          </View>
        </AnimatedSection>

        {/* ── Risk Disclaimer ── */}
        <AnimatedSection delay={450}>
          <View style={[s.riskBox, { backgroundColor: colors.bearish + "0D", borderColor: colors.bearish + "33" }]}>
            <View style={s.riskHeader}>
              <Feather name="alert-triangle" size={16} color={colors.bearish} />
              <Text style={[s.riskTitle, { color: colors.bearish }]}>Risk Disclaimer</Text>
            </View>
            <Text style={[s.riskText, { color: colors.mutedForeground }]}>
              Trading financial instruments involves substantial risk of loss and is not suitable for all investors. TradeMind AI provides technical analysis tools for educational and informational purposes only. Past performance is not indicative of future results. Never risk more than you can afford to lose. This app does not constitute financial advice. Please consult a qualified financial advisor before making investment decisions.
            </Text>
          </View>
        </AnimatedSection>

        {/* ── Contact & Links ── */}
        <AnimatedSection delay={500}>
          <View style={[s.sectionHeader, { borderLeftColor: colors.bullish }]}>
            <Text style={[s.sectionTitle, { color: colors.foreground }]}>Contact & Links</Text>
          </View>
          <View style={s.linkGrid}>
            {[
              { label: "Help Center", icon: "help-circle", url: "https://trademindai.com/help" },
              { label: "Privacy Policy", icon: "file-text", url: "https://trademindai.com/privacy" },
              { label: "Terms of Service", icon: "book-open", url: "https://trademindai.com/terms" },
              { label: "Contact Support", icon: "mail", url: "mailto:support@trademindai.com" },
            ].map((link) => (
              <TouchableOpacity
                key={link.label}
                style={[s.linkCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => Linking.openURL(link.url).catch(() => {})}
                activeOpacity={0.8}
              >
                <Feather name={link.icon as any} size={18} color={colors.primary} />
                <Text style={[s.linkLabel, { color: colors.foreground }]}>{link.label}</Text>
                <Feather name="external-link" size={13} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))}
          </View>
        </AnimatedSection>

        {/* ── Footer ── */}
        <AnimatedSection delay={550}>
          <View style={s.footer}>
            <View style={[s.footerLogo, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "33" }]}>
              <Feather name="cpu" size={24} color={colors.primary} />
            </View>
            <Text style={[s.footerTitle, { color: colors.foreground }]}>TradeMind AI</Text>
            <Text style={[s.footerSub, { color: colors.mutedForeground }]}>
              Version 1.0.0 · Powered by GPT-4.1
            </Text>
            <Text style={[s.footerSub, { color: colors.mutedForeground }]}>
              © 2026 TradeMind AI. All rights reserved.
            </Text>
            <Text style={[s.footerSub, { color: colors.mutedForeground }]}>
              Built with ❤️ for traders worldwide
            </Text>
          </View>
        </AnimatedSection>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  heroBg: { position: "absolute", top: 0, left: 0, right: 0, height: 380 },
  navbar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  navTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  scroll: { paddingHorizontal: 16, paddingTop: 24, gap: 28 },

  hero: { alignItems: "center", gap: 12, paddingVertical: 8 },
  logoCircle: {
    width: 100, height: 100, borderRadius: 28, borderWidth: 1.5,
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  heroTitle: { fontFamily: "Inter_700Bold", fontSize: 34 },
  heroTagline: { fontFamily: "Inter_700Bold", fontSize: 17, letterSpacing: 0.5 },
  heroDesc: { fontFamily: "Inter_400Regular", fontSize: 15, textAlign: "center", lineHeight: 24, paddingHorizontal: 8 },
  versionRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  versionPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1,
  },
  versionText: { fontFamily: "Inter_400Regular", fontSize: 12 },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: {
    width: (W - 48) / 2, padding: 18, borderRadius: 14, borderWidth: 1,
    alignItems: "center", gap: 4,
  },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 24 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 12 },

  sectionHeader: { borderLeftWidth: 3, paddingLeft: 12, marginBottom: 4 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 20 },

  textCard: { borderRadius: 14, borderWidth: 1, padding: 18 },
  bodyText: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 24 },

  stepRow: {
    flexDirection: "row", gap: 14, padding: 16, borderRadius: 14,
    borderWidth: 1, alignItems: "flex-start", marginBottom: 10,
  },
  stepNum: {
    width: 44, height: 44, borderRadius: 12, borderWidth: 1,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  stepNumText: { fontFamily: "Inter_700Bold", fontSize: 14 },
  stepTitle: { fontFamily: "Inter_700Bold", fontSize: 15, marginBottom: 4 },
  stepDesc: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20 },

  featureGrid: { gap: 12 },
  featureCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10 },
  featureIcon: {
    width: 44, height: 44, borderRadius: 12, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  featureTitle: { fontFamily: "Inter_700Bold", fontSize: 15 },
  featureDesc: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20 },

  aiLogoRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  aiLogo: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  aiModelName: { fontFamily: "Inter_700Bold", fontSize: 16 },
  aiModelSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },

  techGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  techCard: {
    width: (W - 48) / 2, padding: 14, borderRadius: 12, borderWidth: 1, gap: 6,
  },
  techName: { fontFamily: "Inter_700Bold", fontSize: 13 },
  techDesc: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 16 },

  riskBox: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10 },
  riskHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  riskTitle: { fontFamily: "Inter_700Bold", fontSize: 14 },
  riskText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 21 },

  linkGrid: { gap: 10 },
  linkCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 12, borderWidth: 1,
  },
  linkLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14, flex: 1 },

  footer: { alignItems: "center", gap: 8, paddingVertical: 16 },
  footerLogo: {
    width: 56, height: 56, borderRadius: 16, borderWidth: 1,
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  footerTitle: { fontFamily: "Inter_700Bold", fontSize: 20 },
  footerSub: { fontFamily: "Inter_400Regular", fontSize: 12 },
});
