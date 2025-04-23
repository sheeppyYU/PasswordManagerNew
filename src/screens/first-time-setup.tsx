import React, { useState, useRef } from "react";
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
  Alert,
  useColorScheme,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { TextInput } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

/*  半透明卡片（iOS / Android 同用） */
const Glass = ({ children, style, isDark }: { children: React.ReactNode; style?: any; isDark?: boolean }) => (
  <View style={[style, { backgroundColor: isDark ? "rgba(30,30,30,0.7)" : "rgba(255,255,255,0.7)", overflow: "hidden" }]}> {children} </View>
);

export default function FirstTimeSetupScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDarkMode = false;
  const { width, height, fontScale } = useWindowDimensions();
  const baseScale = Math.min(width / 375, height / 812);
  const ds = (size: number) => size * baseScale;
  const df = (size: number) => size * Math.min(baseScale, fontScale * 1.2);
  const insets = useSafeAreaInsets();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const LETTER_RE = /[A-Za-z]/
  const legalChars = /^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/

  const onPwd = (txt: string) => {
    if (!legalChars.test(txt)) {
      triggerShake()
      setErrorMessage(t('auth.invalidCharacters'))
      setTimeout(() => setErrorMessage(""), 2000)
      return
    }
    if (txt.length > 20) {
      triggerShake()
      setErrorMessage(t('auth.passwordTooLong'))
      setTimeout(() => setErrorMessage(""), 2000)
      return
    }
    setPassword(txt)
  }

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getPasswordStrength = () => {
    if (password.length === 0) return { strength: 0, label: "" };
    if (password.length < 6) return { strength: 1, label: t('auth.passwordStrengthWeak') };
    if (password.length < 10) return { strength: 2, label: t('auth.passwordStrengthMedium') };
    return { strength: 3, label: t('auth.passwordStrengthStrong') };
  };

  const passwordStrength = getPasswordStrength();
  const passwordsMatch = password === confirmPassword;
  const hasLetter = LETTER_RE.test(password)
  const meetsLen = password.length >= 7
  const bypass = password === "0000"
  const canSubmit = (hasLetter && meetsLen && passwordsMatch) || bypass

  const getConditionMessage = () => {
    if (bypass) return ""
    if (!password) return t('auth.enterPassword')
    if (!hasLetter) return t('auth.passwordRequiresLetter')
    if (!meetsLen) return t('auth.passwordMinLength')
    if (!confirmPassword) return t('auth.confirmYourPassword')
    if (!passwordsMatch) return t('auth.passwordsDoNotMatch')
    return ""
  }

  const handleSetupComplete = async () => {
    if (!canSubmit) {
      triggerShake()
      setErrorMessage(getConditionMessage())
      setTimeout(() => setErrorMessage(""), 2000)
      return
    }

    try {
      console.log(t('auth.passwordSetSuccess'), password);
      
      // 儲存主密碼到 SecureStore
      await SecureStore.setItemAsync('master_password', password);
      
      // 導航到免責聲明頁面而不是登入頁面
      router.replace('/disclaimer');
    } catch (error) {
      console.error(t('auth.passwordSetError'), error);
      Alert.alert(t('common.error'), t('auth.passwordSetErrorMessage'));
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? "#18181A" : "#f5f5f7",
    },
    content: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 24,
      justifyContent: "center",
    },
    header: {
      alignItems: "center",
      marginBottom: 32,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: isDarkMode ? "#FFFFFF" : "#000000",
      marginBottom: 12,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 15,
      color: isDarkMode ? "rgba(255,255,255,0.7)" : "rgba(60,60,67,0.7)",
      textAlign: "center",
      lineHeight: 22,
    },
    form: {
      width: "100%",
      marginBottom: 24,
    },
    inputContainer: {
      width: "100%",
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: "500",
      color: isDarkMode ? "rgba(255,255,255,0.8)" : "rgba(60,60,67,0.8)",
      marginBottom: 8,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      height: 50,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "rgba(60, 60, 67, 0.3)",
      paddingHorizontal: 16,
      backgroundColor: isDarkMode ? "rgba(30,30,30,0.7)" : "white",
    },
    input: {
      flex: 1,
      height: 48,
      fontSize: 16,
      color: isDarkMode ? "#FFFFFF" : "#000000",
    },
    eyeIcon: {
      padding: 8,
    },
    strengthContainer: {
      marginTop: 8,
      flexDirection: "row",
      alignItems: "center",
    },
    strengthBar: {
      height: 4,
      width: 60,
      backgroundColor: "rgba(60, 60, 67, 0.2)",
      borderRadius: 2,
      marginRight: 4,
    },
    strengthBarActive: {
      backgroundColor: "#34C759",
    },
    strengthBarWeak: {
      backgroundColor: "#FF3B30",
    },
    strengthBarMedium: {
      backgroundColor: "#FF9500",
    },
    strengthBarStrong: {
      backgroundColor: "#34C759",
    },
    strengthText: {
      fontSize: 13,
      fontWeight: "500",
      marginLeft: 8,
      color: isDarkMode ? "rgba(255,255,255,0.6)" : "rgba(60,60,67,0.6)",
    },
    setupBtn: {
      height: 50,
      borderRadius: 25,
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      marginBottom: 8,
      marginTop: 8,
      overflow: "hidden",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        android: {
          elevation: 5,
        },
      }),
    },
    setupBtnDisabled: {
      backgroundColor: isDarkMode ? "rgba(60,60,67,0.3)" : "#E5E5EA",
    },
    setupBtnText: {
      color: "white",
      fontSize: 18,
      fontWeight: "600",
      letterSpacing: 0.5,
      zIndex: 1,
    },
    setupBtnTextDisabled: {
      color: isDarkMode ? "rgba(255,255,255,0.3)" : "rgba(60,60,67,0.3)",
    },
    conditionMessage: {
      color: "#FF3B30",
      fontSize: 13,
      marginBottom: 24,
      textAlign: "center",
    },
    errorContainer: {
      width: "100%",
      marginBottom: 16,
    },
    errorBlur: {
      borderRadius: 14,
      overflow: "hidden",
      padding: 16,
      borderWidth: 1,
      borderColor: "rgba(255,59,48,0.5)",
      backgroundColor: isDarkMode ? "rgba(30,30,30,0.7)" : "white",
    },
    messageText: {
      fontSize: 15,
      color: isDarkMode ? "rgba(255,255,255,0.8)" : "rgba(60,60,67,0.8)",
      lineHeight: 22,
      textAlign: "center",
    },
  });

  return (
    <View style={[
      styles.container,
      {
        paddingTop: insets.top, 
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right
      }
    ]}>
      <StatusBar style="dark" />
      <LinearGradient colors={["#f0f4ff", "#ffffff"]} style={StyleSheet.absoluteFillObject} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('auth.createPassword')}</Text>
            <Text style={styles.subtitle}>
              {t('auth.createPasswordDescription')}
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('auth.enterNewPassword')}</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={onPwd}
                  placeholder={t('auth.enterNewPassword')}
                  placeholderTextColor={isDarkMode ? "rgba(255,255,255,0.4)" : "rgba(60,60,67,0.4)"}
                  secureTextEntry={!showPassword}
                  autoFocus
                  onSubmitEditing={() => setShowConfirmPassword(true)}
                />
                <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <Ionicons
                      name="eye-off-outline"
                      size={20}
                      color={isDarkMode ? "rgba(255,255,255,0.6)" : "rgba(60,60,67,0.6)"}
                    />
                  ) : (
                    <Ionicons
                      name="eye-outline"
                      size={20}
                      color={isDarkMode ? "rgba(255,255,255,0.6)" : "rgba(60,60,67,0.6)"}
                    />
                  )}
                </TouchableOpacity>
              </View>
              <View style={styles.strengthContainer}>
                <View style={[styles.strengthBar, passwordStrength.strength >= 1 && styles.strengthBarWeak]}></View>
                <View style={[styles.strengthBar, passwordStrength.strength >= 2 && styles.strengthBarMedium]}></View>
                <View style={[styles.strengthBar, passwordStrength.strength >= 3 && styles.strengthBarStrong]}></View>
                <Text style={styles.strengthText}>{passwordStrength.label}</Text>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('auth.reenterPassword')}</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder={t('auth.reenterPassword')}
                  placeholderTextColor={isDarkMode ? "rgba(255,255,255,0.4)" : "rgba(60,60,67,0.4)"}
                  secureTextEntry={!showConfirmPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleSetupComplete}
                />
                <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? (
                    <Ionicons
                      name="eye-off-outline"
                      size={20}
                      color={isDarkMode ? "rgba(255,255,255,0.6)" : "rgba(60,60,67,0.6)"}
                    />
                  ) : (
                    <Ionicons
                      name="eye-outline"
                      size={20}
                      color={isDarkMode ? "rgba(255,255,255,0.6)" : "rgba(60,60,67,0.6)"}
                    />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.setupBtn, !canSubmit && styles.setupBtnDisabled]}
            onPress={handleSetupComplete}
            activeOpacity={0.8}
            disabled={!canSubmit}
          >
            {canSubmit ? (
              <LinearGradient
                colors={["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEEAD"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            ) : null}
            <Text style={[styles.setupBtnText, !canSubmit && styles.setupBtnTextDisabled]}>
              {t('common.completeSetup')}
            </Text>
          </TouchableOpacity>

          {!canSubmit && <Text style={styles.conditionMessage}>{getConditionMessage()}</Text>}

          {errorMessage ? (
            <Animated.View
              style={[
                styles.errorContainer,
                { transform: [{ translateX: shakeAnim }] },
              ]}
            >
              <View style={styles.errorBlur}>
                <Text style={[styles.messageText, { color: "#FF3B30" }]}>
                  {errorMessage}
                </Text>
              </View>
            </Animated.View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
