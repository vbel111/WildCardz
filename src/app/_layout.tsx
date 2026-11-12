import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { useFonts } from 'expo-font';
import { Anton_400Regular } from '@expo-google-fonts/anton';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '@/theme';
import { useSettings } from '@/stores/settings';
import { initPurchases } from '@/services/purchases';
import { initSounds } from '@/services/feedback';

SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 250, fade: true });
SystemUI.setBackgroundColorAsync(colors.stage).catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Anton_400Regular, DMSans_400Regular, DMSans_500Medium, DMSans_700Bold });
  const hydrated = useSettings((s) => s.hydrated);
  const ready = (fontsLoaded || !!fontError) && hydrated;

  useEffect(() => {
    initPurchases();
    initSounds();
  }, []);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.stage }} />;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.stage }}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: colors.stage },
          }}
        >
          <Stack.Screen name="index" options={{ animation: 'none' }} />
          <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
          <Stack.Screen name="home" options={{ animation: 'fade', gestureEnabled: false }} />
          <Stack.Screen name="paywall" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="results" options={{ animation: 'fade', gestureEnabled: false }} />
          <Stack.Screen name="charades/play" options={{ gestureEnabled: false, animation: 'fade' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
