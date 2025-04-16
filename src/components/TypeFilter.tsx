import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet, Keyboard } from 'react-native';
import { Plus, Lock } from 'lucide-react-native';

interface TypeFilterProps {
  types: Array<{id: string, name: string, icon?: any}>;
  customTypes: Array<{id: string, name: string}>;
  selectedType: string;
  onSelectType: (typeId: string) => void;
  onAddCustomType: (typeName: string) => void;
}

interface TypeFilterState {
  isAddingType: boolean;
  newTypeName: string;
}

const TypeFilter = React.memo(({ 
  types, 
  customTypes, 
  selectedType, 
  onSelectType, 
  onAddCustomType 
}: TypeFilterProps) => {
  const [state, setState] = useState<TypeFilterState>({
    isAddingType: false,
    newTypeName: '',
  });

  const allTypes = [
    ...types,
    ...customTypes.map(type => ({
      id: type.id,
      name: type.name,
      icon: Lock
    }))
  ];

  const handleAddType = () => {
    const trimmedName = state.newTypeName.trim();
    if (trimmedName) {
      onAddCustomType(trimmedName);
      setState({
        isAddingType: false,
        newTypeName: '',
      });
      Keyboard.dismiss();
    }
  };

  return (
    <View style={styles.typeFilterWrapper}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.typeFilterContainer}
        keyboardShouldPersistTaps="always"
      >
        {allTypes.map(type => {
          const TypeIcon = type.icon;
          return (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeButton,
                selectedType === type.id && styles.typeButtonActive
              ]}
              onPress={() => onSelectType(type.id)}
            >
              {TypeIcon ? (
                <TypeIcon size={14} color={selectedType === type.id ? "#FFFFFF" : "#007AFF"} />
              ) : null}
              <Text 
                style={[
                  styles.typeButtonText,
                  selectedType === type.id && styles.typeButtonTextActive
                ]}
              >
                {type.name}
              </Text>
            </TouchableOpacity>
          );
        })}
        
        <TouchableOpacity
          style={styles.addTypeButton}
          onPress={() => setState(prev => ({ ...prev, isAddingType: true }))}
        >
          <Plus size={14} color="#007AFF" />
          <Text style={styles.addTypeButtonText}>Add Type</Text>
        </TouchableOpacity>
      </ScrollView>
      
      {state.isAddingType && (
        <View style={styles.addTypeContainer}>
          <TextInput
            style={styles.addTypeInput}
            placeholder="New type name"
            value={state.newTypeName}
            onChangeText={(text) => setState(prev => ({ ...prev, newTypeName: text }))}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleAddType}
            enablesReturnKeyAutomatically={true}
          />
          <View style={styles.addTypeActions}>
            <TouchableOpacity
              style={styles.addTypeActionButton}
              onPress={() => {
                Keyboard.dismiss();
                setState({
                  isAddingType: false,
                  newTypeName: '',
                });
              }}
            >
              <Text style={[styles.addTypeActionText, {color: '#FF3B30'}]}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addTypeActionButton}
              onPress={handleAddType}
            >
              <Text style={styles.addTypeActionText}>新增</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  typeFilterWrapper: {
    marginBottom: 16,
  },
  typeFilterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 4,
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  addTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.2)',
    borderStyle: 'dashed',
  },
  addTypeButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 4,
  },
  addTypeContainer: {
    marginTop: 8,
    marginHorizontal: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.2)',
  },
  addTypeInput: {
    height: 40,
    borderWidth: 1,
    borderColor: 'rgba(60, 60, 67, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#000',
  },
  addTypeActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  addTypeActionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 8,
  },
  addTypeActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
});

export default TypeFilter; 