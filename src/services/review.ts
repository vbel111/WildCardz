import * as StoreReview from 'expo-store-review';
import { useSettings } from '@/stores/settings';

const MILESTONES = [3, 10, 25, 60];
const COOLDOWN_MS = 1000 * 60 * 60 * 24 * 45;

/** Call when a game finishes. Asks for a review at a few happy moments only. */
export async function onGameFinished() {
  const s = useSettings.getState();
  const n = s.bumpGamesPlayed();
  if (!MILESTONES.includes(n)) return;
  if (Date.now() - s.lastReviewPromptAt < COOLDOWN_MS) return;
  try {
    if (await StoreReview.hasAction()) {
      s.setLastReviewPromptAt(Date.now());
      setTimeout(() => StoreReview.requestReview().catch(() => {}), 1200);
    }
  } catch {}
}
