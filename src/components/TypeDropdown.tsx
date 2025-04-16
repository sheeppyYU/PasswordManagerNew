import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface TypeDropdownProps {
  types: Array<{id: string, name: string, icon?: any}>;
  selectedType: string;
  onSelectType: (typeId: string) => void;
  onClose: () => void;
  position: {
    pageX: number;
    pageY: number;
    width: number;
    height: number;
  };
}

const TypeDropdown = React.memo(({ 
  types, 
  selectedType, 
  onSelectType,
  onClose,
  position
}: TypeDropdownProps) => {
  return (
    <View 
      style={{
        position: 'absolute',
        top: position.pageY + position.height,
        left: position.pageX,
        width: position.width,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(60, 60, 67, 0.2)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        maxHeight: 200,
        overflow: 'hidden',
        zIndex: 9999,
      }}
    >
      {types.slice(1).map((type, index) => (
        <TouchableOpacity
          key={type.id}
          style={[
            styles.typeDropdownItem,
            selectedType === type.id && styles.typeDropdownItemActive,
            index === types.length - 2 && { borderBottomWidth: 0 }
          ]}
          onPress={() => {
            onSelectType(type.id);
            onClose();
          }}
        >
          <View style={styles.typeDropdownIconContainer}>
            {type.icon && React.createElement(type.icon, {
              size: 18,
              color: selectedType === type.id ? '#FFFFFF' : '#007AFF'
            })}
          </View>
          <Text 
            style={[
              styles.typeDropdownItemText,
              selectedType === type.id && styles.typeDropdownItemTextActive
            ]}
          >
            {type.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  typeDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(60, 60, 67, 0.1)',
  },
  typeDropdownItemActive: {
    backgroundColor: '#007AFF',
  },
  typeDropdownIconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  typeDropdownItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333333',
    flex: 1,
    marginRight: 4,
  },
  typeDropdownItemTextActive: {
    color: '#FFFFFF',
  },
});

export default TypeDropdown; 