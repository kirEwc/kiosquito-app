import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TextInput,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../contexts/AuthContext";
import { useAlert } from "../../hooks/useAlert";
import { databaseService } from "../../services/database";
import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
} from "../../constants/theme";

export default function PerfilScreen() {
  const { user, logout } = useAuth();
  const { showAlert } = useAlert();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const cargarEstadisticas = async () => {};

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarEstadisticas();
    setRefreshing(false);
  };

  const handleLogout = () => {
    showAlert({
      title: "Cerrar Sesión",
      message: "¿Estás seguro de que quieres cerrar sesión?",
      type: "warning",
      buttons: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar Sesión",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/login");
          },
        },
      ],
    });
  };

  const handleOpenModal = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    Keyboard.dismiss();
    setModalVisible(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleSaveChanges = async () => {
    if (!currentPassword) {
      showAlert({
        title: "Error",
        message: "Debes ingresar tu contraseña actual",
        type: "error",
      });
      return;
    }

    if (!newPassword) {
      showAlert({
        title: "Error",
        message: "Debes ingresar una nueva contraseña",
        type: "error",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert({
        title: "Error",
        message: "Las contraseñas no coinciden",
        type: "error",
      });
      return;
    }

    if (newPassword.length < 6) {
      showAlert({
        title: "Error",
        message: "La nueva contraseña debe tener al menos 6 caracteres",
        type: "error",
      });
      return;
    }

    if (!user?.id) {
      showAlert({
        title: "Error",
        message: "No se pudo identificar el usuario",
        type: "error",
      });
      return;
    }

    try {
      await databaseService.updateUserPassword(
        user.id,
        currentPassword,
        newPassword
      );

      showAlert({
        title: "Éxito",
        message: "Contraseña actualizada correctamente",
        type: "success",
        buttons: [{ text: "OK", onPress: handleCloseModal }],
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "No se pudo actualizar la contraseña";
      showAlert({
        title: "Error",
        message: errorMessage,
        type: "error",
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.contentWrapper}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.dark.primary}
              colors={[Colors.dark.primary]}
            />
          }
        >
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
            <Text style={styles.userRole}>Administrador del Sistema</Text>
          </View>

          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.optionItem}
              onPress={handleOpenModal}
            >
              <View style={styles.optionIcon}>
                <Ionicons
                  name="settings-outline"
                  size={24}
                  color={Colors.dark.primary}
                />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Cambiar Datos</Text>
                <Text style={styles.optionSubtitle}>
                  Modificar usuario y contraseña
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors.dark.secondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => router.push('/productos')}
            >
              <View style={styles.optionIcon}>
                <Ionicons
                  name="cube-outline"
                  size={24}
                  color={Colors.dark.primary}
                />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Gestionar Productos</Text>
                <Text style={styles.optionSubtitle}>
                  Crear, editar y eliminar productos
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors.dark.secondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => router.push('/categorias')}
            >
              <View style={styles.optionIcon}>
                <Ionicons
                  name="pricetags-outline"
                  size={24}
                  color={Colors.dark.primary}
                />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Gestionar Categorías</Text>
                <Text style={styles.optionSubtitle}>
                  Crear y editar etiquetas para productos
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors.dark.secondary}
              />
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.logoutContainer}>
          <Button
            title="Cerrar Sesión"
            onPress={handleLogout}
            variant="danger"
            style={styles.logoutButton}
          />
        </View>
      </View>

      {/* Modal para cambiar contraseña */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseModal}
      >
        <SafeAreaView style={styles.modalContainer} edges={["top"]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Cambiar Contraseña</Text>
            <TouchableOpacity onPress={handleCloseModal}>
              <Ionicons name="close" size={24} color={Colors.dark.text} />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            style={styles.modalKeyboardView}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalContent}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Contraseña Actual</Text>
                  <TextInput
                    style={styles.textInput}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Ingresa tu contraseña actual"
                    placeholderTextColor={Colors.dark.secondary}
                    secureTextEntry
                    autoFocus={true}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Nueva Contraseña</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Ingresa la nueva contraseña"
                    placeholderTextColor={Colors.dark.secondary}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    Confirmar Nueva Contraseña
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirma la nueva contraseña"
                    placeholderTextColor={Colors.dark.secondary}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleSaveChanges}
                  />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>

          <View style={styles.modalFooter}>
            <Button
              title="Cancelar"
              onPress={handleCloseModal}
              variant="danger"
              style={styles.modalButton}
            />
            <Button
              title="Guardar Cambios"
              onPress={handleSaveChanges}
              style={styles.modalButton}
            />
          </View>
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
  contentWrapper: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    padding: Spacing.xl,
    backgroundColor: Colors.dark.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 40,
    backgroundColor: Colors.dark.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarText: {
    fontSize: 40,
  },
  userName: {
    ...Typography.h2,
    color: Colors.dark.text,
    marginBottom: Spacing.xs,
  },
  userRole: {
    ...Typography.body,
    color: Colors.dark.secondary,
  },
  optionsContainer: {
    margin: Spacing.lg,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.dark.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    ...Typography.body,
    color: Colors.dark.text,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  optionSubtitle: {
    ...Typography.caption,
    color: Colors.dark.secondary,
  },
  logoutContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    backgroundColor: Colors.dark.background,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  logoutButton: {
    marginBottom: Spacing.md,
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
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: "flex-start",
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
  textInput: {
    height: 50,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    color: Colors.dark.text,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: Spacing.lg,
    paddingBottom: Platform.OS === "ios" ? Spacing.xl : Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    gap: Spacing.md,
    backgroundColor: Colors.dark.background,
  },
  modalButton: {
    flex: 1,
  },
});
