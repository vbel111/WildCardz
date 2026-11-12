# Online rooms setup (Supabase Realtime)

Online rooms don't need a database. Each room is a Realtime channel (`wz-room-CODE`):
- **Presence** lists who is in the room.
- **Broadcast** carries the game: the host's phone runs the game and sends the state; other phones send their answers, fakes and votes.

## Setup
1. Create a project at supabase.com (the free plan is fine to start).
2. Project Settings → API: copy the **Project URL** and the **anon public** key.
3. Put them in `.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
4. Realtime is on by default. Nothing else to configure.

## Limits to know
- Each player is one Realtime connection. The free plan has caps on concurrent connections and monthly messages (check the current numbers on Supabase's pricing page) — upgrade when you outgrow it.
- Rooms hold up to 12 players. Codes are 4 letters (no I or O).
- If the host leaves, the room closes for everyone.
- Online supports **Trivia** and **Bluff** (the games where secret answers matter). The other three games are designed for one shared phone.
