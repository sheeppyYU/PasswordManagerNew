import React, { RefObject, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { ChevronRight, Plus, Check, X, AlertCircle } from 'lucide-react-native';

interface TypeItem {
  id: string;
  name: string;
}

interface BottomSheetFormProps {
  // refs & dropdown
  typeSelectorRef: RefObject<View>;
  isTypeDropdownVisible: boolean;
  handleTypeSelectorPress: () => void;

  // type data
  newPasswordType: string;
  defaultTypes: TypeItem[];
  customTypes: TypeItem[];
  getTypeIcon: (type: string) => JSX.Element;

  // form fields & handlers
  newPasswordTitle: string;
  handleTitleChange: (text: string) => void;
  newPasswordUsername: string;
  handleUsernameChange: (text: string) => void;
  newPasswordValue: string;
  handlePasswordChange: (text: string) => void;
  newPasswordNotes: string;
  setNewPasswordNotes: (text: string) => void;

  // submit
  handleAddPassword: () => void;
  
  // edit mode
  isEditing?: boolean;
  
  // 新增取消按鈕的處理函數
  onCancel?: () => void;
  
  // 深色模式
  isDarkMode?: boolean;
}

const BottomSheetForm: React.FC<BottomSheetFormProps> = ({
  typeSelectorRef,
  isTypeDropdownVisible,
  handleTypeSelectorPress,
  newPasswordType,
  defaultTypes,
  customTypes,
  getTypeIcon,
  newPasswordTitle,
  handleTitleChange,
  newPasswordUsername,
  handleUsernameChange,
  newPasswordValue,
  handlePasswordChange,
  newPasswordNotes,
  setNewPasswordNotes,
  handleAddPassword,
  isEditing = false,
  onCancel,
  isDarkMode = false,
}) => {
  // 錯誤狀態管理
  const [formErrors, setFormErrors] = useState<{
    title?: string;
    username?: string;
  }>({});

  // 找到當前選擇的類型名稱
  const selectedTypeName = React.useMemo(() => {
    const defaultType = defaultTypes.find(t => t.id === newPasswordType);
    if (defaultType) return defaultType.name;
    
    const customType = customTypes.find(t => t.id === newPasswordType);
    if (customType) return customType.name;
    
    return 'Website'; // 默認值
  }, [newPasswordType, defaultTypes, customTypes]);

  // 根據深色模式選擇顏色
  const colors = {
    background: isDarkMode ? '#18181A' : '#ffffff',
    cardBackground: isDarkMode ? 'rgba(30, 34, 51, 0.8)' : 'rgba(255, 255, 255, 0.5)',
    inputBackground: isDarkMode ? 'rgba(36, 40, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
    textPrimary: isDarkMode ? '#FFFFFF' : '#000000',
    textSecondary: isDarkMode ? '#D8D5D6' : 'rgba(60, 60, 67, 0.8)',
    placeholderText: isDarkMode ? '#6F6F6F' : 'rgba(60, 60, 67, 0.6)',
    borderColor: isDarkMode ? '#426F9B' : 'rgba(60, 60, 67, 0.2)',
    errorColor: '#FF3B30',
    requiredColor: isDarkMode ? '#ff79c6' : '#FF69B4',
    optionalColor: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : '#999',
  };

  // 必填欄位星號樣式
  const requiredMark = <Text style={{ color: colors.requiredColor, fontWeight: 'bold', marginLeft: 4 }}>*</Text>;
  const optionalText = <Text style={{ color: colors.optionalColor, fontSize: 12, fontWeight: '400', marginLeft: 4 }}></Text>;

  // 驗證表單並提交
  const validateAndSubmit = () => {
    const errors: {title?: string; username?: string} = {};
    
    if (!newPasswordTitle.trim()) {
      errors.title = '標題不能為空';
    }
    
    if (!newPasswordUsername.trim()) {
      errors.username = '使用者名稱不能為空';
    }
    
    // 更新錯誤狀態
    setFormErrors(errors);
    
    // 如果沒有錯誤，則提交表單
    if (Object.keys(errors).length === 0) {
      handleAddPassword();
    }
  };

  return (
    <View style={[
      styles.emptyCardContainer,
      { backgroundColor: colors.background }
    ]}>
      {/* 第一個方格：標題與類型 */}
      <View style={[
        styles.formGroup,
        { backgroundColor: colors.cardBackground, borderColor: colors.borderColor }
      ]}>
        <View style={styles.cardHeaderNew}>
          {/* 標題部分 */}
          <View style={[styles.labelContainer]}>
            <Text style={[styles.credentialLabel, { color: colors.textSecondary }]}>標題</Text>
            {requiredMark}
          </View>
          <View style={styles.credentialInputContainer}>
            <TextInput
              style={[
                styles.credentialInput, 
                styles.inputField,
                { 
                  backgroundColor: colors.inputBackground, 
                  borderColor: colors.borderColor,
                  color: colors.textPrimary 
                },
                formErrors.title ? styles.inputError : null
              ]}
              placeholder="標題 (如 Google)"
              placeholderTextColor={colors.placeholderText}
              value={newPasswordTitle}
              onChangeText={(text) => {
                handleTitleChange(text);
                if (formErrors.title) {
                  setFormErrors(prev => ({...prev, title: undefined}));
                }
              }}
            />
          </View>
          {formErrors.title ? (
            <View style={styles.errorContainer}>
              <AlertCircle size={14} color={colors.errorColor} />
              <Text style={[styles.errorText, { color: colors.errorColor }]}>{formErrors.title}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* 第二個方格：用戶名與密碼 */}
      <View style={[
        styles.formGroup,
        { backgroundColor: colors.cardBackground, borderColor: colors.borderColor }
      ]}>
        <View style={styles.cardBody}>
          {/* Username */}
          <View style={styles.credentialRow}>
            <View style={styles.labelContainer}>
              <Text style={[styles.credentialLabel, { color: colors.textSecondary }]}>使用者名稱</Text>
              {requiredMark}
            </View>
            <View style={styles.credentialInputContainer}>
              <TextInput
                style={[
                  styles.credentialInput, 
                  styles.inputField,
                  { 
                    backgroundColor: colors.inputBackground, 
                    borderColor: colors.borderColor,
                    color: colors.textPrimary 
                  },
                  formErrors.username ? styles.inputError : null
                ]}
                placeholder="user@example.com"
                placeholderTextColor={colors.placeholderText}
                value={newPasswordUsername}
                onChangeText={(text) => {
                  handleUsernameChange(text);
                  if (formErrors.username) {
                    setFormErrors(prev => ({...prev, username: undefined}));
                  }
                }}
                autoCapitalize="none"
              />
            </View>
            {formErrors.username ? (
              <View style={styles.errorContainer}>
                <AlertCircle size={14} color={colors.errorColor} />
                <Text style={[styles.errorText, { color: colors.errorColor }]}>{formErrors.username}</Text>
              </View>
            ) : null}
          </View>

          {/* Password */}
          <View style={styles.credentialRow}>
            <View style={styles.labelContainer}>
              <Text style={[styles.credentialLabel, { color: colors.textSecondary }]}>密碼</Text>
              {optionalText}
            </View>
            <View style={styles.credentialInputContainer}>
              <TextInput
                style={[
                  styles.credentialInput, 
                  styles.inputField,
                  { 
                    backgroundColor: colors.inputBackground, 
                    borderColor: colors.borderColor,
                    color: colors.textPrimary 
                  }
                ]}
                placeholder="••••••••••••"
                placeholderTextColor={colors.placeholderText}
                value={newPasswordValue}
                onChangeText={handlePasswordChange}
                secureTextEntry={false}
              />
            </View>
          </View>
        </View>
      </View>

      {/* 第三個方格：備註 */}
      <View style={[
        styles.formGroup,
        { backgroundColor: colors.cardBackground, borderColor: colors.borderColor }
      ]}>
        <View style={styles.labelContainer}>
          <Text style={[styles.credentialLabel, { color: colors.textSecondary }]}>備註</Text>
          {optionalText}
        </View>
        <View style={styles.credentialInputContainer}>
          <TextInput
            style={[
              styles.credentialInput, 
              styles.notesInput, 
              styles.inputField,
              { 
                backgroundColor: colors.inputBackground, 
                borderColor: colors.borderColor,
                color: colors.textPrimary,
                height: 120,
                textAlignVertical: "top"
              }
            ]}
            placeholder="輸入備註"
            placeholderTextColor={colors.placeholderText}
            value={newPasswordNotes}
            onChangeText={setNewPasswordNotes}
            multiline
            numberOfLines={6}
            blurOnSubmit={false}
            maxLength={500}
          />
        </View>
      </View>

      {/* 按鈕區域 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.cancelButton,
            isDarkMode && {
              backgroundColor: 'rgba(255, 59, 48, 0.2)',
              borderColor: 'rgba(255, 59, 48, 0.3)'
            }
          ]}
          onPress={onCancel}
        >
          <X size={16} color="#FF3B30" />
          <Text style={styles.cancelButtonText}>取消</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.submitButton}
          onPress={validateAndSubmit}
        >
          <Check size={16} color="#FFF" />
          <Text style={styles.submitButtonText}>{isEditing ? '儲存修改' : '新增密碼'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyCardContainer: {
    padding: 8,
  },
  formGroup: {
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(60, 60, 67, 0.1)',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderNew: {
    position: 'relative',
    paddingTop: 0,
  },
  cardBody: {
    padding: 0,
  },
  credentialRow: {
    marginBottom: 14,
    paddingHorizontal: 0,
  },
  credentialLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(67, 60, 60, 0.8)',
    marginBottom: 8,
  },
  credentialInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 0,
    marginBottom: 4,
  },
  credentialInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  inputField: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 10,
  },
  notesInput: {
    height: 120,
    paddingTop: 8,
    paddingBottom: 8,
    textAlignVertical: 'top',
    borderRadius: 8,
    padding: 8,
  },
  bottomButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.2)',
  },
  confirmButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 4,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(60, 60, 67, 0.8)',
    marginBottom: 6,
  },
  // 錯誤相關樣式
  inputError: {
    borderColor: '#FF3B30',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginLeft: 6,
  },
  
  // 按鈕區域樣式
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 8,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
  },
  submitButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#FF3B30',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default BottomSheetForm; 