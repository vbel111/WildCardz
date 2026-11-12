import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, type LayoutChangeEvent, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '@/theme';
import { Body, Buzzer, Label } from '../ui';
import { Icon } from '../Icon';
import { usePlayers } from '@/stores/players';

/** Who appears in the demos: the real lineup when there is one, otherwise a stand-in cast. */
export type DemoPlayer = { name: string; color: string };
const CAST: DemoPlayer[] = [
  { name: 'Ama', color: colors.yellow },
  { name: 'Kofi', color: colors.pink },
  { name: 'Esi', color: colors.mint },
  { name: 'You', color: colors.orange },
];

export function useDemoPlayers(): DemoPlayer[] {
  const players = usePlayers((s) => s.players);
  return useMemo(
    () => (players.length >= 3 ? players.slice(0, 4).map((p) => ({ name: p.name, color: p.color })) : CAST),
    [players],
  );
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => sub.remove();
  }, []);
  return reduced;
}

/** Springs to full size every time `trigger` changes. */
export function usePop(trigger: unknown) {
  const v = useRef(new Animated.Value(1)).current;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    v.setValue(0.82);
    Animated.spring(v, { toValue: 1, friction: 4, tension: 170, useNativeDriver: true }).start();
  }, [trigger, v]);
  return v;
}

/** A horizontal shake for wrong answers. */
export function useShake() {
  const v = useRef(new Animated.Value(0)).current;
  const shake = () =>
    Animated.sequence([12, -12, 8, -8, 4, 0].map((x) => Animated.timing(v, { toValue: x, duration: 45, useNativeDriver: true }))).start();
  return [v, shake] as const;
}

/** Gentle endless bob, used for "look here" arrows. */
export function useBob(distance = 8, ms = 520) {
  const reduced = useReducedMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: distance, duration: ms, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: ms, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, distance, ms, v]);
  return v;
}

/** Floating "+100" that rises and fades out. */
export function ScoreBurst({ text, color = colors.mint, trigger }: { text: string; color?: string; trigger: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!trigger) return;
    v.setValue(0);
    Animated.timing(v, { toValue: 1, duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [trigger, v]);
  if (!trigger) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        alignSelf: 'center',
        top: -6,
        opacity: v.interpolate({ inputRange: [0, 0.15, 0.75, 1], outputRange: [0, 1, 1, 0] }),
        transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [10, -46] }) }, { scale: v.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.6, 1.15, 1] }) }],
      }}
    >
      <Label size={40} color={color}>
        {text}
      </Label>
    </Animated.View>
  );
}

/** Chunky selectable tile used for answers and choices in demos. */
export function ChoiceTile({
  label,
  onPress,
  state = 'idle',
  tag,
  style,
}: {
  label: string;
  onPress: () => void;
  state?: 'idle' | 'right' | 'wrong' | 'muted';
  tag?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const bg = state === 'right' ? colors.mint : state === 'wrong' ? colors.pink : state === 'muted' ? colors.deep : colors.white;
  const fg = state === 'muted' ? colors.faint : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={tag ? `${label}, ${tag}` : label}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: 58,
          borderRadius: 14,
          backgroundColor: bg,
          borderBottomWidth: pressed ? 2 : 5,
          borderBottomColor: state === 'idle' ? colors.lilac : 'rgba(0,0,0,0.2)',
          marginTop: pressed ? 3 : 0,
          paddingHorizontal: 16,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        },
        style,
      ]}
    >
      <Label size={22} color={fg} style={{ flex: 1 }} numberOfLines={2}>
        {label}
      </Label>
      {tag ? (
        <View style={{ backgroundColor: colors.ink, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
          <Body bold size={11} color={colors.white}>
            {tag}
          </Body>
        </View>
      ) : null}
      {state === 'right' ? <Icon name="check" color={colors.ink} strokeWidth={3.4} /> : state === 'wrong' ? <Icon name="close" color={colors.ink} strokeWidth={3.4} /> : null}
    </Pressable>
  );
}

/** Row of player buzzers with a little phone that hops between them. */
export function PassThePhone({ players, onPass }: { players: DemoPlayer[]; onPass: (to: number, passes: number) => void }) {
  const [w, setW] = useState(0);
  const [at, setAt] = useState(0);
  const [passes, setPasses] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  const slot = w / players.length;
  const bob = useBob(5, 420);

  useEffect(() => {
    Animated.spring(x, { toValue: at * slot, friction: 6, tension: 80, useNativeDriver: true }).start();
  }, [at, slot, x]);

  const pass = () => {
    const to = (at + 1) % players.length;
    const n = passes + 1;
    setAt(to);
    setPasses(n);
    onPass(to, n);
  };

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Pass the phone to ${players[(at + 1) % players.length].name}`} onPress={pass}>
      <View onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)} style={{ height: 150 }}>
        {w ? (
          <Animated.View style={{ position: 'absolute', top: 0, left: 0, width: slot, alignItems: 'center', transform: [{ translateX: x }, { translateY: bob }] }}>
            <View style={{ width: 40, height: 66, borderRadius: 9, borderWidth: 3, borderColor: colors.ink, backgroundColor: colors.yellow, alignItems: 'center', justifyContent: 'center' }}>
              <Label size={18} color={colors.ink}>
                ?
              </Label>
            </View>
          </Animated.View>
        ) : null}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row' }}>
          {players.map((p, i) => (
            <View key={p.name + i} style={{ width: slot || undefined, flex: slot ? undefined : 1, alignItems: 'center', gap: 4 }}>
              <Buzzer name={p.name} color={p.color} size={i === at ? 54 : 44} ring={i === at ? colors.white : undefined} />
              <Body bold size={12} color={i === at ? colors.white : colors.muted} numberOfLines={1}>
                {p.name}
              </Body>
            </View>
          ))}
        </View>
      </View>
    </Pressable>
  );
}

/** Simple centred column for a demo. */
export function Stage({ children, gap = 14 }: { children: ReactNode; gap?: number }) {
  return <View style={{ gap, width: '100%' }}>{children}</View>;
}
