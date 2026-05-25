import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUser } from "@clerk/expo";
import { PLAN_OVERRIDES } from "@/config/dev-overrides";

export type PlanTier = "free" | "base" | "pro";
export type BillingInterval = "weekly" | "monthly";

export interface SubscriptionPlan {
  tier: PlanTier;
  interval?: BillingInterval;
  scansUsedToday: number;
  scansResetDate: string;
}

interface SubscriptionContextType {
  plan: SubscriptionPlan;
  isPro: boolean;
  isBase: boolean;
  isPaid: boolean;
  scansRemaining: number;
  canScan: boolean;
  useOneScan: () => boolean;
  setPlan: (tier: PlanTier, interval?: BillingInterval) => void;
  cancelSubscription: () => void;
}

const SCAN_LIMITS: Record<PlanTier, number> = {
  free: 3,
  base: 15,
  pro: Infinity,
};

const STORAGE_KEY = "@trademind_subscription";

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

function getOverrideTier(email: string | undefined): PlanTier | null {
  if (!email) return null;
  const today = getTodayString();
  const match = PLAN_OVERRIDES.find(
    (o) => o.email.toLowerCase() === email.toLowerCase() &&
      (!o.expiresAt || o.expiresAt >= today)
  );
  return match ? match.tier : null;
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [plan, setPlanState] = useState<SubscriptionPlan>({
    tier: "free",
    scansUsedToday: 0,
    scansResetDate: getTodayString(),
  });

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: SubscriptionPlan = JSON.parse(stored);
          const today = getTodayString();
          if (parsed.scansResetDate !== today) {
            parsed.scansUsedToday = 0;
            parsed.scansResetDate = today;
          }
          setPlanState(parsed);
        }
      } catch {}
    })();
  }, []);

  const email = user?.emailAddresses[0]?.emailAddress;
  const overrideTier = getOverrideTier(email);

  const savePlan = useCallback((updated: SubscriptionPlan) => {
    setPlanState(updated);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const setPlan = useCallback((tier: PlanTier, interval?: BillingInterval) => {
    savePlan({
      tier,
      interval,
      scansUsedToday: 0,
      scansResetDate: getTodayString(),
    });
  }, [savePlan]);

  const cancelSubscription = useCallback(() => {
    savePlan({
      tier: "free",
      scansUsedToday: plan.scansUsedToday,
      scansResetDate: plan.scansResetDate,
    });
  }, [savePlan, plan]);

  const effectiveTier: PlanTier = overrideTier ?? plan.tier;

  const today = getTodayString();
  const currentScansUsed =
    plan.scansResetDate === today ? plan.scansUsedToday : 0;
  const limit = SCAN_LIMITS[effectiveTier];
  const scansRemaining = limit === Infinity ? 999 : Math.max(0, limit - currentScansUsed);
  const canScan = effectiveTier === "pro" || currentScansUsed < limit;

  const useOneScan = useCallback((): boolean => {
    if (!canScan) return false;
    if (effectiveTier === "pro") return true;
    const today2 = getTodayString();
    const newUsed =
      (plan.scansResetDate === today2 ? plan.scansUsedToday : 0) + 1;
    savePlan({
      ...plan,
      scansUsedToday: newUsed,
      scansResetDate: today2,
    });
    return true;
  }, [canScan, effectiveTier, plan, savePlan]);

  return (
    <SubscriptionContext.Provider
      value={{
        plan: { ...plan, tier: effectiveTier },
        isPro: effectiveTier === "pro",
        isBase: effectiveTier === "base",
        isPaid: effectiveTier !== "free",
        scansRemaining,
        canScan,
        useOneScan,
        setPlan,
        cancelSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription must be used within SubscriptionProvider");
  return ctx;
}
