import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
  KeyboardAvoidingView,
  useWindowDimensions,
  Keyboard,
  PixelRatio,
  ScrollView,
  Alert,
  Image,
  SafeAreaView,
  TouchableWithoutFeedback,
  useColorScheme,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { TextInput } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useForegroundPermissions,
  requestForegroundPermissionsAsync,
} from 'expo-location';
import { FadeInDown, FadeInUp } from "react-native-reanimated";
import {
  hasHardwareAsync,
  isEnrolledAsync,
  authenticateAsync,
} from "expo-local-authentication";

export default function LoginScreen() {
  /* ---------------- i18n ---------------- */
  const { t } = useTranslation();
  
  /* ---------------- theme ---------------- */
  const colorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const router = useRouter();
  
  // 從 AsyncStorage 獲取用戶設定的深色模式偏好
  useEffect(() => {
    const loadDarkModePreference = async () => {
      try {
        // 使用與 HOME 頁面相同的鍵值
        const DARK_MODE_STORAGE_KEY = 'passwordManager_darkMode';
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

  // 檢查用戶是否已同意免責聲明
  useEffect(() => {
    const checkDisclaimerAgreement = async () => {
      try {
        const hasAgreedToDisclaimer = await AsyncStorage.getItem('has_agreed_to_disclaimer');
        
        // 如果用戶尚未同意免責聲明，導航到免責聲明頁面
        if (hasAgreedToDisclaimer !== 'true') {
          router.replace('/disclaimer');
        }
      } catch (error) {
        console.error('檢查免責聲明同意狀態失敗:', error);
      }
    };
    
    checkDisclaimerAgreement();
  }, [router]);

  /* ---------------- responsive helpers ---------------- */
  const { width, height, fontScale } = useWindowDimensions();
  const baseScale = Math.min(width / 375, height / 812);
  const ds = (n: number) => n * baseScale; // dynamic size
  const df = (n: number) => n * Math.min(fontScale, 1.2); // dynamic font
  const insets = useSafeAreaInsets();

  /* ---------------- states ---------------- */
  const [password, setPassword] = useState("");
  const [storedPassword, setStoredPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [hasAttemptedAuth, setHasAttemptedAuth] = useState(false);
  const [biometricAuthFailed, setBiometricAuthFailed] = useState(false);
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const [showWelcome, setShowWelcome] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [autoCheckingBiometrics, setAutoCheckingBiometrics] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [permissionStatus, requestPermission] = useForegroundPermissions();
  const inputRef = useRef<TextInput>(null);
  const blurTimeout = useRef<NodeJS.Timeout>();
  const wrongPasswordCount = useRef(0);
  const [biometryType, setBiometryType] = useState<string | null>(null);
  const biometricChecked = useRef(false);

  /* ---------------- onLogin function ---------------- */
  const onLogin = useCallback(async (validPassword: string) => {
    try {
      // 儲存密碼到 SecureStore
      await SecureStore.setItemAsync('master_password', validPassword);
      
      // 登入成功，導航至主頁
      router.replace('/home');
    } catch (error) {
      console.error('登入錯誤:', error);
      setErrorMessage(t('auth.faceIDError'));
      setIsAuthenticating(false);
    }
  }, [router, setErrorMessage, t]);

  /* ---------------- reusable shake ---------------- */
  const triggerShake = () => {
    shakeAnimation.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 5, duration: 30, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -5, duration: 30, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 5, duration: 30, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 30, useNativeDriver: true }),
    ]).start();
  };

  /* ---------------- biometric authentication ---------------- */
  const authenticateWithBiometrics = async () => {
    setIsAuthenticating(true);
    setHasAttemptedAuth(true); // 標記已嘗試過認證
    
    try {
      // 先檢查是否有存儲的密碼
      const savedPwd = await SecureStore.getItemAsync('master_password');
      
      if (!savedPwd) {
        console.log('未找到存儲的主密碼');
        setIsAuthenticating(false);
        setBiometricAuthFailed(true);
        setErrorMessage(t('auth.noPasswordStored'));
        // 觸發震動反饋
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        return;
      }
      
      // 有密碼，繼續生物認證
      const result = await authenticateAsync({
        promptMessage: t('login.authPrompt'),
        fallbackLabel: t('login.authFallback'),
      });
      
      if (result.success) {
        // 生物識別成功，執行登入
        console.log('生物認證成功，執行登入');
        setStoredPassword(savedPwd); // 保存找到的密碼
        onLogin(savedPwd);  // 直接登入
      } else {
        // 生物識別失敗
        console.log('生物認證失敗或取消:', result);
        setIsAuthenticating(false);
        setBiometricAuthFailed(true);
        triggerShake();
        setErrorMessage(t('auth.biometricFailed'));
        // 觸發震動反饋
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
    } catch (error) {
      console.log('認證過程中發生錯誤:', error);
      setIsAuthenticating(false);
      setBiometricAuthFailed(true);
      triggerShake();
      setErrorMessage(t('auth.biometricError'));
      // 觸發震動反饋
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  /* ---------------- keyboard listener ---------------- */
  useEffect(() => {
    let isMounted = true; // 防止組件卸載後的狀態更新
    
    // Check if device supports biometric authentication
    (async () => {
      if (!isMounted) return;
      
      try {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        console.log('設備支持生物識別硬件:', compatible);
        
        if (!isMounted) return;
        setIsBiometricSupported(compatible);
        
        if (compatible) {
          const enrolled = await LocalAuthentication.isEnrolledAsync();
          console.log('設備已註冊生物識別:', enrolled);
          
          if (!isMounted) return;
          
          // 檢查生物識別類型
          try {
            const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
            console.log('支持的認證類型:', types);
            
            // 設置生物識別類型 - 類型1是指紋(TouchID)，類型2是臉部識別(FaceID)
            if (types.includes(2)) {
              setBiometryType('FaceID');
            } else if (types.includes(1)) {
              setBiometryType('TouchID');
            }
            
            // 獲取系統生物識別狀態
            const biometricLevel = await LocalAuthentication.getEnrolledLevelAsync();
            console.log('生物識別級別:', biometricLevel);
          } catch (levelError) {
            console.log('獲取生物識別資訊錯誤:', levelError);
          }
          
          // 如果設備支持生物識別並且已註冊，且尚未嘗試過認證，則嘗試驗證
          if (enrolled && !hasAttemptedAuth && !biometricAuthFailed && isMounted) {
            // 先檢查是否有已存儲的密碼
            const hasSavedPassword = await SecureStore.getItemAsync('master_password');
            
            if (!hasSavedPassword) {
              console.log('無已儲存的密碼，跳過自動生物認證');
              return;
            }
            
            // 先顯示準備中的提示
            setErrorMessage(t('auth.preparingFaceID'));
            
            // 短暫延遲後啟動生物認證
            setTimeout(() => {
              if (isMounted && !hasAttemptedAuth && !biometricAuthFailed) {
                console.log('自動啟動生物認證');
                authenticateWithBiometrics();
              }
            }, 700);
          }
        }
      } catch (error) {
        console.error('檢查生物識別支持時出錯:', error);
      }
    })();

    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      if (isMounted) setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      if (isMounted) setKeyboardVisible(false);
    });

    return () => {
      isMounted = false;
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
      // 重置生物辨識檢查狀態，確保下次進入頁面時能夠重新檢查
      biometricChecked.current = false;
    };
  }, [authenticateWithBiometrics, hasAttemptedAuth, biometricAuthFailed, t]);

  // 添加手動觸發 Face ID 的函數，帶有防抖動
  const lastAttemptRef = useRef<number>(0);
  
  const handleManualFaceID = async () => {
    const now = Date.now();
    // 防止在3秒內多次觸發
    if (now - lastAttemptRef.current < 3000) {
      setErrorMessage(t('auth.pleaseWait'));
      setTimeout(() => setErrorMessage(''), 2000);
      return;
    }
    
    // 先檢查是否有已存儲的密碼
    const hasSavedPassword = await SecureStore.getItemAsync('master_password');
    if (!hasSavedPassword) {
      triggerShake();
      setErrorMessage(t('auth.noPasswordStored'));
      setTimeout(() => setErrorMessage(''), 2000);
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }
    
    lastAttemptRef.current = now;
    setBiometricAuthFailed(false); // 用戶主動要求使用生物辨識，重置失敗狀態
    setErrorMessage(t('auth.preparingFaceID'));
    
    // 短暫延遲後啟動生物認證
    setTimeout(() => {
      authenticateWithBiometrics();
    }, 300);
  };

  /* ---------------- handlers ---------------- */
  const togglePasswordVisibility = () => setShowPassword((p) => !p);

  const handlePasswordChange = (text: string) => {
    const isValid = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/.test(text);
    const isTooLong = text.length > 20;

    if (!isValid) {
      triggerShake();
      setErrorMessage(t('auth.invalidCharacters'));
      setTimeout(() => setErrorMessage(""), 2000);
      return;
    }
    if (isTooLong) {
      triggerShake();
      setPassword(text.slice(0, 20));
      setErrorMessage(t('auth.passwordTooLong'));
      setTimeout(() => setErrorMessage(""), 2000);
      return;
    }
    setPassword(text);
    setErrorMessage("");
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (isSettingPassword) {
      if (!newPassword) {
        setErrorMessage(t('login.errorEmptyPassword'));
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage(t('login.errorPasswordMismatch'));
        return;
      }
      onLogin(newPassword);
      return;
    }

    // 生物辨識已失敗或取消的情況下，只進行密碼驗證
    setIsAuthenticating(true);
    setErrorMessage("");

    // 從 SecureStore 獲取保存的密碼
    const savedPassword = await SecureStore.getItemAsync('master_password');
    
    setTimeout(() => {
      if (!password) {
        setErrorMessage(t('login.errorEmptyPassword'));
        setIsAuthenticating(false);
        return;
      }
      
      if (password === savedPassword) {
        wrongPasswordCount.current = 0;
        onLogin(password);
      } else {
        wrongPasswordCount.current++;
        if (wrongPasswordCount.current >= 3) {
          setShowReset(true);
        }
        // Play error haptics on wrong password
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error
          );
        }
        setErrorMessage(t('login.errorIncorrectPassword'));
        setIsAuthenticating(false);
      }
    }, 300);
  };

  const handleBiometricAuth = () => {
    setBiometricAuthFailed(false);
    authenticateWithBiometrics();
  };

  /* ---------------- styles ---------------- */
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { 
          flex: 1, 
          backgroundColor: isDarkMode ? "#18181A" : "#f5f5f7" 
        },
        gradient: { 
          ...StyleSheet.absoluteFillObject,
          opacity: isDarkMode ? 0 : 1 
        },
        kv: { flex: 1 },
        topSection: {
          flex: 1,
          paddingHorizontal: ds(24),
          justifyContent: "center",
          alignItems: "center",
        },
        header: { alignItems: "center", marginBottom: ds(40) },
        title: { 
          fontSize: df(34), 
          fontWeight: "700", 
          color: isDarkMode ? "#FFFFFF" : "#000", 
          marginBottom: ds(12) 
        },
        subtitle: {
          fontSize: df(15),
          color: isDarkMode ? "rgba(255,255,255,0.7)" : "rgba(60,60,67,0.6)",
          textAlign: "center",
          paddingHorizontal: 0,
          maxWidth: "90%",
          fontFamily: Platform.OS === 'android' ? 'sans-serif' : undefined,
        },
        inputContainer: { width: "100%", marginBottom: ds(24) },
        inputBlur: {
          borderRadius: ds(14),
          overflow: "hidden",
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderColor: isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.5)",
          backgroundColor: isDarkMode ? "rgba(30,30,30,0.7)" : "rgba(255,255,255,0.7)",
        },
        input: { 
          flex: 1, 
          height: ds(56), 
          paddingHorizontal: ds(16), 
          fontSize: df(17), 
          color: isDarkMode ? "#FFFFFF" : "#000" 
        },
        eyeBtn: { paddingHorizontal: ds(16), height: ds(56), justifyContent: "center" },
        loginBtnWrap: {
          width: "100%",
          borderRadius: ds(25),
          overflow: "hidden",
          marginTop: ds(40),
          ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: ds(4) }, shadowOpacity: 0.3, shadowRadius: ds(8) }, android: { elevation: 5 } }),
        },
        transparentView: {
          backgroundColor: isDarkMode ? "rgba(30,30,30,0.7)" : "rgba(255,255,255,0.7)",
          borderRadius: ds(14),
          overflow: "hidden",
        },
        loginBtnGradient: { height: ds(56), justifyContent: "center", alignItems: "center" },
        loginTxt: { color: "#fff", fontSize: df(17), fontWeight: "600" },
        bottomSection: {
          paddingHorizontal: ds(24),
          paddingBottom: ds(24),
          alignItems: "center",
        },
        divider: { 
          borderTopWidth: 1, 
          borderTopColor: isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(60,60,67,0.2)", 
          width: "100%", 
          marginBottom: ds(10) 
        },
        dividerBlur: {
          backgroundColor: isDarkMode ? "rgba(30,30,30,0.7)" : "rgba(255,255,255,0.7)",
          paddingHorizontal: ds(16),
          paddingVertical: ds(4),
          borderRadius: ds(10)
        },
        dividerTxt: { 
          fontSize: df(14), 
          color: isDarkMode ? "rgba(255,255,255,0.6)" : "rgba(60,60,67,0.6)", 
          fontWeight: "500" 
        },
        errorWrap: { position: "absolute", top: ds(60), left: 0, right: 0, alignItems: "center" },
        errorBlur: {
          backgroundColor: isDarkMode ? "rgba(30,30,30,0.8)" : "rgba(255,255,255,0.7)",
          paddingHorizontal: ds(16),
          paddingVertical: ds(8),
          borderRadius: ds(10)
        },
        errorTxt: { fontSize: df(14), color: "#FF3B30", fontWeight: "500" },
        faceIdButton: {
          marginTop: 15,
          backgroundColor: isDarkMode ? 'rgba(50, 50, 50, 0.5)' : 'rgba(255, 255, 255, 0.3)',
          paddingVertical: 12,
          paddingHorizontal: 30,
          borderRadius: 25,
          width: '80%',
          alignItems: 'center',
        },
        faceIdButtonText: {
          color: isDarkMode ? '#FFFFFF' : '#fff',
          fontSize: 16,
          fontWeight: '600',
        },
      }),
    [width, height, fontScale, isDarkMode]
  );

  /* ---------------- render ---------------- */
  return (
    <SafeAreaView style={[
      styles.container,
      {
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right
      }
    ]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      {!isDarkMode && (
        <LinearGradient colors={["#f0f4ff", "#ffffff"]} style={styles.gradient} />
      )}

      <KeyboardAvoidingView
        style={styles.kv}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* 上半區域 */}
        <ScrollView
          contentContainerStyle={[styles.topSection, { marginTop: isKeyboardVisible ? ds(40) : ds(120) }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{t('auth.welcome')}</Text>
            <Text style={styles.subtitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {isAuthenticating && !biometricAuthFailed ? t('auth.authenticatingFaceID') : t('auth.enterPassword')}{"\u200B"}
            </Text>
          </View>

          <Animated.View style={[styles.inputContainer, { transform: [{ translateX: shakeAnimation }] }]}>
            <View style={styles.inputBlur}>
              <TextInput
                style={styles.input}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={handlePasswordChange}
                placeholder={t('auth.passwordPlaceholder')}
                placeholderTextColor="rgba(60,60,67,0.3)"
                editable={!isAuthenticating}  // 在認證過程中禁用輸入
              />
              <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeBtn} activeOpacity={0.7}>
                <MaterialIcons
                  name={showPassword ? "visibility" : "visibility-off"}
                  size={24}
                  color={isDarkMode ? "rgba(255,255,255,0.7)" : "rgba(60,60,67,0.6)"}
                />
              </TouchableOpacity>
            </View>

            {errorMessage ? (
              <Animated.View style={[styles.errorWrap, { transform: [{ translateY: shakeAnimation }] }]}>
                <View style={styles.errorBlur}>
                  <Text style={[
                    styles.errorTxt, 
                    isAuthenticating && { color: "#007AFF" }  // 認證提示使用藍色
                  ]}>
                    {errorMessage}
                  </Text>
                </View>
              </Animated.View>
            ) : null}
          </Animated.View>

          <TouchableOpacity 
            style={[
              styles.loginBtnWrap, 
              isAuthenticating && { opacity: 0.7 }  // 認證時降低按鈕不透明度
            ]} 
            onPress={handleSubmit} 
            activeOpacity={0.8}
            disabled={isAuthenticating}  // 認證過程中禁用按鈕
          >
            <View style={styles.transparentView}>
              <LinearGradient
                colors={["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEEAD"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.loginBtnGradient}
              >
                <Text style={styles.loginTxt}>{t('auth.login')}</Text>
              </LinearGradient>
            </View>
          </TouchableOpacity>

          {/* 恢復生物辨識按鈕 */}
          {isBiometricSupported && (
            <TouchableOpacity 
              style={styles.faceIdButton} 
              onPress={handleManualFaceID}
              disabled={isAuthenticating}
            >
              <Text style={styles.faceIdButtonText}>
                {biometryType === 'FaceID' ? t('auth.useFaceID') : t('auth.useTouchID')}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* 底部固定區域 */}
        <View style={styles.bottomSection} pointerEvents="none">
          <View style={styles.divider} />
          <View style={styles.dividerBlur}>
            <Text style={styles.dividerTxt}>{t('auth.rememberPassword')}</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
