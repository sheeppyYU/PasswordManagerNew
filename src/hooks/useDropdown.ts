import { useCallback, useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

export interface DropdownPosition {
  pageX: number;
  pageY: number;
  width: number;
  height: number;
}

export default function useDropdown(initialVisible = false) {
  const [isVisible, setIsVisible] = useState(initialVisible);
  const [position, setPosition] = useState<DropdownPosition | null>(null);

  const open = useCallback((pos: DropdownPosition) => {
    setPosition(pos);
    setIsVisible(true);
  }, []);

  const close = useCallback(() => {
    setIsVisible(false);
  }, []);

  const toggle = useCallback(
    (pos?: DropdownPosition) => {
      if (isVisible) {
        close();
      } else if (pos) {
        open(pos);
      }
    },
    [isVisible, open, close]
  );

  // Close dropdown when keyboard appears
  useEffect(() => {
    const listener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      close
    );
    return () => listener.remove();
  }, [close]);

  return {
    isVisible,
    position,
    open,
    close,
    toggle,
    setPosition,
  } as const;
} 