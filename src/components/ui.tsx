import { type ReactNode } from 'react';
import {
  Pressable,
  type PressableProps,
  ScrollView,
  StyleSheet,
  Text,
  type TextProps,
  type TextStyle,
  View,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, fonts, radius, space } from '@/theme';
import { Icon, type IconName } from './Icon';
import { fx } from '@/services/feedback';

/* ───────────── Text ───────────── */

/**
 * Anton is a tall font: a line height under ~1.2x clips the tops of letters on iOS
 * and pushes the text into whatever sits below. Never let it go tighter than that.
 */
const ANTON_MIN_LINE = 1.22;
const safeLine = (size: number, style: StyleProp<TextStyle>) => {
  const given = StyleSheet.flatten(style)?.lineHeight;
  return Math.max(given ?? 0, Math.ceil(size * ANTON_MIN_LINE));
};

type TxtProps = TextProps & { color?: string; size?: number; center?: boolean };

export function Display({ style, color = colors.white, size = 52, center, ...rest }: TxtProps) {
  return (
    <Text
      accessibilityRole="header"
      allowFontScaling={false}
      {...rest}
      style={[
        {
          fontFamily: fonts.display,
          fontSize: size,
          color,
          letterSpacing: 0.5,
          textAlign: center ? 'center' : undefined,
          includeFontPadding: false,
        },
        style,
        { lineHeight: safeLine(size, style) },
      ]}
    />
  );
}

/** Anton label (button text, card titles). Not announced as a header. */
export function Label({ style, color = colors.white, size = 22, center, ...rest }: TxtProps) {
  return (
    <Text
      allowFontScaling={false}
      {...rest}
      style={[
        {
          fontFamily: fonts.display,
          fontSize: size,
          color,
          letterSpacing: 1,
          textAlign: center ? 'center' : undefined,
          includeFontPadding: false,
        },
        style,
        { lineHeight: safeLine(size, style) },
      ]}
    />
  );
}

export function Body({
  style,
  color = colors.mist,
  size = 15,
  center,
  bold,
  ...rest
}: TxtProps & { bold?: boolean }) {
  return (
    <Text
      maxFontSizeMultiplier={1.4}
      {...rest}
      style={[
        {
          fontFamily: bold ? fonts.bodyBold : fonts.body,
          fontSize: size,
          lineHeight: Math.round(size * 1.45),
          color,
          textAlign: center ? 'center' : undefined,
        },
        style,
      ]}
    />
  );
}

export function Eyebrow({ children, color = colors.muted, style }: { children: ReactNode; color?: string; style?: StyleProp<TextStyle> }) {
  return (
    <Text
      maxFontSizeMultiplier={1.3}
      style={[{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 2.4, color }, style]}
    >
      {children}
    </Text>
  );
}

/* ───────────── Layout ───────────── */

type ScreenProps = {
  children: ReactNode;
  bg?: string;
  scroll?: boolean;
  footer?: ReactNode;
  padTop?: number;
  contentStyle?: StyleProp<ViewStyle>;
  light?: boolean;
};

/** Full-screen stage with safe areas, optional scroll body and pinned footer. */
export function Screen({ children, bg = colors.stage, scroll, footer, padTop = 12, contentStyle, light }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const body = scroll ? (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[{ paddingHorizontal: space.screen, paddingTop: padTop, paddingBottom: 24, gap: 14 }, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1, paddingHorizontal: space.screen, paddingTop: padTop, gap: 14 }, contentStyle]}>{children}</View>
  );
  return (
    <View style={{ flex: 1, backgroundColor: bg, paddingTop: insets.top }}>
      <StatusBar style={light ? 'dark' : 'light'} />
      {body}
      {footer ? (
        <View style={{ paddingHorizontal: space.screen, paddingTop: 10, paddingBottom: Math.max(insets.bottom, 16) + 8, gap: 12 }}>
          {footer}
        </View>
      ) : (
        <View style={{ height: insets.bottom }} />
      )}
    </View>
  );
}

export function Row({ children, style, gap = 10 }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export function TopBar({ left, right }: { left?: ReactNode; right?: ReactNode }) {
  return (
    <Row style={{ justifyContent: 'space-between', minHeight: 44 }}>
      <View>{left}</View>
      <View>{right}</View>
    </Row>
  );
}

/* ───────────── Buttons ───────────── */

type GameButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  color?: string;
  shade?: string;
  textColor?: string;
  size?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
  icon?: IconName;
};

/** Chunky game-show button with a pressable bottom edge. */
export function GameButton({
  label,
  color = colors.yellow,
  shade = colors.yellowShade,
  textColor = colors.ink,
  size = 24,
  height = 64,
  style,
  icon,
  disabled,
  onPress,
  ...rest
}: GameButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={(e) => {
        fx.tap();
        onPress?.(e);
      }}
      {...rest}
      style={({ pressed }) => [
        {
          height,
          borderRadius: radius.md,
          backgroundColor: color,
          borderBottomWidth: pressed ? 2 : 6,
          borderBottomColor: shade,
          marginTop: pressed ? 4 : 0,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 10,
          opacity: disabled ? 0.45 : 1,
          paddingHorizontal: 16,
        },
        style,
      ]}
    >
      {icon ? <Icon name={icon} color={textColor} size={22} /> : null}
      <Label color={textColor} size={size} style={{ letterSpacing: 1.5 }} numberOfLines={1} adjustsFontSizeToFit>
        {label}
      </Label>
    </Pressable>
  );
}

type OutlineProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  color?: string;
  style?: StyleProp<ViewStyle>;
  icon?: IconName;
};

