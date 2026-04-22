import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ForceUpdateGate } from './src/components/ForceUpdateGate';
import { colors } from './src/theme';
import { initAnalytics } from './src/utils/analytics';
import { usePremium } from './src/store/premiumStore';
import { useAuth } from './src/auth/authStore';
import { useSettings } from './src/store/settingsStore';
import { useWatchlist } from './src/store/watchlistStore';
import { IS_REAL } from './src/api/config';

function allPersistHydrated() {
  return (
    useSettings.persist.hasHydrated() &&
    useWatchlist.persist.hasHydrated() &&
    useAuth.persist.hasHydrated()
  );
}

function PersistHydrationGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(allPersistHydrated);

  useEffect(() => {
    if (allPersistHydrated()) {
      setReady(true);
      return;
    }
    const bump = () => {
      if (allPersistHydrated()) setReady(true);
    };
    const u1 = useSettings.persist.onFinishHydration(bump);
    const u2 = useWatchlist.persist.onFinishHydration(bump);
    const u3 = useAuth.persist.onFinishHydration(bump);
    return () => {
      u1();
      u2();
      u3();
    };
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

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
        <ForceUpdateGate>
          <PersistHydrationGate>
            <AppNavigator />
          </PersistHydrationGate>
        </ForceUpdateGate>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
