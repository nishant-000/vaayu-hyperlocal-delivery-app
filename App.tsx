import React, { useState, useEffect, useRef, useCallback, memo } from 'react'
import { StyleSheet, View, Text, TouchableOpacity, Alert, Platform, StatusBar as RNStatusBar, Animated, Easing, Pressable, ScrollView, TextInput, ActivityIndicator, BackHandler } from 'react-native'
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
import AsyncStorage from '@react-native-async-storage/async-storage'
import { BACKEND_URL } from './screens/apiConfig'
import { registerForPushNotifications, checkNotificationPermissionStatus, setupNotificationListeners, sendLocalNotification } from './lib/notifications'
import { supabase } from './lib/supabase'
import { clearAllUserCache } from './lib/cache'
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

const NAV_ITEMS: { id: TabId; label: string; Icon: React.FC<{ active: boolean }> }[] = [
  { id: "home",    label: "Home",    Icon: IconHome },
  { id: "orders",  label: "Orders",  Icon: IconBag },
  { id: "cart",    label: "Cart",    Icon: IconCart },
  { id: "profile", label: "Profile", Icon: IconUser },
]

const NavTab = memo(function NavTab({
  id,
  label,
  Icon,
  isActive,
  onPress,
}: {
  id: TabId
  label: string
  Icon: React.FC<{ active: boolean }>
  isActive: boolean
  onPress: (id: TabId) => void
}) {
  const anim = useRef(new Animated.Value(isActive ? 1 : 0)).current

  useEffect(() => {
    Animated.spring(anim, {
      toValue: isActive ? 1 : 0,
      tension: 140,
      friction: 12,
      useNativeDriver: true,
    }).start()
  }, [isActive])

  const handlePress = useCallback(() => {
    onPress(id)
  }, [onPress, id])

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1],
  })

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -1],
  })

  const bgOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  })

  const labelOpacity = anim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0, 1],
  })

  const labelScale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  })

  return (
    <Pressable
      onPress={handlePress}
      style={styles.tabPressable}
      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
    >
      <Animated.View
        style={[
          styles.pill,
          {
            transform: [{ scale }],
          },
        ]}
      >
        {/* Hardware-accelerated background highlight pill (100% native driver) */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            styles.activePillBackground,
            {
              opacity: bgOpacity,
            },
          ]}
        />

        <Animated.View style={{ transform: [{ translateY }] }}>
          <Icon active={isActive} />
        </Animated.View>

        {isActive && (
          <Animated.View
            style={{
              marginLeft: 6,
              opacity: labelOpacity,
              transform: [{ scale: labelScale }],
            }}
          >
            <Text style={styles.label} numberOfLines={1}>
              {label}
            </Text>
          </Animated.View>
        )}
      </Animated.View>
    </Pressable>
  )
})

const BottomNavigationBar = memo(function BottomNavigationBar({
  activeTab,
  onTabPress,
}: {
  activeTab: TabId
  onTabPress: (tab: TabId) => void
}) {
  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={styles.bar}>
        {NAV_ITEMS.map((item) => (
          <NavTab
            key={item.id}
            id={item.id}
            label={item.label}
            Icon={item.Icon}
            isActive={activeTab === item.id}
            onPress={onTabPress}
          />
        ))}
      </View>
    </View>
  )
})

