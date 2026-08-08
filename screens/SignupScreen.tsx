import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  StyleSheet,
  ActivityIndicator,
  BackHandler,
  Platform,
  ImageBackground,
  StatusBar,
  KeyboardAvoidingView,
  Animated,
  Easing,
  TouchableWithoutFeedback,
} from 'react-native'
import tw from 'twrnc'
import Svg, { Path, Circle, Rect, Polyline, Line } from 'react-native-svg'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '../lib/supabase'
import { clearAllUserCache } from '../lib/cache'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')
const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 48
const ALLOWED_DOMAINS = ['iiitt.ac.in']
const APP_CATEGORIES = ['Food', 'Grocery', 'Pharmacy', 'Stationery', 'Others']

/* ── Photos from EnhanceDeliveryAppLoginPage ───────────────────────── */
const PHOTO = {
  delivery1: 'https://images.unsplash.com/photo-1695654390723-479197a8c4a3?w=800&h=1400&fit=crop&auto=format&q=85',
  delivery2: 'https://images.unsplash.com/photo-1572195577046-2f25894c06fc?w=800&h=1400&fit=crop&auto=format&q=85',
  partner:   'https://images.unsplash.com/photo-1695654397565-b904c10fe594?w=800&h=1400&fit=crop&auto=format&q=85',
}

type ScreenStep =
  | 'splash'
  | 'customer_login'
  | 'partner_login'
  | 'signup_student'
  | 'signup_owner'
  | 'verify'
  | 'verify_reset'

interface SignupScreenProps {
  onDone?: (userData: any) => void
  onRegister?: (userData: any) => void
}

/* ─────────────────────────── Exact Icons ──────────────────────────── */
const Ic = {
  Arrow: ({ color = '#ffffff', size = 18 }: { color?: string; size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 12h14" />
      <Path d="m12 5 7 7-7 7" />
    </Svg>
  ),
  Back: ({ color = '#0d2137', size = 20 }: { color?: string; size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="m15 18-6-6 6-6" />
    </Svg>
  ),
  Eye: ({ color = '#888888', size = 18 }: { color?: string; size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <Circle cx="12" cy="12" r="3" />
    </Svg>
  ),
  EyeOff: ({ color = '#888888', size = 18 }: { color?: string; size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <Path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <Path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <Line x1="2" y1="2" x2="22" y2="22" />
    </Svg>
  ),
  Mail: ({ color = '#ffffff', size = 18 }: { color?: string; size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Rect x="2" y="4" width="20" height="16" rx="2" />
      <Path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </Svg>
  ),
  Phone: ({ color = '#16a34a', size = 18 }: { color?: string; size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.75 12 19.79 19.79 0 0 1 1.72 3.18 2 2 0 0 1 3.66 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </Svg>
  ),
  Lock: ({ color = '#16a34a', size = 18 }: { color?: string; size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Rect x="3" y="11" width="18" height="11" rx="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </Svg>
  ),
  User: ({ color = '#16a34a', size = 18 }: { color?: string; size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="8" r="4" />
      <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </Svg>
  ),
  Store: ({ color = '#0d2137', size = 18 }: { color?: string; size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <Polyline points="9 22 9 12 15 12 15 22" />
    </Svg>
  ),
  Check: ({ color = '#ffffff', size = 12 }: { color?: string; size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="20 6 9 17 4 12" />
    </Svg>
  ),
}

/* ─────────────────────────── UI Elements ──────────────────────────── */

function VaayuBrandLogo({ size = 28 }: { size?: number }) {
  return (
    <Text style={{ fontSize: size, fontWeight: '900', color: '#0d2137', letterSpacing: -0.5 }}>
      Vaayu<Text style={{ color: '#16a34a' }}>.</Text>
    </Text>
  )
}

function AnimatedScaleButton({
  onPress,
  disabled = false,
  style,
  children
}: {
  onPress: () => void
  disabled?: boolean
  style?: any
  children: React.ReactNode
}) {
  const scale = useRef(new Animated.Value(1)).current

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4
    }).start()
  }

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 25,
      bounciness: 6
    }).start()
  }

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View style={[{ transform: [{ scale }] }, style]}>
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  )
}

function FormInputField({
  label,
  placeholder,
  value,
  onChange,
  type = 'default',
  secure = false,
  rightElement,
  error,
  autoCapitalize = 'none'
}: {
  label?: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  type?: any
  secure?: boolean
  rightElement?: React.ReactNode
  error?: string
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
}) {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <View style={tw`w-full mb-3`}>
      {label ? (
        <Text style={[{ fontSize: 12.5, fontWeight: '600', color: '#333333', marginBottom: 6 }]}>
          {label}
        </Text>
      ) : null}
      <View
        style={[
          tw`h-[48px] rounded-[12px] px-3.5 flex-row items-center`,
          {
            backgroundColor: isFocused ? '#ffffff' : '#fafafa',
            borderColor: error ? '#ef4444' : isFocused ? '#16a34a' : '#e4e4e4',
            borderWidth: 1.5,
            shadowColor: isFocused ? '#16a34a' : 'transparent',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: isFocused ? 0.12 : 0,
            shadowRadius: 4,
            elevation: isFocused ? 1 : 0
          }
        ]}
      >
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#bbbbbb"
          value={value}
          onChangeText={onChange}
          keyboardType={type}
          secureTextEntry={secure}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[tw`flex-1 text-[14px] font-medium text-[#111111] p-0`, { height: '100%', paddingVertical: 12 }]}
        />
        {rightElement}
      </View>
      {error ? (
        <Text style={tw`text-[11px] text-red-600 font-semibold mt-1 ml-1`}>{error}</Text>
      ) : null}
    </View>
  )
}

function CustomCheckbox({
  checked,
  onToggle
}: {
  checked: boolean
  onToggle: () => void
}) {
  const scale = useRef(new Animated.Value(checked ? 1 : 0.85)).current

  useEffect(() => {
    Animated.spring(scale, {
      toValue: checked ? 1 : 0.9,
      useNativeDriver: true,
      speed: 25,
      bounciness: 6
    }).start()
  }, [checked])

  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.8}
      style={tw`p-0.5 mr-2.5 mt-0.5`}
    >
      <Animated.View
        style={[
          tw`w-[20px] h-[20px] rounded-[6px] items-center justify-center`,
          {
            backgroundColor: checked ? '#16a34a' : '#fafafa',
            borderColor: checked ? '#16a34a' : '#dddddd',
            borderWidth: 2,
            transform: [{ scale }]
          }
        ]}
      >
        {checked && <Ic.Check size={12} color="#ffffff" />}
      </Animated.View>
    </TouchableOpacity>
  )
}

function Divider({ label }: { label: string }) {
  return (
    <View style={tw`flex-row items-center my-3`}>
      <View style={tw`flex-1 h-[1px] bg-[#eeeeee]`} />
      <Text style={tw`text-[12px] text-[#bbbbbb] font-medium px-3`}>{label}</Text>
      <View style={tw`flex-1 h-[1px] bg-[#eeeeee]`} />
    </View>
  )
}

/* ─────────────────────────── Main SignupScreen ────────────────────── */

