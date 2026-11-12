import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gameMeta, type GameId } from '@/theme';
import { Body, Display, GameButton, IconButton, Label, Tag } from '../ui';
import { Icon } from '../Icon';
import { fx, haptic } from '@/services/feedback';
import { useSettings } from '@/stores/settings';
import { useDemoPlayers, useReducedMotion, usePop } from './kit';
import * as D from './demos';

type Step = {
  title: string;
  text: string;
  /** What the player has to do before NEXT unlocks. Steps without a task are free to skip past. */
  task?: string;
  praise?: string;
  demo?: (p: D.DemoProps) => ReactNode;
};

const READY = (game: GameId, tip: string): Step => ({
  title: "YOU'RE READY",
  text: tip,
  demo: () => <ReadyCard game={game} />,
});

export const tutorials: Record<GameId, Step[]> = {
  tod: [
    {
      title: 'TRUTH OR DARE?',
      text: 'On your turn, pick one. A truth is a question you answer honestly. A dare is something you do, right now.',
      task: 'Tap TRUTH or DARE to draw a card',
      praise: 'Nice pick! Try the other one too.',
      demo: (p) => <D.TodPick {...p} />,
    },
    {
      title: 'DO IT OR CHICKEN OUT',
      text: 'Finish the card to score a point. Skipping is always allowed, it just scores nothing.',
      task: 'Tap DONE IT or Chicken out',
      praise: 'That is how points work.',
      demo: (p) => <D.TodScore {...p} />,
    },
    {
      title: 'PASS THE PHONE',
      text: 'One phone, everyone plays. When your turn is done, hand it to the next player. The app keeps track of whose go it is.',
      task: 'Pass the phone around twice',
      praise: 'You have got the rhythm.',
      demo: (p) => <D.PassDemo {...p} />,
    },
    READY('tod', "Pick a deck to start. Can't decide? Hit Spin for me and let fate choose. Most points at the end wins."),
  ],
  nhie: [
    {
      title: 'READ THE CARD',
      text: 'Each card starts with "Never have I ever..." Whoever holds the phone reads it out loud.',
      task: 'Tap the card to reveal it',
      praise: 'Good. Now be honest...',
      demo: (p) => <D.NhieRead {...p} />,
    },
    {
      title: 'GUILTY? BUZZ IN',
      text: "If you HAVE done it, tap your buzzer. Every buzz is a confession and scores a point. No buzzing for things you haven't done!",
      task: 'Buzz in for at least one player',
      praise: 'Confession recorded.',
      demo: (p) => <D.NhieBuzz {...p} />,
    },
    {
      title: 'WILDEST WINS',
      text: 'Confessions add up over the game. The player with the most at the end takes the crown for wildest in the room.',
      demo: (p) => <D.Leaderboard {...p} />,
    },
    READY('nhie', 'Pick a deck and pass the phone after each card. The story behind each buzz is the best part, so ask!'),
  ],
  charades: [
    {
      title: 'PHONE ON YOUR HEAD',
      text: 'Hold the phone sideways on your forehead with the screen facing out. Everyone else can see the word. You can not.',
      task: 'Tap the head to put the phone on',
      praise: 'Looking good.',
      demo: (p) => <D.CharHead {...p} />,
    },
    {
      title: 'GUESSED IT? TILT DOWN',
      text: 'Friends act, hum or describe the word without saying it. When you guess right, nod the phone down.',
      task: 'Tip your screen down to the floor',
      praise: 'Point scored!',
      demo: (p) => <D.TiltDemo {...p} want="got" />,
    },
    {
      title: 'STUCK? TILT UP',
      text: 'Too hard? Tip the phone up to pass and get a new word. No penalty, so keep it moving.',
      task: 'Tip your screen up to the sky',
      praise: 'Skipped. Next word!',
      demo: (p) => <D.TiltDemo {...p} want="pass" />,
    },
    {
      title: 'CHECK THE SCORE',
      text: 'When the clock runs out you see every word. Got one marked wrong by accident? Tap it to fix it before the points count.',
      task: 'Tap a word to flip it',
      praise: 'Fair play.',
      demo: (p) => <D.CharReview {...p} />,
    },
    READY('charades', 'Pick a category and a round time. If tilting feels backwards, flip it in Settings.'),
  ],
  trivia: [
    {
      title: 'ANSWER FAST',
      text: 'A right answer is worth 100. The faster you answer, the bigger your speed bonus, up to +50.',
      task: 'Pick the right answer',
      praise: 'Quick thinking!',
      demo: (p) => <D.TriviaAnswer {...p} />,
    },
    {
      title: 'TAKE TURNS OR BUZZ IN',
      text: 'Take turns gives everyone a question in order. Buzz in is a race: first to hit their buzzer gets to answer.',
      task: 'Wait for green, then buzz',
      praise: 'Lightning reflexes.',
      demo: (p) => <D.TriviaBuzz {...p} />,
    },
    {
      title: 'GO ON A STREAK',
      text: 'Get three right in a row and every answer after that earns +50 extra. Miss one and the streak resets.',
      task: 'Answer three in a row',
      praise: 'Unstoppable.',
      demo: (p) => <D.StreakDemo {...p} />,
    },
    READY('trivia', 'Choose your categories, how many questions and the mode. Play together on one phone or open an online room.'),
  ],
  bluff: [
    {
      title: 'WRITE A FAKE',
      text: 'You get a weird-but-true fact with a blank. Everyone secretly writes a fake answer that sounds real.',
      task: 'Write a bluff and lock it in',
      praise: 'Very convincing.',
      demo: (p) => <D.BluffWrite {...p} />,
    },
    {
      title: 'SPOT THE TRUTH',
      text: 'All the fakes get mixed in with the real answer. Pick the one you think is true. You can not pick your own.',
      task: 'Find the real answer',
      praise: 'Detective skills unlocked.',
      demo: (p) => <D.BluffVote {...p} />,
    },
    {
      title: 'HOW YOU SCORE',
      text: '+100 for every friend who falls for your fake. +200 for spotting the real answer. The best liars win.',
      demo: (p) => <D.BluffScore {...p} />,
    },
    READY('bluff', 'On one phone, pass it privately so nobody sees your fake. Online, everyone types on their own phone.'),
  ],
};

