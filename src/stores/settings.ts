import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from './storage';
import type { GameId } from '@/theme';

export type AgeChoice = 'adult' | 'minor' | null;

type SettingsState = {
  onboarded: boolean;
  age: AgeChoice;
  /** Adults can still hide 18+ decks (e.g. family night). */
  showAdult: boolean;
  sound: boolean;
  haptics: boolean;
  turnTimer: number; // seconds, 0 = off
  invertTilt: boolean;
  onlineName: string;
  gamesPlayed: number;
  lastReviewPromptAt: number;
  /** Games whose how-to-play tutorial has been seen (or skipped). */
  tutorialsSeen: GameId[];
  hydrated: boolean;
  setOnboarded: (v: boolean) => void;
  setAge: (v: AgeChoice) => void;
  setShowAdult: (v: boolean) => void;
  setSound: (v: boolean) => void;
  setHaptics: (v: boolean) => void;
  setTurnTimer: (v: number) => void;
  setInvertTilt: (v: boolean) => void;
  setOnlineName: (v: string) => void;
  bumpGamesPlayed: () => number;
  setLastReviewPromptAt: (t: number) => void;
  markTutorialSeen: (id: GameId) => void;
  resetTutorials: () => void;
};

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      onboarded: false,
      age: null,
      showAdult: true,
      sound: true,
      haptics: true,
      turnTimer: 30,
      invertTilt: false,
      onlineName: '',
      gamesPlayed: 0,
      lastReviewPromptAt: 0,
      tutorialsSeen: [],
      hydrated: false,
      setOnboarded: (onboarded) => set({ onboarded }),
      setAge: (age) => set({ age, showAdult: age === 'adult' }),
      setShowAdult: (showAdult) => set({ showAdult }),
      setSound: (sound) => set({ sound }),
      setHaptics: (haptics) => set({ haptics }),
      setTurnTimer: (turnTimer) => set({ turnTimer }),
      setInvertTilt: (invertTilt) => set({ invertTilt }),
      setOnlineName: (onlineName) => set({ onlineName }),
      bumpGamesPlayed: () => {
        const n = get().gamesPlayed + 1;
        set({ gamesPlayed: n });
        return n;
      },
      setLastReviewPromptAt: (lastReviewPromptAt) => set({ lastReviewPromptAt }),
      markTutorialSeen: (id) => {
        const seen = get().tutorialsSeen ?? [];
        if (!seen.includes(id)) set({ tutorialsSeen: [...seen, id] });
      },
      resetTutorials: () => set({ tutorialsSeen: [] }),
    }),
    {
      name: 'wz-settings',
      storage: persistStorage,
      partialize: ({ hydrated, ...rest }) => rest,
      onRehydrateStorage: () => () => {
        useSettings.setState({ hydrated: true });
      },
    },
  ),
);

/** True when 18+ content may be shown right now. */
export const adultAllowed = (s: Pick<SettingsState, 'age' | 'showAdult'>) =>
  s.age === 'adult' && s.showAdult;
