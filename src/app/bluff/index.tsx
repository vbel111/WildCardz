import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/theme';
import { BackButton, Body, Display, Eyebrow, GameButton, IconButton, Label, Screen, Segmented, Tag, TopBar } from '@/components/ui';
import { GameTutorial, useGameTutorial } from '@/components/tutorial/GameTutorial';
import { NeedPlayers } from '@/components/game';
import { usePlayers } from '@/stores/players';

const steps = [
  ['WRITE A FAKE', 'Everyone secretly writes a believable fake answer to a weird fact.'],
  ['SPOT THE TRUTH', 'All answers are mixed together. Vote for the one you think is real.'],
  ['SCORE BIG', '+200 for finding the truth. +100 for every friend who falls for your fake.'],
];

export default function BluffSetup() {
  const tutorial = useGameTutorial('bluff');
  const count = usePlayers((s) => s.players.length);
  const enough = count >= 3;
  const [rounds, setRounds] = useState(5);
  return (
    <Screen
      scroll
      footer={
        <GameButton label="START BLUFFING" disabled={!enough} onPress={() => router.push({ pathname: '/bluff/play', params: { rounds: String(rounds) } })} />
      }
    >
      <TopBar left={<BackButton />} right={<IconButton icon="help" label="How to play" onPress={tutorial.show} />} />
      <GameTutorial game="bluff" visible={tutorial.open} onClose={tutorial.close} />
      <Tag label="05 · BLUFF" color={colors.white} />
      <Display size={52}>FAKE IT. FOOL THEM.</Display>
      {!enough ? <NeedPlayers min={3} /> : null}
      <View style={{ gap: 10 }}>
        {steps.map(([t, d], i) => (
          <View key={t} style={{ flexDirection: 'row', gap: 14, backgroundColor: colors.navy, borderRadius: 14, padding: 14, alignItems: 'center' }}>
            <Label size={40} color={colors.yellow} style={{ width: 34 }}>
              {i + 1}
            </Label>
            <View style={{ flex: 1, gap: 2 }}>
              <Label size={20}>{t}</Label>
              <Body size={14}>{d}</Body>
            </View>
          </View>
        ))}
      </View>
      <Eyebrow style={{ marginTop: 8 }}>ROUNDS</Eyebrow>
      <Segmented label="Rounds" value={rounds} onChange={setRounds} options={[3, 5, 8].map((n) => ({ value: n, label: String(n) }))} />
      <Body size={13} color={colors.muted}>
        Needs 3 or more players. One phone gets passed round in secret. Want everyone on their own phone? Use Go Live Online.
      </Body>
    </Screen>
  );
}
