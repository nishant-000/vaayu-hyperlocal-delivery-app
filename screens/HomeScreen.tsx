import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, FlatList, ActivityIndicator, RefreshControl, Linking, Platform, StatusBar as RNStatusBar } from 'react-native'
import tw from 'twrnc'
import Svg, { Path, Line, Polyline } from 'react-native-svg'
import {
  IconChevronDown,
  IconSearch,
  IconBell,
  IconStar,
} from './Icons'
import { fetchRemoteConfig, subscribeToRemoteConfig, AppConfig, DEFAULT_CONFIG, getOptimizedImageUrl } from '../lib/remoteConfig'
import { supabase } from '../lib/supabase'
import { getCache, setCache } from '../lib/cache'

export const categories = [
  {
    id: 1,
    name: "Food",
    title: "FOOD",
    sub: "CANTEENS & CAFES",
    badge: "",
    img: require('../assets/categories/food.jpg'),
    isLarge: true,
  },
  {
    id: 2,
    name: "Grocery",
    title: "GROCERY",
    sub: "DAILY ESSENTIALS",
    badge: "FRESH & FAST",
    img: require('../assets/categories/grocery.jpg'),
    isLarge: true,
  },
  {
    id: 6,
    name: "Others",
    title: "OTHERS",
    sub: "SERVICES & MORE",
    badge: "",
    img: require('../assets/categories/others.jpg'),
    isLarge: true,
  },
  {
    id: 3,
    name: "Pharmacy",
    title: "PHARMACY",
    sub: "MEDICINES & CARE",
    badge: "CAMPUS HEALTH",
    img: require('../assets/categories/pharmacy.jpg'),
    isLarge: false,
  },
  {
    id: 5,
    name: "Stationery",
    title: "STATIONERY",
    sub: "BOOKS & LABS",
    badge: "EXAM SPECIALS",
    img: require('../assets/categories/stationery.jpg'),
    isLarge: false,
  },
]

interface HomeScreenProps {
  onSelectShop: (shop: any) => void
  cartItems: any[]
  onOpenCart: () => void
  onOpenNotifications: () => void
  hasUnreadNotifications?: boolean
  address: {
    area: string
    landmark: string
  }
  onOpenAddressPicker: () => void
}

