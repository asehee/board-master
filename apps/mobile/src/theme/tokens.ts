export const UI = {
  colors: {
    primary: '#2B0A63',
    white: '#FFFFFF',
    border: 'rgba(43,10,99,0.22)',
    borderStrong: 'rgba(43,10,99,0.35)',
    muted: 'rgba(43,10,99,0.62)',
    overlayStrong: 'rgba(43,10,99,0.82)',
    overlaySoft: 'rgba(43,10,99,0.2)',
    whiteSoft: 'rgba(255,255,255,0.18)',
    whiteMuted: 'rgba(255,255,255,0.82)',
  },
  radius: {
    sm: 10,
    md: 14,
    lg: 18,
    xl: 22,
    pill: 999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  typography: {
    title: {
      fontSize: 30,
      fontWeight: '700' as const,
    },
    section: {
      fontSize: 14,
      fontWeight: '600' as const,
    },
    body: {
      fontSize: 15,
      fontWeight: '500' as const,
    },
    caption: {
      fontSize: 13,
      fontWeight: '500' as const,
    },
  },
  sizes: {
    buttonHeight: 52,
    inputHeight: 52,
  },
  shadow: {
    card: {
      shadowColor: '#2B0A63',
      shadowOpacity: 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
    },
  },
} as const;
