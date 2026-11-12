import { ActivityIndicator, View } from 'react-native';
import { colors } from '@/theme';
import { Body } from './ui';
import { useRoom } from '@/services/online';

/** Thin bar shown in online screens while the realtime link is shaky. */
export function ConnectionBanner() {
  const link = useRoom((s) => s.link);
  if (link === 'online') return null;
  const text =
    link === 'reconnecting'
      ? 'Connection lost. Reconnecting…'
      : 'The host dropped out. Waiting for them to come back…';
  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: colors.yellow,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
      }}
    >
      <ActivityIndicator color={colors.ink} size="small" />
      <Body bold size={14} color={colors.ink} style={{ flex: 1 }}>
        {text}
      </Body>
    </View>
  );
}
