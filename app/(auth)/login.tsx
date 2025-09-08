import { OTPWidget } from '@msg91comm/sendotp-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';

import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

const { width, height } = Dimensions.get('window');

// OTP Widget Configuration
const widgetId = '356875673578323930323138';
const tokenAuth = '465493TgY9Xc3szGfj68a82daeP1'; // Replace with your actual auth token

interface UserData {
  username: string;
  dob: string;
}

// Extend the global object to include refreshAuthState
declare global {
  // eslint-disable-next-line no-var
  var refreshAuthState: (() => void) | undefined;
}

const LoginScreen = () => {
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [isOTPSent, setIsOTPSent] = useState<boolean>(false);
  const [isOTPVerified, setIsOTPVerified] = useState<boolean>(false);
  const [showUserDataModal, setShowUserDataModal] = useState<boolean>(false);
  const [userData, setUserData] = useState<UserData>({ username: '', dob: '' });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentReqId, setCurrentReqId] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [stage, setStage] = useState<"phone" | "otp" | "user">("phone");
  const router = useRouter();

  useEffect(() => {
    // Initialize OTP Widget
    console.log('Initializing OTP Widget...');
    OTPWidget.initializeWidget(widgetId, tokenAuth);
    getLoggedInStatus();
  }, []);

  const getLoggedInStatus = async () => {
    await AsyncStorage.getItem('isLoggedIn').then(value => {
      if (value === 'true') {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    });
  }

  useFocusEffect(
    React.useCallback(() => {
      getLoggedInStatus();
    }, [])
  );
  // Handle date picker
  const onDateChange = (event: any, date?: Date): void => {
    const currentDate = date || selectedDate;
    setShowDatePicker(Platform.OS === 'ios'); // Keep open on iOS
    setSelectedDate(currentDate);
    
    // Format date as DD/MM/YYYY
    const formattedDate = currentDate.toLocaleDateString('en-GB');
    setUserData({ ...userData, dob: formattedDate });
  };

  const showDatePickerModal = (): void => {
    setShowDatePicker(true);
  };

  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return 'Select Date of Birth';
    return dateString;
  };

  const handleSendOTP = async (): Promise<void> => {
    console.log('Sending OTP for:', phoneNumber);
    
    if (phoneNumber.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);
    try {
      const data = {
        identifier: `91${phoneNumber}`
      };
      
      const response = await OTPWidget.sendOTP(data);
      console.log('OTP Response:', response);
      
      if (response && response.message) {
        setCurrentReqId(response.message);
        setIsOTPSent(true);
        setStage("otp");
        Alert.alert('Success', 'OTP sent successfully!');
      } else {
        Alert.alert('Error', 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('OTP Send Error:', error);
      Alert.alert('Error', 'Failed to send OTP. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (): Promise<void> => {
    console.log('Verifying OTP:', otp);
    
    if (otp.length !== 4) {
      Alert.alert('Error', 'Please enter a valid 4-digit OTP');
      return;
    }

    if (!currentReqId) {
      Alert.alert('Error', 'No OTP request found. Please resend OTP.');
      return;
    }

    setIsLoading(true);
    try {
      const data = {
        identifier: `91${phoneNumber}`,
        otp: otp,
        reqId: currentReqId
      };
      
      const response = await OTPWidget.verifyOTP(data);
      console.log('Verify Response:', response);
      
      if (response && response.type === 'success') {
        setIsOTPVerified(true);
        setStage("user");
        setShowUserDataModal(true);
        Alert.alert('Success', 'OTP verified successfully!');
      } else {
        Alert.alert('Error', 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error('OTP Verify Error:', error);
      Alert.alert('Error', 'Failed to verify OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserDataSubmit = async (): Promise<void> => {
    console.log('Submitting user data:', userData);
    
    if (userData.username.trim() && userData.dob.trim()) {
      try {
        // Store user data and login status
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        await AsyncStorage.setItem('isLoggedIn', 'true');
        
        console.log('User data stored successfully');
        console.log('Stored data check:', {
          userData: await AsyncStorage.getItem('userData'),
          isLoggedIn: await AsyncStorage.getItem('isLoggedIn')
        });
        
        setShowUserDataModal(false);
        
        // Trigger auth state refresh
        if (global.refreshAuthState) {
          console.log('Refreshing auth state...');
          global.refreshAuthState();
        }
        
        // Force navigation with replace
        console.log('Navigating to dashboard...');
        router.replace('/(tabs)/dashboard');
        
      } catch (error) {
        console.error('Error storing user data:', error);
        Alert.alert('Error', 'Failed to save user data. Please try again.');
      }
    } else {
      Alert.alert('Error', 'Please fill in all fields');
    }
  };

  // Debug function to bypass OTP (remove in production)
  const debugLogin = async (): Promise<void> => {
    const debugUserData = { username: 'Test User', dob: '01/01/1990' };
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(debugUserData));
      await AsyncStorage.setItem('isLoggedIn', 'true');
      
      console.log('Debug login successful');
      console.log('Debug stored data:', {
        userData: await AsyncStorage.getItem('userData'),
        isLoggedIn: await AsyncStorage.getItem('isLoggedIn')
      });
      
      // Trigger auth state refresh
      if (global.refreshAuthState) {
        console.log('Refreshing auth state from debug login...');
        global.refreshAuthState();
      }
      
      // Force navigation
      router.replace('/(tabs)/dashboard');
    } catch (error) {
      console.error('Debug login error:', error);
    }
  };

  const resetForm = (): void => {
    setPhoneNumber('');
    setOtp('');
    setIsOTPSent(false);
    setIsOTPVerified(false);
    setShowUserDataModal(false);
    setUserData({ username: '', dob: '' });
    setCurrentReqId('');
    setSelectedDate(new Date());
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
      <LinearGradient
        colors={['#4CAF50', '#2E7D32', '#1B5E20']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.appName}>FarmEzy</Text>
              <Text style={styles.subtitle}>Smart Farming Solutions</Text>
            </View>

            {/* Debug Button - Remove in production */}
            <TouchableOpacity 
              style={styles.debugButton}
              onPress={debugLogin}
            >
              <Text style={styles.debugButtonText}>Debug Login (Skip OTP)</Text>
            </TouchableOpacity>

            {/* Login Card */}
            <View style={styles.loginCard}>
              {stage === "phone" && (
                <View style={styles.inputSection}>
                  <Text style={styles.title}>Welcome Back!</Text>
                  <Text style={styles.description}>
                    Enter your mobile number to get started
                  </Text>

                  <View style={styles.inputContainer}>
                    <Text style={styles.countryCode}>+91</Text>
                    <TextInput
                      style={styles.phoneInput}
                      placeholder="Enter mobile number"
                      placeholderTextColor="#9E9E9E"
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      keyboardType="numeric"
                      maxLength={10}
                    />
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.button,
                      phoneNumber.length === 10 && !isLoading
                        ? styles.buttonActive
                        : styles.buttonInactive,
                    ]}
                    onPress={handleSendOTP}
                    disabled={phoneNumber.length !== 10 || isLoading}
                  >
                    <Text style={styles.buttonText}>
                      {isLoading ? "Sending..." : "Send OTP"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {stage === "otp" && (
                <View style={styles.inputSection}>
                  <Text style={styles.title}>Verify OTP</Text>
                  <Text style={styles.description}>
                    Enter the 4-digit OTP sent to +91 {phoneNumber}
                  </Text>

                  <View style={styles.otpInputContainer}>
                    <TextInput
                      style={styles.otpTextInput}
                      placeholder="Enter 4-digit OTP"
                      placeholderTextColor="#9E9E9E"
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="numeric"
                      maxLength={4}
                      textAlign="center"
                    />
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.button,
                      otp.length === 4 && !isLoading
                        ? styles.buttonActive
                        : styles.buttonInactive,
                    ]}
                    onPress={handleVerifyOTP}
                    disabled={otp.length !== 4 || isLoading}
                  >
                    <Text style={styles.buttonText}>
                      {isLoading ? "Verifying..." : "Verify OTP"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.secondaryButton]}
                    onPress={resetForm}
                    disabled={isLoading}
                  >
                    <Text
                      style={[styles.buttonText, styles.secondaryButtonText]}
                    >
                      Change Number
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {stage === "user" && (
                <View style={styles.inputSection}>
                  <Text style={styles.title}>Complete Your Profile</Text>
                  <Text style={styles.description}>
                    Please provide your details to continue
                  </Text>

                  <View style={styles.modalInputContainer}>
                    <Text style={styles.inputLabel}>Username</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Enter your username"
                      placeholderTextColor="#9E9E9E"
                      value={userData.username}
                      onChangeText={(text) =>
                        setUserData({ ...userData, username: text })
                      }
                      keyboardType='default'
                    />
                  </View>

                  <View style={styles.modalInputContainer}>
                    <Text style={styles.inputLabel}>Date of Birth</Text>
                    <TouchableOpacity
                      style={styles.datePickerButton}
                      onPress={showDatePickerModal}
                    >
                      <Text
                        style={[
                          styles.datePickerText,
                          userData.dob
                            ? styles.dateSelectedText
                            : styles.datePlaceholderText,
                        ]}
                      >
                        {formatDateForDisplay(userData.dob)}
                      </Text>
                      <Text style={styles.calendarIcon}>📅</Text>
                    </TouchableOpacity>
                  </View>

                  

                  <TouchableOpacity
                    style={[styles.button, styles.modalButton]}
                    onPress={handleUserDataSubmit}
                  >
                    <Text style={styles.buttonText}>Continue</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>


            {/* Footer */}
            <Text style={styles.footer}>
              Happy Farming
            </Text>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
<Modal
      visible={showDatePicker}
      transparent
      animationType="fade"
      onRequestClose={() => setShowDatePicker(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowDatePicker(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16 }}>
              <DateTimePicker
                testID="dateTimePicker"
                value={selectedDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onDateChange}
                maximumDate={new Date()}
                minimumDate={new Date(1920, 0, 1)}
                textColor="#000"
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  keyboardView: { flex: 1 },
  content: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 40 },
  header: { alignItems: 'center', marginTop: 40 },
  appName: { fontSize: 48, fontWeight: 'bold', color: 'white', textShadowColor: 'rgba(0, 0, 0, 0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  subtitle: { fontSize: 16, color: 'rgba(255, 255, 255, 0.9)', marginTop: 8, fontWeight: '300' },
  debugButton: { backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, alignSelf: 'center', marginVertical: 10 },
  debugButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
  loginCard: { backgroundColor: 'white', borderRadius: 24, padding: 30, marginHorizontal: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 8 },
  inputSection: { alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2E7D32', marginBottom: 8, textAlign: 'center' },
  description: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30, lineHeight: 22 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: '#E0E0E0', borderRadius: 12, marginBottom: 24, backgroundColor: '#F8F8F8' },
  countryCode: { fontSize: 16, fontWeight: '600', color: '#2E7D32', paddingHorizontal: 16, paddingVertical: 18, borderRightWidth: 1, borderRightColor: '#E0E0E0' },
  phoneInput: { flex: 1, fontSize: 16, paddingHorizontal: 16, paddingVertical: 18, color: '#333' },
  button: { borderRadius: 12, paddingVertical: 16, paddingHorizontal: 40, width: '100%', alignItems: 'center', marginTop: 8 },
  buttonActive: { backgroundColor: '#4CAF50' },
  buttonInactive: { backgroundColor: '#BDBDBD' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  secondaryButton: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#4CAF50', marginTop: 16 },
  secondaryButtonText: { color: '#4CAF50' },
  otpInputContainer: { marginBottom: 24, width: '100%' },
  otpTextInput: { borderWidth: 2, borderColor: '#E0E0E0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 18, fontSize: 18, fontWeight: '600', backgroundColor: '#F8F8F8', color: '#333', letterSpacing: 8 },
  footer: { textAlign: 'center', color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontStyle: 'italic' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 20, padding: 30, width: '100%', maxWidth: 350, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 10 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#2E7D32', textAlign: 'center', marginBottom: 8 },
  modalDescription: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  modalInputContainer: { marginBottom: 20, width: '100%' },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  modalInput: { borderWidth: 2, width:'100%', borderColor: '#E0E0E0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, backgroundColor: '#F8F8F8', color: '#333' },
  modalButtonContainer: { marginTop: 10 },
  modalButton: { backgroundColor: '#4CAF50' },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#F8F8F8',
  },
  datePickerText: {
    fontSize: 16,
    flex: 1,
  },
  dateSelectedText: {
    color: '#333',
  },
  datePlaceholderText: {
    color: '#9E9E9E',
  },
  calendarIcon: {
    fontSize: 20,
  },
});

export default LoginScreen;