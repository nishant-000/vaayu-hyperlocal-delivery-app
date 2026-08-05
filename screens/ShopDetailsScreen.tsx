import React from 'react'
import { View, Text, TouchableOpacity, ScrollView, Image, Linking } from 'react-native'
import tw from 'twrnc'
import { IconArrowLeft, IconStar, IconArrowRight } from './Icons'

interface ShopDetailsScreenProps {
  shop: any
  cartItems: any[]
  onBack: () => void
  onAddToCart: (item: any, shop: any) => void
  onChangeQuantity: (itemId: string, diff: number) => void
  onViewCart: () => void
}

export default function ShopDetailsScreen({
  shop,
  cartItems,
  onBack,
  onAddToCart,
  onChangeQuantity,
  onViewCart
}: ShopDetailsScreenProps) {
  const shopItems = shop.items || []
  const isShopOpen = shop.isLiveToday !== false && shop.is_open !== false
  
  // Calculate cart quantities and subtotal for this shop
  const shopCartItems = cartItems.filter(item => item.shopId === shop.id || item.shopName === shop.name)
  const cartSubtotal = shopCartItems.reduce((sum, item) => sum + item.price * (item.quantity || item.qty), 0)
  const cartCount = shopCartItems.reduce((sum, item) => sum + (item.quantity || item.qty), 0)

  return (
    <View style={tw`flex-1 bg-white`}>
      {/* Cover photo */}
      <View style={tw`relative h-56 w-full`}>
        <Image
          source={{ uri: shop.img }}
          style={tw`w-full h-full`}
          resizeMode="cover"
        />
        <View style={[tw`absolute inset-0`, { backgroundColor: 'rgba(0,0,0,0.45)' }]} />
        
        {/* Back button */}
        <TouchableOpacity
          onPress={onBack}
          style={tw`absolute top-12 left-4 w-10 h-10 bg-white rounded-full items-center justify-center shadow-md`}
        >
          <IconArrowLeft color="#1f2937" size={20} />
        </TouchableOpacity>
        
        {/* Shop details text & Phone Contact */}
        <View style={tw`absolute bottom-4 left-4 right-4`}>
          <View style={tw`flex-row items-center justify-between mb-1`}>
            <View style={[tw`rounded-full px-2.5 py-0.5`, isShopOpen ? tw`bg-green-600` : tw`bg-red-600`]}>
              <Text style={tw`text-white text-[10px] font-black uppercase`}>
                {isShopOpen ? '🟢 OPEN TODAY' : '🔴 OFFLINE'}
              </Text>
            </View>

            {/* Shop Contact Phone Badge (Clickable Call) */}
            {shop.phone ? (
              <TouchableOpacity
                onPress={() => Linking.openURL(`tel:${shop.phone}`)}
                activeOpacity={0.8}
                style={tw`bg-black/70 px-3 py-1.5 rounded-full border border-white/40 flex-row items-center gap-1.5 shadow-md`}
              >
                <Text style={tw`text-xs`}>📞</Text>
                <Text style={tw`text-[12px] font-black text-white`}>{shop.phone}</Text>
                <View style={tw`bg-green-500 rounded-full px-1.5 py-0.2 ml-0.5`}>
                  <Text style={tw`text-[8px] font-black text-white uppercase`}>CALL</Text>
                </View>
              </TouchableOpacity>
            ) : null}
          </View>
          <Text style={tw`text-2xl font-black text-white leading-tight`}>{shop.name}</Text>
          <Text style={tw`text-[12px] text-white/90 mt-0.5 font-semibold`}>
            {shop.category || 'Campus Shop'} · 10-15 min delivery
          </Text>
        </View>
      </View>

      {/* Menu items listing */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`p-4 pb-36`}>
        {!isShopOpen && (
          <View style={tw`bg-red-50 border border-red-200 rounded-2xl p-3.5 mb-4 flex-row items-center gap-2.5 shadow-xs`}>
            <Text style={tw`text-xl`}>🛑</Text>
            <View style={tw`flex-1`}>
              <Text style={tw`text-[13px] font-black text-red-900`}>Store is Currently Offline</Text>
              <Text style={tw`text-[11px] font-semibold text-red-700 mt-0.5`}>
                This shop is closed and not accepting new orders right now.
              </Text>
            </View>
          </View>
        )}

        <Text style={tw`text-[17px] font-bold text-gray-900 mb-4`}>Menu Items ({shopItems.length})</Text>
        {shopItems.length === 0 ? (
          <View style={tw`bg-gray-50 rounded-2xl p-6 items-center justify-center border border-gray-100`}>
            <Text style={tw`text-3xl mb-2`}>🍲</Text>
            <Text style={tw`text-sm font-bold text-gray-700`}>No menu items listed yet</Text>
            <Text style={tw`text-xs text-gray-400 text-center mt-1`}>Items will appear here once the store updates their menu.</Text>
          </View>
        ) : (
          <View style={tw`flex-col gap-4`}>
            {shopItems.map((item: any) => {
              const currentQty = cartItems.find(i => i.id === item.id)?.quantity || 0
              const isItemAvailable = item.isAvailable !== false && (item.stockQuantity === undefined || item.stockQuantity > 0)
              const itemPhoto = item.img || item.image || item.image_url || shop.img || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'
              return (
                <View key={item.id} style={tw`flex-row justify-between items-center gap-3 py-3 border-b border-gray-100`}>
                  <View style={tw`flex-1`}>
                    <Text style={tw`font-bold text-[15px] text-gray-900`}>{item.name}</Text>
                    {item.desc ? <Text style={tw`text-[12px] text-gray-400 mt-1 leading-tight`}>{item.desc}</Text> : null}
                    <Text style={tw`text-[14px] font-bold text-green-600 mt-2`}>₹{item.price}</Text>
                  </View>

                  <View style={tw`items-center`}>
                    <Image
                      source={{ uri: itemPhoto }}
                      style={tw`w-16 h-16 rounded-xl bg-gray-100`}
                      resizeMode="cover"
                    />
                    
                    {!isShopOpen ? (
                      <View style={tw`bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 mt-2`}>
                        <Text style={tw`text-[11px] font-bold text-red-600`}>STORE CLOSED</Text>
                      </View>
                    ) : !isItemAvailable ? (
                      <View style={tw`bg-gray-100 border border-gray-300 rounded-lg px-3 py-1.5 mt-2`}>
                        <Text style={tw`text-[11px] font-bold text-gray-500`}>SOLD OUT</Text>
                      </View>
                    ) : currentQty > 0 ? (
                      <View style={[tw`flex-row items-center rounded-lg px-2.5 py-1 mt-2 gap-3`, { backgroundColor: '#8fda58' }]}>
                        <TouchableOpacity onPress={() => onChangeQuantity(item.id, -1)}>
                          <Text style={tw`text-white font-bold text-base px-1`}>-</Text>
                        </TouchableOpacity>
                        <Text style={tw`text-white text-xs font-bold`}>{currentQty}</Text>
                        <TouchableOpacity onPress={() => onAddToCart(item, shop)}>
                          <Text style={tw`text-white font-bold text-base px-1`}>+</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => onAddToCart(item, shop)}
                        style={[tw`bg-white border rounded-lg px-4 py-1.5 mt-2`, { borderColor: '#8fda58' }]}
                      >
                        <Text style={[tw`text-[11px] font-bold`, { color: '#8fda58' }]}>ADD</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )
            })}
          </View>
        )}
      </ScrollView>

      {/* Floating Cart Indicator */}
      {cartCount > 0 && (
        <TouchableOpacity
          onPress={onViewCart}
          activeOpacity={0.9}
          style={[tw`absolute bottom-6 inset-x-4 rounded-2xl p-4 flex-row justify-between items-center`, { backgroundColor: '#8fda58' }]}
        >
          <View>
            <Text style={tw`text-xs text-white/80 font-semibold`}>{cartCount} Items added</Text>
            <Text style={tw`text-sm font-black text-white mt-0.5`}>₹{cartSubtotal} plus delivery</Text>
          </View>
          <View
            style={[tw`rounded-xl px-4 py-2.5 flex-row items-center gap-1.5`, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
          >
            <Text style={tw`text-white font-bold text-xs`}>View Cart</Text>
            <IconArrowRight color="white" size={14} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  )
}