export default function SignupScreen({ onDone, onRegister }: SignupScreenProps) {
  const [step, setStep] = useState<ScreenStep>('splash')
  const [splashPage, setSplashPage] = useState<0 | 1>(0)
  const splashScrollRef = useRef<ScrollView>(null)

  // Form states
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)

  // Shop specific states
  const [shopName, setShopName] = useState('')
  const [ownerFullName, setOwnerFullName] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [customCategory, setCustomCategory] = useState('')
  const [role, setRole] = useState<'customer' | 'owner'>('customer')

  // OTP & Reset states
  const [otpCode, setOtpCode] = useState('')
  const [newResetPassword, setNewResetPassword] = useState('')
  const [resendCooldown, setResendCooldown] = useState(30)
  const [isResendingOtp, setIsResendingOtp] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Animation values
  const sheetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT * 0.7)).current
  const heroOpacity = useRef(new Animated.Value(0)).current
  const heroTranslateY = useRef(new Animated.Value(32)).current
  const heroScale = useRef(new Animated.Value(0.96)).current

  // Background fade animation values
  const scrollX = useRef(new Animated.Value(0)).current
  const bgStepFade = useRef(new Animated.Value(0)).current

  // Staggered field animations for login sheets
  const fieldAnim1 = useRef(new Animated.Value(0)).current
  const fieldAnim2 = useRef(new Animated.Value(0)).current
  const fieldAnim3 = useRef(new Animated.Value(0)).current
  const fieldAnim4 = useRef(new Animated.Value(0)).current

  // Sync background fade on step/page change
  useEffect(() => {
    if (step !== 'splash') {
      const isPartner = step === 'partner_login' || step === 'signup_owner'
      Animated.timing(bgStepFade, {
        toValue: isPartner ? 1 : 0,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start()
    } else {
      const targetX = splashPage * SCREEN_WIDTH
      scrollX.setValue(targetX)
    }
  }, [step, splashPage])

  // Trigger Sheet Slide-Up when switching to customer_login or partner_login
  useEffect(() => {
    if (step === 'customer_login' || step === 'partner_login') {
      sheetTranslateY.setValue(SCREEN_HEIGHT * 0.7)
      fieldAnim1.setValue(0)
      fieldAnim2.setValue(0)
      fieldAnim3.setValue(0)
      fieldAnim4.setValue(0)

      Animated.spring(sheetTranslateY, {
        toValue: 0,
        friction: 8,
        tension: 48,
        useNativeDriver: true
      }).start()

      // Stagger fields fade up
      Animated.stagger(60, [
        Animated.timing(fieldAnim1, { toValue: 1, duration: 280, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(fieldAnim2, { toValue: 1, duration: 280, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(fieldAnim3, { toValue: 1, duration: 280, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(fieldAnim4, { toValue: 1, duration: 280, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]).start()
    }
  }, [step])

  // Trigger Hero animation on splash
  useEffect(() => {
    if (step === 'splash') {
      heroOpacity.setValue(0)
      heroTranslateY.setValue(32)
      heroScale.setValue(0.96)

      Animated.parallel([
        Animated.timing(heroOpacity, {
          toValue: 1,
          duration: 450,
          delay: 100,
          useNativeDriver: true
        }),
        Animated.spring(heroTranslateY, {
          toValue: 0,
          friction: 7,
          tension: 40,
          delay: 100,
          useNativeDriver: true
        }),
        Animated.spring(heroScale, {
          toValue: 1,
          friction: 7,
          tension: 40,
          delay: 100,
          useNativeDriver: true
        })
      ]).start()
    }
  }, [step, splashPage])

  // OTP Cooldown
  useEffect(() => {
    if (step === 'verify' || step === 'verify_reset') {
      setResendCooldown(30)
    }
  }, [step])

  useEffect(() => {
    if (resendCooldown > 0 && (step === 'verify' || step === 'verify_reset')) {
      const timer = setTimeout(() => {
        setResendCooldown(prev => Math.max(0, prev - 1))
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown, step])

  // Hardware Back Button
  const lastBackPressRef = useRef<number>(0)
  useEffect(() => {
    if (Platform.OS === 'web') return

    const handleBackPress = () => {
      if (step === 'customer_login') {
        setStep('splash')
        setSplashPage(0)
        return true
      }
      if (step === 'partner_login') {
        setStep('splash')
        setSplashPage(1)
        return true
      }
      if (step === 'signup_student') {
        setStep('customer_login')
        return true
      }
      if (step === 'signup_owner') {
        setStep('splash')
        setSplashPage(1)
        return true
      }
      if (step === 'verify') {
        setStep(role === 'owner' ? 'signup_owner' : 'signup_student')
        return true
      }
      if (step === 'verify_reset') {
        setStep('customer_login')
        return true
      }

      const now = Date.now()
      if (now - lastBackPressRef.current < 2000) {
        return false
      } else {
        lastBackPressRef.current = now
        Alert.alert('Exit App', 'Press back again to exit the app.')
        return true
      }
    }

    const sub = BackHandler.addEventListener('hardwareBackPress', handleBackPress)
    return () => sub.remove()
  }, [step, role])

  // Splash Paging Scroll Handler
  const handleSplashScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x
    const pageIndex = Math.round(offsetX / SCREEN_WIDTH)
    if (pageIndex !== splashPage && (pageIndex === 0 || pageIndex === 1)) {
      setSplashPage(pageIndex)
    }
  }

  const scrollToSplashPage = (page: 0 | 1) => {
    setSplashPage(page)
    splashScrollRef.current?.scrollTo({ x: page * SCREEN_WIDTH, animated: true })
  }

  // Category Toggle
  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(prev => prev.filter(c => c !== cat))
    } else {
      setSelectedCategories(prev => [...prev, cat])
    }
  }

  // Validation Checkers
  const emailDomain = email.includes('@') ? email.split('@')[1].toLowerCase() : ''
  const isEmailWhitelisted = ALLOWED_DOMAINS.includes(emailDomain)
  const passwordMatch = password.length >= 6 && password === confirmPassword

  const isStudentValid =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    phone.trim().length === 10 &&
    isEmailWhitelisted &&
    passwordMatch &&
    termsAccepted

  const effectiveCategory = selectedCategories
    .map(c => (c === 'Others' ? customCategory.trim() : c))
    .filter(c => c.length > 0)
    .join(', ')

  const isOwnerValid =
    shopName.trim().length > 0 &&
    ownerFullName.trim().length > 0 &&
    phone.trim().length === 10 &&
    email.includes('@') &&
    effectiveCategory.length > 0 &&
    passwordMatch

  // Auth Submit Handlers
  const completeAuth = (userData: any) => {
    if (typeof onDone === 'function') {
      onDone(userData)
    } else if (typeof onRegister === 'function') {
      onRegister(userData)
    }
  }

  const handleStudentSubmit = async () => {
    if (!isStudentValid) return
    setRole('customer')
    const userEmail = email.trim()
    setIsSubmitting(true)

    try {
      await supabase.auth.signOut()
      await clearAllUserCache()
    } catch (_) {}

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .ilike('email', userEmail)
      .maybeSingle()

    if (existingProfile) {
      setIsSubmitting(false)
      Alert.alert(
        'Email Already Registered',
        'This email is already registered. Please log in instead.',
        [
          {
            text: 'Log In Now',
            onPress: () => {
              setEmail(userEmail)
              setStep('customer_login')
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      )
      return
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userEmail,
        password: password
      })

      const isAlreadyRegistered =
        authError?.message?.toLowerCase().includes('already registered') ||
        authError?.message?.toLowerCase().includes('already exists') ||
        (authData?.user && authData?.user?.identities && authData.user.identities.length === 0)

      if (isAlreadyRegistered) {
        setIsSubmitting(false)
        Alert.alert(
          'Email Already Registered',
          'This email is already registered. Please log in instead.',
          [
            {
              text: 'Log In Now',
              onPress: () => {
                setEmail(userEmail)
                setStep('customer_login')
              }
            },
            { text: 'Cancel', style: 'cancel' }
          ]
        )
        return
      }

      await supabase.auth.resend({
        type: 'signup',
        email: userEmail
      })
    } catch (e) {
      console.warn('[SignupScreen] signUp error:', e)
    }

    setOtpCode('')
    setStep('verify')
    setIsSubmitting(false)
    Alert.alert('Verification Code Sent 📧', `A 6-digit verification code has been sent to ${userEmail}. Please check your email.`)
  }

  const handleOwnerSubmit = async () => {
    if (!isOwnerValid) return
    setRole('owner')
    const userEmail = email.trim()
    setIsSubmitting(true)

    try {
      await supabase.auth.signOut()
      await clearAllUserCache()
    } catch (_) {}

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .ilike('email', userEmail)
      .maybeSingle()

    if (existingProfile) {
      setIsSubmitting(false)
      Alert.alert(
        'Email Already Registered',
        'This email is already registered. Please log in instead.',
        [
          {
            text: 'Log In Now',
            onPress: () => {
              setEmail(userEmail)
              setStep('partner_login')
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      )
      return
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userEmail,
        password: password
      })

      const isAlreadyRegistered =
        authError?.message?.toLowerCase().includes('already registered') ||
        authError?.message?.toLowerCase().includes('already exists') ||
        (authData?.user && authData?.user?.identities && authData.user.identities.length === 0)

      if (isAlreadyRegistered) {
        setIsSubmitting(false)
        Alert.alert(
          'Email Already Registered',
          'This email is already registered. Please log in instead.',
          [
            {
              text: 'Log In Now',
              onPress: () => {
                setEmail(userEmail)
                setStep('partner_login')
              }
            },
            { text: 'Cancel', style: 'cancel' }
          ]
        )
        return
      }

      await supabase.auth.resend({
        type: 'signup',
        email: userEmail
      })
    } catch (e) {
      console.warn('[SignupScreen] owner signUp error:', e)
    }

    setOtpCode('')
    setStep('verify')
    setIsSubmitting(false)
    Alert.alert('Verification Code Sent 📧', `A 6-digit verification code has been sent to ${userEmail}. Please check your email.`)
  }

  const handleLoginSubmit = async (targetRole: 'customer' | 'owner') => {
    const cleanEmail = email.trim()
    if (!cleanEmail || !password) {
      Alert.alert('Validation Error', 'Please enter your email address and password.')
      return
    }

    setIsSubmitting(true)

    try {
      await supabase.auth.signOut()
      await clearAllUserCache()
    } catch (_) {}

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: password
    })

    let authUser = authData?.user

    if (!authUser && authError) {
      setIsSubmitting(false)
      Alert.alert('Login Failed', authError.message || 'Incorrect email or password. Please try again.')
      return
    }

    let profile: any = null
    const { data: pList } = await supabase
      .from('profiles')
      .select('*')
      .ilike('email', cleanEmail.trim())
      .order('created_at', { ascending: false })

    if (pList && pList.length > 0) {
      profile = pList.find((p: any) => p.full_name && p.phone_number) || pList[0]
    }

    if (!profile && authUser?.id) {
      const { data: pById } = await supabase
        .from('profiles')
        .select('*')
        .or(`id.eq.${authUser.id},user_id.eq.${authUser.id}`)
        .maybeSingle()
      profile = pById
    }

    const { data: shop } = await supabase
      .from('shops')
      .select('*')
      .or(`owner_id.eq.${profile?.id || ''},owner_id.eq.${authUser?.id || ''}`)
      .maybeSingle()

    const { data: worker } = await supabase
      .from('shop_workers')
      .select('*')
      .or(`user_id.eq.${profile?.id || ''},user_id.eq.${authUser?.id || ''}`)
      .maybeSingle()

    const isShopPartner = shop !== null || worker !== null || profile?.role === 'shop_owner' || profile?.role === 'worker'

    setIsSubmitting(false)

    if (targetRole === 'customer' && isShopPartner) {
      Alert.alert(
        'Partner Account Detected 🏪',
        'This email belongs to a registered Shop Partner. Please use the Partner Log In screen.',
        [
          {
            text: 'Go to Partner Log In',
            onPress: () => {
              setRole('owner')
              setStep('partner_login')
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      )
      await supabase.auth.signOut()
      return
    }

    if (targetRole === 'owner' && !isShopPartner) {
      Alert.alert(
        'Customer Account Detected 👤',
        'This email belongs to a Customer account. Please use the Customer Log In screen.',
        [
          {
            text: 'Go to Customer Log In',
            onPress: () => {
              setRole('customer')
              setStep('customer_login')
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      )
      await supabase.auth.signOut()
      return
    }

    const userId = authUser?.id || profile?.id || profile?.user_id
    const determinedRole = isShopPartner ? 'shop_owner' : (profile?.role || 'customer')
    const realFullName = profile?.full_name || ''
    const displayName = realFullName || (shop ? shop.name : undefined) || cleanEmail.split('@')[0]
    const displayPhone = profile?.phone_number || ''

    completeAuth({
      id: userId,
      role: determinedRole,
      name: displayName,
      full_name: realFullName || displayName,
      email: cleanEmail,
      phone_number: displayPhone,
      shop_id: shop?.id || undefined,
      shop_name: shop?.name || undefined
    })
  }

  const handleForgotPassword = async (emailAddr: string) => {
    const cleanEmail = emailAddr.trim()
    if (!cleanEmail) {
      Alert.alert('Enter Email', 'Please enter your registered email address first.')
      return
    }
    setIsSubmitting(true)
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail)
    setIsSubmitting(false)

    if (error) {
      Alert.alert('Reset Password Error', error.message || 'Could not send OTP code. Please check your email.')
    } else {
      setOtpCode('')
      setNewResetPassword('')
      setEmail(cleanEmail)
      setStep('verify_reset')
      Alert.alert(
        '🔑 OTP Reset Code Sent',
        `A 6-digit OTP code has been sent to ${cleanEmail}. Please enter the OTP code and your new password below.`
      )
    }
  }

  const handleResendOtp = async () => {
    const cleanEmail = email.trim()
    if (!cleanEmail) {
      Alert.alert('Enter Email', 'Please enter your registered email address first.')
      return
    }
    if (resendCooldown > 0 || isResendingOtp) return

    setIsResendingOtp(true)
    try {
      if (step === 'verify_reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail)
        if (error) {
          Alert.alert('Unable to Resend', 'Could not send verification code. Please check your email address.')
        } else {
          setResendCooldown(30)
          Alert.alert('Code Resent 📧', `A fresh 6-digit OTP code has been sent to ${cleanEmail}.`)
        }
      } else {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: cleanEmail
        })
        if (error) {
          await supabase.auth.signInWithOtp({ email: cleanEmail })
        }
        setResendCooldown(30)
        Alert.alert('Code Resent 📧', `A fresh 6-digit OTP code has been sent to ${cleanEmail}.`)
      }
    } catch (e) {
      setResendCooldown(30)
      Alert.alert('Notice', `A fresh verification code was requested for ${cleanEmail}.`)
    } finally {
      setIsResendingOtp(false)
    }
  }

  const handleVerificationComplete = async () => {
    setIsSubmitting(true)
    const determinedRole = role === 'owner' ? 'shop_owner' : 'customer'
    const userEmail = email.trim()
    const token = otpCode.trim()

    let userId: string | null = null

    if (token && token.length >= 4) {
      try {
        const { data: verifyData, error: otpErr } = await supabase.auth.verifyOtp({
          email: userEmail,
          token: token,
          type: 'signup'
        })
        if (verifyData?.user?.id) {
          userId = verifyData.user.id
        } else if (otpErr) {
          const { data: verifyData2 } = await supabase.auth.verifyOtp({
            email: userEmail,
            token: token,
            type: 'email'
          })
          if (verifyData2?.user?.id) {
            userId = verifyData2.user.id
          }
        }
      } catch (e) {
        console.warn('[SignupScreen] OTP verification catch:', e)
      }
    }

    if (!userId) {
      try {
        const { data: userData } = await supabase.auth.getUser()
        if (userData?.user?.id) {
          userId = userData.user.id
        }
      } catch (_) {}
    }

    if (!userId && password) {
      try {
        const { data: loginData } = await supabase.auth.signInWithPassword({
          email: userEmail,
          password: password
        })
        if (loginData?.user?.id) {
          userId = loginData.user.id
        }
      } catch (e) {
        console.warn('[SignupScreen] signIn catch:', e)
      }
    }

    try {
      const effectiveShopName = shopName.trim() || 'My Shop'
      const effectiveOwnerName = ownerFullName.trim() || name.trim() || (userEmail ? userEmail.split('@')[0] : 'Store Owner')
      const realPhoneNumber = phone.trim()
      let newShopId = undefined
      let finalRole = determinedRole

      if (determinedRole === 'shop_owner') {
        const { data: regData, error: regErr } = await supabase.rpc('register_partner_shop', {
          p_shop_name: effectiveShopName,
          p_category: effectiveCategory || 'Others',
          p_full_name: effectiveOwnerName,
          p_phone: realPhoneNumber,
          p_owner_id: userId
        })

        if (regErr) {
          console.warn('[SignupScreen] register_partner_shop catch:', regErr.message)
        } else if (regData?.shop_id) {
          newShopId = regData.shop_id
          finalRole = 'shop_owner'
        }
      } else if (userId) {
        const { error: profErr } = await supabase.from('profiles').upsert([{
          id: userId,
          user_id: userId,
          email: userEmail,
          full_name: name.trim() || userEmail.split('@')[0],
          phone_number: realPhoneNumber,
          role: 'customer'
        }], { onConflict: 'id' })

        if (profErr) {
          console.warn('[SignupScreen] Profile upsert notice:', profErr.message)
        }
      }

      setIsSubmitting(false)

      completeAuth({
        id: userId,
        role: finalRole,
        name: determinedRole === 'shop_owner' ? effectiveOwnerName : (name.trim() || userEmail.split('@')[0]),
        full_name: determinedRole === 'shop_owner' ? effectiveOwnerName : (name.trim() || userEmail.split('@')[0]),
        email: userEmail,
        phone_number: realPhoneNumber,
        shop_id: newShopId,
        shop_name: determinedRole === 'shop_owner' ? effectiveShopName : undefined
      })
    } catch (err) {
      setIsSubmitting(false)
      const fallbackOwnerName = ownerFullName.trim() || name.trim() || (userEmail ? userEmail.split('@')[0] : 'Store Owner')
      completeAuth({
        id: userId,
        role: determinedRole,
        name: determinedRole === 'shop_owner' ? fallbackOwnerName : (name.trim() || userEmail.split('@')[0]),
        full_name: determinedRole === 'shop_owner' ? fallbackOwnerName : (name.trim() || userEmail.split('@')[0]),
        email: userEmail,
        phone_number: phone.trim(),
        shop_name: determinedRole === 'shop_owner' ? (shopName.trim() || 'My Shop') : undefined
      })
    }
  }

  const handleResetPasswordComplete = async () => {
    const cleanEmail = email.trim()
    if (!otpCode.trim()) {
      Alert.alert('Validation Error', 'Please enter the 6-digit OTP code sent to your email.')
      return
    }
    if (!newResetPassword || newResetPassword.length < 6) {
      Alert.alert('Validation Error', 'Please enter a new password with at least 6 characters.')
      return
    }

    setIsSubmitting(true)

    const { error } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: otpCode.trim(),
      type: 'recovery'
    })

    if (error) {
      const { error: err2 } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: otpCode.trim(),
        type: 'email'
      })
      if (err2) {
        setIsSubmitting(false)
        Alert.alert('Incorrect Code', 'The verification code you entered is invalid. Please check the 6-digit code or tap Resend OTP.')
        return
      }
    }

    if (password && newResetPassword === password) {
      setIsSubmitting(false)
      Alert.alert('Invalid New Password', 'Your new password cannot be the same as your current password.')
      return
    }

    const { error: updateErr } = await supabase.auth.updateUser({
      password: newResetPassword
    })

    setIsSubmitting(false)

    if (updateErr) {
      Alert.alert('Password Reset Error', updateErr.message)
    } else {
      Alert.alert('🎉 Password Reset Successful!', 'Your password has been updated. Please log in with your new password.')
      setPassword(newResetPassword)
      setStep('customer_login')
    }
  }

  // Compute Partner background opacity for cross-fade animation
  const isSplash = step === 'splash'
  const partnerOpacity = isSplash
    ? scrollX.interpolate({
        inputRange: [0, SCREEN_WIDTH],
        outputRange: [0, 1],
        extrapolate: 'clamp'
      })
    : bgStepFade

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER UI SCREENS
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <View style={tw`flex-1 bg-black`}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── PERSISTENT CROSS-FADING BACKGROUND IMAGE LAYERS ── */}
      {/* 1. Customer Photo Layer (Base) */}
      <View style={StyleSheet.absoluteFillObject}>
        <ImageBackground
          source={{ uri: PHOTO.delivery1 }}
          defaultSource={require('../assets/customer_login_bg.jpg')}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
      </View>

      {/* 2. Partner Photo Layer (Cross-fades over Base) */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: partnerOpacity }]}>
        <ImageBackground
          source={{ uri: PHOTO.delivery2 }}
          defaultSource={require('../assets/shop_login_bg.jpg')}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
      </Animated.View>

      {/* ═══════════════════════════════════════════════════════════════════════
          SCREEN 1: SPLASH (Swipeable 2 Slides)
          ═══════════════════════════════════════════════════════════════════════ */}
      {step === 'splash' && (
        <View style={StyleSheet.absoluteFillObject}>
          {/* Gradient Overlay — strong at bottom for text */}
          <LinearGradient
            colors={[
              'rgba(0, 0, 0, 0.15)',
              'rgba(0, 0, 0, 0.05)',
              'rgba(0, 0, 0, 0.55)',
              'rgba(0, 0, 0, 0.88)'
            ]}
            locations={[0, 0.30, 0.60, 1]}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />

          <Animated.ScrollView
            ref={splashScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false, listener: handleSplashScroll }
            )}
            scrollEventThrottle={16}
            contentOffset={{ x: splashPage * SCREEN_WIDTH, y: 0 }}
            style={tw`flex-1`}
          >
            {/* ── Slide 1: Customer (CAMPUS DELIVERY) ── */}
            <View style={[tw`flex-1 justify-end px-7`, { width: SCREEN_WIDTH, paddingBottom: 44 }]}>
              {/* Hero Animated Headline & Tag (position bottom: 175) */}
              <Animated.View
                style={[
                  tw`w-full`,
                  {
                    marginBottom: 20,
                    opacity: heroOpacity,
                    transform: [{ translateY: heroTranslateY }, { scale: heroScale }]
                  }
                ]}
              >
                {/* Tag */}
                <Text style={[{ fontSize: 11, fontWeight: '700', color: '#4ade80', letterSpacing: 2.2, marginBottom: 14 }]}>
                  CAMPUS DELIVERY
                </Text>

                {/* Hero Stacked Headline */}
                <View style={tw`mb-4`}>
                  <Text style={[{ fontSize: 56, fontWeight: '900', color: '#ffffff', lineHeight: 53, letterSpacing: -1 }]}>
                    ORDER.
                  </Text>
                  <Text style={[{ fontSize: 56, fontWeight: '900', color: '#ffffff', lineHeight: 53, letterSpacing: -1 }]}>
                    TRACK.
                  </Text>
                  <Text style={[{ fontSize: 56, fontWeight: '900', color: '#ffffff', lineHeight: 53, letterSpacing: -1 }]}>
                    COLLECT.
                  </Text>
                </View>

                {/* Subtitle */}
                <Text style={[{ fontSize: 14, color: 'rgba(255, 255, 255, 0.65)', lineHeight: 22, maxWidth: 280 }]}>
                  Get anything from shops delivered to your campus in minutes.
                </Text>
              </Animated.View>

              {/* Controls */}
              <View style={tw`w-full gap-2.5`}>
                {/* Dot Indicators */}
                <View style={tw`flex-row items-center gap-1.5 mb-3`}>
                  <View style={tw`h-[6px] w-[20px] rounded-full bg-white`} />
                  <TouchableOpacity onPress={() => scrollToSplashPage(1)} activeOpacity={0.7}>
                    <View style={tw`h-[6px] w-[6px] rounded-full bg-white/40`} />
                  </TouchableOpacity>
                </View>

                {/* Green Pill Continue Button (btn-green) */}
                <AnimatedScaleButton
                  onPress={() => {
                    setRole('customer')
                    setStep('customer_login')
                  }}
                  style={[
                    tw`w-full h-[52px] bg-[#16a34a] rounded-full items-center justify-center flex-row gap-2`,
                    {
                      shadowColor: '#16a34a',
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.35,
                      shadowRadius: 16,
                      elevation: 6
                    }
                  ]}
                >
                  <Text style={tw`text-white font-bold text-[16px]`}>Continue</Text>
                  <Ic.Arrow color="#ffffff" size={18} />
                </AnimatedScaleButton>

                {/* Ghost text link */}
                <TouchableOpacity
                  onPress={() => scrollToSplashPage(1)}
                  activeOpacity={0.7}
                  style={tw`items-center py-2`}
                >
                  <Text style={[{ fontSize: 13, color: 'rgba(255, 255, 255, 0.55)' }]}>
                    Shop Owner?{' '}
                    <Text style={[{ color: '#4ade80', fontWeight: '700' }]}>
                      Partner Portal →
                    </Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Slide 2: Partner (PARTNER PORTAL) ── */}
            <View style={[tw`flex-1 justify-end px-7`, { width: SCREEN_WIDTH, paddingBottom: 44 }]}>
              {/* Hero Animated Headline & Tag (position bottom: 230 equivalent) */}
              <Animated.View
                style={[
                  tw`w-full`,
                  {
                    marginBottom: 20,
                    opacity: heroOpacity,
                    transform: [{ translateY: heroTranslateY }, { scale: heroScale }]
                  }
                ]}
              >
                {/* Tag */}
                <Text style={[{ fontSize: 11, fontWeight: '700', color: '#4ade80', letterSpacing: 2.2, marginBottom: 14 }]}>
                  PARTNER PORTAL
                </Text>

                {/* Hero Stacked Headline */}
                <View style={tw`mb-2`}>
                  <Text style={[{ fontSize: 56, fontWeight: '900', color: '#ffffff', lineHeight: 53, letterSpacing: -1 }]}>
                    GROW.
                  </Text>
                  <Text style={[{ fontSize: 56, fontWeight: '900', color: '#ffffff', lineHeight: 53, letterSpacing: -1 }]}>
                    PARTNER.
                  </Text>
                  <Text style={[{ fontSize: 56, fontWeight: '900', color: '#ffffff', lineHeight: 53, letterSpacing: -1 }]}>
                    EARN.
                  </Text>
                </View>
              </Animated.View>

              {/* Controls */}
              <View style={tw`w-full gap-2.5`}>
                {/* Dot Indicators */}
                <View style={tw`flex-row items-center gap-1.5 mb-2`}>
                  <TouchableOpacity onPress={() => scrollToSplashPage(0)} activeOpacity={0.7}>
                    <View style={tw`h-[6px] w-[6px] rounded-full bg-white/40`} />
                  </TouchableOpacity>
                  <View style={tw`h-[6px] w-[20px] rounded-full bg-white`} />
                </View>

                {/* Solid White Button: Register Shop (btn-white-solid) */}
                <AnimatedScaleButton
                  onPress={() => {
                    setRole('owner')
                    setStep('signup_owner')
                  }}
                  style={[
                    tw`w-full h-[48px] bg-white rounded-full items-center justify-center flex-row gap-2.5`,
                    {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.12,
                      shadowRadius: 12,
                      elevation: 4
                    }
                  ]}
                >
                  <Ic.Store size={18} color="#111111" />
                  <Text style={[{ fontSize: 14.5, fontWeight: '700', color: '#111111' }]}>
                    Register Your Shop
                  </Text>
                </AnimatedScaleButton>

                {/* Outline White Button: Partner Log In (btn-white-outline) */}
                <AnimatedScaleButton
                  onPress={() => {
                    setRole('owner')
                    setStep('partner_login')
                  }}
                  style={[
                    tw`w-full h-[48px] rounded-full items-center justify-center flex-row gap-2.5`,
                    {
                      borderWidth: 1.5,
                      borderColor: 'rgba(255, 255, 255, 0.55)',
                      backgroundColor: 'rgba(255, 255, 255, 0.12)'
                    }
                  ]}
                >
                  <Ic.Mail size={18} color="#ffffff" />
                  <Text style={tw`text-white font-bold text-[14.5px]`}>
                    Partner Log In
                  </Text>
                </AnimatedScaleButton>

                {/* Ghost text link */}
                <TouchableOpacity
                  onPress={() => scrollToSplashPage(0)}
                  activeOpacity={0.7}
                  style={tw`items-center py-2`}
                >
                  <Text style={[{ fontSize: 13, color: 'rgba(255, 255, 255, 0.55)' }]}>
                    Customer?{' '}
                    <Text style={[{ color: '#4ade80', fontWeight: '700' }]}>
                      Customer Portal →
                    </Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.ScrollView>
        </View>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SCREEN 2: CUSTOMER LOGIN (Bottom Sheet over photo)
          ═══════════════════════════════════════════════════════════════════════ */}
      {step === 'customer_login' && (
        <View style={tw`flex-1`}>
          {/* Top section taking ~35% */}
          <View style={[tw`justify-between px-5`, { height: SCREEN_HEIGHT * 0.35, paddingTop: STATUS_BAR_HEIGHT + 12 }]}>
            <TouchableOpacity
              onPress={() => {
                setStep('splash')
                setSplashPage(0)
              }}
              activeOpacity={0.8}
              style={[
                tw`w-9 h-9 rounded-full items-center justify-center`,
                { backgroundColor: 'rgba(0, 0, 0, 0.30)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.20)' }
              ]}
            >
              <Ic.Back size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* White Bottom Sheet */}
          <Animated.View
            style={[
              tw`flex-1 bg-white rounded-t-[28px] px-6 pt-3 pb-10`,
              {
                transform: [{ translateY: sheetTranslateY }],
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -6 },
                shadowOpacity: 0.12,
                shadowRadius: 18,
                elevation: 12
              }
            ]}
          >
            <View style={{ position: 'absolute', bottom: -500, left: 0, right: 0, height: 500, backgroundColor: 'white' }} />
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={tw`flex-1 justify-between`}
            >
              <ScrollView showsVerticalScrollIndicator={false} bounces={false} keyboardShouldPersistTaps="handled">
                {/* Sheet Handle */}
                <View style={[tw`self-center mb-4`, { width: 36, height: 4, borderRadius: 2, backgroundColor: '#e0e0e0' }]} />

                {/* Logo & Welcome Header */}
                <Animated.View style={[{ opacity: fieldAnim1, transform: [{ translateY: fieldAnim1.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}>
                  <VaayuBrandLogo size={28} />
                  <Text style={[{ fontSize: 20, fontWeight: '800', color: '#111111', marginTop: 4 }]}>
                    Welcome Back!
                  </Text>
                  <Text style={[{ fontSize: 13, color: '#888888', marginTop: 2, marginBottom: 16, lineHeight: 18 }]}>
                    Log in to order from your favourite campus shops.
                  </Text>
                </Animated.View>

                {/* Form Fields */}
                <Animated.View style={[{ opacity: fieldAnim2, transform: [{ translateY: fieldAnim2.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}>
                  <FormInputField
                    label="Username"
                    placeholder="your@iiitt.ac.in"
                    value={email}
                    onChange={setEmail}
                    type="email-address"
                  />

                  <FormInputField
                    label="Password"
                    placeholder="••••••••"
                    value={password}
                    onChange={setPassword}
                    secure={!showPassword}
                    rightElement={
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={tw`p-1.5`}
                      >
                        {showPassword ? <Ic.Eye color="#111111" size={18} /> : <Ic.EyeOff color="#888888" size={18} />}
                      </TouchableOpacity>
                    }
                  />

                  {/* Forgot Password */}
                  <TouchableOpacity
                    onPress={() => handleForgotPassword(email)}
                    style={tw`self-end mb-3 -mt-1`}
                  >
                    <Text style={[{ fontSize: 12.5, fontWeight: '600', color: '#16a34a' }]}>
                      Forgot Password?
                    </Text>
                  </TouchableOpacity>
                </Animated.View>

                {/* Login Button (btn-green) */}
                <Animated.View style={[{ opacity: fieldAnim3, transform: [{ translateY: fieldAnim3.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}>
                  <AnimatedScaleButton
                    onPress={() => handleLoginSubmit('customer')}
                    disabled={isSubmitting}
                    style={[
                      tw`w-full h-[50px] bg-[#16a34a] rounded-full items-center justify-center flex-row gap-2`,
                      {
                        shadowColor: '#16a34a',
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.30,
                        shadowRadius: 14,
                        elevation: 5
                      }
                    ]}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={tw`text-white font-bold text-[16px]`}>Login</Text>
                    )}
                  </AnimatedScaleButton>
                </Animated.View>
              </ScrollView>

              {/* Bottom Register Link */}
              <Animated.View
                style={[
                  tw`flex-row justify-center items-center pt-3 pb-4`,
                  { opacity: fieldAnim4 }
                ]}
              >
                <Text style={[{ fontSize: 13, color: '#888888' }]}>
                  Don't have an account?{' '}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setRole('customer')
                    setStep('signup_student')
                  }}
                >
                  <Text style={[{ fontSize: 13, fontWeight: '700', color: '#16a34a' }]}>
                    Register here
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </KeyboardAvoidingView>
          </Animated.View>
        </View>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SCREEN 3: STUDENT REGISTRATION (Full White Screen)
          ═══════════════════════════════════════════════════════════════════════ */}
      {step === 'signup_student' && (
        <View style={[tw`flex-1 bg-white`, { paddingTop: STATUS_BAR_HEIGHT }]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={tw`flex-1`}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[tw`px-6 pt-3`, { paddingBottom: 60 }]}
            >
              {/* Header Row with Grey Circle Back Button */}
              <View style={tw`flex-row items-center gap-3.5 mb-2`}>
                <TouchableOpacity
                  onPress={() => setStep('customer_login')}
                  activeOpacity={0.8}
                  style={tw`w-9 h-9 rounded-full bg-[#f4f4f4] items-center justify-center`}
                >
                  <Ic.Back size={20} color="#111111" />
                </TouchableOpacity>
                <View style={tw`flex-1`}>
                  <Text style={[{ fontSize: 10, fontWeight: '700', color: '#16a34a', letterSpacing: 1.2 }]}>
                    CAMPUS DELIVERY
                  </Text>
                  <Text style={[{ fontSize: 22, fontWeight: '900', color: '#0d2137', lineHeight: 26 }]}>
                    Student Registration
                  </Text>
                </View>
              </View>

              {/* Subtitle */}
              <Text style={[{ fontSize: 12.5, color: '#999999', marginBottom: 16, lineHeight: 18 }]}>
                Use your official IIITT email (e.g. 251420@iiitt.ac.in) to join.
              </Text>

              {/* Form Fields */}
              <FormInputField
                label="Full Name"
                placeholder="e.g. Aditya Sharma"
                value={name}
                onChange={setName}
                autoCapitalize="words"
              />

              <FormInputField
                label="College Email"
                placeholder="e.g. 251420@iiitt.ac.in"
                value={email}
                onChange={setEmail}
                type="email-address"
                error={
                  email.trim().length > 0 && !isEmailWhitelisted
                    ? 'Only @iiitt.ac.in college emails are allowed.'
                    : undefined
                }
              />

              <FormInputField
                label="Phone Number"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={text => setPhone(text.replace(/[^0-9]/g, '').slice(0, 10))}
                type="phone-pad"
                error={
                  phone.length > 0 && phone.length !== 10
                    ? 'Please enter a valid 10-digit mobile number.'
                    : undefined
                }
              />

              <FormInputField
                label="Password"
                placeholder="Min 6 characters"
                value={password}
                onChange={setPassword}
                secure={!showPassword}
                rightElement={
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={tw`p-1.5`}
                  >
                    {showPassword ? <Ic.Eye color="#111111" size={18} /> : <Ic.EyeOff color="#888888" size={18} />}
                  </TouchableOpacity>
                }
              />

              <FormInputField
                label="Confirm Password"
                placeholder="Retype password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                secure={!showPassword}
                error={
                  confirmPassword.length > 0 && password !== confirmPassword
                    ? 'Passwords do not match.'
                    : undefined
                }
              />

              {/* T&C Checkbox */}
              <View style={tw`flex-row items-start my-3`}>
                <CustomCheckbox
                  checked={termsAccepted}
                  onToggle={() => setTermsAccepted(!termsAccepted)}
                />
                <View style={tw`flex-1 flex-row flex-wrap items-center pt-0.5`}>
                  <Text style={[{ fontSize: 12, color: '#777777', lineHeight: 18 }]}>
                    I agree with the{' '}
                  </Text>
                  <TouchableOpacity onPress={() => Alert.alert('Terms & Conditions', 'By creating an account you agree to Vaayu campus hyper-local delivery policies.')}>
                    <Text style={[{ fontSize: 12, fontWeight: '700', color: '#16a34a' }]}>
                      Terms & Conditions
                    </Text>
                  </TouchableOpacity>
                  <Text style={[{ fontSize: 12, color: '#777777' }]}> and </Text>
                  <TouchableOpacity onPress={() => Alert.alert('Privacy Policy', 'Your student email and contact information are used exclusively for campus order fulfillment.')}>
                    <Text style={[{ fontSize: 12, fontWeight: '700', color: '#16a34a' }]}>
                      Privacy Policy
                    </Text>
                  </TouchableOpacity>
                  <Text style={[{ fontSize: 12, color: '#777777' }]}>.</Text>
                </View>
              </View>

              {/* Proceed Button (btn-green) */}
              <AnimatedScaleButton
                onPress={handleStudentSubmit}
                disabled={!isStudentValid || isSubmitting}
                style={[
                  tw`w-full h-[52px] bg-[#16a34a] rounded-full items-center justify-center flex-row gap-2 mt-2 mb-3`,
                  {
                    opacity: isStudentValid && !isSubmitting ? 1 : 0.5,
                    shadowColor: '#16a34a',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.28,
                    shadowRadius: 12,
                    elevation: 4
                  }
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Text style={tw`text-white font-bold text-[15.5px]`}>
                      Proceed to Verification
                    </Text>
                    <Ic.Arrow color="#ffffff" size={18} />
                  </>
                )}
              </AnimatedScaleButton>

              {/* Log In Link */}
              <View style={tw`flex-row justify-center items-center py-2`}>
                <Text style={[{ fontSize: 12.5, color: '#888888' }]}>
                  Have an account?{' '}
                </Text>
                <TouchableOpacity onPress={() => setStep('customer_login')}>
                  <Text style={[{ fontSize: 12.5, fontWeight: '700', color: '#16a34a' }]}>
                    Log In
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SCREEN 4: SHOP REGISTRATION (Full White Screen)
          ═══════════════════════════════════════════════════════════════════════ */}
      {step === 'signup_owner' && (
        <View style={[tw`flex-1 bg-white`, { paddingTop: STATUS_BAR_HEIGHT }]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={tw`flex-1`}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[tw`px-6 pt-3`, { paddingBottom: 56 }]}
            >
              {/* Header Row */}
              <View style={tw`flex-row items-center gap-3 mb-2`}>
                <TouchableOpacity
                  onPress={() => {
                    setStep('splash')
                    setSplashPage(1)
                  }}
                  activeOpacity={0.8}
                  style={tw`w-8 h-8 rounded-full bg-[#f4f4f4] items-center justify-center`}
                >
                  <Ic.Back size={18} color="#111111" />
                </TouchableOpacity>
                <View style={tw`flex-1`}>
                  <Text style={[{ fontSize: 9, fontWeight: '700', color: '#16a34a', letterSpacing: 1.2 }]}>
                    PARTNER PROGRAM
                  </Text>
                  <Text style={[{ fontSize: 18, fontWeight: '900', color: '#0d2137', lineHeight: 22 }]}>
                    Register Your Shop
                  </Text>
                </View>
              </View>

              {/* Subtitle */}
              <Text style={[{ fontSize: 11.5, color: '#999999', marginBottom: 10, lineHeight: 16 }]}>
                Deliver directly to hostel & campus customers.
              </Text>

              {/* Fields */}
              <FormInputField
                label="Shop Name"
                placeholder="e.g. Nescafe, Campus Bites"
                value={shopName}
                onChange={setShopName}
                autoCapitalize="words"
              />

              <FormInputField
                label="Owner Full Name"
                placeholder="e.g. Rahul Sharma"
                value={ownerFullName}
                onChange={setOwnerFullName}
                autoCapitalize="words"
              />

              <FormInputField
                label="Owner Phone Number"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={text => setPhone(text.replace(/[^0-9]/g, '').slice(0, 10))}
                type="phone-pad"
                error={
                  phone.length > 0 && phone.length !== 10
                    ? 'Please enter a valid 10-digit phone number.'
                    : undefined
                }
              />

              <FormInputField
                label="Contact Email"
                placeholder="e.g. owner@email.com"
                value={email}
                onChange={setEmail}
                type="email-address"
              />

              {/* Category Chips Multi-Select */}
              <View style={tw`mb-3`}>
                <Text style={[{ fontSize: 11.5, fontWeight: '600', color: '#333333', marginBottom: 6 }]}>
                  Shop Categories
                </Text>
                <View style={tw`flex-row flex-wrap gap-2`}>
                  {APP_CATEGORIES.map(cat => {
                    const isSelected = selectedCategories.includes(cat)
                    return (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => toggleCategory(cat)}
                        activeOpacity={0.8}
                        style={[
                          tw`px-4 py-1.5 rounded-full flex-row items-center gap-1.5`,
                          {
                            backgroundColor: isSelected ? '#16a34a' : '#fafafa',
                            borderColor: isSelected ? '#16a34a' : '#e0e0e0',
                            borderWidth: 1.5,
                            transform: [{ scale: isSelected ? 1.04 : 1 }]
                          }
                        ]}
                      >
                        {isSelected && <Ic.Check size={11} color="#ffffff" />}
                        <Text
                          style={[
                            tw`text-[13px] font-bold`,
                            { color: isSelected ? '#ffffff' : '#333333' }
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>

                {selectedCategories.includes('Others') && (
                  <View style={tw`mt-2.5`}>
                    <FormInputField
                      placeholder="Enter custom category name"
                      value={customCategory}
                      onChange={setCustomCategory}
                    />
                  </View>
                )}
              </View>

              <FormInputField
                label="Password"
                placeholder="Min 6 characters"
                value={password}
                onChange={setPassword}
                secure={!showPassword}
                rightElement={
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={tw`p-1.5`}
                  >
                    {showPassword ? <Ic.Eye color="#111111" size={18} /> : <Ic.EyeOff color="#888888" size={18} />}
                  </TouchableOpacity>
                }
              />

              <FormInputField
                label="Confirm Password"
                placeholder="Retype password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                secure={!showPassword}
                error={
                  confirmPassword.length > 0 && password !== confirmPassword
                    ? 'Passwords do not match.'
                    : undefined
                }
              />

              {/* Proceed Button (btn-green) */}
              <AnimatedScaleButton
                onPress={handleOwnerSubmit}
                disabled={!isOwnerValid || isSubmitting}
                style={[
                  tw`w-full h-[50px] bg-[#16a34a] rounded-full items-center justify-center flex-row gap-2 mt-2 mb-3`,
                  {
                    opacity: isOwnerValid && !isSubmitting ? 1 : 0.5,
                    shadowColor: '#16a34a',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.28,
                    shadowRadius: 12,
                    elevation: 4
                  }
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Text style={tw`text-white font-bold text-[15.5px]`}>
                      Proceed to Verification
                    </Text>
                    <Ic.Arrow color="#ffffff" size={18} />
                  </>
                )}
              </AnimatedScaleButton>

              {/* Partner Log In Link */}
              <View style={tw`flex-row justify-center items-center py-2`}>
                <Text style={[{ fontSize: 12, color: '#888888' }]}>
                  Have a partner account?{' '}
                </Text>
                <TouchableOpacity onPress={() => setStep('partner_login')}>
                  <Text style={[{ fontSize: 12, fontWeight: '700', color: '#16a34a' }]}>
                    Log In
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SCREEN 5: PARTNER LOGIN (Bottom Sheet over photo)
          ═══════════════════════════════════════════════════════════════════════ */}
      {step === 'partner_login' && (
        <View style={tw`flex-1`}>
          {/* Top section taking ~38% */}
          <View style={[tw`justify-between px-5`, { height: SCREEN_HEIGHT * 0.38, paddingTop: STATUS_BAR_HEIGHT + 12 }]}>
            <TouchableOpacity
              onPress={() => {
                setStep('splash')
                setSplashPage(1)
              }}
              activeOpacity={0.8}
              style={[
                tw`w-9 h-9 rounded-full items-center justify-center`,
                { backgroundColor: 'rgba(0, 0, 0, 0.30)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.20)' }
              ]}
            >
              <Ic.Back size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* White Bottom Sheet */}
          <Animated.View
            style={[
              tw`flex-1 bg-white rounded-t-[28px] px-6 pt-3 pb-10`,
              {
                transform: [{ translateY: sheetTranslateY }],
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -6 },
                shadowOpacity: 0.12,
                shadowRadius: 18,
                elevation: 12
              }
            ]}
          >
            <View style={{ position: 'absolute', bottom: -500, left: 0, right: 0, height: 500, backgroundColor: 'white' }} />
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={tw`flex-1 justify-between`}
            >
              <ScrollView showsVerticalScrollIndicator={false} bounces={false} keyboardShouldPersistTaps="handled">
                {/* Sheet Handle */}
                <View style={[tw`self-center mb-4`, { width: 36, height: 4, borderRadius: 2, backgroundColor: '#e0e0e0' }]} />

                {/* Header Block */}
                <Animated.View style={[{ opacity: fieldAnim1, transform: [{ translateY: fieldAnim1.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}>
                  <VaayuBrandLogo size={28} />
                  <Text style={[{ fontSize: 20, fontWeight: '800', color: '#111111', marginTop: 4 }]}>
                    Welcome Back, Partner!
                  </Text>
                  <Text style={[{ fontSize: 13, color: '#888888', marginTop: 2, marginBottom: 16, lineHeight: 18 }]}>
                    Log in to manage your shop and track orders.
                  </Text>
                </Animated.View>

                {/* Inputs */}
                <Animated.View style={[{ opacity: fieldAnim2, transform: [{ translateY: fieldAnim2.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}>
                  <FormInputField
                    label="Owner Email"
                    placeholder="owner@email.com"
                    value={email}
                    onChange={setEmail}
                    type="email-address"
                  />

                  <FormInputField
                    label="Password"
                    placeholder="••••••••"
                    value={password}
                    onChange={setPassword}
                    secure={!showPassword}
                    rightElement={
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={tw`p-1.5`}
                      >
                        {showPassword ? <Ic.Eye color="#111111" size={18} /> : <Ic.EyeOff color="#888888" size={18} />}
                      </TouchableOpacity>
                    }
                  />

                  {/* Forgot Password */}
                  <TouchableOpacity
                    onPress={() => handleForgotPassword(email)}
                    style={tw`self-end mb-3 -mt-1`}
                  >
                    <Text style={[{ fontSize: 12.5, fontWeight: '600', color: '#16a34a' }]}>
                      Forgot Password?
                    </Text>
                  </TouchableOpacity>
                </Animated.View>

                {/* Submit Button */}
                <Animated.View style={[{ opacity: fieldAnim3, transform: [{ translateY: fieldAnim3.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}>
                  <AnimatedScaleButton
                    onPress={() => handleLoginSubmit('owner')}
                    disabled={isSubmitting}
                    style={[
                      tw`w-full h-[50px] bg-[#16a34a] rounded-full items-center justify-center flex-row gap-2`,
                      {
                        shadowColor: '#16a34a',
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.30,
                        shadowRadius: 14,
                        elevation: 5
                      }
                    ]}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={tw`text-white font-bold text-[15.5px]`}>
                        Log In to Partner Portal
                      </Text>
                    )}
                  </AnimatedScaleButton>

                  <Divider label="or" />
                </Animated.View>
              </View>

              {/* Bottom Register Link */}
              <Animated.View
                style={[
                  tw`flex-row justify-center items-center pt-2 pb-4 mb-5`,
                  { opacity: fieldAnim4 }
                ]}
              >
                <Text style={[{ fontSize: 13, color: '#888888' }]}>
                  New partner?{' '}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setRole('owner')
                    setStep('signup_owner')
                  }}
                >
                  <Text style={[{ fontSize: 13, fontWeight: '700', color: '#16a34a' }]}>
                    Register Your Shop
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </KeyboardAvoidingView>
          </Animated.View>
        </View>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SCREEN 6: OTP VERIFICATION
          ═══════════════════════════════════════════════════════════════════════ */}
      {step === 'verify' && (
        <View style={[tw`flex-1 bg-white px-6`, { paddingTop: STATUS_BAR_HEIGHT + 8 }]}>
          {/* Header with back */}
          <View style={tw`flex-row items-center gap-3.5 mb-5`}>
            <TouchableOpacity
              onPress={() => setStep(role === 'owner' ? 'signup_owner' : 'signup_student')}
              activeOpacity={0.8}
              style={tw`w-9 h-9 rounded-full bg-[#f4f4f4] items-center justify-center`}
            >
              <Ic.Back size={19} color="#111111" />
            </TouchableOpacity>
            <View style={tw`flex-1`}>
              <Text style={[{ fontSize: 10, fontWeight: '700', color: '#16a34a', letterSpacing: 1.2 }]}>
                SECURITY VERIFICATION
              </Text>
              <Text style={[{ fontSize: 20, fontWeight: '900', color: '#0d2137' }]}>
                Enter OTP Code
              </Text>
            </View>
          </View>

          <Text style={[{ fontSize: 13, color: '#64748b', lineHeight: 19, marginBottom: 20 }]}>
            A 6-digit verification code has been sent to{' '}
            <Text style={{ fontWeight: '700', color: '#0d2137' }}>{email.trim()}</Text>.
          </Text>

          {/* OTP Input */}
          <View style={tw`mb-5`}>
            <Text style={[{ fontSize: 12.5, fontWeight: '600', color: '#333333', marginBottom: 6 }]}>
              6-Digit Verification Code
            </Text>
            <View
              style={[
                tw`h-[54px] rounded-[12px] px-4 flex-row items-center justify-center`,
                { backgroundColor: '#fafafa', borderColor: '#16a34a', borderWidth: 1.5 }
              ]}
            >
              <TextInput
                placeholder="• • • • • •"
                placeholderTextColor="#bbbbbb"
                value={otpCode}
                onChangeText={text => setOtpCode(text.replace(/[^0-9]/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                style={tw`text-center text-[22px] font-black text-[#0d2137] tracking-[8px] p-0 w-full`}
              />
            </View>
          </View>

          {/* Resend OTP */}
          <TouchableOpacity
            onPress={handleResendOtp}
            disabled={resendCooldown > 0 || isResendingOtp}
            style={tw`self-center mb-5 py-1`}
          >
            <Text
              style={[
                tw`text-[13px] font-bold`,
                { color: resendCooldown > 0 ? '#94a3b8' : '#16a34a' }
              ]}
            >
              {isResendingOtp
                ? 'Sending code...'
                : resendCooldown > 0
                ? `Resend Code in ${resendCooldown}s`
                : 'Resend Verification Code'}
            </Text>
          </TouchableOpacity>

          {/* Verify Button */}
          <AnimatedScaleButton
            onPress={() => handleVerificationComplete()}
            disabled={otpCode.length < 4 || isSubmitting}
            style={[
              tw`w-full h-[52px] bg-[#16a34a] rounded-full items-center justify-center flex-row gap-2`,
              {
                opacity: otpCode.length >= 4 && !isSubmitting ? 1 : 0.5,
                shadowColor: '#16a34a',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.30,
                shadowRadius: 14,
                elevation: 5
              }
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Text style={tw`text-white font-bold text-[15.5px]`}>
                  Verify & Create Account
                </Text>
                <Ic.Arrow color="#ffffff" size={18} />
              </>
            )}
          </AnimatedScaleButton>
        </View>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SCREEN 7: PASSWORD RESET
          ═══════════════════════════════════════════════════════════════════════ */}
      {step === 'verify_reset' && (
        <View style={[tw`flex-1 bg-white px-6`, { paddingTop: STATUS_BAR_HEIGHT + 8 }]}>
          {/* Header with back */}
          <View style={tw`flex-row items-center gap-3.5 mb-5`}>
            <TouchableOpacity
              onPress={() => setStep('customer_login')}
              activeOpacity={0.8}
              style={tw`w-9 h-9 rounded-full bg-[#f4f4f4] items-center justify-center`}
            >
              <Ic.Back size={19} color="#111111" />
            </TouchableOpacity>
            <View style={tw`flex-1`}>
              <Text style={[{ fontSize: 10, fontWeight: '700', color: '#16a34a', letterSpacing: 1.2 }]}>
                ACCOUNT RECOVERY
              </Text>
              <Text style={[{ fontSize: 20, fontWeight: '900', color: '#0d2137' }]}>
                Reset Password
              </Text>
            </View>
          </View>

          <Text style={[{ fontSize: 13, color: '#64748b', lineHeight: 19, marginBottom: 18 }]}>
            Enter the 6-digit code sent to{' '}
            <Text style={{ fontWeight: '700', color: '#0d2137' }}>{email.trim()}</Text> and your new password.
          </Text>

          {/* OTP Code */}
          <FormInputField
            label="6-Digit OTP Code"
            placeholder="Enter 6-digit code"
            value={otpCode}
            onChange={text => setOtpCode(text.replace(/[^0-9]/g, '').slice(0, 6))}
            type="number-pad"
          />

          {/* New Password */}
          <FormInputField
            label="New Password"
            placeholder="Min 6 characters"
            value={newResetPassword}
            onChange={setNewResetPassword}
            secure={!showPassword}
            rightElement={
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={tw`p-1.5`}
              >
                {showPassword ? <Ic.Eye color="#111111" size={18} /> : <Ic.EyeOff color="#888888" size={18} />}
              </TouchableOpacity>
            }
          />

          {/* Resend OTP */}
          <TouchableOpacity
            onPress={handleResendOtp}
            disabled={resendCooldown > 0 || isResendingOtp}
            style={tw`self-center my-2.5 py-1`}
          >
            <Text
              style={[
                tw`text-[13px] font-bold`,
                { color: resendCooldown > 0 ? '#94a3b8' : '#16a34a' }
              ]}
            >
              {isResendingOtp
                ? 'Sending code...'
                : resendCooldown > 0
                ? `Resend Code in ${resendCooldown}s`
                : 'Resend Verification Code'}
            </Text>
          </TouchableOpacity>

          {/* Reset Button */}
          <AnimatedScaleButton
            onPress={handleResetPasswordComplete}
            disabled={!otpCode.trim() || newResetPassword.length < 6 || isSubmitting}
            style={[
              tw`w-full h-[52px] bg-[#16a34a] rounded-full items-center justify-center flex-row gap-2 mt-2`,
              {
                opacity: otpCode.trim() && newResetPassword.length >= 6 && !isSubmitting ? 1 : 0.5,
                shadowColor: '#16a34a',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.30,
                shadowRadius: 14,
                elevation: 5
              }
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Text style={tw`text-white font-bold text-[15.5px]`}>
                  Update Password & Log In
                </Text>
                <Ic.Arrow color="#ffffff" size={18} />
              </>
            )}
          </AnimatedScaleButton>
        </View>
      )}
    </View>
  )
}
