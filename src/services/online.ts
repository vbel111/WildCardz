import 'react-native-url-polyfill/auto';
import { AppState } from 'react-native';
import { createClient, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js';
import { create } from 'zustand';
import { bluffFacts } from '@/data/bluff';
import { playerColors } from '@/theme';
import { roomCode, shuffle, uid } from '@/utils/random';
import { buildTriviaRound, type RoundQuestion } from './trivia';

/* ───────────── Types ───────────── */

export type OnlinePlayer = { id: string; name: string; color: string; host: boolean; joinedAt: number };

export type TriviaGame = {
  kind: 'trivia';
  phase: 'question' | 'reveal' | 'final';
  round: number;
  total: number;
  question: RoundQuestion;
  answers: Record<string, { i: number; ms: number }>;
  scores: Record<string, number>;
  gained: Record<string, number>;
  deadline: number;
  seconds: number;
};

export type BluffOption = { id: string; text: string; by: string[]; real: boolean };

export type BluffGame = {
  kind: 'bluff';
  phase: 'write' | 'vote' | 'reveal' | 'final';
  round: number;
  total: number;
  prompt: string;
  answer: string;
  fakes: Record<string, string>;
  options: BluffOption[];
  votes: Record<string, string>;
  scores: Record<string, number>;
  gained: Record<string, number>;
  deadline: number;
  seconds: number;
};

export type OnlineGame = TriviaGame | BluffGame;

export type GameSettings =
  | { kind: 'trivia'; categories: string[]; rounds: number; seconds: number }
  | { kind: 'bluff'; rounds: number };

type Action =
  | { type: 'answer'; i: number }
  | { type: 'fake'; text: string }
  | { type: 'vote'; optionId: string };

type Status = 'idle' | 'connecting' | 'lobby' | 'playing' | 'ended' | 'error';
/** Live link to the room. 'reconnecting' = we were in and the connection dropped. */
export type Link = 'online' | 'reconnecting' | 'hostAway';

type RoomState = {
  status: Status;
  code: string;
  me: OnlinePlayer | null;
  players: OnlinePlayer[];
  game: OnlineGame | null;
  settings: GameSettings | null;
  error: string | null;
  notice: string | null;
  link: Link;
  host: (name: string) => Promise<void>;
  join: (code: string, name: string) => Promise<void>;
  leave: () => Promise<void>;
  start: (settings: GameSettings) => void;
  next: () => void;
  act: (a: Action) => void;
  clearNotice: () => void;
};

export const MAX_ONLINE = 12;
const BLUFF_WRITE_SECONDS = 60;
const BLUFF_VOTE_SECONDS = 30;
/** How long a dropped connection may try to come back before we give up. */
const RECONNECT_GRACE_MS = 20000;
/** How long players wait for a host who dropped (e.g. took a call) before the room closes. */
const HOST_GRACE_MS = 15000;
const JOIN_TIMEOUT_MS = 8000;

const MSG_BUSY = "Couldn't reach the game server. Check your internet, or try again in a minute: rooms might be busy.";
const MSG_LOST = 'Lost connection to the room.';

/* ───────────── Supabase ───────────── */

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
export const onlineAvailable = Boolean(url && anon);

let client: SupabaseClient | null = null;
const supa = () => {
  if (!client && url && anon) {
    client = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { params: { eventsPerSecond: 20 } },
    });
  }
  return client;
};

/* ───────────── Store ───────────── */

let channel: RealtimeChannel | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let hostWatch: ReturnType<typeof setTimeout> | null = null;
let hostGone: ReturnType<typeof setTimeout> | null = null;
let reconnectWatch: ReturnType<typeof setTimeout> | null = null;
let pendingBroadcast: ReturnType<typeof setTimeout> | null = null;
let joinedOnce = false;
let hostSeen = false;
let leaving = false;
const clearT = (t: ReturnType<typeof setTimeout> | null) => {
  if (t) clearTimeout(t);
  return null;
};
let triviaQueue: RoundQuestion[] = [];
let bluffQueue = shuffle(bluffFacts);

const clearTimer = () => {
  if (timer) clearTimeout(timer);
  timer = null;
};

/** Sends a broadcast and retries once if the socket hiccups. */
const safeSend = (event: string, payload: unknown) => {
  const ch = channel;
  if (!ch) return;
  ch.send({ type: 'broadcast', event, payload })
    .then((res) => {
      if (res !== 'ok' && channel === ch) setTimeout(() => channel === ch && ch.send({ type: 'broadcast', event, payload }).catch(() => {}), 800);
    })
    .catch(() => {});
};

const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

