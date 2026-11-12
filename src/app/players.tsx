import { router } from 'expo-router';
import { colors } from '@/theme';
import { BackButton, Body, Display, GameButton, Panel, Row, Screen, Toggle, TopBar } from '@/components/ui';
import { PlayersEditor } from '@/components/PlayersEditor';
import { MIN_PLAYERS, usePlayers } from '@/stores/players';

export default function PlayersScreen() {
  const count = usePlayers((s) => s.players.length);
  const shuffleTurns = usePlayers((s) => s.shuffleTurns);
  const setShuffleTurns = usePlayers((s) => s.setShuffleTurns);
  return (
    <Screen
      scroll
      footer={
        <GameButton
          label={count >= MIN_PLAYERS ? `LOCK IN ${count} PLAYERS` : 'ADD AT LEAST 2'}
          disabled={count < MIN_PLAYERS}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
        />
      }
    >
      <TopBar left={<BackButton />} />
      <Display size={54}>MEET THE CONTESTANTS</Display>
      <PlayersEditor />
      <Panel>
        <Row style={{ justifyContent: 'space-between' }}>
          <Body bold color={colors.white} size={16} style={{ flex: 1 }}>
            Shuffle turn order each game
          </Body>
          <Toggle value={shuffleTurns} onChange={setShuffleTurns} label="Shuffle turn order each game" />
        </Row>
      </Panel>
    </Screen>
  );
}
