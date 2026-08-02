import React, { useState, useEffect, useRef } from 'react'
import { StyleSheet, View, Text, TouchableOpacity, Alert, Platform, StatusBar as RNStatusBar, Animated, Easing, Pressable, ScrollView, TextInput, ActivityIndicator } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import tw from 'twrnc'
import Svg, { Path, Circle, Polyline, Line } from 'react-native-svg'

// Import Screens & Icons
import HomeScreen from './screens/HomeScreen'
import CartScreen from './screens/CartScreen'
import OrdersScreen from './screens/OrdersScreen'
import ProfileScreen from './screens/ProfileScreen'
import SignupScreen from './screens/SignupScreen'
import ShopDetailsScreen from './screens/ShopDetailsScreen'
import OwnerDashboard from './screens/OwnerDashboard'
import { BACKEND_URL } from './screens/apiConfig'
import { registerForPushNotifications, checkNotificationPermissionStatus, setupNotificationListeners } from './lib/notifications'
import { PermissionPrePromptModal } from './components/PermissionPrePromptModal'
import { ErrorBoundary } from './components/ErrorBoundary'

type TabId = "home" | "orders" | "cart" | "profile"

function IconHome({ active }: { active: boolean }) {
  const c = active ? "#ffffff" : "#6b7280"
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={active ? c : "none"} stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <Polyline points="9,22 9,12 15,12 15,22" />
    </Svg>
  )
}

function IconBag({ active }: { active: boolean }) {
  const c = active ? "#ffffff" : "#6b7280"
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={active ? c : "none"} stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <Line x1="3" y1="6" x2="21" y2="6" />
      <Path d="M16 10a4 4 0 0 1-8 0" />
    </Svg>
  )
}

function IconCart({ active }: { active: boolean }) {
  const c = active ? "#ffffff" : "#6b7280"
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={active ? c : "none"} stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="9" cy="21" r="1" />
      <Circle cx="20" cy="21" r="1" />
      <Path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </Svg>
  )
}

function IconUser({ active }: { active: boolean }) {
  const c = active ? "#ffffff" : "#6b7280"
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={active ? c : "none"} stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <Circle cx="12" cy="7" r="4" />
    </Svg>
  )
}

const NAV_ITEMS: { id: TabId; label: string; Icon: React.FC<{ active: boolean }>; maxWidth: number }[] = [
  { id: "home",    label: "Home",    Icon: IconHome,    maxWidth: 45 },
  { id: "orders",  label: "Orders",  Icon: IconBag,     maxWidth: 56 },
  { id: "cart",    label: "Cart",    Icon: IconCart,    maxWidth: 35 },
  { id: "profile", label: "Profile", Icon: IconUser,    maxWidth: 52 },
]

function NavTab({
  id, label, Icon, isActive, onPress, maxWidth,
}: {
  id: TabId; label: string
  Icon: React.FC<{ active: boolean }>
  isActive: boolean; onPress: () => void
  maxWidth: number
}) {
  const width  = useRef(new Animated.Value(isActive ? 1 : 0)).current
  const opacity = useRef(new Animated.Value(isActive ? 1 : 0)).current
  const scale  = useRef(new Animated.Value(isActive ? 1 : 0.95)).current
  const translateY = useRef(new Animated.Value(isActive ? -1 : 0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(width, {
        toValue: isActive ? 1 : 0,
        duration: 250,
        easing: Easing.bezier(0.25, 1, 0.5, 1),
        useNativeDriver: false
      }),
      Animated.timing(opacity, {
        toValue: isActive ? 1 : 0,
        duration: 200,
        easing: Easing.bezier(0.25, 1, 0.5, 1),
        useNativeDriver: true
      }),
      Animated.spring(scale, {
        toValue: isActive ? 1 : 0.95,
        useNativeDriver: true,
        tension: 100,
        friction: 12
      }),
      Animated.spring(translateY, {
        toValue: isActive ? -1 : 0,
        useNativeDriver: true,
        tension: 100,
        friction: 12
      }),
    ]).start()
  }, [isActive])

  const labelWidth = width.interpolate({ inputRange: [0, 1], outputRange: [0, maxWidth] })
  const textMarginLeft = width.interpolate({ inputRange: [0, 1], outputRange: [0, 8] })

  return (
    <Pressable onPress={onPress} style={styles.tabPressable}>
      <Animated.View
        style={[
          styles.pill,
          { backgroundColor: isActive ? "#8fda58" : "transparent", transform: [{ scale }] },
        ]}
      >
        <Animated.View style={{ transform: [{ translateY }] }}>
          <Icon active={isActive} />
        </Animated.View>
        <Animated.View style={{ width: labelWidth, marginLeft: textMarginLeft, overflow: "hidden" }}>
          <Animated.Text style={[styles.label, { opacity }]} numberOfLines={1}>
            {label}
          </Animated.Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  )
}