export const useRoom = create<RoomState>()((set, get) => {
  /* host-side helpers */
  const sendNow = (game: OnlineGame | null, extra?: { settings?: GameSettings | null; ended?: boolean }) => {
    pendingBroadcast = clearT(pendingBroadcast);
    safeSend('state', { game, settings: extra?.settings ?? get().settings, ended: !!extra?.ended });
  };

  /**
   * Phase changes go out at once. Small updates (one more answer in) are batched
   * for 150 ms so 12 players answering together don't flood the realtime limit.
   */
  const broadcast = (game: OnlineGame | null, extra?: { settings?: GameSettings | null; ended?: boolean; batch?: boolean }) => {
    if (!extra?.batch) return sendNow(game, extra);
    if (pendingBroadcast) return;
    pendingBroadcast = setTimeout(() => {
      pendingBroadcast = null;
      sendNow(get().game);
    }, 150);
  };

  const commit = (game: OnlineGame | null) => {
    set({ game, status: game ? 'playing' : 'lobby' });
    broadcast(game);
    schedule(game);
  };

  const schedule = (game: OnlineGame | null) => {
    clearTimer();
    if (!game || game.phase === 'final' || game.phase === 'reveal') return;
    const wait = Math.max(0, game.deadline - Date.now());
    timer = setTimeout(() => advance(), wait + 300);
  };

  const activeIds = () => get().players.map((p) => p.id);

  const zeroScores = () => Object.fromEntries(activeIds().map((id) => [id, 0]));

  const newTrivia = (round: number, total: number, scores: Record<string, number>, seconds: number): TriviaGame | null => {
    const question = triviaQueue[round - 1];
    if (!question) return null;
    return { kind: 'trivia', phase: 'question', round, total, question, answers: {}, scores, gained: {}, seconds, deadline: Date.now() + seconds * 1000 };
  };

  const newBluff = (round: number, total: number, scores: Record<string, number>): BluffGame => {
    if (!bluffQueue.length) bluffQueue = shuffle(bluffFacts);
    const fact = bluffQueue.pop()!;
    return {
      kind: 'bluff', phase: 'write', round, total, prompt: fact.prompt, answer: fact.answer,
      fakes: {}, options: [], votes: {}, scores, gained: {}, seconds: BLUFF_WRITE_SECONDS,
      deadline: Date.now() + BLUFF_WRITE_SECONDS * 1000,
    };
  };

  /** Moves the current game to its next phase (host only). */
  const advance = () => {
    const { game, me } = get();
    if (!game || !me?.host) return;
    if (game.kind === 'trivia') {
      if (game.phase !== 'question') return;
      const gained: Record<string, number> = {};
      const scores = { ...game.scores };
      for (const [pid, a] of Object.entries(game.answers)) {
        if (a.i !== game.question.correct) continue;
        const speed = Math.max(0, 1 - a.ms / (game.seconds * 1000));
        const pts = 100 + Math.round(speed * 50);
        gained[pid] = pts;
        scores[pid] = (scores[pid] ?? 0) + pts;
      }
      commit({ ...game, phase: 'reveal', gained, scores });
      return;
    }
    if (game.phase === 'write') {
      const options: BluffOption[] = [{ id: 'real', text: game.answer, by: [], real: true }];
      for (const [pid, text] of Object.entries(game.fakes)) {
        const same = options.find((o) => !o.real && normalise(o.text) === normalise(text));
        if (same) same.by.push(pid);
        else options.push({ id: uid(), text, by: [pid], real: false });
      }
      commit({ ...game, phase: 'vote', options: shuffle(options), seconds: BLUFF_VOTE_SECONDS, deadline: Date.now() + BLUFF_VOTE_SECONDS * 1000 });
      return;
    }
    if (game.phase === 'vote') {
      const gained: Record<string, number> = {};
      const add = (pid: string, n: number) => (gained[pid] = (gained[pid] ?? 0) + n);
      for (const [voter, optionId] of Object.entries(game.votes)) {
        const opt = game.options.find((o) => o.id === optionId);
        if (!opt) continue;
        if (opt.real) add(voter, 200);
        else opt.by.filter((b) => b !== voter).forEach((b) => add(b, 100));
      }
      const scores = { ...game.scores };
      Object.entries(gained).forEach(([pid, n]) => (scores[pid] = (scores[pid] ?? 0) + n));
      commit({ ...game, phase: 'reveal', gained, scores });
    }
  };

  /** Host: if everyone still in the room has answered, move on (covers players who drop out). */
  const checkAllIn = () => {
    const { game, me } = get();
    if (!game || !me?.host || game.phase === 'reveal' || game.phase === 'final') return;
    const ids = activeIds();
    if (!ids.length) return;
    const done =
      game.kind === 'trivia'
        ? ids.every((id) => id in game.answers)
        : game.phase === 'write'
          ? ids.every((id) => id in game.fakes)
          : ids.every((id) => id in game.votes);
    if (done) advance();
  };

  const handleAction = (from: string, a: Action) => {
    const { game } = get();
    if (!game) return;
    if (game.kind === 'trivia' && a.type === 'answer' && game.phase === 'question' && !(from in game.answers)) {
      const ms = game.seconds * 1000 - Math.max(0, game.deadline - Date.now());
      const next = { ...game, answers: { ...game.answers, [from]: { i: a.i, ms } } };
      set({ game: next });
      broadcast(next, { batch: true });
      if (activeIds().every((id) => id in next.answers)) advance();
      return;
    }
    if (game.kind === 'bluff' && a.type === 'fake' && game.phase === 'write') {
      const text = a.text.replace(/\s+/g, ' ').trim().slice(0, 40);
      if (!text) return;
      if (normalise(text) === normalise(game.answer)) {
        safeSend('reject', { to: from, reason: 'You found the real answer! Write a fake one instead.' });
        if (from === get().me?.id) set({ notice: 'You found the real answer! Write a fake one instead.' });
        return;
      }
      const next = { ...game, fakes: { ...game.fakes, [from]: text } };
      set({ game: next });
      broadcast(next, { batch: true });
      if (activeIds().every((id) => id in next.fakes)) advance();
      return;
    }
    if (game.kind === 'bluff' && a.type === 'vote' && game.phase === 'vote' && !(from in game.votes)) {
      const opt = game.options.find((o) => o.id === a.optionId);
      if (!opt || opt.by.includes(from)) return;
      const next = { ...game, votes: { ...game.votes, [from]: a.optionId } };
      set({ game: next });
      broadcast(next, { batch: true });
      if (activeIds().every((id) => id in next.votes)) advance();
    }
  };

  const connect = async (code: string, me: OnlinePlayer) => {
    const sb = supa();
    if (!sb) {
      set({ status: 'error', error: 'Online rooms are not set up in this build yet.' });
      return;
    }
    set({ status: 'connecting', code, me, players: [], game: null, error: null });
    const ch = sb.channel(`wz-room-${code}`, {
      config: { broadcast: { self: false }, presence: { key: me.id } },
    });
    channel = ch;

    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState<OnlinePlayer>();
      const players = Object.values(state)
        .map((metas) => metas[0])
        .filter(Boolean)
        .sort((a, b) => a.joinedAt - b.joinedAt) as OnlinePlayer[];
      const self = get().me;
      const hostPresent = players.some((p) => p.host);
      set({ players });
      if (!self) return;
      if (self.host) {
        checkAllIn();
        return;
      }
      if (hostPresent) {
        hostSeen = true;
        hostWatch = clearT(hostWatch);
        if (hostGone) {
          hostGone = clearT(hostGone);
          set({ link: 'online' });
          safeSend('hello', { from: self.id });
        }
      } else if (hostSeen && (get().status === 'lobby' || get().status === 'playing')) {
        // The host may just be switching apps or on a bad signal: wait before closing.
        if (!hostGone) {
          set({ link: 'hostAway' });
          hostGone = setTimeout(() => {
            hostGone = null;
            clearTimer();
            set({ status: 'ended', notice: 'The host left, so the room has closed.' });
            get().leave();
          }, HOST_GRACE_MS);
        }
        return;
      }
      if (!self.host && players.length > MAX_ONLINE && players.findIndex((p) => p.id === self.id) >= MAX_ONLINE) {
        set({ status: 'error', error: 'That room is full.' });
        get().leave();
      }
    });

    ch.on('broadcast', { event: 'state' }, ({ payload }) => {
      if (get().me?.host) return;
      const p = payload as { game: OnlineGame | null; settings: GameSettings | null; ended: boolean };
      if (p.ended) {
        set({ status: 'ended', game: null, notice: 'The host ended the game.' });
        return;
      }
      set({ game: p.game, settings: p.settings, status: p.game ? 'playing' : 'lobby' });
    });

    ch.on('broadcast', { event: 'hello' }, () => {
      if (get().me?.host) sendNow(get().game);
    });

    ch.on('broadcast', { event: 'action' }, ({ payload }) => {
      if (!get().me?.host) return;
      const p = payload as { from: string; action: Action };
      handleAction(p.from, p.action);
    });

    ch.on('broadcast', { event: 'reject' }, ({ payload }) => {
      const p = payload as { to: string; reason: string };
      if (p.to === get().me?.id) set({ notice: p.reason });
    });

    ch.subscribe(async (status) => {
      if (channel !== ch || leaving) return;
      if (status === 'SUBSCRIBED') {
        try {
          await ch.track(get().me ?? me);
        } catch {}
        reconnectWatch = clearT(reconnectWatch);
        if (joinedOnce) {
          // Back after a drop: catch up with the room.
          set({ link: 'online' });
          if (me.host) sendNow(get().game);
          else safeSend('hello', { from: me.id });
          return;
        }
        joinedOnce = true;
        set({ status: 'lobby', link: 'online' });
        if (!me.host) {
          safeSend('hello', { from: me.id });
          hostWatch = setTimeout(() => {
            hostWatch = null;
            if (!get().players.some((p) => p.host)) {
              set({ status: 'error', error: `No room called ${code}. Check the code and try again.` });
              get().leave();
            }
          }, JOIN_TIMEOUT_MS);
        }
        return;
      }
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        if (!joinedOnce) {
          set({ status: 'error', error: MSG_BUSY });
          get().leave();
          return;
        }
        // Supabase keeps retrying on its own; show a banner and give it time.
        set({ link: 'reconnecting' });
        if (!reconnectWatch) {
          reconnectWatch = setTimeout(() => {
            reconnectWatch = null;
            if (get().link !== 'online') {
              set({ status: 'error', error: MSG_LOST });
              get().leave();
            }
          }, RECONNECT_GRACE_MS);
        }
      }
    });
  };

  return {
    status: 'idle',
    code: '',
    me: null,
    players: [],
    game: null,
    settings: null,
    error: null,
    notice: null,
    link: 'online',

    host: async (name) => {
      await get().leave();
      const me: OnlinePlayer = { id: uid(), name, color: playerColors[0], host: true, joinedAt: Date.now() };
      await connect(roomCode(), me);
    },

    join: async (code, name) => {
      await get().leave();
      const me: OnlinePlayer = {
        id: uid(),
        name,
        color: playerColors[1 + Math.floor(Math.random() * (playerColors.length - 1))],
        host: false,
        joinedAt: Date.now(),
      };
      await connect(code.toUpperCase(), me);
    },

    leave: async () => {
      clearTimer();
      hostWatch = clearT(hostWatch);
      hostGone = clearT(hostGone);
      reconnectWatch = clearT(reconnectWatch);
      pendingBroadcast = clearT(pendingBroadcast);
      if (channel) {
        leaving = true;
        if (get().me?.host) sendNow(null, { ended: true });
        const sb = supa();
        try {
          await channel.untrack();
        } catch {}
        if (sb) await sb.removeChannel(channel);
      }
      channel = null;
      leaving = false;
      joinedOnce = false;
      hostSeen = false;
      const keep = get().status === 'error' || get().status === 'ended';
      set({ status: keep ? get().status : 'idle', code: '', me: null, players: [], game: null, settings: null, link: 'online' });
    },

    start: (settings) => {
      if (!get().me?.host) return;
      set({ settings });
      const scores = zeroScores();
      if (settings.kind === 'trivia') {
        triviaQueue = buildTriviaRound(settings.categories, settings.rounds);
        const total = Math.min(settings.rounds, triviaQueue.length);
        commit(newTrivia(1, total, scores, settings.seconds));
      } else {
        bluffQueue = shuffle(bluffFacts);
        commit(newBluff(1, settings.rounds, scores));
      }
    },

    /** Host: go from reveal to the next round, or to the final scores. */
    next: () => {
      const { game, settings, me } = get();
      if (!game || !me?.host) return;
      if (game.phase === 'final') {
        commit(null);
        return;
      }
      if (game.round >= game.total) {
        commit({ ...game, phase: 'final' });
        return;
      }
      if (game.kind === 'trivia' && settings?.kind === 'trivia') {
        commit(newTrivia(game.round + 1, game.total, game.scores, settings.seconds));
      } else if (game.kind === 'bluff') {
        commit(newBluff(game.round + 1, game.total, game.scores));
      }
    },

    act: (action) => {
      const me = get().me;
      if (!me) return;
      if (me.host) handleAction(me.id, action);
      else safeSend('action', { from: me.id, action });
      // Optimistic local echo so the player sees their pick straight away.
      const g = get().game;
      if (!g || me.host) return;
      if (g.kind === 'trivia' && action.type === 'answer') set({ game: { ...g, answers: { ...g.answers, [me.id]: { i: action.i, ms: 0 } } } });
      if (g.kind === 'bluff' && action.type === 'fake') set({ game: { ...g, fakes: { ...g.fakes, [me.id]: action.text } } });
      if (g.kind === 'bluff' && action.type === 'vote') set({ game: { ...g, votes: { ...g.votes, [me.id]: action.optionId } } });
    },

    clearNotice: () => set({ notice: null }),
  };
});

/* Coming back to the app: ask the host for the latest state (or resend it if we are the host). */
AppState.addEventListener('change', (st) => {
  if (st !== 'active' || !channel) return;
  const { me, game, settings } = useRoom.getState();
  if (!me) return;
  if (me.host) safeSend('state', { game, settings, ended: false });
  else safeSend('hello', { from: me.id });
});
