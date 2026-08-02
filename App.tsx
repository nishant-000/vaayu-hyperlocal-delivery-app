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
import { supabase } from './lib/supabase'
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

  // Restore persisted Supabase auth session on app startup
  useEffect(() => {
    async function restoreSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (!error && session?.user) {
          const authUser = session.user
          const cleanEmail = authUser.email || ''

          const { data: pList } = await supabase
            .from('profiles')
            .select('*')
            .ilike('email', cleanEmail.trim())
            .order('created_at', { ascending: false })

          const profile = (pList && pList.length > 0) ? (pList.find((p: any) => p.full_name && p.phone_number) || pList[0]) : null

          const { data: shop } = await supabase
            .from('shops')
            .select('*')
            .or(`owner_id.eq.${profile?.id || ''},owner_id.eq.${authUser?.id || ''}`)
            .maybeSingle()

          const userId = profile?.id || authUser.id
          const determinedRole = shop ? 'shop_owner' : (profile?.role || 'customer')
          const realFullName = profile?.full_name || ''
          const displayName = realFullName || (shop ? shop.name : undefined) || cleanEmail.split('@')[0]
          const displayPhone = profile?.phone_number || ''

          setUser({
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
      } catch (e) {
        console.warn('[App] restoreSession notice:', e)
      }
    }

    restoreSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null)
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

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

  // Auth registration & session handler
  const handleRegisterUser = async (registeredUser: any) => {
    let realName = registeredUser.name || registeredUser.full_name || ''
    let realPhone = registeredUser.phone_number || ''

    if (!realName || !realPhone || realName === registeredUser.email?.split('@')[0]) {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, phone_number')
          .or(`id.eq.${registeredUser.id},user_id.eq.${registeredUser.id},email.eq.${registeredUser.email}`)
          .maybeSingle()
        if (data) {
          if (data.full_name) realName = data.full_name
          if (data.phone_number) realPhone = data.phone_number
        }
      } catch (e) {}
    }

    const normalizedUser = {
      ...registeredUser,
      name: realName || registeredUser.name || registeredUser.email?.split('@')[0],
      full_name: realName || registeredUser.full_name || '',
      phone_number: realPhone || registeredUser.phone_number || ''
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
              onSignOut={async () => {
                await supabase.auth.signOut()
                setUser(null)
              }}
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
    borderWidth: 1,
    borderColor: "#e5e7eb",
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
