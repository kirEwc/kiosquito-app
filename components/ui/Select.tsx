import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';

export interface SelectOption {
  label: string;
  value: any;
  subtitle?: string;
}

interface SelectProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: any;
  onSelect: (option: SelectOption) => void;
  style?: any;
  disabled?: boolean;
}

export function Select({
  label,
  placeholder = "Seleccionar...",
  options,
  value,
  onSelect,
  style,
  disabled = false,
}: SelectProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find(option => option.value === value);

  const handleSelect = (option: SelectOption) => {
    onSelect(option);
    setModalVisible(false);
  };

  const renderOption = ({ item }: { item: SelectOption }) => (
    <TouchableOpacity
      style={[
        styles.option,
        item.value === value && styles.selectedOption,
      ]}
      onPress={() => handleSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.optionContent}>
        <Text style={[
          styles.optionText,
          item.value === value && styles.selectedOptionText,
        ]}>
          {item.label}
        </Text>
        {item.subtitle && (
          <Text style={[
            styles.optionSubtitle,
            item.value === value && styles.selectedOptionSubtitle,
          ]}>
            {item.subtitle}
          </Text>
        )}
      </View>
      {item.value === value && (
        <Ionicons name="checkmark" size={20} color={Colors.dark.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity
        style={[
          styles.selector,
          disabled && styles.disabled,
        ]}
        onPress={() => !disabled && setModalVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.selectorContent}>
          <Text style={[
            styles.selectorText,
            !selectedOption && styles.placeholder,
          ]}>
            {selectedOption ? selectedOption.label : placeholder}
          </Text>
          {selectedOption?.subtitle && (
            <Text style={styles.selectorSubtitle}>
              {selectedOption.subtitle}
            </Text>
          )}
        </View>
        <Ionicons
          name="chevron-down"
          size={20}
          color={disabled ? Colors.dark.border : Colors.dark.icon}
        />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {label || 'Seleccionar opción'}
            </Text>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={Colors.dark.text} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={options}
            renderItem={renderOption}
            keyExtractor={(item, index) => `${item.value}-${index}`}
            style={styles.optionsList}
            showsVerticalScrollIndicator={false}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.body,
    color: Colors.dark.text,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.dark.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    minHeight: 50,
  },
  disabled: {
    opacity: 0.5,
  },
  selectorContent: {
    flex: 1,
  },
  selectorText: {
    ...Typography.body,
    color: Colors.dark.text,
  },
  selectorSubtitle: {
    ...Typography.caption,
    color: Colors.dark.secondary,
    marginTop: 2,
  },
  placeholder: {
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
  closeButton: {
    padding: Spacing.xs,
  },
  optionsList: {
    flex: 1,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  selectedOption: {
    backgroundColor: Colors.dark.primary + '20',
  },
  optionContent: {
    flex: 1,
  },
  optionText: {
    ...Typography.body,
    color: Colors.dark.text,
  },
  selectedOptionText: {
    color: Colors.dark.primary,
    fontWeight: '600',
  },
  optionSubtitle: {
    ...Typography.caption,
    color: Colors.dark.secondary,
    marginTop: 2,
  },
  selectedOptionSubtitle: {
    color: Colors.dark.primary,
  },
});