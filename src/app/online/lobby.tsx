import { useEffect, useState } from 'react';
import { Alert, Pressable, Share, View } from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/theme';
import { Body, Buzzer, Eyebrow, GameButton, IconButton, Label, OutlineButton, Row, Screen, Segmented, TopBar } from '@/components/ui';
import { Marquee } from '@/components/Marquee';
import { ConnectionBanner } from '@/components/ConnectionBanner';
import { MAX_ONLINE, useRoom } from '@/services/online';
import { triviaCategories } from '@/data/trivia';
import { canUse } from '@/data/types';
import { usePurchases } from '@/services/purchases';
import { fx } from '@/services/feedback';

export default function Lobby() {
  const room = useRoom();
  const isVip = usePurchases((s) => s.isVip);
  const [kind, setKind] = useState<'bluff' | 'trivia'>('bluff');
  const [rounds, setRounds] = useState(5);

  const isHost = !!room.me?.host;

  useEffect(() => {
    if (room.status === 'playing') router.replace('/online/play');
    if (room.status === 'ended' || room.status === 'error') {
      if (room.notice || room.error) Alert.alert('Room closed', room.notice ?? room.error ?? '');
      router.replace('/online');
    }
  }, [room.status, room.notice, room.error]);

  const leave = () =>
    Alert.alert(isHost ? 'Close the room?' : 'Leave the room?', isHost ? 'Everyone will be sent back.' : undefined, [
      { text: 'Stay', style: 'cancel' },
      {
        text: isHost ? 'Close room' : 'Leave',
        style: 'destructive',
        onPress: async () => {
          await room.leave();
          router.replace('/home');
        },
      },
    ]);

  const start = () => {
    if (room.players.length < 2) {
      Alert.alert('Waiting for players', 'Get at least one friend to join with the room code.');
      return;
    }
    if (kind === 'bluff' && room.players.length < 3) {
      Alert.alert('Bluff needs 3 players', 'Invite one more friend, or play Trivia.');
      return;
    }
    fx.buzz();
    if (kind === 'trivia') {
      const cats = triviaCategories.filter((c) => canUse(c, isVip, true)).map((c) => c.id);
      room.start({ kind: 'trivia', categories: cats, rounds: rounds * 2, seconds: 20 });
    } else {
      room.start({ kind: 'bluff', rounds });
    }
  };

  const share = () =>
    Share.share({ message: `Join my Wildcardz room! Open the app, tap Go Live Online and enter code ${room.code}` }).catch(() => {});

  return (
    <Screen
      scroll
      footer={
        isHost ? (
          <GameButton label="ROLL THE SHOW" onPress={start} />
        ) : (
          <View style={{ height: 64, borderRadius: 14, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' }}>
            <Body bold color={colors.white}>
              Waiting for the host to start…
            </Body>
          </View>
        )
      }
    >
      <TopBar
        left={<IconButton icon="close" label={isHost ? 'Close room' : 'Leave room'} onPress={leave} />}
        right={
          <Row style={{ backgroundColor: colors.pink, borderRadius: 10, paddingHorizontal: 12, height: 36 }} gap={8}>
            <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: colors.ink }} />
            <Label size={17} color={colors.ink}>
              ON AIR
            </Label>
          </Row>
        }
      />

      <ConnectionBanner />

      <Marquee bulb={10} step={24} style={{ paddingTop: 30, paddingBottom: 22, paddingHorizontal: 26, alignItems: 'center', gap: 4 }}>
        <Eyebrow>ROOM CODE</Eyebrow>
        <Label size={84} color={colors.yellow} style={{ letterSpacing: 12, lineHeight: 92 }} accessibilityLabel={`Room code ${room.code.split('').join(' ')}`}>
          {room.code}
        </Label>
        <Row gap={8} style={{ alignSelf: 'stretch', marginTop: 6 }}>
          <Pressable accessibilityRole="button" onPress={share} style={{ flex: 1, height: 46, borderRadius: 10, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' }}>
            <Body bold color={colors.ink}>
              Share invite
            </Body>
          </Pressable>
        </Row>
      </Marquee>

      <Row style={{ justifyContent: 'space-between', marginTop: 4 }}>
        <Label size={28}>CONTESTANTS</Label>
        <Body bold color={colors.muted}>
          {room.players.length} of {MAX_ONLINE}
        </Body>
      </Row>
      <View style={{ gap: 8 }}>
        {room.players.map((p, i) => (
          <Row key={p.id} gap={12} style={{ minHeight: 58, borderRadius: 14, backgroundColor: colors.navy, paddingHorizontal: 10 }}>
            <Buzzer name={p.name} color={p.color} size={42} />
            <Label size={22} style={{ flex: 1 }} numberOfLines={1}>
              {p.name.toUpperCase()}
              {p.id === room.me?.id ? ' (YOU)' : ''}
            </Label>
            <Body bold size={13} color={p.host ? colors.yellow : colors.mint}>
              {p.host ? 'HOST' : 'READY'}
            </Body>
          </Row>
        ))}
      </View>

      {isHost ? (
        <View style={{ gap: 10, marginTop: 6 }}>
          <Eyebrow>THIS SHOW</Eyebrow>
          <Segmented
            label="Game"
            value={kind}
            onChange={setKind}
            options={[
              { value: 'bluff', label: 'BLUFF' },
              { value: 'trivia', label: 'TRIVIA' },
            ]}
          />
          <Segmented
            label="Length"
            value={rounds}
            onChange={setRounds}
            options={[
              { value: 3, label: 'SHORT' },
              { value: 5, label: 'NORMAL' },
              { value: 8, label: 'LONG' },
            ]}
          />
          <Body size={13} color={colors.muted}>
            {kind === 'trivia'
              ? `${rounds * 2} questions. Everyone answers at once, faster answers score more.`
              : `${rounds} rounds. Everyone writes a fake, then votes for the truth.`}
          </Body>
        </View>
      ) : (
        <OutlineButton label="Leave room" onPress={leave} />
      )}
    </Screen>
  );
}
