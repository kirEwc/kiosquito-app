import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAlert } from '../hooks/useAlert';
import { databaseService, Producto } from '../services/database';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

export default function ProductosScreen() {
  const { showAlert } = useAlert();
  const [productos, setProductos] = useState<Producto[]>([]);
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

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      const productosData = await databaseService.getProductos();
      setProductos(productosData);
    } catch (error) {
      showAlert({
        title: 'Error',
        message: 'No se pudieron cargar los productos',
        type: 'error',
      });
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
      showAlert({
        title: 'Error',
        message: 'Por favor completa los campos obligatorios',
        type: 'error',
      });
      return;
    }

    const precio = parseFloat(formData.precio_cup);
    const stock = parseInt(formData.stock);

    if (isNaN(precio) || precio <= 0) {
      showAlert({
        title: 'Error',
        message: 'El precio debe ser un número válido mayor a 0',
        type: 'error',
      });
      return;
    }

    if (isNaN(stock) || stock < 0) {
      showAlert({
        title: 'Error',
        message: 'El stock debe ser un número válido mayor o igual a 0',
        type: 'error',
      });
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
        showAlert({
          title: 'Éxito',
          message: 'Producto actualizado correctamente',
          type: 'success',
        });
      } else {
        await databaseService.createProducto(productoData);
        showAlert({
          title: 'Éxito',
          message: 'Producto creado correctamente',
          type: 'success',
        });
      }

      setModalVisible(false);
      cargarProductos();
    } catch (error) {
      showAlert({
        title: 'Error',
        message: 'No se pudo guardar el producto',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const eliminarProducto = (producto: Producto) => {
    showAlert({
      title: 'Confirmar eliminación',
      message: `¿Estás seguro de que quieres eliminar "${producto.nombre}"?`,
      type: 'warning',
      buttons: [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.deleteProducto(producto.id!);
              showAlert({
                title: 'Éxito',
                message: 'Producto eliminado correctamente',
                type: 'success',
              });
              cargarProductos();
            } catch (error) {
              showAlert({
                title: 'Error',
                message: 'No se pudo eliminar el producto',
                type: 'error',
              });
            }
          },
        },
      ],
    });
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.title}>📦 Gestión de Productos</Text>
        <View style={styles.placeholder} />
      </View>

        <TouchableOpacity
          onPress={() => abrirModal()}
          style={styles.nuevoButton}
            >
              <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      <FlatList
        data={productos}
        renderItem={renderProducto}
        keyExtractor={(item) => item.id!.toString()}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
      />

      {/* Modal de Producto */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {productoEditando ? 'Editar Producto' : 'Nuevo Producto'}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={Colors.dark.text} />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            style={styles.modalKeyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={0}
          >
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalContent}
              keyboardShouldPersistTaps="handled"
            >
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View>
                  {/* Nombre */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Nombre *</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.nombre}
                      onChangeText={(text) =>
                        setFormData({ ...formData, nombre: text })
                      }
                      placeholder="Nombre del producto"
                      placeholderTextColor="#666"
                      editable={!loading}
                    />
                  </View>

                  {/* Precio */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Precio (CUP) *</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.precio_cup}
                      onChangeText={(text) =>
                        setFormData({ ...formData, precio_cup: text })
                      }
                      placeholder="0.00"
                      placeholderTextColor="#666"
                      keyboardType="numeric"
                      editable={!loading}
                    />
                  </View>

                  {/* Stock */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Stock *</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.stock}
                      onChangeText={(text) =>
                        setFormData({ ...formData, stock: text })
                      }
                      placeholder="0"
                      placeholderTextColor="#666"
                      keyboardType="numeric"
                      editable={!loading}
                    />
                  </View>

                  {/* Categoría */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Categoría</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.categoria}
                      onChangeText={(text) =>
                        setFormData({ ...formData, categoria: text })
                      }
                      placeholder="Ej: Bebidas, Snacks, etc."
                      placeholderTextColor="#666"
                      editable={!loading}
                    />
                  </View>

                  {/* Descripción */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Descripción</Text>
                    <TextInput
                      style={[styles.input, styles.inputMultiline]}
                      value={formData.descripcion}
                      onChangeText={(text) =>
                        setFormData({ ...formData, descripcion: text })
                      }
                      placeholder="Descripción del producto"
                      placeholderTextColor="#666"
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                      editable={!loading}
                    />
                  </View>

                  <Button
                    title={productoEditando ? 'Actualizar' : 'Crear'}
                    onPress={guardarProducto}
                    loading={loading}
                    style={styles.guardarButton}
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
  actionBar: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  nuevoButton: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    zIndex: 10,
    borderRadius: 50,
    alignSelf: 'center',
    backgroundColor: Colors.dark.primary,
    padding: Spacing.md,
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
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  input: {
    height: 50,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    color: Colors.dark.text,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  inputMultiline: {
    height: 100,
    paddingTop: Spacing.md,
  },
  guardarButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
});