import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@shopify/restyle';
import type { Color, Theme } from '../theme';
import { Box, Text } from './ui';

// Geometric symbol from the vector credited to Banco do Brasil on Commons.
export const BB_SYMBOL = 'M 0,0 2.348,1.567 4.697,0 0,-3.133 Z m 22.553,16.288 -2.349,-1.567 -2.349,1.567 4.698,3.13 z m 0,-11.904 L 11.274,-3.133 0,4.384 13.39,13.312 15.739,11.746 4.933,4.542 11.511,0.155 14.564,2.191 12.216,3.759 17.855,7.517 Z M 0,11.901 11.274,19.418 22.553,11.901 9.16,2.973 6.814,4.542 17.618,11.746 11.042,16.13 7.985,14.094 10.337,12.528 4.697,8.769 Z';

export function BBMark({ size = 32, color = 'brandBlue' }: { size?: number; color?: Color }) {
  const theme = useTheme<Theme>();
  return (
    <Svg width={size} height={size} viewBox="0 0 22.553 22.551" aria-hidden>
      <Path d={BB_SYMBOL} transform="translate(0 19.418) scale(1 -1)" fill={theme.colors[color]} />
    </Svg>
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Box flexDirection="row" alignItems="center" flexShrink={1} minWidth={0} gap="sm" accessibilityLabel="Banco do Brasil" accessible>
      <Box width={44} height={44} backgroundColor="yellow" alignItems="center" justifyContent="center" borderRadius="sm">
        <BBMark size={30} />
      </Box>
      {!compact && <Text fontSize={15} lineHeight={19} flexShrink={1} fontWeight="700" color="navy">Banco{`\n`}do Brasil</Text>}
    </Box>
  );
}

export function PixMark({ size = 26, color = 'primary' }: { size?: number; color?: Color }) {
  const theme = useTheme<Theme>();
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <Path d="M5.283 18.36a3.505 3.505 0 0 0 2.493-1.032l3.6-3.6a.684.684 0 0 1 .946 0l3.613 3.613a3.504 3.504 0 0 0 2.493 1.032h.71l-4.56 4.56a3.647 3.647 0 0 1-5.156 0L4.85 18.36ZM18.428 5.627a3.505 3.505 0 0 0-2.493 1.032l-3.613 3.614a.67.67 0 0 1-.946 0l-3.6-3.6A3.505 3.505 0 0 0 5.283 5.64h-.434l4.573-4.572a3.646 3.646 0 0 1 5.156 0l4.559 4.559ZM1.068 9.422 3.79 6.699h1.492a2.483 2.483 0 0 1 1.744.722l3.6 3.6a1.73 1.73 0 0 0 2.443 0l3.614-3.613a2.482 2.482 0 0 1 1.744-.723h1.767l2.737 2.737a3.646 3.646 0 0 1 0 5.156l-2.736 2.736h-1.768a2.482 2.482 0 0 1-1.744-.722l-3.613-3.613a1.77 1.77 0 0 0-2.444 0l-3.6 3.6a2.483 2.483 0 0 1-1.744.722H3.791l-2.723-2.723a3.646 3.646 0 0 1 0-5.156" fill={theme.colors[color]} />
    </Svg>
  );
}
