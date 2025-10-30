import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/ui/Card';
import { databaseService, Venta } from '../services/database';
import { Colors, Spacing, Typography } from '../constants/theme';

export default function HistorialVentasScreen() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    cargarVentas();
  }, []);

  const cargarVentas = async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    }

    try {
      const ventasData = await databaseService.getVentas();
      setVentas(ventasData);
    } catch (error) {
      // Silently handle error
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      }
    }
  };

  const renderVenta = ({ item }: { item: Venta }) => (
    <Card style={styles.ventaCard}>
      <View style={styles.ventaHeader}>
        <Text style={styles.ventaProducto}>{item.producto_nombre}</Text>
        <Text style={styles.ventaFecha}>
          {new Date(item.fecha!).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
      <View style={styles.ventaDetalles}>
        <Text style={styles.ventaCantidad}>Cantidad: {item.cantidad}</Text>
        <Text style={styles.ventaTotal}>${item.total_cup.toFixed(2)} CUP</Text>
      </View>
      <Text style={styles.ventaMoneda}>Pagado en: {item.moneda_codigo}</Text>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.title}>📊 Historial de Ventas</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={ventas}
        renderItem={renderVenta}
        keyExtractor={(item) => item.id!.toString()}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => cargarVentas(true)}
            tintColor={Colors.dark.primary}
            colors={[Colors.dark.primary]}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons
              name="receipt-outline"
              size={48}
              color={Colors.dark.border}
            />
            <Text style={styles.emptyText}>No hay ventas registradas</Text>
            <Text style={styles.emptySubtext}>
              Las ventas aparecerán aquí cuando se registren desde la pestaña de Ventas
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    backgroundColor: Colors.dark.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  backButton: {
    padding: Spacing.sm,
    borderRadius: 8,
    backgroundColor: Colors.dark.surfaceVariant,
  },
  title: {
    ...Typography.h2,
    color: Colors.dark.text,
  },
  placeholder: {
    width: 40,
  },
  lista: {
    padding: Spacing.lg,
  },
  ventaCard: {
    marginBottom: Spacing.md,
  },
  ventaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  ventaProducto: {
    ...Typography.h3,
    color: Colors.dark.text,
    flex: 1,
  },
  ventaFecha: {
    ...Typography.caption,
    color: Colors.dark.secondary,
  },
  ventaDetalles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  ventaCantidad: {
    ...Typography.body,
    color: Colors.dark.text,
  },
  ventaTotal: {
    ...Typography.body,
    color: Colors.dark.primary,
    fontWeight: '600',
  },
  ventaMoneda: {
    ...Typography.caption,
    color: Colors.dark.secondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.dark.secondary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  emptySubtext: {
    ...Typography.caption,
    color: Colors.dark.secondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
    opacity: 0.7,
  },
});