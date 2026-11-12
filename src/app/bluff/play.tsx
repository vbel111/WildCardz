import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, fonts } from '@/theme';
import { Body, Buzzer, Display, Eyebrow, GameButton, IconButton, Label, Pill, PromptCard, Row, Screen, TopBar } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { turnOrder, useExitGuard } from '@/components/game';
import { bluffFacts } from '@/data/bluff';
import { usePlayers } from '@/stores/players';
import { useSession } from '@/stores/session';
import { shuffle, uid } from '@/utils/random';
import { fx } from '@/services/feedback';

type Option = { id: string; text: string; by: string[]; real: boolean };
type Phase = 'passWrite' | 'write' | 'passVote' | 'vote' | 'reveal';

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

export default function BluffPlay() {
  const { rounds: r } = useLocalSearchParams<{ rounds: string }>();
  const totalRounds = Number(r) || 5;
  const players = usePlayers((s) => s.players);
  const session = useSession();
  const exit = useExitGuard();

  const [order] = useState(() => turnOrder(players));
  const [facts] = useState(() => shuffle(bluffFacts).slice(0, totalRounds));
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<Phase>('passWrite');
  const [seat, setSeat] = useState(0);
  const [fakes, setFakes] = useState<Record<string, string>>({});
  const [votes, setVotes] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [choice, setChoice] = useState<string | null>(null);

  useEffect(() => {
    session.start('bluff', order);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fact = facts[round];
  const player = order[seat];
  const byId = (id: string) => order.find((p) => p.id === id);

  const [options, setOptions] = useState<Option[]>([]);

  const buildOptions = (all: Record<string, string>) => {
    const list: Option[] = [{ id: 'real', text: fact.answer, by: [], real: true }];
    for (const [pid, text] of Object.entries(all)) {
      const same = list.find((o) => !o.real && norm(o.text) === norm(text));
      if (same) same.by.push(pid);
      else list.push({ id: uid(), text, by: [pid], real: false });
    }
    setOptions(shuffle(list));
  };

  const submitFake = () => {
    const text = draft.replace(/\s+/g, ' ').trim().slice(0, 40);
    if (!text) {
      setError('Write something believable first.');
      return;
    }
    if (norm(text) === norm(fact.answer)) {
      fx.wrong();
      setError('You found the real answer! Write a fake one instead.');
      return;
    }
    fx.tap();
    const all = { ...fakes, [player.id]: text };
    setFakes(all);
    setDraft('');
    setError(null);
    if (seat + 1 >= order.length) {
      buildOptions(all);
      setSeat(0);
      setPhase('passVote');
    } else {
      setSeat(seat + 1);
      setPhase('passWrite');
    }
  };

  const submitVote = () => {
    if (!choice) return;
    fx.tap();
    const nextVotes = { ...votes, [player.id]: choice };
    setVotes(nextVotes);
    setChoice(null);
    if (seat + 1 >= order.length) {
      const g: Record<string, number> = {};
      const add = (id: string, n: number) => (g[id] = (g[id] ?? 0) + n);
      for (const [voter, optId] of Object.entries(nextVotes)) {
        const opt = options.find((o) => o.id === optId);
        if (!opt) continue;
        if (opt.real) add(voter, 200);
        else opt.by.filter((b) => b !== voter).forEach((b) => add(b, 100));
      }
      Object.entries(g).forEach(([id, n]) => session.add(id, n));
      fx.reveal();
      setPhase('reveal');
    } else {
      setSeat(seat + 1);
      setPhase('passVote');
    }
  };

  const nextRound = () => {
    if (round + 1 >= facts.length) {
      router.replace('/results');
      return;
    }
    setRound(round + 1);
    setSeat(0);
    setFakes({});
    setVotes({});
    setPhase('passWrite');
  };

  if (!fact || !player) return null;

  const top = (
    <TopBar left={<IconButton icon="close" label="End game" onPress={exit} />} right={<Pill label={`BLUFF · ROUND ${round + 1} OF ${facts.length}`} />} />
  );

  if (phase === 'passWrite' || phase === 'passVote') {
    const voting = phase === 'passVote';
    return (
      <Screen bg={colors.deep} footer={<GameButton label={`I'M ${player.name.toUpperCase()}, SHOW ME`} onPress={() => setPhase(voting ? 'vote' : 'write')} />}>
        {top}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <Icon name="eyeClosed" color={colors.yellow} size={110} strokeWidth={1.6} />
          <Eyebrow>EYES OFF, EVERYONE ELSE</Eyebrow>
          <Display size={78} center>
            PASS TO
          </Display>
          <Display size={78} center color={player.color} numberOfLines={1} adjustsFontSizeToFit style={{ marginTop: -18 }}>
            {player.name.toUpperCase()}
          </Display>
          <Body center bold>
            {voting ? `${player.name} votes in secret. ${seat} of ${order.length} voted.` : `${player.name} writes a fake answer in secret. ${seat} of ${order.length} done.`}
          </Body>
        </View>
      </Screen>
    );
  }

  if (phase === 'write') {
    return (
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.stage }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Screen scroll footer={<GameButton label="LOCK IT IN" onPress={submitFake} disabled={!draft.trim()} />}>
          <Row>
            <Buzzer name={player.name} color={player.color} size={40} />
            <Body bold color={colors.white}>
              {player.name}, only you can see this
            </Body>
          </Row>
          <PromptCard eyebrow="FILL THE BLANK" text={fact.prompt.toUpperCase()} size={32} />
          <Label size={22}>YOUR FAKE ANSWER</Label>
          <TextInput
            value={draft}
            onChangeText={(t) => {
              setDraft(t);
              if (error) setError(null);
            }}
            placeholder="Make it sound real…"
            placeholderTextColor={colors.faint}
            maxLength={40}
            autoFocus
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={submitFake}
            accessibilityLabel="Your fake answer"
            style={{
              minHeight: 64,
              borderRadius: 14,
              borderWidth: 2.5,
              borderColor: colors.white,
              backgroundColor: colors.navy,
              paddingHorizontal: 16,
              color: colors.white,
              fontFamily: fonts.bodyBold,
              fontSize: 19,
            }}
          />
          {error ? (
            <Body bold color={colors.yellow} accessibilityLiveRegion="polite">
              {error}
            </Body>
          ) : (
            <Row style={{ backgroundColor: colors.navy, borderRadius: 14, padding: 14, alignItems: 'flex-start' }} gap={12}>
              <Icon name="bulb" color={colors.yellow} />
              <Body style={{ flex: 1 }}>You score 100 for every friend who picks your fake, and 200 if you spot the real answer.</Body>
            </Row>
          )}
        </Screen>
      </KeyboardAvoidingView>
    );
  }

  if (phase === 'vote') {
    const mine = options.filter((o) => !o.by.includes(player.id));
    return (
      <Screen scroll footer={<GameButton label="FINAL ANSWER" disabled={!choice} onPress={submitVote} />}>
        <Row>
          <Buzzer name={player.name} color={player.color} size={40} />
          <Body bold color={colors.white}>
            {player.name} is voting
          </Body>
        </Row>
        <Display size={52}>WHICH ONE IS REAL?</Display>
        <Body>{fact.prompt}</Body>
        <View style={{ gap: 10 }}>
          {mine.map((o) => {
            const on = o.id === choice;
            return (
              <Pressable
                key={o.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                accessibilityLabel={o.text}
                onPress={() => {
                  fx.select();
                  setChoice(o.id);
                }}
                style={{
                  minHeight: 64,
                  borderRadius: 14,
                  backgroundColor: on ? colors.pink : colors.navy,
                  borderBottomWidth: 5,
                  borderBottomColor: on ? colors.pinkShade : colors.deep,
                  paddingHorizontal: 18,
                  paddingVertical: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Label size={24} color={on ? colors.ink : colors.white} style={{ flex: 1 }}>
                  {o.text.toUpperCase()}
                </Label>
                {on ? (
                  <Body bold size={12} color={colors.ink}>
                    MY PICK
                  </Body>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </Screen>
    );
  }

  // reveal
  const realVoters = Object.entries(votes).filter(([, id]) => id === 'real').map(([v]) => byId(v)?.name).filter(Boolean);
  const fakesSorted = options.filter((o) => !o.real).sort((a, b) => Object.values(votes).filter((v) => v === b.id).length - Object.values(votes).filter((v) => v === a.id).length);
  return (
    <Screen scroll footer={<GameButton label={round + 1 >= facts.length ? 'SEE THE WINNER' : 'NEXT ROUND'} onPress={nextRound} />}>
      {top}
      <Eyebrow>{fact.prompt.replace('___', '…').toUpperCase()}</Eyebrow>
      <View style={{ backgroundColor: colors.yellow, borderRadius: 20, padding: 20, borderBottomWidth: 8, borderBottomColor: colors.yellowShade, transform: [{ rotate: '-1.5deg' }] }}>
        <Eyebrow color={colors.ink}>THE REAL ANSWER</Eyebrow>
        <Label size={52} color={colors.ink} numberOfLines={2} adjustsFontSizeToFit style={{ marginTop: 4 }}>
          {fact.answer.toUpperCase()}
        </Label>
        <Body bold color={colors.ink} style={{ marginTop: 4 }}>
          {realVoters.length ? `Spotted by ${realVoters.join(', ')} · +200 each` : 'Nobody spotted it. The bluffers win this round.'}
        </Body>
      </View>
      <Label size={26} style={{ marginTop: 6 }}>
        THE BEST LIARS
      </Label>
      <View style={{ gap: 8 }}>
        {fakesSorted.map((o) => {
          const fooled = Object.entries(votes).filter(([, id]) => id === o.id).map(([v]) => byId(v)?.name).filter(Boolean);
          const authors = o.by.map(byId).filter(Boolean);
          return (
            <Row key={o.id} gap={12} style={{ backgroundColor: colors.navy, borderRadius: 14, padding: 12, alignItems: 'center' }}>
              {authors[0] ? <Buzzer name={authors[0].name} color={authors[0].color} size={40} /> : null}
              <View style={{ flex: 1 }}>
                <Label size={21}>"{o.text.toUpperCase()}"</Label>
                <Body size={13}>
                  {authors.map((a) => a!.name).join(' & ')} · {fooled.length ? `fooled ${fooled.join(', ')}` : 'fooled nobody'}
                </Body>
              </View>
              <Label size={22} color={fooled.length ? colors.mint : colors.faint}>
                +{fooled.length * 100}
              </Label>
            </Row>
          );
        })}
      </View>
    </Screen>
  );
}
