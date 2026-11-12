import { type ComponentRef, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { colors, fonts } from '@/theme';
import { BackButton, Body, Display, GameButton, Label, Panel, Screen, TopBar } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { onlineAvailable, useRoom } from '@/services/online';
import { useSettings } from '@/stores/settings';
import { usePlayers, cleanName, MAX_NAME } from '@/stores/players';
import { fx } from '@/services/feedback';

const CODE_LETTERS = /[^A-HJ-NP-Z]/g;

export default function Online() {
  const savedName = useSettings((s) => s.onlineName);
  const setSavedName = useSettings((s) => s.setOnlineName);
  const firstPlayer = usePlayers((s) => s.players[0]?.name ?? '');
  const room = useRoom();
  const [name, setName] = useState(savedName || firstPlayer);
  const [code, setCode] = useState('');
  const [waiting, setWaiting] = useState<'host' | 'join' | null>(null);
  const codeInput = useRef<ComponentRef<typeof TextInput>>(null);

  useEffect(() => {
    if (waiting && room.status === 'lobby') {
      setWaiting(null);
      router.push('/online/lobby');
    }
    if (waiting && room.status === 'error') setWaiting(null);
  }, [room.status, waiting]);

  const nameOk = cleanName(name).length > 0;

  const host = () => {
    const n = cleanName(name);
    setSavedName(n);
    setWaiting('host');
    room.host(n);
  };

  const join = () => {
    const n = cleanName(name);
    setSavedName(n);
    setWaiting('join');
    room.join(code, n);
  };

  if (!onlineAvailable) {
    return (
      <Screen>
        <TopBar left={<BackButton />} />
        <Display size={56}>GO LIVE</Display>
        <Panel style={{ gap: 10 }}>
          <Label size={24}>ONLINE ROOMS ARE COMING</Label>
          <Body>Online play isn't switched on in this version yet. Pass-and-play works for every game right now.</Body>
        </Panel>
      </Screen>
    );
  }

  return (
    <Screen scroll footer={<GameButton label={waiting === 'join' ? 'CONNECTING…' : 'JOIN THE ROOM'} disabled={!nameOk || code.length !== 4 || !!waiting} onPress={join} />}>
      <TopBar left={<BackButton onPress={() => { room.leave(); router.back(); }} />} />
      <Display size={56}>GO LIVE</Display>
      <Body bold>Everyone plays on their own phone. Best for Bluff and Trivia.</Body>

      <Label size={20} style={{ marginTop: 4 }}>YOUR STAGE NAME</Label>
      <TextInput
        value={name}
        onChangeText={setName}
        maxLength={MAX_NAME}
        placeholder="Your name"
        placeholderTextColor={colors.faint}
        autoCapitalize="words"
        autoCorrect={false}
        accessibilityLabel="Your stage name"
        style={{ height: 56, borderRadius: 12, backgroundColor: colors.deep, paddingHorizontal: 16, color: colors.white, fontFamily: fonts.bodyBold, fontSize: 17 }}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Host the show. Get a code, friends join in seconds"
        disabled={!nameOk || !!waiting}
        onPress={() => {
          fx.tap();
          host();
        }}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          minHeight: 112,
          borderRadius: 18,
          backgroundColor: colors.pink,
          paddingHorizontal: 18,
          borderBottomWidth: pressed ? 2 : 6,
          borderBottomColor: colors.pinkShade,
          transform: [{ rotate: '-1deg' }],
          opacity: nameOk ? 1 : 0.5,
        })}
      >
        {waiting === 'host' ? <ActivityIndicator color={colors.ink} size="large" /> : <Icon name="mic" color={colors.ink} size={48} strokeWidth={2} />}
        <View style={{ flex: 1 }}>
          <Label size={32} color={colors.ink}>
            HOST THE SHOW
          </Label>
          <Body bold size={14} color={colors.ink}>
            Get a code, friends join in seconds.
          </Body>
        </View>
      </Pressable>

      <Panel style={{ gap: 12 }}>
        <Label size={22}>JOIN WITH A CODE</Label>
        <Pressable onPress={() => codeInput.current?.focus()} accessibilityLabel={`Room code ${code.split('').join(' ')}`} style={{ flexDirection: 'row', gap: 8 }}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: 84,
                borderRadius: 10,
                backgroundColor: colors.deep,
                borderWidth: 2.5,
                borderColor: i === code.length ? colors.yellow : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Label size={50} color={colors.yellow}>
                {code[i] ?? ''}
              </Label>
            </View>
          ))}
        </Pressable>
        <TextInput
          ref={codeInput}
          value={code}
          onChangeText={(t) => setCode(t.toUpperCase().replace(CODE_LETTERS, '').slice(0, 4))}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={4}
          accessibilityLabel="Room code"
          style={{ position: 'absolute', opacity: 0, height: 1, width: 1 }}
        />
        {room.error ? (
          <Body bold color={colors.yellow} accessibilityLiveRegion="polite">
            {room.error}
          </Body>
        ) : null}
      </Panel>
    </Screen>
  );
}
