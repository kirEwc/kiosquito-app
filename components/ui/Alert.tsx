import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
} from "../../constants/theme";

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

interface AlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  onDismiss?: () => void;
  type?: "info" | "success" | "warning" | "error";
}

export function Alert({
  visible,
  title,
  message,
  buttons = [{ text: "OK" }],
  onDismiss,
  type = "info",
}: AlertProps) {
  const getIcon = () => {
    switch (type) {
      case "success":
        return { name: "checkmark-circle" as const, color: "#10b981" };
      case "warning":
        return { name: "warning" as const, color: "#f59e0b" };
      case "error":
        return { name: "close-circle" as const, color: "#ef4444" };
      default:
        return {
          name: "information-circle" as const,
          color: Colors.dark.primary,
        };
    }
  };

  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleBackdropPress = () => {
    // Solo cerrar si hay un botón de cancelar
    const cancelButton = buttons.find((b) => b.style === "cancel");
    if (cancelButton) {
      handleButtonPress(cancelButton);
    }
  };

  const icon = getIcon();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              {/* Icon */}
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: icon.color + "20" },
                ]}
              >
                <Ionicons name={icon.name} size={32} color={icon.color} />
              </View>

              {/* Title */}
              <Text style={styles.title}>{title}</Text>

              {/* Message */}
              {message && <Text style={styles.message}>{message}</Text>}

              {/* Buttons */}
              <View style={styles.buttonsContainer}>
                {buttons.map((button, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.button,
                      button.style === "destructive" &&
                        styles.destructiveButton,
                      button.style === "cancel" && styles.cancelButton,
                      buttons.length === 1 && styles.singleButton,
                    ]}
                    onPress={() => handleButtonPress(button)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        button.style === "destructive" &&
                          styles.destructiveButtonText,
                        button.style === "cancel" && styles.cancelButtonText,
                      ]}
                    >
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  container: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    minWidth: 280,
    maxWidth: "90%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.dark.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h3,
    color: Colors.dark.text,
    textAlign: "center",
    marginBottom: Spacing.sm,
    fontWeight: "600",
  },
  message: {
    ...Typography.body,
    color: Colors.dark.secondary,
    textAlign: "center",
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  buttonsContainer: {
    flexDirection: "row",
    gap: Spacing.md,
    width: "100%",
  },
  button: {
    flex: 1,
    backgroundColor: Colors.dark.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
  },
  singleButton: {
    minWidth: 120,
  },
  cancelButton: {
    backgroundColor: Colors.dark.background,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  destructiveButton: {
    backgroundColor: "#ef4444",
  },
  buttonText: {
    ...Typography.body,
    color: "#ffffff",
    fontWeight: "600",
  },
  cancelButtonText: {
    color: Colors.dark.text,
  },
  destructiveButtonText: {
    color: "#ffffff",
  },
});
