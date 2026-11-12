import { createAudioPlayer, setAudioModeAsync, type AudioPlayer, type AudioSource } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useSettings } from '@/stores/settings';

const sources = {
  tap: require('../../assets/sounds/tap.wav'),
  correct: require('../../assets/sounds/correct.wav'),
  wrong: require('../../assets/sounds/wrong.wav'),
  tick: require('../../assets/sounds/tick.wav'),
  reveal: require('../../assets/sounds/reveal.wav'),
  win: require('../../assets/sounds/win.wav'),
  buzz: require('../../assets/sounds/buzz.wav'),
} satisfies Record<string, AudioSource>;

export type SoundName = keyof typeof sources;

const loaded: Partial<Record<SoundName, AudioPlayer>> = {};
let ready = false;

export async function initSounds() {
  if (ready) return;
  ready = true;
  try {
    await setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' });
    (Object.keys(sources) as SoundName[]).forEach((name) => {
      const player = createAudioPlayer(sources[name]);
      player.volume = 0.8;
      loaded[name] = player;
    });
  } catch (e) {
    console.warn('[sound] preload failed', e);
  }
}

export function play(name: SoundName) {
  if (!useSettings.getState().sound) return;
  const p = loaded[name];
  if (!p) return;
  try {
    p.seekTo(0).catch(() => {});
    p.play();
  } catch {}
}

type HapticKind = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'select';

export function haptic(kind: HapticKind = 'light') {
  if (!useSettings.getState().haptics) return;
  const run = () => {
    switch (kind) {
      case 'success':
        return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      case 'error':
        return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      case 'select':
        return Haptics.selectionAsync();
      case 'medium':
        return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      case 'heavy':
        return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      default:
        return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  run().catch(() => {});
}

/** Sound + haptic in one call for the common moments. */
export const fx = {
  tap: () => {
    haptic('light');
    play('tap');
  },
  select: () => haptic('select'),
  correct: () => {
    haptic('success');
    play('correct');
  },
  wrong: () => {
    haptic('error');
    play('wrong');
  },
  reveal: () => {
    haptic('medium');
    play('reveal');
  },
  win: () => {
    haptic('success');
    play('win');
  },
  tick: () => play('tick'),
  buzz: () => {
    haptic('heavy');
    play('buzz');
  },
};
