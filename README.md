# Wildcardz – the party game show

Five party games in one app: **Truth or Dare, Never Have I Ever, Charades, Trivia and Bluff**.
Play pass-and-play on one phone, or open an online room where everyone joins from their own phone.

Built with Expo SDK 58, Expo Router, TypeScript, Zustand, RevenueCat (in-app purchases) and Supabase Realtime (online rooms).

---

## 1. First run (once)

```bash
cd D:\Project\Wildcardz
npm install
npx expo install expo@^58.0.0 expo-audio
npx expo install --fix      # aligns every Expo package to SDK 58
copy .env.example .env      # then fill in the keys (see sections 3 and 4)
npm start                   # opens in Expo Go (scan the QR code)
```

**Expo Go** runs everything: all five games, sounds, charades tilt and online rooms. In-app purchases run in RevenueCat's preview mode there (no real charges).

For real purchases and store releases, use a **development build**:

```bash
npm install -g eas-cli
eas login
eas init
eas build -p android --profile development
npm run start:dev
```

## 2. Project map

```
src/app/            screens (Expo Router: file name = route)
  onboarding.tsx    welcome → how it works → age check → players
  home.tsx          the lineup of five games
  tod/ nhie/ charades/ trivia/ bluff/   each game: index = setup, play = the game
  online/           host / join, lobby, live game
  paywall.tsx       VIP pass (RevenueCat)
  settings.tsx      "Backstage"
  results.tsx       winner + podium
src/components/     UI kit (ui.tsx), Marquee lights, icons, players editor
src/data/           all game content: decks, questions, facts
src/services/       purchases, online rooms, sounds/haptics, links, reviews
src/stores/         saved state (settings, players, custom deck)
assets/             icon, splash, sounds
store/              Play Store feature graphic and 512 icon
docs/               store listing, privacy policy, terms, setup guides
```

**Adding content:** edit the files in `src/data/`. Trivia: the first option is always the correct one (the game shuffles them). Bluff: put `___` where the answer goes.

## 3. In-app purchases (RevenueCat)

See `docs/REVENUECAT.md`. Short version: create products in Play Console → add them to RevenueCat → entitlement **`vip`** → offering with **Annual, Weekly, Lifetime** packages → put the public key in `.env` as `EXPO_PUBLIC_RC_ANDROID_KEY`.

## 4. Online rooms (Supabase)

See `docs/SUPABASE.md`. Create a free Supabase project, copy the URL and anon key into `.env`. No tables are needed: rooms use Realtime broadcast + presence channels. Without these keys the app hides online play gracefully.

## 5. Release to Google Play

```bash
eas build -p android --profile production    # makes the .aab
eas submit -p android --profile production   # uploads to the Internal testing track as a draft
```

Then follow the checklist in `docs/STORE_LISTING.md` (listing text, content rating, data safety, screenshots).

## 6. Before you ship, change these

- `app.config.ts`: `ANDROID_PACKAGE` / `IOS_BUNDLE_ID` (can never change after publishing)
- `.env`: privacy/terms URLs and support email (host `docs/privacy-policy.md` and `docs/terms.md` somewhere public, e.g. your site or a Vercel page)
- Version: bump `version` in `app.config.ts` for each store release (build numbers auto-increment on EAS)
# WildCardz
