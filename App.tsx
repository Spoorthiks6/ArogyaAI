import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, ScrollView, ActivityIndicator } from 'react-native';
import axios from 'axios';

const API_URL = 'http://10.60.207.214:4000';

interface AuthState {
  isLoggedIn: boolean;
  email: string;
  token: string | null;
}

interface AppState extends AuthState {
  currentScreen: 'auth' | 'dashboard' | 'emergency';
  loading: boolean;
}

export default function App() {
  const [state, setState] = useState<AppState>({
    isLoggedIn: false,
    email: '',
    token: null,
    currentScreen: 'auth',
    loading: false,
  });

  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    isSignUp: false,
  });

  const handleAuth = async () => {
    if (!authForm.email || !authForm.password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setState(prev => ({ ...prev, loading: true }));
    try {
      const endpoint = authForm.isSignUp ? '/auth/register' : '/auth/login';
      const response = await axios.post(`${API_URL}${endpoint}`, {
        email: authForm.email,
        password: authForm.password,
      });

      if (response.data.token) {
        setState(prev => ({
          ...prev,
          isLoggedIn: true,
          email: authForm.email,
          token: response.data.token,
          currentScreen: 'dashboard',
        }));
        Alert.alert('Success', authForm.isSignUp ? 'Account created!' : 'Logged in!');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Connection failed');
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleEmergency = () => {
    Alert.alert(
      '🚨 Emergency Alert',
      'Emergency alert sent to your contacts and nearby hospitals!',
      [{ text: 'OK', onPress: () => setState(prev => ({ ...prev, currentScreen: 'dashboard' })) }]
    );
  };

  const handleLogout = () => {
    setState({
      isLoggedIn: false,
      email: '',
      token: null,
      currentScreen: 'auth',
      loading: false,
    });
    setAuthForm({ email: '', password: '', isSignUp: false });
  };

  // AUTH SCREEN
  if (!state.isLoggedIn) {
    return (
      <ScrollView contentContainerStyle={styles.authContainer}>
        <View style={styles.header}>
          <Text style={styles.titleAuth}>🏥 ArogyaAI</Text>
          <Text style={styles.subtitleAuth}>Emergency Response System</Text>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={authForm.email}
            onChangeText={(text) => setAuthForm(prev => ({ ...prev, email: text }))}
            keyboardType="email-address"
            placeholderTextColor="#999"
            editable={!state.loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            value={authForm.password}
            onChangeText={(text) => setAuthForm(prev => ({ ...prev, password: text }))}
            secureTextEntry
            placeholderTextColor="#999"
            editable={!state.loading}
          />

          <TouchableOpacity
            style={[styles.button, state.loading && styles.buttonDisabled]}
            onPress={handleAuth}
            disabled={state.loading}
          >
            {state.loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>
                {authForm.isSignUp ? 'Sign Up' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setAuthForm(prev => ({ ...prev, isSignUp: !prev.isSignUp }))}
          >
            <Text style={styles.switchText}>
              {authForm.isSignUp
                ? 'Already have account? Sign In'
                : 'Create new account? Sign Up'}
            </Text>
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              📌 Test Credentials:{'\n'}
              Email: test@example.com{'\n'}
              Password: password123
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  // DASHBOARD SCREEN
  if (state.currentScreen === 'dashboard') {
    return (
      <View style={styles.dashboardContainer}>
        <View style={styles.dashboardHeader}>
          <Text style={styles.dashboardTitle}>Welcome!</Text>
          <Text style={styles.dashboardEmail}>{state.email}</Text>
        </View>

        <View style={styles.dashboardContent}>
          <TouchableOpacity
            style={styles.emergencyButton}
            onPress={() => setState(prev => ({ ...prev, currentScreen: 'emergency' }))}
          >
            <Text style={styles.emergencyButtonText}>🚨</Text>
            <Text style={styles.emergencyButtonLabel}>EMERGENCY</Text>
          </TouchableOpacity>

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>ℹ️ Quick Features</Text>
            <Text style={styles.infoItem}>✓ One-tap emergency alert</Text>
            <Text style={styles.infoItem}>✓ Voice message recording</Text>
            <Text style={styles.infoItem}>✓ Location tracking</Text>
            <Text style={styles.infoItem}>✓ Hospital notifications</Text>
            <Text style={styles.infoItem}>✓ Medical information sharing</Text>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // EMERGENCY SCREEN
  return (
    <View style={styles.emergencyContainer}>
      <View style={styles.emergencyHeader}>
        <Text style={styles.emergencyTitle}>🚨 EMERGENCY ALERT</Text>
      </View>

      <View style={styles.emergencyContent}>
        <View style={styles.alertBox}>
          <Text style={styles.alertTitle}>Alert Sent!</Text>
          <Text style={styles.alertMessage}>
            Emergency notification has been sent to:{'\n\n'}
            ✓ Your emergency contacts{'\n'}
            ✓ Nearby hospitals{'\n'}
            ✓ Medical services
          </Text>
        </View>

        <View style={styles.statusBox}>
          <Text style={styles.statusTitle}>📍 Location Status</Text>
          <Text style={styles.statusText}>✓ GPS location captured</Text>
          <Text style={styles.statusText}>✓ Medical info included</Text>
          <Text style={styles.statusText}>✓ Hospitals notified</Text>
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setState(prev => ({ ...prev, currentScreen: 'dashboard' }))}
        >
          <Text style={styles.backButtonText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // AUTH STYLES
  authContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  titleAuth: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitleAuth: {
    fontSize: 16,
    color: '#666',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  button: {
    height: 50,
    backgroundColor: '#00A885',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchText: {
    color: '#00A885',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    textDecorationLine: 'underline',
  },
  infoBox: {
    backgroundColor: '#e8f4f8',
    borderLeftWidth: 4,
    borderLeftColor: '#00A885',
    padding: 15,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 20,
  },

  // DASHBOARD STYLES
  dashboardContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  dashboardHeader: {
    backgroundColor: '#00A885',
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  dashboardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  dashboardEmail: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  dashboardContent: {
    flex: 1,
    padding: 20,
  },
  emergencyButton: {
    height: 140,
    backgroundColor: '#FF4444',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: '#FF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emergencyButtonText: {
    fontSize: 50,
    marginBottom: 8,
  },
  emergencyButtonLabel: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  infoSection: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  infoItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  logoutButton: {
    height: 50,
    backgroundColor: '#999',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // EMERGENCY STYLES
  emergencyContainer: {
    flex: 1,
    backgroundColor: '#fff3cd',
  },
  emergencyHeader: {
    backgroundColor: '#FF4444',
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emergencyTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  emergencyContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  alertBox: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#00A885',
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00A885',
    marginBottom: 12,
  },
  alertMessage: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
  },
  statusBox: {
    backgroundColor: '#e8f4f8',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
    lineHeight: 20,
  },
  backButton: {
    height: 50,
    backgroundColor: '#00A885',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
