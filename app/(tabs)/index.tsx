import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Modal,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
import { useAlert } from "../../hooks/useAlert";
import { databaseService, Producto, Moneda } from "../../services/database";
import { Colors, Spacing, Typography } from "../../constants/theme";

export default function VentasScreen() {
  const { showAlert } = useAlert();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [monedas, setMonedas] = useState<Moneda[]>([]);

  // Estados del modal de venta
  const [modalVentaVisible, setModalVentaVisible] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] =
    useState<Producto | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [monedaSeleccionada, setMonedaSeleccionada] = useState<Moneda | null>(
    null
  );
  const [loadingVenta, setLoadingVenta] = useState(false);

  const cargarDatos = React.useCallback(async () => {
    try {
      const [productosData, monedasData] = await Promise.all([
        databaseService.getProductos(),
        databaseService.getMonedas(),
      ]);

      setProductos(productosData.filter((p) => p.stock > 0));
      setMonedas(monedasData);

      // Seleccionar CUP por defecto
      const cup = monedasData.find((m) => m.codigo === "CUP");
      if (cup) setMonedaSeleccionada(cup);
    } catch (error) {
      console.error("Error cargando datos:", error);
      showAlert({
        title: "Error",
        message: "No se pudieron cargar los datos",
        type: "error",
      });
    }
  }, [showAlert]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Recargar datos cuando la pantalla se enfoca
  useFocusEffect(
    React.useCallback(() => {
      cargarDatos();
    }, [cargarDatos])
  );

  const getFechaActual = () => {
    const fecha = new Date();
    const opciones: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    };
    return fecha.toLocaleDateString("es-ES", opciones);
  };

  const abrirModalVenta = () => {
    setProductoSeleccionado(null);
    setCantidad(1);

    // Seleccionar CUP por defecto
    const cup = monedas.find((m) => m.codigo === "CUP");
    if (cup) setMonedaSeleccionada(cup);

    setModalVentaVisible(true);
  };

  const ajustarCantidad = (incremento: number) => {
    if (!productoSeleccionado) return;

    const nuevaCantidad = cantidad + incremento;
    if (nuevaCantidad >= 1 && nuevaCantidad <= productoSeleccionado.stock) {
      setCantidad(nuevaCantidad);
    }
  };

  const calcularTotal = () => {
    if (!productoSeleccionado || !monedaSeleccionada) return 0;
    const totalCup = productoSeleccionado.precio_cup * cantidad;
    return totalCup / monedaSeleccionada.tasa_cambio;
  };

  const registrarVenta = async () => {
    if (!productoSeleccionado) {
      showAlert({
        title: "Error",
        message: "Selecciona un producto",
        type: "error",
      });
      return;
    }

    if (!monedaSeleccionada) {
      showAlert({
        title: "Error",
        message: "Selecciona una moneda",
        type: "error",
      });
      return;
    }

    if (cantidad <= 0 || cantidad > productoSeleccionado.stock) {
      showAlert({
        title: "Error",
        message: "Cantidad inválida",
        type: "error",
      });
      return;
    }

    setLoadingVenta(true);
    try {
      const precioUnitario = productoSeleccionado.precio_cup;
      const totalCup = productoSeleccionado.precio_cup * cantidad;

      await databaseService.createVenta({
        producto_id: productoSeleccionado.id!,
        cantidad: cantidad,
        precio_unitario: precioUnitario,
        moneda_id: monedaSeleccionada.id!,
        total_cup: totalCup,
      });

      showAlert({
        title: "Éxito",
        message: "Venta registrada correctamente",
        type: "success",
      });

      // Cerrar modal y limpiar
      setModalVentaVisible(false);
      setProductoSeleccionado(null);
      setCantidad(1);

      // Recargar productos para actualizar stock
      cargarDatos();
    } catch (error) {
      console.error("Error registrando venta:", error);
      showAlert({
        title: "Error",
        message: "No se pudo registrar la venta",
        type: "error",
      });
    } finally {
      setLoadingVenta(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🧾 Registrar Venta</Text>
        <Text style={styles.fecha}>{getFechaActual()}</Text>
      </View>

      {/* Contenido Principal */}
      <View style={styles.content}>
        <Card style={styles.welcomeCard}>
          <Ionicons name="cart" size={64} color={Colors.dark.primary} />
          <Text style={styles.welcomeTitle}>Sistema de Ventas</Text>
          <Text style={styles.welcomeText}>
            Registra las ventas de productos de forma rápida y sencilla
          </Text>

          <Button
            title="Registrar Nueva Venta"
            onPress={abrirModalVenta}
            leftIcon="add"
            style={styles.nuevaVentaButton}
          />
        </Card>
      </View>

      {/* Modal de Registrar Venta */}
      <Modal
        visible={modalVentaVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer} edges={["top"]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nueva Venta</Text>
            <TouchableOpacity onPress={() => setModalVentaVisible(false)}>
              <Ionicons name="close" size={24} color={Colors.dark.text} />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            style={styles.modalKeyboardView}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={0}
          >
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalContent}
              keyboardShouldPersistTaps="handled"
            >
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View>
                  {/* Selector de Producto */}
                  <Select
                    label="Producto *"
                    placeholder="Selecciona un producto"
                    options={productos.map((producto) => ({
                      label: producto.nombre,
                      value: producto.id,
                      subtitle: `$${producto.precio_cup} CUP - Stock: ${producto.stock}`,
                    }))}
                    value={productoSeleccionado?.id}
                    onSelect={(option) => {
                      const producto = productos.find(
                        (p) => p.id === option.value
                      );
                      if (producto) {
                        setProductoSeleccionado(producto);
                        setCantidad(1);
                      }
                    }}
                    disabled={productos.length === 0}
                  />

                  {productos.length === 0 && (
                    <Text style={styles.warningText}>
                      No hay productos disponibles para vender
                    </Text>
                  )}

                  {/* Selector de Cantidad */}
                  {productoSeleccionado && (
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Cantidad *</Text>
                      <View style={styles.cantidadControl}>
                        <TouchableOpacity
                          style={styles.cantidadButton}
                          onPress={() => ajustarCantidad(-1)}
                          disabled={cantidad <= 1}
                        >
                          <Ionicons
                            name="remove"
                            size={24}
                            color={
                              cantidad <= 1
                                ? Colors.dark.border
                                : Colors.dark.text
                            }
                          />
                        </TouchableOpacity>

                        <View style={styles.cantidadDisplay}>
                          <Text style={styles.cantidadTexto}>{cantidad}</Text>
                        </View>

                        <TouchableOpacity
                          style={styles.cantidadButton}
                          onPress={() => ajustarCantidad(1)}
                          disabled={cantidad >= productoSeleccionado.stock}
                        >
                          <Ionicons
                            name="add"
                            size={24}
                            color={
                              cantidad >= productoSeleccionado.stock
                                ? Colors.dark.border
                                : Colors.dark.text
                            }
                          />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.helperText}>
                        Stock disponible: {productoSeleccionado.stock}
                      </Text>
                    </View>
                  )}

                  {/* Selector de Moneda */}
                  <Select
                    label="Moneda *"
                    placeholder="Selecciona una moneda"
                    options={monedas.map((moneda) => ({
                      label: `${moneda.codigo} - ${moneda.nombre}`,
                      value: moneda.id,
                      subtitle: `Tasa: ${moneda.tasa_cambio}`,
                    }))}
                    value={monedaSeleccionada?.id}
                    onSelect={(option) => {
                      const moneda = monedas.find((m) => m.id === option.value);
                      if (moneda) {
                        setMonedaSeleccionada(moneda);
                      }
                    }}
                  />

                  {/* Total */}
                  {productoSeleccionado && monedaSeleccionada && (
                    <Card style={styles.totalCard}>
                      <Text style={styles.totalLabel}>Total a Pagar</Text>
                      <Text style={styles.totalAmount}>
                        {calcularTotal().toFixed(2)} {monedaSeleccionada.codigo}
                      </Text>
                      {monedaSeleccionada.codigo !== "CUP" && (
                        <Text style={styles.totalConvertido}>
                          ≈ $
                          {(productoSeleccionado.precio_cup * cantidad).toFixed(
                            2
                          )}{" "}
                          CUP
                        </Text>
                      )}
                    </Card>
                  )}

                  {/* Botón Registrar */}
                  <Button
                    title="Registrar Venta"
                    onPress={registrarVenta}
                    loading={loadingVenta}
                    style={styles.registrarButton}
                    disabled={!productoSeleccionado || !monedaSeleccionada}
                  />
                </View>
              </TouchableWithoutFeedback>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
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
  title: {
    ...Typography.h2,
    color: Colors.dark.text,
    marginBottom: Spacing.xs,
  },
  fecha: {
    ...Typography.caption,
    color: Colors.dark.secondary,
    textTransform: "capitalize",
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  welcomeCard: {
    alignItems: "center",
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  welcomeTitle: {
    ...Typography.h2,
    color: Colors.dark.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  welcomeText: {
    ...Typography.body,
    color: Colors.dark.secondary,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  nuevaVentaButton: {
    minWidth: 200,
  },
  statsContainer: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.lg,
  },
  statNumber: {
    ...Typography.h1,
    color: Colors.dark.primary,
    fontWeight: "bold",
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.dark.secondary,
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  modalTitle: {
    ...Typography.h2,
    color: Colors.dark.text,
  },
  modalKeyboardView: {
    flex: 1,
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    padding: Spacing.lg,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    ...Typography.body,
    color: Colors.dark.text,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  warningText: {
    ...Typography.caption,
    color: Colors.dark.error || "#ef4444",
    textAlign: "center",
    marginTop: Spacing.xs,
    fontStyle: "italic",
  },
  cantidadControl: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
  },
  cantidadButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.dark.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  cantidadDisplay: {
    minWidth: 80,
    alignItems: "center",
  },
  cantidadTexto: {
    ...Typography.h1,
    color: Colors.dark.text,
    fontWeight: "bold",
  },
  helperText: {
    ...Typography.caption,
    color: Colors.dark.secondary,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  totalCard: {
    backgroundColor: Colors.dark.primary + "20",
    borderColor: Colors.dark.primary,
    borderWidth: 2,
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  totalLabel: {
    ...Typography.body,
    color: Colors.dark.text,
    marginBottom: Spacing.xs,
  },
  totalAmount: {
    ...Typography.h1,
    color: Colors.dark.primary,
    fontWeight: "bold",
  },
  totalConvertido: {
    ...Typography.body,
    color: Colors.dark.secondary,
    marginTop: Spacing.xs,
  },
  registrarButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
});