export function OutlineButton({ label, color = colors.white, style, icon, onPress, disabled, ...rest }: OutlineProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={(e) => {
        fx.tap();
        onPress?.(e);
      }}
      {...rest}
      style={({ pressed }) => [
        {
          minHeight: 56,
          borderRadius: radius.md,
          borderWidth: 2.5,
          borderColor: color,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
          paddingHorizontal: 14,
          opacity: disabled ? 0.45 : pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      {icon ? <Icon name={icon} color={color} size={18} /> : null}
      <Body bold color={color} size={16}>
        {label}
      </Body>
    </Pressable>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  bg = colors.navy,
  color = colors.white,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  bg?: string;
  color?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={() => {
        fx.select();
        onPress();
      }}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Icon name={icon} color={color} />
    </Pressable>
  );
}

export const BackButton = ({ onPress, icon = 'back', label = 'Back' }: { onPress?: () => void; icon?: IconName; label?: string }) => (
  <IconButton
    icon={icon}
    label={label}
    onPress={onPress ?? (() => (router.canGoBack() ? router.back() : router.replace('/home')))}
  />
);

/* ───────────── Bits ───────────── */

export function Tag({ label, color = colors.yellow, textColor = colors.ink, tilt = -2 }: { label: string; color?: string; textColor?: string; tilt?: number }) {
  return (
    <View style={{ alignSelf: 'flex-start', backgroundColor: color, paddingHorizontal: 10, paddingVertical: 5, transform: [{ rotate: `${tilt}deg` }] }}>
      <Label size={16} color={textColor}>
        {label}
      </Label>
    </View>
  );
}

export function Pill({ label, bg = colors.navy, color = colors.white }: { label: string; bg?: string; color?: string }) {
  return (
    <View style={{ minHeight: 36, paddingHorizontal: 12, borderRadius: 10, backgroundColor: bg, justifyContent: 'center' }}>
      <Body bold size={13} color={color}>
        {label}
      </Body>
    </View>
  );
}

export function Badge({ label, bg, color = colors.ink }: { label: string; bg: string; color?: string }) {
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: bg }}>
      <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1, color }}>{label}</Text>
    </View>
  );
}

/** Player buzzer: a round colour chip with the player's initial. */
export function Buzzer({ name, color, size = 44, ring }: { name: string; color: string; size?: number; ring?: string }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: ring ? 3 : 0,
        borderColor: ring,
        borderBottomWidth: ring ? 3 : Math.max(3, size * 0.1),
        borderBottomColor: ring ?? 'rgba(0,0,0,0.22)',
      }}
    >
      <Label size={Math.round(size * 0.44)} color={colors.ink} style={{ letterSpacing: 0 }}>
        {name.slice(0, 1).toUpperCase()}
      </Label>
    </View>
  );
}

export function Panel({ children, style, bg = colors.navy }: { children: ReactNode; style?: StyleProp<ViewStyle>; bg?: string }) {
  return <View style={[{ backgroundColor: bg, borderRadius: radius.lg, padding: 16 }, style]}>{children}</View>;
}

/** White prompt card with a lilac press edge. */
export function PromptCard({ eyebrow, text, size = 34, style }: { eyebrow?: string; text: string; size?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.white,
          borderRadius: 20,
          paddingHorizontal: 20,
          paddingVertical: 22,
          borderBottomWidth: 8,
          borderBottomColor: colors.lilac,
          gap: 8,
        },
        style,
      ]}
    >
      {eyebrow ? <Eyebrow color="#4A52B8">{eyebrow}</Eyebrow> : null}
      <Label size={size} color={colors.ink} style={{ letterSpacing: 0.3, lineHeight: Math.round(size * 1.12) }}>
        {text}
      </Label>
    </View>
  );
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label?: string;
}) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ flexDirection: 'row', gap: 6, padding: 5, borderRadius: radius.md, backgroundColor: colors.navy }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={o.label}
            onPress={() => {
              fx.select();
              onChange(o.value);
            }}
            style={{ flex: 1, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? colors.yellow : 'transparent' }}
          >
            <Label size={19} color={on ? colors.ink : colors.white}>
              {o.label}
            </Label>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Toggle({ value, onChange, label, onColor = colors.mint }: { value: boolean; onChange: (v: boolean) => void; label: string; onColor?: string }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      hitSlop={8}
      onPress={() => {
        fx.select();
        onChange(!value);
      }}
      style={{ width: 56, height: 32, borderRadius: 8, backgroundColor: value ? onColor : colors.navySoft, justifyContent: 'center', paddingHorizontal: 4 }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          backgroundColor: value ? colors.ink : colors.white,
          alignSelf: value ? 'flex-end' : 'flex-start',
        }}
      />
    </Pressable>
  );
}

export function SettingRow({ title, subtitle, right, onPress, last }: { title: string; subtitle?: string; right?: ReactNode; onPress?: () => void; last?: boolean }) {
  const content = (
    <View
      style={{
        minHeight: 58,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderBottomWidth: last ? 0 : 1.5,
        borderBottomColor: colors.navyLine,
        gap: 12,
      }}
    >
      <View style={{ flex: 1 }}>
        <Body bold color={colors.white} size={16}>
          {title}
        </Body>
        {subtitle ? (
          <Body size={13} color={colors.muted}>
            {subtitle}
          </Body>
        ) : null}
      </View>
      {right ?? (onPress ? <Icon name="chevron" color={colors.muted} size={18} /> : null)}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      {content}
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  fill: { flex: 1 },
});
