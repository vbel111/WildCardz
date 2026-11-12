import { type ComponentRef, useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { colors, fonts, radius } from '@/theme';
import { MAX_NAME, MAX_PLAYERS, usePlayers } from '@/stores/players';
import { Body, Buzzer, Label } from './ui';
import { Icon } from './Icon';
import { fx } from '@/services/feedback';

/** Add/remove the contestants. Used in onboarding and on the Players screen. */
export function PlayersEditor() {
  const players = usePlayers((s) => s.players);
  const add = usePlayers((s) => s.add);
  const remove = usePlayers((s) => s.remove);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const input = useRef<ComponentRef<typeof TextInput>>(null);

  const submit = () => {
    const res = add(name);
    if (res.ok) {
      fx.tap();
      setName('');
      setError(null);
    } else {
      fx.wrong();
      setError(res.reason);
    }
    input.current?.focus();
  };

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          ref={input}
          value={name}
          onChangeText={(t) => {
            setName(t);
            if (error) setError(null);
          }}
          onSubmitEditing={submit}
          placeholder="Add a contestant"
          placeholderTextColor={colors.faint}
          maxLength={MAX_NAME}
          returnKeyType="done"
          blurOnSubmit={false}
          autoCapitalize="words"
          autoCorrect={false}
          accessibilityLabel="Contestant name"
          style={{
            flex: 1,
            height: 58,
            borderRadius: radius.md,
            borderWidth: 2.5,
            borderColor: colors.white,
            paddingHorizontal: 18,
            color: colors.white,
            fontFamily: fonts.bodyBold,
            fontSize: 16,
          }}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add contestant"
          onPress={submit}
          style={({ pressed }) => ({
            width: 58,
            height: 58,
            borderRadius: radius.md,
            backgroundColor: colors.yellow,
            borderBottomWidth: pressed ? 2 : 5,
            borderBottomColor: colors.yellowShade,
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          <Icon name="plus" color={colors.ink} size={24} strokeWidth={3.2} />
        </Pressable>
      </View>
      {error ? (
        <Body bold color={colors.yellow} size={14} accessibilityLiveRegion="polite">
          {error}
        </Body>
      ) : null}

      <View style={{ gap: 8 }}>
        {players.map((p, i) => (
          <View
            key={p.id}
            style={{ height: 62, borderRadius: radius.md, backgroundColor: colors.navy, flexDirection: 'row', alignItems: 'center', gap: 14, paddingLeft: 10, paddingRight: 4 }}
          >
            <Buzzer name={p.name} color={p.color} />
            <Label size={24} style={{ flex: 1 }} numberOfLines={1}>
              {p.name.toUpperCase()}
            </Label>
            <Body size={12} bold color={colors.muted}>
              #{i + 1}
            </Body>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remove ${p.name}`}
              hitSlop={4}
              onPress={() => {
                fx.select();
                remove(p.id);
              }}
              style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="close" color={colors.muted} size={18} />
            </Pressable>
          </View>
        ))}
        {players.length === 0 ? (
          <View style={{ borderRadius: radius.md, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.faint, padding: 18 }}>
            <Body center color={colors.muted}>
              No contestants yet. Add at least 2 names.
            </Body>
          </View>
        ) : null}
      </View>
      <Body size={13} color={colors.muted}>
        2 to {MAX_PLAYERS} contestants. Each one gets a buzzer colour.
      </Body>
    </View>
  );
}
