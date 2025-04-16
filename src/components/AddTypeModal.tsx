import React from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, TouchableWithoutFeedback, StyleSheet } from 'react-native';

interface AddTypeModalProps {
  isVisible: boolean;
  newTypeName: string;
  onChangeText: (text: string) => void;
  onAddType: () => void;
  onCancel: () => void;
}

const AddTypeModal = React.memo(({ 
  isVisible, 
  newTypeName, 
  onChangeText, 
  onAddType, 
  onCancel
}: AddTypeModalProps) => {
  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <View style={styles.addTypeModalContainer}>
              <Text style={styles.addTypeModalTitle}>新增類型</Text>
              <TextInput
                style={styles.addTypeModalInput}
                placeholder="輸入類型名稱"
                value={newTypeName}
                onChangeText={onChangeText}
                autoFocus={true}
                returnKeyType="done"
                onSubmitEditing={() => {
                  if (newTypeName.trim()) {
                    onAddType();
                  }
                }}
              />
              <View style={styles.addTypeModalActions}>
                <TouchableOpacity
                  style={[styles.addTypeModalButton, styles.addTypeModalButtonCancel]}
                  onPress={onCancel}
                >
                  <Text style={[styles.addTypeModalButtonText, { color: '#FF3B30' }]}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.addTypeModalButton, styles.addTypeModalButtonConfirm]}
                  onPress={onAddType}
                >
                  <Text style={[styles.addTypeModalButtonText, { color: '#007AFF' }]}>新增</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
});

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  addTypeModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addTypeModalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
  },
  addTypeModalInput: {
    borderWidth: 1,
    borderColor: 'rgba(60, 60, 67, 0.3)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  addTypeModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  addTypeModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  addTypeModalButtonCancel: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  addTypeModalButtonConfirm: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  addTypeModalButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default AddTypeModal; 