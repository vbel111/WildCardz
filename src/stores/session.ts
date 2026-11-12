import { create } from 'zustand';
import type { GameId } from '@/theme';

export type Scorer = { id: string; name: string; color: string };

type SessionState = {
  game: GameId | null;
  scorers: Scorer[];
  scores: Record<string, number>;
  start: (game: GameId, scorers: Scorer[]) => void;
  add: (id: string, points: number) => void;
  set: (scores: Record<string, number>) => void;
};

/** Scores for the game in progress, read by the scoreboard and winner screens. */
export const useSession = create<SessionState>()((set, get) => ({
  game: null,
  scorers: [],
  scores: {},
  start: (game, scorers) =>
    set({ game, scorers, scores: Object.fromEntries(scorers.map((s) => [s.id, 0])) }),
  add: (id, points) => set({ scores: { ...get().scores, [id]: (get().scores[id] ?? 0) + points } }),
  set: (scores) => set({ scores }),
}));

export const ranked = (scorers: Scorer[], scores: Record<string, number>) =>
  scorers
    .map((s) => ({ ...s, points: scores[s.id] ?? 0 }))
    .sort((a, b) => b.points - a.points);
