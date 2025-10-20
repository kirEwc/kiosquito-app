import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { databaseService, Producto, Moneda, Venta } from '../../services/database';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';

export default function VentasScreen() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [monedas, setMonedas] = useState<Moneda[]>([]);
  const [ventaModalVisible, setVentaModalVisible] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [cantidad, setCantidad] = useState('1');
  const [monedaSeleccionada, setMonedaSeleccionada] = useState<Moneda | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [productosData, monedasData] = await Promise.all([
        databaseService.getProductos(),
        databaseService.getMonedas(),
      ]);
      setProductos(productosData);
      setMonedas(monedasData);
      
      // Seleccionar CUP por defecto
      const cup = monedasData.find(m => m.codigo === 'CUP');
      if (cup) setMonedaSeleccionada(cup);
    } catch (error) {
      console.error('Error cargando datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    }
  };

  const abrirVentaModal = (producto: Producto) => {
    if (producto.stock <= 0) {
      Alert.alert('Sin Stock', 'Este producto no tiene stock disponible');
      return;
    }
    setProductoSeleccionado(producto);
    setCantidad('1');
    setVentaModalVisible(true);
  };

  const realizarVenta = async () => {
    if (!productoSeleccionado || !monedaSeleccionada) return;

    const cantidadNum = parseInt(cantidad);
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      Alert.alert('Error', 'Ingresa una cantidad válida');
      return;
    }

    if (cantidadNum > productoSeleccionado.stock) {
      Alert.alert('Error', 'No hay suficiente stock disponible');
      return;
    }

    setLoading(true);
    try {
      const precioUnitario = productoSeleccionado.precio_cup;
      const totalCup = precioUnitario * cantidadNum * monedaSeleccionada.tasa_cambio;

      await databaseService.createVenta({
        producto_id: productoSeleccionado.id!,
        cantidad: cantidadNum,
        precio_unitario: precioUnitario,
        moneda_id: monedaSeleccionada.id!,
        total_cup: totalCup,
      });

      Alert.alert('Éxito', 'Venta registrada correctamente');
      setVentaModalVisible(false);
      cargarDatos(); // Recargar para actualizar stock
    } catch (error) {
      console.error('Error realizando venta:', error);
      Alert.alert('Error', 'No se pudo registrar la venta');
    } finally {
      setLoading(false);
    }
  };

  const calcularTotal = () => {
    if (!productoSeleccionado || !monedaSeleccionada) return 0;
    const cantidadNum = parseInt(cantidad) || 0;
    return productoSeleccionado.precio_cup * cantidadNum * monedaSeleccionada.tasa_cambio;
  };

  const renderProducto = ({ item }: { item: Producto }) => (
    <TouchableOpacity onPress={() => abrirVentaModal(item)}>
      <Card style={styles.productoCard}>
        <View style={styles.productoHeader}>
          <Text style={styles.productoNombre}>{item.nombre}</Text>
          <View style={[
            styles.stockBadge,
            { backgroundColor: item.stock > 0 ? Colors.dark.success : Colors.dark.error }
          ]}>
            <Text style={styles.stockText}>{item.stock}</Text>
          </View>
        </View>
        
        <Text style={styles.productoPrecio}>${item.precio_cup} CUP</Text>
        
        {item.descripcion && (
          <Text style={styles.productoDescripcion}>{item.descripcion}</Text>
        )}
        
        <View style={styles.productoFooter}>
          <Text style={styles.stockLabel}>Stock disponible</Text>
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={Colors.dark.icon} 
          />
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🛒 Punto de Venta</Text>
        <Text style={styles.subtitle}>Selecciona un producto para vender</Text>
      </View>

      <FlatList
        data={productos}
        renderItem={renderProducto}
        keyExtractor={(item) => item.id!.toString()}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
      />

      {/* Modal de Venta */}
      <Modal
        visible={ventaModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Registrar Venta</Text>
            <TouchableOpacity onPress={() => setVentaModalVisible(false)}>
              <Ionicons name="close" size={24} color={Colors.dark.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {productoSeleccionado && (
              <Card style={styles.productoInfo}>
                <Text style={styles.productoNombre}>{productoSeleccionado.nombre}</Text>
                <Text style={styles.productoPrecio}>${productoSeleccionado.precio_cup} CUP</Text>
                <Text style={styles.stockDisponible}>
                  Stock disponible: {productoSeleccionado.stock}
                </Text>
              </Card>
            )}

            <Input
              label="Cantidad"
              value={cantidad}
              onChangeText={setCantidad}
              keyboardType="numeric"
              placeholder="Ingresa la cantidad"
            />

            <Text style={styles.sectionTitle}>Moneda</Text>
            <View style={styles.monedasContainer}>
              {monedas.map((moneda) => (
                <TouchableOpacity
                  key={moneda.id}
                  style={[
                    styles.monedaButton,
                    monedaSeleccionada?.id === moneda.id && styles.monedaSelected
                  ]}
                  onPress={() => setMonedaSeleccionada(moneda)}
                >
                  <Text style={[
                    styles.monedaText,
                    monedaSeleccionada?.id === moneda.id && styles.monedaTextSelected
                  ]}>
                    {moneda.codigo}
                  </Text>
                  <Text style={[
                    styles.monedaTasa,
                    monedaSeleccionada?.id === moneda.id && styles.monedaTextSelected
                  ]}>
                    {moneda.tasa_cambio}x
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Card style={styles.totalCard}>
              <Text style={styles.totalLabel}>Total a pagar:</Text>
              <Text style={styles.totalAmount}>
                ${calcularTotal().toFixed(2)} {monedaSeleccionada?.codigo || 'CUP'}
              </Text>
            </Card>

            <Button
              title="Confirmar Venta"
              onPress={realizarVenta}
              loading={loading}
              style={styles.confirmarButton}
            />
          </ScrollView>
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
  subtitle: {
    ...Typography.body,
    color: Colors.dark.secondary,
  },
  lista: {
    padding: Spacing.lg,
  },
  productoCard: {
    marginBottom: Spacing.md,
  },
  productoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  productoNombre: {
    ...Typography.h3,
    color: Colors.dark.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  stockBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    minWidth: 40,
    alignItems: 'center',
  },
  stockText: {
    ...Typography.caption,
    color: Colors.dark.surface,
    fontWeight: '600',
  },
  productoPrecio: {
    ...Typography.body,
    color: Colors.dark.primary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  productoDescripcion: {
    ...Typography.caption,
    color: Colors.dark.secondary,
    marginBottom: Spacing.sm,
  },
  productoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockLabel: {
    ...Typography.caption,
    color: Colors.dark.secondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  modalTitle: {
    ...Typography.h2,
    color: Colors.dark.text,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  productoInfo: {
    marginBottom: Spacing.lg,
  },
  stockDisponible: {
    ...Typography.caption,
    color: Colors.dark.secondary,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.dark.text,
    marginBottom: Spacing.md,
  },
  monedasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  monedaButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    minWidth: 80,
  },
  monedaSelected: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  monedaText: {
    ...Typography.body,
    color: Colors.dark.text,
    fontWeight: '600',
  },
  monedaTasa: {
    ...Typography.small,
    color: Colors.dark.secondary,
  },
  monedaTextSelected: {
    color: Colors.dark.surface,
  },
  totalCard: {
    backgroundColor: Colors.dark.surfaceVariant,
    marginBottom: Spacing.lg,
  },
  totalLabel: {
    ...Typography.body,
    color: Colors.dark.text,
    marginBottom: Spacing.xs,
  },
  totalAmount: {
    ...Typography.h2,
    color: Colors.dark.primary,
    fontWeight: 'bold',
  },
  confirmarButton: {
    marginTop: Spacing.md,
  },
});
