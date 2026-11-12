import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '@/theme';
import { Body, Buzzer, GameButton, IconButton, Label, Pill, PromptCard, Screen, Tag, TopBar } from '@/components/ui';
import { useExitGuard } from '@/components/game';
import { nhieDecks } from '@/data/nhie';
import { usePlayers } from '@/stores/players';
import { useSession } from '@/stores/session';
import { shuffle } from '@/utils/random';
import { fx } from '@/services/feedback';

export default function NhiePlay() {
  const { deck: deckId } = useLocalSearchParams<{ deck: string }>();
  const deck = nhieDecks.find((d) => d.id === deckId) ?? nhieDecks[0];
  const players = usePlayers((s) => s.players);
  const session = useSession();
  const exit = useExitGuard();

  const cards = useMemo(() => shuffle(deck.prompts), [deck]);
  const [index, setIndex] = useState(0);
  const [has, setHas] = useState<Record<string, boolean>>({});

  useEffect(() => {
    session.start('nhie', players);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const guilty = players.filter((p) => has[p.id]);
  const lastCard = index >= cards.length - 1;

  const next = () => {
    guilty.forEach((p) => session.add(p.id, 1));
    if (lastCard) {
      router.replace('/results');
      return;
    }
    fx.reveal();
    setHas({});
    setIndex((i) => i + 1);
  };

  return (
    <Screen
      scroll
      footer={
        <>
          <GameButton label={lastCard ? 'SEE WHO IS WILDEST' : 'NEXT CARD'} onPress={next} />
          <Body center bold color={colors.white} style={{ textDecorationLine: 'underline', padding: 4 }} onPress={() => router.replace('/results')} accessibilityRole="button">
            End game and see scores
          </Body>
        </>
      }
    >
      <TopBar left={<IconButton icon="close" label="End game" onPress={exit} />} right={<Pill label={`Card ${index + 1} of ${cards.length}`} />} />
      <Tag label={`02 · ${deck.name}`} color={colors.pink} />
      <PromptCard eyebrow="NEVER HAVE I EVER…" text={cards[index].toUpperCase()} size={cards[index].length > 60 ? 34 : 42} style={{ minHeight: 240, justifyContent: 'space-between' }} />

      <Label size={24} style={{ marginTop: 4 }}>
        WHO HAS? TAP YOUR BUZZER
      </Label>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'flex-start' }}>
        {players.map((p) => {
          const on = !!has[p.id];
          return (
            <Pressable
              key={p.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`${p.name} has done it`}
              onPress={() => {
                on ? fx.select() : fx.buzz();
                setHas((h) => ({ ...h, [p.id]: !on }));
              }}
              style={{ alignItems: 'center', gap: 6, width: 62 }}
            >
              <Buzzer name={p.name} color={on ? p.color : colors.navySoft} size={58} ring={on ? colors.white : undefined} />
              <Body bold size={12} color={colors.white} numberOfLines={1}>
                {p.name}
              </Body>
            </Pressable>
          );
        })}
      </View>
      <Body center bold color={colors.yellow} accessibilityLiveRegion="polite">
        {guilty.length === 0 ? 'Nobody? Really?' : `${guilty.length} guilty. +1 confession each.`}
      </Body>
    </Screen>
  );
}
