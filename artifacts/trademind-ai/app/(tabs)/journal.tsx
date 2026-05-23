import React, { useState, useRef, useEffect } from "react";
import {
  Alert,
  Animated,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAnalysis } from "@/context/AnalysisContext";

type JournalFilter = "all" | "long" | "short" | "win" | "loss";

const MOCK_IDEAS = [
  {
    id: "idea1",
    user: "CryptoWolf",
    avatar: "C",
    time: "2h ago",
    pair: "BTC/USDT",
    sentiment: "bullish" as const,
    title: "BTC forming double bottom — long setup",
    body: "Strong support at $65,800. RSI recovering from oversold. Target $72,000. Risk 1%.",
    likes: 142, comments: 38,
  },
  {
    id: "idea2",
    user: "ForexKing",
    avatar: "F",
    time: "4h ago",
    pair: "EUR/USD",
    sentiment: "bearish" as const,
    title: "EUR/USD weekly supply zone rejection",
    body: "Price rejected at 1.0950 weekly supply. MACD bearish. Short to 1.0780.",
    likes: 89, comments: 21,
  },
  {
    id: "idea3",
    user: "GoldBull",
    avatar: "G",
    time: "6h ago",
    pair: "XAU/USD",
    sentiment: "bullish" as const,
    title: "Gold breakout above $2,380 resistance",
    body: "Gold breaking key weekly resistance on high volume. Next target $2,420.",
    likes: 211, comments: 54,
  },
  {
    id: "idea4",
    user: "TechTrader",
    avatar: "T",
    time: "8h ago",
    pair: "NVDA",
    sentiment: "bullish" as const,
    title: "NVDA pre-earnings momentum play",
    body: "Strong momentum into earnings. Options flow bullish. Target $950 short-term.",
    likes: 176, comments: 42,
  },
];

interface TradeNote {
  id: string;
  pair: string;
  direction: "long" | "short";
  entry: string;
  result: "win" | "loss" | "open";
  pnl: string;
  notes: string;
  date: string;
}

const MOCK_TRADES: TradeNote[] = [
  { id: "t1", pair: "BTC/USDT", direction: "long", entry: "65200", result: "win", pnl: "+3.2%", notes: "Clean breakout trade.", date: "May 16" },
  { id: "t2", pair: "EUR/USD", direction: "short", entry: "1.0932", result: "loss", pnl: "-1.0%", notes: "Stopped out on news spike.", date: "May 15" },
  { id: "t3", pair: "SOL/USDT", direction: "long", entry: "158", result: "win", pnl: "+8.1%", notes: "AI signal confirmed breakout.", date: "May 14" },
  { id: "t4", pair: "NVDA", direction: "long", entry: "842", result: "open", pnl: "+2.4%", notes: "Holding to earnings.", date: "May 13" },
];

