import { type ReactNode, useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { colors, fonts } from '@/theme';
import { Body, Buzzer, Display, Eyebrow, GameButton, IconButton, Label, Panel, Pill, PromptCard, Row, Screen, TopBar } from '@/components/ui';
import { TimerRing } from '@/components/TimerRing';
import { ConnectionBanner } from '@/components/ConnectionBanner';
import { useRoom, type BluffGame, type OnlinePlayer, type TriviaGame } from '@/services/online';
import { fx } from '@/services/feedback';
import { onGameFinished } from '@/services/review';

const KEYS = ['A', 'B', 'C', 'D'];
const KEY_COLORS = [colors.yellow, colors.pink, colors.mint, colors.orange];

function useSecondsLeft(deadline: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [deadline]);
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

export default function OnlinePlay() {
  useKeepAwake();
  const room = useRoom();
  const { game, me, players } = room;

  useEffect(() => {
    if (room.status === 'lobby') router.replace('/online/lobby');
    if (room.status === 'ended' || room.status === 'error') {
      Alert.alert('Show over', room.notice ?? room.error ?? 'The room has closed.');
      router.replace('/home');
    }
  }, [room.status, room.notice, room.error]);

  useEffect(() => {
    if (room.notice && room.status === 'playing') {
      fx.wrong();
      Alert.alert('Heads up', room.notice, [{ text: 'OK', onPress: room.clearNotice }]);
    }
  }, [room.notice, room.status, room.clearNotice]);

  useEffect(() => {
    if (game?.phase === 'reveal') fx.reveal();
    if (game?.phase === 'final') {
      fx.win();
      onGameFinished();
    }
  }, [game?.phase, game?.round]);

  if (!game || !me) return <Screen><Display>LOADING…</Display></Screen>;

  const leave = () =>
    Alert.alert(me.host ? 'End the show for everyone?' : 'Leave the show?', undefined, [
      { text: 'Stay', style: 'cancel' },
      {
        text: me.host ? 'End show' : 'Leave',
        style: 'destructive',
        onPress: async () => {
          await room.leave();
          router.replace('/home');
        },
      },
    ]);

  const top = (
    <TopBar
      left={<IconButton icon="close" label="Leave" onPress={leave} />}
      right={<Pill label={`${game.kind.toUpperCase()} · ${game.phase === 'final' ? 'FINAL' : `${game.round} OF ${game.total}`}`} />}
    />
  );

  if (game.phase === 'final') return <Final top={top} game={game} players={players} isHost={me.host} onNext={room.next} />;
  if (game.kind === 'trivia') return <Trivia top={top} game={game} me={me} players={players} />;
  return <Bluff top={top} game={game} me={me} players={players} />;
}

/* ───────────── Trivia ───────────── */

function Trivia({ top, game, me, players }: { top: ReactNode; game: TriviaGame; me: OnlinePlayer; players: OnlinePlayer[] }) {
  const room = useRoom();
  const left = useSecondsLeft(game.deadline);
  const mine = game.answers[me.id];
  const reveal = game.phase === 'reveal';
  const q = game.question;
  const answered = Object.keys(game.answers).length;

  return (
    <Screen
      scroll
      footer={
        reveal ? (
          me.host ? (
            <GameButton label={game.round >= game.total ? 'FINAL SCORES' : 'NEXT QUESTION'} onPress={room.next} />
          ) : (
            <Body center bold color={colors.white}>
              Waiting for the host…
            </Body>
          )
        ) : undefined
      }
    >
      {top}
      <ConnectionBanner />
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ backgroundColor: colors.orange, paddingHorizontal: 10, paddingVertical: 5 }}>
          <Label size={16} color={colors.ink}>
            {q.category.toUpperCase()}
          </Label>
        </View>
        {reveal ? (
          game.gained[me.id] ? (
            <Label size={22} color={colors.mint}>
              +{game.gained[me.id]} YOU
            </Label>
          ) : (
            <Label size={22} color={colors.pink}>
              NO POINTS
            </Label>
          )
        ) : (
          <TimerRing left={left} total={game.seconds} />
        )}
      </Row>
      <PromptCard eyebrow={`QUESTION ${game.round} OF ${game.total}`} text={q.q.toUpperCase()} size={q.q.length > 70 ? 28 : 32} />
      <View style={{ gap: 10 }}>
        {q.options.map((opt, i) => {
          const isRight = reveal && i === q.correct;
          const isMine = mine?.i === i;
          const pickers = reveal ? players.filter((p) => game.answers[p.id]?.i === i) : [];
          return (
            <Pressable
              key={i}
              disabled={!!mine || reveal}
              accessibilityRole="button"
              accessibilityState={{ selected: isMine }}
              accessibilityLabel={`${KEYS[i]}: ${opt}`}
              onPress={() => {
                fx.tap();
                room.act({ type: 'answer', i });
              }}
              style={{
                minHeight: 62,
                borderRadius: 14,
                backgroundColor: isRight ? colors.mint : isMine ? colors.pink : colors.navy,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                padding: 8,
                borderBottomWidth: mine || reveal ? 0 : 5,
                borderBottomColor: colors.deep,
                opacity: (mine || reveal) && !isMine && !isRight ? 0.7 : 1,
              }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: isRight || isMine ? colors.ink : KEY_COLORS[i], alignItems: 'center', justifyContent: 'center' }}>
                <Label size={22} color={isRight || isMine ? colors.white : colors.ink}>
                  {KEYS[i]}
                </Label>
              </View>
              <Label size={22} style={{ flex: 1 }} color={isRight || isMine ? colors.ink : colors.white}>
                {opt.toUpperCase()}
              </Label>
              <Row gap={2}>
                {pickers.map((p) => (
                  <Buzzer key={p.id} name={p.name} color={p.color} size={24} />
                ))}
              </Row>
            </Pressable>
          );
        })}
      </View>
      {!reveal ? (
        <Body center bold color={colors.muted}>
          {mine ? `Locked in. ${answered} of ${players.length} answered.` : 'Faster answers score more.'}
        </Body>
      ) : q.fact ? (
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

/* ───────────── Bluff ───────────── */

function Bluff({ top, game, me, players }: { top: ReactNode; game: BluffGame; me: OnlinePlayer; players: OnlinePlayer[] }) {
  const room = useRoom();
  const left = useSecondsLeft(game.deadline);
  const [draft, setDraft] = useState('');
  const myFake = game.fakes[me.id];
  const myVote = game.votes[me.id];
  const name = (id: string) => players.find((p) => p.id === id)?.name ?? 'Someone';

  useEffect(() => setDraft(''), [game.round]);

  if (game.phase === 'write') {
    const done = Object.keys(game.fakes).length;
    return (
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.stage }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Screen
          scroll
          footer={
            myFake ? (
              <Body center bold color={colors.white}>
                Locked in. {done} of {players.length} done.
              </Body>
            ) : (
              <GameButton label="LOCK IT IN" disabled={!draft.trim()} onPress={() => room.act({ type: 'fake', text: draft })} />
            )
          }
        >
          {top}
          <ConnectionBanner />
      <ConnectionBanner />
          <Row style={{ justifyContent: 'space-between' }}>
            <Body bold color={colors.white}>
              Only you can see this
            </Body>
            <TimerRing left={left} total={game.seconds} />
          </Row>
          <PromptCard eyebrow="FILL THE BLANK" text={game.prompt.toUpperCase()} size={32} />
          {myFake ? (
            <Panel>
              <Eyebrow>YOUR FAKE</Eyebrow>
              <Label size={30} color={colors.yellow}>
                "{myFake.toUpperCase()}"
              </Label>
            </Panel>
          ) : (
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Make it sound real…"
              placeholderTextColor={colors.faint}
              maxLength={40}
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={() => draft.trim() && room.act({ type: 'fake', text: draft })}
              accessibilityLabel="Your fake answer"
              style={{ minHeight: 64, borderRadius: 14, borderWidth: 2.5, borderColor: colors.white, backgroundColor: colors.navy, paddingHorizontal: 16, color: colors.white, fontFamily: fonts.bodyBold, fontSize: 19 }}
            />
          )}
        </Screen>
      </KeyboardAvoidingView>
    );
  }

  if (game.phase === 'vote') {
    const choices = game.options.filter((o) => !o.by.includes(me.id));
    const done = Object.keys(game.votes).length;
    return (
      <Screen scroll footer={<Body center bold color={colors.white}>{myVote ? `Vote in. ${done} of ${players.length} voted.` : 'Tap the one you think is real.'}</Body>}>
        {top}
      <ConnectionBanner />
        <Row style={{ justifyContent: 'space-between' }}>
          <Display size={44} style={{ flex: 1 }}>
            WHICH ONE IS REAL?
          </Display>
          <TimerRing left={left} total={game.seconds} />
        </Row>
        <Body>{game.prompt}</Body>
        <View style={{ gap: 10 }}>
          {choices.map((o) => {
            const on = myVote === o.id;
            return (
              <Pressable
                key={o.id}
                disabled={!!myVote}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={o.text}
                onPress={() => {
                  fx.tap();
                  room.act({ type: 'vote', optionId: o.id });
                }}
                style={{
                  minHeight: 64,
                  borderRadius: 14,
                  backgroundColor: on ? colors.pink : colors.navy,
                  borderBottomWidth: 5,
                  borderBottomColor: on ? colors.pinkShade : colors.deep,
                  paddingHorizontal: 18,
                  justifyContent: 'center',
                  opacity: myVote && !on ? 0.6 : 1,
                }}
              >
                <Label size={24} color={on ? colors.ink : colors.white}>
                  {o.text.toUpperCase()}
                </Label>
              </Pressable>
            );
          })}
        </View>
      </Screen>
    );
  }

  // reveal
  const realVoters = Object.entries(game.votes).filter(([, id]) => id === 'real').map(([v]) => name(v));
  const fakes = game.options.filter((o) => !o.real);
  return (
    <Screen
      scroll
      footer={
        me.host ? (
          <GameButton label={game.round >= game.total ? 'FINAL SCORES' : 'NEXT ROUND'} onPress={room.next} />
        ) : (
          <Body center bold color={colors.white}>
            Waiting for the host…
          </Body>
        )
      }
    >
      {top}
      <ConnectionBanner />
      <View style={{ backgroundColor: colors.yellow, borderRadius: 20, padding: 20, borderBottomWidth: 8, borderBottomColor: colors.yellowShade, transform: [{ rotate: '-1.5deg' }] }}>
        <Eyebrow color={colors.ink}>THE REAL ANSWER</Eyebrow>
        <Label size={52} color={colors.ink} numberOfLines={2} adjustsFontSizeToFit>
          {game.answer.toUpperCase()}
        </Label>
        <Body bold color={colors.ink}>
          {realVoters.length ? `Spotted by ${realVoters.join(', ')} · +200 each` : 'Nobody spotted it!'}
        </Body>
      </View>
      {game.gained[me.id] ? (
        <Label size={26} color={colors.mint}>
          YOU SCORED +{game.gained[me.id]}
        </Label>
      ) : null}
      <Label size={26}>THE BEST LIARS</Label>
      <View style={{ gap: 8 }}>
        {fakes.map((o) => {
          const fooled = Object.entries(game.votes).filter(([, id]) => id === o.id).map(([v]) => name(v));
          return (
            <Panel key={o.id} style={{ gap: 2 }}>
              <Label size={21}>"{o.text.toUpperCase()}"</Label>
              <Body size={13}>
                {o.by.map(name).join(' & ')} · {fooled.length ? `fooled ${fooled.join(', ')}` : 'fooled nobody'}
              </Body>
            </Panel>
          );
        })}
      </View>
    </Screen>
  );
}

/* ───────────── Final ───────────── */

function Final({ top, game, players, isHost, onNext }: { top: ReactNode; game: TriviaGame | BluffGame; players: OnlinePlayer[]; isHost: boolean; onNext: () => void }) {
  const rows = players.map((p) => ({ ...p, points: game.scores[p.id] ?? 0 })).sort((a, b) => b.points - a.points);
  return (
    <Screen scroll footer={isHost ? <GameButton label="BACK TO THE LOBBY" onPress={onNext} /> : <Body center bold color={colors.white}>Waiting for the host…</Body>}>
      {top}
      <ConnectionBanner />
      <Eyebrow color={colors.yellow}>AND THE WINNER IS…</Eyebrow>
      <Display size={96} numberOfLines={1} adjustsFontSizeToFit>
        {(rows[0]?.name ?? '').toUpperCase()}
      </Display>
      <View style={{ gap: 8 }}>
        {rows.map((r, i) => (
          <Row key={r.id} gap={12} style={{ minHeight: 60, borderRadius: 14, backgroundColor: i === 0 ? colors.ink : colors.navy, paddingHorizontal: 12 }}>
            <Label size={24} color={colors.yellow} style={{ width: 26 }}>
              {i + 1}
            </Label>
            <Buzzer name={r.name} color={r.color} size={40} />
            <Label size={22} style={{ flex: 1 }} numberOfLines={1}>
              {r.name.toUpperCase()}
            </Label>
            <Label size={26}>{r.points}</Label>
          </Row>
        ))}
      </View>
    </Screen>
  );
}
