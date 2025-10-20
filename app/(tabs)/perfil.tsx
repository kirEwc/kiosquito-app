import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { databaseService } from '../../services/database';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';

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

  const menuItems = [
    {
      icon: 'cart',
      title: 'Ir a Ventas',
      subtitle: 'Registrar nuevas ventas',
      color: Colors.dark.primary,
      onPress: () => router.push('/(tabs)'),
    },
    {
      icon: 'cube',
      title: 'Productos',
      subtitle: 'Gestionar inventario y precios',
      color: Colors.dark.success,
      onPress: () => router.push('/(tabs)/admin'),
    },
    {
      icon: 'cash',
      title: 'Monedas y Tasas',
      subtitle: 'Configurar monedas y tasas de cambio',
      color: '#f59e0b',
      onPress: () => router.push('/(tabs)/monedas'),
    },
  ];

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

        {/* Estadísticas rápidas */}
        {estadisticas && (
          <Card style={styles.statsCard}>
            <Text style={styles.sectionTitle}>📊 Resumen de Actividad</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{estadisticas.dia?.total_ventas || 0}</Text>
                <Text style={styles.statLabel}>Ventas Hoy</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{estadisticas.semana?.total_ventas || 0}</Text>
                <Text style={styles.statLabel}>Esta Semana</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{estadisticas.mes?.total_ventas || 0}</Text>
                <Text style={styles.statLabel}>Este Mes</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.statsRow}>
              <View style={styles.statItemLarge}>
                <Text style={styles.statNumberLarge}>
                  ${(estadisticas.mes?.total_ingresos || 0).toFixed(2)}
                </Text>
                <Text style={styles.statLabel}>Ingresos del Mes (CUP)</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{estadisticas.totalProductos}</Text>
                <Text style={styles.statLabel}>Productos</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{estadisticas.totalMonedas}</Text>
                <Text style={styles.statLabel}>Monedas</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[
                  styles.statNumber,
                  { color: estadisticas.stockBajo > 0 ? Colors.dark.error : Colors.dark.success }
                ]}>
                  {estadisticas.stockBajo}
                </Text>
                <Text style={styles.statLabel}>Stock Bajo</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Accesos rápidos */}
        <Card style={styles.menuCard}>
          <Text style={styles.sectionTitle}>🚀 Accesos Rápidos</Text>
          
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.menuItemLast
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon as any} size={24} color={item.color} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.dark.icon} />
            </TouchableOpacity>
          ))}
        </Card>

        {/* Información de la app */}
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>ℹ️ Información del Sistema</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Aplicación:</Text>
            <Text style={styles.infoValue}>Kiosquito v1.0</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Base de Datos:</Text>
            <Text style={styles.infoValue}>SQLite Local</Text>
          </View>
          
          <View style={[styles.infoRow, styles.infoRowLast]}>
            <Text style={styles.infoLabel}>Moneda Principal:</Text>
            <Text style={styles.infoValue}>CUP (Peso Cubano)</Text>
          </View>
        </Card>

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
    width: 80,
    height: 80,
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