import React, { useState, useRef, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Dimensions, Alert, StyleSheet, ActivityIndicator, BackHandler, Platform, Image, Animated } from 'react-native'
import tw from 'twrnc'
import Svg, { Path, Polyline, Line, Circle, Rect } from 'react-native-svg'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '../lib/supabase'
import { clearAllUserCache } from '../lib/cache'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const ALLOWED_DOMAINS = ['iiitt.ac.in']

const PHOTO = {
  delivery1: 'https://images.unsplash.com/photo-1695654390723-479197a8c4a3?w=800&h=1400&fit=crop&auto=format&q=85',
  delivery2: 'https://images.unsplash.com/photo-1572195577046-2f25894c06fc?w=800&h=1400&fit=crop&auto=format&q=85',
}

type SignupStep = 'carousel' | 'login' | 'signup_student' | 'signup_owner' | 'verify' | 'verify_reset'

interface SignupScreenProps {
  onDone?: (userData: any) => void
  onRegister?: (userData: any) => void
}

const APP_CATEGORIES = ['Food', 'Grocery', 'Pharmacy', 'Stationery', 'Others']

// ── Shared Vector Icon Components ───────────────────────────────────────────

function IconBack({ color = "#374151", size = 20 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Line x1="19" y1="12" x2="5" y2="12" />
      <Polyline points="12 19 5 12 12 5" />
    </Svg>
  )
}

function IconEmail({ color = "#9ca3af", size = 18 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <Polyline points="22,6 12,13 2,6" />
    </Svg>
  )
}

function IconLock({ color = "#9ca3af", size = 18 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </Svg>
  )
}

function IconUser({ color = "#9ca3af", size = 18 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <Circle cx="12" cy="7" r="4" />
    </Svg>
  )
}

function IconPhone({ color = "#9ca3af", size = 18 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </Svg>
  )
}

function IconStore({ color = "#9ca3af", size = 18 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <Polyline points="9 22 9 12 15 12 15 22" />
    </Svg>
  )
}

function IconCategory({ color = "#9ca3af", size = 18 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 2L2 7l10 5 10-5-10-5z" />
      <Path d="M2 17l10 5 10-5" />
      <Path d="M2 12l10 5 10-5" />
    </Svg>
  )
}

function VaayuIcon() {
  return (
    <Svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#8fda58" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </Svg>
  )
}

function ShopIcon() {
  return (
    <Svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#8fda58" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <Polyline points="9 22 9 12 15 12 15 22" />
    </Svg>
  )
}

function ChevronLeftIcon() {
  return (
    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="15 18 9 12 15 6" />
    </Svg>
  )
}

function SlideDots({ active, onDotClick }: { active: number; onDotClick: (idx: 0 | 1) => void }) {
  return (
    <View style={tw`flex-row items-center gap-2 mt-2`}>
      <TouchableOpacity onPress={() => onDotClick(0)}>
        <View style={[tw`h-2 rounded-full`, { width: active === 0 ? 24 : 8, backgroundColor: active === 0 ? '#8fda58' : '#d1d5db' }]} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onDotClick(1)}>
        <View style={[tw`h-2 rounded-full`, { width: active === 1 ? 24 : 8, backgroundColor: active === 1 ? '#8fda58' : '#d1d5db' }]} />
      </TouchableOpacity>
    </View>
  )
}

function AnimatedBottomSheet({ children }: { children: React.ReactNode }) {
  const slideAnim = useRef(new Animated.Value(350)).current
  const opacityAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    slideAnim.setValue(350)
    opacityAnim.setValue(0)
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        bounciness: 9,
        speed: 10,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      })
    ]).start()
  }, [])

  return (
    <Animated.View
      style={[
        tw`flex-1 bg-white rounded-t-[32px] px-6 pt-3 pb-8 justify-between shadow-2xl`,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        }
      ]}
    >
      {children}
    </Animated.View>
  )
}

// ── Shared UI Components ─────────────────────────────────────────────────────

function BackHeader({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <View style={tw`flex-row items-center px-6 pt-4 pb-2 bg-white`}>
      <TouchableOpacity onPress={onBack} style={tw`p-2 -ml-2 rounded-full bg-gray-100 mr-4`}>
        <IconBack size={18} />
      </TouchableOpacity>
      <Text style={tw`text-[18px] font-black text-gray-900`}>{title}</Text>
    </View>
  )
}

