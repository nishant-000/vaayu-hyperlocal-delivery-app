import React, { useState, useEffect, useRef } from 'react'
import { StyleSheet, View, Text, TouchableOpacity, Alert, Platform, StatusBar as RNStatusBar, Animated, Easing, Pressable, ScrollView } from 'react-native'
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
    setUser(registeredUser)
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
                <Text style={tw`text-[20px] font-black text-gray-900`}>Campus Notifications</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowNotifications(false)}
                style={tw`w-8 h-8 rounded-full bg-gray-100 items-center justify-center`}
              >
                <Text style={tw`text-gray-500 font-bold text-base`}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={tw`max-h-96`}>
              <View style={tw`gap-3`}>
                <View style={tw`bg-green-50 border border-green-100 rounded-2xl p-4 flex-row items-start gap-3`}>
                  <Text style={tw`text-2xl`}>🎉</Text>
                  <View style={tw`flex-1`}>
                    <Text style={tw`text-[14px] font-black text-gray-900 mb-0.5`}>Welcome to IIIT Tiruchirappalli!</Text>
                    <Text style={tw`text-[12px] text-gray-600 font-medium leading-relaxed`}>
                      Official campus delivery is live for Gate 1 & Hostels.
                    </Text>
                    <Text style={tw`text-[10px] text-gray-400 font-bold mt-1`}>Just now</Text>
                  </View>
                </View>

                <View style={tw`bg-gray-50 border border-gray-100 rounded-2xl p-4 flex-row items-start gap-3`}>
                  <Text style={tw`text-2xl`}>🍔</Text>
                  <View style={tw`flex-1`}>
                    <Text style={tw`text-[14px] font-black text-gray-900 mb-0.5`}>Campus Bites Special Offer</Text>
                    <Text style={tw`text-[12px] text-gray-600 font-medium leading-relaxed`}>
                      Get 20% off on all burgers & sides today with code VAAYU50.
                    </Text>
                    <Text style={tw`text-[10px] text-gray-400 font-bold mt-1`}>2 hours ago</Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              onPress={() => {
                setShowNotifications(false)
                showToast("All notifications marked as read")
              }}
              style={[tw`w-full py-4 rounded-2xl items-center mt-5 mb-6`, { backgroundColor: '#8fda58' }]}
            >
              <Text style={tw`text-[15px] font-black text-white`}>Mark All as Read</Text>
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
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: "center",
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
