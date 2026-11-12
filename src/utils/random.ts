export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export function shuffle<T>(input: readonly T[]): T[] {
  const a = input.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const pick = <T,>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)];

/** Room codes avoid look-alike letters (I, O) so they are easy to read aloud. */
export const roomCode = () => {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let s = '';
  for (let i = 0; i < 4; i++) s += letters[Math.floor(Math.random() * letters.length)];
  return s;
};

/** Fills {player} / {other} placeholders in a prompt. */
export const fillPrompt = (text: string, player?: string, other?: string) =>
  text.replace(/\{player\}/g, player ?? 'you').replace(/\{other\}/g, other ?? 'someone here');
