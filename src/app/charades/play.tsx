import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Accelerometer } from 'expo-sensors';
import { useKeepAwake } from 'expo-keep-awake';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '@/theme';
import { Body, Display, Eyebrow, GameButton, IconButton, Label, Panel, Row, Screen, TopBar } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { turnOrder, useExitGuard } from '@/components/game';
import { charadesDecks } from '@/data/charades';
import { usePlayers } from '@/stores/players';
import { useSession } from '@/stores/session';
import { useSettings } from '@/stores/settings';
import { fmtClock } from '@/hooks/useCountdown';
import { shuffle } from '@/utils/random';
import { fx } from '@/services/feedback';

type Phase = 'ready' | 'countdown' | 'play' | 'turnEnd';
type Result = { word: string; got: boolean };

const TILT = 0.62;
const NEUTRAL = 0.35;

export default function CharadesPlay() {
  useKeepAwake();
  const params = useLocalSearchParams<{ deck: string; seconds: string; rounds: string }>();
  const deck = charadesDecks.find((d) => d.id === params.deck) ?? charadesDecks[0];
  const seconds = Number(params.seconds) || 60;
  const rounds = Number(params.rounds) || 1;
  const players = usePlayers((s) => s.players);
  const invertTilt = useSettings((s) => s.invertTilt);
  const session = useSession();
  const exit = useExitGuard();
  const insets = useSafeAreaInsets();

  const [order] = useState(() => turnOrder(players));
  const totalTurns = order.length * rounds;
  const [turn, setTurn] = useState(0);
  const [phase, setPhase] = useState<Phase>('ready');
  const [count, setCount] = useState(3);
  const [left, setLeft] = useState(seconds);
  const [results, setResults] = useState<Result[]>([]);
  const [flash, setFlash] = useState<'got' | 'pass' | null>(null);

  const pile = useRef(shuffle(deck.words));
  const [word, setWord] = useState('');
  const armed = useRef(true);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const player = order[turn % order.length];

  useEffect(() => {
    session.start('charades', order);
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nextWord = useCallback(() => {
    if (!pile.current.length) pile.current = shuffle(deck.words);
    setWord(pile.current.pop() ?? '');
  }, [deck.words]);

  const mark = useCallback(
    (got: boolean) => {
      if (phaseRef.current !== 'play') return;
      setResults((r) => [...r, { word, got }]);
      setFlash(got ? 'got' : 'pass');
      got ? fx.correct() : fx.wrong();
      setTimeout(() => {
        setFlash(null);
        nextWord();
      }, 650);
    },
    [word, nextWord],
  );

  const markRef = useRef(mark);
  markRef.current = mark;
  const flashRef = useRef(flash);
  flashRef.current = flash;

  // Orientation: landscape while acting.
  useEffect(() => {
    const lock = phase === 'countdown' || phase === 'play' ? ScreenOrientation.OrientationLock.LANDSCAPE : ScreenOrientation.OrientationLock.PORTRAIT_UP;
    ScreenOrientation.lockAsync(lock).catch(() => {});
  }, [phase]);

  // 3-2-1 countdown.
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (count === 0) {
      nextWord();
      setLeft(seconds);
      setResults([]);
      armed.current = false;
      setPhase('play');
      fx.buzz();
      return;
    }
    fx.tick();
    const t = setTimeout(() => setCount((c) => c - 1), 900);
    return () => clearTimeout(t);
  }, [phase, count, seconds, nextWord]);

  // Round clock.
  useEffect(() => {
    if (phase !== 'play') return;
    const t = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          clearInterval(t);
          fx.buzz();
          setPhase('turnEnd');
          return 0;
        }
        if (l <= 6) fx.tick();
        return l - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase]);

  // Tilt detection.
  useEffect(() => {
    if (phase !== 'play') return;
    Accelerometer.setUpdateInterval(60);
    const sign = (Platform.OS === 'android' ? -1 : 1) * (invertTilt ? -1 : 1);
    const sub = Accelerometer.addListener(({ z }) => {
      const v = z * sign;
      if (!armed.current) {
        if (Math.abs(v) < NEUTRAL) armed.current = true;
        return;
      }
      if (flashRef.current) return;
      if (v > TILT) {
        armed.current = false;
        markRef.current(true);
      } else if (v < -TILT) {
        armed.current = false;
        markRef.current(false);
      }
    });
    return () => sub.remove();
  }, [phase, invertTilt]);

  const toggleResult = (i: number) => setResults((r) => r.map((x, j) => (j === i ? { ...x, got: !x.got } : x)));

  const endTurn = () => {
    const got = results.filter((r) => r.got).length;
    if (player) session.add(player.id, got);
    if (turn + 1 >= totalTurns) {
      router.replace('/results');
      return;
    }
    setTurn((t) => t + 1);
    setCount(3);
    setPhase('ready');
  };

  const gotCount = useMemo(() => results.filter((r) => r.got).length, [results]);

  if (!player) return null;

  /* ── landscape acting screens ── */
  if (phase === 'countdown' || phase === 'play') {
    const bg = flash === 'got' ? colors.mint : flash === 'pass' ? colors.pink : phase === 'countdown' ? colors.stage : colors.mint;
    return (
      <View style={{ flex: 1, backgroundColor: bg, paddingLeft: insets.left + 28, paddingRight: insets.right + 28, paddingVertical: 20 }}>
        <StatusBar hidden />
        {phase === 'countdown' ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Eyebrow color={colors.yellow}>PHONE ON YOUR FOREHEAD</Eyebrow>
            <Display size={160} center>
              {count || 'GO'}
            </Display>
          </View>
        ) : (
          <>
            <Row style={{ justifyContent: 'space-between' }}>
              <Row style={{ backgroundColor: colors.ink, borderRadius: 12, paddingHorizontal: 14, height: 48 }} gap={8}>
                <Icon name="timer" color={colors.yellow} />
                <Label size={28} color={colors.yellow}>
                  {fmtClock(left)}
                </Label>
              </Row>
              <Eyebrow color={colors.ink}>{deck.name}</Eyebrow>
              <Row style={{ backgroundColor: colors.ink, borderRadius: 12, paddingHorizontal: 14, height: 48 }} gap={8}>
                <Label size={28}>{gotCount}</Label>
                <Body bold size={12} color={colors.white}>
                  GOT
                </Body>
              </Row>
            </Row>
            <View style={{ flex: 1, flexDirection: 'row' }}>
              <Pressable accessibilityRole="button" accessibilityLabel="Pass" onPress={() => mark(false)} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '30%' }} />
              <Pressable accessibilityRole="button" accessibilityLabel="Got it" onPress={() => mark(true)} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '30%' }} />
              <View pointerEvents="none" style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Label size={flash ? 90 : word.length > 14 ? 76 : 104} color={colors.ink} center numberOfLines={2} adjustsFontSizeToFit style={{ lineHeight: flash ? 96 : word.length > 14 ? 84 : 110 }}>
                  {flash === 'got' ? 'GOT IT!' : flash === 'pass' ? 'PASS' : word.toUpperCase()}
                </Label>
              </View>
            </View>
            <Row style={{ justifyContent: 'space-between' }}>
              <Row gap={8}>
                <Icon name="down" color={colors.ink} />
                <Label size={18} color={colors.ink}>
                  TILT DOWN · GOT IT
                </Label>
              </Row>
              <Body bold size={12} color={colors.ink}>
                or tap the sides
              </Body>
              <Row gap={8}>
                <Label size={18} color={colors.ink}>
                  TILT UP · PASS
                </Label>
                <Icon name="up" color={colors.ink} />
              </Row>
            </Row>
          </>
        )}
      </View>
    );
  }

  /* ── turn results ── */
  if (phase === 'turnEnd') {
    const nextPlayer = order[(turn + 1) % order.length];
    const last = turn + 1 >= totalTurns;
    return (
      <Screen
        scroll
        footer={
          <GameButton label={last ? 'SEE THE WINNER' : `NEXT UP: ${nextPlayer.name.toUpperCase()}`} onPress={endTurn} />
        }
      >
        <Eyebrow color={colors.mint}>TIME'S UP · {deck.name}</Eyebrow>
        <Row gap={14} style={{ alignItems: 'flex-end' }}>
          <Display size={140} color={colors.yellow} style={{ lineHeight: 130 }}>
            {gotCount}
          </Display>
          <Display size={38} style={{ marginBottom: 12, flex: 1 }}>
            {`${player.name.toUpperCase()} GOT ${gotCount === 1 ? 'ONE' : gotCount}!`}
          </Display>
        </Row>
        <Body size={13} color={colors.muted}>
          Tap a word to fix a mistake.
        </Body>
        <Panel style={{ paddingVertical: 4 }}>
          {results.length === 0 ? (
            <Body center style={{ paddingVertical: 14 }}>
              No words this time. Tough crowd.
            </Body>
          ) : (
            results.map((r, i) => (
              <Pressable
                key={`${r.word}-${i}`}
                accessibilityRole="button"
                accessibilityLabel={`${r.word}, ${r.got ? 'got it' : 'passed'}. Tap to change`}
                onPress={() => toggleResult(i)}
                style={{ minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: i === results.length - 1 ? 0 : 1.5, borderBottomColor: colors.navyLine }}
              >
                <Label size={20} color={r.got ? colors.white : colors.faint}>
                  {r.word.toUpperCase()}
                </Label>
                <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: r.got ? colors.mint : colors.pink }}>
                  <Body bold size={11} color={colors.ink}>
                    {r.got ? 'GOT IT' : 'PASSED'}
                  </Body>
                </View>
              </Pressable>
            ))
          )}
        </Panel>
      </Screen>
    );
  }

  /* ── get ready ── */
  return (
    <Screen
      footer={
        <>
          <GameButton label="PHONE ON HEAD · START" onPress={() => { setCount(3); setPhase('countdown'); }} />
        </>
      }
    >
      <TopBar left={<IconButton icon="close" label="End game" onPress={exit} />} right={<Body bold color={colors.white}>Turn {turn + 1} of {totalTurns}</Body>} />
      <View>
        <Eyebrow color={colors.mint}>
          {deck.name} · {seconds} SEC
        </Eyebrow>
        <Display size={58} style={{ marginTop: 6 }}>
          {`${player.name.toUpperCase()}, YOU'RE UP`}
        </Display>
      </View>
      <View style={{ alignItems: 'center' }}>
        <Svg width={200} height={170} viewBox="0 0 220 200" accessibilityLabel="Hold the phone flat against your forehead, screen facing your friends">
          <Rect x={58} y={14} width={104} height={58} rx={12} fill={colors.mint} stroke={colors.ink} strokeWidth={4} />
          <Path d="M82 43H138" stroke={colors.ink} strokeWidth={6} strokeLinecap="round" />
          <Path d="M60 88C60 60 82 74 110 74C138 74 160 60 160 88V130C160 160 138 186 110 186C82 186 60 160 60 130Z" fill={colors.yellow} stroke={colors.ink} strokeWidth={4} />
          <Circle cx={90} cy={120} r={7} fill={colors.ink} />
          <Circle cx={130} cy={120} r={7} fill={colors.ink} />
          <Path d="M94 152Q110 164 126 152" fill="none" stroke={colors.ink} strokeWidth={5} strokeLinecap="round" />
        </Svg>
      </View>
      <Row style={{ backgroundColor: colors.mint, borderRadius: 14, minHeight: 64, paddingHorizontal: 16 }} gap={14}>
        <Icon name="down" color={colors.ink} size={28} />
        <View>
          <Label size={22} color={colors.ink}>TILT DOWN</Label>
          <Body bold size={13} color={colors.ink}>Got it, +1 point</Body>
        </View>
      </Row>
      <Row style={{ backgroundColor: colors.pink, borderRadius: 14, minHeight: 64, paddingHorizontal: 16 }} gap={14}>
        <Icon name="up" color={colors.ink} size={28} />
        <View>
          <Label size={22} color={colors.ink}>TILT UP</Label>
          <Body bold size={13} color={colors.ink}>Pass, next word</Body>
        </View>
      </Row>
    </Screen>
  );
}
