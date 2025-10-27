import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { databaseService } from "../../services/database";
import { useAuth } from "../../contexts/AuthContext";
import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
} from "../../constants/theme";

export default function AdminScreen() {
  const { logout } = useAuth();
  const [resumenHoy, setResumenHoy] = useState<any>(null);
  const [resumenSemana, setResumenSemana] = useState<any>(null);
  const [resumenMes, setResumenMes] = useState<any>(null);
  const [productosInfo, setProductosInfo] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    }

    try {
      const [resumenDiaData, resumenSemanaData, resumenMesData, productosData] =
        await Promise.all([
          databaseService.getResumenVentas("dia"),
          databaseService.getResumenVentas("semana"),
          databaseService.getResumenVentas("mes"),
          databaseService.getProductos(),
        ]);

      setResumenHoy(resumenDiaData);
      setResumenSemana(resumenSemanaData);
      setResumenMes(resumenMesData);

      // Calcular información de productos
      const stockBajo = productosData.filter((p) => p.stock <= 5).length;
      const sinStock = productosData.filter((p) => p.stock === 0).length;
      setProductosInfo({
        total: productosData.length,
        stockBajo,
        sinStock,
      });
    } catch (error) {
      console.error("Error cargando datos:", error);
      Alert.alert("Error", "No se pudieron cargar los datos");
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => cargarDatos(true)}
            tintColor={Colors.dark.primary}
            colors={[Colors.dark.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>⚙️ Panel de Administración</Text>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() => {
                Alert.alert(
                  "Cerrar Sesión",
                  "¿Estás seguro de que quieres cerrar sesión?",
                  [
                    { text: "Cancelar", style: "cancel" },
                    {
                      text: "Cerrar Sesión",
                      style: "destructive",
                      onPress: logout,
                    },
                  ]
                );
              }}
            >
              <Ionicons
                name="log-out-outline"
                size={24}
                color={Colors.dark.error}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Resumen de Ventas - Hoy */}
        {resumenHoy && (
          <Card style={styles.resumenCard}>
            <Text style={styles.resumenTitulo}>📊 Ventas de Hoy</Text>
            <View style={styles.resumenRow}>
              <View style={styles.resumenItem}>
                <Text style={styles.resumenNumero}>
                  {resumenHoy.total_ventas || 0}
                </Text>
                <Text style={styles.resumenLabel}>Ventas</Text>
              </View>
              <View style={styles.resumenItem}>
                <Text style={styles.resumenNumero}>
                  {resumenHoy.productos_vendidos || 0}
                </Text>
                <Text style={styles.resumenLabel}>Productos</Text>
              </View>
              <View style={styles.resumenItem}>
                <Text style={styles.resumenNumero}>
                  ${(resumenHoy.total_ingresos || 0).toFixed(2)}
                </Text>
                <Text style={styles.resumenLabel}>Ingresos CUP</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Comparativa Semanal y Mensual */}
        <View style={styles.comparativaContainer}>
          {resumenSemana && (
            <Card style={styles.comparativaCard}>
              <Text style={styles.comparativaTitulo}>Esta Semana</Text>
              <Text style={styles.comparativaNumero}>
                {resumenSemana.total_ventas || 0}
              </Text>
              <Text style={styles.comparativaLabel}>ventas</Text>
              <Text style={styles.comparativaIngresos}>
                ${(resumenSemana.total_ingresos || 0).toFixed(2)} CUP
              </Text>
            </Card>
          )}

          {resumenMes && (
            <Card style={styles.comparativaCard}>
              <Text style={styles.comparativaTitulo}>Este Mes</Text>
              <Text style={styles.comparativaNumero}>
                {resumenMes.total_ventas || 0}
              </Text>
              <Text style={styles.comparativaLabel}>ventas</Text>
              <Text style={styles.comparativaIngresos}>
                ${(resumenMes.total_ingresos || 0).toFixed(2)} CUP
              </Text>
            </Card>
          )}
        </View>

        {/* Estado de Productos */}
        {productosInfo && (
          <Card style={styles.productosCard}>
            <Text style={styles.productosTitulo}>📦 Estado del Inventario</Text>
            <View style={styles.productosRow}>
              <View style={styles.productosItem}>
                <Text style={styles.productosNumero}>
                  {productosInfo.total}
                </Text>
                <Text style={styles.productosLabel}>Total Productos</Text>
              </View>
              <View style={styles.productosItem}>
                <Text style={[styles.productosNumero, styles.stockBajo]}>
                  {productosInfo.stockBajo}
                </Text>
                <Text style={styles.productosLabel}>Stock Bajo</Text>
              </View>
              <View style={styles.productosItem}>
                <Text style={[styles.productosNumero, styles.sinStock]}>
                  {productosInfo.sinStock}
                </Text>
                <Text style={styles.productosLabel}>Sin Stock</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Botones de Navegación */}
        <View style={styles.navigationButtons}>
          <Button
            title="📊 Historial de Ventas"
            onPress={() => router.push("/historial-ventas")}
            style={styles.navButton}
            leftIcon="bar-chart"
          />

          <Button
            title="📦 Gestionar Productos"
            onPress={() => router.push("/productos")}
            style={styles.navButton}
            leftIcon="cube"
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
    padding: Spacing.lg,
    backgroundColor: Colors.dark.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    ...Typography.h2,
    color: Colors.dark.text,
  },
  logoutButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.dark.surfaceVariant,
  },
  resumenCard: {
    margin: Spacing.lg,
  },
  resumenTitulo: {
    ...Typography.h3,
    color: Colors.dark.text,
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  resumenRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  resumenItem: {
    alignItems: "center",
  },
  resumenNumero: {
    ...Typography.h2,
    color: Colors.dark.primary,
    fontWeight: "bold",
  },
  resumenLabel: {
    ...Typography.caption,
    color: Colors.dark.secondary,
  },
  comparativaContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  comparativaCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  comparativaTitulo: {
    ...Typography.body,
    color: Colors.dark.text,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  comparativaNumero: {
    ...Typography.h1,
    color: Colors.dark.primary,
    fontWeight: "bold",
  },
  comparativaLabel: {
    ...Typography.caption,
    color: Colors.dark.secondary,
    marginBottom: Spacing.xs,
  },
  comparativaIngresos: {
    ...Typography.small,
    color: Colors.dark.success,
    fontWeight: "600",
  },
  productosCard: {
    margin: Spacing.lg,
  },
  productosTitulo: {
    ...Typography.h3,
    color: Colors.dark.text,
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  productosRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  productosItem: {
    alignItems: "center",
  },
  productosNumero: {
    ...Typography.h2,
    color: Colors.dark.primary,
    fontWeight: "bold",
  },
  stockBajo: {
    color: Colors.dark.warning,
  },
  sinStock: {
    color: Colors.dark.error,
  },
  productosLabel: {
    ...Typography.caption,
    color: Colors.dark.secondary,
    textAlign: "center",
  },
  navigationButtons: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  navButton: {
    marginBottom: Spacing.sm,
  },
});
