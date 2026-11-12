import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/theme';
import { Body, Display, Eyebrow, GameButton, Label, OutlineButton, Screen, Tag, TopBar, BackButton, Row } from '@/components/ui';
import { Marquee } from '@/components/Marquee';
import { PlayersEditor } from '@/components/PlayersEditor';
import { useSettings } from '@/stores/settings';
import { MIN_PLAYERS, usePlayers } from '@/stores/players';
import { openUrl, PRIVACY_URL, TERMS_URL } from '@/services/links';

type Step = 'welcome' | 'how' | 'age' | 'players';

export default function Onboarding() {
  const [step, setStep] = useState<Step>('welcome');
  const setAge = useSettings((s) => s.setAge);
  const setOnboarded = useSettings((s) => s.setOnboarded);
  const playerCount = usePlayers((s) => s.players.length);

  const finish = () => {
    setOnboarded(true);
    router.replace('/home');
  };

  if (step === 'welcome') {
    return (
      <Screen
        padTop={24}
        footer={
          <>
            <GameButton label="START THE SHOW" onPress={() => setStep('how')} />
            <Body size={12} center color={colors.muted}>
              By playing you agree to our{' '}
              <Body size={12} color={colors.white} style={{ textDecorationLine: 'underline' }} onPress={() => openUrl(TERMS_URL)}>
                Terms
              </Body>{' '}
              and{' '}
              <Body size={12} color={colors.white} style={{ textDecorationLine: 'underline' }} onPress={() => openUrl(PRIVACY_URL)}>
                Privacy Policy
              </Body>
              .
            </Body>
          </>
        }
      >
        <Marquee style={{ height: 380, alignItems: 'center', justifyContent: 'center' }}>
          <Eyebrow color={colors.yellow} style={{ marginBottom: 10 }}>
            ★ TONIGHT ONLY ★
          </Eyebrow>
          <Display size={92} center style={{ lineHeight: 86 }}>
            {'WILD\nCARDZ'}
          </Display>
          <View style={{ marginTop: 18 }}>
            <Tag label="THE PARTY GAME SHOW" color={colors.pink} tilt={-4} />
          </View>
        </Marquee>
        <Body center size={18} bold color={colors.mist} style={{ marginTop: 18, paddingHorizontal: 12 }}>
          Five games, one phone, zero chill. Or everyone joins from their own.
        </Body>
      </Screen>
    );
  }

  if (step === 'how') {
    const items = [
      { no: '01', title: 'PICK A GAME', body: 'Truth or Dare, Never Have I Ever, Charades, Trivia or Bluff.', color: colors.yellow },
      { no: '02', title: 'PASS THE PHONE', body: 'One phone goes round the room. Or open a room and everyone plays on their own phone.', color: colors.pink },
      { no: '03', title: 'CROWN A WINNER', body: 'Scores, streaks and a podium at the end. Bragging rights included.', color: colors.mint },
    ];
    return (
      <Screen
        footer={<GameButton label="GOT IT" onPress={() => setStep('age')} />}
      >
        <TopBar left={<BackButton onPress={() => setStep('welcome')} />} />
        <Display size={52}>HOW THE SHOW WORKS</Display>
        <View style={{ gap: 12, marginTop: 6 }}>
          {items.map((it, i) => (
            <View
              key={it.no}
              style={{
                flexDirection: 'row',
                gap: 14,
                alignItems: 'center',
                minHeight: 104,
                borderRadius: 18,
                backgroundColor: it.color,
                paddingHorizontal: 16,
                paddingVertical: 14,
                transform: [{ rotate: i % 2 ? '1deg' : '-1deg' }],
              }}
            >
              <Label size={54} color={colors.ink} style={{ width: 64 }}>
                {it.no}
              </Label>
              <View style={{ flex: 1, gap: 4 }}>
                <Label size={24} color={colors.ink}>
                  {it.title}
                </Label>
                <Body bold size={14} color={colors.ink}>
                  {it.body}
                </Body>
              </View>
            </View>
          ))}
        </View>
      </Screen>
    );
  }

  if (step === 'age') {
    return (
      <Screen
        footer={
          <>
            <GameButton
              label="I'M 18 OR OLDER"
              onPress={() => {
                setAge('adult');
                setStep('players');
              }}
            />
            <OutlineButton
              label="I'm under 18"
              onPress={() => {
                setAge('minor');
                setStep('players');
              }}
            />
            <Body size={13} center color={colors.muted}>
              Under 18 hides adult rounds. You can change this later in Settings.
            </Body>
          </>
        }
      >
        <TopBar left={<BackButton onPress={() => setStep('how')} />} />
        <Marquee shape="circle" style={{ width: 240, height: 240, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' }}>
          <Display size={104} color={colors.pink}>
            18+
          </Display>
        </Marquee>
        <Display size={44} center>
          BEFORE THE CURTAIN GOES UP
        </Display>
        <Body center size={16} bold>
          Spicy and Couples rounds are for adults only. Everything else is for everyone.
        </Body>
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      footer={
        <>
          <GameButton
            label={playerCount >= MIN_PLAYERS ? `LOCK IN ${playerCount} PLAYERS` : 'ADD AT LEAST 2'}
            disabled={playerCount < MIN_PLAYERS}
            onPress={finish}
          />
          <Row style={{ justifyContent: 'center' }}>
            <Body bold color={colors.white} style={{ textDecorationLine: 'underline', padding: 8 }} onPress={finish} accessibilityRole="button">
              Skip for now
            </Body>
          </Row>
        </>
      }
    >
      <TopBar left={<BackButton onPress={() => setStep('age')} />} />
      <Display size={54}>MEET THE CONTESTANTS</Display>
      <PlayersEditor />
    </Screen>
  );
}
