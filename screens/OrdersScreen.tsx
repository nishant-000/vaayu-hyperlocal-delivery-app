import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native'
import tw from 'twrnc'
import Svg, { Polyline } from 'react-native-svg'
import { supabase } from '../lib/supabase'

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  delivered:        { label: 'Delivered',            color: '#8fda58', bg: '#eeeff5', dot: '#8fda58' },
  out_for_delivery: { label: 'Out for Delivery',     color: '#7c3aed', bg: '#f3e8ff', dot: '#7c3aed' },
  delivering:       { label: 'Out for Delivery',     color: '#7c3aed', bg: '#f3e8ff', dot: '#7c3aed' },
  preparing:        { label: 'Accepted & Preparing', color: '#ea580c', bg: '#ffedd5', dot: '#ea580c' },
  accepted:         { label: 'Accepted by Shop',     color: '#16a34a', bg: '#dcfce7', dot: '#16a34a' },
  incoming:         { label: 'Order Placed',         color: '#2563eb', bg: '#eff6ff', dot: '#2563eb' },
  pending:          { label: 'Order Placed',         color: '#2563eb', bg: '#eff6ff', dot: '#2563eb' },
  cancelled:        { label: 'Cancelled',            color: '#dc2626', bg: '#fef2f2', dot: '#dc2626' },
}

const tabs = ['All', 'Active', 'Past']

function LiveTracker({ activeOrder }: { activeOrder: any }) {
  if (!activeOrder) return null

  const getStepIndex = (status: string) => {
    if (status === 'delivered') return 3
    if (status === 'out_for_delivery' || status === 'delivering') return 2
    if (status === 'preparing' || status === 'accepted') return 1
    return 0 // incoming / pending
  }

  const currentStep = getStepIndex(activeOrder.status)

  return (
    <View style={[tw`mx-4 mb-4 rounded-3xl overflow-hidden`, { backgroundColor: '#8fda58' }]}>
      <View style={tw`p-4`}>
        <View style={tw`flex-row items-start justify-between mb-3`}>
          <View style={tw`flex-1 mr-2`}>
            <Text style={[tw`text-[10px] font-bold uppercase tracking-widest mb-1`, { color: '#c084fc' }]}>Live tracking</Text>
            <Text style={tw`text-white font-black text-[18px]`}>Order #{activeOrder.id}</Text>
            <Text style={[tw`text-[12px] font-medium mt-0.5`, { color: '#eeeff5' }]} numberOfLines={1}>
              📍 {activeOrder.location}
            </Text>
          </View>
          <View style={tw`bg-white/20 rounded-2xl px-3 py-1.5 items-center`}>
            <Text style={tw`text-white font-black text-[15px] leading-none uppercase`}>
              {activeOrder.status === 'out_for_delivery' ? 'ON ROAD' : activeOrder.status === 'preparing' ? 'COOKING' : 'PENDING'}
            </Text>
          </View>
        </View>

        {/* Progress steps */}
        <View style={tw`flex-row items-center mt-4`}>
          {['Placed', 'Preparing', 'Out for Delivery', 'Delivered'].map((step, i) => {
            const done = i < currentStep
            const active = i === currentStep
            return (
              <View key={step} style={tw`flex-1 items-center`}>
                <View style={tw`flex-row items-center w-full`}>
                  {i > 0 && <View style={[tw`flex-1 h-0.5`, { backgroundColor: done || active ? '#c084fc' : 'rgba(255,255,255,0.2)' }]} />}
                  <View
                    style={[
                      tw`w-5 h-5 rounded-full items-center justify-center`,
                      {
                        backgroundColor: done ? '#c084fc' : active ? '#ffffff' : 'rgba(255,255,255,0.2)',
                      }
                    ]}
                  >
                    {done && (
                      <Svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8fda58" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <Polyline points="20 6 9 17 4 12"/>
                      </Svg>
                    )}
                    {active && <View style={tw`w-2.5 h-2.5 rounded-full bg-purple-500`} />}
                  </View>
                  {i < 3 && <View style={[tw`flex-1 h-0.5`, { backgroundColor: done ? '#c084fc' : 'rgba(255,255,255,0.2)' }]} />}
                </View>
                <Text style={[tw`text-[8px] font-semibold mt-1.5 text-center`, { color: done || active ? '#eeeff5' : 'rgba(255,255,255,0.4)' }]}>{step}</Text>
              </View>
            )
          })}
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
      setLoading(true)
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setOrders(data)
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

  const activeOrder = orders.find(o => o.status !== 'delivered' && o.status !== 'cancelled')

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
        {/* Live tracker card for active order */}
        {activeOrder && (activeTab === 'All' || activeTab === 'Active') && (
          <LiveTracker activeOrder={activeOrder} />
        )}

        <View style={tw`flex-col gap-3 px-4`}>
          {loading ? (
            <View style={tw`py-10 items-center justify-center`}>
              <ActivityIndicator size="large" color="#8fda58" />
              <Text style={tw`text-xs text-gray-400 font-medium mt-2`}>Syncing live orders...</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View style={tw`bg-white rounded-3xl p-8 items-center justify-center text-center shadow-xs border border-gray-100`}>
              <Text style={tw`text-4xl mb-2`}>📦</Text>
              <Text style={tw`text-base font-bold text-gray-900`}>No orders found</Text>
              <Text style={tw`text-xs text-gray-400 font-medium mt-1`}>Your order history will appear here.</Text>
            </View>
          ) : (
            filtered.map(order => {
              const s = statusConfig[order.status] || { label: order.status, color: '#6b7280', bg: '#f3f4f6', dot: '#9ca3af' }
              return (
                <View key={order.id} style={tw`bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100`}>
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