function ReadyCard({ game }: { game: GameId }) {
  const m = gameMeta[game];
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(v, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }).start();
  }, [v]);
  return (
    <Animated.View
      style={{
        alignSelf: 'center',
        width: 230,
        height: 230,
        borderRadius: 115,
        backgroundColor: m.color,
        borderBottomWidth: 14,
        borderBottomColor: m.shade,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ scale: v }, { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['-25deg', '-4deg'] }) }],
      }}
    >
      <Label size={20} color={colors.ink}>
        GAME {m.no}
      </Label>
      <Label center size={34} color={colors.ink} style={{ paddingHorizontal: 18 }}>
        {m.name}
      </Label>
    </Animated.View>
  );
}

type Props = {
  game: GameId;
  visible: boolean;
  /** Called when the player finishes or skips. `finished` is true only when they reached the end. */
  onClose: (finished: boolean) => void;
  finishLabel?: string;
};

export function GameTutorial({ game, visible, onClose, finishLabel = "LET'S PLAY" }: Props) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const players = useDemoPlayers();
  const meta = gameMeta[game];
  const steps = tutorials[game];
  const [i, setI] = useState(0);
  const [done, setDone] = useState<Record<number, boolean>>({});
  const [fake, setFake] = useState('');
  const iRef = useRef(0);
  iRef.current = i;
  const enter = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;
    setI(0);
    setDone({});
    setFake('');
  }, [visible, game]);

  useEffect(() => {
    if (reduced) {
      enter.setValue(1);
      return;
    }
    enter.setValue(0);
    Animated.timing(enter, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [i, reduced, enter]);

  const markDone = useCallback(() => {
    const at = iRef.current;
    setDone((d) => (d[at] ? d : { ...d, [at]: true }));
  }, []);

  const step = steps[i];
  const ok = !step.task || !!done[i];
  const last = i === steps.length - 1;
  const praisePop = usePop(ok);

  useEffect(() => {
    if (step.task && done[i]) haptic('success');
  }, [done, i, step.task]);

  const next = () => {
    if (!ok) return;
    if (last) {
      fx.win();
      onClose(true);
      return;
    }
    setI((n) => n + 1);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => onClose(false)} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.stage }}>
        <View style={{ flex: 1, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 }}>
          {/* header */}
          <View style={{ paddingHorizontal: 20, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Tag label={`HOW TO PLAY · ${meta.name}`} color={meta.color} />
              <Pressable accessibilityRole="button" accessibilityLabel="Skip tutorial" hitSlop={10} onPress={() => onClose(false)} style={{ padding: 6 }}>
                <Body bold color={colors.muted}>
                  Skip
                </Body>
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }} accessibilityLabel={`Step ${i + 1} of ${steps.length}`}>
              {steps.map((_, k) => (
                <View key={k} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: k < i || (k === i && ok) ? meta.color : k === i ? colors.lilac : colors.navySoft }} />
              ))}
            </View>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 20, gap: 16, flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              key={`${game}-${i}`}
              style={{
                gap: 16,
                flexGrow: 1,
                opacity: enter,
                transform: [{ translateX: enter.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
              }}
            >
              <View style={{ gap: 6 }}>
                <Body bold size={12} color={colors.muted} style={{ letterSpacing: 2 }}>
                  STEP {i + 1} OF {steps.length}
                </Body>
                <Display size={44}>{step.title}</Display>
                <Body size={16}>{step.text}</Body>
              </View>

              {step.demo ? <View style={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 8 }}>{step.demo({ done: markDone, players, fake, setFake })}</View> : null}
            </Animated.View>
          </ScrollView>

          {/* task + controls */}
          <View style={{ paddingHorizontal: 20, gap: 12 }}>
            {step.task ? (
              <Animated.View
                accessibilityLiveRegion="polite"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  backgroundColor: ok ? colors.mint : colors.deep,
                  transform: [{ scale: praisePop }],
                }}
              >
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: ok ? colors.ink : meta.color, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={ok ? 'check' : 'play'} color={ok ? colors.mint : colors.ink} size={ok ? 18 : 13} strokeWidth={3.4} />
                </View>
                <Body bold color={ok ? colors.ink : colors.white} style={{ flex: 1 }}>
                  {ok ? step.praise ?? 'Nice one!' : `Try it: ${step.task}`}
                </Body>
              </Animated.View>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-end' }}>
              {i > 0 ? <IconButton icon="back" label="Previous step" onPress={() => setI((n) => n - 1)} /> : null}
              <GameButton
                label={last ? finishLabel : ok ? 'NEXT' : 'TRY IT FIRST'}
                color={meta.color}
                shade={meta.shade}
                disabled={!ok}
                onPress={next}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/**
 * Opens the game's tutorial the first time someone visits the game, and lets the
 * help button reopen it any time after.
 */
export function useGameTutorial(game: GameId) {
  const seen = useSettings((s) => (s.tutorialsSeen ?? []).includes(game));
  const mark = useSettings((s) => s.markTutorialSeen);
  const [open, setOpen] = useState(false);
  // Wait for the screen's slide-in to finish so the modal doesn't fight the navigation animation.
  useEffect(() => {
    if (seen) return;
    const t = setTimeout(() => setOpen(true), 380);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const close = useCallback(() => {
    mark(game);
    setOpen(false);
  }, [game, mark]);
  const show = useCallback(() => setOpen(true), []);
  return { open, show, close };
}
