import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from "react"
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  FlatList,
  Platform,
  Animated,
  useWindowDimensions,
  KeyboardAvoidingView,
  Modal,
  TouchableWithoutFeedback,
  Pressable,
  Keyboard,
  LayoutChangeEvent,
  LayoutRectangle,
  Alert,
  Switch,
  Clipboard,
  Dimensions,
  SectionList,
  ScrollView,
  Share,
  GestureResponderEvent,
  PanResponder
} from "react-native"
import { 
  Search, 
  Plus, 
  Copy, 
  Eye, 
  EyeOff, 
  ChevronRight, 
  Lock,
  Globe,
  CreditCard,
  Smartphone,
  MessageCircle,
  X,
  LogOut,
  Mail,
  FolderLock,
  Moon,
  Sun,
  Save,
  Download,
  Settings
} from "lucide-react-native"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import { StatusBar } from "expo-status-bar"
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'
import TypeFilter from "../components/TypeFilter";
import AddTypeModal from "../components/AddTypeModal";
import SectionHeader from "../components/SectionHeader";
import TypeDropdown from "../components/TypeDropdown";
import PasswordCard from "../components/PasswordCard";
import { useCopyNotification } from "../hooks/useCopyNotification";
import BottomSheetForm from "../components/BottomSheetForm";
import useDropdown from "../hooks/useDropdown";
import useBottomSheet from "../hooks/useBottomSheet";
import usePasswordsDb from "../hooks/usePasswordsDb";
import { GroupedPasswords } from "../hooks/usePasswords";
import { CustomType } from "../hooks/usePasswordsDb";
import styles from '../styles/homeStyles';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import CopyNotification from "../components/CopyNotification";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import CustomAlert from "../components/CustomAlert";
import * as CryptoJS from 'crypto-js';
import * as Random from 'expo-random';
import JSZip from 'jszip';
import { loadHiddenDefaultTypes, saveHiddenDefaultTypes } from '../helpers/hiddenDefaultTypes';
import PagerView from 'react-native-pager-view';

// 使用 expo-random 為 CryptoJS 提供安全隨機數
(CryptoJS as any).lib.WordArray.random = function (n: number) {
  const bytes = Random.getRandomBytes(n);
  return (CryptoJS as any).lib.WordArray.create(bytes);
};

// 深色模式存儲鍵
const DARK_MODE_STORAGE_KEY = 'passwordManager_darkMode';

// 將 TYPES 改為函數，使用時可以傳入 t 函數
const getDefaultTypes = (t: (key: string, options?: any) => string) => [
  { id: 'all', name: t('home.allTypes'), icon: Lock },
  { id: 'mail', name: t('types.mail'), icon: Mail },
  { id: 'social', name: t('types.social'), icon: MessageCircle },
  { id: 'app', name: t('types.app'), icon: Smartphone },
  { id: 'bank', name: t('types.bank'), icon: CreditCard },
  { id: 'other', name: t('types.other'), icon: FolderLock, hidden: true }
];

// Type for password item
export interface PasswordItem {
  id: string;
  title: string;
  username: string;
  password: string;
  category: string;
  type: string;
  notes: string;
  favorite: boolean;
}

// 添加刪除類型確認對話框的介面
interface DeleteTypeConfirmProps {
  isVisible: boolean;
  typeName: string;
  onCancel: () => void;
  onConfirm: (moveToAllTypes: boolean) => void;
  isDarkMode: boolean; // 添加深色模式屬性
}

// 修改DeleteTypeConfirm組件，添加useEffect確保每次對話框打開時都重置勾選狀態
const DeleteTypeConfirm = React.memo(({
  isVisible,
  typeName,
  onCancel,
  onConfirm,
  isDarkMode // 接收深色模式參數
}: DeleteTypeConfirmProps) => {
  const { t } = useTranslation();
  const [moveToAllTypes, setMoveToAllTypes] = useState(true);
  
  // 添加useEffect，確保每次對話框打開時重設狀態
  useEffect(() => {
    if (isVisible) {
      setMoveToAllTypes(true); // 每次對話框顯示時重置為勾選狀態
    }
  }, [isVisible]);
  
  // 深色模式樣式
  const containerStyle = {
    ...styles.deleteTypeModalContainer,
    backgroundColor: isDarkMode ? '#18181A' : '#FFFFFF'
  };
  
  const titleStyle = {
    ...styles.deleteTypeModalTitle,
    color: isDarkMode ? '#FFFFFF' : '#000'
  };
  
  const descriptionStyle = {
    ...styles.deleteTypeModalDescription,
    color: isDarkMode ? '#FFFFFF' : '#333'
  };
  
  const moveToAllTypesTextStyle = {
    ...styles.moveToAllTypesText,
    color: isDarkMode ? '#FFFFFF' : '#333'
  };
  
  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.deleteTypeModalOverlay}>
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <View style={containerStyle}>
              <Text style={titleStyle}>{t('types.deleteType')}</Text>
              <Text style={descriptionStyle}>
                {t('types.deleteTypeConfirm', { name: typeName })}
              </Text>
              
              <View style={styles.moveToAllTypesContainer}>
                <Switch
                  value={moveToAllTypes}
                  onValueChange={setMoveToAllTypes}
                  trackColor={{ false: "#767577", true: "#81b0ff" }}
                  thumbColor={moveToAllTypes ? "#007AFF" : "#f4f3f4"}
                />
                <Text style={moveToAllTypesTextStyle}>
                  {t('types.moveToOther')}
                </Text>
              </View>
              
              <Text style={styles.warningText}>
                {!moveToAllTypes ? t('types.deleteWarning') : ""}
              </Text>
              
              <View style={styles.deleteTypeModalActions}>
                <TouchableOpacity
                  style={[styles.deleteTypeModalButton, styles.deleteTypeModalButtonCancel]}
                  onPress={onCancel}
                >
                  <Text style={[styles.deleteTypeModalButtonText, { color: '#007AFF' }]}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.deleteTypeModalButton, styles.deleteTypeModalButtonDelete]}
                  onPress={() => onConfirm(moveToAllTypes)}
                >
                  <Text style={[styles.deleteTypeModalButtonText, { color: '#FFFFFF' }]}>{t('common.delete')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
});

// 全局函數用於顯示複製成功提示，避免在PasswordCard中引用外部狀態
let showCopyNotificationFunc: (text: string) => void;
let handleDeletePasswordGlobal: (id: string, title: string) => void;
let getTypeIconFunc: (type: string) => JSX.Element;

// 添加備份數據的介面定義
interface BackupData {
  passwords: PasswordItem[];
  customTypes: CustomType[];
  backupDate: string;
  appVersion: string;
  isEncrypted?: boolean;
}

// 定義按鈕類型
interface AlertButton {
  text: string;
  onPress: () => void;
  type?: 'default' | 'cancel' | 'destructive';
}

