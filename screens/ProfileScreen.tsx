import React, { useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Image, TextInput } from 'react-native'
import tw from 'twrnc'
import Svg, { Path, Polyline, Line } from 'react-native-svg'

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1624918479892-3e5df2910410?w=200&h=200&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&auto=format',
]

const stats = [
  { label: 'Orders', value: '24' },
  { label: 'Saved', value: '8' },
  { label: 'Reviews', value: '12' },
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
    <View style={tw`flex-row items-center bg-white border-b border-gray-100 px-4 pt-6 pb-4`}>
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
  onSignOut: () => void
}

export default function ProfileScreen({ user, onSignOut }: ProfileScreenProps) {
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState(AVATAR_OPTIONS[0])
  const [showPhotoPicker, setShowPhotoPicker] = useState(false)

  // Edit profile state
  const [name, setName] = useState(user?.name || 'Aditya Sharma')
  const [email] = useState(user?.email || '251420@iiitt.ac.in')
  const [phone, setPhone] = useState(user?.phoneNumber || '+91 98765 43210')
  const [hostel] = useState('IIIT Tiruchirappalli, Gate 1')

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
    return (
      <View style={tw`flex-1 bg-gray-50`}>
        <BackHeader title="Edit Profile" onBack={() => setActiveModal(null)} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`p-4 pb-20`}>
          <View style={tw`items-center my-4`}>
            <View style={tw`w-24 h-24 rounded-3xl bg-emerald-700 items-center justify-center mb-2 shadow-sm`}>
              <Text style={tw`text-3xl font-black text-white`}>
                {(user?.name || name || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={tw`text-[16px] font-black text-gray-900`}>{user?.name || name}</Text>
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
            onPress={() => {
              showToast("Profile details updated successfully!")
              setActiveModal(null)
            }}
            style={[tw`w-full py-4 rounded-2xl items-center`, { backgroundColor: '#8fda58' }]}
          >
            <Text style={tw`text-[15px] font-black text-white`}>Save Changes</Text>
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
              onPress={() => {
                showToast("Password updated successfully!")
                setCurrentPass('')
                setNewPass('')
              }}
              style={[tw`w-full py-3.5 rounded-2xl items-center mt-2`, { backgroundColor: '#8fda58' }]}
            >
              <Text style={tw`text-[14px] font-black text-white`}>Update Password</Text>
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
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`p-4 pb-20`}>
          <Text style={tw`text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-1`}>Contact Us</Text>
          <View style={tw`flex-row gap-3 mb-6`}>
            <TouchableOpacity
              onPress={() => showToast("Starting live chat with support...")}
              style={[tw`flex-1 bg-white p-4 rounded-2xl items-center border border-gray-100 shadow-sm`]}
            >
              <Text style={tw`text-3xl mb-1`}>💬</Text>
              <Text style={tw`text-[13px] font-bold text-gray-900`}>Live Chat</Text>
              <Text style={tw`text-[10px] text-gray-400 font-medium`}>24/7 Available</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => showToast("Email copied: support@iiitt.ac.in")}
              style={[tw`flex-1 bg-white p-4 rounded-2xl items-center border border-gray-100 shadow-sm`]}
            >
              <Text style={tw`text-3xl mb-1`}>✉️</Text>
              <Text style={tw`text-[13px] font-bold text-gray-900`}>Email Support</Text>
              <Text style={tw`text-[10px] text-gray-400 font-medium`}>Response in 1 hr</Text>
            </TouchableOpacity>
          </View>

          <Text style={tw`text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-1`}>Frequently Asked Questions</Text>
          <View style={tw`bg-white rounded-3xl p-4 gap-3 shadow-sm`}>
            <View style={tw`border-b border-gray-50 pb-3`}>
              <Text style={tw`text-[13px] font-bold text-gray-900 mb-1`}>Where does delivery arrive?</Text>
              <Text style={tw`text-[12px] text-gray-500 font-medium`}>All orders deliver directly to IIIT Tiruchirappalli Gate 1 or designated hostel drops.</Text>
            </View>

            <View style={tw`border-b border-gray-50 pb-3`}>
              <Text style={tw`text-[13px] font-bold text-gray-900 mb-1`}>What payment options are available?</Text>
              <Text style={tw`text-[12px] text-gray-500 font-medium`}>Cash on Delivery (COD) and Online UPI payments are supported.</Text>
            </View>

            <View style={tw`pb-1`}>
              <Text style={tw`text-[13px] font-bold text-gray-900 mb-1`}>How do I report an issue with my order?</Text>
              <Text style={tw`text-[12px] text-gray-500 font-medium`}>You can tap on Live Chat or track your active order under the Orders tab.</Text>
            </View>
          </View>
        </ScrollView>
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
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`p-5 pb-20`}>
          <View style={tw`bg-white rounded-3xl p-5 gap-4 shadow-sm`}>
            <Text style={tw`text-[15px] font-black text-gray-900`}>1. Service Terms</Text>
            <Text style={tw`text-[12px] text-gray-600 font-medium leading-relaxed`}>
              CampusDeliver provides on-campus order fulfillment for students and partners at IIIT Tiruchirappalli. All orders must comply with institute conduct guidelines.
            </Text>

            <Text style={tw`text-[15px] font-black text-gray-900 pt-2`}>2. Privacy Policy</Text>
            <Text style={tw`text-[12px] text-gray-600 font-medium leading-relaxed`}>
              Student data (roll numbers, emails) is strictly protected and only used for verifying campus membership and delivering orders to Gate 1.
            </Text>
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
        { icon: '🔒', label: 'Privacy & security', sub: 'Password & security' },
      ],
    },
    {
      title: 'Support & Feedback',
      items: [
        { icon: '💬', label: 'Help & support', sub: 'FAQs & live chat' },
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
      <View style={tw`bg-white border-b border-gray-100 px-4 pt-6 pb-4`}>
        <Text style={tw`text-[24px] font-black text-gray-900`}>Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-32`}>
        {/* Profile card */}
        <View style={tw`mx-4 mt-4 bg-white rounded-3xl p-4 shadow-sm`}>
          <View style={tw`flex-row items-center gap-4`}>
            <View style={tw`w-16 h-16 rounded-2xl bg-emerald-700 items-center justify-center shadow-xs`}>
              <Text style={tw`text-2xl font-black text-white`}>
                {(user?.name || name || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={tw`flex-1 min-w-0`}>
              <Text style={tw`text-[18px] font-black text-gray-900`}>{user?.name || name}</Text>
              <Text style={tw`text-[12px] text-gray-400 font-medium`}>{user?.email || email}</Text>
              <View style={tw`flex-row items-center gap-1.5 mt-1.5`}>
                <View style={tw`w-1.5 h-1.5 rounded-full bg-green-500`} />
                <Text style={tw`text-[11px] text-green-600 font-semibold`}>Campus verified</Text>
              </View>
            </View>
          </View>

          {/* Stats */}
          <View style={tw`flex-row mt-4 pt-4 border-t border-gray-100`}>
            {stats.map((s, i) => (
              <View key={s.label} style={[tw`flex-1 items-center`, i < stats.length - 1 ? tw`border-r border-gray-100` : {}]}>
                <Text style={tw`text-[20px] font-black text-gray-900`}>{s.value}</Text>
                <Text style={tw`text-[11px] text-gray-400 font-medium`}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Menu sections */}
        {menuSections.map(section => (
          <View key={section.title} style={tw`mx-4 mt-3 bg-white rounded-3xl shadow-sm overflow-hidden`}>
            <Text style={tw`px-4 pt-3 pb-1 text-[11px] font-bold text-gray-400 uppercase tracking-widest`}>{section.title}</Text>
            {section.items.map((item, i) => (
              <TouchableOpacity
                key={item.label}
                onPress={() => setActiveModal(item.label)}
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
