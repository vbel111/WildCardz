import { Pressable, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { colors, gameMeta, type GameId } from '@/theme';
import { Body, Display, IconButton, Label, Row, Screen } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { usePlayers } from '@/stores/players';
import { usePurchases } from '@/services/purchases';
import { fx } from '@/services/feedback';

const lineup: { id: GameId; desc: string; href: Href; tilt: number }[] = [
  { id: 'tod', desc: 'Pick one. No chickening out.', href: '/tod', tilt: -1 },
  { id: 'nhie', desc: 'Find out who has done what.', href: '/nhie', tilt: 1 },
  { id: 'charades', desc: 'Phone on your forehead. Go.', href: '/charades', tilt: -1 },
  { id: 'trivia', desc: 'Buzz in. Prove it.', href: '/trivia', tilt: 1 },
  { id: 'bluff', desc: 'Write fakes. Fool your friends.', href: '/bluff', tilt: -1 },
];

export default function Home() {
  const players = usePlayers((s) => s.players);
  const isVip = usePurchases((s) => s.isVip);

  return (
    <Screen scroll>
      <Row style={{ justifyContent: 'space-between' }}>
        <Label size={28}>WILDCARDZ</Label>
        <Row gap={8}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isVip ? 'VIP pass active' : 'Get the VIP pass'}
            onPress={() => {
              fx.tap();
              router.push('/paywall');
            }}
            style={{ height: 44, paddingHorizontal: 14, borderRadius: 12, backgroundColor: isVip ? colors.mint : colors.pink, justifyContent: 'center' }}
          >
            <Label size={18} color={colors.ink}>
              {isVip ? 'VIP ✓' : 'GO VIP'}
            </Label>
          </Pressable>
          <IconButton icon="sliders" label="Settings" onPress={() => router.push('/settings')} />
        </Row>
      </Row>

      <Display size={54} style={{ marginTop: 6 }}>
        TONIGHT'S LINEUP
      </Display>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${players.length} contestants. Edit players`}
        onPress={() => router.push('/players')}
        style={{ minHeight: 56, borderRadius: 14, backgroundColor: colors.navy, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 14, paddingRight: 8 }}
      >
        <Row>
          <Row gap={4}>
            {(players.length ? players.slice(0, 6) : [{ id: 'x', color: colors.navySoft }]).map((p) => (
              <View key={p.id} style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: p.color }} />
            ))}
          </Row>
          <Body bold color={colors.white}>
            {players.length ? `${players.length} contestants` : 'Add contestants'}
          </Body>
        </Row>
        <View style={{ height: 40, paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#2C39F0', justifyContent: 'center' }}>
          <Body bold color={colors.white} size={14}>
            Edit
          </Body>
        </View>
      </Pressable>

      {lineup.map((g) => {
        const meta = gameMeta[g.id];
        return (
          <Pressable
            key={g.id}
            accessibilityRole="button"
            accessibilityLabel={`${meta.name}. ${g.desc}`}
            onPress={() => {
              fx.tap();
              router.push(g.href);
            }}
            style={({ pressed }) => ({
              minHeight: 104,
              borderRadius: 18,
              backgroundColor: meta.color,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              paddingLeft: 16,
              paddingRight: 18,
              paddingVertical: 12,
              borderBottomWidth: pressed ? 2 : 6,
              borderBottomColor: meta.shade,
              transform: [{ rotate: `${g.tilt}deg` }, { translateY: pressed ? 4 : 0 }],
            })}
          >
            <Label size={58} color={colors.ink} style={{ width: 66, letterSpacing: 0 }}>
              {meta.no}
            </Label>
            <View style={{ flex: 1 }}>
              <Label size={27} color={colors.ink} numberOfLines={1} adjustsFontSizeToFit>
                {meta.name}
              </Label>
              <Body bold size={14} color={colors.ink}>
                {g.desc}
              </Body>
            </View>
            <Icon name="play" color={colors.ink} />
          </Pressable>
        );
      })}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Play online, everyone on their own phone"
        onPress={() => {
          fx.tap();
          router.push('/online');
        }}
        style={({ pressed }) => ({
          marginTop: 4,
          minHeight: 70,
          borderRadius: 18,
          borderWidth: 2.5,
          borderStyle: 'dashed',
          borderColor: colors.faint,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 12,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Icon name="wifi" color={colors.yellow} size={26} />
        <Label size={24}>GO LIVE ONLINE</Label>
      </Pressable>
    </Screen>
  );
}
