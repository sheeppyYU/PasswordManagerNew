# 多語系功能使用指南

本指南將幫助您了解如何在應用程序中使用多語系功能。

## 設置

已安裝的相關套件：
- `expo-localization`: 獲取設備語言設置
- `i18next`: 多語系核心庫
- `react-i18next`: React 的 i18next 綁定
- `@react-native-async-storage/async-storage`: 儲存用戶語言偏好

## 目錄結構

```
src/i18n/
├── index.ts          # i18n 配置主文件
├── locales/          # 語言文件目錄
│   ├── en.json       # 英文翻譯
│   └── zh.json       # 繁體中文翻譯
└── README.md         # 使用指南
```

## 在 App 中使用

### 1. 在 `App.tsx` 中引入 i18n

在您的 App 入口文件中引入 i18n 配置：

```tsx
// App.tsx 或 _layout.tsx
import './src/i18n';
```

### 2. 使用翻譯文本

在組件中使用 `useTranslation` hook 來獲取翻譯功能：

```tsx
import React from 'react';
import { View, Text, Button } from 'react-native';
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t, i18n } = useTranslation();
  
  return (
    <View>
      {/* 簡單文本 */}
      <Text>{t('common.appName')}</Text>
      
      {/* 帶參數的文本 */}
      <Text>{t('passwordCard.confirmDeleteMessage', { title: 'Gmail' })}</Text>
      
      {/* 切換語言按鈕 */}
      <Button 
        title={t('settings.language')} 
        onPress={() => i18n.changeLanguage(i18n.language === 'en' ? 'zh' : 'en')} 
      />
    </View>
  );
};

export default MyComponent;
```

### 3. 切換語言

您可以使用 `i18n.changeLanguage()` 或導入的 `changeLanguage` 函數來切換語言：

```tsx
import { changeLanguage } from '../i18n';

// 在您的設置頁面或語言選擇器中
const LanguageSelector = () => {
  const { t, i18n } = useTranslation();
  
  const handleLanguageChange = async (language: string) => {
    await changeLanguage(language);
    // 語言切換後可能需要的其他操作
  };
  
  return (
    <View>
      <Text>{t('settings.chooseLanguage')}:</Text>
      <Button title="English" onPress={() => handleLanguageChange('en')} />
      <Button title="繁體中文" onPress={() => handleLanguageChange('zh')} />
    </View>
  );
};
```

### 4. 獲取當前語言

使用 `i18n.language` 來獲取當前語言：

```tsx
const currentLanguage = i18n.language; // 'en' 或 'zh'
```

## 添加新翻譯

如果要添加新的翻譯項目，請按照以下步驟操作：

1. 在 `locales/en.json` 和 `locales/zh.json` 文件中添加新的翻譯鍵值對
2. 使用層次結構組織翻譯，例如 `section.subsection.key`
3. 確保兩個文件中的鍵結構保持一致

## 添加新語言

如果需要添加新的語言支持：

1. 在 `locales/` 目錄下創建新的語言文件，例如 `ja.json`
2. 在 `index.ts` 中引入新語言文件並添加到 `resources` 對象中
3. 更新語言選擇器界面，添加新的語言選項

## 常見問題解決

1. **翻譯不生效**: 確保在 App 入口文件中引入了 i18n 配置
2. **參數替換問題**: 確保使用正確的參數名稱，並且翻譯文本中有對應的佔位符
3. **語言切換後界面不更新**: 確保使用了 `useTranslation` hook 的組件會在語言變化時重新渲染

## 最佳實踐

1. 使用命名空間組織翻譯，避免鍵名衝突
2. 將常用的文本放在 `common` 命名空間下
3. 對於表單標籤、錯誤消息等重複使用的文本，創建專門的命名空間
4. 使用參數進行動態文本替換，而不是拼接字符串
5. 定期檢查翻譯文件的完整性，確保所有文本都有翻譯 