export default function CommunityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { analyses } = useAnalysis();
  const topInset = Platform.OS === "web" ? 0 : insets.top;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  const [activeTab, setActiveTab] = useState<"ideas" | "journal">("ideas");
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [showNewNote, setShowNewNote] = useState(false);
  const [notePair, setNotePair] = useState("");
  const [noteText, setNoteText] = useState("");

  function toggleLike(id: string) {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  const wins = MOCK_TRADES.filter((t) => t.result === "win").length;
  const losses = MOCK_TRADES.filter((t) => t.result === "loss").length;
  const winRate = MOCK_TRADES.length > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;

  return (
    <Animated.View style={[styles.container, { backgroundColor: colors.background, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={[styles.topBar, { paddingTop: topInset + 12, backgroundColor: colors.background }]}>
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Community</Text>
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setShowNewNote(true)}
        >
          <Feather name="plus" size={18} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <View style={[styles.tabRow, { paddingHorizontal: 16 }]}>
        {([
          { key: "ideas", label: "Trade Ideas" },
          { key: "journal", label: "My Journal" },
        ] as const).map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                {
                  borderBottomWidth: 2,
                  borderBottomColor: active ? colors.primary : "transparent",
                },
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, { color: active ? colors.primary : colors.mutedForeground }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: 120 }]}
      >
        {activeTab === "ideas" && (
          <>
            <TouchableOpacity
              style={[styles.shareBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowNewNote(true)}
            >
              <View style={[styles.shareBtnInner, { backgroundColor: colors.surface }]}>
                <Feather name="edit-3" size={16} color={colors.mutedForeground} />
                <Text style={[styles.shareBtnText, { color: colors.mutedForeground }]}>
                  Share a trade idea…
                </Text>
              </View>
            </TouchableOpacity>

            {MOCK_IDEAS.map((idea) => {
              const sentColor = idea.sentiment === "bullish" ? colors.bullish : colors.bearish;
              const liked = likedIds.has(idea.id);
              return (
                <View key={idea.id} style={[styles.ideaCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.ideaHeader}>
                    <View style={[styles.userAvatar, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.userAvatarText, { color: colors.foreground }]}>{idea.avatar}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.userName, { color: colors.foreground }]}>{idea.user}</Text>
                      <Text style={[styles.ideaTime, { color: colors.mutedForeground }]}>{idea.time}</Text>
                    </View>
                    <View style={[styles.pairBadge, { backgroundColor: sentColor + "22", borderColor: sentColor + "33" }]}>
                      <Text style={[styles.pairBadgeText, { color: sentColor }]}>
                        {idea.pair} · {idea.sentiment.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.ideaTitle, { color: colors.foreground }]}>{idea.title}</Text>
                  <Text style={[styles.ideaBody, { color: colors.mutedForeground }]}>{idea.body}</Text>

                  <View style={[styles.ideaActions, { borderTopColor: colors.border }]}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => toggleLike(idea.id)}>
                      <Feather name="heart" size={15} color={liked ? colors.bearish : colors.mutedForeground} />
                      <Text style={[styles.actionText, { color: liked ? colors.bearish : colors.mutedForeground }]}>
                        {idea.likes + (liked ? 1 : 0)}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => {}}>
                      <Feather name="message-square" size={15} color={colors.mutedForeground} />
                      <Text style={[styles.actionText, { color: colors.mutedForeground }]}>{idea.comments}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/(tabs)/chart" as any)}>
                      <Feather name="bar-chart-2" size={15} color={colors.mutedForeground} />
                      <Text style={[styles.actionText, { color: colors.mutedForeground }]}>View Chart</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {activeTab === "journal" && (
          <>
            <View style={styles.statsRow}>
              <StatBox label="Total Trades" value={`${MOCK_TRADES.length + analyses.length}`} color={colors.foreground} colors={colors} />
              <StatBox label="Win Rate" value={`${winRate}%`} color={winRate >= 50 ? colors.bullish : colors.bearish} colors={colors} />
              <StatBox label="AI Signals" value={`${analyses.length}`} color={colors.primary} colors={colors} />
            </View>

            <TouchableOpacity
              style={[styles.addTradeBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowNewNote(true)}
              activeOpacity={0.85}
            >
              <Feather name="plus" size={16} color="#000" />
              <Text style={[styles.addTradeBtnText, { color: "#000" }]}>Log a Trade</Text>
            </TouchableOpacity>

            {MOCK_TRADES.map((trade) => {
              const isWin = trade.result === "win";
              const isOpen = trade.result === "open";
              const color = isOpen ? colors.accent : isWin ? colors.bullish : colors.bearish;
              return (
                <View key={trade.id} style={[styles.tradeRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.tradeDir, { backgroundColor: (trade.direction === "long" ? colors.bullish : colors.bearish) + "22" }]}>
                    <Feather
                      name={trade.direction === "long" ? "arrow-up" : "arrow-down"}
                      size={14}
                      color={trade.direction === "long" ? colors.bullish : colors.bearish}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.tradePair, { color: colors.foreground }]}>{trade.pair}</Text>
                    <Text style={[styles.tradeDate, { color: colors.mutedForeground }]}>{trade.date} · {trade.direction.toUpperCase()}</Text>
                    {trade.notes ? (
                      <Text style={[styles.tradeNotes, { color: colors.mutedForeground }]}>{trade.notes}</Text>
                    ) : null}
                  </View>
                  <View style={styles.tradeRight}>
                    <Text style={[styles.tradePnl, { color }]}>{trade.pnl}</Text>
                    <View style={[styles.resultBadge, { backgroundColor: color + "22" }]}>
                      <Text style={[styles.resultText, { color }]}>{trade.result.toUpperCase()}</Text>
                    </View>
                  </View>
                </View>
              );
            })}

            {analyses.slice(0, 5).map((a) => {
              const sentColor = a.sentiment === "bullish" ? colors.bullish : a.sentiment === "bearish" ? colors.bearish : colors.neutral;
              return (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.aiSignalRow, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: sentColor }]}
                  onPress={() => router.push({ pathname: "/analysis/[id]", params: { id: a.id } })}
                  activeOpacity={0.75}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.tradePair, { color: colors.foreground }]}>{a.pair} · {a.timeframe}</Text>
                    <Text style={[styles.tradeDate, { color: colors.mutedForeground }]}>
                      AI Signal · {new Date(a.timestamp).toLocaleDateString()}
                    </Text>
                    <Text style={[styles.tradeNotes, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {a.reasoning}
                    </Text>
                  </View>
                  <View style={[styles.resultBadge, { backgroundColor: sentColor + "22" }]}>
                    <Text style={[styles.resultText, { color: sentColor }]}>{a.direction?.toUpperCase()}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>

      <Modal visible={showNewNote} animationType="slide" transparent onRequestClose={() => setShowNewNote(false)}>
        <View style={modalStyles.overlay}>
          <TouchableOpacity style={modalStyles.dismiss} onPress={() => setShowNewNote(false)} />
          <View style={[modalStyles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={modalStyles.handle} />
            <Text style={[modalStyles.title, { color: colors.foreground }]}>New Trade Note</Text>
            <TextInput
              style={[modalStyles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
              value={notePair}
              onChangeText={setNotePair}
              placeholder="Symbol (e.g. BTC/USDT)"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="characters"
            />
            <TextInput
              style={[modalStyles.textArea, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
              value={noteText}
              onChangeText={setNoteText}
              placeholder="Add your notes, strategy, and result…"
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[modalStyles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                if (!notePair.trim()) {
                  Alert.alert("Required", "Please enter a symbol.");
                  return;
                }
                setNotePair("");
                setNoteText("");
                setShowNewNote(false);
                Alert.alert("Saved!", "Trade note logged to your journal.");
              }}
              activeOpacity={0.85}
            >
              <Text style={[modalStyles.saveBtnText, { color: "#000" }]}>Save Note</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

function StatBox({ label, value, color, colors }: { label: string; value: string; color: string; colors: any }) {
  return (
    <View style={[statStyles.box, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={[statStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}
const statStyles = StyleSheet.create({
  box: { flex: 1, alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1 },
  value: { fontFamily: "Inter_700Bold", fontSize: 20 },
  label: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 4 },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  dismiss: { flex: 1 },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderBottomWidth: 0, padding: 24, gap: 14 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#2A2E39", alignSelf: "center" },
  title: { fontFamily: "Inter_700Bold", fontSize: 20 },
  input: { borderRadius: 10, borderWidth: 1, padding: 13, fontFamily: "Inter_400Regular", fontSize: 14 },
  textArea: { borderRadius: 10, borderWidth: 1, padding: 13, fontFamily: "Inter_400Regular", fontSize: 14, height: 120 },
  saveBtn: { paddingVertical: 15, borderRadius: 12, alignItems: "center" },
  saveBtnText: { fontFamily: "Inter_700Bold", fontSize: 15 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end",
    paddingHorizontal: 16, paddingBottom: 12,
  },
  pageTitle: { fontFamily: "Inter_700Bold", fontSize: 26 },
  iconBtn: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  tabRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#2A2E39", marginBottom: 8 },
  tab: { paddingHorizontal: 20, paddingVertical: 12 },
  tabText: { fontFamily: "Inter_700Bold", fontSize: 15 },
  scroll: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },
  shareBtn: { borderRadius: 12, borderWidth: 1, padding: 12 },
  shareBtnInner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 8 },
  shareBtnText: { fontFamily: "Inter_400Regular", fontSize: 14 },
  ideaCard: { borderRadius: 12, borderWidth: 1, padding: 16, gap: 10 },
  ideaHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  userAvatar: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  userAvatarText: { fontFamily: "Inter_700Bold", fontSize: 14 },
  userName: { fontFamily: "Inter_700Bold", fontSize: 14 },
  ideaTime: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 1 },
  pairBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  pairBadgeText: { fontFamily: "Inter_700Bold", fontSize: 11 },
  ideaTitle: { fontFamily: "Inter_700Bold", fontSize: 15 },
  ideaBody: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20 },
  ideaActions: {
    flexDirection: "row", gap: 20, paddingTop: 10, borderTopWidth: 1,
  },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  statsRow: { flexDirection: "row", gap: 10 },
  addTradeBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 13, borderRadius: 12,
  },
  addTradeBtnText: { fontFamily: "Inter_700Bold", fontSize: 15 },
  tradeRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  tradeDir: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  tradePair: { fontFamily: "Inter_700Bold", fontSize: 14 },
  tradeDate: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  tradeNotes: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 3 },
  tradeRight: { alignItems: "flex-end", gap: 4 },
  tradePnl: { fontFamily: "Inter_700Bold", fontSize: 15 },
  resultBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  resultText: { fontFamily: "Inter_700Bold", fontSize: 10 },
  aiSignalRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 12, borderWidth: 1, borderLeftWidth: 3,
  },
});
