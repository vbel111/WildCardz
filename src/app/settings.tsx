import { type ReactNode, useState } from 'react';
import { Alert, Linking, Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { colors, fonts, gameMeta, type GameId } from '@/theme';
import { BackButton, Body, Display, Eyebrow, Screen, SettingRow, Toggle, TopBar } from '@/components/ui';
import { useSettings } from '@/stores/settings';
import { GameTutorial } from '@/components/tutorial/GameTutorial';
import { Icon } from '@/components/Icon';
import { manageSubscriptionUrl, redeemCode, restore, usePurchases } from '@/services/purchases';
import { fx } from '@/services/feedback';
import { appVersion, emailSupport, openUrl, PRIVACY_URL, rateApp, TERMS_URL } from '@/services/links';

const timers = [0, 15, 30, 45, 60];

const howTo: { id: GameId; blurb: string }[] = [
  { id: 'tod', blurb: 'Pick, perform, score' },
  { id: 'nhie', blurb: 'Read, confess, buzz in' },
  { id: 'charades', blurb: 'Forehead, tilt, guess' },
  { id: 'trivia', blurb: 'Speed, streaks, buzzers' },
  { id: 'bluff', blurb: 'Write fakes, spot the truth' },
];

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Eyebrow>{title}</Eyebrow>
      <View style={{ borderRadius: 16, backgroundColor: colors.navy, overflow: 'hidden' }}>{children}</View>
    </View>
  );
}