function CustomInput({
  label, placeholder, value, onChange, type = 'default', Icon, secure = false, hint, error
}: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void
  type?: any; Icon?: React.ComponentType<any>; secure?: boolean; hint?: string; error?: string
}) {
  const [focused, setFocused] = useState(false)
  return (
    <View style={tw`flex-col mb-4 mx-6`}>
      <Text style={tw`text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5`}>{label}</Text>
      <View
        style={[
          tw`flex-row items-center bg-gray-50 border rounded-2xl px-4 py-3.5`,
          { borderColor: error ? '#ef4444' : focused ? '#8fda58' : '#f3f4f6' }
        ]}
      >
        {Icon && <View style={tw`mr-3`}><Icon color={focused ? '#8fda58' : '#9ca3af'} size={18} /></View>}
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          value={value}
          onChangeText={onChange}
          keyboardType={type}
          secureTextEntry={secure}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={tw`flex-1 text-[14px] font-medium text-gray-800 p-0`}
        />
      </View>
      {error ? (
        <Text style={tw`text-[11px] text-red-500 font-semibold mt-1 px-1`}>{error}</Text>
      ) : hint ? (
        <Text style={tw`text-[11px] text-gray-400 font-medium mt-1 px-1`}>{hint}</Text>
      ) : null}
    </View>
  )
}

function PremiumInputField({
  placeholder, value, onChange, type = 'default', secure = false
}: {
  placeholder: string; value: string; onChange: (v: string) => void
  type?: any; secure?: boolean
}) {
  return (
    <TextInput
      placeholder={placeholder}
      placeholderTextColor="#9ca3af"
      value={value}
      onChangeText={onChange}
      keyboardType={type}
      secureTextEntry={secure}
      style={tw`w-full h-[52px] bg-gray-50 border border-gray-200 rounded-[14px] px-4 text-[14px] font-medium text-gray-800`}
    />
  )
}

