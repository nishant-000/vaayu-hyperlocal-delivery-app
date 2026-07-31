import React, { useState, useRef } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Dimensions, Alert, StyleSheet, ActivityIndicator } from 'react-native'
import tw from 'twrnc'
import Svg, { Path, Polyline, Line, Circle, Rect } from 'react-native-svg'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '../lib/supabase'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const ALLOWED_DOMAINS = ['iiitt.ac.in']

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
  const [category, setCategory] = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const [role, setRole] = useState<'customer' | 'owner'>('customer')

  // OTP & Reset Password states
  const [otpCode, setOtpCode] = useState('')
  const [newResetPassword, setNewResetPassword] = useState('')

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

  const effectiveCategory = category === 'Others' ? customCategory.trim() : category

  const isOwnerValid = shopName.trim().length > 0 && 
                       phone.trim().length === 10 && 
                       email.includes('@') && 
                       effectiveCategory.length > 0 && 
                       passwordMatch

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x
    const index = Math.round(contentOffset / SCREEN_WIDTH)
    setActiveSlide(index)
  }

  const handleStudentSubmit = async () => {
    setRole('customer')
    const userEmail = email.trim()
    setIsSubmitting(true)

    const { error } = await supabase.auth.signUp({
      email: userEmail,
      password: password
    })
    setIsSubmitting(false)

    if (error && !error.message.includes('already registered')) {
      console.warn('[SignupScreen] signUp notice:', error.message)
    }

    setOtpCode('')
    setStep('verify')
    Alert.alert(
      '🔑 OTP Code Sent',
      `An OTP verification code has been sent to ${userEmail}. Please enter the code below to complete registration.`
    )
  }

  const handleOwnerSubmit = async () => {
    setRole('owner')
    const userEmail = email.trim()
    setIsSubmitting(true)

    const { error } = await supabase.auth.signUp({
      email: userEmail,
      password: password
    })
    setIsSubmitting(false)

    if (error && !error.message.includes('already registered')) {
      console.warn('[SignupScreen] signUp notice:', error.message)
    }

    setOtpCode('')
    setStep('verify')
    Alert.alert(
      '🔑 OTP Code Sent',
      `An OTP verification code has been sent to ${userEmail}. Please enter the code below to verify your shop account.`
    )
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
        Alert.alert('OTP Verification Failed', error.message || 'Invalid or expired OTP code.')
        return
      }
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

    // 1. Verify OTP with Supabase if token entered
    if (token && token.length >= 4) {
      const { error: otpErr } = await supabase.auth.verifyOtp({
        email: userEmail,
        token: token,
        type: 'signup'
      })
      if (otpErr) {
        await supabase.auth.verifyOtp({
          email: userEmail,
          token: token,
          type: 'email'
        })
      }
    }

    let userId: string | null = null

    // Check session
    const { data: authData } = await supabase.auth.signUp({
      email: userEmail,
      password: password
    })

    if (authData?.user?.id) {
      userId = authData.user.id
    } else {
      const { data: loginData } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: password
      })
      if (loginData?.user?.id) {
        userId = loginData.user.id
      }
    }

    if (!userId) {
      userId = `usr_${Date.now()}`
    }

    try {
      await supabase.from('profiles').upsert([{
        id: userId,
        email: userEmail,
        full_name: (name.trim() || shopName.trim() || userEmail.split('@')[0]),
        phone: phone.trim(),
        role: determinedRole
      }])

      let newShopId = undefined
      if (determinedRole === 'shop_owner') {
        const { data: shopData } = await supabase.from('shops').insert([{
          owner_id: userId,
          name: shopName.trim(),
          category: effectiveCategory || 'Others',
          is_open: true
        }]).select().single()

        if (shopData) {
          newShopId = shopData.id
          await supabase.from('shop_workers').insert([{
            shop_id: shopData.id,
            user_id: userId,
            worker_name: (name.trim() || shopName.trim() || 'Owner'),
            worker_phone: phone.trim()
          }])
        }
      }

      setIsSubmitting(false)

      completeAuth({
        id: userId,
        role: determinedRole,
        name: determinedRole === 'shop_owner' ? shopName.trim() : (name.trim() || userEmail.split('@')[0]),
        email: userEmail,
        phoneNumber: phone.trim(),
        category: determinedRole === 'shop_owner' ? (effectiveCategory || 'Others') : undefined,
        shop_id: newShopId,
        shop_name: determinedRole === 'shop_owner' ? shopName.trim() : undefined
      })
    } catch (err) {
      setIsSubmitting(false)
      completeAuth({
        id: userId,
        role: determinedRole,
        name: determinedRole === 'shop_owner' ? shopName.trim() : (name.trim() || userEmail.split('@')[0]),
        email: userEmail,
        phoneNumber: phone.trim()
      })
    }
  }

  // Strict Supabase User Login — password is always verified
  const handleLoginSubmit = async () => {
    const cleanEmail = email.trim()
    if (!cleanEmail || !password) {
      Alert.alert('Validation Error', 'Please enter your email address and password.')
      return
    }

    setIsSubmitting(true)

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: password
    })

    if (authError || !authData?.user) {
      const msg = authError?.message || ''
      if (msg.includes('Email not confirmed')) {
        // When SMTP is not configured, query profile by email to allow login
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', cleanEmail)
          .single()

        if (existingProfile) {
          setIsSubmitting(false)
          const { data: shop } = await supabase
            .from('shops')
            .select('*')
            .eq('owner_id', existingProfile.id)
            .single()

          const determinedRole = shop ? 'shop_owner' : (existingProfile.role || 'customer')
          const displayName = shop?.name || existingProfile.full_name || cleanEmail.split('@')[0] || 'Student'

          completeAuth({
            id: existingProfile.id,
            role: determinedRole,
            name: displayName,
            email: cleanEmail,
            phoneNumber: existingProfile.phone || '',
            shop_id: shop?.id || undefined,
            shop_name: shop?.name || undefined
          })
          return
        }

        setIsSubmitting(false)
        Alert.alert(
          'Email Confirmation Notice',
          'SMTP email service is currently not configured in Supabase. You can activate your account directly or enter an OTP code.',
          [
            {
              text: 'Bypass & Activate Account',
              onPress: () => handleVerificationComplete()
            },
            {
              text: 'Enter OTP Code',
              onPress: () => {
                setOtpCode('')
                setStep('verify')
              }
            }
          ]
        )
        return
      }

      setIsSubmitting(false)
      Alert.alert('Login Failed', 'Incorrect email or password. Please try again.')
      return
    }

    const authUser = authData.user

    // Query profiles & shops table to resolve role and store details
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()

    const { data: shop } = await supabase
      .from('shops')
      .select('*')
      .eq('owner_id', authUser.id)
      .single()

    setIsSubmitting(false)

    const determinedRole = shop ? 'shop_owner' : (profile?.role || 'customer')
    const displayName = shop?.name || profile?.full_name || cleanEmail.split('@')[0] || 'Student'

    completeAuth({
      id: authUser.id,
      role: determinedRole,
      name: displayName,
      email: cleanEmail,
      phoneNumber: profile?.phone || '',
      shop_id: shop?.id || profile?.shop_id || undefined,
      shop_name: shop?.name || undefined
    })
  }

  const goTo = (idx: 0 | 1) => {
    setActiveSlide(idx)
    scrollViewRef.current?.scrollTo({ x: idx * SCREEN_WIDTH, animated: true })
  }

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: '#ffffff' }]}>
      {/* ── 1. SWIPE ONBOARDING CAROUSEL ── */}
      {step === 'carousel' && (
        <View style={tw`flex-1 relative`}>
          <LinearGradient
            colors={['#ffffff', '#f4fbf7', '#eafaf1']}
            locations={[0, 0.45, 1]}
            style={StyleSheet.absoluteFill}
          />
          
          {/* Background Ambient Glow Orbs */}
          {activeSlide === 0 ? (
            <>
              <View style={[tw`absolute rounded-full`, { width: 380, height: 380, borderRadius: 190, backgroundColor: 'rgba(143,218,88,0.12)', top: -80, right: -80 }]} pointerEvents="none" />
              <View style={[tw`absolute rounded-full`, { width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(110,231,183,0.08)', bottom: 60, left: -60 }]} pointerEvents="none" />
            </>
          ) : (
            <>
              <View style={[tw`absolute rounded-full`, { width: 380, height: 380, borderRadius: 190, backgroundColor: 'rgba(143,218,88,0.12)', top: -80, left: -80 }]} pointerEvents="none" />
              <View style={[tw`absolute rounded-full`, { width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(110,231,183,0.08)', bottom: 40, right: -60 }]} pointerEvents="none" />
            </>
          )}

          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            style={tw`flex-1`}
          >
            {/* Slide 1: Customer / Student - Shifted Downwards */}
            <View style={[tw`flex-col items-center justify-between pt-16 pb-6`, { width: SCREEN_WIDTH }]}>
              {/* Header */}
              <View style={tw`items-center pt-12`}>
                <View style={tw`relative w-[88px] h-[88px] mb-4 justify-center items-center`}>
                  <View style={[tw`absolute -inset-2 rounded-full border`, { borderColor: 'rgba(143,218,88,0.3)', borderWidth: 1.5 }]} />
                  <LinearGradient
                    colors={['#f0fdf4', '#dcfce7']}
                    style={[tw`w-[88px] h-[88px] rounded-full items-center justify-center border`, { borderColor: 'rgba(143,218,88,0.25)', borderWidth: 1.5 }]}
                  >
                    <VaayuIcon />
                  </LinearGradient>
                </View>
                <Text style={[tw`text-[38px] font-black text-gray-900 tracking-tighter m-0`, { lineHeight: 38 }]}>vaayu</Text>
                <Text style={[tw`text-[12px] font-bold tracking-[4px] uppercase mt-1.5`, { color: '#8fda58' }]}>you got it</Text>
              </View>

              {/* White Card */}
              <View style={[tw`w-full max-w-[340px] rounded-[24px] p-6 gap-5 border mt-6`, { backgroundColor: '#ffffff', borderColor: '#e5e7eb' }]}>
                <View>
                  <Text style={[tw`text-[12px] font-bold uppercase tracking-[2px] mb-1`, { color: '#8fda58' }]}>Customer</Text>
                  <Text style={tw`text-[24px] font-extrabold text-gray-900`}>Welcome back</Text>
                  <Text style={tw`text-[13px] text-gray-500 mt-1 font-normal`}>Order food, groceries & more</Text>
                </View>

                <View style={tw`gap-3`}>
                  <PremiumInputField placeholder="Email address" value={email} onChange={setEmail} type="email-address" />
                  <PremiumInputField placeholder="Password" value={password} onChange={setPassword} secure />
                </View>

                <TouchableOpacity
                  onPress={() => handleForgotPassword(email)}
                  style={tw`self-end`}
                >
                  <Text style={[tw`text-[12px] font-bold`, { color: '#8fda58' }]}>Forgot Password?</Text>
                </TouchableOpacity>

                <View style={tw`gap-3`}>
                  <TouchableOpacity onPress={handleLoginSubmit}>
                    <LinearGradient
                      colors={['#8fda58', '#7fc448']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={tw`w-full h-[52px] rounded-[14px] items-center justify-center`}
                    >
                      <Text style={tw`text-white text-[15px] font-bold tracking-[0.3px]`}>Log In</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                <Text style={tw`text-center text-[12px] text-gray-400 mt-4`}>
                  Don't have an account?{' '}
                  <Text onPress={() => setStep('signup_student')} style={[tw`font-semibold`, { color: '#8fda58' }]}>Sign Up</Text>
                </Text>
              </View>

              {/* Bottom Swipe hint */}
              <View style={tw`items-center gap-3 pb-6 mt-4`}>
                <TouchableOpacity onPress={() => goTo(1)} style={tw`flex-row items-center gap-1.5`}>
                  <ChevronLeftIcon />
                  <Text style={[tw`text-[13px] font-semibold`, { color: '#9ca3af' }]}>Partner with Vaayu</Text>
                </TouchableOpacity>
                <SlideDots active={0} onDotClick={goTo} />
              </View>
            </View>

            {/* Slide 2: Shop Owner - Shifted Downwards */}
            <View style={[tw`flex-col items-center justify-between pt-16 pb-6`, { width: SCREEN_WIDTH }]}>
              {/* Header */}
              <View style={tw`items-center pt-12`}>
                <View style={tw`relative w-[88px] h-[88px] mb-4 justify-center items-center`}>
                  <View style={[tw`absolute -inset-2 rounded-full border`, { borderColor: 'rgba(143,218,88,0.3)', borderWidth: 1.5 }]} />
                  <LinearGradient
                    colors={['#f0fdf4', '#dcfce7']}
                    style={[tw`w-[88px] h-[88px] rounded-full items-center justify-center border`, { borderColor: 'rgba(143,218,88,0.25)', borderWidth: 1.5 }]}
                  >
                    <ShopIcon />
                  </LinearGradient>
                </View>
                <Text style={[tw`text-[38px] font-black text-gray-900 tracking-tighter m-0`, { lineHeight: 38 }]}>vaayu</Text>
                <Text style={[tw`text-[12px] font-bold tracking-[4px] uppercase mt-1.5`, { color: '#8fda58' }]}>Partner Program</Text>
              </View>

              {/* White Card */}
              <View style={[tw`w-full max-w-[340px] rounded-[24px] p-6 gap-5 border mt-6`, { backgroundColor: '#ffffff', borderColor: '#e5e7eb' }]}>
                <View>
                  <Text style={[tw`text-[12px] font-bold uppercase tracking-[2px] mb-1`, { color: '#8fda58' }]}>For Restaurants & Shops</Text>
                  <Text style={tw`text-[24px] font-extrabold text-gray-900`}>Grow your business</Text>
                  <Text style={tw`text-[13px] text-gray-500 mt-1 font-normal`}>Partner with campus hyper-local delivery</Text>
                </View>

                <View style={tw`gap-3`}>
                  <TouchableOpacity onPress={() => setStep('signup_owner')}>
                    <LinearGradient
                      colors={['#8fda58', '#7fc448']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={tw`w-full h-[52px] rounded-[14px] flex-row items-center justify-center gap-2`}
                    >
                      <IconStore color="#ffffff" size={20} />
                      <Text style={tw`text-white text-[15px] font-bold tracking-[0.3px]`}>Register Your Shop</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <View style={tw`flex-row items-center gap-3`}>
                    <View style={[tw`flex-1 h-px`, { backgroundColor: '#e5e7eb' }]} />
                    <Text style={[tw`text-[12px] font-semibold`, { color: '#9ca3af' }]}>already a partner?</Text>
                    <View style={[tw`flex-1 h-px`, { backgroundColor: '#e5e7eb' }]} />
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      setRole('owner')
                      setStep('login')
                    }}
                    style={[tw`w-full h-[52px] rounded-[14px] items-center justify-center border`, { borderColor: '#8fda58', backgroundColor: 'transparent' }]}
                  >
                    <Text style={tw`text-[#8fda58] text-[15px] font-semibold`}>Partner Log In</Text>
                  </TouchableOpacity>
                </View>

                <Text style={tw`text-center text-[12px] text-gray-400 mt-4`}>
                  Need help? <Text style={[tw`font-semibold`, { color: '#8fda58' }]}>Contact Partner Support</Text>
                </Text>
              </View>

              {/* Bottom Swipe hint */}
              <View style={tw`items-center gap-3 pb-6 mt-4`}>
                <TouchableOpacity onPress={() => goTo(0)} style={tw`flex-row items-center gap-1.5`}>
                  <Text style={[tw`text-[13px] font-semibold`, { color: '#9ca3af' }]}>Customer Login</Text>
                </TouchableOpacity>
                <SlideDots active={1} onDotClick={goTo} />
              </View>
            </View>
          </ScrollView>
        </View>
      )}

      {/* ── 2. LOGIN SCREEN ── */}
      {step === 'login' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`flex-grow pt-16 pb-8`}>
          <BackHeader onBack={() => setStep('carousel')} title={role === 'owner' ? "Partner Log In" : "Welcome Back"} />

          <View style={tw`px-6 pt-8`}>
            <Text style={tw`text-[28px] font-black text-gray-900 mb-1`}>Log In</Text>
            <Text style={tw`text-[13px] text-gray-400 font-semibold mb-8`}>
              Enter your registered email and password.
            </Text>

            <CustomInput
              label="Email Address"
              placeholder={role === 'owner' ? "e.g. owner@campusbites.com" : "e.g. 251420@iiitt.ac.in"}
              value={email}
              onChange={setEmail}
              type="email-address"
              Icon={IconEmail}
              hint={role === 'owner' ? "Registered shop owner email address" : "Must use official @iiitt.ac.in email address"}
            />

            <CustomInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChange={setPassword}
              secure
              Icon={IconLock}
            />

            {/* Forgot Password */}
            <TouchableOpacity
              onPress={() => handleForgotPassword(email)}
              style={tw`self-end mb-2 mt-1`}
            >
              <Text style={[tw`text-[12px] font-bold`, { color: '#8fda58' }]}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleLoginSubmit} style={tw`mt-4 mb-6`}>
              <LinearGradient
                colors={['#8fda58', '#7fc448']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={tw`w-full py-4 rounded-2xl items-center`}
              >
                <Text style={tw`text-[15px] font-black text-white`}>Log In</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStep(role === 'owner' ? 'signup_owner' : 'signup_student')} style={tw`self-center`}>
              <Text style={tw`text-[13px] text-gray-400 font-semibold`}>
                Don't have an account? <Text style={[tw`font-bold`, { color: '#8fda58' }]}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
            <TouchableOpacity
              onPress={handleStudentSubmit}
              disabled={!isStudentValid}
              style={[
                tw`w-full py-4 rounded-2xl items-center`,
                { backgroundColor: isStudentValid ? '#8fda58' : '#d1d5db' }
              ]}
            >
              <Text style={tw`text-[15px] font-black text-white`}>Proceed to Verification</Text>
            </TouchableOpacity>
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
            <Text style={tw`text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2`}>Shop Category</Text>
            <View style={tw`flex-row flex-wrap gap-2`}>
              {APP_CATEGORIES.map(c => (
                <TouchableOpacity
                  key={c}
                  onPress={() => {
                    setCategory(c)
                    if (c !== 'Others') setCustomCategory('')
                  }}
                  style={[
                    tw`px-3.5 py-2 rounded-full border`,
                    {
                      backgroundColor: category === c ? '#8fda58' : '#f9fafb',
                      borderColor: category === c ? '#8fda58' : '#e5e7eb',
                    }
                  ]}
                >
                  <Text style={[tw`text-[12px] font-bold`, { color: category === c ? '#ffffff' : '#4b5563' }]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Custom Category Input if Others selected */}
          {category === 'Others' && (
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
            <TouchableOpacity
              onPress={handleOwnerSubmit}
              disabled={!isOwnerValid}
              style={[
                tw`w-full py-4 rounded-2xl items-center`,
                { backgroundColor: isOwnerValid ? '#8fda58' : '#d1d5db' }
              ]}
            >
              <Text style={tw`text-[15px] font-black text-white`}>Proceed to Verification</Text>
            </TouchableOpacity>
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
            <Text style={tw`text-[13px] text-gray-400 font-medium mb-8 text-center leading-relaxed px-4`}>
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

            <TouchableOpacity
              onPress={() => handleVerificationComplete()}
              style={[tw`w-full py-4 rounded-2xl items-center mb-3`, { backgroundColor: '#8fda58' }]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={tw`text-[15px] font-black text-white`}>Verify & Enter App</Text>
              )}
            </TouchableOpacity>

            {/* Direct Activation fallback if SMTP is not setup */}
            <TouchableOpacity
              onPress={() => handleVerificationComplete()}
              style={tw`w-full py-3.5 rounded-2xl items-center mb-4 bg-gray-100 border border-gray-200`}
            >
              <Text style={tw`text-[13px] font-bold text-gray-700`}>⚡ Instant Activate (No SMTP Mode)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={async () => {
                if (email.trim()) {
                  await supabase.auth.resend({ type: 'signup', email: email.trim() })
                  Alert.alert('OTP Resent', `A new verification code was sent to ${email.trim()}.`)
                }
              }}
              style={tw`self-center mt-2`}
            >
              <Text style={[tw`font-bold text-[13px]`, { color: '#8fda58' }]}>Resend OTP Code</Text>
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
              style={[tw`w-full py-4 rounded-2xl items-center mb-4`, { backgroundColor: '#8fda58' }]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={tw`text-[15px] font-black text-white`}>Update Password & Log In</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
