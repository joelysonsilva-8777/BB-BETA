import { createTheme } from '@shopify/restyle';
import { Platform } from 'react-native';

const fontFamily = Platform.select({ ios: 'System', android: 'sans-serif', default: 'Arial' });

export const theme = createTheme({
  colors: {
    background: '#F6F7F9', surface: '#FFFFFF', surfaceSoft: '#F1F3F7',
    text: '#202A3D', muted: '#647086', border: '#E5E8EE',
    primary: '#304BB2', brandBlue: '#465EFF', yellow: '#FCFC30',
    onPrimary: '#FFFFFF', navy: '#19376A', navySoft: '#24467C',
    blueSoft: '#EEF2FC', blueMuted: '#BDCAE4', positive: '#247653',
    positiveSoft: '#EAF5EF', yellowSoft: '#FCF9E9', gold: '#D3C191',
    overlay: '#101D3C80', transparent: 'transparent', danger: '#B43D3D', dangerSoft: '#FBEDED',
    warning: '#8A5D16', warningSoft: '#FBF4E5',
  },
  spacing: { none: 0, xxs: 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 48, xxxl: 64 },
  borderRadii: { none: 0, sm: 4, md: 8, lg: 12 },
  breakpoints: { phone: 0, regularPhone: 390, tablet: 768, desktop: 1100 },
  textVariants: {
    defaults: { fontFamily, fontSize: 14, lineHeight: 21, color: 'text' },
    heading: { fontSize: 28, lineHeight: 35, fontWeight: '700', letterSpacing: -0.7 },
    title: { fontSize: 18, lineHeight: 26, fontWeight: '700', letterSpacing: -0.2 },
    subtitle: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
    body: { fontSize: 14, lineHeight: 22 },
    button: { fontSize: 13, lineHeight: 20, fontWeight: '600' },
    caption: { fontSize: 12, lineHeight: 18 },
    eyebrow: { fontSize: 10, lineHeight: 16, fontWeight: '700', letterSpacing: 1.5 },
    balance: { fontSize: 36, lineHeight: 45, fontWeight: '600', letterSpacing: -1 },
    amount: { fontSize: 25, lineHeight: 33, fontWeight: '600', letterSpacing: -0.5 },
  },
});

export type Theme = typeof theme;
export type Color = keyof Theme['colors'];
