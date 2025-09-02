import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

interface UserData {
  username: string;
  dob: string;
}

interface WeatherData {
  temperature: string;
  condition: string;
  humidity: string;
  rainfall: string;
  location: string;
  icon: string;
}

const Dashboard = () => {
  // All state declarations
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData>({
    temperature: '-- °C',
    condition: 'Loading...',
    humidity: '--%',
    rainfall: '--mm',
    location: 'Getting location...',
    icon: '01d'
  });
  const [isWeatherLoading, setIsWeatherLoading] = useState(true); // Renamed for clarity
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null);
  const router = useRouter();

  // Load user data and get location on mount
  useEffect(() => {
    loadUserData();
    getCurrentLocation();
  }, []);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        setCurrentUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Get user's current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      console.log('Requesting user location...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log('Location obtained:', latitude, longitude);
          setUserLocation({ lat: latitude, lon: longitude });
          fetchWeatherData(latitude, longitude);
        },
        (error) => {
          console.error('Location error:', error.message);
          console.log('Using default location: Anthiyur, Tamil Nadu');
          // Use Anthiyur coordinates as default
          const anthiyurLat = 11.5798;
          const anthiyurLon = 77.5946;
          setUserLocation({ lat: anthiyurLat, lon: anthiyurLon });
          fetchWeatherData(anthiyurLat, anthiyurLon);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    } else {
      console.log('Geolocation not supported, using Anthiyur default');
      const anthiyurLat = 11.5798;
      const anthiyurLon = 77.5946;
      setUserLocation({ lat: anthiyurLat, lon: anthiyurLon });
      fetchWeatherData(anthiyurLat, anthiyurLon);
    }
  };

  // Fetch weather data
  const fetchWeatherData = async (latitude?: number, longitude?: number) => {
    try {
      setIsWeatherLoading(true);
      
      // Default to Anthiyur coordinates
      const lat = latitude || 11.5798;
      const lon = longitude || 77.5946;
      
      console.log(`Fetching weather for coordinates: ${lat}, ${lon}`);
      
      // Try Open-Meteo API
      try {
        const weatherResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,precipitation&daily=precipitation_sum&timezone=Asia/Kolkata&forecast_days=1`
        );
        
        if (weatherResponse.ok) {
          const data = await weatherResponse.json();
          const current = data.current_weather;
          
          const currentHour = new Date().getHours();
          const humidity = data.hourly.relativehumidity_2m[currentHour] || 75;
          const todayPrecipitation = data.daily.precipitation_sum[0] || 0;
          
          const getWeatherCondition = (code: number) => {
            const conditions: { [key: number]: { condition: string; icon: string } } = {
              0: { condition: 'Clear Sky - Good for Farming', icon: '01d' },
              1: { condition: 'Mostly Clear - Perfect Weather', icon: '01d' },
              2: { condition: 'Partly Cloudy - Ideal Conditions', icon: '02d' },
              3: { condition: 'Overcast - Good for Work', icon: '03d' },
              61: { condition: 'Light Rain - Good for Crops', icon: '10d' },
              63: { condition: 'Moderate Rain - Stay Safe', icon: '10d' }
            };
            return conditions[code] || { condition: 'Normal Weather', icon: '01d' };
          };
          
          const weatherInfo = getWeatherCondition(current.weathercode);
          
          const locationName = latitude && longitude ? 'Tamil Nadu, India' : 'Anthiyur, Tamil Nadu';
          
          setWeatherData({
            temperature: `${Math.round(current.temperature)}°C`,
            condition: weatherInfo.condition,
            humidity: `${Math.round(humidity)}%`,
            rainfall: `${todayPrecipitation.toFixed(1)}mm`,
            location: locationName,
            icon: weatherInfo.icon
          });
          
          console.log('Weather data loaded successfully');
          setIsWeatherLoading(false);
          return;
        }
      } catch (error) {
        console.error('Weather API failed:', error);
      }
      
      // Fallback to seasonal data
      const tamilNaduSeasonalWeather = () => {
        const month = new Date().getMonth() + 1;
        const locationName = latitude && longitude ? 'Tamil Nadu, India' : 'Anthiyur, Tamil Nadu';
        
        if ([10, 11, 12].includes(month)) {
          return {
            temperature: '24°C',
            condition: 'Northeast Monsoon Season',
            humidity: '85%',
            rainfall: '20mm',
            location: locationName,
            icon: '10d'
          };
        } else if ([3, 4, 5].includes(month)) {
          return {
            temperature: '32°C',
            condition: 'Summer - Irrigation Needed',
            humidity: '65%',
            rainfall: '2mm',
            location: locationName,
            icon: '01d'
          };
        } else {
          return {
            temperature: '27°C',
            condition: 'Pleasant Weather',
            humidity: '72%',
            rainfall: '5mm',
            location: locationName,
            icon: '02d'
          };
        }
      };
      
      setWeatherData(tamilNaduSeasonalWeather());
      console.log('Using seasonal weather data');
      
    } catch (error) {
      console.error('All weather failed:', error);
      setWeatherData({
        temperature: '28°C',
        condition: 'Weather Unavailable',
        humidity: '70%',
        rainfall: '0mm',
        location: 'Anthiyur, Tamil Nadu',
        icon: '01d'
      });
    } finally {
      setIsWeatherLoading(false);
    }
  };

  // Get weather icon
  const getWeatherIcon = (iconCode: string) => {
    const iconMap: { [key: string]: string } = {
      '01d': '☀️', '01n': '🌙',
      '02d': '⛅', '02n': '☁️',
      '03d': '☁️', '03n': '☁️',
      '10d': '🌦️', '10n': '🌧️',
      '11d': '⛈️', '11n': '⛈️'
    };
    return iconMap[iconCode] || '🌤️';
  };

  // Get greeting based on time
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning!';
    if (hour < 17) return 'Good Afternoon!';
    return 'Good Evening!';
  };

  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: performLogout 
        },
      ]
    );
  };

  const performLogout = async () => {
    try {
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('isLoggedIn');
      setCurrentUser(null);
      
      if (global.refreshAuthState) {
        global.refreshAuthState();
      }
      
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
      
      {/* Header */}
      <LinearGradient
        colors={['#4CAF50', '#2E7D32']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.username}>
              {currentUser?.username || 'Farmer'}
            </Text>
            <Text style={styles.dateTime}>
              {formatDate(currentTime)} • {formatTime(currentTime)}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={handleLogout}
          >
            <Icon name="logout" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Weather Card */}
        <View style={styles.weatherCard}>
          <View style={styles.weatherHeader}>
            <Text style={styles.weatherIcon}>
              {getWeatherIcon(weatherData.icon)}
            </Text>
            <View style={styles.weatherHeaderText}>
              <Text style={styles.weatherTitle}>Today's Weather</Text>
              <Text style={styles.weatherLocation}>{weatherData.location}</Text>
            </View>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={() => {
                if (userLocation) {
                  fetchWeatherData(userLocation.lat, userLocation.lon);
                } else {
                  getCurrentLocation();
                }
              }}
              disabled={isWeatherLoading}
            >
              <Icon 
                name="refresh" 
                size={20} 
                color={isWeatherLoading ? "#BDBDBD" : "#4CAF50"} 
              />
            </TouchableOpacity>
          </View>
          
          {isWeatherLoading ? (
            <View style={styles.weatherLoading}>
              <Text style={styles.loadingText}>Loading weather data...</Text>
            </View>
          ) : (
            <View style={styles.weatherContent}>
              <View style={styles.weatherMain}>
                <Text style={styles.temperature}>{weatherData.temperature}</Text>
                <Text style={styles.condition}>{weatherData.condition}</Text>
              </View>
              <View style={styles.weatherDetails}>
                <View style={styles.weatherItem}>
                  <Icon name="opacity" size={20} color="#2196F3" />
                  <Text style={styles.weatherValue}>{weatherData.humidity}</Text>
                  <Text style={styles.weatherLabel}>Humidity</Text>
                </View>
                <View style={styles.weatherItem}>
                  <Icon name="grain" size={20} color="#2196F3" />
                  <Text style={styles.weatherValue}>{weatherData.rainfall}</Text>
                  <Text style={styles.weatherLabel}>Rainfall</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Banana Calculator */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                console.log('Navigating to Banana Calculator...');
                try {
                  router.push('/(tabs)/banana-calculator');
                } catch (error) {
                  console.error('Navigation error:', error);
                  Alert.alert('Navigation Error', 'Could not open Banana Calculator');
                }
              }}
            >
              <LinearGradient
                colors={['#FFB300', '#FF8F00']}
                style={styles.actionGradient}
              >
                <Text style={styles.bananaIcon}>🍌</Text>
                <Text style={styles.actionText}>Banana Calculator</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '400',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 2,
  },
  dateTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  profileButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  weatherCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  weatherIcon: {
    fontSize: 32,
  },
  weatherHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  weatherTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  weatherLocation: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
  },
  weatherLoading: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  weatherContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weatherMain: {
    flex: 1,
  },
  temperature: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  condition: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  weatherDetails: {
    flexDirection: 'row',
    gap: 20,
  },
  weatherItem: {
    alignItems: 'center',
  },
  weatherValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  weatherLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  actionButton: {
    width: (width - 52) / 1.5,
    height: 100,
  },
  actionGradient: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 4,
  },
  actionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bananaIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  bottomPadding: {
    height: 20,
  },
});

export default Dashboard;