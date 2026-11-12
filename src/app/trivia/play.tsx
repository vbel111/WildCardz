import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '@/theme';
import { Body, Buzzer, Display, Eyebrow, GameButton, IconButton, Label, Panel, PromptCard, Row, Screen, TopBar } from '@/components/ui';
import { TimerRing } from '@/components/TimerRing';
import { turnOrder, useExitGuard } from '@/components/game';
import { usePlayers } from '@/stores/players';
import { ranked, useSession } from '@/stores/session';
import { useCountdown } from '@/hooks/useCountdown';
import { buildTriviaRound } from '@/services/trivia';
import { fx } from '@/services/feedback';

const SECONDS = 20;
const KEYS = ['A', 'B', 'C', 'D'];
const KEY_COLORS = [colors.yellow, colors.pink, colors.mint, colors.orange];

type Phase = 'question' | 'reveal' | 'scores';

export default function TriviaPlay() {
  const params = useLocalSearchParams<{ cats: string; count: string; mode: 'turns' | 'buzz' }>();
  const mode = params.mode === 'buzz' ? 'buzz' : 'turns';
  const players = usePlayers((s) => s.players);
  const session = useSession();
  const exit = useExitGuard();

  const [order] = useState(() => turnOrder(players));
  const [questions] = useState(() => buildTriviaRound((params.cats ?? '').split(',').filter(Boolean), Number(params.count) || 10));
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('question');
  const [picked, setPicked] = useState<number | null>(null);
  const [buzzer, setBuzzer] = useState<string | null>(null);
  const [streaks, setStreaks] = useState<Record<string, number>>({});
  const [gain, setGain] = useState(0);

  useEffect(() => {
    session.start('trivia', order);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const q = questions[index];
  const answerer = mode === 'turns' ? order[index % order.length] : order.find((p) => p.id === buzzer) ?? null;
  const last = index >= questions.length - 1;

  const { left, reset } = useCountdown(
    SECONDS,
    phase === 'question' && (mode === 'turns' || !!buzzer),
    () => answer(-1),
    (l) => l <= 5 && fx.tick(),
  );

  function answer(i: number) {
    if (phase !== 'question') return;
    setPicked(i);
    setPhase('reveal');
    const right = i === q.correct;
    if (answerer && right) {
      const streak = (streaks[answerer.id] ?? 0) + 1;
      const pts = 100 + Math.round((left / SECONDS) * 50) + (streak >= 3 ? 50 : 0);
      setStreaks((s) => ({ ...s, [answerer.id]: streak }));
      session.add(answerer.id, pts);
      setGain(pts);
      fx.correct();
    } else {
      if (answerer) setStreaks((s) => ({ ...s, [answerer.id]: 0 }));
      setGain(0);
      fx.wrong();
    }
  }

  const next = () => {
    if (last) {
      router.replace('/results');
      return;
    }
    if (phase === 'reveal' && (index + 1) % 5 === 0) {
      setPhase('scores');
      return;
    }
    setIndex((x) => x + 1);
    setPicked(null);
    setBuzzer(null);
    setPhase('question');
    reset(SECONDS);
  };

  if (!q) {
    return (
      <Screen footer={<GameButton label="BACK" onPress={() => router.back()} />}>
        <Display>NO QUESTIONS</Display>
        <Body>Pick at least one category to play.</Body>
      </Screen>
    );
  }

  if (phase === 'scores') {
    const rows = ranked(session.scorers, session.scores);
    const max = Math.max(1, rows[0]?.points ?? 1);
    return (
      <Screen footer={<GameButton label="KEEP GOING" onPress={next} />}>
        <Eyebrow color={colors.yellow}>AFTER QUESTION {index + 1} OF {questions.length}</Eyebrow>
        <Display size={60}>THE SCOREBOARD</Display>
        <View style={{ gap: 10 }}>
          {rows.map((r, i) => (
            <View key={r.id} style={{ height: 70, borderRadius: 14, backgroundColor: colors.navy, overflow: 'hidden', justifyContent: 'center' }}>
              <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.round((r.points / max) * 100)}%`, backgroundColor: i === 0 ? 'rgba(255,225,77,0.22)' : 'rgba(255,255,255,0.08)' }} />
              <Row gap={12} style={{ paddingHorizontal: 12 }}>
                <Label size={26} color={colors.yellow} style={{ width: 26 }}>
                  {i + 1}
                </Label>
                <Buzzer name={r.name} color={r.color} />
                <Label size={24} style={{ flex: 1 }} numberOfLines={1}>
                  {r.name.toUpperCase()}
                </Label>
                <Label size={30}>{r.points}</Label>
              </Row>
            </View>
          ))}
        </View>
      </Screen>
    );
  }

  const reveal = phase === 'reveal';
  const right = picked === q.correct;

  return (
    <Screen
      scroll
      bg={reveal ? (right ? colors.mint : colors.stage) : colors.stage}
      light={reveal && right}
      footer={reveal ? <GameButton label={last ? 'SEE THE WINNER' : 'NEXT QUESTION'} color={right ? colors.ink : colors.yellow} shade={right ? colors.deep : colors.yellowShade} textColor={right ? colors.yellow : colors.ink} onPress={next} /> : undefined}
    >
      <TopBar
        left={<IconButton icon="close" label="End quiz" onPress={exit} />}
        right={
          reveal ? (
            gain ? (
              <View style={{ backgroundColor: colors.ink, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, transform: [{ rotate: '3deg' }] }}>
                <Label size={22} color={colors.yellow}>
                  +{gain} {answerer?.name.toUpperCase()}
                </Label>
              </View>
            ) : null
          ) : (
            <TimerRing left={left} total={SECONDS} />
          )
        }
      />

      {reveal ? (
        <View style={{ gap: 4 }}>
          <Label size={86} color={right ? colors.ink : colors.pink} style={{ lineHeight: 84 }}>
            {right ? 'CORRECT!' : picked === -1 ? "TIME'S UP" : 'WRONG!'}
          </Label>
          <Body bold color={right ? colors.ink : colors.mist}>
            {right && answerer && (streaks[answerer.id] ?? 0) >= 3
              ? `${answerer.name} is on a ${streaks[answerer.id]}-question streak.`
              : `The answer was ${q.options[q.correct]}.`}
          </Body>
        </View>
      ) : (
        <Row>
          <View style={{ backgroundColor: colors.orange, paddingHorizontal: 10, paddingVertical: 5 }}>
            <Label size={16} color={colors.ink}>
              {q.category.toUpperCase()}
            </Label>
          </View>
          <Body bold color={colors.mist} style={{ flex: 1 }}>
            {mode === 'turns' ? `${answerer?.name} is answering` : buzzer ? `${answerer?.name} buzzed in` : 'First to shout, tap your buzzer'}
          </Body>
        </Row>
      )}

      {!reveal ? <PromptCard eyebrow={`QUESTION ${index + 1} OF ${questions.length}`} text={q.q.toUpperCase()} size={q.q.length > 70 ? 28 : 32} /> : null}

      {mode === 'buzz' && !buzzer && !reveal ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
          {order.map((p) => (
            <Pressable
              key={p.id}
              accessibilityRole="button"
              accessibilityLabel={`${p.name} buzzed`}
              onPress={() => {
                fx.buzz();
                setBuzzer(p.id);
              }}
              style={{ alignItems: 'center', gap: 6, width: 62 }}
            >
              <Buzzer name={p.name} color={p.color} size={58} />
              <Body bold size={12} color={colors.white} numberOfLines={1}>
                {p.name}
              </Body>
            </Pressable>
          ))}
          <Pressable accessibilityRole="button" onPress={() => answer(-1)} style={{ height: 58, justifyContent: 'center', paddingHorizontal: 10 }}>
            <Body bold color={colors.muted} style={{ textDecorationLine: 'underline' }}>
              Nobody knows
            </Body>
          </Pressable>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {q.options.map((opt, i) => {
            const isRight = i === q.correct;
            const isPicked = i === picked;
            const dim = reveal && !isRight && !isPicked;
            const bg = reveal ? (isRight ? colors.ink : isPicked ? colors.pink : 'transparent') : colors.navy;
            return (
              <Pressable
                key={i}
                disabled={reveal}
                accessibilityRole="button"
                accessibilityLabel={`${KEYS[i]}: ${opt}${reveal && isRight ? ', correct answer' : ''}`}
                onPress={() => answer(i)}
                style={({ pressed }) => ({
                  minHeight: 62,
                  borderRadius: 14,
                  backgroundColor: bg,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  paddingHorizontal: 8,
                  paddingVertical: 8,
                  borderBottomWidth: reveal ? 0 : pressed ? 2 : 5,
                  borderBottomColor: colors.deep,
                  opacity: dim ? 0.7 : 1,
                })}
              >
                <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: reveal && !isRight ? 'transparent' : KEY_COLORS[i], alignItems: 'center', justifyContent: 'center' }}>
                  <Label size={22} color={reveal && !isRight ? (right ? colors.ink : colors.white) : colors.ink}>
                    {KEYS[i]}
                  </Label>
                </View>
                <Label size={22} style={{ flex: 1 }} color={reveal ? (isRight || isPicked ? colors.white : right ? colors.ink : colors.mist) : colors.white}>
                  {opt.toUpperCase()}
                </Label>
              </Pressable>
            );
          })}
        </View>
      )}

      {reveal && q.fact ? (
        <Panel bg={colors.ink}>
          <Eyebrow color={colors.yellow}>DID YOU KNOW</Eyebrow>
          <Body color={colors.white} style={{ marginTop: 6 }}>
            {q.fact}
          </Body>
        </Panel>
      ) : null}
    </Screen>
  );
}
