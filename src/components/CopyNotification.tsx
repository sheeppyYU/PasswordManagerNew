import React from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import { Copy } from 'lucide-react-native';

interface CopyNotificationProps {
  visible: boolean;
  message: string;
  fadeAnim: Animated.Value;
}

const CopyNotification: React.FC<CopyNotificationProps> = ({ visible, message, fadeAnim }) => {
  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <BlurView intensity={80} tint="dark" style={styles.blurWrap}>
        <Copy size={16} color="#FFFFFF" />
        <Text style={styles.text}>{message}</Text>
      </BlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  blurWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});

export default CopyNotification; 