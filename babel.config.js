// babel.config.js  (專案根目錄)
module.exports = {
    presets: [
      // Expo 專案請用這個；裸 React Native 用 'module:metro-react-native-babel-preset'
      'babel-preset-expo'
    ],
    plugins: [
      // 其它 Babel 外掛放前面…
  
      // ⬇️ 一定要放在 plugins 陣列「最後一個」！
      'react-native-reanimated/plugin',
    ],
  };