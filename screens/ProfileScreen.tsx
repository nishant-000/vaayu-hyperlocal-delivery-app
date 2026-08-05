import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Image, TextInput, Linking, Platform, Alert, ActivityIndicator, StatusBar as RNStatusBar } from 'react-native'
import tw from 'twrnc'
import Svg, { Path, Polyline, Line } from 'react-native-svg'
import { supabase } from '../lib/supabase'

// Hosted PDF URL — served from web app's /public/ or GitHub raw
const VAAYU_TERMS_PDF_URL = Platform.OS === 'web'
  ? '/vaayu-support.pdf'
  : 'https://raw.githubusercontent.com/nishant-000/vaayu-hyperlocal-delivery-app/main/vaayu%20support.pdf'

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1624918479892-3e5df2910410?w=200&h=200&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&auto=format',
]

function ChevronRight() {
  return (
    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="9 18 15 12 9 6"/>
    </Svg>
  )
}

function BackHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={[tw`flex-row items-center bg-white border-b border-gray-100 px-4 pb-4`, { paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + 12 : 24 }]}>
      <TouchableOpacity onPress={onBack} style={tw`p-2 -ml-2 rounded-full bg-gray-100 mr-3`}>
        <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <Line x1="19" y1="12" x2="5" y2="12" />
          <Polyline points="12 19 5 12 12 5" />
        </Svg>
      </TouchableOpacity>
      <Text style={tw`text-[20px] font-black text-gray-900`}>{title}</Text>
    </View>
  )
}

interface ProfileScreenProps {
  user: any
  address?: any
  setAddress?: any
  savedShops?: any
  onSignOut: () => void
}

