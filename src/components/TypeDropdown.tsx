import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TouchableWithoutFeedback, Dimensions, Platform } from 'react-native';

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
  isDarkMode?: boolean;
}

const TypeDropdown = React.memo(({ 
  types, 
  selectedType, 
  onSelectType,
  onClose,
  position,
  isDarkMode = false
}: TypeDropdownProps) => {
  // 處理選擇類型的函數
  const handleSelectType = (typeId: string) => {
    setTimeout(() => {
      onSelectType(typeId);
      onClose();
    }, 0);
  };

  const { width: screenWidth } = Dimensions.get('window');
  
  // 使用按鈕的寬度作為下拉選單寬度，而非固定值
  const dropdownWidth = position.width;
  
  // 計算選單左側位置，確保不會超出螢幕
  const leftPosition = Math.min(
    position.pageX,
    screenWidth - dropdownWidth - 10
  );
  
  // 深色模式的顏色
  const colors = {
    background: isDarkMode ? 'rgba(30, 30, 47, 0.95)' : '#FFFFFF',
    border: isDarkMode ? 'rgba(78, 81, 102, 0.3)' : 'rgba(60, 60, 67, 0.2)',
    itemBorder: isDarkMode ? 'rgba(78, 81, 102, 0.3)' : 'rgba(60, 60, 67, 0.1)',
    text: isDarkMode ? '#E0E0E0' : '#333333',
    activeBackground: isDarkMode ? '#4169E1' : '#007AFF',
    activeText: '#FFFFFF',
    icon: isDarkMode ? '#4DA6FF' : '#007AFF',
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* 透明覆蓋層 - 點擊即可關閉 */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      {/* 下拉列表 */}
      <View 
        style={{
          position: 'absolute',
          top: position.pageY + position.height,
          left: leftPosition,
          width: dropdownWidth,
          backgroundColor: colors.background,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
          maxHeight: 240,
          overflow: 'hidden',
          zIndex: 9999,
        }}
      >
        <ScrollView 
          showsVerticalScrollIndicator={true}
          style={{ maxHeight: 240 }}
          contentContainerStyle={{ flexGrow: 0 }}
          keyboardShouldPersistTaps="always"
        >
          {types.map((type, index) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeDropdownItem,
                { borderBottomColor: colors.itemBorder },
                selectedType === type.id && [
                  styles.typeDropdownItemActive,
                  { backgroundColor: colors.activeBackground }
                ],
                index === types.length - 1 && { borderBottomWidth: 0 }
              ]}
              onPress={() => handleSelectType(type.id)}
              activeOpacity={0.7}
            >
              <View style={styles.typeDropdownIconContainer}>
                {type.icon && React.createElement(type.icon, {
                  size: 18,
                  color: selectedType === type.id ? colors.activeText : colors.icon
                })}
              </View>
              <Text 
                style={[
                  styles.typeDropdownItemText,
                  { color: colors.text },
                  selectedType === type.id && styles.typeDropdownItemTextActive
                ]}
              >
                {type.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  typeDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  typeDropdownItemActive: {
    // 動態設置背景色
  },
  typeDropdownIconContainer: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  typeDropdownItemText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginRight: 4,
    flexWrap: 'wrap',
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : undefined,
    textAlignVertical: 'center',
    includeFontPadding: false,
    lineHeight: 18,
  },
  typeDropdownItemTextActive: {
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : undefined,
  },
});

export default TypeDropdown; 