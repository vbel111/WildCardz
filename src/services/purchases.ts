import { Platform } from 'react-native';
import Purchases, {
  type CustomerInfo,
  type PurchasesPackage,
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
} from 'react-native-purchases';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from '@/stores/storage';

/** Entitlement identifier configured in the RevenueCat dashboard. */
export const VIP_ENTITLEMENT = 'vip';

const apiKey = Platform.select({
  android: process.env.EXPO_PUBLIC_RC_ANDROID_KEY,
  ios: process.env.EXPO_PUBLIC_RC_IOS_KEY,
});

export type Plan = {
  id: string;
  kind: 'annual' | 'weekly' | 'lifetime' | 'other';
  title: string;
  price: string;
  period: string;
  pkg: PurchasesPackage;
};

type PurchaseState = {
  isVip: boolean;
  /** Unlocked with a promo / reviewer code rather than a store purchase. */
  promoVip: boolean;
  configured: boolean;
  plans: Plan[];
  loadingPlans: boolean;
  setVip: (v: boolean) => void;
};

export const usePurchases = create<PurchaseState>()(
  persist(
    (set) => ({
      isVip: false,
      promoVip: false,
      configured: false,
      plans: [],
      loadingPlans: false,
      setVip: (isVip) => set({ isVip }),
    }),
    {
      name: 'wz-vip',
      storage: persistStorage,
      // Cache VIP so offline parties keep their decks; RevenueCat re-confirms on launch.
      partialize: (s) => ({ isVip: s.isVip, promoVip: s.promoVip }),
    },
  ),
);

const applyInfo = (info: CustomerInfo) => {
  const bought = Boolean(info.entitlements.active[VIP_ENTITLEMENT]);
  usePurchases.setState({ isVip: bought || usePurchases.getState().promoVip });
};

let started = false;

export async function initPurchases() {
  if (started) return;
  started = true;
  if (!apiKey) {
    console.warn('[purchases] RevenueCat key missing: running without in-app purchases.');
    return;
  }
  try {
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.WARN : LOG_LEVEL.ERROR);
    Purchases.configure({ apiKey });
    usePurchases.setState({ configured: true });
    Purchases.addCustomerInfoUpdateListener(applyInfo);
    applyInfo(await Purchases.getCustomerInfo());
  } catch (e) {
    console.warn('[purchases] init failed', e);
  }
}

const kindOf = (pkg: PurchasesPackage): Plan['kind'] => {
  switch (pkg.packageType) {
    case 'ANNUAL':
      return 'annual';
    case 'WEEKLY':
      return 'weekly';
    case 'LIFETIME':
      return 'lifetime';
    default:
      return 'other';
  }
};

const order: Record<Plan['kind'], number> = { annual: 0, weekly: 1, lifetime: 2, other: 3 };

export async function loadPlans() {
  if (!usePurchases.getState().configured) return;
  usePurchases.setState({ loadingPlans: true });
  try {
    const offerings = await Purchases.getOfferings();
    const pkgs = offerings.current?.availablePackages ?? [];
    const plans: Plan[] = pkgs
      .map((pkg) => {
        const kind = kindOf(pkg);
        return {
          id: pkg.identifier,
          kind,
          pkg,
          price: pkg.product.priceString,
          title:
            kind === 'annual'
              ? 'SEASON PASS · YEARLY'
              : kind === 'weekly'
                ? 'WEEKLY'
                : kind === 'lifetime'
                  ? 'LIFETIME'
                  : pkg.product.title.toUpperCase(),
          period: kind === 'annual' ? '/ year' : kind === 'weekly' ? '/ week' : kind === 'lifetime' ? 'one time' : '',
        };
      })
      .sort((a, b) => order[a.kind] - order[b.kind]);
    usePurchases.setState({ plans });
  } catch (e) {
    console.warn('[purchases] offerings failed', e);
  } finally {
    usePurchases.setState({ loadingPlans: false });
  }
}

export type PurchaseResult = 'success' | 'cancelled' | 'error' | 'unavailable';

export async function buy(plan: Plan): Promise<PurchaseResult> {
  if (!usePurchases.getState().configured) return 'unavailable';
  try {
    const { customerInfo } = await Purchases.purchasePackage(plan.pkg);
    applyInfo(customerInfo);
    return customerInfo.entitlements.active[VIP_ENTITLEMENT] ? 'success' : 'error';
  } catch (e: unknown) {
    const err = e as { userCancelled?: boolean; code?: string };
    if (err.userCancelled || err.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) return 'cancelled';
    console.warn('[purchases] purchase failed', e);
    return 'error';
  }
}

export async function restore(): Promise<'restored' | 'none' | 'error' | 'unavailable'> {
  if (!usePurchases.getState().configured) return 'unavailable';
  try {
    const info = await Purchases.restorePurchases();
    applyInfo(info);
    return info.entitlements.active[VIP_ENTITLEMENT] ? 'restored' : 'none';
  } catch (e) {
    console.warn('[purchases] restore failed', e);
    return 'error';
  }
}

export async function manageSubscriptionUrl(): Promise<string | null> {
  if (!usePurchases.getState().configured) return null;
  try {
    const info = await Purchases.getCustomerInfo();
    return info.managementURL ?? null;
  } catch {
    return null;
  }
}

/* ───────────── Promo / reviewer codes ───────────── */

// FNV-1a hashes of the accepted codes (upper-cased, spaces and dashes removed),
// so the codes themselves aren't sitting in the app as plain text.
const PROMO_HASHES = new Set<number>([1699233643]);

const fnv1a = (s: string) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
};

export const normaliseCode = (raw: string) => raw.toUpperCase().replace(/[^A-Z0-9]/g, '');

/** Unlocks VIP on this device when the code is valid. */
export function redeemCode(raw: string): boolean {
  const code = normaliseCode(raw);
  if (code.length < 6 || !PROMO_HASHES.has(fnv1a(code))) return false;
  usePurchases.setState({ promoVip: true, isVip: true });
  return true;
}
