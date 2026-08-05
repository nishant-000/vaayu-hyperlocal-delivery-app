import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Linking } from 'react-native'
import tw from 'twrnc'
import Svg, { Polyline } from 'react-native-svg'
import { supabase } from '../lib/supabase'
import { isOrderLate } from '../screens/OrdersScreen'

interface OrderDetailsModalProps {
  visible: boolean
  orderId: string | null
  initialOrder?: any
  onClose: () => void
  isOwnerView?: boolean
}

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  delivered:        { label: 'Delivered',         color: '#16a34a', bg: '#dcfce7', dot: '#16a34a' },
  ready_for_pickup: { label: 'Collect Order',     color: '#9333ea', bg: '#f3e8ff', dot: '#9333ea' },
  out_for_delivery: { label: 'OUT FOR DELIVERY',  color: '#ea580c', bg: '#ffedd5', dot: '#ea580c' },
  delivering:       { label: 'OUT FOR DELIVERY',  color: '#ea580c', bg: '#ffedd5', dot: '#ea580c' },
  preparing:        { label: 'OUT FOR DELIVERY',  color: '#ea580c', bg: '#ffedd5', dot: '#ea580c' },
  accepted:         { label: 'Order Confirmed',   color: '#2563eb', bg: '#eff6ff', dot: '#2563eb' },
  incoming:         { label: 'Order Confirmed',   color: '#2563eb', bg: '#eff6ff', dot: '#2563eb' },
  pending:          { label: 'Order Confirmed',   color: '#2563eb', bg: '#eff6ff', dot: '#2563eb' },
  cancelled:        { label: 'Cancelled',         color: '#dc2626', bg: '#fef2f2', dot: '#dc2626' },
}

function getStepIndex(status: string) {
  if (status === 'delivered') return 3
  if (status === 'ready_for_pickup') return 2
  if (status === 'out_for_delivery' || status === 'delivering' || status === 'preparing') return 1
  return 0
}

