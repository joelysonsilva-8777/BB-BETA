import { useWindowDimensions } from 'react-native';

// Larger system text needs the same room as a smaller screen.
export function useCompactLayout() {
  const { width, fontScale } = useWindowDimensions();
  return width / Math.max(fontScale, 1) < 375;
}
