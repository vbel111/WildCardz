import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/theme';
import { BackButton, Badge, Body, Display, Eyebrow, GameButton, IconButton, Label, Screen, Segmented, Tag, TopBar } from '@/components/ui';
import { GameTutorial, useGameTutorial } from '@/components/tutorial/GameTutorial';
import { Icon } from '@/components/Icon';
import { NeedPlayers, useDeckAccess } from '@/components/game';
import { charadesDecks } from '@/data/charades';
import { MIN_PLAYERS, usePlayers } from '@/stores/players';
import { fx } from '@/services/feedback';

export default function CharadesSetup() {
  const tutorial = useGameTutorial('charades');
  const { isVip, canUse } = useDeckAccess();
  const enough = usePlayers((s) => s.players.length >= MIN_PLAYERS);
  const [deckId, setDeckId] = useState(charadesDecks[0].id);
  const [seconds, setSeconds] = useState(60);
  const [rounds, setRounds] = useState(1);

  return (
    <Screen
      scroll
      footer={
        <GameButton
          label="LIGHTS, CAMERA, ACT"
          disabled={!enough}
          onPress={() => router.push({ pathname: '/charades/play', params: { deck: deckId, seconds: String(seconds), rounds: String(rounds) } })}
        />
      }
    >
      <TopBar left={<BackButton />} right={<IconButton icon="help" label="How to play" onPress={tutorial.show} />} />
      <GameTutorial game="charades" visible={tutorial.open} onClose={tutorial.close} />
      <Tag label="03 · CHARADES" color={colors.mint} />
      <Display size={52}>PICK A CATEGORY</Display>
      {!enough ? <NeedPlayers /> : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {charadesDecks.map((d) => {
          const open = canUse(d);
          const on = d.id === deckId;
          return (
            <Pressable
              key={d.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: on, disabled: !open }}
              accessibilityLabel={`${d.name}, ${d.words.length} words${open ? '' : ', VIP only'}`}
              onPress={() => {
                if (!open) {
                  fx.tap();
                  router.push('/paywall');
                  return;
                }
                fx.select();
                setDeckId(d.id);
              }}
              style={{
                width: '48.5%',
                height: 108,
                borderRadius: 16,
                backgroundColor: d.color,
                padding: 12,
                justifyContent: 'space-between',
                borderWidth: 3,
                borderColor: on ? colors.ink : 'transparent',
                opacity: open ? 1 : 0.75,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Badge label={d.access === 'vip' ? 'VIP' : 'FREE'} bg={colors.ink} color={colors.white} />
                {!open ? <Icon name="lock" color={colors.ink} size={18} /> : on ? <Icon name="check" color={colors.ink} size={20} strokeWidth={3.4} /> : null}
              </View>
              <Label size={22} color={colors.ink} numberOfLines={2}>
                {d.name}
              </Label>
            </Pressable>
          );
        })}
      </View>

      <Eyebrow style={{ marginTop: 6 }}>ROUND TIME</Eyebrow>
      <Segmented label="Round time" value={seconds} onChange={setSeconds} options={[30, 60, 90].map((s) => ({ value: s, label: `${s} SEC` }))} />
      <Eyebrow style={{ marginTop: 6 }}>TURNS EACH</Eyebrow>
      <Segmented label="Turns each" value={rounds} onChange={setRounds} options={[1, 2, 3].map((s) => ({ value: s, label: String(s) }))} />
      <Body size={13} color={colors.muted}>
        {isVip ? 'All categories unlocked.' : 'VIP unlocks Music Stars, Football and Famous Places.'}
      </Body>
    </Screen>
  );
}
