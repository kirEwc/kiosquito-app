import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { databaseService } from '../../services/database';
import { Colors, Spacing, Typography } from '../../constants/theme';

export default function PerfilScreen() {
  const { user, logout } = useAuth();
  const [estadisticas, setEstadisticas] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      const [resumenDia, resumenSemana, resumenMes] = await Promise.all([
        databaseService.getResumenVentas('dia'),
        databaseService.getResumenVentas('semana'),
        databaseService.getResumenVentas('mes'),
      ]);

      const productos = await databaseService.getProductos();
      const monedas = await databaseService.getMonedas();

      setEstadisticas({
        dia: resumenDia,
        semana: resumenSemana,
        mes: resumenMes,
        totalProductos: productos.length,
        totalMonedas: monedas.length,
        stockBajo: productos.filter(p => p.stock <= 5).length,
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarEstadisticas();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.dark.primary}
            colors={[Colors.dark.primary]}
          />
        }
      >
        {/* Header del perfil */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <Text style={styles.userName}>{user?.username}</Text>
          <Text style={styles.userRole}>Administrador del Sistema</Text>
        </View>

        {/* cambiar de contraseña */}

        {/* Botón de cerrar sesión */}
        <View style={styles.logoutContainer}>
          <Button
            title="Cerrar Sesión"
            onPress={handleLogout}
            variant="danger"
            style={styles.logoutButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.dark.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 40,
    backgroundColor: Colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarText: {
    fontSize: 40,
  },
  userName: {
    ...Typography.h2,
    color: Colors.dark.text,
    marginBottom: Spacing.xs,
  },
  userRole: {
    ...Typography.body,
    color: Colors.dark.secondary,
  },
  statsCard: {
    margin: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.dark.text,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statsRow: {
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statItemLarge: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  statNumber: {
    ...Typography.h2,
    color: Colors.dark.primary,
    fontWeight: 'bold',
  },
  statNumberLarge: {
    ...Typography.h1,
    color: Colors.dark.primary,
    fontWeight: 'bold',
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.dark.secondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.dark.border,
    marginVertical: Spacing.md,
  },
  menuCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    ...Typography.body,
    color: Colors.dark.text,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  menuSubtitle: {
    ...Typography.caption,
    color: Colors.dark.secondary,
  },
  infoCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    ...Typography.body,
    color: Colors.dark.secondary,
  },
  infoValue: {
    ...Typography.body,
    color: Colors.dark.text,
    fontWeight: '600',
  },
  logoutContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  logoutButton: {
    marginBottom: Spacing.md,
  },
});