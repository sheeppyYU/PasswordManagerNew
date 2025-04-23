import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet, Keyboard } from 'react-native';
import { Plus, Lock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

interface TypeFilterProps {
  types: Array<{id: string, name: string, icon?: any}>;
  customTypes: Array<{id: string, name: string}>;
  selectedType: string;
  onSelectType: (typeId: string) => void;
  onAddCustomType: (typeName: string) => void;
  onLongPressType?: (type: {id: string, name: string, icon?: any}) => void;
  isDarkMode?: boolean;
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
  onAddCustomType,
  onLongPressType,
  isDarkMode = false
}: TypeFilterProps) => {
  const { t } = useTranslation();
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

  const isValidTypeNameLength = (text: string) => {
    const MAX_CHINESE_CHARS = 7;
    const MAX_ENGLISH_CHARS = 10;
    
    let chineseCount = 0;
    let englishCount = 0;
    
    for (let i = 0; i < text.length; i++) {
      const char = text.charAt(i);
      if (/[\u4e00-\u9fa5]/.test(char)) {
        chineseCount++;
      } else {
        englishCount++;
      }
    }
    
    return chineseCount <= MAX_CHINESE_CHARS && 
           englishCount <= MAX_ENGLISH_CHARS && 
           (chineseCount + englishCount/1.5) <= MAX_CHINESE_CHARS;
  };

  const handleAddType = () => {
    const trimmedName = state.newTypeName.trim();
    if (trimmedName && isValidTypeNameLength(trimmedName)) {
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
                isDarkMode && {
                  backgroundColor: 'rgba(66, 111, 155, 0.2)',
                  borderColor: '#426F9B'
                },
                selectedType === type.id && styles.typeButtonActive
              ]}
              onPress={() => {
                Keyboard.dismiss();
                onSelectType(type.id);
              }}
              onLongPress={() => onLongPressType && onLongPressType(type)}
              delayLongPress={500}
            >
              {TypeIcon ? (
                <TypeIcon size={14} color={selectedType === type.id ? "#FFFFFF" : (isDarkMode ? "#D8D5D6" : "#007AFF")} />
              ) : null}
              <Text 
                style={[
                  styles.typeButtonText,
                  isDarkMode && { color: '#D8D5D6' },
                  selectedType === type.id && styles.typeButtonTextActive
                ]}
              >
                {type.name}
              </Text>
            </TouchableOpacity>
          );
        })}
        
        <TouchableOpacity
          style={[
            styles.addTypeButton,
            isDarkMode && {
              backgroundColor: 'rgba(66, 111, 155, 0.2)',
              borderColor: '#426F9B'
            }
          ]}
          onPress={() => setState(prev => ({ ...prev, isAddingType: true }))}
        >
          <Plus size={14} color={isDarkMode ? "#D8D5D6" : "#007AFF"} />
          <Text style={[styles.addTypeButtonText, isDarkMode && { color: '#D8D5D6' }]}>{t('types.addType')}</Text>
        </TouchableOpacity>
      </ScrollView>
      
      {state.isAddingType && (
        <View style={[
          styles.addTypeContainer,
          isDarkMode && { backgroundColor: 'rgba(66, 111, 155, 0.1)' }
        ]}>
          <TextInput
            style={[
              styles.addTypeInput,
              isDarkMode && { 
                backgroundColor: '#18181A',
                borderColor: '#426F9B',
                color: '#D8D5D6'
              },
              { fontSize: 14, textAlign: 'left', paddingHorizontal: 12 }
            ]}
            placeholder={t('types.newTypeName')}
            placeholderTextColor={isDarkMode ? "#6F6F6F" : "rgba(60, 60, 67, 0.6)"}
            value={state.newTypeName}
            onChangeText={(text) => {
              if (isValidTypeNameLength(text)) {
                setState(prev => ({ ...prev, newTypeName: text }));
              }
            }}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleAddType}
            enablesReturnKeyAutomatically={true}
            maxLength={10}
            numberOfLines={1}
            multiline={false}
          />
          <View style={styles.addTypeActions}>
            <TouchableOpacity
              style={[
                styles.addTypeActionButton,
                isDarkMode && { borderColor: '#426F9B' }
              ]}
              onPress={() => {
                Keyboard.dismiss();
                setState({
                  isAddingType: false,
                  newTypeName: '',
                });
              }}
            >
              <Text style={[
                styles.addTypeActionText, 
                {color: '#FF3B30'},
                {fontSize: 13, paddingHorizontal: 5}
              ]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.addTypeActionButton,
                isDarkMode && { borderColor: '#426F9B' }
              ]}
              onPress={handleAddType}
            >
              <Text style={[
                styles.addTypeActionText, 
                isDarkMode && { color: '#D8D5D6' },
                {fontSize: 13, paddingHorizontal: 5}
              ]}>{t('common.ok')}</Text>
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
    paddingVertical: 8,
    borderRadius: 14,
    marginRight: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minWidth: 80,
    width: 'auto',
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
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    lineHeight: 16,
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
    textAlignVertical: 'center',
    includeFontPadding: false,
    lineHeight: 16,
  },
  addTypeContainer: {
    marginTop: 8,
    marginHorizontal: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.2)',
    width: 'auto',
  },
  addTypeInput: {
    minHeight: 40,
    borderWidth: 1,
    borderColor: 'rgba(60, 60, 67, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#000',
    flexDirection: 'row',
    flexWrap: 'wrap',
    textAlignVertical: 'center',
    width: '100%',
  },
  addTypeActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    flexWrap: 'wrap',
  },
  addTypeActionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginLeft: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  addTypeActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    textAlign: 'center',
  },
});

export default TypeFilter; 