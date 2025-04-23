import { useRef, useState } from 'react';
import { Animated, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export const useCopyNotification = () => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const showNotification = (msg: string) => {
    setMessage(msg);
    setVisible(true);
    
    // 提供iOS設備的觸覺反饋
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );
    }

    fadeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000), // 延長顯示時間至2秒
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
    });
  };

  return {
    visible,
    message,
    fadeAnim,
    onCopyNotification: showNotification,
  };
}; 