export default function Settings() {
  const s = useSettings();
  const isVip = usePurchases((p) => p.isVip);
  const adult = s.age === 'adult';

  const cycleTimer = () => {
    const i = timers.indexOf(s.turnTimer);
    s.setTurnTimer(timers[(i + 1) % timers.length]);
  };

  const changeAge = () =>
    Alert.alert('Age setting', 'Adult rounds are only shown to players who are 18 or older.', [
      { text: "I'm 18 or older", onPress: () => s.setAge('adult') },
      { text: "I'm under 18", onPress: () => s.setAge('minor') },
      { text: 'Cancel', style: 'cancel' },
    ]);

  const [tutorial, setTutorial] = useState<GameId | null>(null);
  const [codeOpen, setCodeOpen] = useState(false);
  const [code, setCode] = useState('');
  const onRedeem = () => {
    if (redeemCode(code)) {
      fx.win();
      setCode('');
      setCodeOpen(false);
      Alert.alert("You're VIP!", 'Every deck is unlocked on this phone.');
    } else {
      fx.wrong();
      Alert.alert('Code not recognised', 'Check the code and try again.');
    }
  };

  const onRestore = async () => {
    const r = await restore();
    Alert.alert(
      r === 'restored' ? 'Restored' : r === 'none' ? 'Nothing to restore' : 'Restore unavailable',
      r === 'restored' ? 'Your VIP pass is active.' : r === 'none' ? 'No VIP pass found on this store account.' : 'Please try again later.',
    );
  };

  const onManage = async () => {
    const url = await manageSubscriptionUrl();
    if (url) Linking.openURL(url).catch(() => {});
    else router.push('/paywall');
  };

  return (
    <Screen scroll>
      <TopBar left={<BackButton />} />
      <Display size={56}>BACKSTAGE</Display>

      <Group title="THE SHOW">
        <SettingRow
          title="Show 18+ rounds"
          subtitle={adult ? 'Spicy and Couples decks' : 'Only for players 18 or older'}
          right={adult ? <Toggle value={s.showAdult} onChange={s.setShowAdult} label="Show 18+ rounds" onColor={colors.pink} /> : undefined}
          onPress={adult ? undefined : changeAge}
        />
        <SettingRow title="Age" subtitle={s.age === 'adult' ? '18 or older' : s.age === 'minor' ? 'Under 18' : 'Not set'} onPress={changeAge} />
        <SettingRow title="Sound effects" right={<Toggle value={s.sound} onChange={s.setSound} label="Sound effects" />} />
        <SettingRow title="Vibration" right={<Toggle value={s.haptics} onChange={s.setHaptics} label="Vibration" />} />
        <SettingRow
          title="Turn timer"
          subtitle="Time limit for Truth or Dare cards"
          right={
            <Body bold color={colors.yellow} onPress={cycleTimer} accessibilityRole="button" style={{ padding: 6 }}>
              {s.turnTimer ? `${s.turnTimer} sec` : 'Off'}
            </Body>
          }
          onPress={cycleTimer}
        />
        <SettingRow
          title="Flip charades tilt"
          subtitle="Turn on if up and down feel swapped"
          right={<Toggle value={s.invertTilt} onChange={s.setInvertTilt} label="Flip charades tilt" />}
          last
        />
      </Group>

      <Group title="VIP">
        <SettingRow title={isVip ? 'Manage my pass' : 'Get the VIP pass'} onPress={isVip ? onManage : () => router.push('/paywall')} />
        <SettingRow title="Restore purchases" onPress={onRestore} />
        <SettingRow title="Redeem a code" subtitle={isVip ? 'VIP is active' : undefined} onPress={() => setCodeOpen((o) => !o)} last={!codeOpen} />
        {codeOpen ? (
          <View style={{ flexDirection: 'row', gap: 8, padding: 12 }}>
            <TextInput
              value={code}
              onChangeText={setCode}
              onSubmitEditing={onRedeem}
              placeholder="Enter code"
              placeholderTextColor={colors.faint}
              autoCapitalize="characters"
              autoCorrect={false}
              autoFocus
              accessibilityLabel="Promo code"
              style={{ flex: 1, height: 50, borderRadius: 12, backgroundColor: colors.deep, paddingHorizontal: 14, color: colors.white, fontFamily: fonts.bodyBold, fontSize: 16, letterSpacing: 1 }}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Redeem code"
              onPress={onRedeem}
              style={{ height: 50, paddingHorizontal: 16, borderRadius: 12, backgroundColor: colors.yellow, justifyContent: 'center' }}
            >
              <Body bold color={colors.ink}>
                Redeem
              </Body>
            </Pressable>
          </View>
        ) : null}
      </Group>

      <Group title="HOW TO PLAY">
        {howTo.map((g) => (
          <SettingRow
            key={g.id}
            title={gameMeta[g.id].name.charAt(0) + gameMeta[g.id].name.slice(1).toLowerCase()}
            subtitle={g.blurb}
            right={
              <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: gameMeta[g.id].color, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="play" color={colors.ink} size={13} />
              </View>
            }
            onPress={() => {
              fx.tap();
              setTutorial(g.id);
            }}
          />
        ))}
        <SettingRow
          title="Show tutorials again"
          subtitle={s.tutorialsSeen?.length ? 'Replay each one the next time you open a game' : 'Each game shows its tutorial the first time'}
          onPress={() => {
            s.resetTutorials();
            fx.correct();
            Alert.alert('Tutorials reset', "Each game will walk you through the rules the next time you open it.");
          }}
          last
        />
      </Group>

      <Group title="HELP">
        <SettingRow title="Contestants" onPress={() => router.push('/players')} />
        <SettingRow title="Suggest a question or deck" onPress={() => emailSupport('Wildcardz idea')} />
        <SettingRow title="Contact support" onPress={() => emailSupport('Wildcardz support')} />
        <SettingRow title="Rate Wildcardz" onPress={rateApp} />
        <SettingRow title="Privacy policy" onPress={() => openUrl(PRIVACY_URL)} />
        <SettingRow title="Terms of use" onPress={() => openUrl(TERMS_URL)} last />
      </Group>

      {tutorial ? (
        <GameTutorial
          game={tutorial}
          visible
          finishLabel="GOT IT"
          onClose={() => {
            s.markTutorialSeen(tutorial);
            setTutorial(null);
          }}
        />
      ) : null}

      <Body center size={12} color={colors.muted} style={{ marginTop: 8 }}>
        Wildcardz {appVersion()} · Play responsibly. Nobody has to do a dare they're not comfortable with.
      </Body>
    </Screen>
  );
}
