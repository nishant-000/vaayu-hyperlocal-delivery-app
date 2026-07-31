import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, FlatList, ActivityIndicator } from 'react-native'
import tw from 'twrnc'
import Svg, { Path, Line, Polyline } from 'react-native-svg'
import {
  IconChevronDown,
  IconSearch,
  IconBell,
  IconStar,
} from './Icons'
import { fetchRemoteConfig, subscribeToRemoteConfig, AppConfig, DEFAULT_CONFIG } from '../lib/remoteConfig'
import { supabase } from '../lib/supabase'

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
  {
    id: 6,
    name: "Others",
    title: "OTHERS",
    sub: "SERVICES & MORE",
    badge: "CAMPUS PICKUP",
    img: require('../assets/categories/others.jpg'),
    isLarge: false,
  },
]

interface HomeScreenProps {
  onSelectShop: (shop: any) => void
  cartItems: any[]
  onOpenCart: () => void
  onOpenNotifications: () => void
  address: { area: string; room: string }
  onOpenAddressPicker: () => void
}

export default function HomeScreen({
  onSelectShop,
  cartItems,
  onOpenCart,
  onOpenNotifications,
  address,
  onOpenAddressPicker,
}: HomeScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [savedShops, setSavedShops] = useState<Set<string | number>>(new Set())
  const [remoteConfig, setRemoteConfig] = useState<AppConfig>(DEFAULT_CONFIG)
  const [shops, setShops] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch Remote Config & Live Shops
  useEffect(() => {
    let unsubscribeConfig: () => void

    async function loadData() {
      setLoading(true)
      const config = await fetchRemoteConfig()
      setRemoteConfig(config)

      unsubscribeConfig = subscribeToRemoteConfig((updated) => {
        setRemoteConfig(updated)
      })

      // Fetch live shops from Supabase
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
            img: m.image_url || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200'
          })) : []
        }))
        setShops(formatted)
      } else {
        setShops([])
      }
      setLoading(false)
    }

    loadData()

    return () => {
      if (unsubscribeConfig) unsubscribeConfig()
    }
  }, [])

  const toggleSaveShop = (id: string | number) => {
    setSavedShops(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const filteredShops = shops.filter(shop => {
    const matchesSearch = shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.items?.some((i: any) => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
    
    if (!matchesSearch) return false
    if (!selectedCategory) return true

    const catName = categories.find(c => c.id === selectedCategory)?.name
    return catName ? shop.category?.toLowerCase() === catName.toLowerCase() : true
  })

  // Banners from live Remote Config
  const liveBanners = remoteConfig.banners && remoteConfig.banners.length > 0 ? remoteConfig.banners : [
    {
      id: "b1",
      title: "Gate 1 Express Delivery",
      image_url: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=400&fit=crop"
    }
  ]

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      {/* Top Header */}
      <View style={{ backgroundColor: '#8fda58', paddingBottom: 12 }}>
        <View style={tw`flex-row items-center justify-between px-4 pt-3 pb-2`}>
          <View style={tw`flex-1 items-center justify-center px-4`}>
            <TouchableOpacity onPress={onOpenAddressPicker} style={tw`flex-row items-center gap-1`}>
              <Text style={tw`text-[14px] font-black text-white uppercase tracking-wider`}>IIIT TIRUCHIRAPPALLI</Text>
              <IconChevronDown color="#ffffff" size={12} />
            </TouchableOpacity>
            <Text style={tw`text-[11px] text-white/90 font-medium text-center mt-0.5`} numberOfLines={1}>
              {address.room ? `${address.area}, ${address.room}` : 'IIIT Tiruchirappalli, Gate 1'}
            </Text>
          </View>

          <View style={tw`flex-row items-center gap-2.5`}>
            <TouchableOpacity onPress={onOpenNotifications} style={tw`relative p-1`}>
              <IconBell color="#ffffff" size={22} />
              <View style={[tw`absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-white border rounded-full items-center justify-center`, { borderColor: '#8fda58' }]}>
                <Text style={[tw`text-[9px] font-black`, { color: '#8fda58' }]}>3</Text>
              </View>
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-36`}>
        {/* Remote Config Live Banners Carousel */}
        <View style={tw`pt-4 pb-2`}>
          <FlatList
            data={liveBanners}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={tw`px-4 gap-3`}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={tw`w-[85vw] h-40 rounded-3xl overflow-hidden relative shadow-md bg-gray-200`}>
                <Image source={{ uri: item.image_url }} style={tw`w-full h-full`} resizeMode="cover" />
                <View style={[tw`absolute inset-0 p-4 justify-between`, { backgroundColor: 'rgba(0,0,0,0.35)' }]}>
                  <Text style={tw`text-white font-black text-xl w-3/4`}>{item.title}</Text>
                  <View style={tw`bg-white/90 rounded-full px-3 py-1 self-start`}>
                    <Text style={tw`text-[10px] font-black text-gray-900 uppercase`}>Vaayu Express</Text>
                  </View>
                </View>
              </View>
            )}
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

          {/* Row 2: Grocery */}
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
          </View>
        </View>

        {/* Live Shops Section */}
        <View style={tw`px-4 pt-2`}>
          <Text style={tw`text-[18px] font-black text-gray-900 mb-3`}>Campus Shops & Canteens</Text>

          {loading ? (
            <View style={tw`py-10 items-center justify-center`}>
              <ActivityIndicator size="large" color="#1a3a2a" />
              <Text style={tw`text-xs text-gray-400 font-medium mt-2`}>Loading shops from Supabase...</Text>
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
                      <View style={tw`flex-row items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-md border border-yellow-200`}>
                        <IconStar color="#eab308" size={14} />
                        <Text style={tw`text-[12px] font-black text-gray-800`}>{shop.rating}</Text>
                      </View>
                    </View>

                    <Text style={tw`text-[12px] text-gray-500 font-medium mb-3`}>{shop.category} · Campus Delivery</Text>

                    {/* Quick Items Preview */}
                    {shop.items && shop.items.length > 0 && (
                      <View style={tw`bg-gray-50 rounded-2xl p-2.5 border border-gray-100 flex-row gap-2`}>
                        {shop.items.slice(0, 3).map((it: any) => (
                          <View key={it.id} style={tw`flex-1 bg-white rounded-xl p-2 border border-gray-100 items-center`}>
                            <Text style={tw`text-[11px] font-bold text-gray-900 text-center`} numberOfLines={1}>{it.name}</Text>
                            <Text style={tw`text-[11px] font-black text-green-700 mt-0.5`}>₹{it.price}</Text>
                          </View>
                        ))}
                      </View>
                    )}
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
