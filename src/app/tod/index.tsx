import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/theme';
import { BackButton, Body, Display, IconButton, Label, Screen, Tag, TopBar } from '@/components/ui';
import { GameTutorial, useGameTutorial } from '@/components/tutorial/GameTutorial';
import { Icon } from '@/components/Icon';
import { DeckRow, NeedPlayers, useDeckAccess, visibleDecks } from '@/components/game';
import { todDecks } from '@/data/tod';
import { MIN_PLAYERS, usePlayers } from '@/stores/players';
import { useCustomDeck } from '@/stores/customDeck';
import { fx } from '@/services/feedback';

export default function TodDecks() {
  const tutorial = useGameTutorial('tod');
  const { isVip, adultOk, age } = useDeckAccess();
  const enough = usePlayers((s) => s.players.length >= MIN_PLAYERS);
  const customCount = useCustomDeck((s) => s.selected.length);

  return (
    <Screen scroll>
      <TopBar left={<BackButton />} right={<IconButton icon="help" label="How to play" onPress={tutorial.show} />} />
      <GameTutorial game="tod" visible={tutorial.open} onClose={tutorial.close} />
      <Tag label="01 · TRUTH OR DARE" color={colors.yellow} />
      <Display size={52}>CHOOSE TONIGHT'S DECK</Display>
      {!enough ? <NeedPlayers /> : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Build your own deck. ${customCount} cards picked`}
        onPress={() => {
          fx.tap();
          router.push('/tod/custom');
        }}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          minHeight: 84,
          borderRadius: 16,
          borderWidth: 2.5,
          borderStyle: 'dashed',
          borderColor: colors.yellow,
          padding: 14,
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: colors.yellow, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="plus" color={colors.ink} strokeWidth={3} />
        </View>
        <View style={{ flex: 1 }}>
          <Label size={24}>BUILD YOUR OWN</Label>
          <Body size={14}>{customCount ? `${customCount} cards picked` : 'Pick cards or write your own'}</Body>
        </View>
      </Pressable>

      {visibleDecks(todDecks, age).map((d) => (
        <DeckRow
          key={d.id}
          deck={d}
          count={d.truths.length + d.dares.length}
          isVip={isVip}
          adultOk={adultOk}
          onPress={() => (enough ? router.push({ pathname: '/tod/play', params: { deck: d.id } }) : router.push('/players'))}
        />
      ))}
    </Screen>
  );
}
