import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/theme';
import { Badge, Body, Eyebrow, GameButton, IconButton, Label, Row, Screen, TopBar } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { buy, loadPlans, restore, usePurchases, type Plan } from '@/services/purchases';
import { openUrl, PRIVACY_URL, TERMS_URL } from '@/services/links';
import { fx } from '@/services/feedback';

const perks = [
  'Every deck in all five games',
  'Spicy and Couples rounds (18+)',
  'Football, Music and History trivia',
  'New decks added regularly, no ads',
];

export default function Paywall() {
  const { isVip, plans, loadingPlans, configured } = usePurchases();
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  useEffect(() => {
    if (!selected && plans.length) setSelected(plans[0].id);
  }, [plans, selected]);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/home'));
  const plan = plans.find((p) => p.id === selected);

  const onBuy = async () => {
    if (!plan) return;
    setBusy(true);
    const res = await buy(plan);
    setBusy(false);
    if (res === 'success') {
      fx.win();
      Alert.alert("You're VIP!", 'Every deck is unlocked. Enjoy the show.', [{ text: "Let's go", onPress: close }]);
    } else if (res === 'error') {
      Alert.alert('Purchase failed', 'Nothing was charged. Please try again.');
    } else if (res === 'unavailable') {
      Alert.alert('Store unavailable', 'Purchases are not available right now. Please try again later.');
    }
  };

  const onRestore = async () => {
    setBusy(true);
    const res = await restore();
    setBusy(false);
    if (res === 'restored') {
      fx.win();
      Alert.alert('Restored', 'Your VIP pass is active again.', [{ text: 'Nice', onPress: close }]);
    } else if (res === 'none') Alert.alert('Nothing to restore', 'We could not find a VIP pass on this store account.');
    else Alert.alert('Restore failed', 'Please check your connection and try again.');
  };

  return (
    <Screen
      scroll
      footer={
        isVip ? (
          <GameButton label="BACK TO THE SHOW" onPress={close} />
        ) : (
          <>
            <GameButton label={busy ? 'ONE SEC…' : 'GET MY PASS'} disabled={!plan || busy} onPress={onBuy} />
            {plan && plan.kind !== 'lifetime' ? (
              <Body size={12} center color={colors.muted}>
                Renews automatically until cancelled. Cancel any time in your store account settings.
              </Body>
            ) : null}
            <Row style={{ justifyContent: 'center' }} gap={18}>
              <Body bold size={13} color={colors.mist} style={{ textDecorationLine: 'underline', padding: 6 }} onPress={onRestore} accessibilityRole="button">
                Restore
              </Body>
              <Body bold size={13} color={colors.mist} style={{ textDecorationLine: 'underline', padding: 6 }} onPress={() => openUrl(TERMS_URL)} accessibilityRole="link">
                Terms
              </Body>
              <Body bold size={13} color={colors.mist} style={{ textDecorationLine: 'underline', padding: 6 }} onPress={() => openUrl(PRIVACY_URL)} accessibilityRole="link">
                Privacy
              </Body>
            </Row>
          </>
        )
      }
    >
      <TopBar left={<IconButton icon="close" label="Close" onPress={close} />} />

      <View
        style={{
          height: 150,
          borderRadius: 18,
          backgroundColor: colors.pink,
          transform: [{ rotate: '-2deg' }],
          overflow: 'hidden',
          paddingHorizontal: 26,
          justifyContent: 'center',
        }}
      >
        <View style={{ position: 'absolute', left: -14, top: 61, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.stage }} />
        <View style={{ position: 'absolute', right: -14, top: 61, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.stage }} />
        <Eyebrow color={colors.ink}>{isVip ? 'YOU ARE IN' : 'ADMIT ALL · EVERY NIGHT'}</Eyebrow>
        <Label size={80} color={colors.ink} style={{ lineHeight: 86 }}>
          VIP PASS
        </Label>
      </View>

      <View style={{ gap: 10, marginTop: 6 }}>
        {perks.map((p) => (
          <Row key={p} gap={12}>
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="check" color={colors.ink} size={14} strokeWidth={3.6} />
            </View>
            <Body bold color={colors.white} size={16}>
              {p}
            </Body>
          </Row>
        ))}
      </View>

      {isVip ? null : (
        <View style={{ gap: 10, marginTop: 4 }}>
          {loadingPlans ? <ActivityIndicator color={colors.yellow} style={{ marginVertical: 24 }} /> : null}
          {!loadingPlans && plans.length === 0 ? (
            <Body center color={colors.muted}>
              {configured ? 'Plans could not load. Check your connection.' : 'Purchases are not available on this build.'}
            </Body>
          ) : null}
          {plans.map((p, i) => (
            <PlanRow key={p.id} plan={p} best={i === 0 && p.kind === 'annual'} on={p.id === selected} onPress={() => setSelected(p.id)} />
          ))}
        </View>
      )}
    </Screen>
  );
}

function PlanRow({ plan, on, best, onPress }: { plan: Plan; on: boolean; best: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: on }}
      accessibilityLabel={`${plan.title}, ${plan.price} ${plan.period}`}
      onPress={() => {
        fx.select();
        onPress();
      }}
      style={{
        minHeight: 72,
        borderRadius: 14,
        backgroundColor: on ? colors.white : colors.navy,
        borderWidth: 3,
        borderColor: on ? colors.yellow : 'transparent',
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
      }}
    >
      <View style={{ flex: 1 }}>
        <Label size={22} color={on ? colors.ink : colors.white}>
          {plan.title}
        </Label>
        <Body bold size={14} color={on ? colors.ink : colors.mist}>
          {plan.price} {plan.period}
        </Body>
      </View>
      {best ? <Badge label="BEST DEAL" bg={colors.yellow} /> : null}
    </Pressable>
  );
}
