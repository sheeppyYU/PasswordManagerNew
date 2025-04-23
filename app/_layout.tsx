import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useColorScheme } from '@/hooks/useColorScheme';

// 引入 i18n 配置
import '../src/i18n';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      
      // 檢查用戶狀態和導航到適當的頁面
      const checkUserStatus = async () => {
        try {
          // 從 SecureStore 獲取保存的密碼
          const savedPassword = await SecureStore.getItemAsync('master_password');
          
          // 從 AsyncStorage 獲取免責聲明同意狀態
          const hasAgreedToDisclaimer = await AsyncStorage.getItem('has_agreed_to_disclaimer');
          
          // 路由邏輯
          if (!savedPassword) {
            // 用戶沒有設置密碼，導航到首次設置頁面
            router.replace('/first-time-setup');
          } else if (savedPassword && hasAgreedToDisclaimer !== 'true') {
            // 用戶已設置密碼但尚未同意免責聲明
            router.replace('/disclaimer');
          } else {
            // 用戶已設置密碼且已同意免責聲明，導航到登入頁面
            router.replace('/login');
          }
        } catch (error) {
          console.error('檢查用戶狀態時出錯:', error);
          // 發生錯誤時，預設導向到首次設定頁面
          router.replace('/first-time-setup');
        }
      };
      
      checkUserStatus();
    }
  }, [loaded, router]);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="first-time-setup" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="home" options={{ headerShown: false }} />
          <Stack.Screen name="disclaimer" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
