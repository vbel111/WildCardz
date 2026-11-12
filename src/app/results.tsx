import { useEffect } from 'react';
import { Share, View } from 'react-native';
import { router } from 'expo-router';
import { colors, gameMeta } from '@/theme';
import { Body, Buzzer, Display, Eyebrow, GameButton, Label, OutlineButton, Row, Screen } from '@/components/ui';
import { Marquee } from '@/components/Marquee';
import { ranked, useSession } from '@/stores/session';
import { fx } from '@/services/feedback';
import { onGameFinished } from '@/services/review';

const unit = (game: string | null) => (game === 'nhie' ? 'CONFESSIONS' : game === 'tod' || game === 'charades' ? 'POINTS' : 'POINTS');

export default function Results() {
  const { game, scorers, scores } = useSession();
  const rows = ranked(scorers, scores);
  const top = rows[0];
  const tie = rows.length > 1 && rows[1].points === top?.points;
  const meta = game ? gameMeta[game] : null;

  useEffect(() => {
    fx.win();
    onGameFinished();
  }, []);

  const share = () => {
    const lines = rows.map((r, i) => `${i + 1}. ${r.name} – ${r.points}`).join('\n');
    Share.share({
      message: `${meta?.name ?? 'Wildcardz'} results 🏆\n${lines}\n\nPlayed on Wildcardz, the party game show.`,
    }).catch(() => {});
  };

  const podium = [rows[1], rows[0], rows[2]].filter(Boolean);
  const heights = [110, 150, 84];
  const podiumColors = [colors.orange, colors.mint, colors.yellow];

  return (
    <Screen
      scroll
      footer={
        <>
          <GameButton label="RUN IT BACK" onPress={() => router.back()} />
          <Row gap={10}>
            <OutlineButton label="Share results" icon="share" onPress={share} style={{ flex: 1 }} />
            <OutlineButton label="Back to lineup" onPress={() => router.replace('/home')} style={{ flex: 1 }} />
          </Row>
        </>
      }
    >
      <Marquee palette={[colors.yellow, colors.white, colors.pink]} style={{ height: 270, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}>
        <Eyebrow color={colors.yellow}>{tie ? "IT'S A TIE BETWEEN…" : game === 'nhie' ? 'THE WILDEST ONE IS…' : 'AND THE WINNER IS…'}</Eyebrow>
        <Display size={top && top.name.length > 7 ? 72 : 104} center numberOfLines={1} adjustsFontSizeToFit style={{ marginTop: 8 }}>
          {tie ? rows.filter((r) => r.points === top.points).map((r) => r.name.toUpperCase()).join(' & ') : (top?.name ?? '—').toUpperCase()}
        </Display>
        <Label size={24} color={colors.mint} style={{ marginTop: 6 }}>
          {top?.points ?? 0} {unit(game)}
        </Label>
      </Marquee>

      {podium.length >= 2 ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 10 }} accessible accessibilityLabel={`Podium: ${rows.slice(0, 3).map((r, i) => `${i + 1}. ${r.name} with ${r.points}`).join(', ')}`}>
          {podium.map((r, i) => {
            const place = r === rows[0] ? 0 : r === rows[1] ? 1 : 2;
            const slot = [1, 0, 2][place];
            return (
              <View key={r.id} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                <Label size={18} numberOfLines={1}>
                  {r.name.toUpperCase()}
                </Label>
                <View
                  style={{
                    width: '100%',
                    height: heights[slot],
                    borderTopLeftRadius: 12,
                    borderTopRightRadius: 12,
                    backgroundColor: podiumColors[slot],
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Label size={place === 0 ? 50 : 38} color={colors.ink}>
                    {place + 1}
                  </Label>
                  <Body bold size={13} color={colors.ink}>
                    {r.points}
                  </Body>
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      {rows.length > 3 ? (
        <View style={{ gap: 8 }}>
          {rows.slice(3).map((r, i) => (
            <Row key={r.id} style={{ backgroundColor: colors.navy, borderRadius: 14, minHeight: 56, paddingHorizontal: 12 }} gap={12}>
              <Label size={22} color={colors.yellow} style={{ width: 26 }}>
                {i + 4}
              </Label>
              <Buzzer name={r.name} color={r.color} size={38} />
              <Label size={20} style={{ flex: 1 }}>
                {r.name.toUpperCase()}
              </Label>
              <Label size={22}>{r.points}</Label>
            </Row>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}
