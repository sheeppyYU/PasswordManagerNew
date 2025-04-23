# i18n 和 TypeFilter 使用指南

本指南將介紹如何在專案中正確使用 i18n 國際化和 TypeFilter 類型過濾組件。

## i18n 國際化

### 基本設置

專案已經設置了 `i18n` 支持，配置在 `src/i18n/index.ts` 中。主要的翻譯文件位於：
- `src/i18n/locales/en.json`（英文）
- `src/i18n/locales/zh.json`（繁體中文）

### 在組件中使用

1. 導入並使用 `useTranslation` hook：

```typescript
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  
  return (
    <Text>{t('some.translation.key')}</Text>
  );
};
```

2. 處理動態內容：

```typescript
// 包含變數的翻譯
t('passwordCard.confirmDeleteMessage', { title: '我的密碼' })

// 結果會將 {{title}} 替換為 "我的密碼"
```

3. 處理需要在 t() 函數外使用的常量：

```typescript
// 錯誤方式（無法訪問到t）：
const TYPES = [
  { id: 'all', name: t('home.allTypes'), icon: Lock }
];

// 正確方式（使用函數）：
const getDefaultTypes = (t: (key: string, options?: any) => string) => [
  { id: 'all', name: t('home.allTypes'), icon: Lock }
];

// 在組件中使用：
const { t } = useTranslation();
const TYPES = useMemo(() => getDefaultTypes(t), [t]);
```

4. 響應語言變化：

```typescript
// 添加對 i18n.language 的依賴，在語言變化時更新
useEffect(() => {
  // 更新內容
}, [i18n.language]);
```

### 翻譯文件結構

翻譯文件採用嵌套結構，如：

```json
{
  "common": {
    "appName": "密碼管理器",
    "save": "儲存"
  },
  "home": {
    "allTypes": "全部類別"
  }
}
```

訪問方式：`t('common.appName')`、`t('home.allTypes')`

## TypeFilter 組件

TypeFilter 組件用於在密碼管理器中篩選不同類型的密碼項目。

### 組件屬性

```typescript
interface TypeFilterProps {
  types: Array<{id: string, name: string, icon?: any}>;  // 預設類型
  customTypes: Array<{id: string, name: string}>;  // 用戶自定義類型
  selectedType: string;  // 當前選中的類型ID
  onSelectType: (typeId: string) => void;  // 選擇類型的回調
  onAddCustomType: (typeName: string) => void;  // 添加自定義類型的回調
  onLongPressType?: (type: {id: string, name: string, icon?: any}) => void;  // 長按類型的回調
}
```

### 在 home.tsx 中的用法

```typescript
<TypeFilter 
  types={availableDefaultTypes.filter(type => !type.hidden)}
  customTypes={dbCustomTypes}
  selectedType={selectedType}
  onSelectType={setSelectedType}
  onAddCustomType={handleAddCustomType}
  onLongPressType={handleLongPressType}
/>
```

### 初始化類型

為確保類型名稱正確翻譯，應使用動態函數獲取類型：

```typescript
// 定義類型獲取函數
const getDefaultTypes = (t: (key: string, options?: any) => string) => [
  { id: 'all', name: t('home.allTypes'), icon: Lock },
  { id: 'website', name: t('types.website'), icon: Globe },
  // ... 其他類型
];

// 在組件中使用
const { t } = useTranslation();
const TYPES = useMemo(() => getDefaultTypes(t), [t]);

// 更新類型列表
const initializeDefaultTypes = useCallback(() => {
  const allDefaultTypes = TYPES.map(type => {
    if (type.id === 'all') {
      return { ...type, name: t('home.allTypes') };
    }
    return type;
  });
  setAvailableDefaultTypes(allDefaultTypes);
}, [t]);

// 在語言變化時更新
useEffect(() => {
  initializeDefaultTypes();
}, [initializeDefaultTypes, i18n.language]);
```

### 類型名稱獲取

在顯示類型名稱時，應使用 `getTypeName` 函數而不是直接使用 ID：

```typescript
const getTypeName = useCallback((typeId: string) => {
  if (typeId === 'all') {
    return t('home.allTypes');
  }
  
  // 預設類型
  const defaultType = availableDefaultTypes.find(t => t.id === typeId);
  if (defaultType) {
    return t(`types.${typeId}`);
  }
  
  // 自定義類型
  const customType = dbCustomTypes.find(t => t.id === typeId);
  if (customType) {
    return customType.name;
  }
  
  // 預設返回
  return t('types.other');
}, [availableDefaultTypes, dbCustomTypes, t]);
```

## 最佳實踐

1. 所有硬編碼的文本都應該使用 i18n 翻譯。
2. 在處理常量時，使用函數包裝以便能夠訪問到 `t`。
3. 將 `i18n.language` 添加為依賴，確保語言變化時更新內容。
4. 使用 `getTypeName` 獲取類型名稱，而不是直接顯示 typeId。
5. 在新增自定義類型後，應在 `dbCustomTypes` 中找到該類型以顯示正確名稱。 