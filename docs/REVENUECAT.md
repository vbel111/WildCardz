# VIP pass setup (RevenueCat + Google Play)

The app checks one entitlement: **`vip`**. Anything that grants it unlocks every VIP deck.

## 1. Google Play Console
1. Create the app (package `com.zdev.wildcardz` unless you changed it).
2. Upload any build to the **Internal testing** track first (Play won't let you create products until a build with the billing permission exists).
3. Monetize → Products:
   - **Subscriptions**: `wildcardz_vip_yearly` (base plan: yearly, optional 3-day free trial) and `wildcardz_vip_weekly` (base plan: weekly).
   - **In-app products**: `wildcardz_vip_lifetime` (one-time).
4. Set prices for your markets (Ghana: price in GHS; other countries auto-convert).

## 2. RevenueCat
1. Create a project → add an Android app with the same package name.
2. Upload the Play **service account JSON** (RevenueCat guides you through it) so it can verify purchases.
3. Products → import the three product IDs above.
4. Entitlements → create **`vip`** → attach all three products.
5. Offerings → `default` → add packages:
   - **Annual** → `wildcardz_vip_yearly`
   - **Weekly** → `wildcardz_vip_weekly`
   - **Lifetime** → `wildcardz_vip_lifetime`
6. API keys → copy the **public Android SDK key** (starts with `goog_`) into `.env` as `EXPO_PUBLIC_RC_ANDROID_KEY`.

## 3. Test
- Add your Gmail as a **license tester** in Play Console (Settings → License testing). Test purchases are free and renew fast.
- Open the paywall in a development or internal-testing build. The three plans appear with real store prices.
- Restore works from the paywall and from Settings.

The app caches VIP locally so a party with no internet still keeps its decks; RevenueCat re-checks on every launch.
