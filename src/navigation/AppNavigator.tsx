import React, { useRef } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors, font } from '../theme';
import { useSettings, useDict } from '../store/settingsStore';
import { OnboardingLangScreen } from '../screens/OnboardingLangScreen';
import { OnboardingCropsScreen } from '../screens/OnboardingCropsScreen';
import { OnboardingPhoneScreen } from '../screens/OnboardingPhoneScreen';
import { OnboardingOtpScreen } from '../screens/OnboardingOtpScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { BrowseScreen } from '../screens/BrowseScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { CommodityDetailScreen } from '../screens/CommodityDetailScreen';
import { MarketplaceScreen } from '../screens/MarketplaceScreen';
import { ListingDetailScreen } from '../screens/ListingDetailScreen';
import { CreateListingScreen } from '../screens/CreateListingScreen';
import { CreateTransportScreen } from '../screens/CreateTransportScreen';
import { PremiumScreen } from '../screens/PremiumScreen';
import { TabIcon } from '../components/illustrations/TabIcon';
import { IS_REAL } from '../api/config';
import { useAuth } from '../auth/authStore';
import { useNotificationsRegistration } from '../hooks/useNotifications';
import { logNavigationScreen } from '../utils/analytics';

function routeParamsForAnalytics(params: object | undefined): Record<string, unknown> {
  if (!params || typeof params !== 'object') return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      out[k] = v;
    } else {
      out[k] = String(v);
    }
  }
  return out;
}

