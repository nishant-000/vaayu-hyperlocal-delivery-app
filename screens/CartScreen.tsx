import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, ScrollView, TextInput, Image, ActivityIndicator } from 'react-native'
import tw from 'twrnc'
import Svg, { Line, Polyline } from 'react-native-svg'
import { fetchRemoteConfig, subscribeToRemoteConfig, validatePromoCodeServerSide, AppConfig, DEFAULT_CONFIG } from '../lib/remoteConfig'
import { supabase } from '../lib/supabase'

interface CartScreenProps {
  cartItems: any[]
  cartShop: any
  changeQuantity: (id: string, diff: number) => void
  placeOrder: (finalTotal: number, discount: number, appliedPromo: string, deliveryMode: 'regular' | 'instant', selectedSlotId?: string) => void
  address: { area: string; room?: string; landmark: string }
  setAddress: React.Dispatch<React.SetStateAction<{ area: string; room?: string; landmark: string }>>
  onContinueShopping: () => void
  user: any
}

function QtyButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <TouchableOpacity
      onPress={onClick}
      style={[
        tw`w-7 h-7 rounded-full items-center justify-center`,
        { backgroundColor: '#f3f4f6' }
      ]}
    >
      <Text style={[tw`font-bold text-base`, { color: '#8fda58' }]}>{label}</Text>
    </TouchableOpacity>
  )
}

