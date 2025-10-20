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
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { databaseService, Moneda } from '../../services/database';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';

export default function MonedasScreen() {
  const [monedas, setMonedas] = useState<Moneda[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [monedaEditando, setMonedaEditando] = useState<Moneda | null>(null);
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    tasa_cambio: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarMonedas();
  }, []);

  const cargarMonedas = async () => {
    try {
      const monedasData = await databaseService.getMonedas();
      setMonedas(monedasData);
    } catch (error) {
      console.error('Error cargando monedas:', error);
      Alert.alert('Error', 'No se pudieron cargar las monedas');
    }
  };

  const abrirModal = (moneda?: Moneda) => {
    if (moneda) {
      setMonedaEditando(moneda);
      setFormData({
        codigo: moneda.codigo,
        nombre: moneda.nombre,
        tasa_cambio: moneda.tasa_cambio.toString(),
      });
    } else {
      setMonedaEditando(null);
      setFormData({
        codigo: '',
        nombre: '',
        tasa_cambio: '',
      });
    }
    setModalVisible(true);
  };

  const guardarMoneda = async () => {
    if (!formData.codigo.trim() || !formData.nombre.trim() || !formData.tasa_cambio) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    const tasa = parseFloat(formData.tasa_cambio);
    if (isNaN(tasa) || tasa <= 0) {
      Alert.alert('Error', 'La tasa de cambio debe ser un número válido mayor a 0');
      return;
    }

    // Validar que el código no sea CUP si es una nueva moneda
    if (!monedaEditando && formData.codigo.toUpperCase() === 'CUP') {
      Alert.alert('Error', 'No se puede crear otra moneda con código CUP');
      return;
    }

    setLoading(true);
    try {
      const monedaData = {
        codigo: formData.codigo.toUpperCase().trim(),
        nombre: formData.nombre.trim(),
        tasa_cambio: tasa,
        activa: true,
      };

      if (monedaEditando) {
        await databaseService.updateMoneda(monedaEditando.id!, monedaData);
        Alert.alert('Éxito', 'Moneda actualizada correctamente');
      } else {
        await databaseService.createMoneda(monedaData);
        Alert.alert('Éxito', 'Moneda creada correctamente');
      }

      setModalVisible(false);
      cargarMonedas();
    } catch (error) {
      console.error('Error guardando moneda:', error);
      Alert.alert('Error', 'No se pudo guardar la moneda');
    } finally {
      setLoading(false);
    }
  };

  const toggleMoneda = async (moneda: Moneda) => {
    if (moneda.codigo === 'CUP') {
      Alert.alert('Error', 'No se puede desactivar la moneda CUP');
      return;
    }

    try {
      await databaseService.updateMoneda(moneda.id!, { activa: !moneda.activa });
      cargarMonedas();
    } catch (error) {
      console.error('Error actualizando moneda:', error);
      Alert.alert('Error', 'No se pudo actualizar la moneda');
    }
  };

  const calcularEquivalencia = (moneda: Moneda, cantidad: number = 100) => {
    if (moneda.codigo === 'CUP') return cantidad;
    return (cantidad / moneda.tasa_cambio).toFixed(2);
  };

  const renderMoneda = ({ item }: { item: Moneda }) => (
    <Card style={styles.monedaCard}>
      <View style={styles.monedaHeader}>
        <View style={styles.monedaInfo}>
          <View style={styles.monedaTitulo}>
            <Text style={styles.monedaCodigo}>{item.codigo}</Text>
            {item.codigo === 'CUP' && (
              <View style={styles.principalBadge}>
                <Text style={styles.principalText}>Principal</Text>
              </View>
            )}
          </View>
          <Text style={styles.monedaNombre}>{item.nombre}</Text>
          <Text style={styles.monedaTasa}>
            Tasa: {item.tasa_cambio}x respecto al CUP
          </Text>
        </View>
        
        <View style={styles.monedaAcciones}>
          {item.codigo !== 'CUP' && (
            <>
              <TouchableOpacity
                style={styles.accionButton}
                onPress={() => abrirModal(item)}
              >
                <Ionicons name="pencil" size={20} color={Colors.dark.primary} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.accionButton,
                  { backgroundColor: item.activa ? Colors.dark.error : Colors.dark.success }
                ]}
                onPress={() => toggleMoneda(item)}
              >
                <Ionicons 
                  name={item.activa ? "pause" : "play"} 
                  size={20} 
                  color={Colors.dark.surface} 
                />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Equivalencias */}
      <View style={styles.equivalencias}>
        <Text style={styles.equivalenciasTitulo}>Equivalencias:</Text>
        <View style={styles.equivalenciaRow}>
          <Text style={styles.equivalenciaText}>
            100 CUP = {calcularEquivalencia(item)} {item.codigo}
          </Text>
        </View>
        <View style={styles.equivalenciaRow}>
          <Text style={styles.equivalenciaText}>
            1 {item.codigo} = {item.tasa_cambio} CUP
          </Text>
        </View>
      </View>

      {!item.activa && (
        <View style={styles.inactivaBadge}>
          <Text style={styles.inactivaText}>Moneda Inactiva</Text>
        </View>
      )}
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>💰 Monedas y Tasas</Text>
        <Text style={styles.subtitle}>
          Gestiona las monedas y sus tasas de cambio respecto al CUP
        </Text>
      </View>

      <View style={styles.actionBar}>
        <Button
          title="Nueva Moneda"
          onPress={() => abrirModal()}
          leftIcon="add"
          style={styles.nuevoButton}
        />
      </View>

      <FlatList
        data={monedas}
        renderItem={renderMoneda}
        keyExtractor={(item) => item.id!.toString()}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
      />

      {/* Modal de Moneda - ARREGLADO */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {monedaEditando ? 'Editar Moneda' : 'Nueva Moneda'}
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
                  {/* Código de Moneda */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Código de Moneda *</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.codigo}
                      onChangeText={(text) => setFormData({ ...formData, codigo: text.toUpperCase() })}
                      placeholder="USD, EUR, MLC, etc."
                      placeholderTextColor="#666"
                      maxLength={5}
                      autoCapitalize="characters"
                      editable={!monedaEditando || monedaEditando.codigo !== 'CUP'}
                    />
                  </View>

                  {/* Nombre */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Nombre *</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.nombre}
                      onChangeText={(text) => setFormData({ ...formData, nombre: text })}
                      placeholder="Dólar Estadounidense, Euro, etc."
                      placeholderTextColor="#666"
                      editable={!loading}
                    />
                  </View>

                  {/* Tasa de Cambio */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Tasa de Cambio (respecto al CUP) *</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.tasa_cambio}
                      onChangeText={(text) => setFormData({ ...formData, tasa_cambio: text })}
                      placeholder="1.0"
                      placeholderTextColor="#666"
                      keyboardType="numeric"
                      editable={!loading}
                    />
                  </View>

                  {/* Card de Información */}
                  <Card style={styles.infoCard}>
                    <Text style={styles.infoTitulo}>ℹ️ Información</Text>
                    <Text style={styles.infoTexto}>
                      La tasa de cambio indica cuántos CUP equivalen a 1 unidad de esta moneda.
                    </Text>
                    <Text style={styles.infoTexto}>
                      Ejemplo: Si 1 USD = 120 CUP, entonces la tasa es 120.
                    </Text>
                  </Card>

                  <Button
                    title={monedaEditando ? 'Actualizar' : 'Crear'}
                    onPress={guardarMoneda}
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
  monedaCard: {
    marginBottom: Spacing.md,
  },
  monedaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  monedaInfo: {
    flex: 1,
  },
  monedaTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  monedaCodigo: {
    ...Typography.h2,
    color: Colors.dark.primary,
    fontWeight: 'bold',
    marginRight: Spacing.sm,
  },
  principalBadge: {
    backgroundColor: Colors.dark.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  principalText: {
    ...Typography.small,
    color: Colors.dark.surface,
    fontWeight: '600',
  },
  monedaNombre: {
    ...Typography.body,
    color: Colors.dark.text,
    marginBottom: Spacing.xs,
  },
  monedaTasa: {
    ...Typography.caption,
    color: Colors.dark.secondary,
  },
  monedaAcciones: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  accionButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.dark.surfaceVariant,
  },
  equivalencias: {
    backgroundColor: Colors.dark.surfaceVariant,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  equivalenciasTitulo: {
    ...Typography.caption,
    color: Colors.dark.text,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  equivalenciaRow: {
    marginBottom: Spacing.xs,
  },
  equivalenciaText: {
    ...Typography.small,
    color: Colors.dark.secondary,
  },
  inactivaBadge: {
    backgroundColor: Colors.dark.error,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  inactivaText: {
    ...Typography.caption,
    color: Colors.dark.surface,
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
  infoCard: {
    backgroundColor: Colors.dark.surfaceVariant,
    marginBottom: Spacing.lg,
  },
  infoTitulo: {
    ...Typography.body,
    color: Colors.dark.text,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  infoTexto: {
    ...Typography.caption,
    color: Colors.dark.secondary,
    marginBottom: Spacing.xs,
  },
  guardarButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
});