import { createBox, createText, useTheme } from '@shopify/restyle';
import { Pressable, type PressableProps } from 'react-native';
import { useState, type ComponentProps, type ReactNode } from 'react';
import { ArrowUpRight, type LucideIcon } from 'lucide-react-native';
import type { Color, Theme } from '../theme';

export const Box = createBox<Theme>();
export const Text = createText<Theme>();
type TapProps = Omit<PressableProps, 'children' | 'style'> & { children: ReactNode; flex?: number };

export function Tap({ children, flex, ...props }: TapProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable accessibilityRole="button" {...props}
      onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)}
      aria-checked={props.accessibilityState?.checked}
      aria-selected={props.accessibilityState?.selected}
      aria-expanded={props.accessibilityState?.expanded}
      aria-disabled={props.disabled || props.accessibilityState?.disabled}
      style={({ pressed }) => ({ flex, minWidth: 0, maxWidth: '100%', opacity: props.disabled ? 0.4 : pressed ? 0.58 : hovered ? 0.78 : 1, borderRadius: 4 })}>
      {children}
    </Pressable>
  );
}

export function Icon({ icon: Component, color = 'text', size = 20 }: {
  icon: LucideIcon; color?: Color; size?: number;
}) {
  const theme = useTheme<Theme>();
  return <Component size={size} color={theme.colors[color]} strokeWidth={1.65} aria-hidden />;
}

export function IconButton({ icon, label, onPress, color = 'text', badge = false }: {
  icon: LucideIcon; label: string; onPress: () => void; color?: Color; badge?: boolean;
}) {
  return (
    <Tap accessibilityLabel={label} onPress={onPress}>
      <Box width={44} height={44} alignItems="center" justifyContent="center">
        <Icon icon={icon} size={21} color={color} />
        {badge && <Box position="absolute" top={9} right={9} width={7} height={7} backgroundColor="brandBlue" borderRadius="sm" borderWidth={1} borderColor="surface" />}
      </Box>
    </Tap>
  );
}

export function Button({ label, icon, onPress, secondary = false, disabled = false }: {
  label: string; icon?: LucideIcon; onPress: () => void; secondary?: boolean; disabled?: boolean;
}) {
  return (
    <Tap accessibilityLabel={label} onPress={onPress} disabled={disabled}>
      <Box minHeight={48} paddingHorizontal="md" paddingVertical="sm" backgroundColor={secondary ? 'blueSoft' : 'primary'} borderRadius="sm" flexDirection="row" alignItems="center" justifyContent="center" gap="xs">
        {icon && <Icon icon={icon} color={secondary ? 'primary' : 'onPrimary'} size={18} />}
        <Text variant="button" flexShrink={1} textAlign="center" color={secondary ? 'primary' : 'onPrimary'}>{label}</Text>
      </Box>
    </Tap>
  );
}

export function TextLink({ label, onPress, arrow = true }: { label: string; onPress: () => void; arrow?: boolean }) {
  return (
    <Tap accessibilityLabel={label} onPress={onPress}>
      <Box flexDirection="row" gap="xs" minHeight={44} alignItems="center">
        <Text variant="button" flexShrink={1} color="primary">{label}</Text>
        {arrow && <Icon icon={ArrowUpRight} color="primary" size={16} />}
      </Box>
    </Tap>
  );
}

export function Card(props: ComponentProps<typeof Box>) {
  return <Box minWidth={0} backgroundColor="surface" borderColor="border" borderWidth={1} borderRadius="md" padding={{ phone: 'md', regularPhone: 'lg' }} {...props} />;
}
