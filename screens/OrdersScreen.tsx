import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import tw from 'twrnc'
import Svg, { Polyline } from 'react-native-svg'
import { supabase } from '../lib/supabase'
import { getCache, setCache } from '../lib/cache'

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  delivered:        { label: 'Delivered',         color: '#16a34a', bg: '#dcfce7', dot: '#16a34a' },
  ready_for_pickup: { label: 'Collect Your Order', color: '#9333ea', bg: '#f3e8ff', dot: '#9333ea' },
  out_for_delivery: { label: 'Out for Delivery',  color: '#ea580c', bg: '#ffedd5', dot: '#ea580c' },
  preparing:        { label: 'Out for Delivery',  color: '#ea580c', bg: '#ffedd5', dot: '#ea580c' },
  accepted:         { label: 'Out for Delivery',  color: '#ea580c', bg: '#ffedd5', dot: '#ea580c' },
  incoming:         { label: 'Order Placed',      color: '#2563eb', bg: '#eff6ff', dot: '#2563eb' },
  pending:          { label: 'Order Placed',      color: '#2563eb', bg: '#eff6ff', dot: '#2563eb' },
  cancelled:        { label: 'Cancelled',         color: '#dc2626', bg: '#fef2f2', dot: '#dc2626' },
}

const tabs = ['All', 'Active', 'Past']

export function getSlotEndTimeDate(slotLabel: string, createdAtIso?: string): Date | null {
  try {
    const orderDate = createdAtIso ? new Date(createdAtIso) : new Date()
    const parts = slotLabel.split(/[-–—to]/i)
    const endTimeStr = (parts.length > 1 ? parts[1] : parts[0]).trim()

    const match = endTimeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
    if (!match) return null

    let hours = parseInt(match[1], 10)
    const minutes = parseInt(match[2], 10)
    const ampm = match[3] ? match[3].toUpperCase() : null

    if (ampm === 'PM' && hours < 12) hours += 12
    if (ampm === 'AM' && hours === 12) hours = 0

    const slotDate = new Date(orderDate)
    slotDate.setHours(hours, minutes, 0, 0)
    return slotDate
  } catch (e) {
    return null
  }
}

export function isOrderLate(order: any): boolean {
  if (!order || order.status === 'delivered' || order.status === 'cancelled') {
    return false
  }

  const now = new Date()

  // 1. If explicit slot_end_time timestamp is stored, use it
  if (order.slot_end_time) {
    const slotEnd = new Date(order.slot_end_time)
    return now > slotEnd
  }

  // 2. Instant delivery: late if current time > created_at + 20 minutes
  if (order.delivery_mode === 'instant' || !order.selected_slot_label) {
    const createdAt = new Date(order.created_at || Date.now())
    const expectedTime = new Date(createdAt.getTime() + 20 * 60 * 1000)
    return now > expectedTime
  }

  // 3. Parse selected_slot_label
  if (order.selected_slot_label) {
    const slotEndTime = getSlotEndTimeDate(order.selected_slot_label, order.created_at)
    if (slotEndTime) {
      return now > slotEndTime
    }
  }

  return false
}

function getStepIndex(status: string) {
  if (status === 'delivered') return 3
  if (status === 'ready_for_pickup') return 2
  if (status === 'out_for_delivery' || status === 'preparing' || status === 'accepted') return 1
  return 0 // incoming / pending
}