type RootStackParamList = {
  OnboardingLang: undefined;
  OnboardingPhone: undefined;
  OnboardingOtp: { phone: string; devCode?: string };
  OnboardingCrops: undefined;
  Tabs: undefined;
  Detail: { slug: string };
  ListingDetail: { id: string };
  CreateListing: undefined;
  CreateTransport: undefined;
  Premium: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

type TabNav = {
  onOpenDetail: (slug: string) => void;
  onEditCrops: () => void;
  onOpenListing: (id: string) => void;
  onCreateListing: () => void;
  onCreateTransport: () => void;
  onOpenPremium: () => void;
  onOpenMarkets: () => void;
};

function Tabs(nav: TabNav) {
  const t = useDict();
  useNotificationsRegistration();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: font.xs, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingTop: 6,
          paddingBottom: 6,
          height: 64,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        options={{
          title: t.tabHome,
          tabBarIcon: ({ focused }) => <TabIcon kind="home" focused={focused} />,
        }}
      >
        {() => (
          <HomeScreen
            onOpenDetail={nav.onOpenDetail}
            onAddCrops={nav.onEditCrops}
            onOpenMarkets={nav.onOpenMarkets}
          />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Markets"
        options={{
          title: t.tabMarkets,
          tabBarIcon: ({ focused }) => <TabIcon kind="markets" focused={focused} />,
        }}
      >
        {() => <BrowseScreen onOpenDetail={nav.onOpenDetail} />}
      </Tab.Screen>
      <Tab.Screen
        name="Trade"
        options={{
          title: t.tabTrade,
          tabBarIcon: ({ focused }) => <TabIcon kind="trade" focused={focused} />,
        }}
      >
        {() => (
          <MarketplaceScreen
            onOpenListing={nav.onOpenListing}
            onCreateListing={nav.onCreateListing}
            onCreateTransportRequest={nav.onCreateTransport}
          />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Profile"
        options={{
          title: t.tabProfile,
          tabBarIcon: ({ focused }) => <TabIcon kind="profile" focused={focused} />,
        }}
      >
        {() => (
          <ProfileScreen
            onEditCrops={nav.onEditCrops}
            onOpenPremium={nav.onOpenPremium}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const onboardingDone = useSettings((s) => s.onboardingDone);
  const isAuthed = useAuth((s) => s.isAuthenticated);
  const navigationRef = useNavigationContainerRef();
  const lastNavKeyRef = useRef<string>('');

  const needsAuth = IS_REAL && !isAuthed;

  const logCurrentRoute = () => {
    const r = navigationRef.getCurrentRoute();
    if (!r?.name) return;
    const key = `${r.name}:${JSON.stringify(r.params ?? {})}`;
    if (key === lastNavKeyRef.current) return;
    lastNavKeyRef.current = key;
    logNavigationScreen(r.name, routeParamsForAnalytics(r.params as object | undefined));
  };

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={logCurrentRoute}
      onStateChange={logCurrentRoute}
    >
      <Stack.Navigator
        key={`${onboardingDone}-${needsAuth}`}
        screenOptions={{ headerShown: false }}
      >
        {!onboardingDone ? (
          <>
            <Stack.Screen name="OnboardingLang">
              {({ navigation }) => (
                <OnboardingLangScreen
                  onNext={() =>
                    navigation.navigate(IS_REAL ? 'OnboardingPhone' : 'OnboardingCrops')
                  }
                />
              )}
            </Stack.Screen>
            {IS_REAL && (
              <>
                <Stack.Screen name="OnboardingPhone">
                  {({ navigation }) => (
                    <OnboardingPhoneScreen
                      onCodeSent={(phone, devCode) =>
                        navigation.navigate('OnboardingOtp', { phone, devCode })
                      }
                      onAuthWithoutOtp={() => navigation.navigate('OnboardingCrops')}
                    />
                  )}
                </Stack.Screen>
                <Stack.Screen name="OnboardingOtp">
                  {({ route, navigation }) => (
                    <OnboardingOtpScreen
                      phone={route.params.phone}
                      devCode={route.params.devCode}
                      onBack={() => navigation.goBack()}
                      onVerified={() => navigation.navigate('OnboardingCrops')}
                    />
                  )}
                </Stack.Screen>
              </>
            )}
            <Stack.Screen name="OnboardingCrops">
              {() => (
                <OnboardingCropsScreen
                  onDone={() => {
                    // `setOnboardingDone(true)` inside the screen flips the
                    // navigator root; no imperative nav call needed here.
                  }}
                />
              )}
            </Stack.Screen>
          </>
        ) : needsAuth ? (
          <>
            <Stack.Screen name="OnboardingPhone">
              {({ navigation }) => (
                <OnboardingPhoneScreen
                  onCodeSent={(phone, devCode) =>
                    navigation.navigate('OnboardingOtp', { phone, devCode })
                  }
                  onAuthWithoutOtp={() => {
                    navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
                  }}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="OnboardingOtp">
              {({ route, navigation }) => (
                <OnboardingOtpScreen
                  phone={route.params.phone}
                  devCode={route.params.devCode}
                  onBack={() => navigation.goBack()}
                  onVerified={() => {
                    navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
                  }}
                />
              )}
            </Stack.Screen>
          </>
        ) : (
          <>
            <Stack.Screen name="Tabs">
              {({ navigation }) => (
                <Tabs
                  onOpenDetail={(slug) => navigation.navigate('Detail', { slug })}
                  onEditCrops={() => navigation.navigate('OnboardingCrops')}
                  onOpenListing={(id) => navigation.navigate('ListingDetail', { id })}
                  onCreateListing={() => navigation.navigate('CreateListing')}
                  onCreateTransport={() => navigation.navigate('CreateTransport')}
                  onOpenPremium={() => navigation.navigate('Premium')}
                  onOpenMarkets={() =>
                    navigation.navigate('Tabs' as never, { screen: 'Markets' } as never)
                  }
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Detail">
              {({ route, navigation }) => (
                <CommodityDetailScreen
                  slug={route.params.slug}
                  onBack={() => navigation.goBack()}
                  onOpenPremium={() => navigation.navigate('Premium')}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="ListingDetail">
              {({ route, navigation }) => (
                <ListingDetailScreen
                  listingId={route.params.id}
                  onBack={() => navigation.goBack()}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="CreateListing" options={{ presentation: 'modal' }}>
              {({ navigation }) => (
                <CreateListingScreen
                  onDone={() => navigation.goBack()}
                  onCancel={() => navigation.goBack()}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="CreateTransport" options={{ presentation: 'modal' }}>
              {({ navigation }) => (
                <CreateTransportScreen
                  onDone={() => navigation.goBack()}
                  onCancel={() => navigation.goBack()}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Premium" options={{ presentation: 'modal' }}>
              {({ navigation }) => <PremiumScreen onBack={() => navigation.goBack()} />}
            </Stack.Screen>
            <Stack.Screen
              name="OnboardingCrops"
              options={{ presentation: 'modal' }}
            >
              {({ navigation }) => (
                <OnboardingCropsScreen onDone={() => navigation.goBack()} />
              )}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