function PrimarySubmitButton({
  onPress,
  disabled,
  isLoading,
  label
}: {
  onPress: () => void
  disabled?: boolean
  isLoading?: boolean
  label: string
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.85}
      style={tw`w-full my-2 overflow-hidden rounded-2xl`}
    >
      <LinearGradient
        colors={disabled ? ['#d1d5db', '#9ca3af'] : ['#8fda58', '#7fc448']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={tw`w-full h-14 items-center justify-center`}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color="#ffffff" />
        ) : (
          <Text style={tw`text-[16px] font-black text-white tracking-wide uppercase`}>{label}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function SignupScreen({ onDone, onRegister }: SignupScreenProps) {
  const [step, setStep] = useState<SignupStep>('carousel')
  const [activeSlide, setActiveSlide] = useState(0)
  const scrollViewRef = useRef<ScrollView>(null)

  // Form states
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)

  // Shop specific states
  const [shopName, setShopName] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [customCategory, setCustomCategory] = useState('')
  const [role, setRole] = useState<'customer' | 'owner'>('customer')

  // OTP & Reset Password states
  const [otpCode, setOtpCode] = useState('')
  const [newResetPassword, setNewResetPassword] = useState('')
  const [resendCooldown, setResendCooldown] = useState(30)
  const [isResendingOtp, setIsResendingOtp] = useState(false)

  // Countdown timer for OTP Resend cooldown
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

  // Android Back Handler for Signup / Login flow
  const lastBackPressRef = useRef<number>(0)
  useEffect(() => {
    if (Platform.OS === 'web') return

    const handleBackPress = () => {
      if (step !== 'carousel') {
        setStep('carousel')
        return true
      }
      const now = Date.now()
      if (now - lastBackPressRef.current < 2000) {
        return false // minimize/exit app
      } else {
        lastBackPressRef.current = now
        Alert.alert('Exit App', 'Press back again to exit the app.')
        return true
      }
    }

    const sub = BackHandler.addEventListener('hardwareBackPress', handleBackPress)
    return () => sub.remove()
  }, [step])

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

  // Validation
  const emailDomain = email.includes('@') ? email.split('@')[1].toLowerCase() : ''
  const isEmailWhitelisted = ALLOWED_DOMAINS.includes(emailDomain)
  
  const passwordMatch = password.length >= 6 && password === confirmPassword

  const isStudentValid = name.trim().length > 0 && 
                         email.trim().length > 0 &&
                         phone.trim().length === 10 && 
                         isEmailWhitelisted && 
                         passwordMatch && 
                         termsAccepted

  const effectiveCategory = selectedCategories
    .map(c => c === 'Others' ? customCategory.trim() : c)
    .filter(c => c.length > 0)
    .join(', ')

  const isOwnerValid = shopName.trim().length > 0 && 
                       phone.trim().length === 10 && 
                       email.includes('@') && 
                       effectiveCategory.length > 0 && 
                       passwordMatch

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x
    const index = Math.round(contentOffset / SCREEN_WIDTH)
    setActiveSlide(index)
    setRole(index === 1 ? 'owner' : 'customer')
  }

  const handleStudentSubmit = async () => {
    setRole('customer')
    const userEmail = email.trim()
    setIsSubmitting(true)

    // Security: Ensure any stale background auth session or cache is wiped before new registration
    try {
      await supabase.auth.signOut()
      await clearAllUserCache()
    } catch (_) {}

    // 1. Check if profile already exists in database
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .ilike('email', userEmail)
      .maybeSingle()

    if (existingProfile) {
      setIsSubmitting(false)
      Alert.alert(
        'Email Already Registered',
        'This email is already registered. Please log in instead or use a different email address.',
        [
          {
            text: 'Log In Now',
            onPress: () => {
              setEmail(userEmail)
              setStep('login')
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
          'This email is already registered. Please log in instead or use a different email address.',
          [
            {
              text: 'Log In Now',
              onPress: () => {
                setEmail(userEmail)
                setStep('login')
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
      console.warn('[SignupScreen] signUp exception:', e)
    }

    setOtpCode('')
    setStep('verify')
    setIsSubmitting(false)
    Alert.alert('Verification Code Sent 📧', `A 6-digit verification code has been sent to ${userEmail}. Please check your email inbox.`)
  }

  const handleOwnerSubmit = async () => {
    setRole('owner')
    const userEmail = email.trim()
    setIsSubmitting(true)

    // Security: Ensure any stale background auth session or cache is wiped before new registration
    try {
      await supabase.auth.signOut()
      await clearAllUserCache()
    } catch (_) {}

    // 1. Check if profile already exists in database
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .ilike('email', userEmail)
      .maybeSingle()

    if (existingProfile) {
      setIsSubmitting(false)
      Alert.alert(
        'Email Already Registered',
        'This email is already registered. Please log in instead or use a different email address.',
        [
          {
            text: 'Log In Now',
            onPress: () => {
              setEmail(userEmail)
              setStep('login')
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
          'This email is already registered. Please log in instead or use a different email address.',
          [
            {
              text: 'Log In Now',
              onPress: () => {
                setEmail(userEmail)
                setStep('login')
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
      console.warn('[SignupScreen] signUp exception:', e)
    }

    setOtpCode('')
    setStep('verify')
    setIsSubmitting(false)
    Alert.alert('Verification Code Sent 📧', `A 6-digit verification code has been sent to ${userEmail}. Please check your email inbox.`)
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
      Alert.alert('Invalid New Password', 'Your new password cannot be the same as your current password. Please choose a different password.')
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
      setStep('login')
    }
  }

  const completeAuth = (userData: any) => {
    if (typeof onDone === 'function') {
      onDone(userData)
    } else if (typeof onRegister === 'function') {
      onRegister(userData)
    }
  }

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Real Supabase User Registration & Shop Initialization
  const handleVerificationComplete = async (codeOverride?: string) => {
    setIsSubmitting(true)
    const determinedRole = role === 'owner' ? 'shop_owner' : 'customer'
    const userEmail = email.trim()
    const token = codeOverride || otpCode.trim()

    let userId: string | null = null

    // 1. Verify OTP with Supabase if token entered
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
        console.warn('[SignupScreen] OTP verification notice:', e)
      }
    }

    // 2. If userId not yet obtained, check current session / user or sign in with password
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
        console.warn('[SignupScreen] signIn notice:', e)
      }
    }

    try {
      const realFullName = name.trim() || (determinedRole === 'shop_owner' ? shopName.trim() : userEmail.split('@')[0])
      const realPhoneNumber = phone.trim()
      let newShopId = undefined
      let finalRole = determinedRole

      if (determinedRole === 'shop_owner') {
        // Secure atomic shop registration and verified role assignment via RPC
        const { data: regData, error: regErr } = await supabase.rpc('register_partner_shop', {
          p_shop_name: shopName.trim(),
          p_category: effectiveCategory || 'Others',
          p_full_name: realFullName,
          p_phone: realPhoneNumber
        })

        if (regErr) {
          console.warn('[SignupScreen] register_partner_shop notice:', regErr.message)
        } else if (regData?.shop_id) {
          newShopId = regData.shop_id
          finalRole = 'shop_owner'
        }
      } else if (userId) {
        // Standard customer profile creation (strictly role: 'customer')
        const { error: profErr } = await supabase.from('profiles').upsert([{
          id: userId,
          user_id: userId,
          email: userEmail,
          full_name: realFullName,
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
        name: realFullName,
        email: userEmail,
        phone_number: realPhoneNumber,
        shop_id: newShopId,
        shop_name: determinedRole === 'shop_owner' ? shopName.trim() : undefined
      })
    } catch (err) {
      setIsSubmitting(false)
      completeAuth({
        id: userId,
        role: determinedRole,
        name: name.trim() || (determinedRole === 'shop_owner' ? shopName.trim() : userEmail.split('@')[0]),
        email: userEmail,
        phone_number: phone.trim()
      })
    }
  }

  // Login — checks email & password
  const handleLoginSubmit = async () => {
    const cleanEmail = email.trim()
    if (!cleanEmail || !password) {
      Alert.alert('Validation Error', 'Please enter your email address and password.')
      return
    }

    setIsSubmitting(true)

    // Security: Purge any old session or cached state before authenticating
    try {
      await supabase.auth.signOut()
      await clearAllUserCache()
    } catch (_) {}

    // Determine target portal (if on Slide 0 of carousel, role is 'customer'. If step === 'login' and role === 'owner', it's 'owner')
    const targetPortal = (step === 'carousel' && activeSlide === 0) ? 'customer' : (role === 'owner' ? 'owner' : 'customer')

    // 1. Authenticate with Supabase Auth
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

    // 2. Query profiles & shops by email first, fallback to auth ID
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

    // ── STRICT PORTAL BOUNDARY ENFORCEMENT ──
    if (targetPortal === 'customer' && isShopPartner) {
      Alert.alert(
        'Partner Account Detected 🏪',
        'This email belongs to a registered Shop Partner. Please use the Partner Log In screen to access your shop dashboard.',
        [
          {
            text: 'Go to Partner Log In',
            onPress: () => {
              setRole('owner')
              setStep('login')
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      )
      await supabase.auth.signOut()
      return
    }

    if (targetPortal === 'owner' && !isShopPartner) {
      Alert.alert(
        'Customer Account Detected 👤',
        'This email belongs to a Customer account. Please use the Customer Log In screen to browse canteens and place orders.',
        [
          {
            text: 'Go to Customer Log In',
            onPress: () => {
              setRole('customer')
              setStep('login')
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
    
    // Read real full_name from database profile, fallback to shop name or email handle
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

  const goTo = (idx: 0 | 1) => {
    setActiveSlide(idx)
    setRole(idx === 1 ? 'owner' : 'customer')
    scrollViewRef.current?.scrollTo({ x: idx * SCREEN_WIDTH, animated: true })
  }

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: '#ffffff' }]}>
      {/* ── 1. FULL BLEED ONBOARDING CAROUSEL ── */}
      {step === 'carousel' && (
        <View style={tw`flex-1 relative bg-black`}>
          {/* Full bleed background photo */}
          <Image
            source={{ uri: activeSlide === 1 ? PHOTO.delivery2 : PHOTO.delivery1 }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />

          {/* Dark Gradient Overlay */}
          <LinearGradient
            colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.92)']}
            locations={[0, 0.3, 0.6, 1]}
            style={StyleSheet.absoluteFill}
          />

          {/* Content Container */}
          <View style={tw`flex-1 justify-end px-7 pb-10`}>
            {activeSlide === 0 ? (
              /* Slide 1: Customer / Student */
              <View style={tw`w-full`}>
                <View style={tw`mb-6`}>
                  <Text style={tw`text-[11px] font-bold tracking-[2px] text-green-400 uppercase mb-3`}>
                    CAMPUS DELIVERY
                  </Text>
                  <Text style={tw`text-[52px] font-black text-white leading-none tracking-tight mb-4`}>
                    ORDER.{"\n"}TRACK.{"\n"}ARRIVE.
                  </Text>
                  <Text style={tw`text-[14px] font-medium text-white/70 leading-relaxed max-w-[280px]`}>
                    Get anything from shops delivered to your campus in minutes.
                  </Text>
                </View>

                <View style={tw`gap-3 mt-4`}>
                  <TouchableOpacity
                    onPress={() => {
                      setRole('customer')
                      setActiveSlide(0)
                      setStep('login')
                    }}
                    activeOpacity={0.88}
                    style={tw`w-full py-4 rounded-full bg-green-600 items-center justify-center flex-row gap-2 shadow-lg`}
                  >
                    <Text style={tw`text-white font-extrabold text-[16px]`}>Continue ➔</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setActiveSlide(1)
                      setRole('owner')
                    }}
                    activeOpacity={0.7}
                    style={tw`py-2 items-center`}
                  >
                    <Text style={tw`text-[13px] font-semibold text-white/60`}>
                      Shop Owner? <Text style={tw`text-green-400 font-bold`}>Partner Portal →</Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* Slide 2: Shop Owner / Partner */
              <View style={tw`w-full`}>
                <View style={tw`mb-6`}>
                  <Text style={tw`text-[11px] font-bold tracking-[2px] text-green-400 uppercase mb-3`}>
                    PARTNER PORTAL
                  </Text>
                  <Text style={tw`text-[52px] font-black text-white leading-none tracking-tight mb-4`}>
                    GROW.{"\n"}PARTNER.{"\n"}EARN.
                  </Text>
                  <Text style={tw`text-[14px] font-medium text-white/70 leading-relaxed max-w-[280px]`}>
                    Register your shop and reach hundreds of hostel & campus customers daily.
                  </Text>
                </View>

                <View style={tw`gap-3 mt-4`}>
                  <TouchableOpacity
                    onPress={() => setStep('signup_owner')}
                    activeOpacity={0.88}
                    style={tw`w-full py-3.5 rounded-full bg-white items-center justify-center flex-row gap-2 shadow-lg`}
                  >
                    <IconStore color="#111827" size={18} />
                    <Text style={tw`text-gray-900 font-black text-[15px]`}>Register Your Shop</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setRole('owner')
                      setActiveSlide(1)
                      setStep('login')
                    }}
                    activeOpacity={0.88}
                    style={tw`w-full py-3.5 rounded-full border border-white/50 bg-white/10 items-center justify-center flex-row gap-2`}
                  >
                    <IconEmail color="#ffffff" size={18} />
                    <Text style={tw`text-white font-extrabold text-[15px]`}>Partner Log In</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setActiveSlide(0)
                      setRole('customer')
                    }}
                    activeOpacity={0.7}
                    style={tw`py-2 items-center`}
                  >
                    <Text style={tw`text-[13px] font-semibold text-white/60`}>
                      Customer? <Text style={tw`text-green-400 font-bold`}>Customer Portal →</Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Dots Indicator */}
            <View style={tw`flex-row items-center gap-1.5 mt-6`}>
              <TouchableOpacity onPress={() => { setActiveSlide(0); setRole('customer'); }}>
                <View style={[tw`h-1.5 rounded-full`, { width: activeSlide === 0 ? 20 : 6, backgroundColor: activeSlide === 0 ? '#ffffff' : 'rgba(255,255,255,0.4)' }]} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setActiveSlide(1); setRole('owner'); }}>
                <View style={[tw`h-1.5 rounded-full`, { width: activeSlide === 1 ? 20 : 6, backgroundColor: activeSlide === 1 ? '#ffffff' : 'rgba(255,255,255,0.4)' }]} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* ── 2. LOGIN SCREEN (SLIDING BOTTOM SHEET DESIGN FROM ZIP) ── */}
      {step === 'login' && (
        <View style={tw`flex-1 relative bg-black`}>
          {/* Full bleed background photo */}
          <Image
            source={{ uri: role === 'owner' ? PHOTO.delivery2 : PHOTO.delivery1 }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />

          {/* Dark overlay top section */}
          <View style={tw`h-[35%] justify-between p-6 pt-12`}>
            <TouchableOpacity
              onPress={() => {
                const slideToReturn = role === 'owner' ? 1 : 0
                setActiveSlide(slideToReturn)
                setStep('carousel')
              }}
              activeOpacity={0.8}
              style={[
                tw`w-10 h-10 rounded-full items-center justify-center border`,
                { backgroundColor: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,255,255,0.25)' }
              ]}
            >
              <IconBack color="#ffffff" size={20} />
            </TouchableOpacity>
          </View>

          {/* Animated Bottom Sheet */}
          <AnimatedBottomSheet>
            {/* Sheet Handle */}
            <View style={tw`w-10 h-1 bg-gray-300 rounded-full self-center mb-4`} />

            {/* Logo */}
            <Text style={tw`text-[28px] font-black text-gray-900 tracking-tight text-left`}>
              Vaayu<Text style={tw`text-green-600`}>.</Text>
            </Text>

            {/* Content */}
            <View style={tw`flex-1 justify-between py-2`}>
              <View style={tw`text-left`}>
                <Text style={tw`text-[20px] font-extrabold text-gray-900 mb-0.5`}>
                  {role === 'owner' ? "Welcome Back, Partner!" : "Welcome Back!"}
                </Text>
                <Text style={tw`text-[13px] font-medium text-gray-500`}>
                  {role === 'owner'
                    ? "Log in to manage your shop and track orders."
                    : "Log in to order from your favourite campus shops."}
                </Text>
              </View>

              <View style={tw`gap-3 my-2 text-left`}>
                <View>
                  <Text style={tw`text-[12px] font-bold text-gray-700 mb-1.5`}>
                    {role === 'owner' ? "Owner Email" : "Username / College Email"}
                  </Text>
                  <TextInput
                    placeholder={role === 'owner' ? "owner@royal-foods.com" : "251420@iiitt.ac.in"}
                    placeholderTextColor="#9ca3af"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={tw`w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-3.5 text-[14px] font-medium text-gray-900`}
                  />
                </View>

                <View>
                  <Text style={tw`text-[12px] font-bold text-gray-700 mb-1.5`}>Password</Text>
                  <TextInput
                    placeholder="••••••••"
                    placeholderTextColor="#9ca3af"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    style={tw`w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-3.5 text-[14px] font-medium text-gray-900`}
                  />
                </View>

                <TouchableOpacity
                  onPress={() => handleForgotPassword(email)}
                  style={tw`self-end`}
                >
                  <Text style={tw`text-[12px] font-bold text-green-600`}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              <View style={tw`gap-2.5`}>
                <TouchableOpacity
                  onPress={handleLoginSubmit}
                  disabled={isSubmitting}
                  activeOpacity={0.88}
                  style={tw`w-full py-4 rounded-full bg-green-600 items-center justify-center shadow-lg`}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={tw`text-white font-extrabold text-[16px]`}>
                      {role === 'owner' ? "Log In to Partner Portal" : "Log In"}
                    </Text>
                  )}
                </TouchableOpacity>

                {role === 'owner' && (
                  <View style={tw`flex-row items-center gap-3 my-1`}>
                    <View style={tw`flex-1 h-px bg-gray-200`} />
                    <Text style={tw`text-[11px] font-medium text-gray-400`}>or</Text>
                    <View style={tw`flex-1 h-px bg-gray-200`} />
                  </View>
                )}

                <TouchableOpacity
                  onPress={() => setStep(role === 'owner' ? 'signup_owner' : 'signup_student')}
                  style={tw`self-center py-1`}
                >
                  <Text style={tw`text-[12.5px] font-medium text-gray-500`}>
                    {role === 'owner' ? "New partner? " : "Don't have an account? "}
                    <Text style={tw`font-bold text-green-600`}>
                      {role === 'owner' ? "Register Your Shop" : "Register here"}
                    </Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </AnimatedBottomSheet>
        </View>
      )}

      {/* ── 3. SIGNUP STUDENT SCREEN ── */}
      {step === 'signup_student' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`flex-grow pt-10 pb-8`}>
          <BackHeader onBack={() => setStep('carousel')} title="Student Registration" />

          <Text style={tw`text-[13px] text-gray-400 font-bold px-6 mb-6`}>
            Use your official IIITT email ID (e.g. 251420@iiitt.ac.in) to join.
          </Text>

          <CustomInput
            label="Full Name"
            placeholder="e.g. Aditya Sharma"
            value={name}
            onChange={setName}
            Icon={IconUser}
          />

          <CustomInput
            label="College Email"
            placeholder="e.g. 251420@iiitt.ac.in"
            value={email}
            onChange={setEmail}
            type="email-address"
            Icon={IconEmail}
            hint="Must use official @iiitt.ac.in email address"
            error={email && !isEmailWhitelisted ? "Must use @iiitt.ac.in email domain" : undefined}
          />

          <CustomInput
            label="Phone Number"
            placeholder="e.g. 9876543210"
            value={phone}
            onChange={setPhone}
            type="phone-pad"
            Icon={IconPhone}
          />

          <CustomInput
            label="Password"
            placeholder="Min 6 characters"
            value={password}
            onChange={setPassword}
            secure
            Icon={IconLock}
          />

          <CustomInput
            label="Confirm Password"
            placeholder="Retype password to confirm"
            value={confirmPassword}
            onChange={setConfirmPassword}
            secure
            Icon={IconLock}
            error={confirmPassword && password !== confirmPassword ? "Passwords do not match" : undefined}
          />

          <TouchableOpacity
            onPress={() => setTermsAccepted(!termsAccepted)}
            style={tw`flex-row items-start px-6 mb-8 gap-3`}
          >
            <View style={tw`mt-0.5`}>
              <View style={[tw`w-5 h-5 rounded-md border items-center justify-center`, { borderColor: termsAccepted ? '#8fda58' : '#d1d5db' }]}>
                {termsAccepted && <View style={[tw`w-3 h-3 rounded`, { backgroundColor: '#8fda58' }]} />}
              </View>
            </View>
            <Text style={tw`flex-1 text-[12px] font-medium text-gray-500 leading-normal`}>
              I agree with the <Text style={[tw`font-bold`, { color: '#8fda58' }]}>Terms and Conditions</Text> and <Text style={[tw`font-bold`, { color: '#8fda58' }]}>Privacy Policy</Text>.
            </Text>
          </TouchableOpacity>

          <View style={tw`px-6 mb-6`}>
            <PrimarySubmitButton
              onPress={handleStudentSubmit}
              disabled={!isStudentValid}
              isLoading={isSubmitting}
              label="Proceed to Verification"
            />
          </View>

          <TouchableOpacity onPress={() => setStep('login')} style={tw`self-center`}>
            <Text style={tw`text-[13px] text-gray-400 font-semibold`}>
              Have an account? <Text style={[tw`font-bold`, { color: '#8fda58' }]}>Log In</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ── 4. SIGNUP SHOP OWNER SCREEN ── */}
      {step === 'signup_owner' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`flex-grow pt-10 pb-8`}>
          <BackHeader onBack={() => setStep('carousel')} title="Register Your Shop" />

          <Text style={tw`text-[13px] text-gray-400 font-bold px-6 mb-4`}>
            Partner with Vaayu to deliver directly on campus.
          </Text>

          <CustomInput
            label="Shop Name"
            placeholder="e.g. Campus Bites Cafe"
            value={shopName}
            onChange={setShopName}
            Icon={IconStore}
          />

          <CustomInput
            label="Owner Phone Number"
            placeholder="e.g. 9876543210"
            value={phone}
            onChange={setPhone}
            type="phone-pad"
            Icon={IconPhone}
          />

          <CustomInput
            label="Contact Email"
            placeholder="e.g. owner@email.com"
            value={email}
            onChange={setEmail}
            type="email-address"
            Icon={IconEmail}
          />

          {/* Shop Category Selection */}
          <View style={tw`mb-4 mx-6`}>
            <Text style={tw`text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2`}>Shop Categories (Select Multiple)</Text>
            <View style={tw`flex-row flex-wrap gap-2`}>
              {APP_CATEGORIES.map(c => {
                const isSelected = selectedCategories.includes(c);
                return (
                  <TouchableOpacity
                    key={c}
                    onPress={() => {
                      setSelectedCategories(prev => {
                        if (prev.includes(c)) {
                          if (c === 'Others') setCustomCategory('');
                          return prev.filter(item => item !== c);
                        } else {
                          return [...prev, c];
                        }
                      });
                    }}
                    style={[
                      tw`px-3.5 py-2 rounded-full border`,
                      {
                        backgroundColor: isSelected ? '#8fda58' : '#f9fafb',
                        borderColor: isSelected ? '#8fda58' : '#e5e7eb',
                      }
                    ]}
                  >
                    <Text style={[tw`text-[12px] font-bold`, { color: isSelected ? '#ffffff' : '#4b5563' }]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Custom Category Input if Others selected */}
          {selectedCategories.includes('Others') && (
            <CustomInput
              label="Custom Category Name"
              placeholder="e.g. Books & Gifts, Electronics, Printing"
              value={customCategory}
              onChange={setCustomCategory}
              Icon={IconCategory}
              hint="Enter your own shop category name"
            />
          )}

          <CustomInput
            label="Password"
            placeholder="Min 6 characters"
            value={password}
            onChange={setPassword}
            secure
            Icon={IconLock}
          />

          <CustomInput
            label="Confirm Password"
            placeholder="Retype password to confirm"
            value={confirmPassword}
            onChange={setConfirmPassword}
            secure
            Icon={IconLock}
            error={confirmPassword && password !== confirmPassword ? "Passwords do not match" : undefined}
          />

          <View style={tw`px-6 mb-6 mt-4`}>
            <PrimarySubmitButton
              onPress={handleOwnerSubmit}
              disabled={!isOwnerValid}
              isLoading={isSubmitting}
              label="Proceed to Verification"
            />
          </View>

          <TouchableOpacity onPress={() => setStep('login')} style={tw`self-center`}>
            <Text style={tw`text-[13px] text-gray-400 font-semibold`}>
              Have an account? <Text style={[tw`font-bold`, { color: '#8fda58' }]}>Log In</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ── 5. EMAIL OTP VERIFICATION SCREEN (Enters App directly upon OTP entry) ── */}
      {step === 'verify' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`flex-grow pt-20 pb-8`}>
          <BackHeader onBack={() => setStep(role === 'customer' ? 'signup_student' : 'signup_owner')} title="Verify Email" />
          
          <View style={tw`px-6 pt-6 items-center`}>
            <View style={[tw`w-16 h-16 rounded-2xl items-center justify-center mb-4`, { backgroundColor: '#f0fdf4' }]}>
              <Text style={tw`text-3xl`}>🔑</Text>
            </View>
            <Text style={tw`text-[26px] font-black text-gray-900 mb-2 text-center`}>Enter Verification OTP</Text>
            <Text style={tw`text-[13px] text-gray-400 font-medium mb-4 text-center leading-relaxed px-4`}>
              We sent a 6-digit OTP code to <Text style={tw`font-bold text-gray-800`}>{email || 'your email'}</Text>. Enter the code below to verify your account.
            </Text>

            <View style={tw`w-full mb-6`}>
              <TextInput
                placeholder="0 0 0 0 0 0"
                keyboardType="number-pad"
                maxLength={6}
                value={otpCode}
                placeholderTextColor="#9ca3af"
                onChangeText={(v) => {
                  setOtpCode(v)
                  if (v.trim().length === 6) {
                    handleVerificationComplete(v.trim())
                  }
                }}
                style={tw`bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 text-center text-2xl font-black tracking-widest text-gray-900 w-full`}
              />
            </View>

            <PrimarySubmitButton
              onPress={() => handleVerificationComplete()}
              isLoading={isSubmitting}
              label="Verify & Enter App"
            />

            <TouchableOpacity
              onPress={handleResendOtp}
              disabled={resendCooldown > 0 || isResendingOtp}
              style={tw`self-center mt-3 py-2 px-4 rounded-xl`}
            >
              {isResendingOtp ? (
                <ActivityIndicator size="small" color="#8fda58" />
              ) : (
                <Text style={[tw`font-bold text-[13px] text-center`, { color: resendCooldown > 0 ? '#9ca3af' : '#8fda58' }]}>
                  {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : '🔄 Resend OTP Code'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* ── 6. FORGOT PASSWORD OTP RESET SCREEN ── */}
      {step === 'verify_reset' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`flex-grow pt-20 pb-8`}>
          <BackHeader onBack={() => setStep('login')} title="Reset Password" />
          
          <View style={tw`px-6 pt-6 items-center`}>
            <View style={[tw`w-16 h-16 rounded-2xl items-center justify-center mb-4`, { backgroundColor: '#f0fdf4' }]}>
              <Text style={tw`text-3xl`}>🔒</Text>
            </View>
            <Text style={tw`text-[26px] font-black text-gray-900 mb-2 text-center`}>Reset Your Password</Text>
            <Text style={tw`text-[13px] text-gray-400 font-medium mb-6 text-center leading-relaxed px-4`}>
              Enter the 6-digit OTP code sent to <Text style={tw`font-bold text-gray-800`}>{email || 'your email'}</Text> and choose a new password.
            </Text>

            <View style={tw`w-full gap-4 mb-6`}>
              <View>
                <Text style={tw`text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5`}>6-Digit OTP Code</Text>
                <TextInput
                  placeholder="0 0 0 0 0 0"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otpCode}
                  placeholderTextColor="#9ca3af"
                  onChangeText={setOtpCode}
                  style={tw`bg-gray-50 border border-gray-200 rounded-2xl px-6 py-3.5 text-center text-xl font-black tracking-widest text-gray-900 w-full`}
                />
              </View>

              <View>
                <Text style={tw`text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5`}>New Password</Text>
                <TextInput
                  placeholder="Enter new password (min 6 chars)"
                  secureTextEntry
                  value={newResetPassword}
                  placeholderTextColor="#9ca3af"
                  onChangeText={setNewResetPassword}
                  style={tw`bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-[14px] font-medium text-gray-800 w-full`}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleResetPasswordComplete}
              style={[tw`w-full py-4 rounded-2xl items-center mb-2`, { backgroundColor: '#8fda58' }]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={tw`text-[15px] font-black text-white`}>Update Password & Log In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleResendOtp}
              disabled={resendCooldown > 0 || isResendingOtp}
              style={tw`self-center mt-2 py-2 px-4 rounded-xl`}
            >
              {isResendingOtp ? (
                <ActivityIndicator size="small" color="#8fda58" />
              ) : (
                <Text style={[tw`font-bold text-[13px] text-center`, { color: resendCooldown > 0 ? '#9ca3af' : '#8fda58' }]}>
                  {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : '🔄 Resend OTP Code'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
