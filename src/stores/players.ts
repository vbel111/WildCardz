import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from './storage';
import { playerColors } from '@/theme';
import { uid } from '@/utils/random';

export type Player = { id: string; name: string; color: string };

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 16;
export const MAX_NAME = 14;

type PlayersState = {
  players: Player[];
  shuffleTurns: boolean;
  add: (name: string) => { ok: true } | { ok: false; reason: string };
  remove: (id: string) => void;
  rename: (id: string, name: string) => void;
  setShuffleTurns: (v: boolean) => void;
};

const nextColor = (players: Player[]) => {
  const used = new Set(players.map((p) => p.color));
  return playerColors.find((c) => !used.has(c)) ?? playerColors[players.length % playerColors.length];
};

export const cleanName = (raw: string) => raw.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME);

export const usePlayers = create<PlayersState>()(
  persist(
    (set, get) => ({
      players: [],
      shuffleTurns: true,
      add: (raw) => {
        const name = cleanName(raw);
        const { players } = get();
        if (!name) return { ok: false, reason: 'Type a name first.' };
        if (players.length >= MAX_PLAYERS) return { ok: false, reason: `Max ${MAX_PLAYERS} players.` };
        if (players.some((p) => p.name.toLowerCase() === name.toLowerCase()))
          return { ok: false, reason: `${name} is already playing.` };
        set({ players: [...players, { id: uid(), name, color: nextColor(players) }] });
        return { ok: true };
      },
      remove: (id) => set({ players: get().players.filter((p) => p.id !== id) }),
      rename: (id, raw) => {
        const name = cleanName(raw);
        if (!name) return;
        set({ players: get().players.map((p) => (p.id === id ? { ...p, name } : p)) });
      },
      setShuffleTurns: (shuffleTurns) => set({ shuffleTurns }),
    }),
    { name: 'wz-players', storage: persistStorage },
  ),
);
