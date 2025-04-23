import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Platform,
  Dimensions,
  ScrollView
} from 'react-native';
import { BlurView } from 'expo-blur';

interface ButtonProps {
  text: string;
  onPress: () => void;
  type?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons: ButtonProps[];
  onDismiss?: () => void;
  isDarkMode: boolean;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  buttons,
  onDismiss,
  isDarkMode
}) => {
  const { width, height } = Dimensions.get('window');
  const alertWidth = Math.min(width - 60, 340);
  const maxAlertHeight = height * 0.7; // 限制最大高度為畫面高度的70%
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <View style={[
              styles.alertContainer,
              { 
                width: alertWidth, 
                maxHeight: maxAlertHeight,
                backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 0.95)' : 'rgba(250, 250, 250, 0.95)',
                borderColor: isDarkMode ? 'rgba(80, 80, 80, 0.3)' : 'rgba(200, 200, 200, 0.3)'
              }
            ]}>
              {Platform.OS === 'ios' && (
                <BlurView
                  intensity={80}
                  tint={isDarkMode ? 'dark' : 'light'}
                  style={StyleSheet.absoluteFill}
                />
              )}
              
              <View style={styles.contentContainer}>
                <Text style={[
                  styles.title,
                  { color: isDarkMode ? '#FFFFFF' : '#000000' }
                ]}>
                  {title}
                </Text>
                
                {message && (
                  <ScrollView 
                    style={styles.messageScrollView}
                    contentContainerStyle={styles.messageScrollContent}
                    showsVerticalScrollIndicator={true}
                  >
                    <Text style={[
                      styles.message,
                      { color: isDarkMode ? '#E0E0E0' : '#333333' }
                    ]}>
                      {message}
                    </Text>
                  </ScrollView>
                )}
              </View>
              
              <View style={[
                styles.buttonContainer,
                buttons.length > 2 ? styles.buttonVertical : styles.buttonHorizontal
              ]}>
                {buttons.map((button, index) => {
                  let buttonColor = isDarkMode ? '#4DA6FF' : '#007AFF';
                  if (button.type === 'destructive') {
                    buttonColor = isDarkMode ? '#FF453A' : '#FF3B30';
                  } else if (button.type === 'cancel' && Platform.OS === 'ios') {
                    buttonColor = isDarkMode ? '#4DA6FF' : '#007AFF';
                  }
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.button,
                        buttons.length > 2 ? styles.buttonFullWidth : {},
                        index > 0 && buttons.length <= 2 ? { marginLeft: 8 } : {},
                        index > 0 && buttons.length > 2 ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: isDarkMode ? 'rgba(80, 80, 80, 0.5)' : 'rgba(200, 200, 200, 0.5)' } : {}
                      ]}
                      onPress={button.onPress}
                    >
                      <Text
                        style={[
                          styles.buttonText,
                          { color: buttonColor },
                          button.type === 'cancel' && Platform.OS === 'ios' ? { fontWeight: '600' } : {}
                        ]}
                      >
                        {button.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  alertContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 0.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 20,
    paddingBottom: 10
  },
  messageScrollView: {
    marginTop: 8,
    maxHeight: 250, // 增加訊息區域最大高度
  },
  messageScrollContent: {
    paddingBottom: 16,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22 // 增加行高，提高可讀性
  },
  buttonContainer: {
    marginTop: 8
  },
  buttonHorizontal: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(200, 200, 200, 0.5)'
  },
  buttonVertical: {
    flexDirection: 'column',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(200, 200, 200, 0.5)'
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonFullWidth: {
    paddingVertical: 14
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500'
  }
});

export default CustomAlert; 