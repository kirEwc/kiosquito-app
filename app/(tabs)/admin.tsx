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
import { databaseService, Producto, Venta } from '../../services/database';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';

export default function AdminScreen() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [resumenVentas, setResumenVentas] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    precio_cup: '',
    stock: '',
    descripcion: '',
    categoria: '',
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'productos' | 'ventas'>('productos');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [productosData, ventasData, resumenData] = await Promise.all([
        databaseService.getProductos(),
        databaseService.getVentas(),
        databaseService.getResumenVentas('dia'),
      ]);
      setProductos(productosData);
      setVentas(ventasData);
      setResumenVentas(resumenData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    }
  };

  const abrirModal = (producto?: Producto) => {
    if (producto) {
      setProductoEditando(producto);
      setFormData({
        nombre: producto.nombre,
        precio_cup: producto.precio_cup.toString(),
        stock: producto.stock.toString(),
        descripcion: producto.descripcion || '',
        categoria: producto.categoria || '',
      });
    } else {
      setProductoEditando(null);
      setFormData({
        nombre: '',
        precio_cup: '',
        stock: '',
        descripcion: '',
        categoria: '',
      });
    }
    setModalVisible(true);
  };

  const guardarProducto = async () => {
    if (!formData.nombre.trim() || !formData.precio_cup || !formData.stock) {
      Alert.alert('Error', 'Por favor completa los campos obligatorios');
      return;
    }

    const precio = parseFloat(formData.precio_cup);
    const stock = parseInt(formData.stock);

    if (isNaN(precio) || precio <= 0) {
      Alert.alert('Error', 'El precio debe ser un número válido mayor a 0');
      return;
    }

    if (isNaN(stock) || stock < 0) {
      Alert.alert('Error', 'El stock debe ser un número válido mayor o igual a 0');
      return;
    }

    setLoading(true);
    try {
      const productoData = {
        nombre: formData.nombre.trim(),
        precio_cup: precio,
        stock: stock,
        descripcion: formData.descripcion.trim(),
        categoria: formData.categoria.trim(),
      };

      if (productoEditando) {
        await databaseService.updateProducto(productoEditando.id!, productoData);
        Alert.alert('Éxito', 'Producto actualizado correctamente');
      } else {
        await databaseService.createProducto(productoData);
        Alert.alert('Éxito', 'Producto creado correctamente');
      }

      setModalVisible(false);
      cargarDatos();
    } catch (error) {
      console.error('Error guardando producto:', error);
      Alert.alert('Error', 'No se pudo guardar el producto');
    } finally {
      setLoading(false);
    }
  };

  const eliminarProducto = (producto: Producto) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que quieres eliminar "${producto.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.deleteProducto(producto.id!);
              Alert.alert('Éxito', 'Producto eliminado correctamente');
              cargarDatos();
            } catch (error) {
              console.error('Error eliminando producto:', error);
              Alert.alert('Error', 'No se pudo eliminar el producto');
            }
          },
        },
      ]
    );
  };

  const renderProducto = ({ item }: { item: Producto }) => (
    <Card style={styles.productoCard}>
      <View style={styles.productoHeader}>
        <View style={styles.productoInfo}>
          <Text style={styles.productoNombre}>{item.nombre}</Text>
          <Text style={styles.productoPrecio}>${item.precio_cup} CUP</Text>
          <Text style={styles.productoStock}>Stock: {item.stock}</Text>
          {item.categoria && (
            <Text style={styles.productoCategoria}>{item.categoria}</Text>
          )}
        </View>
        <View style={styles.productoAcciones}>
          <TouchableOpacity
            style={styles.accionButton}
            onPress={() => abrirModal(item)}
          >
            <Ionicons name="pencil" size={20} color={Colors.dark.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.accionButton}
            onPress={() => eliminarProducto(item)}
          >
            <Ionicons name="trash" size={20} color={Colors.dark.error} />
          </TouchableOpacity>
        </View>
      </View>
      {item.descripcion && (
        <Text style={styles.productoDescripcion}>{item.descripcion}</Text>
      )}
    </Card>
  );

  const renderVenta = ({ item }: { item: Venta }) => (
    <Card style={styles.ventaCard}>
      <View style={styles.ventaHeader}>
        <Text style={styles.ventaProducto}>{item.producto_nombre}</Text>
        <Text style={styles.ventaFecha}>
          {new Date(item.fecha!).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.ventaDetalles}>
        <Text style={styles.ventaCantidad}>Cantidad: {item.cantidad}</Text>
        <Text style={styles.ventaTotal}>
          ${item.total_cup.toFixed(2)} CUP
        </Text>
      </View>
      <Text style={styles.ventaMoneda}>
        Pagado en: {item.moneda_codigo}
      </Text>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>⚙️ Administración</Text>
        
        {/* Resumen de ventas */}
        {resumenVentas && (
          <Card style={styles.resumenCard}>
            <Text style={styles.resumenTitulo}>Ventas de Hoy</Text>
            <View style={styles.resumenRow}>
              <View style={styles.resumenItem}>
                <Text style={styles.resumenNumero}>{resumenVentas.total_ventas || 0}</Text>
                <Text style={styles.resumenLabel}>Ventas</Text>
              </View>
              <View style={styles.resumenItem}>
                <Text style={styles.resumenNumero}>{resumenVentas.productos_vendidos || 0}</Text>
                <Text style={styles.resumenLabel}>Productos</Text>
              </View>
              <View style={styles.resumenItem}>
                <Text style={styles.resumenNumero}>${(resumenVentas.total_ingresos || 0).toFixed(2)}</Text>
                <Text style={styles.resumenLabel}>Ingresos CUP</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'productos' && styles.tabActive]}
            onPress={() => setActiveTab('productos')}
          >
            <Text style={[styles.tabText, activeTab === 'productos' && styles.tabTextActive]}>
              Productos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'ventas' && styles.tabActive]}
            onPress={() => setActiveTab('ventas')}
          >
            <Text style={[styles.tabText, activeTab === 'ventas' && styles.tabTextActive]}>
              Ventas
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'productos' && (
        <>
          <View style={styles.actionBar}>
            <Button
              title="Nuevo Producto"
              onPress={() => abrirModal()}
              leftIcon="add"
              style={styles.nuevoButton}
            />
          </View>

          <FlatList
            data={productos}
            renderItem={renderProducto}
            keyExtractor={(item) => item.id!.toString()}
            contentContainerStyle={styles.lista}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}

      {activeTab === 'ventas' && (
        <FlatList
          data={ventas}
          renderItem={renderVenta}
          keyExtractor={(item) => item.id!.toString()}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal de Producto */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {productoEditando ? 'Editar Producto' : 'Nuevo Producto'}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={Colors.dark.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Input
              label="Nombre *"
              value={formData.nombre}
              onChangeText={(text) => setFormData({ ...formData, nombre: text })}
              placeholder="Nombre del producto"
            />

            <Input
              label="Precio (CUP) *"
              value={formData.precio_cup}
              onChangeText={(text) => setFormData({ ...formData, precio_cup: text })}
              placeholder="0.00"
              keyboardType="numeric"
            />

            <Input
              label="Stock *"
              value={formData.stock}
              onChangeText={(text) => setFormData({ ...formData, stock: text })}
              placeholder="0"
              keyboardType="numeric"
            />

            <Input
              label="Categoría"
              value={formData.categoria}
              onChangeText={(text) => setFormData({ ...formData, categoria: text })}
              placeholder="Ej: Bebidas, Snacks, etc."
            />

            <Input
              label="Descripción"
              value={formData.descripcion}
              onChangeText={(text) => setFormData({ ...formData, descripcion: text })}
              placeholder="Descripción del producto"
              multiline
              numberOfLines={3}
            />

            <Button
              title={productoEditando ? 'Actualizar' : 'Crear'}
              onPress={guardarProducto}
              loading={loading}
              style={styles.guardarButton}
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
    marginBottom: Spacing.lg,
  },
  resumenCard: {
    marginBottom: Spacing.lg,
  },
  resumenTitulo: {
    ...Typography.h3,
    color: Colors.dark.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  resumenRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  resumenItem: {
    alignItems: 'center',
  },
  resumenNumero: {
    ...Typography.h2,
    color: Colors.dark.primary,
    fontWeight: 'bold',
  },
  resumenLabel: {
    ...Typography.caption,
    color: Colors.dark.secondary,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.surfaceVariant,
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  tabActive: {
    backgroundColor: Colors.dark.surface,
  },
  tabText: {
    ...Typography.body,
    color: Colors.dark.secondary,
  },
  tabTextActive: {
    color: Colors.dark.primary,
    fontWeight: '600',
  },
  actionBar: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  nuevoButton: {
    alignSelf: 'flex-start',
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
  },
  productoInfo: {
    flex: 1,
  },
  productoNombre: {
    ...Typography.h3,
    color: Colors.dark.text,
    marginBottom: Spacing.xs,
  },
  productoPrecio: {
    ...Typography.body,
    color: Colors.dark.primary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  productoStock: {
    ...Typography.caption,
    color: Colors.dark.secondary,
    marginBottom: Spacing.xs,
  },
  productoCategoria: {
    ...Typography.small,
    color: Colors.dark.primary,
    backgroundColor: Colors.dark.surfaceVariant,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  productoDescripcion: {
    ...Typography.caption,
    color: Colors.dark.secondary,
    marginTop: Spacing.sm,
  },
  productoAcciones: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  accionButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.dark.surfaceVariant,
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
  guardarButton: {
    marginTop: Spacing.lg,
  },
});
