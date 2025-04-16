import React, { useState, useRef, useEffect, useLayoutEffect } from "react"
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
  FlatList,
  Platform,
  Animated,
  useWindowDimensions,
  SafeAreaView,
  KeyboardAvoidingView,
  Modal,
  TouchableWithoutFeedback,
  PanResponder,
  Dimensions,
  Pressable,
  Keyboard,
  LayoutChangeEvent,
  LayoutRectangle
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
  X
} from "lucide-react-native"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import { StatusBar } from "expo-status-bar"
import TypeFilter from "../components/TypeFilter";
import AddTypeModal from "../components/AddTypeModal";
import SectionHeader from "../components/SectionHeader";
import TypeDropdown from "../components/TypeDropdown";

// Sample data for demonstration
const SAMPLE_PASSWORDS = [
  {
    id: '1',
    title: 'Google',
    username: 'user@gmail.com',
    password: 'StrongP@ss123',
    category: 'work',
    type: 'website',
    notes: 'Last updated: March 2023',
    favorite: true
  },
  {
    id: '7',
    title: 'Google',
    username: '87878787us7777er@gmai77l.com',
    password: 'S878@87878787',
    category: 'work',
    type: 'website',
    notes: '長度測試長度測試長度測試長度測試長度測試長度測試長度測試',
    favorite: true
  },
  {
    id: '2',
    title: 'Facebook',
    username: 'username123',
    password: 'FB_secure456!',
    category: 'personal',
    type: 'social',
    notes: 'Personal account',
    favorite: false
  },
  {
    id: '3',
    title: 'Bank of America',
    username: 'johnsmith',
    password: 'B@nk!ng789',
    category: 'finance',
    type: 'bank',
    notes: 'Checking account',
    favorite: true
  },
  {
    id: '4',
    title: 'Instagram',
    username: 'photo_lover',
    password: 'Inst@2023!',
    category: 'personal',
    type: 'social',
    notes: '',
    favorite: false
  },
  {
    id: '5',
    title: 'Netflix',
    username: 'movie_fan',
    password: 'N3tfl!xW@tch',
    category: 'personal',
    type: 'app',
    notes: 'Family subscription',
    favorite: false
  },
  {
    id: '6',
    title: 'Company Portal',
    username: 'employee123',
    password: 'W0rkP@ss!',
    category: 'work',
    type: 'website',
    notes: 'VPN required',
    favorite: true
  },
];

// Types for filtering
const TYPES = [
  { id: 'all', name: 'All Types', icon: Lock },
  { id: 'website', name: 'Website', icon: Globe },
  { id: 'social', name: 'Social', icon: MessageCircle },
  { id: 'bank', name: 'Bank', icon: CreditCard },
  { id: 'app', name: 'App', icon: Smartphone }
];

interface PasswordItem {
  id: string;
  title: string;
  username: string;
  password: string;
  category: string;
  type: string;
  notes: string;
  favorite: boolean;
}

interface GroupedPasswords {
  [key: string]: PasswordItem[];
}

