import React, { useState } from 'react';
import { View, Button, StyleSheet } from 'react-native';
import CustomAlert from '../components/CustomAlert';

const TestAlert = () => {
  const [alertVisible, setAlertVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const showAlert = () => {
    setAlertVisible(true);
  };

  const hideAlert = () => {
    setAlertVisible(false);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <View style={[
      styles.container, 
      { backgroundColor: isDarkMode ? '#18181A' : '#f5f5f7' }
    ]}>
      <Button title="顯示恢復訊息測試" onPress={showAlert} />
      <Button 
        title={isDarkMode ? "切換至淺色模式" : "切換至深色模式"} 
        onPress={toggleDarkMode} 
      />
      
      <CustomAlert
        visible={alertVisible}
        title="恢復成功"
        message={`成功恢復了 25 個密碼\n\n成功恢復了 8 個類別\n\n測試訊息是否正確顯示，不被截斷。如果訊息很長，應該能夠滾動查看。這是一個非常長的測試訊息，用來驗證 CustomAlert 組件是否能夠正確處理長文本。訊息應該能夠滾動查看，不會被截斷。`}
        buttons={[
          { text: "確定", onPress: hideAlert }
        ]}
        isDarkMode={isDarkMode}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

export default TestAlert; 