export default function PasswordManagerHome() {
  const { t } = useTranslation();
  const { width, height, fontScale } = useWindowDimensions()
  const baseScale = Math.min(width / 375, height / 812)
  const ds = (size: number) => size * baseScale
  const df = (size: number) => size * Math.min(baseScale, fontScale * 1.2)
  const insets = useSafeAreaInsets(); // 獲取安全區域的 insets
  const router = useRouter(); // 添加路由
  
  // 深色模式狀態
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // 添加自定義 Alert 狀態
  const [customAlertConfig, setCustomAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons: AlertButton[];
    isDarkMode: boolean;
  }>({
    visible: false,
    title: '',
    message: '',
    buttons: [],
    isDarkMode: false
  });

  // 添加類型刪除相關狀態
  const [typeToDelete, setTypeToDelete] = useState<{id: string, name: string} | null>(null);
  const [isDeleteTypeModalVisible, setIsDeleteTypeModalVisible] = useState(false);
  const [isAddTypeModalVisible, setIsAddTypeModalVisible] = useState(false);
  
  // 關閉自定義 Alert
  const hideCustomAlert = () => {
    setCustomAlertConfig(prev => ({...prev, visible: false}));
  };

  // 顯示自定義 Alert 的輔助函數
  const showCustomAlert = (title: string, message: string, buttons: AlertButton[]) => {
    setCustomAlertConfig({
      visible: true,
      title,
      message,
      buttons,
      isDarkMode
    });
  };
  
  // 初始化時從 AsyncStorage 獲取深色模式設置
  useEffect(() => {
    const loadDarkModePreference = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(DARK_MODE_STORAGE_KEY);
        if (savedMode !== null) {
          setIsDarkMode(savedMode === 'true');
        }
      } catch (error) {
        console.log('無法加載深色模式設置', error);
      }
    };
    
    loadDarkModePreference();
  }, []);
  
  // 切換深色模式
  const toggleDarkMode = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    
    // 保存設置到 AsyncStorage
    try {
      await AsyncStorage.setItem(DARK_MODE_STORAGE_KEY, newMode.toString());
    } catch (error) {
      console.log('無法保存深色模式設置', error);
    }
  };

  // 初始化 TYPES
  const TYPES = useMemo(() => getDefaultTypes(t), [t]);

  // 添加可用預設類型的狀態
  const [availableDefaultTypes, setAvailableDefaultTypes] = useState([...TYPES]);

  // 修改初始化類型列表，確保 "all" 對應到 i18n 的 "全部類別"
  const initializeDefaultTypes = useCallback(async () => {
    // 載入已被隱藏的預設類型
    const hiddenTypeIds = await loadHiddenDefaultTypes();
    
    const allDefaultTypes = TYPES.map(type => {
      if (type.id === 'all') {
        return {
          ...type,
          name: t('home.allTypes'), // 使用 i18n 的翻譯
        };
      }
      return type;
    });
    
    // 過濾掉已經被隱藏的預設類型
    const filteredDefaultTypes = allDefaultTypes.filter(
      type => !hiddenTypeIds.includes(type.id) || type.id === 'all' || type.id === 'other'
    );
    
    setAvailableDefaultTypes(filteredDefaultTypes);
  }, [t]); // 添加 t 作為依賴

  // 在語言變更時重新初始化類型列表
  useEffect(() => {
    initializeDefaultTypes();
  }, [initializeDefaultTypes, i18n.language]); // 添加 i18n.language 依賴以在語言變更時更新

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  // 添加滑動頁面的參考
  const sectionListRef = useRef<SectionList>(null);
  // 添加搜尋輸入欄的參考
  const searchInputRef = useRef<TextInput>(null);
  // 添加 PagerView 的參考
  const pagerViewRef = useRef<PagerView>(null);
  
  const {
    ready: dbReady,
    passwords,
    addPassword: addPasswordDb,
    deletePassword: deletePasswordDb,
    updatePassword: updatePasswordDb,
    customTypes: dbCustomTypes,
    addCustomType: addCustomTypeDb,
    deleteCustomType: deleteCustomTypeDb,
    resetDatabase,
    reloadTypes
  } = usePasswordsDb();
  
  const {
    visible: showCopiedNotification,
    message: copiedText,
    fadeAnim: copiedAnimation,
    onCopyNotification: showCopy,
  } = useCopyNotification();
  const [newTypeName, setNewTypeName] = useState('');
  const [isAddingType, setIsAddingType] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  
  // Bottom sheet form state
  const [newPasswordTitle, setNewPasswordTitle] = useState('');
  const [newPasswordUsername, setNewPasswordUsername] = useState('');
  const [newPasswordValue, setNewPasswordValue] = useState('');
  // 動態設置初始類型（預設為 'mail'，如果可用；否則選擇第一個可用類型或 'other'）
  const [newPasswordType, setNewPasswordType] = useState(() => {
    const mailType = TYPES.find(t => t.id === 'mail' && !t.hidden);
    if (mailType) return 'mail';
    // 找第一個非 'all' 且非隱藏的類型
    const firstType = TYPES.find(t => t.id !== 'all' && !t.hidden)?.id;
    return firstType || 'other';
  });
  const [newPasswordNotes, setNewPasswordNotes] = useState('');
  
  // 添加一個輔助函數來根據類型ID獲取類型名稱
  const getTypeName = useCallback((typeId: string) => {
    if (typeId === 'all') {
      return t('home.allTypes');
    }
    
    // 先檢查是否是預設類型
    const defaultType = availableDefaultTypes.find(t => t.id === typeId);
    if (defaultType) {
      // 如果是預設類型，使用 t 進行翻譯
      return t(`types.${typeId}`);
    }
    
    // 檢查是否是自定義類型
    const customType = dbCustomTypes.find(t => t.id === typeId);
    if (customType) {
      return customType.name;
    }
    
    // 預設返回 "其他"
    return t('types.other');
  }, [availableDefaultTypes, dbCustomTypes, t]);
  
  // 添加類型選擇下拉選單的位置狀態
  const {
    isVisible: isTypeDropdownVisible,
    position: typeBtnMeasure,
    toggle: toggleTypeDropdown,
    close: closeTypeDropdown,
    setPosition: setTypeBtnMeasure,
  } = useDropdown(false);
  
  // 獲取屏幕尺寸
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  // 計算最大顯示項目數
  const MAX_VISIBLE_ITEMS = 5;
  const ITEM_HEIGHT = 50;
  
  // 確保 typeSelectorRef 仍存在
  const typeSelectorRef = useRef<View>(null);

  // 監聽鍵盤事件，確保鍵盤彈出時關閉下拉選單
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        closeTypeDropdown();
      }
    );
    
    return () => {
      keyboardDidShowListener.remove();
    };
  }, [closeTypeDropdown]);

  // 編輯密碼狀態
  const [isEditing, setIsEditing] = useState(false);
  const [editingPassword, setEditingPassword] = useState<PasswordItem | null>(null);
  
  // Reset form fields (提前宣告，供 useBottomSheet 回呼)
  const resetNewPasswordForm = () => {
    // 只有在非編輯模式下才重置表單
    if (!isEditing) {
    setNewPasswordTitle('');
    setNewPasswordUsername('');
    setNewPasswordValue('');
    // 選擇第一個可用的類型作為預設值，而不是硬編碼為'mail'
    const firstAvailableType = availableDefaultTypes.find(t => !t.hidden && t.id !== 'all')?.id || 'other';
    setNewPasswordType(firstAvailableType);
    setNewPasswordNotes('');
    }
    // 確保下拉式選單狀態被重置
    closeTypeDropdown();
  };
  
  // 使用 useBottomSheet Hook
  const {
    isVisible: isBottomSheetVisible,
    animation: bottomSheetAnimation,
    panHandlers,
    show: showBottomSheet,
    hide: hideBottomSheet,
    toggle: toggleBottomSheet,
  } = useBottomSheet(closeTypeDropdown, resetNewPasswordForm);
  
  // 設置新增頁面的類型選擇，根據當前選中的類型
  const setupNewPasswordType = useCallback(() => {
    // 如果是編輯模式，不需要修改類型
    if (isEditing) return;
    
    // 處理邏輯：
    // 1. 如果當前選擇的不是"all"且是有效類型，則使用當前選擇的類型
    // 2. 否則選擇第一個可用的非"all"類型
    
    if (selectedType !== 'all') {
      // 檢查默認類型（考慮 hidden 屬性）和自定義類型（沒有 hidden 屬性）
      const isTypeAvailable = 
        availableDefaultTypes.some(t => t.id === selectedType && !t.hidden) || 
        dbCustomTypes.some(t => t.id === selectedType);
        
      if (isTypeAvailable) {
        setNewPasswordType(selectedType);
      return;
      }
    }
    
    // 未選特定類型或選中類型不可用，則選第一個可用的非"all"類型
    const firstAvailableType = availableDefaultTypes
      .find(t => !t.hidden && t.id !== 'all')?.id || 'other';
    setNewPasswordType(firstAvailableType);
  }, [selectedType, availableDefaultTypes, dbCustomTypes, isEditing]);
  
  // 修改底部表單切換函數，加入設置類型的邏輯
  const handleToggleBottomSheet = useCallback(() => {
    // 先關閉鍵盤，避免鍵盤事件循環造成閃爍問題
    Keyboard.dismiss();
    
    // 等待鍵盤關閉後再執行其他操作
    setTimeout(() => {
      // 先設置類型，再切換表單
      setupNewPasswordType();
      toggleBottomSheet();
    }, 100);
  }, [setupNewPasswordType, toggleBottomSheet]);
  
  // 編輯密碼處理
  const handleEditPassword = useCallback((passwordItem: PasswordItem) => {
    // 設置編輯狀態與表單值
    setEditingPassword(passwordItem);
    setIsEditing(true);
    setNewPasswordTitle(passwordItem.title);
    setNewPasswordUsername(passwordItem.username);
    setNewPasswordValue(passwordItem.password);
    setNewPasswordType(passwordItem.type);
    setNewPasswordNotes(passwordItem.notes || '');

    // 僅在底部表單尚未顯示時再開啟，避免重複觸發動畫
    if (!isBottomSheetVisible) {
      showBottomSheet();
    }
  }, [isBottomSheetVisible, showBottomSheet]);
  
  // 在這裡先定義 handleUpdatePassword
  const handleUpdatePassword = useCallback(() => {
    if (!editingPassword) return;
    
    if (!newPasswordTitle.trim() || !newPasswordUsername.trim()) {
      Alert.alert(t('common.error'), t('passwordForm.fillRequired'));
      return;
    }
    
    // 獲取類型名稱
    const typeName = getTypeName(newPasswordType);
    
    // 如果標題是空的，則使用類型名稱作為默認標題
    const finalTitle = newPasswordTitle.trim() || typeName;
    
    const updatedPassword = {
      ...editingPassword,
      title: finalTitle,
      username: newPasswordUsername,
      password: newPasswordValue || '',
      type: newPasswordType,
      notes: newPasswordNotes
    };
    
    updatePasswordDb(updatedPassword);
    
    // 重置表單
    setNewPasswordTitle('');
    setNewPasswordUsername('');
    setNewPasswordValue('');
    // 選擇第一個可用的類型作為預設值
    const firstAvailableType = availableDefaultTypes.find(t => !t.hidden && t.id !== 'all')?.id || 'other';
    setNewPasswordType(firstAvailableType);
    setNewPasswordNotes('');
    setIsEditing(false);
    setEditingPassword(null);
    
    // 關閉底部表單
    hideBottomSheet();
  }, [
    editingPassword,
    newPasswordTitle,
    newPasswordUsername,
    newPasswordValue,
    newPasswordType,
    newPasswordNotes,
    updatePasswordDb,
    hideBottomSheet,
    getTypeName,
    availableDefaultTypes,
    t
  ]);
  
  // 處理添加或更新密碼
  const handleAddOrUpdatePassword = useCallback(() => {
    if (isEditing && editingPassword) {
      handleUpdatePassword();
    } else {
      handleAddPassword();
    }
  }, [isEditing, editingPassword, handleUpdatePassword]);
  
  // 關閉底部表單時重置編輯狀態
  const handleBottomSheetClose = useCallback(() => {
    setIsEditing(false);
    setEditingPassword(null);
    setNewPasswordTitle('');
    setNewPasswordUsername('');
    setNewPasswordValue('');
    // 選擇第一個可用的類型作為預設值
    const firstAvailableType = availableDefaultTypes.find(t => !t.hidden && t.id !== 'all')?.id || 'other';
    setNewPasswordType(firstAvailableType);
    setNewPasswordNotes('');
  }, [availableDefaultTypes]);
  
  // 刪除密碼函數（必須在首次使用之前定義）
  const handleDeletePassword = useCallback((passwordId: string, title: string) => {
    showCustomAlert(
      t('passwordCard.confirmDelete'),
      t('passwordCard.confirmDeleteMessage', { title }),
      [
        { 
          text: t('common.cancel'), 
          onPress: hideCustomAlert,
          type: 'cancel'
        },
        {
          text: t('common.delete'),
          onPress: () => {
            hideCustomAlert();
            deletePasswordDb(passwordId);
          },
          type: 'destructive'
        }
      ]
    );
  }, [deletePasswordDb, t, isDarkMode, hideCustomAlert, showCustomAlert]);
  
  // 設置全局函數引用與清理
  useEffect(() => {
    handleDeletePasswordGlobal = handleDeletePassword;

    return () => {
      if (isBottomSheetVisible) {
        handleBottomSheetClose();
      }
    };
  }, [isBottomSheetVisible, handleBottomSheetClose]);
  
  // ---------- 派生資料：搜尋 & 類型篩選 ----------
  const filteredPasswords = useMemo(() => {
    return passwords.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.notes.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedType === 'all' || item.type === selectedType;
    return matchesSearch && matchesType;
  });
  }, [passwords, searchQuery, selectedType]);

  const groupedPasswords = useMemo<GroupedPasswords>(() => {
    return filteredPasswords.reduce<GroupedPasswords>((groups, pwd) => {
      if (!groups[pwd.type]) groups[pwd.type] = [];
      groups[pwd.type].push(pwd);
    return groups;
  }, {});
  }, [filteredPasswords]);

  // 更新 sections 生成，保留 originalCount，並轉換類型ID為友好名稱
  const sections = useMemo(
    () => {
      // 先從groupedPasswords生成基本部分
      const rawSections = (
        Object.entries(groupedPasswords) as [string, PasswordItem[]][]
      ).map(([type, list]) => ({
        id: type, // 保存原始ID用於內部邏輯
        title: getTypeName(type), // 使用getTypeName轉換成友好名稱
        data: expandedSections[type] === true ? list : [], // 明確指定為 true 時才展開，否則默認折疊
        originalCount: list.length,
      }));
      
      // 根據類型列表順序對sections進行排序
      // 首先創建一個映射，存儲每個類型在列表中的索引
      const typeOrderMap = new Map();
      
      // 確保'all'類型始終排在第一位
      typeOrderMap.set('all', -1);
      
      // 獲取所有可用類型順序
      const availableTypes = [
        ...availableDefaultTypes.filter(type => !type.hidden),
        ...dbCustomTypes.map(type => ({
          id: type.id,
          name: type.name
        }))
      ];
      
      // 將其他類型按照順序加入映射
      availableTypes.forEach((type, index) => {
        if (type.id !== 'all') { // 排除'all'類型，因為已經設置為-1
          typeOrderMap.set(type.id, index);
        }
      });
      
      // 根據typeOrderMap對rawSections進行排序
      return rawSections.sort((a, b) => {
        const orderA = typeOrderMap.has(a.id) ? typeOrderMap.get(a.id) : Number.MAX_SAFE_INTEGER;
        const orderB = typeOrderMap.has(b.id) ? typeOrderMap.get(b.id) : Number.MAX_SAFE_INTEGER;
        return orderA - orderB;
      });
    },
    [groupedPasswords, expandedSections, getTypeName, availableDefaultTypes, dbCustomTypes]
  );

  // 處理添加新密碼
  const handleAddPassword = () => {
    if (!newPasswordTitle.trim() || !newPasswordUsername.trim()) {
      Alert.alert(t('common.error'), t('passwordForm.fillRequired'));
      return;
    }

    // 獲取類型名稱
    const typeName = getTypeName(newPasswordType);
    
    // 如果標題是空的，則使用類型名稱作為默認標題
    const finalTitle = newPasswordTitle.trim() || typeName;
    
    const newPassword = {
      id: Date.now().toString(), // 臨時ID，實際會在DB中生成
      title: finalTitle,
      username: newPasswordUsername,
      password: newPasswordValue || '',
      category: '',
      type: newPasswordType,
      notes: newPasswordNotes,
      favorite: false
    };
    
    addPasswordDb(newPassword);
    
    // 重置表單
    setNewPasswordTitle('');
    setNewPasswordUsername('');
    setNewPasswordValue('');
    // 選擇第一個可用的類型作為預設值
    const firstAvailableType = availableDefaultTypes.find(t => !t.hidden && t.id !== 'all')?.id || 'other';
    setNewPasswordType(firstAvailableType);
    setNewPasswordNotes('');
    
    // 關閉底部表單
    hideBottomSheet();
  };

  // Toggle section expansion
  const toggleSection = (section: string) => {
    // 在折疊時收起鍵盤
    Keyboard.dismiss();
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // 處理添加新類型
  const handleAddCustomType = useCallback((newTypeName: string) => {
    if (newTypeName.trim() === '') {
      Alert.alert(t('common.error'), t('types.enterTypeName'));
      return false;
    }
    
    // 檢查所有現有類型，包括默認類型和自定義類型
    const allTypeNames = [
      ...availableDefaultTypes.map(t => t.name.toLowerCase()),
      ...dbCustomTypes.map(t => t.name.toLowerCase())
    ];
    
    if (allTypeNames.includes(newTypeName.toLowerCase())) {
      Alert.alert(t('common.error'), t('types.alreadyExists', { name: newTypeName }));
      return false;
    }
    
    // 添加新類型
    addCustomTypeDb({
      id: Date.now().toString(), // 臨時ID，實際會在DB中生成
      name: newTypeName
    });
    
    return true;
  }, [availableDefaultTypes, dbCustomTypes, addCustomTypeDb, t]);

  // 修改複製功能，移除自動清除剪貼板的功能
  const handleCopy = (text: string, type: string) => {
    // 使用Clipboard API實際複製內容
    Clipboard.setString(text);
    
    // 只在iOS上顯示複製成功通知，Android有原生通知
    if (Platform.OS === 'ios') {
      showCopy(`${type} 已複製!`);
    }
  };

  // Get icon for password type
  const getTypeIcon = (type: string) => {
    // 設置圖標顏色，深色模式使用更亮的顏色
    const iconColor = isDarkMode ? "#A0B0FF" : "rgba(60, 60, 67, 0.6)";
    
    // 如果是自定義類型，使用默認圖標 (Lock)
    const isCustomType = type.startsWith('custom_');
    if (isCustomType) {
      return <Lock size={16} color={iconColor} />;
    }
    
    // 否則根據預定義類型返回相應圖標
    switch (type) {
      case 'mail':
        return <Mail size={16} color={iconColor} />;
      case 'social':
        return <MessageCircle size={16} color={iconColor} />;
      case 'bank':
        return <CreditCard size={16} color={iconColor} />;
      case 'app':
        return <Smartphone size={16} color={iconColor} />;
      case 'other':
        return <FolderLock size={16} color={iconColor} />;
      case 'all':
        return <Lock size={16} color={iconColor} />;
      default:
        return <Lock size={16} color={iconColor} />;
    }
  };

  // 在handleBackgroundPress中處理關閉表單前的保存提示
  const handleBackgroundPress = useCallback(() => {
    // 先關閉下拉選單
    closeTypeDropdown();
    
    // 如果處於編輯模式，提示用戶是否保存
    if (isEditing) {
      Alert.alert(
        "確認",
        "是否保存當前編輯的內容？",
        [
          {
            text: "不保存",
            style: "destructive",
            onPress: () => {
              setIsEditing(false);
              hideBottomSheet();
            }
          },
          {
            text: "保存",
            onPress: handleAddOrUpdatePassword
          },
          {
            text: "取消",
            style: "cancel"
          }
        ]
      );
    } else {
      // 然後關閉底部表單
      hideBottomSheet();
    }
  }, [closeTypeDropdown, hideBottomSheet, isEditing, handleAddOrUpdatePassword]);

  // 修改處理長按類型的函數，只保護"All Types"不被刪除
  const handleLongPressType = (type: {id: string, name: string}) => {
    // 只保護"All Types"不被刪除
    if (type.id === 'all') {
      Alert.alert(t('types.cannotDelete'), t('types.requiredType'));
      return;
    }
    
    setTypeToDelete(type);
    setIsDeleteTypeModalVisible(true);
  };
  
  // 修改刪除類型的函數
  const handleDeleteType = useCallback(async (moveToAllTypes: boolean) => {
    // 如果沒有要刪除的類型或類型是必須的（不能刪除）
    if (!typeToDelete || typeToDelete.id === 'all') {
      showCustomAlert(
        t('types.cannotDelete'),
        t('types.requiredType'),
        [
          {
            text: t('common.ok'),
            onPress: hideCustomAlert
          }
        ]
      );
      return;
    }
    
    // 檢查是否是預設類型
    const isDefaultType = availableDefaultTypes.some(t => t.id === typeToDelete.id);
    const isCustomType = dbCustomTypes.some(t => t.id === typeToDelete.id);
    
    // 其餘處理邏輯
    if (moveToAllTypes) {
      // 將此類型的所有密碼移動到 'other' 類型
      const passwordsToMove = passwords.filter(p => p.type === typeToDelete.id);
      
      // 執行更新
      await Promise.all(
        passwordsToMove.map(p => 
          updatePasswordDb({
            ...p,
            type: 'other'
          })
        )
      );
      
      // 如果是預設類型，則添加到隱藏列表
      if (isDefaultType) {
        const hiddenTypes = await loadHiddenDefaultTypes();
        if (!hiddenTypes.includes(typeToDelete.id)) {
          hiddenTypes.push(typeToDelete.id);
          await saveHiddenDefaultTypes(hiddenTypes);
        }
        
        // 顯示成功隱藏訊息
        showCustomAlert(
          t('common.success', '成功'),
          t('common.success', '成功'),
          [
            {
              text: t('common.ok'),
              onPress: hideCustomAlert
            }
          ]
        );
      } else if (isCustomType) {
        // 刪除自定義類型
        deleteCustomTypeDb(typeToDelete.id);
        
        // 顯示成功移動訊息
        showCustomAlert(
          t('common.success', '成功'),
          t('types.passwordsMovedToOther', { name: typeToDelete.name }),
          [
            {
              text: t('common.ok'),
              onPress: hideCustomAlert
            }
          ]
        );
      }
    } else {
      // 刪除此類型的所有密碼
      const passwordsToDelete = passwords.filter(p => p.type === typeToDelete.id);
      
      // 執行刪除
      await Promise.all(
        passwordsToDelete.map(p => deletePasswordDb(p.id))
      );
      
      // 如果是預設類型，則添加到隱藏列表
      if (isDefaultType) {
        const hiddenTypes = await loadHiddenDefaultTypes();
        if (!hiddenTypes.includes(typeToDelete.id)) {
          hiddenTypes.push(typeToDelete.id);
          await saveHiddenDefaultTypes(hiddenTypes);
        }
        
        // 顯示成功隱藏訊息
        showCustomAlert(
          t('common.success', '成功'),
          t('common.success', '成功'),
          [
            {
              text: t('common.ok'),
              onPress: hideCustomAlert
            }
          ]
        );
      } else if (isCustomType) {
        // 刪除自定義類型
        deleteCustomTypeDb(typeToDelete.id);
        
        // 顯示刪除訊息
        showCustomAlert(
          t('common.success', '成功'),
          t('types.passwordsDeleted', { name: typeToDelete.name }),
          [
            {
              text: t('common.ok'),
              onPress: hideCustomAlert
            }
          ]
        );
      }
    }
    
    // 重新載入類型
    await reloadTypes();
    await initializeDefaultTypes();
    
    // 重置刪除類型狀態
    setTypeToDelete(null);
    setIsDeleteTypeModalVisible(false);
  }, [typeToDelete, passwords, t, isDarkMode, showCustomAlert, hideCustomAlert, deleteCustomTypeDb, updatePasswordDb, reloadTypes, initializeDefaultTypes, availableDefaultTypes, dbCustomTypes]);

  // 首先在組件頂部添加一個處理標題輸入的函數
  const handleTitleChange = (text: string) => {
    // 定義限制
    const MAX_CHINESE_CHARS = 9;
    const MAX_ENGLISH_CHARS = 16;
    
    // 計算中文字元數（使用Unicode範圍判斷）
    let chineseCount = 0;
    let englishCount = 0;
    
    for (let i = 0; i < text.length; i++) {
      const char = text.charAt(i);
      if (/[\u4e00-\u9fa5]/.test(char)) {
        // 中文字元
        chineseCount++;
      } else {
        // 非中文字元（英文、數字、符號等）
        englishCount++;
      }
    }
    
    // 檢查是否超出限制
    if (chineseCount <= MAX_CHINESE_CHARS && 
        englishCount <= MAX_ENGLISH_CHARS && 
        (chineseCount + englishCount / 2) <= MAX_CHINESE_CHARS) {
      // 未超出限制，更新值
      setNewPasswordTitle(text);
    } else {
      // 已達到限制，不更新值
      console.log("標題長度已達上限");
    }
  };

  // 處理使用者名稱輸入的函數 (中文15字/英文25字混合)
  const handleUsernameChange = (text: string) => {
    // 定義限制
    const MAX_CHINESE_CHARS = 15;
    const MAX_ENGLISH_CHARS = 25;
    
    // 計算中文字元數（使用Unicode範圍判斷）
    let chineseCount = 0;
    let englishCount = 0;
    
    for (let i = 0; i < text.length; i++) {
      const char = text.charAt(i);
      if (/[\u4e00-\u9fa5]/.test(char)) {
        // 中文字元
        chineseCount++;
      } else {
        // 非中文字元（英文、數字、符號等）
        englishCount++;
      }
    }
    
    // 檢查是否超出限制 - 混合時，將英文字元以0.6權重計算
    if (chineseCount <= MAX_CHINESE_CHARS && 
        englishCount <= MAX_ENGLISH_CHARS && 
        (chineseCount + englishCount * 0.6) <= MAX_CHINESE_CHARS) {
      // 未超出限制，更新值
      setNewPasswordUsername(text);
    } else {
      // 已達到限制，不更新值
      console.log("使用者名稱長度已達上限");
    }
  };

  // 處理密碼輸入的函數 (中文15字/英文30字混合)
  const handlePasswordChange = (text: string) => {
    // 定義限制
    const MAX_CHINESE_CHARS = 15;
    const MAX_ENGLISH_CHARS = 30;
    
    // 計算中文字元數（使用Unicode範圍判斷）
    let chineseCount = 0;
    let englishCount = 0;
    
    for (let i = 0; i < text.length; i++) {
      const char = text.charAt(i);
      if (/[\u4e00-\u9fa5]/.test(char)) {
        // 中文字元
        chineseCount++;
      } else {
        // 非中文字元（英文、數字、符號等）
        englishCount++;
      }
    }
    
    // 檢查是否超出限制 - 混合時，將英文字元以0.5權重計算
    if (chineseCount <= MAX_CHINESE_CHARS && 
        englishCount <= MAX_ENGLISH_CHARS && 
        (chineseCount + englishCount * 0.5) <= MAX_CHINESE_CHARS) {
      // 未超出限制，更新值
      setNewPasswordValue(text);
    } else {
      // 已達到限制，不更新值
      console.log("密碼長度已達上限");
    }
  };

  // 在PasswordManagerHome函數內部設置全局函數引用
  // 在組件渲染前設置
  showCopyNotificationFunc = showCopy;

  // 設置全局刪除函數引用
  handleDeletePasswordGlobal = handleDeletePassword;

  // 設置全局圖標獲取函數引用
  getTypeIconFunc = getTypeIcon;

  // 修改測量邏輯使用正確的pageX和pageY
  const handleTypeSelectorPress = useCallback(() => {
    // 若下拉式選單已顯示，直接關閉即可，避免重複測量造成「關不起來」情況
    if (isTypeDropdownVisible) {
      closeTypeDropdown();
      return;
    }
    
    if (typeSelectorRef.current) {
      typeSelectorRef.current.measure((x, y, width, height, pageX, pageY) => {
        // 設置下拉選單位置，讓它顯示在頂部工具欄下方
        toggleTypeDropdown({ 
          pageX: pageX, 
          pageY: pageY, 
          width: width, 
          height: height 
        });
      });
    }
  }, [isTypeDropdownVisible, closeTypeDropdown, toggleTypeDropdown]);

  // 處理註銷按鈕點擊
  const handleLogout = useCallback(() => {
    showCustomAlert(
      t('home.backToLogin'),
      t('home.backToLoginConfirm'),
      [
        { 
          text: t('common.cancel'), 
          onPress: hideCustomAlert,
          type: 'cancel'
        },
        { 
          text: t('common.ok'),
          onPress: () => {
            hideCustomAlert();
            router.replace('/login');
          } 
        }
      ]
    );
  }, [router, t, isDarkMode, hideCustomAlert, showCustomAlert]);

  // 處理搜索輸入變更
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };

  // 渲染列表為空時的組件
  const renderEmptyComponent = () => (
    <View style={styles.emptyStateContainer}>
      <Lock size={48} color={isDarkMode ? "#FFFFFF" : "rgba(60, 60, 67, 0.3)"} />
      <Text style={[styles.emptyStateText, { color: isDarkMode ? "#FFFFFF" : "rgba(60, 60, 67, 0.6)" }]}>{t('home.emptyState')}</Text>
      <Text style={[styles.emptyStateSubtext, { color: isDarkMode ? "#FFFFFF" : "rgba(60, 60, 67, 0.4)" }]}>{t('home.emptyStateSubtext')}</Text>
    </View>
  );

  // 處理備份功能
  const handleBackup = useCallback(() => {
    showCustomAlert(
      t('backup.title', '備份密碼'),
      t('backup.confirmMessage', '是否需要備份所有密碼數據到本地？備份文件將保存在您的下載目錄中。'),
      [
        { 
          text: t('common.cancel', '取消'), 
          onPress: hideCustomAlert,
          type: 'cancel'
        },
        { 
          text: t('common.confirm', '確定'), 
          onPress: async () => {
            hideCustomAlert();
            try {
              if (!passwords || passwords.length === 0) {
                showCustomAlert(
                  t('backup.emptyTitle', '無數據可備份'),
                  t('backup.emptyMessage', '目前沒有儲存的密碼數據。'),
                  [{ text: t('common.ok', '確定'), onPress: hideCustomAlert }]
                );
                return;
              }
              
              // 準備備份數據
              const backupData = {
                passwords,
                customTypes: dbCustomTypes,
                backupDate: new Date().toISOString(),
                appVersion: '1.0.0',
                isEncrypted: true
              };
              
              // 獲取主密碼用於加密
              const masterPassword = await SecureStore.getItemAsync('master_password');
              
              if (!masterPassword) {
                showCustomAlert(
                  t('common.error', '錯誤'),
                  t('backup.masterPasswordError', '無法獲取主密碼進行加密。'),
                  [{ text: t('common.ok', '確定'), onPress: hideCustomAlert }]
                );
                return;
              }
              
              // 將數據轉換為JSON字符串
              const backupString = JSON.stringify(backupData, null, 2);
              
              // 使用主密碼進行AES加密
              const encryptedData = CryptoJS.AES.encrypt(backupString, masterPassword).toString();
              
              // 創建包含加密數據的對象
              const encryptedBackup = {
                data: encryptedData,
                isEncrypted: true,
                timestamp: new Date().toISOString(),
                appVersion: '1.0.0'
              };
              
              // 將加密後的數據轉換為JSON字符串
              const encryptedBackupString = JSON.stringify(encryptedBackup, null, 2);
              
              const fileName = `password_backup_${new Date().toISOString().replace(/[:.]/g, '_')}.json`;
              
              // === 刪除重複的 typeToDelete 與相關 useState ===
              // === 位於約1005行，只保留一處宣告 ===
              // (以下三行請刪除，不要保留)
              // const [typeToDelete, setTypeToDelete] = useState<{id: string, name: string} | null>(null);
              // const [isDeleteTypeModalVisible, setIsDeleteTypeModalVisible] = useState(false);
              // const [isAddTypeModalVisible, setIsAddTypeModalVisible] = useState(false);

              // --- 更新 handleBackup 生成 ZIP ---
              // 在 fileName 宣告後插入並替換後續 Platform 判斷區塊
              const zip = new JSZip();
              zip.file('backup.json', encryptedBackupString);
              const zipFileName = fileName.replace('.json', '.zip');

              if (Platform.OS === 'web') {
                // Web 直接下載 ZIP
                const zipBlob = await zip.generateAsync({ type: 'blob' });
                const url = URL.createObjectURL(zipBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = zipFileName;
                a.click();
                showCustomAlert(
                  t('backup.successTitle', '備份成功'),
                  t('backup.successEncryptedMessage', '您的數據已成功加密並壓縮備份。'),
                  [{ text: t('common.ok', '確定'), onPress: hideCustomAlert }]
                );
              } else {
                // Mobile 端寫入並分享 ZIP
                const zipBase64 = await zip.generateAsync({ type: 'base64' });
                const fileUri = `${FileSystem.cacheDirectory}${zipFileName}`;
                await FileSystem.writeAsStringAsync(fileUri, zipBase64, { encoding: FileSystem.EncodingType.Base64 });

                const canShare = await Sharing.isAvailableAsync();
                if (canShare) {
                  await Sharing.shareAsync(fileUri, {
                    mimeType: 'application/zip',
                    dialogTitle: t('backup.shareTitle', '密碼管理器數據備份'),
                    UTI: 'public.zip-archive'
                  });
                }
                showCustomAlert(
                  t('backup.successTitle', '備份成功'),
                  t('backup.successEncryptedMessage', '您的數據已成功加密並壓縮備份。'),
                  [{ text: t('common.ok', '確定'), onPress: hideCustomAlert }]
                );
              }
            } catch (error) {
              console.error('備份錯誤', error);
              showCustomAlert(
                t('common.error', '錯誤'),
                t('backup.errorMessage', '備份過程中發生錯誤，請稍後再試。'),
                [{ text: t('common.ok', '確定'), onPress: hideCustomAlert }]
              );
            }
          } 
        }
      ]
    );
  }, [passwords, dbCustomTypes, t, isDarkMode, hideCustomAlert, showCustomAlert]);

  // 處理恢復功能
  const handleRestore = useCallback(() => {
    showCustomAlert(
      t('backup.restoreTitle', '恢復數據'),
      t('backup.restoreConfirmMessage', '是否要從備份文件恢復數據？'),
      [
        { 
          text: t('common.cancel', '取消'), 
          onPress: hideCustomAlert,
          type: 'cancel'
        },
        { 
          text: t('common.confirm', '確定'), 
          onPress: async () => {
            hideCustomAlert();
            try {
              // 使用 DocumentPicker 選擇備份文件
              let result;
              try {
                result = await DocumentPicker.getDocumentAsync({
                  type: ['application/json', 'application/zip'],
                  copyToCacheDirectory: true
                });
              } catch (pickError) {
                // 選擇文件過程中出錯，例如用戶取消或應用無法訪問文件系統
                showCustomAlert(
                  t('backup.restoreTitle', '恢復數據'),
                  t('backup.filePickError', '選擇文件時發生錯誤，請重試。'),
                  [{ text: t('common.ok', '確定'), onPress: hideCustomAlert }]
                );
                return;
              }
              
              if (result.canceled) {
                // 不在控制台記錄用戶取消選擇的信息
                showCustomAlert(
                  t('backup.restoreTitle', '恢復數據'),
                  t('backup.noFileSelected', '未選擇任何文件'),
                  [{ text: t('common.ok', '確定'), onPress: hideCustomAlert }]
                );
                return;
              }
              
              // 確認用戶選擇了文件
              const fileUri = result.assets[0].uri;
              
              // 讀取文件內容
              let fileContent;
              try {
                fileContent = await FileSystem.readAsStringAsync(fileUri);
              } catch (readError) {
                // 讀取文件失敗
                showCustomAlert(
                  t('common.error', '錯誤'),
                  t('backup.fileReadError', '無法讀取所選文件，請確保文件未損壞。'),
                  [{ text: t('common.ok', '確定'), onPress: hideCustomAlert }]
                );
                return;
              }
              
              // 解析 JSON 數據
              let parsedBackup: any = null;
              const isZip = fileUri.toLowerCase().endsWith('.zip');
              if (isZip) {
                const fileBase64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
                try {
                  const zipObj = await JSZip.loadAsync(fileBase64, { base64: true });
                  const jsonStr = await zipObj.file('backup.json')?.async('string');
                  if (jsonStr) parsedBackup = JSON.parse(jsonStr);
                } catch (_) { /* 解壓失敗 */ }
              } else {
                const fileText = await FileSystem.readAsStringAsync(fileUri);
                try { parsedBackup = JSON.parse(fileText); } catch(_) {}
              }
              if (!parsedBackup) {
                showCustomAlert(
                  t('common.error','錯誤'),
                  t('backup.invalidBackupFormat','所選檔案不是有效備份格式。'),
                  [{ text: t('common.ok','確定'), onPress: hideCustomAlert }]
                );
                return;
              }
              
              // 檢查備份文件格式是否有效
              if (!parsedBackup || 
                  (parsedBackup.isEncrypted && !parsedBackup.data) || 
                  (!parsedBackup.isEncrypted && (!parsedBackup.passwords || !Array.isArray(parsedBackup.passwords)))) {
                showCustomAlert(
                  t('common.error', '錯誤'),
                  t('backup.invalidBackupFormat', '所選文件不是有效的密碼管理器備份文件。'),
                  [{ text: t('common.ok', '確定'), onPress: hideCustomAlert }]
                );
                return;
              }
              
              // 檢查備份文件是否為加密格式
              if (parsedBackup.isEncrypted) {
                // 顯示輸入原主密碼的視窗
                setBackupDataToDecrypt(parsedBackup);
                setIsMasterPasswordModalVisible(true);
                return; // 等待使用者輸入密碼
              }
              
              // 詢問用戶是否覆蓋或合併數據
              promptForRestoreOption(parsedBackup);
            } catch (error) {
              // 不在控制台打印錯誤詳情
              showCustomAlert(
                t('common.error', '錯誤'),
                t('backup.restoreError', '恢復過程中發生錯誤，請確保選擇了正確的備份文件。'),
                [{ text: t('common.ok', '確定'), onPress: hideCustomAlert }]
              );
            }
          }
        }
      ]
    );
  }, [t, isDarkMode, hideCustomAlert, showCustomAlert]);

  // 詢問用戶恢復方式（覆蓋或合併）
  const promptForRestoreOption = (backupData: BackupData) => {
    // 直接執行合併操作，無需詢問
    hideCustomAlert();
    restoreData(backupData, false);
  };

  // 實際執行恢復數據的函數
  const restoreData = async (backupData: BackupData, overwrite = false) => {
    try {
      // 驗證備份數據格式
      if (!backupData || !backupData.passwords || !Array.isArray(backupData.passwords)) {
        showCustomAlert(
          t('common.error', '錯誤'),
          t('backup.invalidBackupFormat', '備份文件格式無效。'),
          [{ text: t('common.ok', '確定'), onPress: hideCustomAlert }]
        );
        return;
      }
      
      // 密碼恢復計數
      let restoredPasswordCount = 0;
      let restoredTypeCount = 0;
      
      // 恢復自定義類型
      if (backupData.customTypes && Array.isArray(backupData.customTypes)) {
        for (const customType of backupData.customTypes) {
          try {
            // 檢查類型是否已存在
            const typeExists = dbCustomTypes.some(t => t.id === customType.id || t.name === customType.name);
            if (!typeExists) {
              await addCustomTypeDb(customType);
              restoredTypeCount++;
            }
          } catch (typeError) {
            // 靜默處理單個類型添加失敗，繼續處理其他類型
            continue;
          }
        }
        
        try {
          // 完成後立即重新加載類別數據，確保UI更新
          await reloadTypes();
          
          // 重新初始化可用類型，確保UI立即反映變化
          initializeDefaultTypes();
        } catch (reloadError) {
          // 重新加載失敗不中斷流程，僅在下次啟動時才會看到新類型
        }
      }
      
      // 收集所有當前存在的類型ID
      const allCurrentTypeIds = [
        ...availableDefaultTypes.map(t => t.id),
        ...dbCustomTypes.map(t => t.id)
      ];
      
      // 收集備份中使用的所有類型ID
      const backupTypeIds = new Set<string>();
      backupData.passwords.forEach(pwd => {
        if (pwd.type && pwd.type !== 'all' && pwd.type !== 'other') {
          backupTypeIds.add(pwd.type);
        }
      });
      
      // 檢查並恢復缺失的類型
      for (const typeId of Array.from(backupTypeIds)) {
        if (!allCurrentTypeIds.includes(typeId)) {
          // 如果是預設類型ID格式，但現在不存在，可能是被隱藏了
          const isDefaultTypeFormat = !typeId.startsWith('custom_') && 
                                    ['mail', 'social', 'bank', 'app'].includes(typeId);
          
          if (isDefaultTypeFormat) {
            // 這是一個預設類型，嘗試恢復它（讓其可見）
            try {
              // 從隱藏類型列表中移除
              const hiddenTypes = await loadHiddenDefaultTypes();
              if (hiddenTypes.includes(typeId)) {
                const updatedHiddenTypes = hiddenTypes.filter(id => id !== typeId);
                await saveHiddenDefaultTypes(updatedHiddenTypes);
                restoredTypeCount++;
              }
            } catch (err) {
              // 忽略錯誤
            }
          } else {
            // 這可能是自定義類型，但沒有在備份的customTypes中
            try {
              // 創建一個新的自定義類型
              const newType = {
                id: typeId,
                name: typeId.replace('custom_', '') // 從ID中提取名稱，或使用ID作為名稱
              };
              await addCustomTypeDb(newType);
              restoredTypeCount++;
            } catch (err) {
              // 忽略錯誤
            }
          }
        }
      }
      
      // 恢復完類型後再次更新類型列表
      try {
        await reloadTypes();
        initializeDefaultTypes();
      } catch (err) {
        // 忽略錯誤
      }
      
      // 恢復密碼
      for (const password of backupData.passwords) {
        try {
          // 確保密碼對象有有效的ID
          if (!password || !password.id) continue;
          
          // 檢查密碼是否已存在
          const passwordExists = passwords.some(p => p.id === password.id);
          if (!passwordExists) {
            // 保持原始類型，不將其更改為 'other'
            await addPasswordDb(password);
            restoredPasswordCount++;
          }
        } catch (passwordError) {
          // 靜默處理單個密碼添加失敗，繼續處理其他密碼
          continue;
        }
      }
      
      // 顯示恢復成功訊息，調整格式以確保更好的可讀性
      showCustomAlert(
        t('backup.restoreSuccess', '數據恢復成功！'),
        `${t('backup.passwordsRestored', { count: restoredPasswordCount })}\n\n${t('backup.typesRestored', { count: restoredTypeCount })}`,
        [{ text: t('common.ok', '確定'), onPress: hideCustomAlert }]
      );
      
    } catch (error) {
      // 不記錄錯誤詳情到控制台
      showCustomAlert(
        t('common.error', '錯誤'),
        t('backup.restoreError', '恢復過程中發生錯誤，請確保備份文件格式正確。'),
        [{ text: t('common.ok', '確定'), onPress: hideCustomAlert }]
      );
    }
  };

  // 添加設置菜單狀態
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  
  // 打開設置菜單
  const openSettings = () => {
    setIsSettingsVisible(true);
  };
  
  // 關閉設置菜單
  const closeSettings = () => {
    setIsSettingsVisible(false);
  };

  // 在 PasswordManagerHome 函數內部的 state 區域加入新狀態
  const [isMasterPasswordModalVisible, setIsMasterPasswordModalVisible] = useState(false);
  const [inputMasterPassword, setInputMasterPassword] = useState('');
  const [backupDataToDecrypt, setBackupDataToDecrypt] = useState<any>(null);
  const [showMasterPassword, setShowMasterPassword] = useState(false);
  
  // 新增免責聲明相關狀態
  const [isDisclaimerModalVisible, setIsDisclaimerModalVisible] = useState(false);
  
  // 新增變更密碼相關的狀態
  const [isChangePasswordModalVisible, setIsChangePasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');
  
  // 處理變更密碼操作
  const handleChangePassword = useCallback(async () => {
    // 先檢查輸入是否有效
    if (!currentPassword) {
      setPasswordErrorMsg(t('settings.errorCurrentPasswordEmpty'));
      setTimeout(() => setPasswordErrorMsg(''), 2000);
      return;
    }
    
    if (!newPassword) {
      setPasswordErrorMsg(t('settings.errorNewPasswordEmpty'));
      setTimeout(() => setPasswordErrorMsg(''), 2000);
      return;
    }
    
    if (newPassword !== confirmNewPassword) {
      setPasswordErrorMsg(t('settings.errorPasswordsDoNotMatch'));
      setTimeout(() => setPasswordErrorMsg(''), 2000);
      return;
    }
    
    // 檢查新密碼是否符合要求
    const LETTER_RE = /[A-Za-z]/;
    const meetsLen = newPassword.length >= 7;
    const hasLetter = LETTER_RE.test(newPassword);
    
    if (!hasLetter) {
      setPasswordErrorMsg(t('auth.passwordRequiresLetter'));
      setTimeout(() => setPasswordErrorMsg(''), 2000);
      return;
    }
    
    if (!meetsLen) {
      setPasswordErrorMsg(t('auth.passwordMinLength'));
      setTimeout(() => setPasswordErrorMsg(''), 2000);
      return;
    }
    
    try {
      // 獲取當前保存的主密碼
      const savedPassword = await SecureStore.getItemAsync('master_password');
      
      // 驗證當前密碼是否正確
      if (currentPassword !== savedPassword) {
        setPasswordErrorMsg(t('settings.errorIncorrectCurrentPassword'));
        setTimeout(() => setPasswordErrorMsg(''), 2000);
        return;
      }
      
      // 更新主密碼
      await SecureStore.setItemAsync('master_password', newPassword);
      
      // 清空表單並隱藏彈窗
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setIsChangePasswordModalVisible(false);
      
      // 顯示成功訊息
      showCustomAlert(
        t('settings.success'),
        t('settings.passwordChangeSuccess'),
        [{ text: t('common.ok'), onPress: hideCustomAlert }]
      );
    } catch (error) {
      console.error('變更密碼時出錯:', error);
      setPasswordErrorMsg(t('settings.errorChangingPassword'));
      setTimeout(() => setPasswordErrorMsg(''), 2000);
    }
  }, [currentPassword, newPassword, confirmNewPassword, t, showCustomAlert, hideCustomAlert]);
  
  // 開啟變更密碼彈窗
  const openChangePasswordModal = () => {
    setIsChangePasswordModalVisible(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setPasswordErrorMsg('');
  };
  
  // 關閉變更密碼彈窗
  const closeChangePasswordModal = () => {
    setIsChangePasswordModalVisible(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setPasswordErrorMsg('');
  };

  // 顯示免責聲明彈窗
  const openDisclaimerModal = () => {
    setIsDisclaimerModalVisible(true);
  };
  
  // 關閉免責聲明彈窗
  const closeDisclaimerModal = () => {
    setIsDisclaimerModalVisible(false);
  };

  // 添加可用類型清單（包括預設和自定義類型）的計算屬性
  const allAvailableTypes = useMemo(() => {
    return [
      ...availableDefaultTypes.filter(type => !type.hidden),
      ...dbCustomTypes.map(type => ({
        id: type.id,
        name: type.name,
        icon: Lock
      }))
    ];
  }, [availableDefaultTypes, dbCustomTypes]);
  
  // 添加處理滑動切換類型的函數
  const handleSwipeChangeType = useCallback((newTypeIndex: number) => {
    if (newTypeIndex >= 0 && newTypeIndex < allAvailableTypes.length) {
      setSelectedType(allAvailableTypes[newTypeIndex].id);
    }
  }, [allAvailableTypes]);
  
  // 用於在類型改變時滾動到該類型的輔助函數
  const scrollToTypeIndex = useCallback((typeId: string) => {
    const typeIndex = allAvailableTypes.findIndex(type => type.id === typeId);
    if (typeIndex >= 0) {
      // 如果找到類型，滾動到該位置
      sectionListRef.current?.scrollToLocation({
        sectionIndex: 0,
        itemIndex: 0,
        animated: true,
        viewOffset: 0
      });
    }
  }, [allAvailableTypes]);
  
  // 當用戶從 TypeFilter 選擇類型時，同時更新滾動位置
  const handleSelectType = useCallback((typeId: string) => {
    setSelectedType(typeId);
    scrollToTypeIndex(typeId);
  }, [scrollToTypeIndex]);

  // 獲取指定類型ID在類型列表中的索引
  const getTypeIndex = useCallback((typeId: string) => {
    const allTypes = [
      ...availableDefaultTypes.filter(type => !type.hidden),
      ...dbCustomTypes
    ];
    return allTypes.findIndex(type => type.id === typeId);
  }, [availableDefaultTypes, dbCustomTypes]);

  // 處理類型切換，同時更新 PagerView 的頁面
  const handleSelectTypeWithSwipe = useCallback((typeId: string) => {
    // 確保點擊類型按鈕時收起鍵盤
    Keyboard.dismiss();
    searchInputRef.current?.blur();
    
    setSelectedType(typeId);
    
    // 獲取類型對應的索引並使 PagerView 跳轉到該頁面
    const allTypes = [
      ...availableDefaultTypes.filter(type => !type.hidden),
      ...dbCustomTypes.map(type => ({
        id: type.id,
        name: type.name,
        icon: Lock
      }))
    ];
    
    const typeIndex = allTypes.findIndex(type => type.id === typeId);
    if (typeIndex >= 0 && pagerViewRef.current) {
      pagerViewRef.current.setPage(typeIndex);
    }
  }, [searchInputRef, availableDefaultTypes, dbCustomTypes]);

  // 處理解密備份檔案的函數（被誤刪的函數）
  const handleMasterPasswordConfirm = useCallback(async () => {
    if (!backupDataToDecrypt) return;
    try {
      // 使用使用者輸入的密碼嘗試解密
      let decryptedData = '';
      try {
        // 使用try-catch包裹解密過程，避免拋出UTF-8錯誤
        const decryptedBytes = CryptoJS.AES.decrypt(backupDataToDecrypt.data, inputMasterPassword);
        decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8);
      } catch (decryptError) {
        // 靜默捕獲解密錯誤，不記錄到控制台
        decryptedData = '';
      }
      
      // 如果解密失敗，toString 會返回空字串
      if (!decryptedData) {
        // 不記錄錯誤細節，統一使用友好的提示信息
        throw new Error('密碼不正確');
      }

      // 嘗試解析JSON
      let backupData;
      try {
        backupData = JSON.parse(decryptedData);
      } catch (jsonError) {
        // JSON解析錯誤意味著解密結果不是有效JSON
        throw new Error('解密結果無效');
      }

      // 檢查備份格式
      if (!backupData.passwords || !Array.isArray(backupData.passwords)) {
        throw new Error('無效的備份文件格式');
      }

      // 關閉輸入視窗並清空狀態
      setIsMasterPasswordModalVisible(false);
      setInputMasterPassword('');
      setBackupDataToDecrypt(null);

      // 直接進行合併恢復
      restoreData(backupData, false);
    } catch (error) {
      // 不打印錯誤對象，只顯示錯誤消息
      showCustomAlert(
        t('common.error', '錯誤'),
        t('backup.decryptError', '無法解密備份文件。請確保輸入正確的主密碼。'),
        [{ text: t('common.ok', '確定'), onPress: hideCustomAlert }]
      );
    }
  }, [backupDataToDecrypt, inputMasterPassword, t, hideCustomAlert, showCustomAlert, restoreData]);

  return (
    <View style={[styles.container, {
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      backgroundColor: isDarkMode ? '#18181A' : '#f5f5f7'
    }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <LinearGradient 
        colors={isDarkMode ? ["#18181A", "#18181A"] : ["#f0f4ff", "#ffffff"]} 
        style={StyleSheet.absoluteFill} 
      />

      <KeyboardAvoidingView
        style={styles.kv}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        enabled={Platform.OS === "ios"}
      >
        {/* 頂部固定區域：標題、搜索和類型選擇 */}
        <View>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, {color: isDarkMode ? '#FFFFFF' : '#000'}]}>
              {t('common.appName')}
            </Text>
            
            {/* 添加設置圖標按鈕 */}
            <TouchableOpacity 
              style={{
                padding: 8,
                borderRadius: 20,
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                position: 'absolute',
                right: 4
              }}
              onPress={openSettings}
            >
              <Settings size={20} color={isDarkMode ? "#4285F4" : "#333333"} />
            </TouchableOpacity>
          </View>
          <View style={styles.searchContainer}>
            <View style={[
              styles.searchBar, 
              { 
                borderColor: isDarkMode ? '#426F9B' : 'rgba(60, 60, 67, 0.2)',
                backgroundColor: 'transparent',
                overflow: 'hidden'
              }
            ]}>
              <BlurView 
                intensity={30} 
                tint={isDarkMode ? "dark" : "light"} 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.7)' : 'rgba(255, 255, 255, 0.8)',
                }}
              />
              <Search size={18} color={isDarkMode ? "#D8D5D6" : "rgba(60, 60, 67, 0.6)"} />
              <TextInput
                ref={searchInputRef}
                style={[styles.searchInput, { color: isDarkMode ? '#D8D5D6' : '#000' }]}
                placeholder={t('home.searchPlaceholder')}
                placeholderTextColor={isDarkMode ? "#6F6F6F" : "rgba(60, 60, 67, 0.3)"}
                value={searchQuery}
                onChangeText={handleSearchChange}
                returnKeyType="search"
                clearButtonMode="while-editing"
                blurOnSubmit={true}
                onSubmitEditing={() => { searchInputRef.current?.blur(); }}
              />
            </View>
          </View>
          <TypeFilter 
            types={availableDefaultTypes.filter(type => !type.hidden)}
            customTypes={dbCustomTypes}
            selectedType={selectedType}
            onSelectType={handleSelectTypeWithSwipe}
            onAddCustomType={handleAddCustomType}
            onLongPressType={handleLongPressType}
            isDarkMode={isDarkMode}
          />
        </View>
        
        {/* 使用 PagerView 實現滑動動畫效果 */}
        <View style={{ flex: 1 }}>
          <PagerView
            ref={pagerViewRef}
            style={{
              flex: 1,
              marginTop: 10
            }}
            initialPage={getTypeIndex(selectedType)}
            onPageSelected={(e) => {
              // 在頁面切換時收起鍵盤並清除焦點
              Keyboard.dismiss();
              searchInputRef.current?.blur();
              
              // 獲取當前頁面索引和對應的類型
              const index = e.nativeEvent.position;
              const allTypes = [
                ...availableDefaultTypes.filter(type => !type.hidden),
                ...dbCustomTypes.map(type => ({
                  id: type.id,
                  name: type.name,
                  icon: Lock
                }))
              ];
              
              // 只有當索引有效且對應的類型存在時才更新 selectedType
              if (index >= 0 && index < allTypes.length) {
                // 更新 selectedType 狀態，但不要調用 setPage，避免循環
                setSelectedType(allTypes[index].id);
              }
            }}
            overdrag={true} // 允許過度拖動，提升使用體驗
            overScrollMode="always" // Android 上允許過度滾動
            offscreenPageLimit={2} // 預加載前後兩頁，提升滑動體驗
            keyboardDismissMode="on-drag" // 拖曳時自動收鍵盤
            key={`pager_${allAvailableTypes.length}`} // 確保類型數量變化時重新渲染
          >
            {/* 為每個類型創建單獨的頁面 */}
            {allAvailableTypes.map((type) => {
              // 過濾出該類型的密碼數據
              const typePasswords = type.id === 'all'
                ? passwords
                : passwords.filter(pwd => pwd.type === type.id);
              
              // 修改 filteredSections 邏輯，讓所有類型都受到 expandedSections 控制
              // 對於「全部類別」，使用完整的 sections
              // 對於其他類型，從 sections 中篩選出對應的 section
              const filteredSections = type.id === 'all'
                ? sections
                : sections.filter(section => section.id === type.id);
              
              return (
                <View key={type.id} style={{ flex: 1 }}>
                  {typePasswords.length === 0 && type.id !== 'all' ? (
                    // 通過完全相同的結構和額外的微調來匹配「全部類別」的位置
                    <View style={{ flex: 1, width: '100%' }}>
                      <SectionList
                        sections={[]}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => null}
                        renderSectionHeader={() => null}
                        stickySectionHeadersEnabled={false}
                        contentContainerStyle={{
                          paddingHorizontal: 24,
                          paddingTop: 24,
                          paddingBottom: 100,
                          flexGrow: 1,
                          marginTop: 60 // 添加額外的上邊距來微調位置
                        }}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="on-drag" // 拖曳時自動收鍵盤
                        nestedScrollEnabled={true} // Android 下允許巢狀滾動
                        scrollEnabled={true} // 確保可以滾動
                        ListEmptyComponent={() => (
                          <View style={[styles.emptyStateContainer, { marginTop: -100 }]}>
                            <Lock size={48} color={isDarkMode ? "#FFFFFF" : "rgba(60, 60, 67, 0.3)"} />
                            <Text style={[styles.emptyStateText, { color: isDarkMode ? "#FFFFFF" : "rgba(60, 60, 67, 0.6)" }]}>{t('home.emptyState')}</Text>
                            <Text style={[styles.emptyStateSubtext, { color: isDarkMode ? "#FFFFFF" : "rgba(60, 60, 67, 0.4)" }]}>{t('home.emptyStateSubtext')}</Text>
                          </View>
                        )}
                      />
                    </View>
                  ) : (
                    // 有密碼時顯示列表
                    <SectionList
                      ref={type.id === selectedType ? sectionListRef : null}
                      sections={filteredSections}
                      keyExtractor={(item) => item.id}
                      renderItem={({ item }) => (
                        <PasswordCard
                          item={item}
                          onDelete={handleDeletePassword}
                          onEdit={handleEditPassword}
                          getTypeIcon={getTypeIcon}
                          getTypeName={getTypeName}
                          isDarkMode={isDarkMode}
                        />
                      )}
                      renderSectionHeader={({ section }) => (
                        <SectionHeader
                          title={section.title}
                          count={section.originalCount}
                          isExpanded={expandedSections[section.id] === true}
                          onToggle={() => toggleSection(section.id)}
                          isDarkMode={isDarkMode}
                        />
                      )}
                      stickySectionHeadersEnabled={false}
                      contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 100 }}
                      showsVerticalScrollIndicator={false}
                      keyboardShouldPersistTaps="handled"
                      keyboardDismissMode="on-drag" // 拖曳時自動收鍵盤
                      nestedScrollEnabled={true} // Android 下允許巢狀滾動
                      ListEmptyComponent={type.id === 'all' ? renderEmptyComponent : null}
                    />
                  )}
                </View>
              );
            })}
          </PagerView>
        </View>
      </KeyboardAvoidingView>
      
      <CopyNotification
        visible={showCopiedNotification}
        message={copiedText}
        fadeAnim={copiedAnimation}
      />
      
      {/* 設置菜單彈出窗口 */}
      <Modal
        visible={isSettingsVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeSettings}
      >
        <TouchableWithoutFeedback onPress={closeSettings}>
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
              <View style={{
                width: '80%',
                backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF',
                borderRadius: 16,
                padding: 20,
                elevation: 5,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
              }}>
                <Text style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: isDarkMode ? '#FFFFFF' : '#000000',
                  marginBottom: 20,
                  textAlign: 'center'
                }}>
                  {t('settings.title', '設定')}
                </Text>
                
                {/* 深色模式切換 */}
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                  }}
                  onPress={() => {
                    toggleDarkMode();
                  }}
                >
                  {isDarkMode ? 
                    <Sun size={24} color="#f39c12" /> : 
                    <Moon size={24} color="#6c5ce7" />
                  }
                  <Text style={{
                    fontSize: 16,
                    marginLeft: 12,
                    color: isDarkMode ? '#FFFFFF' : '#000000'
                  }}>
                    {isDarkMode ? t('settings.lightMode', '切換淺色模式') : t('settings.darkMode', '切換深色模式')}
                  </Text>
                </TouchableOpacity>
                
                {/* 備份按鈕 */}
                  <TouchableOpacity 
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                  }}
                  onPress={() => {
                    closeSettings();
                    handleBackup();
                  }}
                >
                  <Save size={24} color={isDarkMode ? "#4CAF50" : "#4CAF50"} />
                  <Text style={{
                    fontSize: 16,
                    marginLeft: 12,
                    color: isDarkMode ? '#FFFFFF' : '#000000'
                  }}>
                    {t('backup.title', '備份密碼')}
                      </Text>
                </TouchableOpacity>
                
                {/* 變更密碼按鈕 */}
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                  }}
                  onPress={() => {
                    closeSettings();
                    openChangePasswordModal();
                  }}
                >
                  <Lock size={24} color={isDarkMode ? "#9C27B0" : "#9C27B0"} />
                  <Text style={{
                    fontSize: 16,
                    marginLeft: 12,
                    color: isDarkMode ? '#FFFFFF' : '#000000'
                  }}>
                    {t('settings.changePassword', '變更主密碼')}
                  </Text>
                </TouchableOpacity>
                
                {/* 恢復按鈕 */}
                <TouchableOpacity
                      style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                  }}
                  onPress={() => {
                    closeSettings();
                    handleRestore();
                  }}
                >
                  <Download size={24} color={isDarkMode ? "#2196F3" : "#2196F3"} />
                  <Text style={{
                    fontSize: 16,
                    marginLeft: 12,
                    color: isDarkMode ? '#FFFFFF' : '#000000'
                  }}>
                    {t('backup.restoreTitle', '恢復數據')}
                  </Text>
                  </TouchableOpacity>
                
                {/* 免責聲明按鈕 */}
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                  }}
                  onPress={() => {
                    closeSettings();
                    openDisclaimerModal();
                  }}
                >
                  <Globe size={24} color={isDarkMode ? "#FF5722" : "#FF5722"} />
                  <Text style={{
                    fontSize: 16,
                    marginLeft: 12,
                    color: isDarkMode ? '#FFFFFF' : '#000000'
                  }}>
                    {t('settings.disclaimer', '免責聲明')}
                  </Text>
                </TouchableOpacity>
                
                {/* 登出按鈕 */}
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12
                  }}
                  onPress={() => {
                    closeSettings();
                    handleLogout();
                  }}
                >
                  <LogOut size={24} color={isDarkMode ? "#f5a623" : "#f5a623"} />
                  <Text style={{
                    fontSize: 16,
                    marginLeft: 12,
                    color: isDarkMode ? '#FFFFFF' : '#000000'
                  }}>
                    {t('home.backToLogin', '返回登入頁面')}
                  </Text>
                </TouchableOpacity>
                
                {/* 關閉按鈕 */}
                <TouchableOpacity
                  style={{
                    marginTop: 20,
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    alignItems: 'center'
                  }}
                  onPress={closeSettings}
                >
                  <Text style={{
                    color: isDarkMode ? '#FFFFFF' : '#000000',
                    fontWeight: '500'
                  }}>
                    {t('settings.close', '關閉')}
                  </Text>
                </TouchableOpacity>
                    </View>
            </TouchableWithoutFeedback>
                  </View>
        </TouchableWithoutFeedback>
      </Modal>
      
      {/* 添加底部表單 Modal */}
      <Modal
        visible={isBottomSheetVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={hideBottomSheet}
        statusBarTranslucent={true}
      >
        <View style={{
          flex: 1,
          backgroundColor: isDarkMode ? '#18181A' : 'white',
          // 使用 insets 設置安全區域的 padding
          paddingTop: insets.top // 適用於 iOS 和 Android
        }}>
          <View style={{
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            paddingHorizontal: 24, // 與下方卡片的paddingHorizontal: 24一致
            paddingVertical: 16,
            // 確保安卓有足夠的頂部間距
            marginTop: 8 // 為所有平台增加邊距
          }}>
            <TouchableOpacity onPress={hideBottomSheet}>
              <ChevronRight size={24} color={isDarkMode ? "#4da6ff" : "#007AFF"} style={{transform: [{rotate: '180deg'}]}} />
            </TouchableOpacity>
            <Text style={{
              fontSize: 18, 
              fontWeight: '600', 
              color: isDarkMode ? '#FFFFFF' : '#000', 
              flex: 1, 
              textAlign: 'center'
            }}>
              {isEditing ? t('home.editPassword') : t('home.addPassword')}
            </Text>
            <View style={{
              width: 160, // 縮小為 160，讓按鈕及下拉選單更緊湊
              paddingRight: 16,
              alignItems: 'flex-end'
            }}>
                    <TouchableOpacity
                ref={typeSelectorRef}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  backgroundColor: isDarkMode ? 'rgba(65, 105, 225, 0.2)' : 'rgba(0, 122, 255, 0.1)',
                  borderWidth: 1,
                  borderColor: isDarkMode ? 'rgba(65, 105, 225, 0.3)' : 'rgba(0, 122, 255, 0.2)',
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  width: '100%',
                  justifyContent: 'space-between'
                }}
                onPress={handleTypeSelectorPress}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {getTypeIcon(newPasswordType)}
                  <Text style={{
                    fontSize: 14, 
                    fontWeight: '500', 
                    color: isDarkMode ? '#A0B0FF' : '#007AFF',
                    marginLeft: 8,
                    flex: 0,
                    textAlignVertical: 'center',
                    includeFontPadding: false,
                    lineHeight: 18
                  }}>{getTypeName(newPasswordType)}</Text>
                </View>
                <ChevronRight size={14} color={isDarkMode ? '#A0B0FF' : '#007AFF'} style={{transform: [{rotate: isTypeDropdownVisible ? '90deg' : '0deg'}]}} />
                    </TouchableOpacity>
                  </View>
                </View>
          
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
          >
            <ScrollView 
              style={{ flex: 1 }} 
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
              keyboardShouldPersistTaps="handled"
            >
              <BottomSheetForm
                typeSelectorRef={typeSelectorRef}
                isTypeDropdownVisible={isTypeDropdownVisible}
                handleTypeSelectorPress={handleTypeSelectorPress}
                newPasswordType={newPasswordType}
                defaultTypes={availableDefaultTypes}
                customTypes={dbCustomTypes}
                getTypeIcon={getTypeIcon}
                newPasswordTitle={newPasswordTitle}
                handleTitleChange={handleTitleChange}
                newPasswordUsername={newPasswordUsername}
                handleUsernameChange={handleUsernameChange}
                newPasswordValue={newPasswordValue}
                handlePasswordChange={handlePasswordChange}
                newPasswordNotes={newPasswordNotes}
                setNewPasswordNotes={setNewPasswordNotes}
                handleAddPassword={handleAddOrUpdatePassword}
                isEditing={isEditing}
                onCancel={hideBottomSheet}
                isDarkMode={isDarkMode}
              />
            </ScrollView>
          </KeyboardAvoidingView>
            
            {/* 類型選項下拉選單 */}
          {isTypeDropdownVisible && typeBtnMeasure && (
            <View 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'box-none',
                zIndex: 9999
              }} 
            >
              <TypeDropdown
                types={[
                  ...availableDefaultTypes.slice(1), 
                  ...dbCustomTypes.map(type => ({
                    ...type,
                    icon: type.id === 'other' ? FolderLock : Lock
                  }))
                ]}
                selectedType={newPasswordType}
                onSelectType={(typeId) => {
                  setNewPasswordType(typeId);
                  closeTypeDropdown();
                }}
                onClose={closeTypeDropdown}
                position={typeBtnMeasure}
                isDarkMode={isDarkMode}
              />
            </View>
            )}
          </View>
      </Modal>
      
      {/* 添加類型對話框 */}
      <AddTypeModal 
        isVisible={isAddTypeModalVisible}
        newTypeName={newTypeName}
        onChangeText={setNewTypeName}
        onAddType={() => {
          if (newTypeName.trim()) {
            handleAddCustomType(newTypeName);
            setIsAddTypeModalVisible(false);
            setNewTypeName('');
          }
        }}
        onCancel={() => {
          setIsAddTypeModalVisible(false);
          setNewTypeName('');
        }}
      />
      
      {/* 添加刪除類型確認對話框 */}
      <DeleteTypeConfirm
        isVisible={isDeleteTypeModalVisible}
        typeName={typeToDelete?.name || ""}
        onCancel={() => {
          setIsDeleteTypeModalVisible(false);
          setTypeToDelete(null);
        }}
        onConfirm={handleDeleteType}
        isDarkMode={isDarkMode}
      />
      
      {/* 底部浮動按鈕區域 - 只保留新增按鈕 */}
      <View style={{
    position: 'absolute',
        bottom: insets.bottom + ds(20),
        right: ds(20),
    flexDirection: 'row',
    alignItems: 'center',
        zIndex: 100
      }}>
        <TouchableOpacity
          style={{
            width: ds(56),
            height: ds(56),
            borderRadius: ds(28),
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
          }}
          onPress={handleToggleBottomSheet}
          activeOpacity={0.8}
        >
          <Plus size={ds(24)} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      {/* 自定義警告彈窗 */}
      <CustomAlert
        visible={customAlertConfig.visible}
        title={customAlertConfig.title}
        message={customAlertConfig.message}
        buttons={customAlertConfig.buttons}
        onDismiss={hideCustomAlert}
        isDarkMode={isDarkMode}
      />

      {/* 主密碼輸入框模態視窗 */}
      <Modal
        visible={isMasterPasswordModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setIsMasterPasswordModalVisible(false);
          setInputMasterPassword('');
          setBackupDataToDecrypt(null);
        }}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: '80%', backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF', borderRadius: 16, padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: isDarkMode ? '#FFFFFF' : '#000000', marginBottom: 20, textAlign: 'center' }}>
              {t('backup.enterMasterPassword', '輸入主密碼')}
            </Text>
            <Text style={{ fontSize: 14, color: isDarkMode ? '#FFFFFF' : '#000000', marginBottom: 10, textAlign: 'center' }}>
              {t('backup.decryptBackupDescription', '請輸入當前的主密碼來解密備份文件。')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <TextInput
                style={{
                  flex: 1,
                  height: 40,
                  borderWidth: 1,
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)',
                  borderRadius: 8,
                  padding: 10,
                  color: isDarkMode ? '#FFFFFF' : '#000000',
                }}
                secureTextEntry={!showMasterPassword}
                value={inputMasterPassword}
                onChangeText={setInputMasterPassword}
                placeholder={t('backup.masterPassword', '主密碼')}
                placeholderTextColor={isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.3)'}
              />
              <TouchableOpacity
                style={{ marginLeft: 10 }}
                onPress={() => setShowMasterPassword(!showMasterPassword)}
              >
                {showMasterPassword ? 
                  <EyeOff size={20} color={isDarkMode ? "#FFFFFF" : "#000000"} /> : 
                  <Eye size={20} color={isDarkMode ? "#FFFFFF" : "#000000"} />
                }
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity
                style={{
                  padding: 10,
                  borderRadius: 8,
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                }}
                onPress={() => {
                  setIsMasterPasswordModalVisible(false);
                  setInputMasterPassword('');
                  setBackupDataToDecrypt(null);
                }}
              >
                <Text style={{ color: isDarkMode ? '#FFFFFF' : '#000000' }}>{t('common.cancel', '取消')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  padding: 10,
                  borderRadius: 8,
                  backgroundColor: '#007AFF',
                }}
                onPress={handleMasterPasswordConfirm}
              >
                <Text style={{ color: '#FFFFFF' }}>{t('common.confirm', '確認')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 免責聲明模態視窗 */}
      <Modal
        visible={isDisclaimerModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeDisclaimerModal}
      >
        <TouchableWithoutFeedback onPress={closeDisclaimerModal}>
          <View style={{
            flex: 1, 
            backgroundColor: 'rgba(0,0,0,0.5)', 
            justifyContent: 'center', 
            alignItems: 'center',
            paddingVertical: 20
          }}>
            <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
              <View style={{
                width: '85%',
                maxHeight: '90%',
                backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF',
                borderRadius: 16,
                elevation: 5,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
              }}>
                <ScrollView contentContainerStyle={{ padding: 20 }}>
                  <Text style={{ 
                    fontSize: 18, 
                    fontWeight: 'bold', 
                    color: isDarkMode ? '#FFFFFF' : '#000000', 
                    marginBottom: 20,
                    textAlign: 'center'
                  }}>
                    {t('settings.disclaimer', '免責聲明')}
                  </Text>
                  
                  <Text style={{ 
                    fontSize: 14, 
                    color: isDarkMode ? '#FFFFFF' : '#000000', 
                    marginBottom: 10,
                    lineHeight: 22
                  }}>
                    {t('settings.disclaimerText1', '本密碼管理應用程式僅供個人使用，您應自行承擔使用本應用的風險。')}
                  </Text>
                  
                  <Text style={{ 
                    fontSize: 14, 
                    color: isDarkMode ? '#FFFFFF' : '#000000', 
                    marginBottom: 10,
                    lineHeight: 22
                  }}>
                    {t('settings.disclaimerText2', '我們盡最大努力確保您的數據安全，但對於任何數據丟失、被盜或損壞，我們不承擔任何責任。')}
                  </Text>
                  
                  <Text style={{ 
                    fontSize: 14, 
                    color: isDarkMode ? '#FFFFFF' : '#000000', 
                    marginBottom: 10,
                    lineHeight: 22
                  }}>
                    {t('settings.disclaimerText3', '請定期備份您的密碼數據，並妥善保管您的主密碼。如果您忘記主密碼，我們無法幫助您恢復數據。')}
                  </Text>
                  
                  <Text style={{ 
                    fontSize: 14, 
                    color: isDarkMode ? '#FFFFFF' : '#000000', 
                    marginBottom: 10,
                    lineHeight: 22
                  }}>
                    {t('settings.disclaimerText4', '此應用的開發者不對任何因使用本應用而導致的直接或間接損失負責，包括但不限於數據丟失、財務損失、隱私洩露等。')}
                  </Text>
                </ScrollView>
                
                <TouchableOpacity
                  style={{
                    margin: 20,
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor: '#007AFF',
                    alignItems: 'center',
                  }}
                  onPress={closeDisclaimerModal}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
                    {t('common.understood', '我已了解')}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      
      {/* 變更密碼的彈窗 */}
      <Modal
        visible={isChangePasswordModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeChangePasswordModal}
      >
        <TouchableWithoutFeedback onPress={closeChangePasswordModal}>
          <View style={{
            flex: 1, 
            backgroundColor: 'rgba(0,0,0,0.5)', 
            justifyContent: 'center', 
            alignItems: 'center',
            paddingVertical: 20
          }}>
            <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
              <View style={{
                width: '85%',
                maxHeight: '90%',
                backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF',
                borderRadius: 16,
                elevation: 5,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
              }}>
                <ScrollView contentContainerStyle={{ padding: 20 }}>
                  <Text style={{ 
                    fontSize: 18, 
                    fontWeight: 'bold', 
                    color: isDarkMode ? '#FFFFFF' : '#000000', 
                    marginBottom: 20,
                    textAlign: 'center'
                  }}>
                    {t('settings.changePassword', '變更主密碼')}
                  </Text>
                  
                  {/* 在此添加變更密碼的表單 */}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}