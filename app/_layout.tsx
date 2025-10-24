import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import * as NavigationBar from 'expo-navigation-bar';
import * as SystemUI from 'expo-system-ui';

import { AuthProvider } from '../contexts/AuthContext';
import { databaseService } from '../services/database';
import { Colors } from '../constants/theme';

// Tema personalizado basado en nuestros colores
const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.dark.background,
    card: Colors.dark.surface,
    border: Colors.dark.border,
    primary: Colors.dark.primary,
  },
};

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  useEffect(() => {
    // Inicializar base de datos
    databaseService.init();
    
    // Configurar barra de navegación globalmente
    const setupNavigationBar = async () => {
      try {
        // Probar múltiples enfoques
        await NavigationBar.setBackgroundColorAsync("#0a0a0a");
        await NavigationBar.setButtonStyleAsync("light");
        
        // También usar SystemUI como respaldo
        await SystemUI.setBackgroundColorAsync("#0a0a0a");
        
        console.log("Global navigation bar configured successfully");
      } catch (error) {
        console.log("Error configuring global navigation bar:", error);
        
        // Fallback usando solo NavigationBar
        try {
          await NavigationBar.setBackgroundColorAsync("#0a0a0a");
        } catch (fallbackError) {
          console.log("Fallback also failed:", fallbackError);
        }
      }
    };

    setupNavigationBar();
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider value={DarkTheme}>
        <Stack>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
    </AuthProvider>
  );
}
