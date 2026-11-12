import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '@/theme';
import { Label } from './ui';

export function TimerRing({ left, total, size = 54, color = colors.yellow }: { left: number; total: number; size?: number; color?: string }) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? left / total : 0;
  const urgent = left <= 5;
  const ring = urgent ? colors.pink : color;
  return (
    <View
      accessible
      accessibilityRole="timer"
      accessibilityLabel={`${left} seconds left`}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.navySoft} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={ring}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - pct)}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Label size={Math.round(size * 0.4)} color={ring}>
        {left}
      </Label>
    </View>
  );
}
