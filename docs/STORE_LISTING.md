# Store listing + release checklist

## Google Play listing

**App name (max 30):** Wildcardz: Party Game Show

**Short description (max 80):**
Truth or Dare, Charades, Trivia & more. Pass one phone or play online.

**Full description:**

Turn any hangout into a game show. Wildcardz packs five party games into one app, so the fun never stalls.

★ TRUTH OR DARE – Spin, pick, no chickening out. Warm-up, House Party, 3AM Talks and more, or build your own deck.
★ NEVER HAVE I EVER – Read the card, tap your buzzer if you're guilty. Most confessions wins the crown for the wildest.
★ CHARADES – Phone on your forehead, friends shout clues. Tilt down for "got it", tilt up to pass. Movies, animals, Afrobeats stars, football legends and more.
★ TRIVIA – General knowledge, Africa & Ghana, science, geography, movies, football, music and history. Take turns or race to buzz in.
★ BLUFF – Everyone writes a fake answer to a weird-but-true fact. Spot the truth, fool your friends.

PLAY YOUR WAY
• Pass-and-play on one phone, no internet needed
• Go Live: open a room with a 4-letter code and everyone plays on their own phone
• 2 to 16 players, scores, streaks and a winner's podium

VIP PASS
Unlock every deck, Spicy and Couples rounds (18+ only), and extra trivia categories. Weekly, yearly or lifetime.

No sign-up. No ads. Just the show.

**Category:** Games → Trivia (or Casual). **Tags:** Party, Trivia, Word, Multiplayer.

**Graphics (in `/store`):**
- App icon 512×512: `store/icon-512.png`
- Feature graphic 1024×500: `store/feature-graphic.png`
- Phone screenshots: 4–8 at 1080×1920 or larger. Take them from a build: welcome, lineup, dare card, charades (landscape), trivia question, bluff reveal, winner podium, online lobby.

## Content rating questionnaire (IARC)
Answer honestly. Expected outcome: **Teen / PEGI 12–16** with the 18+ decks behind the age gate. Relevant answers:
- Sexual content: **Yes – suggestive themes / innuendo** (Spicy + Couples decks). No nudity, no explicit content.
- Users interact online: **Yes** (online rooms share names and answers). No open chat, no user-to-user messages outside a game.
- Violence, drugs, gambling, crude humour: No (no real-money gambling; no drinking prompts are required).
- In-app purchases: **Yes**.

## Data safety form (Play)
- Data collected: **Purchase history** (via RevenueCat) – purpose: app functionality (unlocking VIP). Not shared for ads.
- **App activity / in-app content** (stage names and answers in online rooms) – sent to other players during a session, not stored. Mark "processed ephemerally".
- No location, contacts, personal identifiers, photos, audio or device IDs for advertising.
- Data encrypted in transit: **Yes**. Users can request deletion: no account data is stored (local data deletes with the app).

## Target audience
Select **13–15, 16–17 and 18+** (not under 13). Ads: **No**.

## App access
"No special access needed." Mention the VIP pass in the review notes; give Google a license-tester account if you want them to see VIP decks.

## Before uploading – checklist
- [ ] Package name in `app.config.ts` is final
- [ ] `.env` filled: RevenueCat key, Supabase URL + key, privacy + terms URLs, support email
- [ ] Privacy policy and terms hosted at public URLs (use `docs/privacy-policy.md` + `docs/terms.md`)
- [ ] Play products created and attached in RevenueCat (`docs/REVENUECAT.md`)
- [ ] Tested on a real phone: onboarding, each game end to end, purchase + restore with a license tester, online room with 3 phones
- [ ] `eas build -p android --profile production` → `eas submit -p android`
- [ ] Internal testing → Closed testing (new personal accounts need **12 testers for 14 days** before production)

## Apple App Store (when your developer account is back)
The project is already configured for iOS (`bundleIdentifier`, landscape for charades, encryption flag). Create the same products in App Store Connect, add the `appl_` key as `EXPO_PUBLIC_RC_IOS_KEY`, then `eas build -p ios` and `eas submit -p ios`. Apple's age rating will likely be **17+** because of the 18+ decks.
