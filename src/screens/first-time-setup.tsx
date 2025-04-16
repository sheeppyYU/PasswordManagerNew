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
  SafeAreaView,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { TextInput } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { router } from 'expo-router';

/*  半透明卡片（iOS / Android 同用） */
const Glass = ({ children, style }: { children: React.ReactNode; style?: any }) => (
  <View style={[style, { backgroundColor: "rgba(255,255,255,0.7)", overflow: "hidden" }]}> {children} </View>
);

export default function FirstTimeSetupScreen() {
  const { width, height, fontScale } = useWindowDimensions();
  const baseScale = Math.min(width / 375, height / 812);
  const ds = (size: number) => size * baseScale;
  const df = (size: number) => size * Math.min(baseScale, fontScale * 1.2);

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
      setErrorMessage("只能輸入英文字母、數字和符號")
      setTimeout(() => setErrorMessage(""), 2000)
      return
    }
    if (txt.length > 20) {
      triggerShake()
      setErrorMessage("密碼長度不能超過20個字元")
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
    if (password.length < 6) return { strength: 1, label: "弱" };
    if (password.length < 10) return { strength: 2, label: "中等" };
    return { strength: 3, label: "強" };
  };

  const passwordStrength = getPasswordStrength();
  const passwordsMatch = password === confirmPassword;
  const hasLetter = LETTER_RE.test(password)
  const meetsLen = password.length >= 7
  const bypass = password === "0000"
  const canSubmit = (hasLetter && meetsLen && passwordsMatch) || bypass

  const getConditionMessage = () => {
    if (bypass) return ""
    if (!password) return "請輸入密碼"
    if (!hasLetter) return "至少包含一個英文字母"
    if (!meetsLen) return "密碼長度至少 7 字元"
    if (!confirmPassword) return "請確認密碼"
    if (!passwordsMatch) return "密碼不匹配"
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
      console.log('密碼設置成功:', password);
      
      router.replace('/login');
    } catch (error) {
      console.error('設置密碼失敗:', error);
      Alert.alert('錯誤', '無法設置密碼，請重試');
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#f5f5f7",
    },
    content: {
      flex: 1,
      paddingHorizontal: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    header: {
      alignItems: "center",
      marginBottom: 40,
    },
    title: {
      fontSize: 34,
      fontWeight: "700",
      color: "#000",
      marginBottom: 12,
    },
    subtitle: {
      fontSize: 15,
      color: "rgba(60,60,67,0.6)",
      textAlign: "center",
      paddingHorizontal: 20,
    },
    inputContainer: {
      width: "100%",
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 15,
      fontWeight: "500",
      color: "rgba(60,60,67,0.8)",
      marginBottom: 8,
      marginLeft: 4,
    },
    inputBlur: {
      borderRadius: 14,
      overflow: "hidden",
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.5)",
      backgroundColor: "white",
    },
    inputError: {
      borderColor: "rgba(255,59,48,0.5)",
    },
    input: {
      flex: 1,
      height: 56,
      paddingHorizontal: 16,
      fontSize: 17,
      color: "#000",
    },
    eyeBtn: {
      paddingHorizontal: 16,
      height: 56,
      justifyContent: "center",
    },
    strengthContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 8,
      paddingHorizontal: 4,
    },
    strengthBars: {
      flexDirection: "row",
      flex: 1,
      gap: 4,
    },
    strengthBar: {
      height: 4,
      flex: 1,
      backgroundColor: "rgba(60,60,67,0.2)",
      borderRadius: 2,
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
      color: "rgba(60,60,67,0.6)",
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
      backgroundColor: "#E5E5EA",
    },
    setupBtnText: {
      color: "white",
      fontSize: 18,
      fontWeight: "600",
      letterSpacing: 0.5,
      zIndex: 1,
    },
    setupBtnTextDisabled: {
      color: "rgba(60,60,67,0.3)",
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
      backgroundColor: "white",
    },
    messageText: {
      fontSize: 15,
      color: "rgba(60,60,67,0.8)",
      lineHeight: 22,
      textAlign: "center",
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient colors={["#f0f4ff", "#ffffff"]} style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView
        style={StyleSheet.absoluteFill}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : ds(20)}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>設置密碼</Text>
            <Text style={styles.subtitle}>
              請設置一個安全的密碼來保護您的資料
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>密碼</Text>
            <View style={[styles.inputBlur, errorMessage && styles.inputError]}>
              <TextInput
                style={styles.input}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={onPwd}
                placeholder="輸入密碼"
                placeholderTextColor="rgba(60,60,67,0.3)"
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={24}
                  color="rgba(60,60,67,0.6)"
                />
              </TouchableOpacity>
            </View>
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBars}>
                <View
                  style={[
                    styles.strengthBar,
                    passwordStrength.strength >= 1 && styles.strengthBarWeak,
                    passwordStrength.strength >= 2 && styles.strengthBarMedium,
                    passwordStrength.strength >= 3 && styles.strengthBarStrong,
                  ]}
                />
                <View
                  style={[
                    styles.strengthBar,
                    passwordStrength.strength >= 2 && styles.strengthBarMedium,
                    passwordStrength.strength >= 3 && styles.strengthBarStrong,
                  ]}
                />
                <View
                  style={[
                    styles.strengthBar,
                    passwordStrength.strength >= 3 && styles.strengthBarStrong,
                  ]}
                />
              </View>
              <Text style={styles.strengthText}>{passwordStrength.label}</Text>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>確認密碼</Text>
            <View style={[styles.inputBlur, errorMessage && styles.inputError]}>
              <TextInput
                style={styles.input}
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="再次輸入密碼"
                placeholderTextColor="rgba(60,60,67,0.3)"
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={24}
                  color="rgba(60,60,67,0.6)"
                />
              </TouchableOpacity>
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
              Complete Setup
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
    </SafeAreaView>
  );
}
