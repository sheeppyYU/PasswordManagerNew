import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
  Alert,
  useColorScheme,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

export default function DisclaimerScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  // 強制使用淺色模式，忽略系統設置
  const isDarkMode = false;
  const { width, height, fontScale } = useWindowDimensions();
  const baseScale = Math.min(width / 375, height / 812);
  const ds = (size: number) => size * baseScale; // dynamic sizing
  const df = (size: number) => size * Math.min(fontScale, 1.2); // dynamic font sizing
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleAgree = async () => {
    try {
      // 觸發輕微的觸覺反饋
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      // 保存用戶已同意免責聲明的狀態
      await AsyncStorage.setItem('has_agreed_to_disclaimer', 'true');
      
      // 導航到登入頁面
      router.replace('/login');
    } catch (error) {
      console.error('儲存免責聲明同意狀態出錯:', error);
      Alert.alert(
        t('common.error'),
        '無法保存設置，請稍後再試。'
      );
    }
  };

  const handleDisagree = () => {
    // 觸發輕微的觸覺反饋
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    
    // 顯示用戶必須同意才能使用應用的提示
    Alert.alert(
      t('common.warning'),
      '您必須同意免責聲明才能使用此應用。',
      [
        { text: t('common.ok'), onPress: () => {} }
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f5f7',
    },
    safeArea: {
      flex: 1,
    },
    content: {
      flex: 1,
      padding: ds(16),
      paddingTop: ds(16) + insets.top, // 確保內容不會與頂部重疊
    },
    header: {
      marginBottom: ds(16),
      marginTop: ds(8), // 增加頂部間距
    },
    title: {
      fontSize: df(28),
      fontWeight: 'bold',
      color: '#000000',
      marginBottom: ds(8),
      textAlign: 'center',
    },
    description: {
      fontSize: df(16),
      color: 'rgba(0,0,0,0.8)',
      textAlign: 'center',
      lineHeight: df(22),
      marginBottom: ds(16),
    },
    scrollContainer: {
      flex: 1,
    },
    disclaimerCard: {
      backgroundColor: 'white',
      borderRadius: ds(16),
      padding: ds(16),
      marginBottom: ds(16),
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    disclaimerContent: {
      fontSize: df(15),
      color: 'rgba(60,60,67,0.8)',
      lineHeight: df(20),
      marginBottom: ds(12),
    },
    buttonsContainer: {
      padding: ds(16),
      paddingBottom: insets.bottom > 0 ? insets.bottom : ds(16),
      backgroundColor: '#f5f5f7',
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    buttonAgree: {
      flex: 1,
      height: ds(50),
      borderRadius: ds(25),
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: ds(8),
      overflow: 'hidden',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        android: {
          elevation: 5,
        },
      }),
    },
    buttonDisagree: {
      flex: 1,
      height: ds(50),
      borderRadius: ds(25),
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: ds(8),
      backgroundColor: '#E5E5EA',
    },
    buttonText: {
      color: 'white',
      fontSize: df(16),
      fontWeight: '600',
      letterSpacing: 0.5,
      zIndex: 1,
    },
    buttonTextDisagree: {
      color: 'rgba(60,60,67,0.7)',
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient 
        colors={['#f0f4ff', '#ffffff']} 
        style={StyleSheet.absoluteFillObject} 
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('disclaimer.title')}</Text>
            <Text style={styles.description}>{t('disclaimer.description')}</Text>
          </View>
          
          <ScrollView 
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ paddingBottom: ds(16) }}
          >
            <View style={styles.disclaimerCard}>
              <Text style={styles.disclaimerContent}>{t('disclaimer.content1')}</Text>
              <Text style={styles.disclaimerContent}>{t('disclaimer.content2')}</Text>
              <Text style={styles.disclaimerContent}>{t('disclaimer.content3')}</Text>
              <Text style={styles.disclaimerContent}>{t('disclaimer.content4')}</Text>
              <Text style={styles.disclaimerContent}>{t('disclaimer.content5')}</Text>
            </View>
          </ScrollView>
        </View>
        
        {/* 固定在底部的按鈕 */}
        <View style={styles.buttonsContainer}>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.buttonDisagree}
              onPress={handleDisagree}
              activeOpacity={0.7}
            >
              <Text style={[styles.buttonText, styles.buttonTextDisagree]}>
                {t('disclaimer.disagreeButton')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.buttonAgree}
              onPress={handleAgree}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#4ECDC4', '#45B7D1', '#4CAF50']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.buttonText}>
                {t('disclaimer.agreeButton')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