export default function OrderDetailsModal({ visible, orderId, initialOrder, onClose, isOwnerView }: OrderDetailsModalProps) {
  const [order, setOrder] = useState<any>(initialOrder || null)
  const [loading, setLoading] = useState<boolean>(false)
  const [customerPhone, setCustomerPhone] = useState<string>(initialOrder?.customer_phone || '')
  const [customerName, setCustomerName] = useState<string>(initialOrder?.customer_name || '')
  const [shopPhone, setShopPhone] = useState<string>(initialOrder?.shop_phone || '')

  // Fetch fresh order details by ID whenever modal opens + real-time subscription & fallback polling
  useEffect(() => {
    if (!orderId || !visible) return

    async function loadFreshOrder(showSpinner = false) {
      if (showSpinner) setLoading(true)
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (!error && data) {
        setOrder(data)
        if (data.customer_name) setCustomerName(data.customer_name)
        if (data.customer_phone) setCustomerPhone(data.customer_phone)
        if (data.shop_phone) setShopPhone(data.shop_phone)

        if (data.shop_id && !data.shop_phone) {
          const { data: sData } = await supabase
            .from('shops')
            .select('phone')
            .eq('id', data.shop_id)
            .maybeSingle()
          if (sData?.phone) setShopPhone(sData.phone)
        }

        if (data.user_id) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('full_name, phone_number')
            .or(`id.eq.${data.user_id},user_id.eq.${data.user_id}`)
            .maybeSingle()
          
          if (prof) {
            if (prof.phone_number) setCustomerPhone(prof.phone_number)
            if (prof.full_name) setCustomerName(prof.full_name)
          }
        }
      } else if (initialOrder) {
        setOrder(initialOrder)
        if (initialOrder.customer_name) setCustomerName(initialOrder.customer_name)
        if (initialOrder.customer_phone) setCustomerPhone(initialOrder.customer_phone)
        if (initialOrder.shop_phone) setShopPhone(initialOrder.shop_phone)
      }
      if (showSpinner) setLoading(false)
    }

    loadFreshOrder(true)

    // Realtime subscription for live updates inside details modal
    const channel = supabase
      .channel(`order_details_${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => {
          setOrder(payload.new)
        }
      )
      .subscribe()

    // 3-second polling fallback while modal is open
    const pollTimer = setInterval(() => {
      loadFreshOrder(false)
    }, 3000)

    return () => {
      clearInterval(pollTimer)
      supabase.removeChannel(channel)
    }
  }, [orderId, visible])

  if (!visible) return null

  const late = isOrderLate(order)
  const currentStep = getStepIndex(order?.status || '')
  const isActive = order?.status && order.status !== 'delivered' && order.status !== 'cancelled'
  const s = statusConfig[order?.status] || { label: order?.status || 'Processing', color: '#6b7280', bg: '#f3f4f6', dot: '#9ca3af' }

  // Items array normalized from JSONB or fallback
  const items = Array.isArray(order?.items) ? order.items : []
  const subtotal = Number(order?.items_subtotal || items.reduce((sum: number, i: any) => sum + (Number(i.price || 0) * (i.quantity || i.qty || 1)), 0))
  const deliveryFee = Number(order?.delivery_fee || 0)
  const platformFee = Number(order?.platform_fee || 0)
  const grandTotal = Number(order?.grand_total || order?.total_amount || 0)

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={tw`flex-1 bg-black/70 justify-end`}>
        <View style={tw`bg-white rounded-t-[32px] max-h-[90%] overflow-hidden shadow-2xl`}>
          {/* Modal Header */}
          <View style={tw`bg-white px-6 pt-5 pb-4 border-b border-gray-100 flex-row items-center justify-between`}>
            <View>
              <Text style={tw`text-[11px] font-bold text-gray-400 uppercase tracking-wider`}>Order Details</Text>
              <Text style={tw`text-[20px] font-black text-gray-900 mt-0.5`}>#{orderId}</Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={tw`w-9 h-9 rounded-full bg-gray-100 items-center justify-center`}
            >
              <Text style={tw`text-gray-500 font-bold text-base`}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading && !order ? (
            <View style={tw`p-12 items-center justify-center`}>
              <ActivityIndicator size="large" color="#8fda58" />
              <Text style={tw`text-xs text-gray-400 font-medium mt-3`}>Loading order details...</Text>
            </View>
          ) : order ? (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`p-6 gap-5 pb-12`}>
              
              {/* Status Header Pill */}
              <View style={tw`flex-row items-center justify-between bg-gray-50 rounded-2xl p-4 border border-gray-100`}>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1`}>Status</Text>
                  <View style={tw`flex-row items-center gap-2`}>
                    <View style={[tw`rounded-full px-3 py-1 flex-row items-center gap-1.5`, { backgroundColor: late ? '#fef2f2' : s.bg }]}>
                      <View style={[tw`w-2 h-2 rounded-full`, { backgroundColor: late ? '#dc2626' : s.dot }]} />
                      <Text style={{ color: late ? '#dc2626' : s.color, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' }}>
                        {late ? '⚠️ LATE / OVERDUE' : s.label}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Live Tracking Progress Stepper (If Active) */}
              {isActive && (
                <View style={[tw`rounded-3xl p-5 border`, { backgroundColor: '#1a3a2a', borderColor: '#1a3a2a' }]}>
                  <Text style={tw`text-[10px] font-black uppercase tracking-widest text-[#8fda58] mb-3`}>Live Progress</Text>
                  <View style={tw`flex-row items-center`}>
                    {['Order Confirmed', 'OUT FOR DELIVERY', 'Collect Order', 'Delivered'].map((step, i) => {
                      const done = i < currentStep
                      const active = i === currentStep
                      return (
                        <View key={step} style={tw`flex-1 items-center`}>
                          <View style={tw`flex-row items-center w-full`}>
                            {i > 0 && <View style={[tw`flex-1 h-0.5`, { backgroundColor: done || active ? '#8fda58' : 'rgba(255,255,255,0.2)' }]} />}
                            <View style={[tw`w-5 h-5 rounded-full items-center justify-center`, { backgroundColor: done ? '#8fda58' : active ? '#ffffff' : 'rgba(255,255,255,0.2)' }]}>
                              {done && (
                                <Svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1a3a2a" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                  <Polyline points="20 6 9 17 4 12"/>
                                </Svg>
                              )}
                              {active && <View style={tw`w-2.5 h-2.5 rounded-full bg-[#8fda58]`} />}
                            </View>
                            {i < 3 && <View style={[tw`flex-1 h-0.5`, { backgroundColor: done ? '#8fda58' : 'rgba(255,255,255,0.2)' }]} />}
                          </View>
                          <Text style={[tw`text-[8px] font-bold mt-1.5 text-center`, { color: done || active ? '#ffffff' : 'rgba(255,255,255,0.4)' }]}>{step}</Text>
                        </View>
                      )
                    })}
                  </View>
                </View>
              )}

              {/* Partial Order Alert Banner */}
              {order.is_partial && (
                <View style={tw`bg-amber-50 border border-amber-300 rounded-3xl p-4 gap-1.5 shadow-xs`}>
                  <View style={tw`flex-row items-center gap-1.5`}>
                    <Text style={tw`text-[13px] font-black text-amber-900 uppercase tracking-wide`}>⚠️ Partial Order Accepted</Text>
                  </View>
                  <Text style={tw`text-[12px] text-amber-900 font-medium leading-4`}>
                    The shop could not fulfill all items. Out-of-stock items have been excluded, and your final bill has been updated.
                  </Text>
                  {order.partial_reason && (
                    <Text style={tw`text-[11px] text-amber-800 font-bold mt-0.5`}>
                      Shop note: "{order.partial_reason}"
                    </Text>
                  )}
                </View>
              )}

              {/* Itemized Order List */}
              <View style={tw`bg-white rounded-3xl p-5 border border-gray-100 shadow-sm`}>
                <Text style={tw`text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3`}>
                  Itemized Order ({items.length} {items.length === 1 ? 'item' : 'items'})
                </Text>

                <View style={tw`gap-3`}>
                  {items.map((item: any, idx: number) => {
                    const isUnavailable = item.is_unavailable || item.quantity === 0
                    const qty = item.quantity !== undefined ? item.quantity : (item.qty || 1)
                    const unitPrice = Number(item.price || 0)
                    const lineTotal = isUnavailable ? 0 : qty * unitPrice
                    return (
                      <View key={idx} style={[tw`flex-row items-center justify-between py-2 border-b border-gray-50 last:border-b-0`, isUnavailable ? tw`opacity-50` : {}]}>
                        <View style={tw`flex-1 mr-3`}>
                          <View style={tw`flex-row items-center gap-1.5 flex-wrap`}>
                            <Text style={[tw`text-[14px] font-bold`, isUnavailable ? tw`line-through text-gray-400` : tw`text-gray-900`]}>
                              {item.name || 'Item'}
                            </Text>
                            {isUnavailable && (
                              <View style={tw`bg-red-100 px-1.5 py-0.2 rounded`}>
                                <Text style={tw`text-[9px] font-black text-red-700 uppercase`}>Out of Stock</Text>
                              </View>
                            )}
                          </View>
                          <Text style={[tw`text-[11px] font-medium mt-0.5`, isUnavailable ? tw`text-gray-400` : tw`text-gray-400`]}>
                            ₹{unitPrice} × {qty}
                            {item.original_quantity && item.original_quantity !== qty ? ` (ordered ${item.original_quantity})` : ''}
                          </Text>
                        </View>
                        <Text style={[tw`text-[14px] font-black`, isUnavailable ? tw`line-through text-gray-400` : tw`text-gray-900`]}>
                          ₹{lineTotal}
                        </Text>
                      </View>
                    )
                  })}
                </View>
              </View>

              {/* Financial Price Breakdown */}
              <View style={tw`bg-white rounded-3xl p-5 border border-gray-100 shadow-sm gap-2.5`}>
                <Text style={tw`text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1`}>Price Breakdown</Text>
                
                <View style={tw`flex-row justify-between text-xs text-gray-500`}>
                  <Text style={tw`text-[13px] text-gray-600 font-medium`}>Item Subtotal</Text>
                  <Text style={tw`text-[13px] text-gray-800 font-bold`}>₹{subtotal}</Text>
                </View>

                <View style={tw`flex-row justify-between text-xs`}>
                  <Text style={tw`text-[13px] text-gray-600 font-medium`}>
                    Delivery Fee ({order.delivery_mode === 'instant' ? 'Instant ASAP' : 'Scheduled'})
                  </Text>
                  <Text style={tw`text-[13px] ${deliveryFee === 0 ? 'font-black text-green-600' : 'text-gray-800 font-bold'}`}>
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                  </Text>
                </View>

                {platformFee > 0 && (
                  <View style={tw`flex-row justify-between text-xs`}>
                    <Text style={tw`text-[13px] text-gray-600 font-medium`}>Platform Fee (Vaayu)</Text>
                    <Text style={tw`text-[13px] text-gray-800 font-bold`}>₹{platformFee}</Text>
                  </View>
                )}

                {order.applied_promo && (
                  <View style={tw`flex-row justify-between text-xs text-emerald-600`}>
                    <Text style={tw`text-[13px] font-bold`}>Promo Applied ({order.applied_promo})</Text>
                    <Text style={tw`text-[13px] font-black`}>-₹{order.promo_discount || 0}</Text>
                  </View>
                )}

                <View style={tw`flex-row justify-between pt-3 border-t border-gray-100 mt-1`}>
                  <Text style={tw`text-[15px] font-black text-gray-900`}>Grand Total</Text>
                  <Text style={tw`text-[18px] font-black text-gray-900`}>₹{grandTotal}</Text>
                </View>
              </View>

              {/* Delivery Details */}
              <View style={tw`bg-white rounded-3xl p-5 border border-gray-100 shadow-sm gap-2.5`}>
                <Text style={tw`text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1`}>Delivery & Schedule Info</Text>

                <View style={tw`gap-1`}>
                  <Text style={tw`text-[11px] font-bold text-gray-400 uppercase`}>Store</Text>
                  <Text style={tw`text-[14px] font-black text-gray-900`}>{order.shop_name || 'Bits Store'}</Text>
                </View>

                {/* Customer View: Clickable Store Phone */}
                {!isOwnerView && (
                  <View style={tw`bg-emerald-50 border border-emerald-300 rounded-2xl p-3 flex-row items-center justify-between mt-1 shadow-xs`}>
                    <View style={tw`flex-1 mr-2`}>
                      <Text style={tw`text-[10px] font-black text-emerald-800 uppercase tracking-wider`}>Store Contact</Text>
                      <Text style={tw`text-[15px] font-black text-gray-900 mt-0.5`} numberOfLines={1}>
                        🏪 {order.shop_name || 'Campus Store'}
                      </Text>
                    </View>
                    {(shopPhone || order.shop_phone) ? (
                      <TouchableOpacity
                        onPress={() => Linking.openURL(`tel:${shopPhone || order.shop_phone}`)}
                        activeOpacity={0.8}
                        style={tw`flex-row items-center gap-2 bg-green-600 px-3.5 py-2 rounded-xl shadow-md`}
                      >
                        <Text style={tw`text-base`}>📞</Text>
                        <View>
                          <Text style={tw`text-[9px] font-black text-green-100 uppercase tracking-widest leading-tight`}>TAP TO CALL</Text>
                          <Text style={tw`text-[13px] font-black text-white leading-none tracking-wide`}>{shopPhone || order.shop_phone}</Text>
                        </View>
                      </TouchableOpacity>
                    ) : (
                      <View style={tw`bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200`}>
                        <Text style={tw`text-[11px] font-bold text-gray-400`}>📞 No Phone</Text>
                      </View>
                    )}
                  </View>
                )}

                {isOwnerView && (
                  <View style={tw`bg-emerald-50 border border-emerald-300 rounded-2xl p-3 flex-row items-center justify-between mt-1 shadow-xs`}>
                    <View style={tw`flex-1 mr-2`}>
                      <Text style={tw`text-[10px] font-black text-emerald-800 uppercase tracking-wider`}>Customer</Text>
                      <Text style={tw`text-[15px] font-black text-gray-900 mt-0.5`} numberOfLines={1}>
                        👤 {customerName || order.customer_name || 'Campus Student'}
                      </Text>
                    </View>
                    {customerPhone ? (
                      <TouchableOpacity
                        onPress={() => Linking.openURL(`tel:${customerPhone}`)}
                        activeOpacity={0.8}
                        style={tw`flex-row items-center gap-2 bg-green-600 px-3.5 py-2 rounded-xl shadow-md`}
                      >
                        <Text style={tw`text-base`}>📞</Text>
                        <View>
                          <Text style={tw`text-[9px] font-black text-green-100 uppercase tracking-widest leading-tight`}>TAP TO CALL</Text>
                          <Text style={tw`text-[13px] font-black text-white leading-none tracking-wide`}>{customerPhone}</Text>
                        </View>
                      </TouchableOpacity>
                    ) : (
                      <View style={tw`bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200`}>
                        <Text style={tw`text-[11px] font-bold text-gray-400`}>📞 No Phone</Text>
                      </View>
                    )}
                  </View>
                )}

                <View style={tw`gap-1 mt-1`}>
                  <Text style={tw`text-[11px] font-bold text-gray-400 uppercase`}>Full Delivery Address</Text>
                  <Text style={tw`text-[13px] font-bold text-gray-800 leading-relaxed`}>{order.location}</Text>
                </View>

                <View style={tw`gap-1 mt-1`}>
                  <Text style={tw`text-[11px] font-bold text-gray-400 uppercase`}>Delivery Slot / Schedule</Text>
                  <Text style={tw`text-[13px] font-bold text-gray-800`}>
                    {order.delivery_mode === 'instant' ? '⚡ Instant ASAP Delivery (20 mins)' : (order.selected_slot_label || '📅 Scheduled Slot')}
                  </Text>
                </View>

                <View style={tw`gap-1 mt-1`}>
                  <Text style={tw`text-[11px] font-bold text-gray-400 uppercase`}>Order Timestamp</Text>
                  <Text style={tw`text-[12px] font-semibold text-gray-600`}>
                    {new Date(order.created_at || Date.now()).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </Text>
                </View>
              </View>

            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  )
}
