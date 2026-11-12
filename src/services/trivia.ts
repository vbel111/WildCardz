import { triviaCategories } from '@/data/trivia';
import { shuffle } from '@/utils/random';

export type RoundQuestion = {
  q: string;
  options: string[];
  correct: number;
  category: string;
  fact?: string;
};

/** Picks `count` questions from the chosen categories, shuffling answer order. */
export function buildTriviaRound(categoryIds: string[], count: number): RoundQuestion[] {
  const cats = triviaCategories.filter((c) => categoryIds.includes(c.id));
  const pool = shuffle(
    cats.flatMap((c) => c.questions.map((q) => ({ ...q, category: c.name }))),
  ).slice(0, count);
  return pool.map((item) => {
    const order = shuffle([0, 1, 2, 3]);
    return {
      q: item.q,
      options: order.map((i) => item.options[i]),
      correct: order.indexOf(0),
      category: item.category,
      fact: item.fact,
    };
  });
}

export const questionCount = (categoryIds: string[]) =>
  triviaCategories.filter((c) => categoryIds.includes(c.id)).reduce((n, c) => n + c.questions.length, 0);
