import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { colors } from './src/theme';
import { initAnalytics } from './src/utils/analytics';
import { usePremium } from './src/store/premiumStore';
import { useAuth } from './src/auth/authStore';
import { IS_REAL } from './src/api/config';

export default function App() {
  useEffect(() => {
    initAnalytics();
    if (IS_REAL && useAuth.getState().token) {
      usePremium.getState().refresh();
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <StatusBar style="dark" backgroundColor={colors.bg} />
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
