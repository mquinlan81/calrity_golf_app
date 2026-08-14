import {
  CormorantGaramond_600SemiBold,
  CormorantGaramond_600SemiBold_Italic,
} from '@expo-google-fonts/cormorant-garamond';
import { SourceSans3_400Regular, SourceSans3_600SemiBold } from '@expo-google-fonts/source-sans-3';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AppProvider, useApp } from '../src/context/AppContext';
import { colors } from '../src/theme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function Gate() {
  const { loading, profile } = useApp();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const group = segments[0];
    const inOnboarding = group === '(onboarding)';
    const onboarded = Boolean(profile?.onboarding_complete);
    if (!onboarded && !inOnboarding) {
      router.replace('/welcome');
    } else if (onboarded && inOnboarding) {
      router.replace('/');
    }
  }, [loading, profile, router, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.cream } }}>
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="session" options={{ presentation: 'card' }} />
      <Stack.Screen name="range-plan" />
      <Stack.Screen name="journal" />
      <Stack.Screen name="card-review" />
      <Stack.Screen name="correctives" />
      <Stack.Screen name="physical-screen" />
      <Stack.Screen name="tpi" />
      <Stack.Screen name="admin" />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    CormorantGaramond_600SemiBold,
    CormorantGaramond_600SemiBold_Italic,
    SourceSans3_400Regular,
    SourceSans3_600SemiBold,
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => undefined);
  }, [loaded]);

  if (!loaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  return (
    <AppProvider>
      <StatusBar style="dark" />
      <Gate />
    </AppProvider>
  );
}
