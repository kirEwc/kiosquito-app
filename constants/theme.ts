/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#2563eb';
const tintColorDark = '#60a5fa';

export const Colors = {
  light: {
    text: '#1f2937',
    background: '#ffffff',
    tint: tintColorLight,
    icon: '#6b7280',
    tabIconDefault: '#9ca3af',
    tabIconSelected: tintColorLight,
    card: '#f9fafb',
    border: '#e5e7eb',
    primary: '#2563eb',
    secondary: '#64748b',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    surface: '#ffffff',
    surfaceVariant: '#f1f5f9',
  },
  dark: {
    text: '#f9fafb',
    background: '#0a0a0a',
    tint: tintColorDark,
    icon: '#9ca3af',
    tabIconDefault: '#6b7280',
    tabIconSelected: tintColorDark,
    card: '#1f1f1f',
    border: '#333333',
    primary: '#60a5fa',
    secondary: '#94a3b8',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    surface: '#1f1f1f',
    surfaceVariant: '#333333',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: 'normal' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: 'normal' as const,
    lineHeight: 20,
  },
  small: {
    fontSize: 12,
    fontWeight: 'normal' as const,
    lineHeight: 16,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