// 🟢 Per-Order Tracking Card Component (Dark Green #1a3a2a)
function ActiveOrderTrackingCard({ order }: { order: any }) {
  const currentStep = getStepIndex(order.status)
  const isInstant = order.delivery_mode === 'instant' || !order.selected_slot_label
  const late = isOrderLate(order)

  const expectedText = isInstant
    ? '20 mins from order placement'
    : (order.selected_slot_label || 'Selected Slot')

  const statusDisplayTitle = late
    ? 'OVERDUE'
    : order.status === 'ready_for_pickup'
    ? 'COLLECT AT GATE'
    : order.status === 'out_for_delivery' || order.status === 'preparing' || order.status === 'accepted'
    ? 'ON THE WAY'
    : 'ORDER PLACED'

  return (
    <View style={[tw`rounded-3xl overflow-hidden shadow-md mb-3`, { backgroundColor: '#1a3a2a' }]}>
      <View style={tw`p-5`}>
        <View style={tw`flex-row items-start justify-between mb-3`}>
          <View style={tw`flex-1 mr-2`}>
            <View style={tw`flex-row items-center gap-2 mb-1`}>
              <Text style={tw`text-[10px] font-black uppercase tracking-widest text-[#8fda58]`}>Live tracking</Text>
              {late && (
                <View style={tw`bg-red-500 rounded-full px-2 py-0.5`}>
                  <Text style={tw`text-white font-black text-[9px] uppercase tracking-wider`}>⚠️ LATE</Text>
                </View>
              )}
            </View>
            <Text style={tw`text-white font-black text-[20px]`}>Order #{order.id}</Text>
            <Text style={tw`text-[12px] font-medium text-gray-300 mt-0.5`} numberOfLines={1}>
              📍 {order.location}
            </Text>
          </View>
          <View style={[tw`border rounded-2xl px-3 py-1.5 items-center`, { backgroundColor: late ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.1)', borderColor: late ? '#ef4444' : 'rgba(255,255,255,0.2)' }]}>
            <Text style={[tw`font-black text-[12px] leading-none uppercase`, { color: late ? '#f87171' : '#8fda58' }]}>
              {statusDisplayTitle}
            </Text>
          </View>
        </View>

        {/* Expected Time of Delivery */}
        <View style={[tw`rounded-2xl p-3 mb-4 border`, { backgroundColor: late ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.1)', borderColor: late ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.1)' }]}>
          <Text style={tw`text-[10px] font-bold text-gray-300 uppercase tracking-wider mb-0.5`}>
            {isInstant ? '⚡ Instant Delivery' : '📅 Scheduled Slot'}
          </Text>
          <Text style={tw`text-[13px] font-black text-white`}>
            Expected Delivery: <Text style={{ color: late ? '#f87171' : '#8fda58' }}>{expectedText}</Text>
            {late && <Text style={tw`text-red-400 font-bold text-[11px]`}> (Past Schedule)</Text>}
          </Text>
        </View>

        {/* Progress steps: Placed -> Out for Delivery -> Collect Your Order -> Delivered */}
        <View style={tw`flex-row items-center mt-1 mb-2`}>
          {['Placed', 'Out for Delivery', 'Collect Your Order', 'Delivered'].map((step, i) => {
            const done = i < currentStep
            const active = i === currentStep
            return (
              <View key={step} style={tw`flex-1 items-center`}>
                <View style={tw`flex-row items-center w-full`}>
                  {i > 0 && <View style={[tw`flex-1 h-0.5`, { backgroundColor: done || active ? '#8fda58' : 'rgba(255,255,255,0.2)' }]} />}
                  <View
                    style={[
                      tw`w-5 h-5 rounded-full items-center justify-center`,
                      {
                        backgroundColor: done ? '#8fda58' : active ? '#ffffff' : 'rgba(255,255,255,0.2)',
                      }
                    ]}
                  >
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

        {/* Amount & Time footer */}
        <View style={tw`flex-row items-center justify-between pt-3 border-t border-white/10 mt-1`}>
          <Text style={tw`text-[12px] text-gray-300 font-medium`}>
            {new Date(order.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <Text style={tw`font-black text-[16px] text-white`}>₹{order.grand_total || order.total_amount || 0}</Text>
        </View>
      </View>
    </View>
  )
}

interface OrdersScreenProps {
  orders: any[]
  onReorder: (order: any) => void
  onTrackOrder: (order: any) => void
  user: any
}

export default function OrdersScreen({ orders: initialOrders, onReorder, onTrackOrder, user }: OrdersScreenProps) {
  const [activeTab, setActiveTab] = useState('All')
  const [orders, setOrders] = useState<any[]>(initialOrders || [])
  const [loading, setLoading] = useState(false)

  // Fetch real orders from Supabase & Subscribe to Realtime Updates
  useEffect(() => {
    async function fetchOrders() {
      // 1. Instant Cache Hydration for 0ms Load Time
      const cached = await getCache<any[]>('user_orders')
      if (cached && cached.length > 0) {
        setOrders(cached)
        setLoading(false)
      } else {
        setLoading(true)
      }

      // 2. Fetch fresh orders from Supabase in background
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setOrders(data)
        await setCache('user_orders', data, 300)
      }
      setLoading(false)
    }

    fetchOrders()

    // Subscribe to Supabase Realtime on orders table
    const subscription = supabase
      .channel('customer_orders_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setOrders(prev => [payload.new, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new : o))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [user])

  const filtered = orders.filter(o => {
    if (activeTab === 'Active') return o.status === 'out_for_delivery' || o.status === 'delivering' || o.status === 'preparing' || o.status === 'accepted' || o.status === 'incoming' || o.status === 'pending'
    if (activeTab === 'Past') return o.status === 'delivered' || o.status === 'cancelled'
    return true
  })

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      {/* Header */}
      <View style={tw`bg-white border-b border-gray-100 px-4 pt-6 pb-3`}>
        <Text style={tw`text-[24px] font-black text-gray-900`}>My Orders</Text>
        <Text style={tw`text-[13px] text-gray-400 font-medium mt-0.5`}>Live tracking & order status</Text>
        
        {/* Tabs */}
        <View style={tw`flex-row gap-2 mt-3`}>
          {tabs.map(t => (
            <TouchableOpacity
              key={t}
              onPress={() => setActiveTab(t)}
              style={[
                tw`px-4 py-1.5 rounded-full`,
                {
                  backgroundColor: activeTab === t ? '#8fda58' : '#f3f4f6',
                }
              ]}
            >
              <Text style={{ color: activeTab === t ? '#ffffff' : '#6b7280', fontSize: 13, fontWeight: '600' }}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-36 pt-4`}>
        <View style={tw`flex-col gap-3 px-4`}>
          {loading ? (
            <View style={tw`py-12 items-center justify-center`}>
              <ActivityIndicator size="large" color="#8fda58" />
            </View>
          ) : filtered.length === 0 ? (
            <View style={tw`bg-white rounded-3xl p-8 items-center justify-center text-center shadow-xs border border-gray-100`}>
              <Text style={tw`text-4xl mb-2`}>📦</Text>
              <Text style={tw`text-base font-bold text-gray-900`}>No orders found</Text>
              <Text style={tw`text-xs text-gray-400 font-medium mt-1`}>Your order history will appear here.</Text>
            </View>
          ) : (
            filtered.map(order => {
              const isActive = order.status !== 'delivered' && order.status !== 'cancelled'

              // Active orders get their own dark green tracking card!
              if (isActive) {
                return <ActiveOrderTrackingCard key={order.id} order={order} />
              }

              // Delivered or Cancelled orders get the plain white card design
              const s = statusConfig[order.status] || { label: order.status, color: '#6b7280', bg: '#f3f4f6', dot: '#9ca3af' }
              return (
                <View key={order.id} style={tw`bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 mb-3`}>
                  <View style={tw`flex-row gap-3 p-4`}>
                    <View style={tw`w-14 h-14 rounded-2xl bg-green-100 items-center justify-center`}>
                      <Text style={tw`text-2xl`}>🍔</Text>
                    </View>
                    <View style={tw`flex-1 min-w-0`}>
                      <View style={tw`flex-row items-start justify-between gap-2`}>
                        <Text style={tw`font-black text-[16px] text-gray-900`}>#{order.id}</Text>
                        <View style={[tw`rounded-full px-2.5 py-0.5 flex-row items-center gap-1`, { backgroundColor: s.bg }]}>
                          <View style={[tw`w-1.5 h-1.5 rounded-full`, { backgroundColor: s.dot }]} />
                          <Text style={{ color: s.color, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }}>
                            {s.label}
                          </Text>
                        </View>
                      </View>

                      <Text style={tw`text-[12px] text-gray-500 font-medium mt-1`} numberOfLines={1}>
                        📍 {order.location}
                      </Text>

                      <View style={tw`bg-gray-50 rounded-xl px-2.5 py-1.5 mt-2 border border-gray-100`}>
                        <Text style={tw`text-[11px] font-bold text-gray-700`}>
                          ⏱️ Expected: <Text style={tw`font-black text-gray-900`}>{order.delivery_mode === 'instant' ? '20 mins from order placement' : (order.selected_slot_label || 'Selected Slot')}</Text>
                        </Text>
                      </View>

                      <View style={tw`flex-row items-center justify-between mt-2 pt-2 border-t border-gray-100`}>
                        <Text style={tw`text-[12px] text-gray-400 font-medium`}>
                          {new Date(order.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        <Text style={tw`font-black text-[16px] text-gray-900`}>₹{order.grand_total || order.total_amount || 0}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )
            })
          )}
        </View>
      </ScrollView>
    </View>
  )
}

