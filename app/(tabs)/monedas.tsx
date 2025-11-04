import React, { useState, useEffect } from 'react';
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
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { useAlert } from '../../hooks/useAlert';
import { databaseService, Moneda } from '../../services/database';
import { MONEDAS } from '../../constants/monedas';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';

export default function MonedasScreen() {
  const { showAlert } = useAlert();
  const [monedas, setMonedas] = useState<Moneda[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [monedaEditando, setMonedaEditando] = useState<Moneda | null>(null);
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    tasa_cambio: '',
  });
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const cargarMonedas = React.useCallback(async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    }
    try {
      const monedasData = await databaseService.getAllMonedas();
      setMonedas(monedasData);
    } catch {
      showAlert({
        title: 'Error',
        message: 'No se pudieron cargar las monedas',
        type: 'error',
      });
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      }
    }
  }, [showAlert]);

  useEffect(() => {
    cargarMonedas();
  }, [cargarMonedas]);

  const abrirModal = (moneda?: Moneda) => {
    if (moneda) {
      setMonedaEditando(moneda);
      setFormData({
        codigo: moneda.codigo,
        nombre: moneda.nombre,
        tasa_cambio: moneda.tasa_cambio.toString(),
      });
      
      // Find the selected currency in the MONEDAS array for editing
      const matchingCurrency = MONEDAS.find(m => 
        m.code === moneda.codigo && m.name === moneda.nombre
      );
      
      if (matchingCurrency) {
        const currencyKey = `${matchingCurrency.code}-${matchingCurrency.name}`;
        setSelectedCurrency(currencyKey);
      } else {
        // If currency is not in MONEDAS list (custom currency), set to null
        setSelectedCurrency(null);
      }
    } else {
      setMonedaEditando(null);
      setFormData({
        codigo: '',
        nombre: '',
        tasa_cambio: '',
      });
      setSelectedCurrency(null);
    }
    setModalVisible(true);
  };

  const guardarMoneda = async () => {
    // For new currencies, validate selection
    if (!monedaEditando && !selectedCurrency) {
      showAlert({
        title: 'Error',
        message: 'Por favor selecciona una moneda',
        type: 'error',
      });
      return;
    }

    // For editing, validate that required fields are filled
    if (monedaEditando && !formData.tasa_cambio) {
      showAlert({
        title: 'Error',
        message: 'Por favor ingresa la tasa de cambio',
        type: 'error',
      });
      return;
    }

    // For editing non-USD currencies, validate currency selection
    if (monedaEditando && monedaEditando.codigo !== 'USD' && !selectedCurrency) {
      showAlert({
        title: 'Error',
        message: 'Por favor selecciona una moneda',
        type: 'error',
      });
      return;
    }

    if (!formData.tasa_cambio) {
      showAlert({
        title: 'Error',
        message: 'Por favor ingresa la tasa de cambio',
        type: 'error',
      });
      return;
    }

    const tasa = parseFloat(formData.tasa_cambio);
    if (isNaN(tasa) || tasa <= 0) {
      showAlert({
        title: 'Error',
        message: 'La tasa de cambio debe ser un número válido mayor a 0',
        type: 'error',
      });
      return;
    }

    // Get currency data from selection or form
    let currencyCode: string, currencyName: string;
    
    if (!monedaEditando && selectedCurrency) {
      // Creating new currency
      const selectedCurrencyData = MONEDAS.find(m => `${m.code}-${m.name}` === selectedCurrency);
      if (!selectedCurrencyData) {
        showAlert({
          title: 'Error',
          message: 'Moneda seleccionada no válida',
          type: 'error',
        });
        return;
      }
      currencyCode = selectedCurrencyData.code;
      currencyName = selectedCurrencyData.name;
    } else if (monedaEditando && monedaEditando.codigo === 'USD') {
      // Editing USD - use existing data
      currencyCode = monedaEditando.codigo;
      currencyName = monedaEditando.nombre;
    } else if (monedaEditando && selectedCurrency) {
      // Editing other currency with new selection
      const selectedCurrencyData = MONEDAS.find(m => `${m.code}-${m.name}` === selectedCurrency);
      if (!selectedCurrencyData) {
        showAlert({
          title: 'Error',
          message: 'Moneda seleccionada no válida',
          type: 'error',
        });
        return;
      }
      currencyCode = selectedCurrencyData.code;
      currencyName = selectedCurrencyData.name;
    } else {
      // Fallback to form data
      currencyCode = formData.codigo.trim();
      currencyName = formData.nombre.trim();
    }

    // Validar que el código no sea USD si es una nueva moneda
    if (!monedaEditando && currencyCode.toUpperCase() === 'USD') {
      showAlert({
        title: 'Error',
        message: 'No se puede crear otra moneda con código USD',
        type: 'error',
      });
      return;
    }

    // Validar que el código no exista ya
    if (!monedaEditando) {
      // For new currencies
      const monedaExistente = monedas.find(m => m.codigo.toUpperCase() === currencyCode.toUpperCase());
      if (monedaExistente) {
        showAlert({
          title: 'Error',
          message: `Ya existe una moneda con el código "${currencyCode.toUpperCase()}"`,
          type: 'error',
        });
        return;
      }
    } else if (monedaEditando.codigo !== currencyCode) {
      // For edited currencies that changed code
      const monedaExistente = monedas.find(m => 
        m.codigo.toUpperCase() === currencyCode.toUpperCase() && 
        m.id !== monedaEditando.id
      );
      if (monedaExistente) {
        showAlert({
          title: 'Error',
          message: `Ya existe una moneda con el código "${currencyCode.toUpperCase()}"`,
          type: 'error',
        });
        return;
      }
    }

    setLoading(true);
    try {
      const monedaData = {
        codigo: currencyCode.toUpperCase(),
        nombre: currencyName,
        tasa_cambio: tasa,
      };

      if (monedaEditando) {
        await databaseService.updateMoneda(monedaEditando.id!, monedaData);
        showAlert({
          title: 'Éxito',
          message: 'Moneda actualizada correctamente',
          type: 'success',
        });
      } else {
        await databaseService.createMoneda(monedaData);
        showAlert({
          title: 'Éxito',
          message: 'Moneda creada correctamente',
          type: 'success',
        });
      }

      setModalVisible(false);
      cargarMonedas();
    } catch (error: any) {
      // Detectar error de código duplicado
      if (error?.message?.includes('UNIQUE constraint failed: monedas.codigo')) {
        showAlert({
          title: 'Error',
          message: `Ya existe una moneda con el código "${currencyCode.toUpperCase()}"`,
          type: 'error',
        });
      } else {
        showAlert({
          title: 'Error',
          message: 'No se pudo guardar la moneda. Verifica que todos los datos sean correctos.',
          type: 'error',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const eliminarMoneda = (moneda: Moneda) => {
    if (moneda.codigo === 'USD') {
      showAlert({
        title: 'Error',
        message: 'No se puede eliminar la moneda USD (moneda base)',
        type: 'error',
      });
      return;
    }

    showAlert({
      title: 'Confirmar eliminación',
      message: `¿Estás seguro de que quieres eliminar "${moneda.codigo} - ${moneda.nombre}"?`,
      type: 'warning',
      buttons: [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.deleteMoneda(moneda.id!);
              showAlert({
                title: 'Éxito',
                message: 'Moneda eliminada correctamente',
                type: 'success',
              });
              cargarMonedas();
            } catch {
              showAlert({
                title: 'Error',
                message: 'No se pudo eliminar la moneda',
                type: 'error',
              });
            }
          },
        },
      ],
    });
  };

  const renderMoneda = ({ item }: { item: Moneda }) => (
    <Card style={styles.monedaCard}>
      <View style={styles.monedaHeader}>
        <View style={styles.monedaInfo}>
          <View style={styles.monedaTitulo}>
            <Text style={styles.monedaCodigo}>{item.codigo}</Text>
            {item.codigo === 'USD' && (
              <View style={styles.principalBadge}>
                <Text style={styles.principalText}>Principal</Text>
              </View>
            )}
          </View>
          <Text style={styles.monedaNombre}>{item.nombre}</Text>
         
        </View>
        
        <View style={styles.monedaAcciones}>
          <TouchableOpacity
            style={styles.accionButton}
            onPress={() => abrirModal(item)}
          >
            <Ionicons name="pencil" size={20} color={Colors.dark.primary} />
          </TouchableOpacity>
          
          {item.codigo !== 'USD' && (
            <TouchableOpacity
              style={[styles.accionButton, styles.deleteButton]}
              onPress={() => eliminarMoneda(item)}
            >
              <Ionicons name="trash" size={20} color={Colors.dark.surface} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Equivalencias */}
       {item.codigo !== 'USD' && (
      <View style={styles.equivalencias}>
        <Text style={styles.equivalenciasTitulo}>Equivalencias:</Text>
        
        <View style={styles.equivalenciaRow}>
          <Text style={styles.equivalenciaText}>
            1 USD = {item.tasa_cambio} {item.codigo}
          </Text>
        </View>
      </View>
       )}
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>


      <TouchableOpacity
          onPress={() => abrirModal()}
          style={styles.nuevoButton}
            >
              <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

        
      

      <View style={styles.header}>
        <Text style={styles.title}>💰 Monedas y Tasas</Text>
      </View>

        

      <FlatList
        data={monedas}
        renderItem={renderMoneda}
        keyExtractor={(item) => item.id!.toString()}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => cargarMonedas(true)}
            tintColor={Colors.dark.primary}
            colors={[Colors.dark.primary]}
          />
        }
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
                  {/* Selector de Moneda (solo para nuevas monedas) */}
                  {!monedaEditando && (
                    <>
                      {MONEDAS.filter(currency => 
                        !monedas.some(m => m.codigo.toUpperCase() === currency.code.toUpperCase())
                      ).length > 0 ? (
                        <Select
                          label="Seleccionar Moneda *"
                          placeholder="Elige una moneda de la lista"
                          options={MONEDAS
                            .filter(currency => 
                              // Filter out currencies that already exist in the database
                              !monedas.some(m => m.codigo.toUpperCase() === currency.code.toUpperCase())
                            )
                            .map(currency => ({
                              label: `${currency.code} - ${currency.name}`,
                              value: `${currency.code}-${currency.name}`,
                              subtitle: currency.code,
                            }))}
                          value={selectedCurrency}
                          onSelect={(option) => {
                            setSelectedCurrency(option.value);
                            const selectedCurrencyData = MONEDAS.find(m => `${m.code}-${m.name}` === option.value);
                            if (selectedCurrencyData) {
                              setFormData({
                                ...formData,
                                codigo: selectedCurrencyData.code,
                                nombre: selectedCurrencyData.name,
                              });
                            }
                          }}
                        />
                      ) : (
                        <Card style={styles.warningCard}>
                          <Text style={styles.warningTitle}>⚠️ Sin monedas disponibles</Text>
                          <Text style={styles.warningText}>
                            Todas las monedas disponibles ya han sido agregadas al sistema.
                          </Text>
                        </Card>
                      )}
                    </>
                  )}

                  {/* Selector de Moneda (para edición) */}
                  {monedaEditando && monedaEditando.codigo !== 'USD' && (
                    <>
                      <Select
                        label="Cambiar Moneda"
                        placeholder="Selecciona una nueva moneda"
                        options={MONEDAS
                          .filter(currency => 
                            // Include current currency and currencies not in database
                            currency.code === monedaEditando.codigo ||
                            !monedas.some(m => m.codigo.toUpperCase() === currency.code.toUpperCase())
                          )
                          .map(currency => ({
                            label: `${currency.code} - ${currency.name}`,
                            value: `${currency.code}-${currency.name}`,
                            subtitle: currency.code,
                          }))}
                        value={selectedCurrency}
                        onSelect={(option) => {
                          setSelectedCurrency(option.value);
                          const selectedCurrencyData = MONEDAS.find(m => `${m.code}-${m.name}` === option.value);
                          if (selectedCurrencyData) {
                            setFormData({
                              ...formData,
                              codigo: selectedCurrencyData.code,
                              nombre: selectedCurrencyData.name,
                            });
                          }
                        }}
                      />
                      
                      {/* Show current currency info if not in MONEDAS list */}
                      {!selectedCurrency && (
                        <Card style={styles.infoCard}>
                          <Text style={styles.infoTitulo}>📋 Moneda Actual</Text>
                          <Text style={styles.infoTexto}>
                            <Text style={{ fontWeight: '600' }}>{monedaEditando.codigo}</Text> - {monedaEditando.nombre}
                          </Text>
                          <Text style={styles.infoTexto}>
                            Esta moneda no está en la lista predefinida. Selecciona una nueva moneda para cambiarla.
                          </Text>
                        </Card>
                      )}
                    </>
                  )}

                  {/* Campos de solo lectura para USD */}
                  {monedaEditando && monedaEditando.codigo === 'USD' && (
                    <>
                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Código de Moneda</Text>
                        <TextInput
                          style={[styles.input, styles.inputDisabled]}
                          value={formData.codigo}
                          editable={false}
                          placeholder="Código de moneda"
                          placeholderTextColor="#666"
                        />
                        <Text style={styles.helperText}>
                          ℹ️ El código USD no se puede cambiar (moneda base)
                        </Text>
                      </View>

                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Nombre</Text>
                        <TextInput
                          style={[styles.input, styles.inputDisabled]}
                          value={formData.nombre}
                          editable={false}
                          placeholder="Nombre de la moneda"
                          placeholderTextColor="#666"
                        />
                        <Text style={styles.helperText}>
                          ℹ️ El nombre USD no se puede cambiar (moneda base)
                        </Text>
                      </View>
                    </>
                  )}

                  {/* Tasa de Cambio */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Tasa de Cambio (respecto al USD) *</Text>
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


                  <Button
                    title={monedaEditando ? 'Actualizar' : 'Crear'}
                    onPress={guardarMoneda}
                    loading={loading}
                    style={styles.guardarButton}
                    disabled={
                      !monedaEditando && 
                      MONEDAS.filter(currency => 
                        !monedas.some(m => m.codigo.toUpperCase() === currency.code.toUpperCase())
                      ).length === 0
                    }
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
    position: 'absolute',
    bottom: 20,
    right: 10,
    zIndex: 10,
    borderRadius: 50,
    alignSelf: 'center',
    backgroundColor: Colors.dark.primary,
    padding: Spacing.md,
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
  deleteButton: {
    backgroundColor: Colors.dark.error,
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
  inputDisabled: {
    backgroundColor: Colors.dark.background,
    color: Colors.dark.secondary,
    opacity: 0.7,
  },
  helperText: {
    ...Typography.caption,
    color: Colors.dark.secondary,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  inputError: {
    borderColor: Colors.dark.error,
    borderWidth: 2,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.dark.error,
    marginTop: Spacing.xs,
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
  warningCard: {
    backgroundColor: Colors.dark.warning + '20' || '#f59e0b20',
    borderColor: Colors.dark.warning || '#f59e0b',
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  warningTitle: {
    ...Typography.body,
    color: Colors.dark.warning || '#f59e0b',
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  warningText: {
    ...Typography.caption,
    color: Colors.dark.secondary,
  },
});