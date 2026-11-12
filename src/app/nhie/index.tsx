import { router } from 'expo-router';
import { colors } from '@/theme';
import { BackButton, Body, Display, IconButton, Screen, Tag, TopBar } from '@/components/ui';
import { GameTutorial, useGameTutorial } from '@/components/tutorial/GameTutorial';
import { DeckRow, NeedPlayers, useDeckAccess, visibleDecks } from '@/components/game';
import { nhieDecks } from '@/data/nhie';
import { MIN_PLAYERS, usePlayers } from '@/stores/players';

export default function NhieDecks() {
  const tutorial = useGameTutorial('nhie');
  const { isVip, adultOk, age } = useDeckAccess();
  const enough = usePlayers((s) => s.players.length >= MIN_PLAYERS);
  return (
    <Screen scroll>
      <TopBar left={<BackButton />} right={<IconButton icon="help" label="How to play" onPress={tutorial.show} />} />
      <GameTutorial game="nhie" visible={tutorial.open} onClose={tutorial.close} />
      <Tag label="02 · NEVER HAVE I EVER" color={colors.pink} />
      <Display size={52}>PICK YOUR CONFESSIONS</Display>
      <Body>Read the card out loud. Everyone who has done it taps their buzzer. Most confessions wins the crown for the wildest.</Body>
      {!enough ? <NeedPlayers /> : null}
      {visibleDecks(nhieDecks, age).map((d) => (
        <DeckRow
          key={d.id}
          deck={d}
          count={d.prompts.length}
          isVip={isVip}
          adultOk={adultOk}
          onPress={() => (enough ? router.push({ pathname: '/nhie/play', params: { deck: d.id } }) : router.push('/players'))}
        />
      ))}
    </Screen>
  );
}
