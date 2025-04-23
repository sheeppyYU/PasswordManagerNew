import { useEffect, useState, useCallback, useRef } from 'react';
import * as SQLite from 'expo-sqlite';
import { PasswordItem } from './usePasswords';

const DB_NAME = 'password_manager.db';
const TABLE_NAME = 'passwords';
const TYPES_TABLE = 'custom_types';

// 類型定義
export interface CustomType {
  id: string;
  name: string;
}

export default function usePasswordsDb() {
  // 使用 useRef 而非 useState 來存儲數據庫連接
  // 這確保了連接在組件生命週期內保持不變，避免被錯誤釋放
  const dbRef = useRef<SQLite.SQLiteDatabase | null>(null);
  
  const [passwords, setPasswords] = useState<PasswordItem[]>([]);
  const [customTypes, setCustomTypes] = useState<CustomType[]>([]);
  const [ready, setReady] = useState(false);

  // 初始化資料庫（使用新版 async API）
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (!dbRef.current) {
          dbRef.current = await SQLite.openDatabaseAsync(DB_NAME);
        }

        const db = dbRef.current;

        // 一次性執行多個 SQL 指令
        await db!.execAsync(`
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT,
  username TEXT,
  password TEXT,
  category TEXT,
  type TEXT,
  notes TEXT,
  favorite INT
);
CREATE TABLE IF NOT EXISTS ${TYPES_TABLE} (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL
);`);

        if (!cancelled) setReady(true);
      } catch (error) {
        console.error('SQLite init error', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // 讀取所有密碼
  const loadPasswords = useCallback(async () => {
    if (!ready || !dbRef.current) return;

    try {
      const rows = await dbRef.current.getAllAsync<PasswordItem>(
        `SELECT * FROM ${TABLE_NAME};`
      );
      setPasswords(rows);
    } catch (error) {
      console.error('Load passwords error', error);
    }
  }, [ready]);

  // 讀取所有自定義類型
  const loadCustomTypes = useCallback(async () => {
    if (!ready || !dbRef.current) return;

    try {
      const rows = await dbRef.current.getAllAsync<CustomType>(
        `SELECT * FROM ${TYPES_TABLE};`
      );
      setCustomTypes(rows);
    } catch (error) {
      console.error('Load custom types error', error);
    }
  }, [ready]);

  useEffect(() => {
    // 當數據庫準備好後加載數據
    if (ready) {
      loadPasswords();
      loadCustomTypes();
    }
  }, [loadPasswords, loadCustomTypes, ready]);

  // 新增
  const addPassword = async (item: PasswordItem, cb?: () => void) => {
    if (!dbRef.current) return;

    try {
      await dbRef.current.runAsync(
        `INSERT INTO ${TABLE_NAME} (id,title,username,password,category,type,notes,favorite) VALUES (?,?,?,?,?,?,?,?);`,
        item.id,
        item.title,
        item.username,
        item.password,
        item.category,
        item.type,
        item.notes,
        item.favorite ? 1 : 0
      );
      await loadPasswords();
      cb?.();
    } catch (error) {
      console.error('Add password error', error);
    }
  };

  // 刪除
  const deletePassword = async (id: string, cb?: () => void) => {
    if (!dbRef.current) return;

    try {
      await dbRef.current.runAsync(
        `DELETE FROM ${TABLE_NAME} WHERE id = ?;`,
        id
      );
      await loadPasswords();
      cb?.();
    } catch (error) {
      console.error('Delete password error', error);
    }
  };

  // 更新
  const updatePassword = async (item: PasswordItem, cb?: () => void) => {
    if (!dbRef.current) return;

    try {
      await dbRef.current.runAsync(
        `UPDATE ${TABLE_NAME} SET title=?, username=?, password=?, category=?, type=?, notes=?, favorite=? WHERE id=?;`,
        item.title,
        item.username,
        item.password,
        item.category,
        item.type,
        item.notes,
        item.favorite ? 1 : 0,
        item.id
      );
      await loadPasswords();
      cb?.();
    } catch (error) {
      console.error('Update password error', error);
    }
  };

  // 新增自定義類型
  const addCustomType = async (type: CustomType, cb?: () => void) => {
    if (!dbRef.current) return;

    try {
      await dbRef.current.runAsync(
        `INSERT INTO ${TYPES_TABLE} (id, name) VALUES (?, ?);`,
        type.id,
        type.name
      );
      await loadCustomTypes();
      cb?.();
    } catch (error) {
      console.error('Add custom type error', error);
    }
  };

  // 刪除自定義類型
  const deleteCustomType = async (id: string, cb?: () => void) => {
    if (!dbRef.current) return;

    try {
      await dbRef.current.runAsync(
        `DELETE FROM ${TYPES_TABLE} WHERE id = ?;`,
        id
      );
      await loadCustomTypes();
      cb?.();
    } catch (error) {
      console.error('Delete custom type error', error);
    }
  };

  // 清空所有數據
  const resetDatabase = async (cb?: () => void) => {
    if (!dbRef.current) return;

    try {
      await dbRef.current.withExclusiveTransactionAsync(async txn => {
        await txn.execAsync(`DELETE FROM ${TABLE_NAME};`);
        await txn.execAsync(`DELETE FROM ${TYPES_TABLE};`);
      });
      await loadPasswords();
      await loadCustomTypes();
      cb?.();
    } catch (error) {
      console.error('Reset database error', error);
    }
  };

  return { 
    ready, 
    passwords, 
    customTypes,
    addPassword, 
    deletePassword, 
    updatePassword, 
    resetDatabase,
    addCustomType,
    deleteCustomType,
    reload: loadPasswords,
    reloadTypes: loadCustomTypes
  } as const;
} 