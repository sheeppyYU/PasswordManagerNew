import AsyncStorage from '@react-native-async-storage/async-storage';

// 用於存儲隱藏的預設類型的 AsyncStorage 鍵
const HIDDEN_DEFAULT_TYPES_KEY = 'passwordManager_hiddenDefaultTypes';

/**
 * 載入已被隱藏的預設類型 ID 列表
 * @returns 返回隱藏的預設類型 ID 數組
 */
export const loadHiddenDefaultTypes = async (): Promise<string[]> => {
  try {
    const hiddenTypesJson = await AsyncStorage.getItem(HIDDEN_DEFAULT_TYPES_KEY);
    if (hiddenTypesJson) {
      return JSON.parse(hiddenTypesJson);
    }
    return []; // 如果沒有找到，返回空數組
  } catch (error) {
    console.error('載入隱藏的預設類型時出錯', error);
    return []; // 發生錯誤時返回空數組
  }
};

/**
 * 保存隱藏的預設類型 ID 列表
 * @param hiddenTypeIds 要保存的隱藏預設類型 ID 數組
 */
export const saveHiddenDefaultTypes = async (hiddenTypeIds: string[]): Promise<void> => {
  try {
    const hiddenTypesJson = JSON.stringify(hiddenTypeIds);
    await AsyncStorage.setItem(HIDDEN_DEFAULT_TYPES_KEY, hiddenTypesJson);
  } catch (error) {
    console.error('保存隱藏的預設類型時出錯', error);
  }
};

/**
 * 添加一個預設類型到隱藏列表
 * @param typeId 要隱藏的預設類型 ID
 */
export const hideDefaultType = async (typeId: string): Promise<void> => {
  try {
    const hiddenTypes = await loadHiddenDefaultTypes();
    // 確保不重複添加
    if (!hiddenTypes.includes(typeId)) {
      hiddenTypes.push(typeId);
      await saveHiddenDefaultTypes(hiddenTypes);
    }
  } catch (error) {
    console.error('隱藏預設類型時出錯', error);
  }
};

/**
 * 從隱藏列表中移除一個預設類型
 * @param typeId 要顯示的預設類型 ID
 */
export const showDefaultType = async (typeId: string): Promise<void> => {
  try {
    const hiddenTypes = await loadHiddenDefaultTypes();
    const updatedHiddenTypes = hiddenTypes.filter(id => id !== typeId);
    await saveHiddenDefaultTypes(updatedHiddenTypes);
  } catch (error) {
    console.error('顯示預設類型時出錯', error);
  }
}; 