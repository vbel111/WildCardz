import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, type LayoutChangeEvent, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '@/theme';

type Props = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  bulb?: number;
  step?: number;
  shape?: 'rect' | 'circle';
  palette?: string[];
  /** Chase speed in ms; lights hold still when the user prefers reduced motion. */
  speed?: number;
};

/** Navy panel ringed with blinking marquee bulbs. */
export function Marquee({
  children,
  style,
  bulb = 11,
  step = 25,
  shape = 'rect',
  palette = [colors.yellow, colors.white],
  speed = 420,
}: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [phase, setPhase] = useState(0);
  const [still, setStill] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setStill).catch(() => {});
  }, []);

  useEffect(() => {
    if (still) return;
    const t = setInterval(() => setPhase((p) => p + 1), speed);
    return () => clearInterval(t);
  }, [still, speed]);

  const bulbs = useMemo(() => {
    const { w, h } = size;
    if (!w || !h) return [] as { x: number; y: number }[];
    const out: { x: number; y: number }[] = [];
    const inset = 12;
    if (shape === 'circle') {
      const r = Math.min(w, h) / 2 - inset - bulb / 2;
      const n = Math.max(12, Math.round((2 * Math.PI * r) / step));
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        out.push({ x: w / 2 + r * Math.cos(a) - bulb / 2, y: h / 2 + r * Math.sin(a) - bulb / 2 });
      }
      return out;
    }
    const cols = Math.max(2, Math.floor((w - inset * 2 - bulb) / step) + 1);
    const rows = Math.max(2, Math.floor((h - inset * 2 - bulb) / step) + 1);
    const sx = (w - inset * 2 - bulb) / (cols - 1);
    const sy = (h - inset * 2 - bulb) / (rows - 1);
    for (let i = 0; i < cols; i++) out.push({ x: inset + i * sx, y: inset });
    for (let j = 1; j < rows; j++) out.push({ x: w - inset - bulb, y: inset + j * sy });
    for (let i = cols - 2; i >= 0; i--) out.push({ x: inset + i * sx, y: h - inset - bulb });
    for (let j = rows - 2; j > 0; j--) out.push({ x: inset, y: inset + j * sy });
    return out;
  }, [size, shape, bulb, step]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.w || height !== size.h) setSize({ w: width, h: height });
  };

  return (
    <View
      onLayout={onLayout}
      style={[
        { backgroundColor: colors.navy, borderRadius: shape === 'circle' ? 9999 : 24, overflow: 'hidden' },
        style,
      ]}
    >
      <View pointerEvents="none" style={{ position: 'absolute', inset: 0 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {bulbs.map((b, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: b.x,
              top: b.y,
              width: bulb,
              height: bulb,
              borderRadius: bulb / 2,
              backgroundColor: palette[(i + phase) % palette.length],
            }}
          />
        ))}
      </View>
      {children}
    </View>
  );
}
