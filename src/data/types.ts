export type Access = 'free' | 'vip';

export type DeckBase = {
  id: string;
  name: string;
  desc: string;
  color: string;
  access: Access;
  adult?: boolean;
};

export type TodDeck = DeckBase & { truths: string[]; dares: string[] };
export type NhieDeck = DeckBase & { prompts: string[] };
export type CharadesDeck = DeckBase & { words: string[] };

export type TriviaQuestion = {
  q: string;
  /** First option is the correct answer; the game shuffles them. */
  options: [string, string, string, string];
  fact?: string;
};
export type TriviaCategory = DeckBase & { questions: TriviaQuestion[] };

export type BluffFact = {
  /** Use ___ where the hidden answer goes. */
  prompt: string;
  answer: string;
};

/** True when the player may open this deck. */
export const canUse = (deck: DeckBase, isVip: boolean, adultOk: boolean) =>
  (deck.access === 'free' || isVip) && (!deck.adult || adultOk);
