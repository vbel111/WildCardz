import { useMemo, useState } from 'react';
import { Alert, Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { colors, fonts, radius } from '@/theme';
import { BackButton, Body, Display, GameButton, Segmented, Screen, TopBar } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { MAX_CARD, useCustomDeck } from '@/stores/customDeck';
import { MIN_PLAYERS, usePlayers } from '@/stores/players';
import { fx } from '@/services/feedback';

export default function CustomDeck() {
  const { cards, selected, toggle, addCard, removeCard } = useCustomDeck();
  const enough = usePlayers((s) => s.players.length >= MIN_PLAYERS);
  const [tab, setTab] = useState<'truth' | 'dare'>('truth');
  const [draft, setDraft] = useState('');

  const list = useMemo(() => cards.filter((c) => c.kind === tab), [cards, tab]);
  const picked = selected.length;
  const pickedTruths = cards.filter((c) => c.kind === 'truth' && selected.includes(c.id)).length;
  const pickedDares = picked - pickedTruths;

  const add = () => {
    if (addCard(tab, draft)) {
      fx.correct();
      setDraft('');
    } else fx.wrong();
  };

  const play = () => {
    if (!enough) return router.push('/players');
    if (!pickedTruths || !pickedDares) {
      Alert.alert('Need both', 'Pick at least one truth and one dare.');
      return;
    }
    router.push({ pathname: '/tod/play', params: { deck: 'custom' } });
  };

  return (
    <Screen
      scroll
      footer={<GameButton label={`PLAY ${picked} CARDS`} disabled={picked < 2} onPress={play} />}
    >
      <TopBar left={<BackButton />} />
      <Display size={52}>BUILD YOUR DECK</Display>
      <Segmented
        label="Card type"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'truth', label: `TRUTHS · ${pickedTruths}` },
          { value: 'dare', label: `DARES · ${pickedDares}` },
        ]}
      />

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={add}
          placeholder={tab === 'truth' ? 'Write your own truth…' : 'Write your own dare…'}
          placeholderTextColor={colors.faint}
          maxLength={MAX_CARD}
          accessibilityLabel={tab === 'truth' ? 'Write your own truth' : 'Write your own dare'}
          style={{
            flex: 1,
            minHeight: 54,
            borderRadius: radius.md,
            borderWidth: 2.5,
            borderStyle: 'dashed',
            borderColor: colors.faint,
            paddingHorizontal: 16,
            color: colors.white,
            fontFamily: fonts.bodyBold,
            fontSize: 15,
          }}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add card"
          onPress={add}
          style={{ width: 54, height: 54, borderRadius: radius.md, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="plus" color={colors.ink} strokeWidth={3} />
        </Pressable>
      </View>

      <View style={{ gap: 8 }}>
        {list.map((c) => {
          const on = selected.includes(c.id);
          return (
            <Pressable
              key={c.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={c.text}
              onPress={() => {
                fx.select();
                toggle(c.id);
              }}
              onLongPress={
                c.mine
                  ? () =>
                      Alert.alert('Delete this card?', c.text, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => removeCard(c.id) },
                      ])
                  : undefined
              }
              style={{
                minHeight: 58,
                borderRadius: radius.md,
                backgroundColor: colors.navy,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  borderWidth: 2.5,
                  borderColor: colors.yellow,
                  backgroundColor: on ? colors.yellow : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {on ? <Icon name="check" color={colors.ink} size={16} strokeWidth={3.6} /> : null}
              </View>
              <Body bold={c.mine} color={colors.white} style={{ flex: 1 }}>
                {c.text}
              </Body>
              {c.mine ? <Body size={11} bold color={colors.mint}>MINE</Body> : null}
            </Pressable>
          );
        })}
      </View>
      <Body size={12} color={colors.muted} center>
        Long-press one of your own cards to delete it.
      </Body>
    </Screen>
  );
}