export default function HomeScreen({
  onSelectShop,
  cartItems,
  onOpenCart,
  onOpenNotifications,
  hasUnreadNotifications = false,
  address,
  onOpenAddressPicker
}: HomeScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [savedShops, setSavedShops] = useState<Set<string | number>>(new Set())
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG)
  const [shops, setShops] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchFreshShops = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true)
    try {
      const { data: shopsData, error } = await supabase
        .from('shops')
        .select('*, menu_items(*)')
        .order('created_at', { ascending: false })

      if (!error && shopsData) {
        const formatted = shopsData.map(s => ({
          id: s.id,
          name: s.name,
          category: s.category || 'Others',
          rating: s.rating || 4.8,
          time: '15 min',
          discount: '20% off',
          img: s.image_url || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
          badge: s.is_open ? 'OPEN TODAY' : 'OFFLINE',
          isLiveToday: s.is_open,
          items: s.menu_items ? s.menu_items.map((m: any) => ({
            id: m.id,
            name: m.name,
            desc: m.description,
            price: m.price,
            isAvailable: m.is_available,
            stockQuantity: m.stock_quantity ?? 0,
            img: m.image_url || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200'
          })) : [],
          phone: s.phone || ''
        }))
        setShops(formatted)
        await setCache('campus_shops', formatted, 600)
      }
    } catch (e) {
      console.warn('[HomeScreen] Fetch error:', e)
    } finally {
      if (isManualRefresh) setRefreshing(false)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let unsubscribeConfig: (() => void) | null = null

    async function loadData() {
      const initialConfig = await fetchRemoteConfig()
      setConfig(initialConfig)
      unsubscribeConfig = subscribeToRemoteConfig(setConfig)

      // 1. Cache Hydration
      const cachedShops = await getCache<any[]>('campus_shops')
      if (cachedShops && cachedShops.length > 0) {
        setShops(cachedShops)
        setLoading(false)
      } else {
        setLoading(true)
      }

      // 2. Fetch fresh live shops from Supabase
      await fetchFreshShops(false)
    }

    loadData()

    // 3. Realtime subscription to live shop changes (open/close, name, image)
    const shopChannel = supabase
      .channel('public_shops_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shops' }, () => {
        fetchFreshShops(false)
      })
      .subscribe()

    return () => {
      if (unsubscribeConfig) unsubscribeConfig()
      shopChannel.unsubscribe()
    }
  }, [fetchFreshShops])

  const toggleSaveShop = (id: string | number) => {
    setSavedShops(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const MAIN_CATEGORIES = ['food', 'grocery', 'pharmacy', 'stationery']

  const filteredShops = shops.filter(shop => {
    const matchesSearch = shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.items?.some((i: any) => i.name.toLowerCase().includes(searchQuery.toLowerCase()))

    if (!matchesSearch) return false
    if (!selectedCategory) return true

    const catName = categories.find(c => c.id === selectedCategory)?.name?.toLowerCase()

    const shopCategories = (shop.category || '')
      .toLowerCase()
      .split(',')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0)

    if (catName === 'others') {
      // Match shops whose category array contains 'others' OR any custom/unknown category
      return shopCategories.some((cat: string) => cat === 'others' || !MAIN_CATEGORIES.includes(cat))
    }

    return catName ? shopCategories.includes(catName) : true
  })

  // ── Remote Config Live Banners (Inspected & Verified) ──
  const rawBanners = config?.banners || []
  
  // 1 & 2 & 3. Verify active status and show_on matching customer_home
  const activeBanners = rawBanners
    .filter(b => {
      const isActive = b.active !== false
      const matchesScreen = !b.show_on || b.show_on.length === 0 || b.show_on.includes('customer_home')
      console.log(`[HomeScreen] 2 & 3. Banner '${b.id}' (${b.title}): active=${isActive}, matchesScreen=${matchesScreen} (show_on=${JSON.stringify(b.show_on)})`)
      return isActive && matchesScreen
    })
    .sort((a, b) => (a.priority || 99) - (b.priority || 99))

  const liveBanners = activeBanners.length > 0 ? activeBanners : [
    {
      id: "b1_default",
      title: "Gate 1 Express Delivery",
      image_url: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=400&fit=crop",
      active: true,
      priority: 1,
      show_on: ["customer_home"]
    }
  ]

  // 7. Verify carousel is rendering at least one banner
  console.log(`[HomeScreen] 7. Carousel rendering banner count: ${liveBanners.length}, IDs: [${liveBanners.map(b => b.id).join(', ')}]`)

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      {/* Top Header */}
      <View style={{ backgroundColor: '#8fda58', paddingBottom: 12, paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + 8 : 12 }}>
        <View style={tw`flex-row items-center justify-between px-4 pt-1 pb-2`}>
          <View style={tw`flex-1 items-center justify-center px-4`}>
            <TouchableOpacity onPress={onOpenAddressPicker} style={tw`flex-row items-center gap-1`}>
              <Text style={tw`text-[14px] font-black text-white uppercase tracking-wider`}>IIIT TIRUCHIRAPPALLI</Text>
              <IconChevronDown color="#ffffff" size={12} />
            </TouchableOpacity>
            <Text style={tw`text-[11px] text-white/90 font-medium text-center mt-0.5`} numberOfLines={1}>
              {address.area || 'IIIT Tiruchirappalli'}
            </Text>
          </View>

          <View style={tw`flex-row items-center gap-2.5`}>
            <TouchableOpacity onPress={onOpenNotifications} style={tw`relative p-1`}>
              <IconBell color="#ffffff" size={22} />
              {hasUnreadNotifications ? (
                <View style={tw`absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white`} />
              ) : null}
            </TouchableOpacity>
          </View>
        </View>

        {/* Search bar */}
        <View style={tw`px-4 pt-1.5 pb-2`}>
          <View style={tw`flex-row items-center gap-2.5 bg-white rounded-2xl px-4 py-2.5 shadow-sm`}>
            <IconSearch color="#9ca3af" size={18} />
            <TextInput
              placeholder="Search food, groceries, pharmacy..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={tw`flex-1 text-[14px] text-gray-700 font-medium p-0`}
            />
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`pb-36`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchFreshShops(true)}
            tintColor="#8fda58"
            colors={['#8fda58']}
          />
        }
      >
        {/* Remote Config Live Banners Carousel */}
        <View style={tw`pt-4 pb-2`}>
          <FlatList
            data={liveBanners}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={tw`px-4 gap-3`}
            keyExtractor={item => item.id}
            renderItem={({ item }) => {
              const targetUrl = getOptimizedImageUrl(item.image_url, 800)
              // 4. Log exact image_url passed into React Native Image component
              console.log(`[HomeScreen] 4. Exact image_url passed to Image component for [${item.id}]:`, targetUrl)

              return (
                <View style={tw`w-[85vw] h-40 rounded-3xl overflow-hidden relative shadow-md bg-gray-200`}>
                  <Image
                    source={{ uri: targetUrl }}
                    style={tw`w-full h-full`}
                    resizeMode="cover"
                    // 5. onLoad callback logging
                    onLoad={(e) => {
                      console.log(`[HomeScreen] 5. Banner image [${item.id}] loaded successfully:`, {
                        url: targetUrl,
                        width: e.nativeEvent?.source?.width,
                        height: e.nativeEvent?.source?.height
                      })
                    }}
                    // 6. onError callback logging
                    onError={(e) => {
                      console.error(`[HomeScreen] 6. Banner image [${item.id}] failed to load:`, {
                        url: targetUrl,
                        error: e.nativeEvent?.error || e.nativeEvent
                      })
                    }}
                  />
                  <View style={[tw`absolute inset-0 p-4 justify-between`, { backgroundColor: 'rgba(0,0,0,0.35)' }]}>
                    <Text style={tw`text-white font-black text-xl w-3/4`}>{item.title}</Text>
                    <View style={tw`bg-white/90 rounded-full px-3 py-1 self-start`}>
                      <Text style={tw`text-[10px] font-black text-gray-900 uppercase`}>Vaayu Express</Text>
                    </View>
                  </View>
                </View>
              )
            }}
          />
        </View>

        {/* Category Grid */}
        <View style={tw`p-4 gap-2.5`}>
          <View style={tw`flex-row gap-3`}>
            {(() => {
              const food = categories.find(c => c.name === 'Food')!
              const isSelected = selectedCategory === food.id
              return (
                <TouchableOpacity
                  key={food.id}
                  onPress={() => setSelectedCategory(isSelected ? null : food.id)}
                  activeOpacity={0.85}
                  style={[
                    tw`flex-1 bg-white rounded-3xl p-4 justify-between border relative overflow-hidden`,
                    {
                      borderColor: isSelected ? '#8fda58' : '#f3f4f6',
                      borderWidth: isSelected ? 2.5 : 1,
                      minHeight: 155,
                    }
                  ]}
                >
                  <View style={tw`z-10`}>
                    <Text style={tw`text-[16px] font-black text-gray-900 tracking-tight leading-tight mb-0.5`}>
                      {food.title}
                    </Text>
                    <Text style={tw`text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2`}>
                      {food.sub}
                    </Text>
                    {food.badge ? (
                      <View style={tw`self-start bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100`}>
                        <Text style={tw`text-[10px] font-black text-orange-600`}>{food.badge}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Image source={food.img} style={tw`w-22 h-22 absolute bottom-1 right-1 rounded-2xl`} resizeMode="contain" />
                </TouchableOpacity>
              )
            })()}

            <View style={tw`w-[44%] gap-2.5`}>
              {['Pharmacy', 'Stationery'].map(catName => {
                const cat = categories.find(c => c.name === catName)!
                const isSelected = selectedCategory === cat.id
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setSelectedCategory(isSelected ? null : cat.id)}
                    activeOpacity={0.85}
                    style={[
                      tw`flex-1 bg-white rounded-2xl p-2.5 flex-row items-center justify-between border relative overflow-hidden`,
                      {
                        borderColor: isSelected ? '#8fda58' : '#f3f4f6',
                        borderWidth: isSelected ? 2.5 : 1,
                      }
                    ]}
                  >
                    <View style={tw`z-10 flex-1 pr-1`}>
                      <Text style={tw`text-[12px] font-black text-gray-900 tracking-tight`} numberOfLines={1}>{cat.title}</Text>
                      <Text style={tw`text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-0.5`} numberOfLines={1}>{cat.sub}</Text>
                    </View>
                    <Image source={cat.img} style={tw`w-10 h-10 rounded-lg`} resizeMode="contain" />
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          {/* Row 2: Grocery + Others */}
          <View style={tw`flex-row gap-3`}>
            {(() => {
              const grocery = categories.find(c => c.name === 'Grocery')!
              const isSelected = selectedCategory === grocery.id
              return (
                <TouchableOpacity
                  onPress={() => setSelectedCategory(isSelected ? null : grocery.id)}
                  activeOpacity={0.85}
                  style={[
                    tw`flex-1 bg-white rounded-3xl p-4 justify-between border relative overflow-hidden`,
                    {
                      borderColor: isSelected ? '#8fda58' : '#f3f4f6',
                      borderWidth: isSelected ? 2.5 : 1,
                      minHeight: 110,
                    }
                  ]}
                >
                  <View style={tw`z-10`}>
                    <Text style={tw`text-[15px] font-black text-gray-900 tracking-tight leading-tight mb-0.5`}>{grocery.title}</Text>
                    <Text style={tw`text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2`}>{grocery.sub}</Text>
                    {grocery.badge ? (
                      <View style={tw`self-start bg-green-50 px-2 py-0.5 rounded-full border border-green-100`}>
                        <Text style={tw`text-[9px] font-black text-green-700`}>{grocery.badge}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Image source={grocery.img} style={tw`w-18 h-18 absolute bottom-1 right-1 rounded-xl`} resizeMode="contain" />
                </TouchableOpacity>
              )
            })()}

            {/* Others card beside Grocery */}
            {(() => {
              const others = categories.find(c => c.name === 'Others')!
              const isSelected = selectedCategory === others.id
              return (
                <TouchableOpacity
                  onPress={() => setSelectedCategory(isSelected ? null : others.id)}
                  activeOpacity={0.85}
                  style={[
                    tw`flex-1 bg-white rounded-3xl p-4 justify-between border relative overflow-hidden`,
                    {
                      borderColor: isSelected ? '#8fda58' : '#f3f4f6',
                      borderWidth: isSelected ? 2.5 : 1,
                      minHeight: 110,
                    }
                  ]}
                >
                  <View style={tw`z-10`}>
                    <Text style={tw`text-[15px] font-black text-gray-900 tracking-tight leading-tight mb-0.5`}>{others.title}</Text>
                    <Text style={tw`text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2`}>{others.sub}</Text>
                    {others.badge ? (
                      <View style={tw`self-start bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100`}>
                        <Text style={tw`text-[9px] font-black text-purple-700`}>{others.badge}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Image source={others.img} style={tw`w-18 h-18 absolute bottom-1 right-1 rounded-xl`} resizeMode="contain" />
                </TouchableOpacity>
              )
            })()}
          </View>
        </View>

        {/* Live Shops Section */}
        <View style={tw`px-4 pt-2`}>
          <Text style={tw`text-[18px] font-black text-gray-900 mb-3`}>Campus Shops & Canteens</Text>

          {loading ? (
            <View style={tw`py-14 items-center justify-center`}>
              <ActivityIndicator size="large" color="#8fda58" />
              <Text style={tw`text-xs font-bold text-gray-400 mt-3`}>Fetching campus shops...</Text>
            </View>
          ) : filteredShops.length === 0 ? (
            <View style={tw`bg-white rounded-3xl p-8 items-center justify-center text-center shadow-xs border border-gray-100`}>
              <Text style={tw`text-4xl mb-2`}>🏪</Text>
              <Text style={tw`text-base font-bold text-gray-900`}>No shops found</Text>
              <Text style={tw`text-xs text-gray-400 font-medium mt-1`}>Try searching for something else.</Text>
            </View>
          ) : (
            <View style={tw`flex-col gap-4`}>
              {filteredShops.map(shop => (
                <TouchableOpacity
                  key={shop.id}
                  onPress={() => onSelectShop(shop)}
                  activeOpacity={0.9}
                  style={tw`bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm`}
                >
                  <View style={tw`relative h-44 w-full bg-gray-200`}>
                    <Image source={{ uri: shop.img }} style={tw`w-full h-full`} resizeMode="cover" />
                    
                    {/* Offline / Open Badge */}
                    <View style={[tw`absolute top-3 left-3 rounded-full px-3 py-1`, shop.isLiveToday ? tw`bg-green-600` : tw`bg-red-600`]}>
                      <Text style={tw`text-[10px] font-black text-white uppercase`}>
                        {shop.isLiveToday ? '🟢 OPEN TODAY' : '🔴 OFFLINE TODAY'}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => toggleSaveShop(shop.id)}
                      style={tw`absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 items-center justify-center`}
                    >
                      <Text style={tw`text-sm`}>{savedShops.has(shop.id) ? '❤️' : '🤍'}</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={tw`p-4`}>
                    <View style={tw`flex-row justify-between items-center mb-1`}>
                      <Text style={tw`text-[18px] font-black text-gray-900 flex-1 mr-2`} numberOfLines={1}>{shop.name}</Text>
                      <View style={tw`bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200`}>
                        <Text style={tw`text-[11px] font-bold text-emerald-800 uppercase`}>{shop.category || 'Shop'}</Text>
                      </View>
                    </View>

                    <View style={tw`flex-row items-center justify-between mt-1 pt-2 border-t border-gray-50`}>
                      <Text style={tw`text-[12px] text-gray-500 font-medium`}>{shop.category} · Campus Delivery</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}
