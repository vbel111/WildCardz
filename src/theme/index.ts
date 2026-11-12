export const colors = {
  stage: '#1F2BD6',
  navy: '#121A8F',
  deep: '#0A0F5C',
  navyLine: '#2C39C8',
  navySoft: '#3B47E6',
  white: '#FFFFFF',
  mist: '#DCDFFF',
  muted: '#C9CCFF',
  faint: '#9AA2FF',
  yellow: '#FFE14D',
  yellowShade: '#C9A800',
  pink: '#FF5FA2',
  pinkShade: '#C23A7A',
  mint: '#4BF0B5',
  mintShade: '#1FB383',
  orange: '#FF9A3C',
  orangeShade: '#C96A14',
  lilac: '#B9BEFF',
  ink: '#121A8F',
} as const;

/** Buzzer colours handed out to players in order. */
export const playerColors = [
  colors.yellow,
  colors.pink,
  colors.mint,
  colors.orange,
  colors.white,
  colors.lilac,
  '#FFB3D4',
  '#9BF7D6',
  '#FFC98F',
  '#FFF09E',
  '#D9DCFF',
  '#7FE3FF',
  '#FF8E8E',
  '#C6FF7A',
  '#F3B6FF',
  '#FFD6A5',
];

export const fonts = {
  display: 'Anton_400Regular',
  body: 'DMSans_500Medium',
  bodyBold: 'DMSans_700Bold',
  bodyRegular: 'DMSans_400Regular',
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
} as const;

export const space = {
  screen: 20,
} as const;

/** Game identity: number, name and colour shown across the app. */
export const gameMeta = {
  tod: { no: '01', name: 'TRUTH OR DARE', color: colors.yellow, shade: colors.yellowShade },
  nhie: { no: '02', name: 'NEVER HAVE I EVER', color: colors.pink, shade: colors.pinkShade },
  charades: { no: '03', name: 'CHARADES', color: colors.mint, shade: colors.mintShade },
  trivia: { no: '04', name: 'TRIVIA', color: colors.orange, shade: colors.orangeShade },
  bluff: { no: '05', name: 'BLUFF', color: colors.white, shade: colors.lilac },
} as const;

export type GameId = keyof typeof gameMeta;
