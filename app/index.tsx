import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Index() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  // Debug function to clear storage (remove in production)
  const clearStorage = async () => {
    try {
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('isLoggedIn');
      console.log('Storage cleared');
      setIsLoggedIn(false);
      setIsLoading(false);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  };

  const checkLoginStatus = async () => {
    try {
      // Add a small delay for smooth loading experience
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const loginStatus = await AsyncStorage.getItem('isLoggedIn');
      const userData = await AsyncStorage.getItem('userData');
      
      console.log('Login Status Check:', {
        loginStatus,
        userData: userData ? 'exists' : 'null',
        isValid: loginStatus === 'true' && userData !== null
      });
      
      // Both conditions must be true for user to be logged in
      const isUserLoggedIn = loginStatus === 'true' && userData !== null && userData !== undefined;
      
      setIsLoggedIn(isUserLoggedIn);
    } catch (error) {
      console.error('Error checking login status:', error);
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading screen while checking login status
  if (isLoading) {
    return (
      <LinearGradient
        colors={['#4CAF50', '#2E7D32', '#1B5E20']}
        style={styles.loadingContainer}
      >
        <View style={styles.logoContainer}>
          <Text style={styles.appName}>FarmEzy</Text>
          <Text style={styles.subtitle}>Smart Farming Solutions</Text>
        </View>
        
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Initializing...</Text>
        </View>
        
        {/* Debug button to clear storage */}
        <TouchableOpacity 
          style={styles.debugClearButton}
          onPress={clearStorage}
        >
          <Text style={styles.debugClearText}>Clear Storage (Debug)</Text>
        </TouchableOpacity>
        
        <Text style={styles.footer}>
          Empowering farmers with technology
        </Text>
      </LinearGradient>
    );
  }

  console.log('Final redirect decision:', { isLoggedIn });

  // Redirect based on login status
  if (isLoggedIn === true) {
    console.log('Redirecting to dashboard...');
    return <Redirect href="/(tabs)/dashboard" />;
  } else {
    console.log('Redirecting to login...');
    return <Redirect href="/(auth)/login" />;
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  appName: {
    fontSize: 52,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '300',
    textAlign: 'center',
  },
  loaderContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '400',
  },
  debugClearButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 20,
  },
  debugClearText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontStyle: 'italic',
  },
});