export default function ProfileScreen({ user, onSignOut }: ProfileScreenProps) {
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState(AVATAR_OPTIONS[0])
  const [showPhotoPicker, setShowPhotoPicker] = useState(false)

  // Edit profile state initialized directly from logged in user data without fake hardcoded fallbacks
  const [name, setName] = useState<string>(user?.full_name || (user?.name && user.name !== user?.email?.split('@')[0] ? user.name : ''))
  const [email] = useState<string>(user?.email || '')
  const [phone, setPhone] = useState<string>(user?.phone_number || '')
  const [hostel] = useState('IIIT Tiruchirappalli')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  // Auto-fetch fresh profile details directly from Supabase profiles table on mount
  useEffect(() => {
    async function loadLiveProfile() {
      const userEmail = user?.email || email
      if (!userEmail) {
        setIsLoadingProfile(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, phone_number')
          .ilike('email', userEmail.trim())
          .order('created_at', { ascending: false })
          .limit(1)

        if (!error && data && data.length > 0) {
          const p = data[0]
          if (p.full_name) setName(p.full_name)
          if (p.phone_number) setPhone(p.phone_number)
        }
      } catch (e) {
        console.error('Failed to load profile data', e)
      } finally {
        setIsLoadingProfile(false)
      }
    }

    loadLiveProfile()
  }, [user, email])

  // Security state
  const [currentPass, setCurrentPass] = useState('')
  const [newPass, setNewPass] = useState('')

  // Rating state
  const [rating, setRating] = useState(5)
  const [feedback, setFeedback] = useState('')

  // Toast alert
  const [toast, setToast] = useState<string | null>(null)
  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  // ── SUB-SCREENS ─────────────────────────────────────────────────────────────

  // 1. Edit Profile Screen
  if (activeModal === 'Edit profile') {
    const displayName = user?.name || user?.full_name || name || 'User'
    return (
      <View style={tw`flex-1 bg-gray-50`}>
        <BackHeader title="Edit Profile" onBack={() => setActiveModal(null)} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`p-4 pb-20`}>
          <View style={tw`items-center my-4`}>
            <View style={tw`w-24 h-24 rounded-3xl bg-emerald-700 items-center justify-center mb-2 shadow-sm`}>
              <Text style={tw`text-3xl font-black text-white`}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={tw`text-[16px] font-black text-gray-900`}>{displayName}</Text>
            <Text style={tw`text-[12px] text-gray-400 font-medium`}>{user?.email || email}</Text>
          </View>

          <View style={tw`bg-white rounded-3xl p-5 gap-4 shadow-sm mb-6`}>
            <View>
              <Text style={tw`text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5`}>Full Name</Text>
              <TextInput value={name} onChangeText={setName} style={tw`bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-[14px] font-medium text-gray-800`} />
            </View>

            {/* Read-Only College Email */}
            <View>
              <View style={tw`flex-row items-center justify-between mb-1.5`}>
                <Text style={tw`text-[11px] font-bold text-gray-400 uppercase tracking-wider`}>College Email</Text>
                <View style={tw`bg-gray-100 px-2 py-0.5 rounded-md flex-row items-center gap-1`}>
                  <Text style={tw`text-[10px]`}>🔒</Text>
                  <Text style={tw`text-[9px] font-bold text-gray-500`}>Locked Domain</Text>
                </View>
              </View>
              <View style={tw`bg-gray-100 border border-gray-200 rounded-2xl px-4 py-3 opacity-80`}>
                <Text style={tw`text-[14px] font-bold text-gray-600`}>{email}</Text>
              </View>
            </View>

            <View>
              <Text style={tw`text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5`}>Phone Number</Text>
              <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={tw`bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-[14px] font-medium text-gray-800`} />
            </View>

            {/* Read-Only Default Delivery Location */}
            <View>
              <View style={tw`flex-row items-center justify-between mb-1.5`}>
                <Text style={tw`text-[11px] font-bold text-gray-400 uppercase tracking-wider`}>Default Delivery Location</Text>
                <View style={tw`bg-gray-100 px-2 py-0.5 rounded-md flex-row items-center gap-1`}>
                  <Text style={tw`text-[10px]`}>🔒</Text>
                  <Text style={tw`text-[9px] font-bold text-gray-500`}>Fixed Campus Address</Text>
                </View>
              </View>
              <View style={tw`bg-gray-100 border border-gray-200 rounded-2xl px-4 py-3 opacity-80`}>
                <Text style={tw`text-[14px] font-bold text-gray-600`}>{hostel}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            disabled={isSavingProfile}
            onPress={async () => {
              setIsSavingProfile(true)
              try {
                if (user?.id) {
                  await supabase
                    .from('profiles')
                    .update({ full_name: name.trim(), phone_number: phone.trim() })
                    .eq('id', user.id)
                }
                showToast("Profile details updated successfully!")
                setActiveModal(null)
              } catch (e) {
                showToast("Saved locally")
                setActiveModal(null)
              } finally {
                setIsSavingProfile(false)
              }
            }}
            style={[tw`w-full py-4 rounded-2xl items-center flex-row justify-center gap-2`, { backgroundColor: '#8fda58' }]}
          >
            {isSavingProfile ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={tw`text-[15px] font-black text-white`}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    )
  }

  // 2. Privacy & Security Screen (2FA Removed)
  if (activeModal === 'Privacy & security') {
    return (
      <View style={tw`flex-1 bg-gray-50`}>
        <BackHeader title="Privacy & Security" onBack={() => setActiveModal(null)} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`p-4 pb-20`}>
          <Text style={tw`text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-1`}>Change Password</Text>
          <View style={tw`bg-white rounded-3xl p-5 gap-4 shadow-sm mb-6`}>
            <View>
              <Text style={tw`text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5`}>Current Password</Text>
              <TextInput secureTextEntry placeholder="Enter current password" value={currentPass} onChangeText={setCurrentPass} style={tw`bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-[14px] font-medium text-gray-800`} />
            </View>

            <View>
              <Text style={tw`text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5`}>New Password</Text>
              <TextInput secureTextEntry placeholder="Min 6 characters" value={newPass} onChangeText={setNewPass} style={tw`bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-[14px] font-medium text-gray-800`} />
            </View>

            <TouchableOpacity
              disabled={isUpdatingPassword}
              onPress={async () => {
                if (!currentPass || !newPass) {
                  Alert.alert('Required Fields', 'Please enter your current password and new password.')
                  return
                }
                if (currentPass === newPass) {
                  Alert.alert('Invalid New Password', 'Your new password cannot be the same as your current password. Please choose a different password.')
                  return
                }
                if (newPass.length < 6) {
                  Alert.alert('Weak Password', 'New password must be at least 6 characters long.')
                  return
                }
                setIsUpdatingPassword(true)
                try {
                  const { error } = await supabase.auth.updateUser({ password: newPass })
                  if (error) {
                    Alert.alert('Password Update Error', error.message)
                  } else {
                    showToast("Password updated successfully!")
                    setCurrentPass('')
                    setNewPass('')
                  }
                } finally {
                  setIsUpdatingPassword(false)
                }
              }}
              style={[tw`w-full py-3.5 rounded-2xl items-center justify-center flex-row gap-2 mt-2`, { backgroundColor: '#8fda58' }]}
            >
              {isUpdatingPassword ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={tw`text-[14px] font-black text-white`}>Update Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    )
  }

  // 3. Help & Support Screen
  if (activeModal === 'Help & support') {
    return (
      <View style={tw`flex-1 bg-gray-50`}>
        <BackHeader title="Help & Support" onBack={() => setActiveModal(null)} />
        <View style={tw`flex-1 p-6 items-center justify-center`}>
          <View style={tw`w-20 h-20 rounded-3xl bg-emerald-50 items-center justify-center mb-5 border border-emerald-100`}>
            <Text style={tw`text-4xl`}>✉️</Text>
          </View>
          <Text style={tw`text-[22px] font-black text-gray-900 mb-2 text-center`}>Help & Support</Text>
          <Text style={tw`text-[13px] text-gray-400 font-medium text-center mb-6 px-4`}>
            Have questions, feedback, or need assistance with an order? Contact us directly via email:
          </Text>

          <TouchableOpacity
            onPress={() => {
              Linking.openURL('mailto:vaayu.support@gmail.com')
              showToast("Opening mail app...")
            }}
            activeOpacity={0.85}
            style={tw`w-full bg-white border border-gray-200 rounded-3xl p-5 items-center justify-center shadow-xs flex-row gap-3`}
          >
            <Text style={tw`text-2xl`}>📧</Text>
            <Text style={tw`text-[16px] font-black text-gray-900`}>vaayu.support@gmail.com</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // 4. Rate the App Modal
  if (activeModal === 'Rate the app') {
    return (
      <View style={tw`flex-1 bg-gray-50`}>
        <BackHeader title="Rate Vaayu" onBack={() => setActiveModal(null)} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`p-6 items-center`}>
          <Text style={tw`text-5xl my-4`}>⭐</Text>
          <Text style={tw`text-[22px] font-black text-gray-900 mb-1 text-center`}>Enjoying Vaayu?</Text>
          <Text style={tw`text-[13px] text-gray-400 font-medium text-center mb-6`}>Tap stars to give your rating</Text>

          <View style={tw`flex-row gap-3 mb-6`}>
            {[1, 2, 3, 4, 5].map(star => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Text style={tw`text-3xl`}>{star <= rating ? '⭐' : '☆'}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            placeholder="Share your thoughts or suggestions..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={4}
            value={feedback}
            onChangeText={setFeedback}
            style={tw`w-full bg-white border border-gray-200 rounded-2xl p-4 text-[13px] text-gray-800 mb-6 min-h-[100px]`}
          />

          <TouchableOpacity
            onPress={() => {
              showToast("Thank you for your feedback! ❤️")
              setActiveModal(null)
            }}
            style={[tw`w-full py-4 rounded-2xl items-center`, { backgroundColor: '#8fda58' }]}
          >
            <Text style={tw`text-[15px] font-black text-white`}>Submit Review</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    )
  }

  // 5. Terms & Privacy Screen
  if (activeModal === 'Terms & privacy') {
    return (
      <View style={tw`flex-1 bg-gray-50`}>
        <BackHeader title="Terms & Privacy Policy" onBack={() => setActiveModal(null)} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`p-4 pb-20 gap-4`}>

          {/* Header Card */}
          <View style={tw`bg-[#1a3a2a] rounded-3xl p-5`}>
            <Text style={tw`text-[22px] font-black text-white tracking-tight`}>VAAYU</Text>
            <Text style={tw`text-[13px] font-bold text-white/80 mt-0.5`}>Terms and Conditions & Privacy Policy</Text>
            <Text style={tw`text-[11px] text-white/60 font-medium mt-2 leading-relaxed`}>
              Campus grocery and essentials delivery for IIIT Trichy. Please read the guidelines below to ensure smooth ordering and delivery for everyone.
            </Text>
          </View>

          {/* Delivery Methods */}
          <View style={tw`bg-white rounded-3xl p-5 gap-3 shadow-sm`}>
            <Text style={tw`text-[15px] font-black text-gray-900`}>🚚 Delivery Methods & Timings</Text>

            <View style={tw`bg-blue-50 rounded-2xl p-4 border border-blue-100`}>
              <Text style={tw`text-[13px] font-black text-blue-900 mb-1`}>📅 Scheduled Delivery</Text>
              <Text style={tw`text-[12px] text-blue-800 font-medium leading-relaxed`}>
                We offer 2 daily delivery slots for grouped (bulk) orders:{'\n'}
                • <Text style={tw`font-bold`}>Lunch Slot (Slot 1):</Text> 12:40 PM – 1:40 PM{'\n'}
                • <Text style={tw`font-bold`}>Dinner Slot (Slot 2):</Text> 8:00 PM – 9:00 PM{'\n\n'}
                Delivery Fee: ₹5 on orders under ₹150.{'\n'}
                <Text style={tw`font-black text-green-800`}>FREE Delivery on all orders ₹150 and above!</Text>
              </Text>
            </View>

            <View style={tw`bg-purple-50 rounded-2xl p-4 border border-purple-100`}>
              <Text style={tw`text-[13px] font-black text-purple-900 mb-1`}>⚡ Instant Delivery</Text>
              <Text style={tw`text-[12px] text-purple-800 font-medium leading-relaxed`}>
                Need your groceries urgently? Choose Instant Delivery to receive your order at the main gate within 20 minutes of confirmation.{'\n\n'}
                Delivery Fee: <Text style={tw`font-black`}>₹10 per order (always applies, no free delivery)</Text>
              </Text>
            </View>

            <View style={tw`bg-gray-50 rounded-2xl p-3 border border-gray-100`}>
              <Text style={tw`text-[12px] font-bold text-gray-700`}>📍 Delivery Location</Text>
              <Text style={tw`text-[12px] text-gray-500 font-medium mt-1`}>
                All deliveries are made only to the <Text style={tw`font-bold text-gray-800`}>IIIT Trichy Main Gate</Text>. Please collect your order on time.
              </Text>
            </View>
          </View>

          {/* Order Process */}
          <View style={tw`bg-white rounded-3xl p-5 gap-2 shadow-sm`}>
            <Text style={tw`text-[15px] font-black text-gray-900 mb-1`}>📋 Order Process & Cancellations</Text>
            {[
              'Choose the delivery type and timing before confirming.',
              'Once confirmed, orders cannot be modified or cancelled.',
              'You will receive a phone call once your order arrives.',
              'For bulk orders, please pick up promptly to avoid crowding.',
            ].map((item, i) => (
              <Text key={i} style={tw`text-[12px] text-gray-600 font-medium leading-relaxed`}>• {item}</Text>
            ))}
          </View>

          {/* Payment */}
          <View style={tw`bg-white rounded-3xl p-5 gap-2 shadow-sm`}>
            <Text style={tw`text-[15px] font-black text-gray-900 mb-1`}>💳 Payment & Fees</Text>
            <Text style={tw`text-[12px] text-gray-600 font-medium leading-relaxed`}>• Payment must be made immediately upon receiving your order.</Text>
            <Text style={tw`text-[12px] text-gray-600 font-medium leading-relaxed`}>• All item prices and delivery fees will be clearly shown before payment.</Text>
          </View>

          {/* Replacement */}
          <View style={tw`bg-white rounded-3xl p-5 gap-2 shadow-sm`}>
            <Text style={tw`text-[15px] font-black text-gray-900 mb-1`}>🔄 Replacement Policy</Text>
            <Text style={tw`text-[12px] text-gray-600 font-medium leading-relaxed`}>• If you receive a damaged, expired, or unusable product, report it immediately at the time of pickup.</Text>
            <Text style={tw`text-[12px] text-gray-600 font-medium leading-relaxed`}>• The item will be exchanged in the next available delivery slot, at no extra cost.</Text>
            <Text style={tw`text-[12px] text-red-600 font-bold leading-relaxed`}>• Replacement is only applicable if the issue is confirmed at time of delivery — claims made later will not be accepted.</Text>
          </View>

          {/* Uncollected Orders */}
          <View style={tw`bg-red-50 rounded-3xl p-5 gap-2 shadow-sm border border-red-100`}>
            <Text style={tw`text-[15px] font-black text-red-900 mb-1`}>⚠️ Uncollected Orders Policy</Text>
            <Text style={tw`text-[12px] text-red-800 font-medium leading-relaxed`}>• <Text style={tw`font-bold`}>1st occurrence:</Text> A warning will be issued.</Text>
            <Text style={tw`text-[12px] text-red-800 font-medium leading-relaxed`}>• <Text style={tw`font-bold`}>2nd occurrence:</Text> A ₹50 penalty will be added to your next order.</Text>
            <Text style={tw`text-[12px] text-red-800 font-bold leading-relaxed`}>• <Text style={tw`font-black`}>3rd occurrence:</Text> You will be permanently banned from VAAYU services.</Text>
            <Text style={tw`text-[12px] text-red-700 font-medium leading-relaxed`}>• Items remaining uncollected for a long duration may no longer be usable or refundable. VAAYU will not be responsible for reimbursement.</Text>
          </View>

          {/* User Conduct */}
          <View style={tw`bg-white rounded-3xl p-5 gap-2 shadow-sm`}>
            <Text style={tw`text-[15px] font-black text-gray-900 mb-1`}>🤝 User Conduct Guidelines</Text>
            <Text style={tw`text-[12px] text-gray-600 font-medium leading-relaxed`}>• Please treat delivery partners and support staff respectfully.</Text>
            <Text style={tw`text-[12px] text-gray-600 font-medium leading-relaxed`}>• Misuse of service, rude behavior, or fraud may result in service suspension.</Text>
          </View>

          {/* Privacy Policy */}
          <View style={tw`bg-white rounded-3xl p-5 gap-2 shadow-sm`}>
            <Text style={tw`text-[15px] font-black text-gray-900 mb-1`}>🔒 Privacy Policy</Text>
            <Text style={tw`text-[12px] text-gray-600 font-medium leading-relaxed`}>• We collect your name, contact details, and order information to process deliveries efficiently.</Text>
            <Text style={tw`text-[12px] text-gray-600 font-medium leading-relaxed`}>• Your data is used only for service improvement and communication.</Text>
            <Text style={tw`text-[12px] text-gray-600 font-bold leading-relaxed`}>• We never sell or share your data with external parties.</Text>
            <Text style={tw`text-[12px] text-gray-600 font-medium leading-relaxed`}>• You may request account deletion at any time; however, some data may be retained for legal purposes.</Text>
          </View>

          {/* Service Limitations */}
          <View style={tw`bg-white rounded-3xl p-5 gap-2 shadow-sm`}>
            <Text style={tw`text-[15px] font-black text-gray-900 mb-1`}>ℹ️ Service Limitations & Disclaimers</Text>
            <Text style={tw`text-[12px] text-gray-600 font-medium leading-relaxed`}>• While we aim to deliver on time, delays may occur due to vendor availability, traffic, or technical issues.</Text>
            <Text style={tw`text-[12px] text-gray-600 font-medium leading-relaxed`}>• Services may be temporarily unavailable during system maintenance.</Text>
          </View>

          {/* Policy Updates */}
          <View style={tw`bg-white rounded-3xl p-5 gap-2 shadow-sm`}>
            <Text style={tw`text-[15px] font-black text-gray-900 mb-1`}>🔔 Policy Updates</Text>
            <Text style={tw`text-[12px] text-gray-600 font-medium leading-relaxed`}>
              We may update these terms occasionally. We will notify you of any important changes directly through the app. Continued use of VAAYU means you accept the latest terms.
            </Text>
          </View>

          {/* Contact */}
          <View style={tw`bg-[#1a3a2a] rounded-3xl p-5`}>
            <Text style={tw`text-[14px] font-black text-white mb-1`}>📬 Need Help?</Text>
            <Text style={tw`text-[12px] text-white/80 font-medium leading-relaxed`}>
              Feel free to message us anytime for support. We're here to make grocery delivery simple, affordable, and reliable on campus!
            </Text>
            <View style={tw`mt-3 bg-white/10 rounded-2xl px-4 py-3`}>
              <Text style={tw`text-[12px] font-black text-white`}>✉️  vaayu.support@gmail.com</Text>
            </View>
          </View>

        </ScrollView>
      </View>
    )
  }

  // ── MAIN PROFILE SCREEN ──────────────────────────────────────────────────────

  const menuSections = [
    {
      title: 'Account',
      items: [
        { icon: '👤', label: 'Edit profile', sub: 'Name, phone, email' },
      ],
    },
    {
      title: 'Support & Feedback',
      items: [
        { icon: '💬', label: 'Help & support', sub: 'vaayu.support@gmail.com' },
        { icon: '⭐', label: 'Rate the app', sub: 'Share your feedback' },
        { icon: '📄', label: 'Terms & privacy', sub: 'Official terms' },
      ],
    },
  ]

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      {/* Toast Alert */}
      {toast && (
        <View style={[tw`absolute top-4 left-4 right-4 z-50 rounded-full px-4 py-3 shadow-lg justify-center items-center`, { backgroundColor: '#8fda58' }]}>
          <Text style={tw`text-white text-xs font-bold text-center`}>{toast}</Text>
        </View>
      )}

      {/* Header */}
      <View style={[tw`bg-white border-b border-gray-100 px-4 pb-4`, { paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + 12 : 24 }]}>
        <Text style={tw`text-[24px] font-black text-gray-900`}>Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-32`}>
        {/* Profile card */}
        {(() => {
          const emailPrefix = (email || user?.email || '').split('@')[0]
          const displayName = (name && name !== emailPrefix) 
            ? name 
            : (user?.full_name && user.full_name !== emailPrefix) 
            ? user.full_name 
            : (user?.name && user.name !== emailPrefix) 
            ? user.name 
            : (name || emailPrefix || 'Campus Student')

          const displayPhone = phone || user?.phone_number || ''

          return (
            <View style={tw`mx-4 mt-4 bg-white rounded-3xl p-4 shadow-sm`}>
              <View style={tw`flex-row items-center gap-4`}>
                <View style={tw`w-16 h-16 rounded-2xl bg-emerald-700 items-center justify-center shadow-xs`}>
                  <Text style={tw`text-2xl font-black text-white`}>
                    {displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={tw`flex-1 min-w-0`}>
                  <Text style={tw`text-[18px] font-black text-gray-900`}>{displayName}</Text>
                  <Text style={tw`text-[12px] text-gray-400 font-medium`}>{user?.email || email}</Text>
                  {displayPhone ? (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`tel:${displayPhone}`)}
                      activeOpacity={0.7}
                      style={tw`flex-row items-center gap-1 mt-1`}
                    >
                      <Text style={tw`text-[12px] text-emerald-800 font-bold`}>📱 {displayPhone}</Text>
                    </TouchableOpacity>
                  ) : null}
                  <View style={tw`flex-row items-center gap-1.5 mt-1.5`}>
                    <View style={tw`w-1.5 h-1.5 rounded-full bg-green-500`} />
                    <Text style={tw`text-[11px] text-green-600 font-semibold`}>Campus verified</Text>
                  </View>
                </View>
              </View>
            </View>
          )
        })()}

        {/* Optional Soft Profile Completion Banner */}
        {(!phone || !name || name === (email || user?.email || '').split('@')[0]) && (
          <TouchableOpacity
            onPress={() => setActiveModal('Edit profile')}
            style={tw`mx-4 mt-3 bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex-row items-center justify-between shadow-xs`}
          >
            <View style={tw`flex-row items-center gap-3 flex-1`}>
              <Text style={tw`text-xl`}>💡</Text>
              <View style={tw`flex-1`}>
                <Text style={tw`text-[13px] font-bold text-amber-900`}>Complete Your Profile</Text>
                <Text style={tw`text-[11px] text-amber-700 font-medium`}>Tap here to add your name & mobile number for delivery updates.</Text>
              </View>
            </View>
            <Text style={tw`text-[12px] font-black text-amber-800 ml-2`}>Edit ›</Text>
          </TouchableOpacity>
        )}

        {/* Menu sections */}
        {menuSections.map(section => (
          <View key={section.title} style={tw`mx-4 mt-3 bg-white rounded-3xl shadow-sm overflow-hidden`}>
            <Text style={tw`px-4 pt-3 pb-1 text-[11px] font-bold text-gray-400 uppercase tracking-widest`}>{section.title}</Text>
            {section.items.map((item, i) => (
              <TouchableOpacity
                key={item.label}
                onPress={() => {
                  if (item.label === 'Terms & privacy') {
                    Linking.openURL(VAAYU_TERMS_PDF_URL)
                  } else {
                    setActiveModal(item.label)
                  }
                }}
                style={tw`flex-row items-center gap-3 px-4 py-3 ${i < section.items.length - 1 ? 'border-b border-gray-50' : ''}`}
              >
                <View style={tw`w-9 h-9 rounded-xl bg-gray-100 items-center justify-center text-lg`}>
                  <Text>{item.icon}</Text>
                </View>
                <View style={tw`flex-1 min-w-0`}>
                  <Text style={tw`text-[13px] font-bold text-gray-800`}>{item.label}</Text>
                  {item.sub ? <Text style={tw`text-[11px] text-gray-400 font-medium`}>{item.sub}</Text> : null}
                </View>
                <ChevronRight />
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Sign out */}
        <View style={tw`mx-4 mt-4`}>
          <TouchableOpacity
            onPress={onSignOut}
            style={tw`w-full py-3.5 rounded-2xl items-center justify-center bg-red-50`}
          >
            <Text style={tw`text-[14px] font-bold text-red-500`}>Sign out</Text>
          </TouchableOpacity>
        </View>

        <Text style={tw`text-center text-[11px] text-gray-300 font-medium mt-6`}>Vaayu · A hyper local delivery app</Text>
      </ScrollView>
    </View>
  )
}
