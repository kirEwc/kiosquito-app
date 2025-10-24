import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import * as NavigationBar from 'expo-navigation-bar';
import * as SystemUI from 'expo-system-ui';

import { AuthProvider } from '../contexts/AuthContext';
import { databaseService } from '../services/database';

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
        await NavigationBar.setBackgroundColorAsync("#FFFF00");
        await NavigationBar.setButtonStyleAsync("dark");
        
        // También usar SystemUI como respaldo
        await SystemUI.setBackgroundColorAsync("#FFFF00");
        
        console.log("Global navigation bar configured successfully");
      } catch (error) {
        console.log("Error configuring global navigation bar:", error);
        
        // Fallback usando solo NavigationBar
        try {
          await NavigationBar.setBackgroundColorAsync("#FFFF00");
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
