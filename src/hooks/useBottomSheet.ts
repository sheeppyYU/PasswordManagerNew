import { useCallback, useRef, useState, useEffect } from 'react';
import { Animated, Dimensions, PanResponder, Platform, Keyboard, KeyboardEvent } from 'react-native';

export default function useBottomSheet(closeDropdown: () => void, onHideComplete?: () => void) {
  const { height: screenHeight } = Dimensions.get('window');
  const animation = useRef(new Animated.Value(0)).current;
  const [isVisible, setIsVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // 監聽鍵盤高度變化
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e: KeyboardEvent) => {
        setKeyboardHeight(e.endCoordinates.height);
        closeDropdown();
      }
    );
    
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, [closeDropdown]);

  const show = useCallback(() => {
    closeDropdown();
    setIsVisible(true);
    
    // 總是使用預設垂直偏移，確保底部表單在一開始就預留出足够空間
    // 我們使用固定偏移，相當於標準鍵盤高度的一半，讓表單始終顯示在較高位置
    const defaultOffset = Platform.OS === 'ios' ? 0.2 : 0.1; // 偏移屏幕高度的20%或10%
    
    Animated.timing(animation, {
      toValue: 1 - defaultOffset, // 減少值使表單上移
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [animation, closeDropdown]);

  const hide = useCallback(() => {
    closeDropdown();
    Animated.timing(animation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
      onHideComplete?.();
    });
  }, [animation, closeDropdown, onHideComplete]);

  const toggle = useCallback(() => {
    if (isVisible) {
      hide();
    } else {
      show();
    }
  }, [isVisible, hide, show]);

  // PanResponder for drag to close
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderGrant: () => {
        animation.stopAnimation();
        closeDropdown();
      },
      onPanResponderMove: (_, g) => {
        const maxOffset = screenHeight * 0.6;
        const newPos = Math.max(0, Math.min(1 - g.dy / maxOffset, 1));
        animation.setValue(newPos);
      },
      onPanResponderRelease: (_, g) => {
        const maxOffset = screenHeight * 0.6;
        const dragPercent = g.dy / maxOffset;
        if (dragPercent > 0.4 || (g.dy > 0 && g.vy > 0.5)) {
          hide();
        } else {
          show();
        }
      },
      onPanResponderTerminate: () => {
        if (isVisible) show(); else hide();
      }
    })
  ).current;

  return {
    isVisible,
    animation,
    panHandlers: panResponder.panHandlers,
    show,
    hide,
    toggle,
    keyboardHeight,
  } as const;
} 