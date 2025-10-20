import { View, type ViewProps } from 'react-native';
import { useColorScheme } from '../hooks/use-color-scheme';
import { Colors } from '../constants/theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const theme = useColorScheme() ?? 'dark';
  const backgroundColor = theme === 'light' ? lightColor : darkColor;

  return <View style={[{ backgroundColor: backgroundColor ?? Colors[theme].background }, style]} {...otherProps} />;
}