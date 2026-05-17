import React, { useState } from "react";
import {
  Alert,
  FlatList,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAnalysis } from "@/context/AnalysisContext";
import { GlassCard } from "@/components/GlassCard";
import { SentimentBadge } from "@/components/SentimentBadge";

type Direction = "long" | "short";
type Result = "win" | "loss" | "breakeven";

interface JournalEntry {
  id: string;
  analysisId: string;
  pair: string;
  direction: Direction;
  entry: string;
  exit?: string;
  result?: Result;
  pnl?: string;
  notes: string;
  timestamp: number;
  sentiment: "bullish" | "bearish" | "neutral";
}

export default function JournalScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { analyses, journal, addJournalEntry, updateJournalEntry, deleteJournalEntry } =
    useAnalysis();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    pair: "",
    direction: "long" as Direction,
    entry: "",
    exit: "",
    result: undefined as Result | undefined,
    pnl: "",
    notes: "",
  });

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const stats = {
    total: journal.length,
    wins: journal.filter((j) => j.result === "win").length,
    losses: journal.filter((j) => j.result === "loss").length,
    winRate:
      journal.length > 0
        ? Math.round(
            (journal.filter((j) => j.result === "win").length / journal.length) * 100
          )
        : 0,
  };

  function openAdd() {
    setEditingId(null);
    setForm({ pair: "", direction: "long", entry: "", exit: "", result: undefined, pnl: "", notes: "" });
    setShowModal(true);
  }

  function openEdit(entry: JournalEntry) {
    setEditingId(entry.id);
    setForm({
      pair: entry.pair,
      direction: entry.direction,
      entry: entry.entry,
      exit: entry.exit ?? "",
      result: entry.result,
      pnl: entry.pnl ?? "",
      notes: entry.notes,
    });
    setShowModal(true);
  }

  async function save() {
    if (!form.pair.trim()) {
      Alert.alert("Error", "Please enter a trading pair.");
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (editingId) {
      updateJournalEntry(editingId, {
        pair: form.pair,
        direction: form.direction,
        entry: form.entry,
        exit: form.exit || undefined,
        result: form.result,
        pnl: form.pnl || undefined,
        notes: form.notes,
      });
    } else {
      const newEntry: JournalEntry = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        analysisId: "",
        pair: form.pair,
        direction: form.direction,
        entry: form.entry,
        exit: form.exit || undefined,
        result: form.result,
        pnl: form.pnl || undefined,
        notes: form.notes,
        timestamp: Date.now(),
        sentiment: form.direction === "long" ? "bullish" : "bearish",
      };
      addJournalEntry(newEntry);
    }
    setShowModal(false);
  }

  async function confirmDelete(id: string) {
    Alert.alert("Delete Entry", "Remove this trade from your journal?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          deleteJournalEntry(id);
        },
      },
    ]);
  }

  const resultConfig = {
    win: { color: colors.bullish, icon: "check-circle" as const, label: "Win" },
    loss: { color: colors.bearish, icon: "x-circle" as const, label: "Loss" },
    breakeven: { color: colors.neutral, icon: "minus-circle" as const, label: "BE" },
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topInset + 16,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Trade Journal</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={openAdd}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={20} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={[styles.statsRow, { backgroundColor: colors.background }]}>
        <StatPill label="Trades" value={stats.total.toString()} color={colors.accent} />
        <StatPill label="Wins" value={stats.wins.toString()} color={colors.bullish} />
        <StatPill label="Losses" value={stats.losses.toString()} color={colors.bearish} />
        <StatPill label="Win Rate" value={`${stats.winRate}%`} color={colors.neutral} />
      </View>

      {journal.length === 0 ? (
        <View style={styles.emptyCenter}>
          <GlassCard style={styles.emptyCard}>
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: colors.accent + "22", borderColor: colors.accent + "44" },
              ]}
            >
              <Feather name="book" size={28} color={colors.accent} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No trades logged
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Log your trades to track performance and improve your strategy
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={openAdd}
            >
              <Feather name="plus" size={16} color={colors.primaryForeground} />
              <Text style={[styles.emptyBtnText, { color: colors.primaryForeground }]}>
                Log Trade
              </Text>
            </TouchableOpacity>
          </GlassCard>
        </View>
      ) : (
        <FlatList
          data={journal}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const rc = item.result ? resultConfig[item.result] : null;
            const dirColor =
              item.direction === "long" ? colors.bullish : colors.bearish;
            return (
              <TouchableOpacity onPress={() => openEdit(item)} activeOpacity={0.8}>
                <GlassCard
                  glow={
                    item.result === "win"
                      ? "green"
                      : item.result === "loss"
                        ? "red"
                        : "none"
                  }
                  style={styles.entryCard}
                >
                  <View style={styles.entryHeader}>
                    <View style={styles.entryLeft}>
                      <Text style={[styles.entryPair, { color: colors.foreground }]}>
                        {item.pair}
                      </Text>
                      <View
                        style={[
                          styles.dirBadge,
                          {
                            backgroundColor: dirColor + "22",
                            borderColor: dirColor + "55",
                          },
                        ]}
                      >
                        <Feather
                          name={item.direction === "long" ? "arrow-up" : "arrow-down"}
                          size={10}
                          color={dirColor}
                        />
                        <Text
                          style={[
                            styles.dirText,
                            { color: dirColor },
                          ]}
                        >
                          {item.direction.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.entryRight}>
                      {rc ? (
                        <View
                          style={[
                            styles.resultBadge,
                            {
                              backgroundColor: rc.color + "22",
                              borderColor: rc.color + "55",
                            },
                          ]}
                        >
                          <Feather name={rc.icon} size={12} color={rc.color} />
                          <Text style={[styles.resultText, { color: rc.color }]}>
                            {rc.label}
                          </Text>
                        </View>
                      ) : null}
                      <TouchableOpacity
                        onPress={() => confirmDelete(item.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Feather name="trash-2" size={14} color={colors.mutedForeground} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.levelRow}>
                    {item.entry ? (
                      <MiniLevel label="Entry" value={item.entry} color={colors.accent} />
                    ) : null}
                    {item.exit ? (
                      <MiniLevel label="Exit" value={item.exit} color={colors.foreground} />
                    ) : null}
                    {item.pnl ? (
                      <MiniLevel
                        label="P&L"
                        value={item.pnl}
                        color={
                          item.result === "win"
                            ? colors.bullish
                            : item.result === "loss"
                              ? colors.bearish
                              : colors.neutral
                        }
                      />
                    ) : null}
                  </View>

                  {item.notes ? (
                    <Text
                      style={[styles.notes, { color: colors.mutedForeground }]}
                      numberOfLines={2}
                    >
                      {item.notes}
                    </Text>
                  ) : null}

                  <Text style={[styles.entryTime, { color: colors.mutedForeground }]}>
                    {new Date(item.timestamp).toLocaleDateString()}
                  </Text>
                </GlassCard>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {editingId ? "Edit Trade" : "Log Trade"}
            </Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalContent}
            keyboardShouldPersistTaps="handled"
          >
            <FormField
              label="Trading Pair"
              value={form.pair}
              onChangeText={(v) => setForm((f) => ({ ...f, pair: v }))}
              placeholder="e.g. BTC/USDT"
            />

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>
                Direction
              </Text>
              <View style={styles.toggleRow}>
                {(["long", "short"] as Direction[]).map((d) => (
                  <TouchableOpacity
                    key={d}
                    onPress={() => setForm((f) => ({ ...f, direction: d }))}
                    style={[
                      styles.toggle,
                      {
                        backgroundColor:
                          form.direction === d
                            ? (d === "long" ? colors.bullish : colors.bearish) + "33"
                            : colors.surface,
                        borderColor:
                          form.direction === d
                            ? d === "long"
                              ? colors.bullish
                              : colors.bearish
                            : colors.border,
                        flex: 1,
                      },
                    ]}
                  >
                    <Feather
                      name={d === "long" ? "arrow-up" : "arrow-down"}
                      size={14}
                      color={
                        form.direction === d
                          ? d === "long"
                            ? colors.bullish
                            : colors.bearish
                          : colors.mutedForeground
                      }
                    />
                    <Text
                      style={[
                        styles.toggleText,
                        {
                          color:
                            form.direction === d
                              ? d === "long"
                                ? colors.bullish
                                : colors.bearish
                              : colors.mutedForeground,
                        },
                      ]}
                    >
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <FormField
              label="Entry Price"
              value={form.entry}
              onChangeText={(v) => setForm((f) => ({ ...f, entry: v }))}
              placeholder="e.g. 42500"
              keyboardType="decimal-pad"
            />
            <FormField
              label="Exit Price (optional)"
              value={form.exit}
              onChangeText={(v) => setForm((f) => ({ ...f, exit: v }))}
              placeholder="e.g. 43800"
              keyboardType="decimal-pad"
            />
            <FormField
              label="P&L (optional)"
              value={form.pnl}
              onChangeText={(v) => setForm((f) => ({ ...f, pnl: v }))}
              placeholder="e.g. +2.5% or +$125"
            />

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>
                Result (optional)
              </Text>
              <View style={styles.toggleRow}>
                {(["win", "loss", "breakeven"] as Result[]).map((r) => {
                  const rc = resultConfig[r];
                  const active = form.result === r;
                  return (
                    <TouchableOpacity
                      key={r}
                      onPress={() =>
                        setForm((f) => ({ ...f, result: active ? undefined : r }))
                      }
                      style={[
                        styles.toggle,
                        {
                          backgroundColor: active ? rc.color + "22" : colors.surface,
                          borderColor: active ? rc.color : colors.border,
                          flex: 1,
                        },
                      ]}
                    >
                      <Feather
                        name={rc.icon}
                        size={12}
                        color={active ? rc.color : colors.mutedForeground}
                      />
                      <Text
                        style={[
                          styles.toggleText,
                          { color: active ? rc.color : colors.mutedForeground },
                        ]}
                      >
                        {rc.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>
                Notes
              </Text>
              <TextInput
                value={form.notes}
                onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
                placeholder="Trade setup, lessons learned..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={4}
                style={[
                  styles.textarea,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={save}
              activeOpacity={0.85}
            >
              <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>
                {editingId ? "Update Trade" : "Log Trade"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: any;
}) {
  const colors = useColors();
  return (
    <View style={styles.formGroup}>
      <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType}
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: colors.foreground,
          },
        ]}
      />
    </View>
  );
}

function MiniLevel({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  const colors = useColors();
  return (
    <View style={{ alignItems: "center", gap: 2 }}>
      <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: colors.mutedForeground }}>
        {label}
      </Text>
      <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color }}>{value}</Text>
    </View>
  );
}

function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.statPill, { backgroundColor: colors.surface }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 24 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  statPill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 2,
  },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 16 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 10 },
  list: { paddingHorizontal: 16, paddingTop: 12, gap: 10, paddingBottom: 100 },
  emptyCenter: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  emptyCard: { padding: 32, alignItems: "center", gap: 12 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  emptyBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  entryCard: { gap: 10 },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  entryLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  entryPair: { fontFamily: "Inter_700Bold", fontSize: 16 },
  dirBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  dirText: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 0.5 },
  entryRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  resultBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  resultText: { fontFamily: "Inter_700Bold", fontSize: 11 },
  levelRow: { flexDirection: "row", gap: 20 },
  notes: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    fontStyle: "italic",
  },
  entryTime: { fontFamily: "Inter_400Regular", fontSize: 11 },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 20,
    borderBottomWidth: 1,
  },
  modalTitle: { fontFamily: "Inter_700Bold", fontSize: 20 },
  modalScroll: { flex: 1 },
  modalContent: { padding: 20, gap: 16 },
  formGroup: { gap: 8 },
  formLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    height: 100,
    textAlignVertical: "top",
  },
  toggleRow: { flexDirection: "row", gap: 8 },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  toggleText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  saveBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnText: { fontFamily: "Inter_700Bold", fontSize: 16 },
});
