import { useState, useMemo } from 'react';

export interface PasswordItem {
  id: string;
  title: string;
  username: string;
  password: string;
  category: string;
  type: string;
  notes: string;
  favorite: boolean;
}

export interface GroupedPasswords {
  [key: string]: PasswordItem[];
}

export default function usePasswords(
  initialData: PasswordItem[],
  search: string,
  selectedType: string,
) {
  const [passwordData, setPasswordData] = useState<PasswordItem[]>(initialData);

  const addPassword = (item: PasswordItem) => setPasswordData(prev => [...prev, item]);
  const deletePassword = (id: string) => setPasswordData(prev => prev.filter(p => p.id !== id));

  // Derived data: filtered & grouped
  const filteredPasswords = useMemo(() => {
    return passwordData.filter(item => {
      const matchesSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.username.toLowerCase().includes(search.toLowerCase()) ||
        item.notes.toLowerCase().includes(search.toLowerCase());

      const matchesType = selectedType === 'all' || item.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [passwordData, search, selectedType]);

  const groupedPasswords = useMemo<GroupedPasswords>(() => {
    return filteredPasswords.reduce<GroupedPasswords>((groups, pwd) => {
      if (!groups[pwd.type]) groups[pwd.type] = [];
      groups[pwd.type].push(pwd);
      return groups;
    }, {});
  }, [filteredPasswords]);

  return {
    passwordData,
    setPasswordData,
    addPassword,
    deletePassword,
    filteredPasswords,
    groupedPasswords,
  } as const;
} 