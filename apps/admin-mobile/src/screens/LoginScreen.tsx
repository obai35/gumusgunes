import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { colors, spacing, borderRadius } from '../theme'
import { api } from '../api'
import { connectSocket } from '../socket'
import { registerForPushNotifications } from '../notifications'

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState<'email' | 'password' | null>(null)

  const opacity = useSharedValue(0)
  const translateY = useSharedValue(20)

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 600 })
    translateY.value = withTiming(0, { duration: 600 })
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Error', 'Please enter email and password'); return }
    setLoading(true)
    try {
      await api.login(email, password)
      connectSocket().catch(() => {})
      registerForPushNotifications()
      navigation.replace('Main')
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <LinearGradient colors={['#0a0a0a', '#000']} style={styles.container}>
      <Image
        source={require('../../assets/icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Animated.View style={[styles.card, animatedStyle]}>
        <Text style={styles.title}>Gümüş Güneş</Text>
        <Text style={styles.subtitle}>Admin Chat</Text>

        <View style={[styles.inputWrapper, focused === 'email' && styles.inputFocused]}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#555"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            onFocus={() => setFocused('email')}
            onBlur={() => setFocused(null)}
          />
        </View>

        <View style={[styles.inputWrapper, focused === 'password' && styles.inputFocused]}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#555"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            onFocus={() => setFocused('password')}
            onBlur={() => setFocused(null)}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          <LinearGradient colors={['#d4af37', '#b8960c']} style={styles.gradient}>
            {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>Login</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  logo: { width: 80, height: 80, marginBottom: 24, borderRadius: 20 },
  card: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.gold, textAlign: 'center' },
  subtitle: { fontSize: 15, color: colors.grayLight, textAlign: 'center', marginBottom: 32, marginTop: 4 },
  inputWrapper: {
    backgroundColor: colors.inputBg,
    borderRadius: borderRadius.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputFocused: { borderColor: colors.gold },
  input: { color: colors.white, padding: 16, fontSize: 16 },
  button: { borderRadius: borderRadius.md, overflow: 'hidden', marginTop: 8 },
  gradient: { padding: 16, alignItems: 'center' },
  buttonText: { color: '#000', fontSize: 16, fontWeight: '600' },
})