export default function App() {
  // App States
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<TabId>('home')
  const [savedShops, setSavedShops] = useState<Set<number>>(new Set([3]))
  const [selectedShop, setSelectedShop] = useState<any>(null)

  const handleTabPress = useCallback((tab: TabId) => {
    setActiveTab(tab)
  }, [])
  
  // Cart State
  const [cartItems, setCartItems] = useState<any[]>([])
  const [cartShop, setCartShop] = useState<any>(null)

  // Orders State
  const [orders, setOrders] = useState<any[]>([])

  // Profile Address State
  const [address, setAddress] = useState({
    area: "IIIT Tiruchirappalli",
    landmark: "Sethurapatti, Trichy"
  })

  // Notifications State
  const [showPermissionPrePrompt, setShowPermissionPrePrompt] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false)
  const [notificationsList, setNotificationsList] = useState<Array<{ id: string; title: string; body: string; time: string }>>([])

  // Profile Completion Modal State
  const [profileNameInput, setProfileNameInput] = useState('')
  const [profilePhoneInput, setProfilePhoneInput] = useState('')

  // Toast / Alert State
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const lastBackPressRef = useRef<number>(0)
  const processedNotifRef = useRef<Map<string, number>>(new Map())

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 2500)
  }

  // Push / In-App Notification Deduplication & State Manager
  const addNotificationItem = (title: string, body: string, orderId?: string) => {
    const dedupKey = `${orderId || 'general'}_${title.trim()}`
    const now = Date.now()
    const lastSeen = processedNotifRef.current.get(dedupKey) || 0

    // Suppress identical notifications received within 8 seconds
    if (now - lastSeen < 8000) {
      return
    }
    processedNotifRef.current.set(dedupKey, now)

    // Cleanup old cache entries
    if (processedNotifRef.current.size > 50) {
      processedNotifRef.current.clear()
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const newItem = {
      id: `${now}_${Math.random().toString(36).slice(2, 6)}`,
      title,
      body,
      orderId,
      time: timeStr
    }

    setHasUnreadNotifications(true)
    setNotificationsList(prev => {
      // Filter out any duplicate with the same title & orderId
      const filtered = prev.filter(n => !(n.title === title && (n as any).orderId === orderId))
      const updated = [newItem, ...filtered].slice(0, 30)
      AsyncStorage.setItem('@vaayu_notifications_list', JSON.stringify(updated)).catch(() => {})
      return updated
    })
  }

  // Android Hardware / Back Gesture Handler
  useEffect(() => {
    if (Platform.OS === 'web') return

    const handleBackPress = () => {
      // 1. If notification drawer is open, close it
      if (showNotifications) {
        setShowNotifications(false)
        return true
      }

      // 2. If permission modal is open, close it
      if (showPermissionPrePrompt) {
        setShowPermissionPrePrompt(false)
        return true
      }

      // 3. If a shop detail screen is open, close it and return to current tab
      if (selectedShop) {
        setSelectedShop(null)
        return true
      }

      // 4. If on another tab (orders, cart, profile), return to Home
      if (activeTab !== 'home') {
        setActiveTab('home')
        return true
      }

      // 5. Already on Home tab: double press within 2s to minimize/exit
      const now = Date.now()
      if (now - lastBackPressRef.current < 2000) {
        return false // Allow default OS behavior (minimize app)
      } else {
        lastBackPressRef.current = now
        showToast('Press back again to exit')
        return true
      }
    }

    const backSubscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress)
    return () => backSubscription.remove()
  }, [showNotifications, showPermissionPrePrompt, selectedShop, activeTab])

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

          const userId = authUser.id || profile?.id || profile?.user_id
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

  // Load stored notifications on initial mount
  useEffect(() => {
    async function loadStoredNotifications() {
      try {
        const saved = await AsyncStorage.getItem('@vaayu_notifications_list')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) {
            setNotificationsList(parsed)
          }
        }
      } catch (_) {}
    }
    loadStoredNotifications()
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

    // Notification listeners (Foreground & Background Tap)
    const cleanupListeners = setupNotificationListeners(
      (orderId) => {
        showToast(`Opening order #${orderId}`)
        setActiveTab('orders')
        setHasUnreadNotifications(false)
      },
      (notification) => {
        const title = notification?.request?.content?.title || 'New Notification'
        const body = notification?.request?.content?.body || ''
        const notifData = notification?.request?.content?.data
        addNotificationItem(title, body, notifData?.orderId)
      }
    )

    return () => {
      cleanupListeners()
    }
  }, [user])

  // In-app Realtime Order Updates for Customer
  useEffect(() => {
    if (!user?.id || user.role === 'shop_owner') return

    const channel = supabase
      .channel(`customer_order_updates_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        (payload: any) => {
          const newOrder = payload.new
          const oldOrder = payload.old
          // Check if this order belongs to the user and status changed
          if (newOrder && oldOrder && newOrder.user_id === user.id && newOrder.status !== oldOrder.status) {
            let title = `📦 Order #${newOrder.id} Updated`
            let body = `Status changed to ${newOrder.status}`
            
            if (newOrder.status === 'accepted' || newOrder.status === 'preparing') {
              title = `👨‍🍳 Cooking in Progress! #${newOrder.id}`
              body = `${newOrder.shop_name || 'Shop'} is preparing your order with care.`
            } else if (newOrder.status === 'ready_for_pickup') {
              title = `🛍️ Ready for Pickup! #${newOrder.id}`
              body = `Your order is packed and ready for pickup at ${newOrder.shop_name || 'the shop'}.`
            } else if (newOrder.status === 'out_for_delivery' || newOrder.status === 'delivering') {
              title = `Order On The Way! #${newOrder.id}`
              body = `Your order is packed & heading towards ${newOrder.location || 'IIIT Trichy'}.`
            } else if (newOrder.status === 'delivered') {
              title = `🎉 Order Delivered! Enjoy your order 😋`
              body = `Order #${newOrder.id} has reached ${newOrder.location || 'IIIT Trichy'}.`
            } else if (newOrder.status === 'cancelled') {
              title = `❌ Order Cancelled #${newOrder.id}`
              body = newOrder.cancel_reason || 'Your order was cancelled by the shop.'
            }

            addNotificationItem(title, body, newOrder.id)
            showToast(`${title}\n${body}`)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, user?.role])

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

    // Centralized, security-hardened Sign Out handler
    const handleSignOut = async () => {
      try {
        await supabase.auth.signOut()
      } catch (e) {
        console.warn('[App] SignOut notice:', e)
      }
      await clearAllUserCache()
      setUser(null)
      setCartItems([])
      setCartShop(null)
      setOrders([])
      setSelectedShop(null)
      setActiveTab('home')
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
        <OwnerDashboard user={user} onSignOut={handleSignOut} />
      </View>
    )
  }

  // Customer App Layout
  return (
    <ErrorBoundary>
      <View style={tw`flex-1 bg-gray-50`}>
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
              onOpenNotifications={() => {
                setShowNotifications(true)
                setHasUnreadNotifications(false)
              }}
              hasUnreadNotifications={hasUnreadNotifications}
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
              onSignOut={handleSignOut}
            />
          )}

          {/* Bottom Floating Navigation Capsule */}
          <BottomNavigationBar
            activeTab={activeTab}
            onTabPress={handleTabPress}
          />
        </>
      )}

      {/* Campus Notifications Drawer */}
      {showNotifications && (
        <View style={tw`absolute inset-0 z-50 bg-black/60 justify-end`}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {
              setShowNotifications(false)
              setHasUnreadNotifications(false)
            }}
            style={tw`flex-1`}
          />
          <View style={tw`bg-white rounded-t-[32px] p-5 pb-8 gap-3.5 shadow-2xl max-h-[80%]`}>
            {/* Drag Pill */}
            <View style={tw`w-12 h-1.5 bg-gray-200 rounded-full self-center mb-1`} />

            <View style={tw`flex-row justify-between items-center pb-3 border-b border-gray-100`}>
              <View style={tw`flex-row items-center gap-2`}>
                <Text style={tw`text-2xl`}>🔔</Text>
                <Text style={tw`text-[18px] font-black text-gray-900`}>Notifications</Text>
              </View>
              <View style={tw`flex-row items-center gap-2`}>
                {notificationsList.length > 0 && (
                  <TouchableOpacity
                    onPress={async () => {
                      setNotificationsList([])
                      setHasUnreadNotifications(false)
                      await AsyncStorage.removeItem('@vaayu_notifications_list').catch(() => {})
                    }}
                    style={tw`px-2.5 py-1 bg-gray-100 rounded-lg`}
                  >
                    <Text style={tw`text-[11px] font-bold text-gray-500`}>Clear All</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => {
                    setShowNotifications(false)
                    setHasUnreadNotifications(false)
                  }}
                  style={tw`w-8 h-8 rounded-full bg-gray-100 items-center justify-center`}
                >
                  <Text style={tw`text-gray-500 font-bold text-base`}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Notifications Content */}
            {notificationsList.length > 0 ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`gap-2.5 pb-2`}>
                {notificationsList.map(notif => (
                  <TouchableOpacity
                    key={notif.id}
                    activeOpacity={0.7}
                    onPress={() => {
                      setShowNotifications(false)
                      setHasUnreadNotifications(false)
                      setActiveTab('orders')
                    }}
                    style={tw`bg-gray-50 border border-gray-100 rounded-2xl p-3.5 gap-1.5`}
                  >
                    <View style={tw`flex-row justify-between items-start gap-2`}>
                      <Text style={tw`flex-1 text-[14px] font-bold text-gray-900 leading-snug`} numberOfLines={2}>
                        {notif.title}
                      </Text>
                      <Text style={tw`text-[11px] text-gray-400 font-semibold flex-shrink-0 pt-0.5`}>
                        {notif.time}
                      </Text>
                    </View>
                    {notif.body ? (
                      <Text style={tw`text-[12px] text-gray-600 font-medium leading-relaxed`}>
                        {notif.body}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              /* Empty state */
              <View style={tw`py-8 items-center justify-center gap-2`}>
                <Text style={tw`text-4xl`}>🔕</Text>
                <Text style={tw`text-[15px] font-black text-gray-800 mt-1`}>No notifications yet</Text>
                <Text style={tw`text-[12px] text-gray-400 font-medium text-center px-6`}>
                  Live order updates and campus alerts will appear here.
                </Text>
              </View>
            )}
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
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.97)",
    borderRadius: 28,
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  tabPressable: {
    alignItems: "center",
    justifyContent: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    overflow: "hidden",
    position: "relative",
  },
  activePillBackground: {
    backgroundColor: "#8fda58",
    borderRadius: 999,
  },
  label: {
    fontSize: 13,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.2,
  },
})