export default function CartScreen({
  cartItems,
  cartShop,
  changeQuantity,
  placeOrder,
  address,
  setAddress,
  onContinueShopping,
  user
}: CartScreenProps) {
  const [promoInput, setPromoInput] = useState('')
  const [appliedPromo, setAppliedPromo] = useState('')
  const [appliedPromoType, setAppliedPromoType] = useState('')
  const [promoDiscountAmount, setPromoDiscountAmount] = useState(0)
  const [promoError, setPromoError] = useState('')
  const [isValidatingPromo, setIsValidatingPromo] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [placed, setPlaced] = useState(false)
  const [placedOrderDetails, setPlacedOrderDetails] = useState<any>(null)
  const [deliveryMode, setDeliveryMode] = useState<'regular' | 'instant'>('regular')
  const [selectedSlotId, setSelectedSlotId] = useState('slot_1')
  const [feesExpanded, setFeesExpanded] = useState(false)
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG)

  // Fetch Remote Config & Subscribe to Realtime Updates for Instant Fee Changes
  useEffect(() => {
    fetchRemoteConfig().then(setConfig)
    const unsubscribe = subscribeToRemoteConfig(setConfig)
    return () => unsubscribe()
  }, [])

  // IST Timezone-aware minute calculation (Asia/Kolkata)
  const getISTMinutesFromMidnight = (nowDate?: Date): number => {
    const d = nowDate || new Date()
    try {
      const istTimeString = d.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      })
      const [hStr, mStr] = istTimeString.split(':')
      const hours = parseInt(hStr, 10) % 24
      const minutes = parseInt(mStr, 10)
      return hours * 60 + minutes
    } catch {
      return d.getHours() * 60 + d.getMinutes()
    }
  }

  // Live slot filtering: cutoff is dynamically computed as start_time - 30 minutes
  const getAvailableSlots = (nowDate?: Date) => {
    const currentMinutes = getISTMinutesFromMidnight(nowDate)
    const configuredSlots = config.delivery_slots || DEFAULT_CONFIG.delivery_slots

    return configuredSlots.filter(s => {
      // Dynamic cutoff calculation: 30 minutes before slot start time
      const startMinutesFromMidnight = (s.start_hour * 60) + s.start_minute
      const cutoffMinutes = startMinutesFromMidnight - 30
      return currentMinutes < cutoffMinutes
    })
  }

  const availableSlots = getAvailableSlots()

  // Ensure selectedSlotId points to a valid available slot (without silent deliveryMode mutation)
  useEffect(() => {
    if (availableSlots.length > 0 && !availableSlots.some(s => s.id === selectedSlotId)) {
      setSelectedSlotId(availableSlots[0].id)
    }
  }, [availableSlots])

  const freeDeliveryThreshold = config.free_delivery_threshold || 150
  const subtotal = cartItems.reduce((sum, i) => sum + i.price * (i.quantity || i.qty), 0)
  const isScheduledFree = deliveryMode === 'regular' && subtotal >= freeDeliveryThreshold
  const baseDeliveryFee = deliveryMode === 'instant' ? config.delivery_fee.instant : config.delivery_fee.scheduled
  const deliveryFee = subtotal === 0 ? 0 : (deliveryMode === 'instant' ? config.delivery_fee.instant : (isScheduledFree ? 0 : baseDeliveryFee))
  const platformFee = subtotal === 0 ? 0 : config.platform_fee
  const otherCharges = deliveryFee + platformFee
  const total = Math.max(0, subtotal + otherCharges - promoDiscountAmount)

  // Server-side promo code validation RPC call
  const applyPromoServerSide = async (codeToApply?: string) => {
    const targetCode = (codeToApply || promoInput).trim()
    if (!targetCode) return
    setIsValidatingPromo(true)
    setPromoError('')

    const result = await validatePromoCodeServerSide(targetCode, subtotal, platformFee)
    setIsValidatingPromo(false)

    if (result && result.valid) {
      setAppliedPromo(result.code)
      setAppliedPromoType(result.discount_type || '')
      setPromoDiscountAmount(result.discount || 0)
      setPromoInput(result.code)
      setPromoError('')
    } else {
      setPromoError(result?.reason || 'Invalid promo code')
      setAppliedPromo('')
      setAppliedPromoType('')
      setPromoDiscountAmount(0)
    }
  }

  // Real order placement writing to Supabase orders table
  const handlePlaceOrder = async () => {
    if (deliveryMode === 'regular' && availableSlots.length === 0) {
      alert('Scheduled slots for today are closed (must book 30+ mins before slot start). Switched to Instant ASAP delivery.')
      setDeliveryMode('instant')
      return
    }

    // Block order placement if shop is currently offline
    if (cartShop && (cartShop.isLiveToday === false || cartShop.is_open === false)) {
      alert(`"${cartShop.name || 'This shop'}" is currently offline and not accepting orders. Please try again when the shop is open.`)
      return
    }

    // Enforce stock quantity limits before placing order
    for (const cartItem of cartItems) {
      const shopItem = cartShop?.items?.find((i: any) => i.id === cartItem.id)
      const available = shopItem?.stockQuantity ?? shopItem?.stock_quantity
      if (available !== undefined && available !== null && (cartItem.quantity || cartItem.qty) > available) {
        alert(`"${cartItem.name}" only has ${available} unit(s) available. Please reduce the quantity.`)
        return
      }
    }

    setIsSubmitting(true)
    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
    const expireTime = new Date(Date.now() + 15 * 60 * 1000).toISOString()
    const selectedSlotLabel = deliveryMode === 'regular'
      ? (selectedSlotId === 'slot_1' ? '12:40 PM – 1:40 PM (Lunch Slot)' : '8:00 PM – 9:00 PM (Dinner Slot)')
      : undefined

    // Resolve authenticated Supabase user ID and profile phone number dynamically
    let authUid = user?.id || null
    let customerName = user?.name || user?.full_name || 'Campus Student'
    let customerPhone = user?.phone || user?.phone_number || ''

    try {
      const { data: authData } = await supabase.auth.getUser()
      if (authData?.user?.id) {
        authUid = authData.user.id
      }
      if (authUid) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('full_name, phone_number')
          .or(`id.eq.${authUid},user_id.eq.${authUid}`)
          .maybeSingle()
        if (prof) {
          if (prof.phone_number) customerPhone = prof.phone_number
          if (prof.full_name) customerName = prof.full_name
        }
      }
    } catch (_) {}

    const isFreePlatformFee = appliedPromoType === 'platform_fee' || 
      appliedPromoType === 'free_platform_fee' ||
      (appliedPromo && (
        ['FREEFEE', 'NOPLATFORM', 'FREEPLATFORM', 'ZEROFEES'].includes(appliedPromo.toUpperCase()) ||
        config.promo_codes?.some(p => p.code?.toUpperCase() === appliedPromo.toUpperCase() && (p.discount_type === 'platform_fee' || p.discount_type === 'free_platform_fee'))
      ))
    const chargedPlatformFee = isFreePlatformFee ? 0 : platformFee

    const orderPayload = {
      id: orderId,
      user_id: authUid,
      shop_id: cartShop?.id || null,
      shop_name: cartShop?.name || '',
      shop_phone: cartShop?.phone || null,
      customer_name: customerName,
      customer_phone: customerPhone,
      location: 'IIIT Trichy Campus',
      delivery_mode: deliveryMode,
      selected_slot_label: selectedSlotLabel || null,
      payment_mode: 'upi',
      status: 'incoming',
      items: cartItems.map(i => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity || i.qty,
        price: i.price,
      })),
      items_subtotal: subtotal,
      delivery_fee: deliveryFee,
      platform_fee: chargedPlatformFee,
      applied_promo: appliedPromo || null,
      promo_discount: promoDiscountAmount || 0,
      grand_total: total,
      expire_at: expireTime,
    }

    try {
      const { data: insertedOrder, error } = await supabase
        .from('orders')
        .insert([orderPayload])
        .select()
        .single()

      if (error) {
        console.error('[CartScreen] Error inserting order into Supabase:', error)
        setIsSubmitting(false)
        alert(`Order placement failed: ${error.message || 'Please try again.'}`)
        return
      }

      // Use server-verified grand total & order ID if returned
      const finalGrandTotal = insertedOrder?.grand_total ?? total
      const finalOrderId = insertedOrder?.id ?? orderId

      setPlacedOrderDetails({
        orderId: finalOrderId,
        total: finalGrandTotal,
      })
      setPlaced(true)
      setIsSubmitting(false)

      // Clear local cart
      placeOrder(finalGrandTotal, promoDiscountAmount, appliedPromo, deliveryMode, deliveryMode === 'regular' ? selectedSlotId : undefined)
    } catch (err: any) {
      console.warn('[CartScreen] Order insert error:', err)
      setIsSubmitting(false)
      alert(`Could not place order: ${err?.message || 'Network error'}`)
    }
  }

  if (placed) {
    return (
      <View style={tw`flex-1 items-center justify-center px-6 text-center bg-white`}>
        <View style={tw`w-24 h-24 rounded-full bg-green-100 items-center justify-center mb-6`}>
          <Text style={tw`text-5xl`}>🎉</Text>
        </View>
        <Text style={tw`text-[24px] font-black text-gray-900 mb-2`}>Order Placed!</Text>
        <Text style={tw`text-[14px] text-gray-500 font-medium mb-1`}>Your order is being sent to shop owner.</Text>
        <Text style={tw`text-[14px] text-gray-500 font-medium mb-8`}>
          Estimated delivery: <Text style={tw`font-bold text-gray-700`}>15–20 min</Text>
        </Text>
        <View style={[tw`border rounded-2xl px-6 py-4 mb-8 w-full`, { backgroundColor: '#eeeff5', borderColor: '#eeeff5' }]}>
          <Text style={[tw`text-[13px] font-semibold text-center`, { color: '#8fda58' }]}>
            Order ID: <Text style={[tw`font-black`, { color: '#8fda58' }]}>{placedOrderDetails?.orderId || '#ORD-9012'}</Text>
          </Text>
          <Text style={[tw`text-[13px] font-semibold mt-1 text-center`, { color: '#8fda58' }]}>
            Total paid: <Text style={[tw`font-black`, { color: '#8fda58' }]}>₹{placedOrderDetails?.total}</Text>
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            setPlaced(false)
            setAppliedPromo('')
            setPromoInput('')
            onContinueShopping()
          }}
          style={[tw`w-full py-4 rounded-2xl items-center`, { backgroundColor: '#8fda58' }]}
        >
          <Text style={tw`text-[15px] font-bold text-white`}>Continue shopping</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (cartItems.length === 0) {
    return (
      <View style={tw`flex-1 items-center justify-center px-6 text-center bg-white`}>
        <View style={tw`w-24 h-24 rounded-full bg-gray-100 items-center justify-center mb-6`}>
          <Text style={tw`text-5xl`}>🛒</Text>
        </View>
        <Text style={tw`text-[22px] font-black text-gray-900 mb-2`}>Your cart is empty</Text>
        <Text style={tw`text-[14px] text-gray-400 font-medium`}>Add items from a shop to get started.</Text>
        <TouchableOpacity
          onPress={onContinueShopping}
          style={[tw`px-6 py-3 rounded-xl mt-6`, { backgroundColor: '#8fda58' }]}
        >
          <Text style={tw`text-white font-bold text-xs`}>Go Shopping</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={tw`flex-1`}>
      {/* Header */}
      <View style={tw`bg-white border-b border-gray-100 px-4 pt-6 pb-4`}>
        <Text style={tw`text-[24px] font-black text-gray-900`}>Your Cart</Text>
        <Text style={tw`text-[13px] text-gray-400 font-medium mt-0.5`}>
          {cartItems.reduce((s, i) => s + (i.quantity || i.qty), 0)} items from {cartShop?.name}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-36`}>
        {/* Items */}
        <View style={tw`px-4 pt-4 flex-col gap-3`}>
          {cartItems.map(item => (
            <View key={item.id} style={tw`bg-white rounded-3xl p-3 shadow-sm flex-row items-center gap-3`}>
              <Image
                source={{ uri: item.img || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200' }}
                style={tw`w-16 h-16 rounded-2xl`}
                resizeMode="cover"
              />
              <View style={tw`flex-1 min-w-0`}>
                <Text style={tw`font-bold text-[14px] text-gray-900`} numberOfLines={1}>{item.name}</Text>
                <Text style={tw`text-[11px] text-gray-400 font-medium`}>{cartShop?.name}</Text>
                <Text style={tw`font-black text-[14px] text-gray-900 mt-1`}>₹{item.price}</Text>
              </View>
              <View style={tw`flex-row items-center gap-2 flex-none`}>
                <QtyButton label="−" onClick={() => changeQuantity(item.id, -1)} />
                <Text style={tw`text-[15px] font-black text-gray-900 w-5 text-center`}>{item.quantity || item.qty}</Text>
                <QtyButton label="+" onClick={() => changeQuantity(item.id, 1)} />
              </View>
            </View>
          ))}
        </View>

        {/* Delivery Mode Selection */}
        <View style={tw`mx-4 mt-4 bg-white rounded-3xl p-4 shadow-sm`}>
          <Text style={tw`text-gray-900 text-xs font-bold mb-3 uppercase tracking-wider`}>Delivery Mode</Text>
          <View style={tw`flex-row gap-3 mb-3`}>
            <TouchableOpacity
              onPress={() => setDeliveryMode('regular')}
              style={[
                tw`flex-1 p-3 rounded-2xl border-2 items-center`,
                { borderColor: deliveryMode === 'regular' ? '#8fda58' : '#e5e7eb', backgroundColor: deliveryMode === 'regular' ? '#eeeff5' : '#ffffff' }
              ]}
            >
              <Text style={tw`text-lg mb-1`}>📅</Text>
              <Text style={tw`text-xs font-bold text-gray-800`}>Scheduled Slot</Text>
              <Text style={tw`text-[10px] text-gray-400 font-medium mt-0.5`}>Fee: ₹{config.delivery_fee.scheduled}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setDeliveryMode('instant')}
              style={[
                tw`flex-1 p-3 rounded-2xl border-2 items-center`,
                { borderColor: deliveryMode === 'instant' ? '#8fda58' : '#e5e7eb', backgroundColor: deliveryMode === 'instant' ? '#eeeff5' : '#ffffff' }
              ]}
            >
              <Text style={tw`text-lg mb-1`}>⚡</Text>
              <Text style={tw`text-xs font-bold text-gray-800`}>Instant ASAP</Text>
              <Text style={tw`text-[10px] text-gray-400 font-medium mt-0.5`}>Fee: ₹{config.delivery_fee.instant}</Text>
            </TouchableOpacity>
          </View>

          {deliveryMode === 'regular' && (
            <View style={tw`mt-2`}>
              <Text style={tw`text-[10px] font-bold text-gray-400 uppercase mb-1.5`}>Select Delivery Slot</Text>
              {availableSlots.length === 0 ? (
                <View style={tw`bg-amber-50 border border-amber-200 rounded-2xl p-4 items-center justify-center`}>
                  <Text style={tw`text-[13px] font-black text-amber-950 text-center`}>
                    ⚠️ Scheduled Slots Closed For Today
                  </Text>
                  <Text style={tw`text-[11px] text-amber-800 text-center mt-1.5 font-medium leading-relaxed px-2`}>
                    Slots must be booked at least 30 minutes before slot start time. Tap below to switch to Instant delivery:
                  </Text>
                  <TouchableOpacity
                    onPress={() => setDeliveryMode('instant')}
                    style={[tw`mt-3 px-5 py-2.5 rounded-xl items-center flex-row justify-center gap-2 shadow-xs`, { backgroundColor: '#8fda58' }]}
                  >
                    <Text style={tw`text-xs font-black text-white`}>⚡ Switch to Instant ASAP Delivery</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={tw`flex-col gap-2`}>
                  {availableSlots.map(s => {
                    const isSelected = selectedSlotId === s.id
                    return (
                      <TouchableOpacity
                        key={s.id}
                        onPress={() => setSelectedSlotId(s.id)}
                        style={[
                          tw`w-full p-3 rounded-xl border flex-row items-center justify-between px-4`,
                          { borderColor: isSelected ? '#8fda58' : '#e5e7eb', backgroundColor: isSelected ? '#eeeff5' : '#f9fafb' }
                        ]}
                      >
                        <View style={tw`flex-row items-center gap-2`}>
                          <Text style={tw`text-xs font-bold text-gray-900`}>{s.name}:</Text>
                          <Text style={tw`text-xs font-semibold text-gray-600`}>{s.label}</Text>
                        </View>
                        {isSelected && <View style={tw`w-2 h-2 rounded-full bg-[#8fda58]`} />}
                      </TouchableOpacity>
                    )
                  })}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Delivery Details */}
        <View style={tw`mx-4 mt-4 bg-white rounded-3xl p-4 shadow-sm border border-gray-100`}>
          <Text style={tw`text-gray-900 text-xs font-bold uppercase tracking-wider mb-2.5`}>Delivery Location</Text>
          <View style={tw`bg-gray-50 p-3.5 rounded-2xl border border-gray-200/80`}>
            <Text style={tw`text-[13px] font-black text-gray-900`}>IIIT Trichy Campus</Text>
            <Text style={tw`text-[11px] font-medium text-gray-500 mt-0.5`}>Exclusive Campus Delivery Only</Text>
          </View>
        </View>

        {/* Promo code Server-Side Validation */}
        <View style={tw`mx-4 mt-4 bg-white rounded-3xl p-4 shadow-sm`}>
          <View style={tw`flex-row justify-between items-center mb-2`}>
            <Text style={tw`text-[13px] font-bold text-gray-700`}>Promo code</Text>
            {appliedPromo ? (
              <TouchableOpacity
                onPress={() => {
                  setAppliedPromo('')
                  setPromoDiscountAmount(0)
                  setPromoInput('')
                  setPromoError('')
                }}
              >
                <Text style={tw`text-[11px] font-bold text-red-500`}>Remove</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={tw`flex-row gap-2`}>
            <TextInput
              placeholder="Enter promo code"
              value={promoInput}
              onChangeText={text => { setPromoInput(text); setPromoError('') }}
              autoCapitalize="characters"
              placeholderTextColor="#9ca3af"
              style={tw`flex-1 bg-gray-100 rounded-xl px-3 py-2 text-[13px] font-medium text-gray-700`}
            />
            <TouchableOpacity
              onPress={() => applyPromoServerSide()}
              disabled={isValidatingPromo}
              style={[tw`px-4 py-2 rounded-xl justify-center items-center`, { backgroundColor: '#8fda58' }]}
            >
              {isValidatingPromo ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={tw`text-[13px] font-bold text-white`}>Apply</Text>
              )}
            </TouchableOpacity>
          </View>

          {appliedPromo ? (
            <View style={tw`mt-2.5 bg-green-50 border border-green-200 rounded-xl p-2.5 flex-row items-center justify-between`}>
              <Text style={[tw`text-[12px] font-bold`, { color: '#15803d' }]}>
                🎉 {appliedPromo} applied: ₹{promoDiscountAmount} discount!
              </Text>
            </View>
          ) : null}
          {promoError ? (
            <Text style={tw`text-[12px] text-red-500 font-semibold mt-2`}>{promoError}</Text>
          ) : null}
        </View>

        {/* Free Delivery Status Banner */}
        {/* Free Delivery Promo Banner */}
        <View style={[tw`mx-4 mt-3 rounded-2xl p-3.5 border flex-row items-center gap-2.5`, deliveryMode === 'instant' ? tw`bg-purple-50 border-purple-200` : isScheduledFree ? tw`bg-green-50 border-green-200` : tw`bg-blue-50 border-blue-100`]}>
          <Text style={tw`text-lg`}>{deliveryMode === 'instant' ? '⚡' : isScheduledFree ? '🎉' : '🚚'}</Text>
          <View style={tw`flex-1`}>
            {deliveryMode === 'instant' ? (
              <Text style={tw`text-[12px] font-bold text-purple-950`}>
                Instant Delivery: Standard ₹{config.delivery_fee.instant} fee applies. <Text style={tw`font-black underline`}>Free delivery ≥ ₹{freeDeliveryThreshold} is valid ONLY for Scheduled Delivery.</Text>
              </Text>
            ) : isScheduledFree ? (
              <Text style={tw`text-[12px] font-black text-green-800`}>
                FREE Scheduled Delivery Unlocked! (Order ≥ ₹{freeDeliveryThreshold})
              </Text>
            ) : (
              <Text style={tw`text-[12px] font-bold text-blue-900`}>
                Add ₹{freeDeliveryThreshold - subtotal} more for <Text style={tw`font-black text-green-700`}>FREE Scheduled Delivery!</Text>
              </Text>
            )}
          </View>
        </View>

        {/* Bill summary */}
        <View style={tw`mx-4 mt-3 bg-white rounded-3xl p-4 shadow-sm`}>
          <Text style={tw`text-[14px] font-bold text-gray-900 mb-3`}>Bill summary</Text>
          <View style={tw`flex-col gap-2`}>
            <View style={tw`flex-row justify-between`}>
              <Text style={tw`text-[13px] text-gray-500 font-medium`}>Subtotal</Text>
              <Text style={tw`text-[13px] font-semibold text-gray-800`}>₹{subtotal}</Text>
            </View>
            <View style={tw`flex-col`}>
              <TouchableOpacity
                onPress={() => setFeesExpanded(!feesExpanded)}
                style={tw`flex-row justify-between items-center py-0.5`}
              >
                <Text style={tw`text-[13px] text-gray-500 font-medium`}>Delivery & Platform Fee</Text>
                <Text style={tw`text-[13px] font-semibold text-gray-800`}>₹{otherCharges}</Text>
              </TouchableOpacity>

              {feesExpanded && (
                <View style={tw`bg-gray-50 rounded-xl px-3 py-2 mt-1.5 flex-col gap-1.5 border border-gray-100`}>
                  <View style={tw`flex-row justify-between`}>
                    <Text style={tw`text-[11px] text-gray-400 font-medium`}>Delivery fee ({deliveryMode})</Text>
                    <Text style={tw`text-[11px] font-semibold text-gray-600`}>₹{deliveryFee}</Text>
                  </View>
                  <View style={tw`flex-row justify-between`}>
                    <Text style={tw`text-[11px] text-gray-400 font-medium`}>Platform fee (Vaayu)</Text>
                    <Text style={tw`text-[11px] font-semibold text-gray-600`}>₹{platformFee}</Text>
                  </View>
                </View>
              )}
            </View>

            {promoDiscountAmount > 0 && (
              <View style={tw`flex-row justify-between`}>
                <Text style={[tw`text-[13px] font-medium`, { color: '#8fda58' }]}>Promo discount</Text>
                <Text style={[tw`text-[13px] font-semibold`, { color: '#8fda58' }]}>−₹{promoDiscountAmount}</Text>
              </View>
            )}

            <View style={tw`border-t border-gray-100 pt-2 mt-1 flex-row justify-between`}>
              <Text style={tw`text-[15px] font-black text-gray-900`}>Total</Text>
              <Text style={tw`text-[15px] font-black text-gray-900`}>₹{total}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Checkout Button Capsule */}
      <View style={tw`absolute bottom-0 inset-x-0 bg-white border-t border-gray-100 px-4 pt-3 pb-24 flex-row`}>
        <TouchableOpacity
          onPress={handlePlaceOrder}
          disabled={isSubmitting}
          style={[tw`w-full py-4 rounded-2xl flex-row items-center justify-between px-6 shadow-md`, { backgroundColor: '#8fda58' }]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Text style={tw`text-[16px] font-black text-white`}>Place Order</Text>
              <View style={tw`flex-row items-center gap-1.5`}>
                <Text style={tw`text-[15px] font-bold text-white`}>₹{total}</Text>
              </View>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}
