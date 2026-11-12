import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '@/theme';

export type IconName =
  | 'back'
  | 'close'
  | 'plus'
  | 'sliders'
  | 'wifi'
  | 'play'
  | 'lock'
  | 'check'
  | 'timer'
  | 'share'
  | 'up'
  | 'down'
  | 'eyeClosed'
  | 'spin'
  | 'crown'
  | 'bulb'
  | 'mic'
  | 'trash'
  | 'chevron'
  | 'users'
  | 'refresh'
  | 'help'
  | 'book';

type Props = { name: IconName; size?: number; color?: string; strokeWidth?: number };

export function Icon({ name, size = 22, color = colors.white, strokeWidth = 2.6 }: Props) {
  const common = {
    fill: 'none' as const,
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no">
      {name === 'back' && <Path d="M15 5L8 12L15 19" {...common} />}
      {name === 'close' && <Path d="M6 6L18 18M18 6L6 18" {...common} />}
      {name === 'plus' && <Path d="M12 5V19M5 12H19" {...common} />}
      {name === 'chevron' && <Path d="M9 5L16 12L9 19" {...common} />}
      {name === 'sliders' && (
        <>
          <Path d="M4 7H20M4 12H20M4 17H20" {...common} />
          <Circle cx={9} cy={7} r={2} {...common} fill={colors.navy} />
          <Circle cx={15} cy={12} r={2} {...common} fill={colors.navy} />
          <Circle cx={8} cy={17} r={2} {...common} fill={colors.navy} />
        </>
      )}
      {name === 'wifi' && (
        <>
          <Path d="M3 9.5Q12 1.5 21 9.5M6.5 13Q12 8 17.5 13M10 16.5Q12 15 14 16.5" {...common} />
          <Circle cx={12} cy={20} r={1.2} fill={color} />
        </>
      )}
      {name === 'play' && <Path d="M7 4L19 12L7 20Z" fill={color} />}
      {name === 'lock' && (
        <>
          <Rect x={5} y={11} width={14} height={10} rx={2} {...common} />
          <Path d="M8 11V8A4 4 0 0 1 16 8V11" {...common} />
        </>
      )}
      {name === 'check' && <Path d="M5 12.5L10 17L19 7" {...common} />}
      {name === 'timer' && (
        <>
          <Circle cx={12} cy={13} r={8} {...common} />
          <Path d="M12 9V13L14.5 15M9 2H15" {...common} />
        </>
      )}
      {name === 'share' && <Path d="M12 15V4M7 8L12 3L17 8M5 13V19H19V13" {...common} />}
      {name === 'down' && <Path d="M12 4V20M5 13L12 20L19 13" {...common} />}
      {name === 'up' && <Path d="M12 20V4M5 11L12 4L19 11" {...common} />}
      {name === 'eyeClosed' && (
        <>
          <Path d="M2 12C4.5 7.5 8 5.5 12 5.5S19.5 7.5 22 12" {...common} />
          <Path d="M2 12C4.5 15.5 8 17 12 17S19.5 15.5 22 12" {...common} />
          <Path d="M3.5 16L5.5 13.5M8 18.5L9 15.5M16 18.5L15 15.5M20.5 16L18.5 13.5" {...common} />
        </>
      )}
      {name === 'spin' && (
        <>
          <Circle cx={12} cy={12} r={9} {...common} />
          <Path d="M12 3V12L18 16" {...common} />
        </>
      )}
      {name === 'crown' && <Path d="M3 18L4.5 8L9 12L12 5L15 12L19.5 8L21 18Z" {...common} />}
      {name === 'bulb' && <Path d="M9 18H15M10 21H14M12 3A6 6 0 0 0 8 13.5V15H16V13.5A6 6 0 0 0 12 3Z" {...common} />}
      {name === 'mic' && (
        <>
          <Rect x={9} y={3} width={6} height={11} rx={3} {...common} />
          <Path d="M5 11A7 7 0 0 0 19 11M12 18V21M8 21H16" {...common} />
        </>
      )}
      {name === 'trash' && <Path d="M4 7H20M10 11V17M14 11V17M6 7L7 20H17L18 7M9 7V4H15V7" {...common} />}
      {name === 'users' && (
        <>
          <Circle cx={9} cy={9} r={3.5} {...common} />
          <Path d="M3 20C3.5 16.5 6 15 9 15S14.5 16.5 15 20M16 5.5A3.5 3.5 0 0 1 16 12.5M18 15C20 15.6 21 17.4 21 20" {...common} />
        </>
      )}
      {name === 'help' && (
        <>
          <Circle cx={12} cy={12} r={9} {...common} />
          <Path d="M9.6 9.4A2.5 2.5 0 0 1 14.5 10C14.5 11.8 12 12.2 12 14" {...common} />
          <Circle cx={12} cy={17.3} r={1.3} fill={color} />
        </>
      )}
      {name === 'book' && <Path d="M4 5.5C6.5 4.5 9.5 4.5 12 6C14.5 4.5 17.5 4.5 20 5.5V19C17.5 18 14.5 18 12 19.5C9.5 18 6.5 18 4 19V5.5ZM12 6V19.5" {...common} />}
      {name === 'refresh' && <Path d="M4 12A8 8 0 1 0 7 5.8M3 4V9H8" {...common} />}
    </Svg>
  );
}
