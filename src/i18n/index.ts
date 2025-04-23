import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

// 引入翻譯檔案
import en from './locales/en.json';
import zh from './locales/zh.json';

// 語言資源
const resources = {
  en: {
    translation: en
  },
  zh: {
    translation: zh
  }
};

// 語言檢測函數
const detectUserLanguage = async () => {
  try {
    // 嘗試從 AsyncStorage 中獲取已保存的語言
    const savedLanguage = await AsyncStorage.getItem('user-language');
    
    if (savedLanguage) {
      // 如果有保存的語言設置，使用它
      return savedLanguage;
    } else {
      // 使用設備語言，如果不在支援的列表中則使用英文
      const deviceLanguage = Localization.locale.split('-')[0];
      const supportedLanguages = Object.keys(resources);
      
      return supportedLanguages.includes(deviceLanguage) 
        ? deviceLanguage 
        : 'en';
    }
  } catch (error) {
    console.error('Error reading language:', error);
    return 'en';
  }
};

// 切換語言的函數
export const changeLanguage = async (language: string) => {
  await i18n.changeLanguage(language);
  await AsyncStorage.setItem('user-language', language);
};

// 初始化 i18n
const initI18n = async () => {
  const detectedLanguage = await detectUserLanguage();

  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: detectedLanguage,
      fallbackLng: 'en',
      compatibilityJSON: 'v4', // 根據您的 i18next 版本選擇相容性
      interpolation: {
        escapeValue: false // React 已經處理轉義
      },
      react: {
        useSuspense: false // 不使用 Suspense
      }
    });
};

// 啟動初始化
initI18n();

export default i18n; 