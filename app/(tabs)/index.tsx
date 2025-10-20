import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  TextInput,
  ScrollView,
  FlatList,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { databaseService, Producto, Moneda } from '../../services/database';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';

type MetodoPago = 'efectivo' | 'transferencia' | 'otra_moneda';

export default function VentasScreen() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [monedas, setMonedas] = useState<Moneda[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('efectivo');
  const [monedaSeleccionada, setMonedaSeleccionada] = useState<Moneda | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalProductosVisible, setModalProductosVisible] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  // Recargar datos cuando la pantalla se enfoca
  useFocusEffect(
    React.useCallback(() => {
      cargarDatos();
    }, [])
  );

  const cargarDatos = async () => {
    try {
      const [productosData, monedasData] = await Promise.all([
        databaseService.getProductos(),
        databaseService.getMonedas(),
      ]);
      
      // Debug: Ver qué productos se están cargando
      console.log('Productos cargados:', productosData.length);
      console.log('Productos con stock:', productosData.filter(p => p.stock > 0).length);
      
      setProductos(productosData.filter(p => p.stock > 0));
      setMonedas(monedasData);
      
      // Seleccionar CUP por defecto
      const cup = monedasData.find(m => m.codigo === 'CUP');
      if (cup) setMonedaSeleccionada(cup);
    } catch (error) {
      console.error('Error cargando datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    }
  };

  const getFechaActual = () => {
    const fecha = new Date();
    const opciones: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    };
    return fecha.toLocaleDateString('es-ES', opciones);
  };

  const seleccionarProducto = (producto: Producto) => {
    setProductoSeleccionado(producto);
    setCantidad(1);
    setModalProductosVisible(false);
    setBusqueda('');
  };

  const ajustarCantidad = (incremento: number) => {
    if (!productoSeleccionado) return;
    
    const nuevaCantidad = cantidad + incremento;
    if (nuevaCantidad >= 1 && nuevaCantidad <= productoSeleccionado.stock) {
      setCantidad(nuevaCantidad);
    }
  };

  const calcularTotal = () => {
    if (!productoSeleccionado) return 0;
    return productoSeleccionado.precio_cup * cantidad;
  };

  const calcularTotalConvertido = () => {
    if (!productoSeleccionado || !monedaSeleccionada || metodoPago !== 'otra_moneda') return 0;
    return calcularTotal() / monedaSeleccionada.tasa_cambio;
  };

  const registrarVenta = async () => {
    if (!productoSeleccionado) {
      Alert.alert('Error', 'Selecciona un producto');
      return;
    }

    if (!monedaSeleccionada) {
      Alert.alert('Error', 'No hay moneda seleccionada');
      return;
    }

    if (cantidad <= 0 || cantidad > productoSeleccionado.stock) {
      Alert.alert('Error', 'Cantidad inválida');
      return;
    }

    setLoading(true);
    try {
      const precioUnitario = productoSeleccionado.precio_cup;
      const totalCup = calcularTotal();

      await databaseService.createVenta({
        producto_id: productoSeleccionado.id!,
        cantidad: cantidad,
        precio_unitario: precioUnitario,
        moneda_id: monedaSeleccionada.id!,
        total_cup: totalCup,
      });

      Alert.alert('✅ Éxito', 'Venta registrada correctamente');
      
      // Limpiar campos
      setProductoSeleccionado(null);
      setCantidad(1);
      setMetodoPago('efectivo');
      
      // Recargar productos para actualizar stock
      cargarDatos();
    } catch (error) {
      console.error('Error registrando venta:', error);
      Alert.alert('Error', 'No se pudo registrar la venta');
    } finally {
      setLoading(false);
    }
  };

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const renderProductoItem = ({ item }: { item: Producto }) => (
    <TouchableOpacity
      style={styles.productoItem}
      onPress={() => seleccionarProducto(item)}
    >
      <View style={styles.productoItemInfo}>
        <Text style={styles.productoItemNombre}>{item.nombre}</Text>
        <Text style={styles.productoItemPrecio}>${item.precio_cup} CUP</Text>
        <Text style={styles.productoItemStock}>Stock: {item.stock}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.dark.icon} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTop}>
                <View>
                  <Text style={styles.title}>🧾 Registrar Venta</Text>
                  <Text style={styles.fecha}>{getFechaActual()}</Text>
                </View>
                <TouchableOpacity
                  style={styles.debugButton}
                  onPress={async () => {
                    try {
                      const allProducts = await databaseService.getProductos();
                      Alert.alert(
                        'Debug Productos',
                        `Total productos: ${allProducts.length}\nCon stock > 0: ${allProducts.filter(p => p.stock > 0).length}\nProductos disponibles: ${productos.length}`
                      );
                    } catch (error) {
                      Alert.alert('Error', 'No se pudieron cargar los productos');
                    }
                  }}
                >
                  <Ionicons name="bug" size={20} color={Colors.dark.secondary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.content}>
              {/* 1. Selección de Producto */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Producto *</Text>
                <TouchableOpacity
                  style={styles.selectorProducto}
                  onPress={() => setModalProductosVisible(true)}
                >
                  <View style={styles.selectorContent}>
                    {productoSeleccionado ? (
                      <>
                        <View>
                          <Text style={styles.productoSeleccionadoNombre}>
                            {productoSeleccionado.nombre}
                          </Text>
                          <Text style={styles.productoSeleccionadoInfo}>
                            ${productoSeleccionado.precio_cup} CUP • Stock: {productoSeleccionado.stock}
                          </Text>
                        </View>
                      </>
                    ) : (
                      <Text style={styles.selectorPlaceholder}>
                        Selecciona un producto
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-down" size={20} color={Colors.dark.icon} />
                </TouchableOpacity>
              </View>

              {/* 2. Cantidad */}
              {productoSeleccionado && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Cantidad *</Text>
                  <View style={styles.cantidadControl}>
                    <TouchableOpacity
                      style={styles.cantidadButton}
                      onPress={() => ajustarCantidad(-1)}
                      disabled={cantidad <= 1}
                    >
                      <Ionicons 
                        name="remove" 
                        size={24} 
                        color={cantidad <= 1 ? Colors.dark.border : Colors.dark.text} 
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
                        color={cantidad >= productoSeleccionado.stock ? Colors.dark.border : Colors.dark.text} 
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.helperText}>
                    Máximo disponible: {productoSeleccionado.stock}
                  </Text>
                </View>
              )}

              {/* 3. Precio Total */}
              {productoSeleccionado && (
                <Card style={styles.totalCard}>
                  <Text style={styles.totalLabel}>Precio Total</Text>
                  <Text style={styles.totalAmount}>
                    ${calcularTotal().toFixed(2)} CUP
                  </Text>
                  {metodoPago === 'otra_moneda' && monedaSeleccionada?.codigo !== 'CUP' && (
                    <Text style={styles.totalConvertido}>
                      ≈ {calcularTotalConvertido().toFixed(2)} {monedaSeleccionada?.codigo}
                    </Text>
                  )}
                </Card>
              )}

              {/* 4. Método de Pago */}
              {productoSeleccionado && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Método de Pago *</Text>
                  
                  <TouchableOpacity
                    style={[
                      styles.metodoPagoButton,
                      metodoPago === 'efectivo' && styles.metodoPagoSelected
                    ]}
                    onPress={() => {
                      setMetodoPago('efectivo');
                      // Asegurar que CUP esté seleccionado para efectivo
                      const cup = monedas.find(m => m.codigo === 'CUP');
                      if (cup) setMonedaSeleccionada(cup);
                    }}
                  >
                    <View style={styles.radioOuter}>
                      {metodoPago === 'efectivo' && <View style={styles.radioInner} />}
                    </View>
                    <Ionicons name="cash" size={24} color={Colors.dark.text} />
                    <Text style={styles.metodoPagoText}>Efectivo (CUP)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.metodoPagoButton,
                      metodoPago === 'transferencia' && styles.metodoPagoSelected
                    ]}
                    onPress={() => {
                      setMetodoPago('transferencia');
                      // Asegurar que CUP esté seleccionado para transferencia
                      const cup = monedas.find(m => m.codigo === 'CUP');
                      if (cup) setMonedaSeleccionada(cup);
                    }}
                  >
                    <View style={styles.radioOuter}>
                      {metodoPago === 'transferencia' && <View style={styles.radioInner} />}
                    </View>
                    <Ionicons name="card" size={24} color={Colors.dark.text} />
                    <Text style={styles.metodoPagoText}>Transferencia</Text>
                  </TouchableOpacity>

                  {monedas.filter(m => m.codigo !== 'CUP').length > 0 && (
                    <TouchableOpacity
                      style={[
                        styles.metodoPagoButton,
                        metodoPago === 'otra_moneda' && styles.metodoPagoSelected
                      ]}
                      onPress={() => setMetodoPago('otra_moneda')}
                    >
                      <View style={styles.radioOuter}>
                        {metodoPago === 'otra_moneda' && <View style={styles.radioInner} />}
                      </View>
                      <Ionicons name="logo-usd" size={24} color={Colors.dark.text} />
                      <Text style={styles.metodoPagoText}>Otra Moneda</Text>
                    </TouchableOpacity>
                  )}

                  {/* Selector de Moneda */}
                  {metodoPago === 'otra_moneda' && (
                    <View style={styles.monedasContainer}>
                      {monedas.map((moneda) => (
                        <TouchableOpacity
                          key={moneda.id}
                          style={[
                            styles.monedaChip,
                            monedaSeleccionada?.id === moneda.id && styles.monedaChipSelected
                          ]}
                          onPress={() => setMonedaSeleccionada(moneda)}
                        >
                          <Text style={[
                            styles.monedaChipText,
                            monedaSeleccionada?.id === moneda.id && styles.monedaChipTextSelected
                          ]}>
                            {moneda.codigo}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* 5. Botón Registrar Venta */}
              {productoSeleccionado && (
                <Button
                  title="Registrar Venta"
                  onPress={registrarVenta}
                  loading={loading}
                  style={styles.registrarButton}
                />
              )}

              {/* Ayuda inicial */}
              {!productoSeleccionado && (
                <Card style={styles.helpCard}>
                  <Ionicons name="information-circle" size={32} color={Colors.dark.primary} />
                  <Text style={styles.helpTitle}>¿Cómo registrar una venta?</Text>
                  <Text style={styles.helpText}>
                    1. Selecciona un producto{'\n'}
                    2. Ajusta la cantidad{'\n'}
                    3. Elige el método de pago{'\n'}
                    4. Confirma la venta
                  </Text>
                  
                  {productos.length === 0 && (
                    <TouchableOpacity
                      style={styles.reloadButton}
                      onPress={cargarDatos}
                    >
                      <Ionicons name="refresh" size={20} color={Colors.dark.primary} />
                      <Text style={styles.reloadText}>Recargar Productos</Text>
                    </TouchableOpacity>
                  )}
                </Card>
              )}
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Modal de Selección de Productos */}
      <Modal
        visible={modalProductosVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Producto</Text>
            <TouchableOpacity onPress={() => setModalProductosVisible(false)}>
              <Ionicons name="close" size={24} color={Colors.dark.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.dark.icon} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={busqueda}
              onChangeText={setBusqueda}
              placeholder="Buscar producto..."
              placeholderTextColor="#666"
              autoFocus
            />
          </View>

          <FlatList
            data={productosFiltrados}
            renderItem={renderProductoItem}
            keyExtractor={(item) => item.id!.toString()}
            contentContainerStyle={styles.modalLista}
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <Ionicons name="cube-outline" size={48} color={Colors.dark.border} />
                <Text style={styles.emptyText}>
                  {busqueda ? 'No se encontraron productos' : 'No hay productos disponibles'}
                </Text>
                {!busqueda && (
                  <Text style={styles.emptySubtext}>
                    Los productos sin stock no aparecen aquí.{'\n'}
                    Ve a Admin → Productos para agregar stock.
                  </Text>
                )}
              </View>
            )}
          />
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
  keyboardView: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  header: {
    padding: Spacing.lg,
    backgroundColor: Colors.dark.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    ...Typography.h2,
    color: Colors.dark.text,
    marginBottom: Spacing.xs,
  },
  debugButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.dark.surfaceVariant,
  },
  fecha: {
    ...Typography.caption,
    color: Colors.dark.secondary,
    textTransform: 'capitalize',
  },
  content: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    ...Typography.body,
    color: Colors.dark.text,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  selectorProducto: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.dark.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    minHeight: 60,
  },
  selectorContent: {
    flex: 1,
  },
  selectorPlaceholder: {
    ...Typography.body,
    color: Colors.dark.secondary,
  },
  productoSeleccionadoNombre: {
    ...Typography.body,
    color: Colors.dark.text,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  productoSeleccionadoInfo: {
    ...Typography.caption,
    color: Colors.dark.secondary,
  },
  cantidadControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  cantidadButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  cantidadDisplay: {
    minWidth: 80,
    alignItems: 'center',
  },
  cantidadTexto: {
    ...Typography.h1,
    color: Colors.dark.text,
    fontWeight: 'bold',
  },
  helperText: {
    ...Typography.caption,
    color: Colors.dark.secondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  totalCard: {
    backgroundColor: Colors.dark.primary + '20',
    borderColor: Colors.dark.primary,
    borderWidth: 2,
    alignItems: 'center',
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
    fontWeight: 'bold',
  },
  totalConvertido: {
    ...Typography.body,
    color: Colors.dark.secondary,
    marginTop: Spacing.xs,
  },
  metodoPagoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  metodoPagoSelected: {
    borderColor: Colors.dark.primary,
    backgroundColor: Colors.dark.primary + '10',
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.dark.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.dark.primary,
  },
  metodoPagoText: {
    ...Typography.body,
    color: Colors.dark.text,
    fontWeight: '600',
    flex: 1,
  },
  monedasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  monedaChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  monedaChipSelected: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  monedaChipText: {
    ...Typography.body,
    color: Colors.dark.text,
    fontWeight: '600',
  },
  monedaChipTextSelected: {
    color: Colors.dark.surface,
  },
  registrarButton: {
    marginTop: Spacing.lg,
  },
  helpCard: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  helpTitle: {
    ...Typography.h3,
    color: Colors.dark.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  helpText: {
    ...Typography.body,
    color: Colors.dark.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  reloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.dark.surfaceVariant,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  reloadText: {
    ...Typography.body,
    color: Colors.dark.primary,
    fontWeight: '600',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.lg,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: Colors.dark.text,
    fontSize: 16,
  },
  modalLista: {
    padding: Spacing.lg,
  },
  productoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.dark.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  productoItemInfo: {
    flex: 1,
  },
  productoItemNombre: {
    ...Typography.body,
    color: Colors.dark.text,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  productoItemPrecio: {
    ...Typography.body,
    color: Colors.dark.primary,
    marginBottom: Spacing.xs,
  },
  productoItemStock: {
    ...Typography.caption,
    color: Colors.dark.secondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
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