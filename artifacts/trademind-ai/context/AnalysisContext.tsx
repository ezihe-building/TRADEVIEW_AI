import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface TradeAnalysis {
  id: string;
  imageUri: string;
  timestamp: number;
  pair: string;
  timeframe: string;
  sentiment: "bullish" | "bearish" | "neutral";
  confidence: number;
  direction: "long" | "short" | "wait";
  entry: string;
  stopLoss: string;
  takeProfit: string;
  riskLevel: "low" | "medium" | "high";
  patterns: string[];
  indicators: string[];
  strategy: string;
  reasoning: string;
  marketType: "crypto" | "forex" | "stocks" | "indices";
}

interface JournalEntry {
  id: string;
  analysisId: string;
  pair: string;
  direction: "long" | "short";
  entry: string;
  exit?: string;
  result?: "win" | "loss" | "breakeven";
  pnl?: string;
  notes: string;
  timestamp: number;
  sentiment: "bullish" | "bearish" | "neutral";
}

interface AnalysisContextType {
  analyses: TradeAnalysis[];
  journal: JournalEntry[];
  addAnalysis: (analysis: TradeAnalysis) => void;
  addJournalEntry: (entry: JournalEntry) => void;
  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => void;
  deleteJournalEntry: (id: string) => void;
  clearHistory: () => void;
}

const AnalysisContext = createContext<AnalysisContextType | null>(null);

const STORAGE_KEY_ANALYSES = "@trademind_analyses";
const STORAGE_KEY_JOURNAL = "@trademind_journal";

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
  const [analyses, setAnalyses] = useState<TradeAnalysis[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [a, j] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_ANALYSES),
          AsyncStorage.getItem(STORAGE_KEY_JOURNAL),
        ]);
        if (a) setAnalyses(JSON.parse(a));
        if (j) setJournal(JSON.parse(j));
      } catch {}
    })();
  }, []);

  const addAnalysis = useCallback((analysis: TradeAnalysis) => {
    setAnalyses((prev) => {
      const updated = [analysis, ...prev].slice(0, 50);
      AsyncStorage.setItem(STORAGE_KEY_ANALYSES, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addJournalEntry = useCallback((entry: JournalEntry) => {
    setJournal((prev) => {
      const updated = [entry, ...prev];
      AsyncStorage.setItem(STORAGE_KEY_JOURNAL, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateJournalEntry = useCallback(
    (id: string, updates: Partial<JournalEntry>) => {
      setJournal((prev) => {
        const updated = prev.map((e) =>
          e.id === id ? { ...e, ...updates } : e
        );
        AsyncStorage.setItem(STORAGE_KEY_JOURNAL, JSON.stringify(updated));
        return updated;
      });
    },
    []
  );

  const deleteJournalEntry = useCallback((id: string) => {
    setJournal((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      AsyncStorage.setItem(STORAGE_KEY_JOURNAL, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setAnalyses([]);
    AsyncStorage.removeItem(STORAGE_KEY_ANALYSES);
  }, []);

  return (
    <AnalysisContext.Provider
      value={{
        analyses,
        journal,
        addAnalysis,
        addJournalEntry,
        updateJournalEntry,
        deleteJournalEntry,
        clearHistory,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error("useAnalysis must be used within AnalysisProvider");
  return ctx;
}
