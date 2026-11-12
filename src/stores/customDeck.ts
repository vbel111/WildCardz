import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from './storage';
import { todDecks } from '@/data/tod';
import { uid } from '@/utils/random';

export type CustomCard = { id: string; kind: 'truth' | 'dare'; text: string; mine: boolean };

/** Starter pool: the free decks' cards, so a new player has something to pick from. */
const starter = (): CustomCard[] =>
  todDecks
    .filter((d) => d.access === 'free')
    .flatMap((d) => [
      ...d.truths.slice(0, 12).map((text, i) => ({ id: `${d.id}-t${i}`, kind: 'truth' as const, text, mine: false })),
      ...d.dares.slice(0, 12).map((text, i) => ({ id: `${d.id}-d${i}`, kind: 'dare' as const, text, mine: false })),
    ]);

type CustomDeckState = {
  cards: CustomCard[];
  selected: string[];
  toggle: (id: string) => void;
  addCard: (kind: 'truth' | 'dare', text: string) => boolean;
  removeCard: (id: string) => void;
};

export const MAX_CARD = 140;

export const useCustomDeck = create<CustomDeckState>()(
  persist(
    (set, get) => ({
      cards: starter(),
      selected: [],
      toggle: (id) => {
        const { selected } = get();
        set({ selected: selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id] });
      },
      addCard: (kind, raw) => {
        const text = raw.replace(/\s+/g, ' ').trim().slice(0, MAX_CARD);
        if (text.length < 3) return false;
        const card = { id: uid(), kind, text, mine: true };
        set({ cards: [card, ...get().cards], selected: [card.id, ...get().selected] });
        return true;
      },
      removeCard: (id) =>
        set({ cards: get().cards.filter((c) => c.id !== id), selected: get().selected.filter((x) => x !== id) }),
    }),
    { name: 'wz-custom-deck', storage: persistStorage },
  ),
);
