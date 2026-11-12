import { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '@/theme';
import { Body, Buzzer, Display, Eyebrow, GameButton, IconButton, Label, OutlineButton, Pill, Row, Screen, TopBar } from '@/components/ui';
import { TimerRing } from '@/components/TimerRing';
import { turnOrder, useExitGuard } from '@/components/game';
import { todDecks } from '@/data/tod';
import { usePlayers } from '@/stores/players';
import { useCustomDeck } from '@/stores/customDeck';
import { useSession } from '@/stores/session';
import { useSettings } from '@/stores/settings';
import { useCountdown } from '@/hooks/useCountdown';
import { fillPrompt, pick, shuffle } from '@/utils/random';
import { fx } from '@/services/feedback';

type Kind = 'truth' | 'dare';

/** Draws cards without repeats until a pile runs out, then reshuffles. */
function makePile(cards: string[]) {
  let pile = shuffle(cards);
  return () => {
    if (!pile.length) pile = shuffle(cards);
    return pile.pop() ?? '';
  };
}

export default function TodPlay() {
  const { deck: deckId } = useLocalSearchParams<{ deck: string }>();
  const players = usePlayers((s) => s.players);
  const custom = useCustomDeck();
  const turnTimer = useSettings((s) => s.turnTimer);
  const session = useSession();
  const exit = useExitGuard();

  const deck = useMemo(() => {
    if (deckId === 'custom') {
      const chosen = custom.cards.filter((c) => custom.selected.includes(c.id));
      return {
        name: 'YOUR DECK',
        truths: chosen.filter((c) => c.kind === 'truth').map((c) => c.text),
        dares: chosen.filter((c) => c.kind === 'dare').map((c) => c.text),
      };
    }
    const d = todDecks.find((x) => x.id === deckId) ?? todDecks[0];
    return { name: d.name, truths: d.truths, dares: d.dares };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId]);

  const [order] = useState(() => turnOrder(players));
  useEffect(() => {
    session.start('tod', order);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const piles = useRef({ truth: makePile(deck.truths), dare: makePile(deck.dares) });
  const [turn, setTurn] = useState(0);
  const [card, setCard] = useState<{ kind: Kind; text: string } | null>(null);
  const [timing, setTiming] = useState(false);

  const player = order[turn % order.length];
  const others = order.filter((p) => p.id !== player?.id);

  const { left, reset } = useCountdown(turnTimer, timing && turnTimer > 0, () => {
    fx.buzz();
    setTiming(false);
  }, (l) => l <= 5 && fx.tick());

  const draw = (kind: Kind) => {
    const text = piles.current[kind]();
    setCard({ kind, text: fillPrompt(text, player?.name, others.length ? pick(others).name : undefined) });
    fx.reveal();
    reset(turnTimer);
    setTiming(true);
  };

  const finishTurn = (done: boolean) => {
    if (done && player) {
      session.add(player.id, 1);
      fx.correct();
    } else fx.wrong();
    setTiming(false);
    setCard(null);
    setTurn((t) => t + 1);
  };

  if (!player) {
    return (
      <Screen footer={<GameButton label="ADD PLAYERS" onPress={() => router.replace('/players')} />}>
        <Display>NO CONTESTANTS YET</Display>
      </Screen>
    );
  }

  const header = (
    <TopBar
      left={<IconButton icon="close" label="End game" onPress={exit} />}
      right={<Pill label={`${deck.name} · TURN ${turn + 1}`} />}
    />
  );

  if (!card) {
    return (
      <Screen
        footer={
          <>
            <Row gap={12}>
              <View style={{ flex: 1 }}>
                <GameButton label="TRUTH" color={colors.white} shade={colors.lilac} height={130} size={44} onPress={() => draw('truth')} />
              </View>
              <View style={{ flex: 1 }}>
                <GameButton label="DARE" color={colors.pink} shade={colors.pinkShade} height={130} size={44} onPress={() => draw('dare')} />
              </View>
            </Row>
            <OutlineButton label="Spin for me" icon="spin" onPress={() => draw(Math.random() < 0.5 ? 'truth' : 'dare')} />
            <Body center bold color={colors.white} style={{ textDecorationLine: 'underline', padding: 4 }} onPress={() => router.replace('/results')} accessibilityRole="button">
              End game and see scores
            </Body>
          </>
        }
      >
        {header}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              width: 0,
              height: 0,
              borderLeftWidth: 150,
              borderRightWidth: 150,
              borderBottomWidth: 300,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: 'rgba(255,225,77,0.14)',
            }}
          />
          <Buzzer name={player.name} color={player.color} size={160} />
          <Eyebrow color={colors.yellow}>IN THE SPOTLIGHT</Eyebrow>
          <Display size={60} center numberOfLines={1} adjustsFontSizeToFit>
            {player.name.toUpperCase()}
          </Display>
        </View>
      </Screen>
    );
  }

  const isDare = card.kind === 'dare';
  return (
    <Screen
      bg={isDare ? colors.pink : colors.white}
      light
      footer={
        <>
          <GameButton
            label="DONE IT · +1 POINT"
            color={colors.yellow}
            onPress={() => finishTurn(true)}
          />
          <OutlineButton label={isDare ? 'Chicken out (no points)' : 'Skip it (no points)'} color={colors.ink} onPress={() => finishTurn(false)} />
        </>
      }
    >
      <TopBar
        left={<IconButton icon="close" label="End game" onPress={exit} />}
        right={turnTimer > 0 ? <TimerRing left={left} total={turnTimer} color={colors.ink} /> : null}
      />
      <Row>
        <Buzzer name={player.name} color={colors.ink} size={40} />
        <Body bold color={colors.ink} size={16}>
          {player.name} picked
        </Body>
      </Row>
      <Label size={120} color={colors.ink} style={{ lineHeight: 112 }}>
        {isDare ? 'DARE' : 'TRUTH'}
      </Label>
      <View style={{ backgroundColor: colors.ink, borderRadius: 20, padding: 24, transform: [{ rotate: '-1.5deg' }] }}>
        <Label size={card.text.length > 90 ? 28 : 34} style={{ lineHeight: card.text.length > 90 ? 32 : 39, letterSpacing: 0.4 }}>
          {card.text.toUpperCase()}
        </Label>
      </View>
      {!isDare ? null : (
        <Body bold color={colors.ink} size={13}>
          Not comfortable? Skipping is always fine.
        </Body>
      )}
    </Screen>
  );
}