export default function App() {
  // App States
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<TabId>('home')
  const [savedShops, setSavedShops] = useState<Set<number>>(new Set([3]))
  const [selectedShop, setSelectedShop] = useState<any>(null)
  
  // Cart State
  const [cartItems, setCartItems] = useState<any[]>([])
  const [cartShop, setCartShop] = useState<any>(null)

  // Orders State
  const [orders, setOrders] = useState<any[]>([])

  // Profile Address State
  const [address, setAddress] = useState({
    area: "IIIT Tiruchirappalli",
    room: "Gate 1",
    landmark: "Sethurapatti, Trichy"
  })

  // Notifications Pre-Prompt Modal State
  const [showPermissionPrePrompt, setShowPermissionPrePrompt] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  // Profile Completion Modal State
  const [profileNameInput, setProfileNameInput] = useState('')
  const [profilePhoneInput, setProfilePhoneInput] = useState('')

  // Toast / Alert State
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 2500)
  }

  // Push Notifications Setup & Permission Check
  useEffect(() => {
    async function initPush() {
      const status = await checkNotificationPermissionStatus()
      if (status !== 'granted' && Platform.OS !== 'web') {
        setShowPermissionPrePrompt(true)
      } else if (status === 'granted') {
        registerForPushNotifications(user?.id || null, user?.role || 'customer')
      }
    }
    initPush()

    // Notification tap handler (Deep linking)
    const cleanupListeners = setupNotificationListeners((orderId) => {
      showToast(`Opening order #${orderId}`)
      setActiveTab('orders')
    })

    return () => {
      cleanupListeners()
    }
  }, [user])

  const handleAllowNotifications = async () => {
    setShowPermissionPrePrompt(false)
    await registerForPushNotifications(user?.id || null, user?.role || 'customer')
  }

  const handleSkipNotifications = () => {
    setShowPermissionPrePrompt(false)
  }

  // Auth registration handler
  const handleRegisterUser = async (registeredUser: any) => {
    const normalizedUser = {
      ...registeredUser,
      name: registeredUser.name || registeredUser.full_name || '',
      phone_number: registeredUser.phone_number || ''
    }
    setUser(normalizedUser)
    await registerForPushNotifications(registeredUser.id, registeredUser.role)
  }

  // Cart operations
  const addToCart = (item: any, shop: any) => {
    if (cartShop && cartShop.id !== shop.id) {
      Alert.alert(
        "Replace Cart Items?",
        `Your cart has items from ${cartShop.name}. Discard and add from ${shop.name}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Replace",
            onPress: () => {
              setCartItems([{ ...item, quantity: 1, shopId: shop.id, shopName: shop.name }])
              setCartShop(shop)
              showToast("Cart replaced successfully")
            }
          }
        ]
      )
      return
    }

    setCartShop(shop)
    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { ...item, quantity: 1, shopId: shop.id, shopName: shop.name }]
    })
    showToast(`${item.name} added to cart!`)
  }

  const changeQuantity = (itemId: string, diff: number) => {
    setCartItems(prev => {
      const updated = prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity + diff } : i)
      const filtered = updated.filter(i => i.quantity > 0)
      if (filtered.length === 0) {
        setCartShop(null)
      }
      return filtered
    })
  }

  const handlePlaceOrder = (
    finalTotal: number,
    discount: number,
    appliedPromo: string,
    deliveryMode: 'regular' | 'instant',
    selectedSlotId?: string
  ) => {
    setCartItems([])
    setCartShop(null)
    setActiveTab('orders')
    showToast("Order placed successfully via Cash on Delivery!")
  }

  // If user is not logged in, show Signup / Login Screen
  if (!user) {
    return <SignupScreen onDone={handleRegisterUser} onRegister={handleRegisterUser} />
  }

  // If user role is shop_owner or owner or worker, render low-literacy Zomato-partner OwnerDashboard
  if (user?.role === 'shop_owner' || user?.role === 'owner' || user?.role === 'worker') {
    return (
      <View style={[tw`flex-1 bg-gray-100`, styles.safeArea]}>
        <StatusBar style="dark" />
        <OwnerDashboard user={user} onSignOut={() => setUser(null)} />
      </View>
    )
  }

  // Customer App Layout
  return (
    <ErrorBoundary>
      <View style={[tw`flex-1 bg-gray-50`, styles.safeArea]}>
      <StatusBar style="dark" />

      {/* Permission Pre-Prompt Modal */}
      <PermissionPrePromptModal
        visible={showPermissionPrePrompt}
        onAllow={handleAllowNotifications}
        onSkip={handleSkipNotifications}
      />

      {/* Toast Banner */}
      {toastMessage && (
        <View style={tw`absolute top-12 left-4 right-4 z-50 bg-black rounded-2xl p-4 items-center shadow-xl`}>
          <Text style={tw`text-white font-black text-xs text-center`}>✨ {toastMessage}</Text>
        </View>
      )}

      {/* Main Screen Switcher */}
      {selectedShop ? (
        <ShopDetailsScreen
          shop={selectedShop}
          cartItems={cartItems}
          onBack={() => setSelectedShop(null)}
          onAddToCart={addToCart}
          onChangeQuantity={changeQuantity}
          onViewCart={() => {
            setSelectedShop(null)
            setActiveTab('cart')
          }}
        />
      ) : (
        <>
          {activeTab === 'home' && (
            <HomeScreen
              onSelectShop={setSelectedShop}
              cartItems={cartItems}
              onOpenCart={() => setActiveTab('cart')}
              onOpenNotifications={() => setShowNotifications(true)}
              address={address}
              onOpenAddressPicker={() => setActiveTab('profile')}
            />
          )}

          {activeTab === 'orders' && (
            <OrdersScreen
              orders={orders}
              onReorder={(order) => {
                showToast("Items added from previous order!")
                setActiveTab('cart')
              }}
              onTrackOrder={(order) => {
                showToast(`Tracking #${order.id}`)
              }}
              user={user}
            />
          )}

          {activeTab === 'cart' && (
            <CartScreen
              cartItems={cartItems}
              cartShop={cartShop}
              changeQuantity={changeQuantity}
              placeOrder={handlePlaceOrder}
              address={address}
              setAddress={setAddress}
              onContinueShopping={() => setActiveTab('home')}
              user={user}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileScreen
              user={user}
              address={address}
              setAddress={setAddress}
              savedShops={savedShops}
              onSignOut={() => setUser(null)}
            />
          )}

          {/* Bottom Floating Navigation Capsule */}
          <View style={styles.wrapper}>
            <View style={styles.bar}>
              {NAV_ITEMS.map((item) => (
                <NavTab
                  key={item.id}
                  {...item}
                  isActive={activeTab === item.id}
                  onPress={() => setActiveTab(item.id)}
                />
              ))}
            </View>
          </View>
        </>
      )}

      {/* Campus Notifications Drawer */}
      {showNotifications && (
        <View style={tw`absolute inset-0 z-50 bg-black/60 justify-end`}>
          <View style={tw`bg-white rounded-t-3xl p-6 pb-28 gap-4 shadow-2xl`}>
            <View style={tw`flex-row justify-between items-center pb-3 border-b border-gray-100`}>
              <View style={tw`flex-row items-center gap-2`}>
                <Text style={tw`text-2xl`}>🔔</Text>
                <Text style={tw`text-[20px] font-black text-gray-900`}>Notifications</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowNotifications(false)}
                style={tw`w-8 h-8 rounded-full bg-gray-100 items-center justify-center`}
              >
                <Text style={tw`text-gray-500 font-bold text-base`}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Empty state — no real notifications yet */}
            <View style={tw`py-12 items-center justify-center gap-3`}>
              <Text style={tw`text-5xl`}>🔕</Text>
              <Text style={tw`text-[16px] font-black text-gray-800 mt-2`}>No notifications yet</Text>
              <Text style={tw`text-[12px] text-gray-400 font-medium text-center px-6`}>
                Order updates and alerts will appear here when available.
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Complete Profile Modal for existing accounts with missing name/phone */}
      {user && (!user.phone_number || !user.name) && (
        <View style={tw`absolute inset-0 z-50 bg-black/80 items-center justify-center p-6`}>
          <View style={tw`w-full bg-white rounded-3xl p-6 shadow-2xl border border-gray-100`}>
            <View style={tw`items-center mb-4`}>
              <View style={tw`w-14 h-14 rounded-2xl bg-green-100 items-center justify-center mb-2`}>
                <Text style={tw`text-2xl`}>👤</Text>
              </View>
              <Text style={tw`text-[22px] font-black text-gray-900 text-center`}>Complete Your Profile</Text>
              <Text style={tw`text-[12px] text-gray-500 font-medium text-center mt-1 px-2 leading-relaxed`}>
                Please enter your real full name and mobile phone number to continue using Vaayu.
              </Text>
            </View>

            <Text style={tw`text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5`}>Full Name</Text>
            <TextInput
              placeholder="e.g. Nishant Singh"
              placeholderTextColor="#9ca3af"
              value={profileNameInput}
              onChangeText={setProfileNameInput}
              style={tw`w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-semibold text-gray-800 mb-4`}
            />

            <Text style={tw`text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5`}>Mobile Phone Number</Text>
            <TextInput
              placeholder="e.g. 9812345678"
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
              value={profilePhoneInput}
              onChangeText={setProfilePhoneInput}
              style={tw`w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-semibold text-gray-800 mb-6`}
            />

            <TouchableOpacity
              onPress={async () => {
                if (!profileNameInput.trim() || !profilePhoneInput.trim()) {
                  Alert.alert('Required Fields', 'Please fill in both your full name and phone number.')
                  return
                }
                const cleanN = profileNameInput.trim()
                const cleanP = profilePhoneInput.trim()
                try {
                  await supabase.from('profiles').upsert([{
                    id: user.id,
                    user_id: user.id,
                    email: user.email,
                    full_name: cleanN,
                    phone_number: cleanP,
                    role: user.role || 'customer'
                  }])
                } catch (e) {
                  console.warn('[CompleteProfile] upsert notice:', e)
                }
                setUser((prev: any) => ({
                  ...prev,
                  name: cleanN,
                  phone_number: cleanP
                }))
              }}
              style={tw`w-full py-4 bg-[#8fda58] rounded-2xl items-center justify-center shadow-md`}
            >
              <Text style={tw`text-[15px] font-black text-white uppercase tracking-wide`}>Save Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  </ErrorBoundary>
)
}

const styles = StyleSheet.create({
  safeArea: {
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  wrapper: {
    position: "absolute",
    bottom: 28,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 40,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.97)",
    borderRadius: 28,
    padding: 10,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 12,
    alignSelf: "center",
  },
  tabPressable: {
    alignItems: "center",
    justifyContent: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 15,
    overflow: "hidden",
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
})
