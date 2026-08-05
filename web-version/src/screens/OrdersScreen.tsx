import { useState } from 'react'

const orders = [
  {
    id: 'ORD-8841',
    shop: 'Campus Bites',
    items: ['Veg Burger x1', 'Fries x1', 'Cold Coffee x1'],
    total: 249,
    status: 'delivered',
    date: 'Today, 2:30 PM',
    img: 'https://images.unsplash.com/photo-1667329829058-ac191ba4a905?w=200&h=200&fit=crop&auto=format',
    time: '18 min',
  },
  {
    id: 'ORD-8812',
    shop: 'The Brew House',
    items: ['Cappuccino x2', 'Chocolate Muffin x1'],
    total: 180,
    status: 'on_the_way',
    date: 'Today, 12:15 PM',
    img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=200&fit=crop&auto=format',
    time: '5 min away',
  },
  {
    id: 'ORD-8790',
    shop: 'Green Leaf Grocery',
    items: ['Milk 1L x2', 'Bread x1', 'Eggs x6', 'Butter x1'],
    total: 315,
    status: 'preparing',
    date: 'Today, 11:00 AM',
    img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&h=200&fit=crop&auto=format',
    time: 'Preparing',
  },
  {
    id: 'ORD-8754',
    shop: 'Pharma Plus',
    items: ['Paracetamol 500mg x1', 'Vitamin C x1'],
    total: 95,
    status: 'delivered',
    date: 'Yesterday, 6:45 PM',
    img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop&auto=format',
    time: '22 min',
  },
  {
    id: 'ORD-8701',
    shop: 'Sharma Stationery',
    items: ['A4 Notebook x2', 'Ball Pen Set x1'],
    total: 130,
    status: 'cancelled',
    date: 'Mon, 10:20 AM',
    img: 'https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=200&h=200&fit=crop&auto=format',
    time: '—',
  },
]

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  delivered:        { label: 'Delivered',        color: '#16a34a', bg: '#f0fdf4', dot: '#16a34a' },
  on_the_way:       { label: 'OUT FOR DELIVERY', color: '#ea580c', bg: '#fff7ed', dot: '#ea580c' },
  out_for_delivery: { label: 'OUT FOR DELIVERY', color: '#ea580c', bg: '#fff7ed', dot: '#ea580c' },
  delivering:       { label: 'OUT FOR DELIVERY', color: '#ea580c', bg: '#fff7ed', dot: '#ea580c' },
  preparing:        { label: 'Preparing',        color: '#d97706', bg: '#fffbeb', dot: '#d97706' },
  cancelled:        { label: 'Cancelled',        color: '#dc2626', bg: '#fef2f2', dot: '#dc2626' },
}

const tabs = ['All', 'Active', 'Past']

function LiveTracker() {
  return (
    <div className="mx-4 mb-4 rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a3a2a 0%, #16a34a 100%)' }}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-green-300 text-[10px] font-bold uppercase tracking-widest mb-1">Live tracking</p>
            <p className="text-white font-black text-[18px]">The Brew House</p>
            <p className="text-green-200 text-[12px] font-medium mt-0.5">Cappuccino x2 · Chocolate Muffin x1</p>
          </div>
          <div className="bg-white/20 rounded-2xl px-3 py-1.5 text-center">
            <p className="text-white font-black text-[20px] leading-none">5</p>
            <p className="text-green-200 text-[9px] font-bold uppercase">min</p>
          </div>
        </div>
        {/* Progress steps */}
        <div className="flex items-center gap-0 mt-4">
          {['Placed', 'Preparing', 'OUT FOR DELIVERY', 'Delivered'].map((step, i) => {
            const done = i < 2
            const active = i === 2
            return (
              <div key={step} className="flex-1 flex flex-col items-center">
                <div className="flex items-center w-full">
                  {i > 0 && <div className="flex-1 h-0.5" style={{ backgroundColor: done || active ? '#86efac' : 'rgba(255,255,255,0.2)' }} />}
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-none"
                    style={{
                      backgroundColor: done ? '#86efac' : active ? '#ffffff' : 'rgba(255,255,255,0.2)',
                    }}
                  >
                    {done && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                    {active && <div className="w-2.5 h-2.5 rounded-full bg-green-500" />}
                  </div>
                  {i < 3 && <div className="flex-1 h-0.5" style={{ backgroundColor: done ? '#86efac' : 'rgba(255,255,255,0.2)' }} />}
                </div>
                <p className="text-[9px] font-semibold mt-1.5" style={{ color: done || active ? '#d1fae5' : 'rgba(255,255,255,0.4)' }}>{step}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function OrdersScreen() {
  const [activeTab, setActiveTab] = useState('All')

  const filtered = orders.filter(o => {
    if (activeTab === 'Active') return o.status === 'on_the_way' || o.status === 'preparing'
    if (activeTab === 'Past') return o.status === 'delivered' || o.status === 'cancelled'
    return true
  })

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-6 pb-3">
        <h1 className="text-[24px] font-black text-gray-900">My Orders</h1>
        <p className="text-[13px] text-gray-400 font-medium mt-0.5">Track and reorder your deliveries</p>
        {/* Tabs */}
        <div className="flex gap-2 mt-3">
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className="px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all"
              style={{
                backgroundColor: activeTab === t ? '#1a3a2a' : '#f3f4f6',
                color: activeTab === t ? '#ffffff' : '#6b7280',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar py-4">
        {/* Live tracker card — only show when active tab includes on_the_way */}
        {(activeTab === 'All' || activeTab === 'Active') && <LiveTracker />}

        <div className="flex flex-col gap-3 px-4">
          {filtered.map(order => {
            const s = statusConfig[order.status]
            return (
              <div key={order.id} className="bg-white rounded-3xl overflow-hidden shadow-sm">
                <div className="flex gap-3 p-3">
                  <img
                    src={order.img}
                    alt={order.shop}
                    className="w-16 h-16 rounded-2xl object-cover flex-none"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-[14px] text-gray-900">{order.shop}</p>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-none flex items-center gap-1"
                        style={{ backgroundColor: s.bg, color: s.color }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
                        {s.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 font-medium mt-0.5 truncate">{order.items.join(' · ')}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-[12px] text-gray-500 font-medium">{order.date}</p>
                      <p className="font-black text-[14px] text-gray-900">₹{order.total}</p>
                    </div>
                  </div>
                </div>
                {/* Actions */}
                <div className="border-t border-gray-100 flex">
                  <button className="flex-1 py-2.5 text-[12px] font-semibold text-gray-500 hover:text-gray-700 transition-colors">
                    View details
                  </button>
                  <div className="w-px bg-gray-100" />
                  {order.status === 'delivered' || order.status === 'cancelled' ? (
                    <button className="flex-1 py-2.5 text-[12px] font-bold text-green-600 hover:text-green-700 transition-colors">
                      Reorder
                    </button>
                  ) : (
                    <button className="flex-1 py-2.5 text-[12px] font-bold text-blue-600 hover:text-blue-700 transition-colors">
                      Track order
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
