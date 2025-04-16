import React, { useState, useRef, useEffect, useMemo } from "react";
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
  PixelRatio,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { TextInput } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";

export default function LoginScreen() {
  /* ---------------- responsive helpers ---------------- */
  const { width, height, fontScale } = useWindowDimensions();
  const baseScale = Math.min(width / 375, height / 812);
  const ds = (n: number) => n * baseScale; // dynamic size
  const df = (n: number) => n * Math.min(fontScale, 1.2); // dynamic font

  /* ---------------- states ---------------- */
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  const router = useRouter();

  /* ---------------- keyboard listener ---------------- */
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

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

  /* ---------------- handlers ---------------- */
  const togglePasswordVisibility = () => setShowPassword((p) => !p);

  const handlePasswordChange = (text: string) => {
    const isValid = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/.test(text);
    const isTooLong = text.length > 20;

    if (!isValid) {
      triggerShake();
      setErrorMessage("只能輸入英文字母、數字和符號");
      setTimeout(() => setErrorMessage(""), 2000);
      return;
    }
    if (isTooLong) {
      triggerShake();
      setPassword(text.slice(0, 20));
      setErrorMessage("密碼長度不能超過20個字元");
      setTimeout(() => setErrorMessage(""), 2000);
      return;
    }
    setPassword(text);
    setErrorMessage("");
  };

  const handleLogin = () => {
    console.log("Logging in with password:", password);
    router.replace('/home');
  };

  /* ---------------- styles ---------------- */
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: "#f5f5f7" },
        gradient: { ...StyleSheet.absoluteFillObject },
        kv: { flex: 1 },
        topSection: {
          flex: 1,
          paddingHorizontal: ds(24),
          justifyContent: "center",
          alignItems: "center",
        },
        header: { alignItems: "center", marginBottom: ds(40) },
        title: { fontSize: df(34), fontWeight: "700", color: "#000", marginBottom: ds(12) },
        subtitle: {
          fontSize: df(15),
          color: "rgba(60,60,67,0.6)",
          textAlign: "center",
          paddingHorizontal: ds(20),
        },
        inputContainer: { width: "100%", marginBottom: ds(24) },
        inputBlur: {
          borderRadius: ds(14),
          overflow: "hidden",
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.5)",
          backgroundColor: "rgba(255,255,255,0.7)",
        },
        input: { flex: 1, height: ds(56), paddingHorizontal: ds(16), fontSize: df(17), color: "#000" },
        eyeBtn: { paddingHorizontal: ds(16), height: ds(56), justifyContent: "center" },
        loginBtnWrap: {
          width: "100%",
          borderRadius: ds(25),
          overflow: "hidden",
          marginTop: ds(40),
          ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: ds(4) }, shadowOpacity: 0.3, shadowRadius: ds(8) }, android: { elevation: 5 } }),
        },
        transparentView: {
          backgroundColor: "rgba(255,255,255,0.7)",
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
        divider: { borderTopWidth: 1, borderTopColor: "rgba(60,60,67,0.2)", width: "100%", marginBottom: ds(10) },
        dividerBlur: {
          backgroundColor: "rgba(255,255,255,0.7)",
          paddingHorizontal: ds(16),
          paddingVertical: ds(4),
          borderRadius: ds(10)
        },
        dividerTxt: { fontSize: df(14), color: "rgba(60,60,67,0.6)", fontWeight: "500" },
        errorWrap: { position: "absolute", top: ds(60), left: 0, right: 0, alignItems: "center" },
        errorBlur: {
          backgroundColor: "rgba(255,255,255,0.7)",
          paddingHorizontal: ds(16),
          paddingVertical: ds(8),
          borderRadius: ds(10)
        },
        errorTxt: { fontSize: df(14), color: "#FF3B30", fontWeight: "500" },
      }),
    [width, height, fontScale]
  );

  /* ---------------- render ---------------- */
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient colors={["#f0f4ff", "#ffffff"]} style={styles.gradient} />

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
            <Text style={styles.title}>Welcome</Text>
            <Text style={styles.subtitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              Enter your password to continue{"\u200B"}
            </Text>
          </View>

          <Animated.View style={[styles.inputContainer, { transform: [{ translateX: shakeAnimation }] }]}>
            <View style={styles.inputBlur}>
              <TextInput
                style={styles.input}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={handlePasswordChange}
                placeholder="Password"
                placeholderTextColor="rgba(60,60,67,0.3)"
              />
              <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeBtn} activeOpacity={0.7}>
                {showPassword ? (
                  <MaterialIcons name="visibility-off" size={22} color="rgba(60,60,67,0.6)" />
                ) : (
                  <MaterialIcons name="visibility" size={22} color="rgba(60,60,67,0.6)" />
                )}
              </TouchableOpacity>
            </View>

            {errorMessage ? (
              <Animated.View style={[styles.errorWrap, { transform: [{ translateY: shakeAnimation }] }]}>
                <View style={styles.errorBlur}>
                  <Text style={styles.errorTxt}>{errorMessage}</Text>
                </View>
              </Animated.View>
            ) : null}
          </Animated.View>

          <TouchableOpacity style={styles.loginBtnWrap} onPress={handleLogin} activeOpacity={0.8}>
            <View style={styles.transparentView}>
              <LinearGradient
                colors={["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEEAD"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.loginBtnGradient}
              >
                <Text style={styles.loginTxt}>Login</Text>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* 底部固定區域 */}
        <View style={styles.bottomSection} pointerEvents="none">
          <View style={styles.divider} />
          <View style={styles.dividerBlur}>
            <Text style={styles.dividerTxt}>Please remember your password</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
