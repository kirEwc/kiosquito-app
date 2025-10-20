import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../constants/theme';

export default function TestNavScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🧪 Test Navigation</Text>
        <Text style={styles.subtitle}>Si puedes ver esta pantalla, la navegación funciona</Text>
        
        <TouchableOpacity
          style={styles.button}
          onPress={() => Alert.alert('Test', 'Navegación funcionando correctamente!')}
        >
          <Text style={styles.buttonText}>Probar Touch</Text>
        </TouchableOpacity>
        
        <Text style={styles.info}>
          Intenta cambiar entre tabs para verificar que la navegación funciona
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  title: {
    ...Typography.h1,
    color: Colors.dark.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    color: Colors.dark.secondary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  button: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.lg,
  },
  buttonText: {
    ...Typography.body,
    color: Colors.dark.surface,
    fontWeight: '600',
  },
  info: {
    ...Typography.caption,
    color: Colors.dark.secondary,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});