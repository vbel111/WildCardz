import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/theme';
import { BackButton, Body, Display, Eyebrow, GameButton, IconButton, Label, Screen, Segmented, Tag, TopBar } from '@/components/ui';
import { GameTutorial, useGameTutorial } from '@/components/tutorial/GameTutorial';
import { Icon } from '@/components/Icon';
import { NeedPlayers, useDeckAccess } from '@/components/game';
import { triviaCategories } from '@/data/trivia';
import { MIN_PLAYERS, usePlayers } from '@/stores/players';
import { questionCount } from '@/services/trivia';
import { fx } from '@/services/feedback';

export default function TriviaSetup() {
  const tutorial = useGameTutorial('trivia');
  const { canUse } = useDeckAccess();
  const enough = usePlayers((s) => s.players.length >= MIN_PLAYERS);
  const [cats, setCats] = useState<string[]>(() => triviaCategories.filter((c) => c.access === 'free').map((c) => c.id));
  const [count, setCount] = useState(10);
  const [mode, setMode] = useState<'turns' | 'buzz'>('turns');

  const available = questionCount(cats);
  const toggle = (id: string) => setCats((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  return (
    <Screen
      scroll
      footer={
        <GameButton
          label="LET'S PLAY"
          disabled={!enough || cats.length === 0}
          onPress={() => router.push({ pathname: '/trivia/play', params: { cats: cats.join(','), count: String(Math.min(count, available)), mode } })}
        />
      }
    >
      <TopBar left={<BackButton />} right={<IconButton icon="help" label="How to play" onPress={tutorial.show} />} />
      <GameTutorial game="trivia" visible={tutorial.open} onClose={tutorial.close} />
      <Tag label="04 · TRIVIA" color={colors.orange} />
      <Display size={52}>SET UP THE QUIZ</Display>
      {!enough ? <NeedPlayers /> : null}

      <Eyebrow>CATEGORIES · {cats.length} PICKED</Eyebrow>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {triviaCategories.map((c) => {
          const open = canUse(c);
          const on = cats.includes(c.id);
          return (
            <Pressable
              key={c.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on, disabled: !open }}
              accessibilityLabel={`${c.name}${open ? '' : ', VIP only'}`}
              onPress={() => {
                if (!open) {
                  fx.tap();
                  router.push('/paywall');
                  return;
                }
                fx.select();
                toggle(c.id);
              }}
              style={{
                height: 44,
                paddingHorizontal: 14,
                borderRadius: 10,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: on ? colors.orange : 'transparent',
                borderWidth: 2,
                borderColor: on ? colors.orange : colors.faint,
              }}
            >
              {!open ? <Icon name="lock" size={14} color={colors.muted} /> : null}
              <Body bold size={15} color={on ? colors.ink : open ? colors.white : colors.muted}>
                {c.name}
              </Body>
            </Pressable>
          );
        })}
      </View>

      <Eyebrow style={{ marginTop: 8 }}>QUESTIONS</Eyebrow>
      <Segmented label="Number of questions" value={count} onChange={setCount} options={[10, 15, 20].map((n) => ({ value: n, label: String(n) }))} />
      {available < count ? (
        <Body size={13} color={colors.yellow}>
          Only {available} questions in these categories. Add more to play {count}.
        </Body>
      ) : null}

      <Eyebrow style={{ marginTop: 8 }}>HOW WE ANSWER</Eyebrow>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {(
          [
            ['turns', 'TAKE TURNS', 'Pass the phone, one question each'],
            ['buzz', 'BUZZ IN', 'Everyone races. Tap who shouted first'],
          ] as const
        ).map(([id, name, desc]) => {
          const on = mode === id;
          return (
            <Pressable
              key={id}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${name}. ${desc}`}
              onPress={() => {
                fx.select();
                setMode(id);
              }}
              style={{ flex: 1, minHeight: 90, borderRadius: 14, padding: 12, backgroundColor: on ? colors.white : colors.navy, gap: 4 }}
            >
              <Label size={22} color={on ? colors.ink : colors.white}>
                {name}
              </Label>
              <Body size={13} bold color={on ? colors.ink : colors.mist}>
                {desc}
              </Body>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
