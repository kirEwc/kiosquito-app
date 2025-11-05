import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAlert } from '../hooks/useAlert';
import { databaseService, Categoria } from '../services/database';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

export default function CategoriasScreen() {
  const { showAlert } = useAlert();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState<Categoria | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
  });
  const [loading, setLoading] = useState(false);

  const cargarDatos = useCallback(async () => {
    try {
      const categoriasData = await databaseService.getCategorias();
      setCategorias(categoriasData);
    } catch {
      showAlert({
        title: 'Error',
        message: 'No se pudieron cargar las categorías',
        type: 'error',
      });
    }
  }, [showAlert]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const abrirModal = (categoria?: Categoria) => {
    if (categoria) {
      setCategoriaEditando(categoria);
      setFormData({
        nombre: categoria.nombre,
      });
    } else {
      setCategoriaEditando(null);
      setFormData({
        nombre: '',
      });
    }
    setModalVisible(true);
  };

  const guardarCategoria = async () => {
    if (!formData.nombre.trim()) {
      showAlert({
        title: 'Error',
        message: 'El nombre de la categoría es obligatorio',
        type: 'error',
      });
      return;
    }

    // Validar que el nombre no exista ya (solo para nuevas categorías)
    if (!categoriaEditando) {
      const categoriaExistente = categorias.find(c => 
        c.nombre.toLowerCase() === formData.nombre.trim().toLowerCase()
      );
      if (categoriaExistente) {
        showAlert({
          title: 'Error',
          message: `Ya existe una categoría con el nombre "${formData.nombre.trim()}"`,
          type: 'error',
        });
        return;
      }
    }

    setLoading(true);
    try {
      const categoriaData = {
        nombre: formData.nombre.trim(),
        descripcion: '',
      };

      if (categoriaEditando) {
        await databaseService.updateCategoria(categoriaEditando.id!, categoriaData);
        showAlert({
          title: 'Éxito',
          message: 'Categoría actualizada correctamente',
          type: 'success',
        });
      } else {
        await databaseService.createCategoria(categoriaData);
        showAlert({
          title: 'Éxito',
          message: 'Categoría creada correctamente',
          type: 'success',
        });
      }

      setModalVisible(false);
      cargarDatos();
    } catch {
      showAlert({
        title: 'Error',
        message: 'No se pudo guardar la categoría',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const eliminarCategoria = (categoria: Categoria) => {
    showAlert({
      title: 'Confirmar eliminación',
      message: `¿Estás seguro de que quieres eliminar la categoría "${categoria.nombre}"?`,
      type: 'warning',
      buttons: [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.deleteCategoria(categoria.id!);
              showAlert({
                title: 'Éxito',
                message: 'Categoría eliminada correctamente',
                type: 'success',
              });
              cargarDatos();
            } catch (error: any) {
              if (error?.message?.includes('está siendo utilizada')) {
                showAlert({
                  title: 'Error',
                  message: 'No se puede eliminar la categoría porque está siendo utilizada por productos',
                  type: 'error',
                });
              } else {
                showAlert({
                  title: 'Error',
                  message: 'No se pudo eliminar la categoría',
                  type: 'error',
                });
              }
            }
          },
        },
      ],
    });
  };

  const renderCategoria = ({ item }: { item: Categoria }) => (
    <Card style={styles.categoriaCard}>
      <View style={styles.categoriaHeader}>
        <View style={styles.categoriaInfo}>
          <Text style={styles.categoriaNombre}>{item.nombre}</Text>
          <Text style={styles.categoriaFecha}>
            Creada: {new Date(item.fecha_creacion!).toLocaleDateString('es-ES')}
          </Text>
        </View>
        <View style={styles.categoriaAcciones}>
          <TouchableOpacity
            style={styles.accionButton}
            onPress={() => abrirModal(item)}
          >
            <Ionicons name="pencil" size={20} color={Colors.dark.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.accionButton}
            onPress={() => eliminarCategoria(item)}
          >
            <Ionicons name="trash" size={20} color={Colors.dark.error} />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.title}>🏷️ Gestión de Categorías</Text>
        <View style={styles.placeholder} />
      </View>

      <TouchableOpacity
        onPress={() => abrirModal()}
        style={styles.nuevoButton}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      <FlatList
        data={categorias}
        renderItem={renderCategoria}
        keyExtractor={(item) => item.id!.toString()}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons
              name="pricetags-outline"
              size={48}
              color={Colors.dark.border}
            />
            <Text style={styles.emptyText}>No hay categorías creadas</Text>
            <Text style={styles.emptySubtext}>
              Toca el botón + para crear tu primera categoría
            </Text>
          </View>
        )}
      />

      {/* Modal de Categoría */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {categoriaEditando ? 'Editar Categoría' : 'Nueva Categoría'}
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
                    <Text style={styles.inputLabel}>Nombre de la Categoría *</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.nombre}
                      onChangeText={(text) => setFormData({ ...formData, nombre: text })}
                      placeholder="Ej: Snacks, Bebidas, Dulces..."
                      placeholderTextColor="#666"
                      editable={!loading}
                      autoFocus={true}
                      returnKeyType="done"
                      onSubmitEditing={guardarCategoria}
                    />
                  </View>

                  <Button
                    title={categoriaEditando ? 'Actualizar' : 'Crear'}
                    onPress={guardarCategoria}
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
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  safeArea: {
    flex: 1,
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
  categoriaCard: {
    marginBottom: Spacing.md,
  },
  categoriaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  categoriaInfo: {
    flex: 1,
  },
  categoriaNombre: {
    ...Typography.h3,
    color: Colors.dark.text,
    marginBottom: Spacing.xs,
  },
  categoriaFecha: {
    ...Typography.caption,
    color: Colors.dark.secondary,
  },
  categoriaAcciones: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  accionButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.dark.surfaceVariant,
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
  guardarButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
});