export default function PasswordManagerHome() {
  const { width, height, fontScale } = useWindowDimensions()
  const baseScale = Math.min(width / 375, height / 812)
  const ds = (size: number) => size * baseScale
  const df = (size: number) => size * Math.min(baseScale, fontScale * 1.2)

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [copiedAnimation] = useState(new Animated.Value(0));
  const [copiedText, setCopiedText] = useState('');
  const [showCopiedNotification, setShowCopiedNotification] = useState(false);
  const [customTypes, setCustomTypes] = useState<Array<{id: string, name: string}>>([]);
  const [newTypeName, setNewTypeName] = useState('');
  const [isAddingType, setIsAddingType] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({all: true});
  
  // Bottom sheet states
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);
  const [newPasswordTitle, setNewPasswordTitle] = useState('');
  const [newPasswordUsername, setNewPasswordUsername] = useState('');
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [newPasswordType, setNewPasswordType] = useState('website');
  const [newPasswordNotes, setNewPasswordNotes] = useState('');
  const [isTypeDropdownVisible, setIsTypeDropdownVisible] = useState(false);
  const bottomSheetAnimation = useRef(new Animated.Value(0)).current;
  
  // 記錄底部面板的位置
  const [isDragging, setIsDragging] = useState(false);
  
  // 添加類型選擇下拉選單的位置狀態
  const [typeSelectorPosition, setTypeSelectorPosition] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
  const typeSelectorRef = useRef<View>(null);
  const typeListRef = useRef<ScrollView>(null);
  
  // 獲取屏幕尺寸
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  // 計算最大顯示項目數
  const MAX_VISIBLE_ITEMS = 5;
  const ITEM_HEIGHT = 50;
  
  // 創建新的PanResponder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        // 下拉選單顯示時，不響應手勢
        return !isTypeDropdownVisible;
      },
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // 下拉選單顯示時，不響應移動
        return !isTypeDropdownVisible && Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        // 開始拖動時先停止任何正在進行的動畫
        bottomSheetAnimation.stopAnimation();
        setIsDragging(true);
      },
      onPanResponderMove: (_, gestureState) => {
        // 根據手指移動距離計算新位置
        // 這裡使用插值計算，讓卡片位置跟隨手指移動
        // 計算方式：從當前值1(完全展開)開始，減去手指移動的比例
        // maxOffset是設定拖動的最大距離，對應底部卡片的高度
        const maxOffset = screenHeight * 0.6; // 使用螢幕高度的60%作為最大拖動距離
        
        // 计算新位置：從1(完全展開)減去拖動比例
        // 限制值在0到1之間，0表示完全關閉，1表示完全展開
        const newPosition = Math.max(0, Math.min(1 - (gestureState.dy / maxOffset), 1));
        
        // 將計算的位置設置給底部卡片的動畫值
        bottomSheetAnimation.setValue(newPosition);
      },
      onPanResponderRelease: (_, gestureState) => {
        setIsDragging(false);
        
        // 拖動結束時判斷是否要關閉卡片
        // 條件1：拖動到螢幕高度的40%以下
        // 條件2：下滑速度大於0.5
        const screenHeightThreshold = screenHeight * 0.4;
        const maxOffset = screenHeight * 0.6;
        const draggedDistance = gestureState.dy;
        const dragPercentage = draggedDistance / maxOffset;
        
        // 判斷是否應該關閉卡片
        if (dragPercentage > 0.4 || (gestureState.dy > 0 && gestureState.vy > 0.5)) {
          // 超過閾值或有足夠的下滑速度，關閉卡片
          hideBottomSheet();
        } else {
          // 否則彈回完全打開狀態
          showBottomSheet();
        }
      },
      onPanResponderTerminate: () => {
        // 手勢被中斷時恢復當前狀態
        setIsDragging(false);
        if (isBottomSheetVisible) {
          showBottomSheet();
        } else {
          hideBottomSheet();
        }
      },
    })
  ).current;
  
  // Toggle bottom sheet
  const toggleBottomSheet = () => {
    if (isBottomSheetVisible) {
      // Hide bottom sheet
      hideBottomSheet();
    } else {
      // Show bottom sheet
      showBottomSheet();
    }
  };
  
  // Show bottom sheet
  const showBottomSheet = () => {
    setIsBottomSheetVisible(true);
    Animated.timing(bottomSheetAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true, // 直接操作transform屬性可以使用native driver
    }).start();
  };
  
  // Hide bottom sheet
  const hideBottomSheet = () => {
    // 先關閉下拉式選單，避免殘留
    setIsTypeDropdownVisible(false);
    
    Animated.timing(bottomSheetAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true, // 直接操作transform屬性可以使用native driver
    }).start(() => {
      setIsBottomSheetVisible(false);
      resetNewPasswordForm();
    });
  };
  
  // Reset form fields
  const resetNewPasswordForm = () => {
    setNewPasswordTitle('');
    setNewPasswordUsername('');
    setNewPasswordValue('');
    setNewPasswordType('website');
    setNewPasswordNotes('');
    // 確保下拉式選單狀態被重置
    setIsTypeDropdownVisible(false);
  };
  
  // Add new password
  const handleAddPassword = () => {
    // Validation
    if (!newPasswordTitle || !newPasswordUsername || !newPasswordValue) {
      // Show error message
      setCopiedText('Please fill in all required fields');
      setShowCopiedNotification(true);
      
      Animated.sequence([
        Animated.timing(copiedAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
        Animated.timing(copiedAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowCopiedNotification(false);
      });
      
      return;
    }
    
    // In a real app, this would save to database
    console.log('Adding new password:', {
      title: newPasswordTitle,
      username: newPasswordUsername,
      password: newPasswordValue,
      type: newPasswordType,
      notes: newPasswordNotes,
    });
    
    // Close bottom sheet and reset form
    toggleBottomSheet();
    
    // Show success message
    setCopiedText('Password added successfully!');
    setShowCopiedNotification(true);
    
    Animated.sequence([
      Animated.timing(copiedAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(1500),
      Animated.timing(copiedAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowCopiedNotification(false);
    });
  };

  // Filter passwords based on search and type
  const filteredPasswords = SAMPLE_PASSWORDS.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.notes.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedType === 'all' || item.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  // Group passwords by type
  const groupedPasswords = filteredPasswords.reduce<GroupedPasswords>((groups, password) => {
    const type = password.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(password);
    return groups;
  }, {});

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Add new custom type
  const addCustomType = (typeName: string = newTypeName.trim()) => {
    if (!typeName) return;
    
    const newTypeId = `custom_${Date.now()}`;
    setCustomTypes(prev => [...prev, {id: newTypeId, name: typeName}]);
    setNewTypeName('');
    setIsAddingType(false);
    setSelectedType(newTypeId);
    Keyboard.dismiss();
  };

  // Handle copy action
  const handleCopy = (text: string, type: string) => {
    // In a real app, this would copy to clipboard
    console.log(`Copied ${type}: ${text}`);
    
    // Show copy notification
    setCopiedText(`${type} copied!`);
    setShowCopiedNotification(true);
    
    // Animate notification
    Animated.sequence([
      Animated.timing(copiedAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(1500),
      Animated.timing(copiedAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowCopiedNotification(false);
    });
    
    // Auto-clear clipboard after 30 seconds (simulated)
    setTimeout(() => {
      console.log('Clipboard cleared for security');
    }, 30000);
  };

  // Get icon for password type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'website':
        return <Globe size={16} color="rgba(60, 60, 67, 0.6)" />;
      case 'social':
        return <MessageCircle size={16} color="rgba(60, 60, 67, 0.6)" />;
      case 'bank':
        return <CreditCard size={16} color="rgba(60, 60, 67, 0.6)" />;
      case 'app':
        return <Smartphone size={16} color="rgba(60, 60, 67, 0.6)" />;
      default:
        return <Lock size={16} color="rgba(60, 60, 67, 0.6)" />;
    }
  };

  // Password card component
  const PasswordCard = ({ item }: { item: PasswordItem }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    
    const toggleExpand = () => {
      setIsExpanded(!isExpanded);
    };
    
    return (
      <View style={styles.cardContainer}>
        <TouchableOpacity 
          style={styles.cardHeader}
          onPress={toggleExpand}
          activeOpacity={0.7}
        >
          <View style={styles.cardTitleContainer}>
            {getTypeIcon(item.type)}
            <Text style={styles.cardTitle}>{item.title}</Text>
          </View>
          <View style={styles.cardHeaderRight}>
            <View style={styles.cardBadge}>
              <Text style={styles.cardBadgeText}>
                {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
              </Text>
            </View>
            <ChevronRight 
              size={16} 
              color="rgba(60, 60, 67, 0.6)" 
              style={{
                marginLeft: 8,
                transform: [{ rotate: isExpanded ? '90deg' : '0deg' }]
              }}
            />
          </View>
        </TouchableOpacity>
        
        {isExpanded && (
          <>
            <View style={styles.cardBody}>
              <View style={styles.credentialRow}>
                <Text style={styles.credentialLabel}>Username</Text>
                <View style={styles.credentialValueContainer}>
                  <Text style={styles.credentialValue} numberOfLines={1}>
                    {item.username}
                  </Text>
                  <TouchableOpacity 
                    style={styles.copyButton}
                    onPress={() => handleCopy(item.username, 'Username')}
                  >
                    <Copy size={16} color="#007AFF" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.credentialRow}>
                <Text style={styles.credentialLabel}>Password</Text>
                <View style={styles.credentialValueContainer}>
                  <Text style={styles.credentialValue} numberOfLines={1}>
                    {showPassword ? item.password : '••••••••••••'}
                  </Text>
                  <View style={styles.passwordActions}>
                    <TouchableOpacity 
                      style={styles.visibilityButton}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff size={16} color="#007AFF" />
                      ) : (
                        <Eye size={16} color="#007AFF" />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.copyButton}
                      onPress={() => handleCopy(item.password, 'Password')}
                    >
                      <Copy size={16} color="#007AFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              
              {item.notes ? (
                <View style={styles.notesContainer}>
                  <Text style={styles.notesText} numberOfLines={2}>
                    {item.notes}
                  </Text>
                </View>
              ) : null}
            </View>
            
            <TouchableOpacity style={styles.cardFooter}>
              <Text style={styles.detailsText}>View Details</Text>
              <ChevronRight size={16} color="#007AFF" />
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  // 1. 首先添加一個新的 Modal 狀態
  const [isAddTypeModalVisible, setIsAddTypeModalVisible] = useState(false);

  // 添加引入
  const [typeBtnMeasure, setTypeBtnMeasure] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    pageX: number;
    pageY: number;
  }>({ x: 0, y: 0, width: 0, height: 0, pageX: 0, pageY: 0 });

  // 添加缺少的 handleBackgroundPress 函數
  const handleBackgroundPress = () => {
    if (isTypeDropdownVisible) {
      setIsTypeDropdownVisible(false);
    }
  };

  // 添加缺少的 handleTypeSelectorPress 函數
  const handleTypeSelectorPress = () => {
    if (!isBottomSheetVisible) return;
    
    if (typeSelectorRef.current) {
      typeSelectorRef.current.measureInWindow((x, y, width, height) => {
        setTypeBtnMeasure({
          x, y, width, height,
          pageX: x,
          pageY: y
        });
        setIsTypeDropdownVisible(!isTypeDropdownVisible);
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient colors={["#f0f4ff", "#ffffff"]} style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView
        style={styles.kv}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        enabled={Platform.OS === "ios"}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Password Manager</Text>
            <TouchableOpacity style={styles.addButton} onPress={toggleBottomSheet}>
              <Plus size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <BlurView intensity={30} tint="light" style={styles.searchBar}>
              <Search size={18} color="rgba(60, 60, 67, 0.6)" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search passwords..."
                placeholderTextColor="rgba(60, 60, 67, 0.3)"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </BlurView>
          </View>
          
          <TypeFilter 
            types={TYPES}
            customTypes={customTypes}
            selectedType={selectedType}
            onSelectType={setSelectedType}
            onAddCustomType={addCustomType}
          />
          
          {Object.keys(groupedPasswords).length > 0 ? (
            Object.entries(groupedPasswords).map(([type, passwords]) => (
              <View key={type} style={styles.typeSection}>
                <SectionHeader 
                  title={type} 
                  count={passwords.length}
                  isExpanded={expandedSections[type] || false}
                  onToggle={() => toggleSection(type)}
                />
                
                {expandedSections[type] && passwords.map((password: PasswordItem) => (
                  <PasswordCard key={password.id} item={password} />
                ))}
              </View>
            ))
          ) : (
            <View style={styles.emptyStateContainer}>
              <Lock size={48} color="rgba(60, 60, 67, 0.3)" />
              <Text style={styles.emptyStateText}>No passwords found</Text>
              <Text style={styles.emptyStateSubtext}>
                Try adjusting your search or filters
              </Text>
            </View>
          )}
          
          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Copied notification */}
      {showCopiedNotification && (
        <Animated.View 
          style={[
            styles.copiedNotification,
            {
              opacity: copiedAnimation,
              transform: [
                {
                  translateY: copiedAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <BlurView intensity={80} tint="dark" style={styles.copiedNotificationBlur}>
            <Copy size={16} color="#FFFFFF" />
            <Text style={styles.copiedNotificationText}>{copiedText}</Text>
          </BlurView>
        </Animated.View>
      )}
      
      {/* Bottom Sheet */}
      <Modal
        visible={isBottomSheetVisible}
        transparent={true}
        animationType="none"
        onRequestClose={toggleBottomSheet}
        statusBarTranslucent={true}
      >
        <TouchableWithoutFeedback onPress={handleBackgroundPress}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={toggleBottomSheet}>
              <View style={styles.backgroundOverlay}></View>
            </TouchableWithoutFeedback>
            
            <Animated.View 
              style={[
                styles.bottomSheet,
                {
                  transform: [
                    {
                      translateY: bottomSheetAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [600, 0],
                      }),
                    },
                  ],
                },
              ]}
              {...panResponder.panHandlers}
            >
              <View style={styles.bottomSheetHeader}>
                <View style={styles.bottomSheetHandle} />
              </View>
              
              {/* 空白卡片表單 */}
              <View style={styles.emptyCardContainer}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleContainer}>
                    <TextInput
                      style={styles.cardTitleInput}
                      placeholder="標題 (如 Google)"
                      value={newPasswordTitle}
                      onChangeText={setNewPasswordTitle}
                    />
                  </View>
                  <TouchableOpacity 
                    ref={typeSelectorRef}
                    style={styles.typeSelector}
                    onPress={handleTypeSelectorPress}
                  >
                    <View style={styles.typeSelectorContent}>
                      {getTypeIcon(newPasswordType)}
                      <Text style={styles.typeSelectorText} numberOfLines={1} ellipsizeMode="tail">
                        {TYPES.find(t => t.id === newPasswordType)?.name || 'Website'}
                      </Text>
                    </View>
                    <ChevronRight 
                      size={16} 
                      color="rgba(60, 60, 67, 0.6)" 
                      style={{
                        transform: [{ rotate: isTypeDropdownVisible ? '90deg' : '0deg' }]
                      }}
                    />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.cardBody}>
                  <View style={styles.credentialRow}>
                    <Text style={styles.credentialLabel}>使用者名稱</Text>
                    <View style={styles.credentialInputContainer}>
                      <TextInput
                        style={styles.credentialInput}
                        placeholder="user@example.com"
                        value={newPasswordUsername}
                        onChangeText={setNewPasswordUsername}
                        autoCapitalize="none"
                      />
                    </View>
                  </View>
                  
                  <View style={styles.credentialRow}>
                    <Text style={styles.credentialLabel}>密碼</Text>
                    <View style={styles.credentialInputContainer}>
                      <TextInput
                        style={styles.credentialInput}
                        placeholder="••••••••••••"
                        value={newPasswordValue}
                        onChangeText={setNewPasswordValue}
                        secureTextEntry
                      />
                    </View>
                  </View>
                  
                  <View style={styles.credentialRow}>
                    <Text style={styles.credentialLabel}>備註</Text>
                    <View style={styles.credentialInputContainer}>
                      <TextInput
                        style={[styles.credentialInput, styles.notesInput]}
                        placeholder="輸入備註（選填）"
                        value={newPasswordNotes}
                        onChangeText={setNewPasswordNotes}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                      />
                    </View>
                  </View>
                  
                  <View style={styles.bottomButtonContainer}>
                    <TouchableOpacity
                      style={styles.confirmButton}
                      onPress={handleAddPassword}
                    >
                      <Plus size={14} color="#007AFF" />
                      <Text style={styles.confirmButtonText}>確認新增</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Animated.View>
            
            {/* 類型選項下拉選單 */}
            {isTypeDropdownVisible && (
              <TypeDropdown
                types={TYPES}
                selectedType={newPasswordType}
                onSelectType={setNewPasswordType}
                onClose={() => setIsTypeDropdownVisible(false)}
                position={typeBtnMeasure}
              />
            )}
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      <AddTypeModal 
        isVisible={isAddTypeModalVisible}
        newTypeName={newTypeName}
        onChangeText={setNewTypeName}
        onAddType={() => {
          if (newTypeName.trim()) {
            addCustomType();
          }
        }}
        onCancel={() => {
          setIsAddTypeModalVisible(false);
          setNewTypeName('');
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f7",
  },
  kv: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  cardContainer: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    backgroundColor: "rgba(255,255,255,0.8)",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  searchInput: {
    flex: 1,
    height: 44,
    marginLeft: 8,
    fontSize: 16,
    color: '#000',
  },
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
    padding: 16,
  },
  addTypeInput: {
    width: '100%',
    height: 40,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(60, 60, 67, 0.3)',
    borderRadius: 8,
    marginBottom: 16,
  },
  addTypeActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  addTypeActionButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(60, 60, 67, 0.3)',
    borderRadius: 8,
    marginLeft: 8,
  },
  addTypeActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  typeSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(60, 60, 67, 0.1)',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  sectionHeaderCount: {
    marginLeft: 8,
    backgroundColor: 'rgba(60, 60, 67, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sectionHeaderCountText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(60, 60, 67, 0.7)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(60, 60, 67, 0.1)',
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  cardBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(60, 60, 67, 0.1)',
  },
  cardBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(60, 60, 67, 0.7)',
  },
  cardBody: {
    padding: 16,
  },
  credentialRow: {
    marginBottom: 12,
  },
  credentialLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(60, 60, 67, 0.6)',
    marginBottom: 4,
  },
  credentialValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  credentialValue: {
    fontSize: 15,
    color: '#000',
    flex: 1,
  },
  passwordActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  copyButton: {
    padding: 4,
  },
  visibilityButton: {
    padding: 4,
    marginRight: 8,
  },
  notesContainer: {
    marginTop: 8,
    padding: 10,
    backgroundColor: 'rgba(60, 60, 67, 0.05)',
    borderRadius: 8,
  },
  notesText: {
    fontSize: 13,
    color: 'rgba(60, 60, 67, 0.8)',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(60, 60, 67, 0.1)',
  },
  detailsText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginRight: 4,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(60, 60, 67, 0.6)',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: 'rgba(60, 60, 67, 0.4)',
    marginTop: 8,
  },
  bottomPadding: {
    height: 100,
  },
  copiedNotification: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  copiedNotificationBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  copiedNotificationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  bottomSheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(60, 60, 67, 0.3)',
    marginBottom: 10,
    alignSelf: 'center',
    position: 'absolute',
    top: -15,
    left: '50%',
    marginLeft: -20,
    zIndex: 10,
  },
  bottomSheetContent: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(60, 60, 67, 0.6)',
    marginBottom: 4,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: 'rgba(60, 60, 67, 0.3)',
    borderRadius: 8,
    padding: 12,
  },
  textInput: {
    fontSize: 16,
    color: '#000',
  },
  typeSelection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  typeSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(60, 60, 67, 0.3)',
    borderRadius: 8,
    marginRight: 8,
  },
  typeSelectButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeSelectButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 4,
  },
  typeSelectButtonTextActive: {
    color: '#FFFFFF',
  },
  bottomSheetActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  cancelButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(60, 60, 67, 0.3)',
    borderRadius: 8,
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(60, 60, 67, 0.6)',
  },
  submitButton: {
    padding: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  textAreaInput: {
    height: 100,
  },
  emptyCardContainer: {
    padding: 16,
  },
  cardTitleInput: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  typeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(60, 60, 67, 0.3)',
    borderRadius: 8,
    width: 150,
    justifyContent: 'space-between',
  },
  typeSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 4,
  },
  typeSelectorText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 8,
    flex: 1,
  },
  typeDropdownContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(60, 60, 67, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 5,
    overflow: 'hidden',
    zIndex: 1000,
  },
  typeDropdownScroll: {
    maxHeight: 200,
  },
  typeDropdownContent: {
    paddingVertical: 0,
  },
  typeDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(60, 60, 67, 0.1)',
  },
  typeDropdownItemLast: {
    borderBottomWidth: 0,
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
  credentialInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  credentialInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  notesInput: {
    height: 100,
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
  closeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 8,
  },
  dropdownAbsolute: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(60, 60, 67, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 5,
    overflow: 'hidden',
    maxHeight: 200,
    width: 150,
  },
  typeDropdownWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(60, 60, 67, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 5,
    overflow: 'hidden',
    maxHeight: 200,
    width: 150,
  },
  addTypeModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    width: '80%',
    alignSelf: 'center',
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
})
