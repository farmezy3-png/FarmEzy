import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

export default function RootLayout() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const segments = useSegments();
  const router = useRouter();

  console.log('Current segments:', segments);
  console.log('Is logged in:', isLoggedIn);

  // Check login status on app start
  useEffect(() => {
    checkLoginStatus();
  }, []);

  // Re-check login status when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        checkLoginStatus();
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  // Handle navigation based on login status
  useEffect(() => {
    if (isLoggedIn === null) return; // Still loading

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const isOnIndex = segments.length === 0;

    console.log('Navigation check:', { 
      inAuthGroup, 
      inTabsGroup, 
      isOnIndex, 
      isLoggedIn,
      currentSegments: segments 
    });

    if (!isLoggedIn && !inAuthGroup) {
      // User is not logged in but trying to access protected routes
      console.log('Redirecting to login...');
      router.replace('/(auth)/login');
    } else if (isLoggedIn && (inAuthGroup || isOnIndex)) {
      // User is logged in but still on auth routes or root
      console.log('Redirecting to dashboard...');
      router.replace('/(tabs)/dashboard');
    }
  }, [isLoggedIn, segments]);

  const checkLoginStatus = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const loginStatus = await AsyncStorage.getItem('isLoggedIn');
      
      console.log('Storage check:', { userData, loginStatus });
      
      const isUserLoggedIn = loginStatus === 'true' && userData !== null && userData !== undefined;
      
      if (userData && loginStatus === 'true' && isUserLoggedIn) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error('Error checking login status:', error);
      setIsLoggedIn(false);
    }
  };

  // Expose function globally for logout
  global.refreshAuthState = checkLoginStatus;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}