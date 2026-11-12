import { useCallback, useEffect } from 'react';
import { Alert, BackHandler, Pressable, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { colors } from '@/theme';
import type { DeckBase } from '@/data/types';
import { canUse } from '@/data/types';
import { Badge, Body, GameButton, Label, Panel } from './ui';
import { Icon } from './Icon';
import { fx } from '@/services/feedback';
import { usePurchases } from '@/services/purchases';
import { adultAllowed, useSettings } from '@/stores/settings';
import { MIN_PLAYERS, usePlayers, type Player } from '@/stores/players';
import { shuffle } from '@/utils/random';

export function useDeckAccess() {
  const isVip = usePurchases((s) => s.isVip);
  const adultOk = useSettings(adultAllowed);
  const age = useSettings((s) => s.age);
  return { isVip, adultOk, age, canUse: (d: DeckBase) => canUse(d, isVip, adultOk) };
}

/** Hides adult decks from under-18s entirely; adults with 18+ switched off see them locked. */
export function visibleDecks<T extends DeckBase>(decks: T[], age: 'adult' | 'minor' | null) {
  return decks.filter((d) => !d.adult || age === 'adult');
}

type DeckRowProps = {
  deck: DeckBase;
  count: number;
  unit?: string;
  selected?: boolean;
  onPress: () => void;
  isVip: boolean;
  adultOk: boolean;
};

/** A deck on a list: colour block with card count, name, and a FREE / VIP / 18+ tag. */
export function DeckRow({ deck, count, unit = 'CARDS', selected, onPress, isVip, adultOk }: DeckRowProps) {
  const open = canUse(deck, isVip, adultOk);
  const tag = deck.adult ? '18+' : deck.access === 'vip' ? 'VIP' : 'FREE';
  const tagBg = deck.adult ? colors.pink : deck.access === 'vip' ? colors.yellow : colors.mint;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected, disabled: !open }}
      accessibilityLabel={`${deck.name}, ${deck.desc}, ${count} ${unit.toLowerCase()}${open ? '' : ', locked'}`}
      onPress={() => {
        fx.tap();
        if (!open) {
          if (deck.adult && !adultOk && (deck.access === 'free' || isVip)) {
            Alert.alert('18+ rounds are off', 'Turn on "Show 18+ rounds" in Settings to play this deck.');
            return;
          }
          router.push('/paywall');
          return;
        }
        onPress();
      }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        minHeight: 84,
        borderRadius: 16,
        backgroundColor: colors.navy,
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: selected ? colors.yellow : 'transparent',
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ width: 76, backgroundColor: deck.color, alignItems: 'center', justifyContent: 'center' }}>
        <Label size={28} color={colors.ink} style={{ letterSpacing: 0 }}>
          {count}
        </Label>
        <Body bold size={10} color={colors.ink} style={{ letterSpacing: 1 }}>
          {unit}
        </Body>
      </View>
      <View style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 10, justifyContent: 'center' }}>
        <Label size={23}>{deck.name}</Label>
        <Body size={14} color={colors.mist}>
          {deck.desc}
        </Body>
      </View>
      <View style={{ justifyContent: 'center', alignItems: 'center', paddingRight: 12, gap: 6 }}>
        <Badge label={tag} bg={tagBg} />
        {!open ? <Icon name="lock" color={colors.muted} size={18} /> : null}
      </View>
    </Pressable>
  );
}

/** Shown on setup screens when there aren't enough players. */
export function NeedPlayers({ min = MIN_PLAYERS }: { min?: number }) {
  return (
    <Panel style={{ gap: 12 }}>
      <Label size={24}>WE NEED CONTESTANTS</Label>
      <Body>Add at least {min} players so the game knows whose turn it is.</Body>
      <GameButton label="ADD PLAYERS" height={56} size={20} onPress={() => router.push('/players')} />
    </Panel>
  );
}

/** Turn order for a game: shuffled once if the player chose that. */
export function turnOrder(players: Player[]) {
  return usePlayers.getState().shuffleTurns ? shuffle(players) : players.slice();
}

/** Confirms before leaving a game in progress (header button and Android back). */
export function useExitGuard(active = true) {
  const confirm = useCallback(() => {
    Alert.alert('End this game?', 'Scores from this game will be lost.', [
      { text: 'Keep playing', style: 'cancel' },
      { text: 'End game', style: 'destructive', onPress: () => router.replace('/home') },
    ]);
    return true;
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!active) return;
      const sub = BackHandler.addEventListener('hardwareBackPress', confirm);
      return () => sub.remove();
    }, [active, confirm]),
  );
  return confirm;
}

/** Keeps a value's latest version in an effect without re-running it. */
export function useInterval(fn: () => void, ms: number | null) {
  useEffect(() => {
    if (ms == null) return;
    const t = setInterval(fn, ms);
    return () => clearInterval(t);
  }, [fn, ms]);
}
