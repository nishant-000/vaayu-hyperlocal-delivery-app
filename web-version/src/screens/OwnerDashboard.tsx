import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const i18n: Record<string, Record<string, string>> = {
  en: {
    orders: "Orders",
    menu: "Food Stock",
    settings: "Settings",
    shopOpen: "🟢 SHOP IS OPEN FOR ORDERS",
    shopClosed: "🔴 SHOP IS CLOSED FOR TODAY",
    tapToClose: "(Tap to Close)",
    tapToOpen: "(Tap to Open)",
    newWaiting: "NEW ORDERS WAITING",
    todayCash: "TODAY'S CASH",
    accept: "✅ ACCEPT ORDER",
    decline: "❌ DECLINE",
    markReady: "🛵 MARK READY (DISPATCH)",
    markDelivered: "🎉 MARK DELIVERED",
    completed: "✓ DELIVERED",
    rejected: "✕ REJECTED",
    inStock: "🟢 IN STOCK",
    soldOut: "🔴 SOLD OUT",
    addFood: "➕ ADD NEW FOOD ITEM",
    photoButton: "📷 TAP TO UPLOAD FOOD PHOTO",
    saveFood: "SAVE FOOD ITEM",
    namePlaceholder: "Food Name (e.g. Samosa)",
    pricePlaceholder: "Price in ₹ (e.g. 20)",
    addWorker: "👥 ADD SHOP WORKER STAFF",
    workerHelp: "Add helper phone numbers to grant them access to this app.",
    workerName: "Worker Name (e.g. Ramesh)",
    workerPhone: "Worker Mobile Number (+91 98765 00000)",
    saveWorker: "ADD WORKER",
    logout: "LOG OUT PARTNER PORTAL",
    language: "🌐 SELECT APP LANGUAGE",
    timeLeft: "TIME LEFT TO ACCEPT",
    scheduled: "🟢 SCHEDULED ORDER",
    instant: "⚡ INSTANT DELIVERY",
    subtotal: "Food Items Subtotal",
    deliveryFee: "Delivery Fee",
    platformFee: "Platform Fee (Vaayu)",
    grandTotal: "TOTAL FROM CUSTOMER",
    financialSummary: "🏦 VAAYU FINANCIAL SETTLEMENT & RETURN VAULT",
    instantDeliveryTag: "⚡ Instant Delivery Fees (₹10/order)",
    scheduledDeliveryTag: "🟢 Scheduled Delivery Fees (₹5/order)",
    platformFeeTag: "🛵 Platform Fees Owed to Vaayu (₹5/order)",
    totalOwedToVaayu: "💸 CASH TO RETURN TO VAAYU",
    shopNetEarnings: "💰 SHOP NET FOOD EARNINGS",
  },
  hi: {
    orders: "आर्डर",
    menu: "खाना स्टॉक",
    settings: "सेटिंग्स",
    shopOpen: "🟢 दुकान चालू है (आर्डर आ रहे हैं)",
    shopClosed: "🔴 दुकान आज बंद है",
    tapToClose: "(बंद करने के लिए दबाएं)",
    tapToOpen: "(चालू करने के लिए दबाएं)",
    newWaiting: "नए आर्डर प्रतिक्षा में",
    todayCash: "आज की कुल बिक्री",
    accept: "✅ स्वीकार करें (स्वीकार)",
    decline: "❌ मना करें",
    markReady: "🛵 तैयार है (रवाना करें)",
    markDelivered: "🎉 डिलिवर हो गया",
    completed: "✓ पूर्ण हुआ",
    rejected: "✕ आर्डर रद्द",
    inStock: "🟢 उपलब्ध है",
    soldOut: "🔴 खत्म हो गया",
    addFood: "➕ नया खाना जोड़ें",
    photoButton: "📷 फोटो जोड़ने के लिए दबाएं",
    saveFood: "खाना सेव करें",
    namePlaceholder: "खाने का नाम (जैसे समोसा)",
    pricePlaceholder: "कीमत ₹ (जैसे 20)",
    addWorker: "👥 हेल्पर / वर्कर जोड़ें",
    workerHelp: "अपने हेल्पर का मोबाइल नंबर जोड़ें ताकि वे आर्डर ले सकें।",
    workerName: "वर्कर का नाम (जैसे रमेश)",
    workerPhone: "वर्कर मोबाइल नंबर (+91 98765 00000)",
    saveWorker: "वर्कर जोड़ें",
    logout: "लॉग आउट करें",
    language: "🌐 भाषा चुनें / SELECT LANGUAGE",
    timeLeft: "स्वीकार करने का समय",
    scheduled: "🟢 निर्धारित आर्डर",
    instant: "⚡ तुरंत डिलिवरी",
    subtotal: "खाद्य सामग्री कुल",
    deliveryFee: "डिलिवरी शुल्क",
    platformFee: "वायु प्लेटफॉर्म शुल्क",
    grandTotal: "ग्राहक से कुल प्राप्त राशि",
    financialSummary: "🏦 वायु वित्तीय हिसाब और देय राशि",
    instantDeliveryTag: "⚡ तुरंत डिलिवरी शुल्क (₹10/आर्डर)",
    scheduledDeliveryTag: "🟢 निर्धारित डिलिवरी शुल्क (₹5/आर्डर)",
    platformFeeTag: "🛵 वायु प्लेटफॉर्म शुल्क (₹5/आर्डर)",
    totalOwedToVaayu: "💸 वायु को लौटाई जाने वाली कुल राशि",
    shopNetEarnings: "💰 दुकानदार की शुद्ध खाद्य कमाई",
  },
  ta: {
    orders: "ஆர்டர்கள்",
    menu: "உணவு இருப்பு",
    settings: "அமைப்புகள்",
    shopOpen: "🟢 கடை திறக்கப்பட்டுள்ளது",
    shopClosed: "🔴 கடை இன்று மூடப்பட்டுள்ளது",
    tapToClose: "(மூட தட்டவும்)",
    tapToOpen: "(திறக்க தட்டவும்)",
    newWaiting: "புதிய ஆர்டர்கள்",
    todayCash: "இன்றைய விற்பனை",
    accept: "✅ ஏற்றுக்கொள்",
    decline: "❌ நிராகரி",
    markReady: "🛵 தயார் (அனுப்பு)",
    markDelivered: "🎉 டெலிவரி செய்யப்பட்டது",
    completed: "✓ முடிந்தது",
    rejected: "✕ நிராகரிக்கப்பட்டது",
    inStock: "🟢 இருப்பில் உள்ளது",
    soldOut: "🔴 முடிந்தது",
    addFood: "➕ புதிய உணவு சேர்க்க",
    photoButton: "📷 படம் சேர்க்க தட்டவும்",
    saveFood: "சேமிக்க",
    namePlaceholder: "உணவு பெயர் (எ.கா சமோசா)",
    pricePlaceholder: "விலை ₹ (எ.கா 20)",
    addWorker: "👥 பணியாளரைச் சேர்க்க",
    workerHelp: "பணியாளர் மொபைல் எண்ணைச் சேர்க்கவும்.",
    workerName: "பணியாளர் பெயர்",
    workerPhone: "மொபைல் எண் (+91 98765 00000)",
    saveWorker: "சேர்க்க",
    logout: "வெளியேறு",
    language: "🌐 மொழியைத் தேர்ந்தெடுக்கவும்",
    timeLeft: "ஏற்றுக்கொள்ள நேரம்",
    scheduled: "🟢 திட்டமிடப்பட்ட ஆர்டர்",
    instant: "⚡ உடனடி டெலிவரி",
    subtotal: "உணவு மொத்தம்",
    deliveryFee: "டெலிவரி கட்டணம்",
    platformFee: "வாயு பிளாட்ஃபார்ம் கட்டணம்",
    grandTotal: "வாடிக்கையாளர் மொத்தம்",
    financialSummary: "🏦 வாயு நிதி கணக்கு விவரம்",
    instantDeliveryTag: "⚡ உடனடி டெலிவரி கட்டணம் (₹10/ஆர்டர்)",
    scheduledDeliveryTag: "🟢 திட்டமிடப்பட்ட டெலிவரி கட்டணம் (₹5/ஆர்டர்)",
    platformFeeTag: "🛵 வாயு கட்டணம் (₹5/ஆர்டர்)",
    totalOwedToVaayu: "💸 வாயுவிற்கு செலுத்த வேண்டிய தொகை",
    shopNetEarnings: "💰 கடை நிகர வருமானம்",
  }
}

interface OwnerDashboardProps {
  user: any
  onSignOut: () => void
}

export default function OwnerDashboard({ user, onSignOut }: OwnerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'settings'>('orders')
  const [isLiveToday, setIsLiveToday] = useState(true)
  const [lang, setLang] = useState<'en' | 'hi' | 'ta'>('en')
  const [loading, setLoading] = useState(true)

  const t = i18n[lang] || i18n['en']

  const triggerBeep = () => {
    try {
      if ('vibrate' in navigator) navigator.vibrate(100)
    } catch {}
  }

  // Real Database State (No Mock Data!)
  const [orders, setOrders] = useState<any[]>([])
  const [menuItems, setMenuItems] = useState<any[]>([])
  const [workers, setWorkers] = useState<any[]>([])

  // Form Inputs
  const [newWorkerName, setNewWorkerName] = useState('')
  const [newWorkerPhone, setNewWorkerPhone] = useState('')

  const [newItemName, setNewItemName] = useState('')
  const [newItemPrice, setNewItemPrice] = useState('')
  const [newItemImg, setNewItemImg] = useState('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200')

  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const showToast = (msg: string) => {
    triggerBeep()
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 2500)
  }

  // Load Real Data from Supabase & Subscribe to Realtime Updates
  useEffect(() => {
    async function loadShopData() {
      setLoading(true)

      // Fetch Orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (ordersData) setOrders(ordersData)

      // Fetch Menu Items
      const { data: menuData } = await supabase
        .from('menu_items')
        .select('*')
        .order('created_at', { ascending: false })

      if (menuData) {
        setMenuItems(menuData.map(m => ({
          id: m.id,
          name: m.name,
          price: m.price,
          available: m.is_available,
          img: m.image_url || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200'
        })))
      }

      // Fetch Shop Workers
      const { data: workersData } = await supabase
        .from('shop_workers')
        .select('*')
        .order('created_at', { ascending: false })

      if (workersData) {
        setWorkers(workersData.map(w => ({
          id: w.id,
          name: w.worker_name,
          phone: w.worker_phone
        })))
      }

      setLoading(false)
    }

    loadShopData()

    // Realtime Orders Subscription
    const ordersSub = supabase
      .channel('web_shop_orders_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        console.log('[Web OwnerDashboard] Realtime order payload:', payload)
        triggerBeep()
        if (payload.eventType === 'INSERT') {
          setOrders(prev => [payload.new, ...prev])
          showToast(`🔔 New Order #${payload.new.id} Received!`)
        } else if (payload.eventType === 'UPDATE') {
          setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new : o))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(ordersSub)
    }
  }, [])

  // Timer Tick
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const getTimerDetails = (expireAtStr?: string) => {
    const expireTime = expireAtStr ? new Date(expireAtStr).getTime() : (now + 15 * 60 * 1000)
    const diff = Math.max(0, Math.floor((expireTime - now) / 1000))
    const totalSecs = 15 * 60
    const ratio = diff / totalSecs
    const mins = Math.floor(diff / 60)
    const secs = diff % 60
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`

    let colorClass = 'bg-green-500'
    let textClass = 'text-green-700'
    let bgClass = 'bg-green-50'
    let borderClass = 'border-green-200'

    if (mins < 5) {
      colorClass = 'bg-red-500'
      textClass = 'text-red-700'
      bgClass = 'bg-red-50'
      borderClass = 'border-red-200'
    } else if (mins < 10) {
      colorClass = 'bg-orange-500'
      textClass = 'text-orange-700'
      bgClass = 'bg-orange-50'
      borderClass = 'border-orange-200'
    }

    return { timeStr, ratio, colorClass, textClass, bgClass, borderClass }
  }

  const getOrderBill = (order: any) => {
    const isInstant = order.delivery_mode === 'instant'
    const deliveryFee = order.delivery_fee || (isInstant ? 10 : 5)
    const platformFee = order.platform_fee || 5
    const itemsSubtotal = order.items_subtotal || (Array.isArray(order.items)
      ? order.items.reduce((s: number, i: any) => s + (i.price * i.quantity), 0)
      : 0)
    const grandTotal = order.grand_total || (itemsSubtotal + deliveryFee + platformFee)
    return { isInstant, itemsSubtotal, deliveryFee, platformFee, grandTotal }
  }

  // Update status in Supabase
  const handleUpdateStatus = async (orderId: string, newStatus: string, reason?: string) => {
    triggerBeep()
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus, cancel_reason: reason } : o))
    showToast(`Status updated to ${newStatus}`)

    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus, cancel_reason: reason })
      .eq('id', orderId)

    if (error) {
      console.error('[Web OwnerDashboard] Failed to update status in Supabase:', error)
    }
  }

  // Toggle stock in Supabase
  const handleToggleStock = async (itemId: string, currentAvailable: boolean) => {
    triggerBeep()
    const nextAvailable = !currentAvailable
    setMenuItems(prev => prev.map(i => i.id === itemId ? { ...i, available: nextAvailable } : i))

    const { error } = await supabase
      .from('menu_items')
      .update({ is_available: nextAvailable })
      .eq('id', itemId)

    if (error) {
      console.error('[Web OwnerDashboard] Failed to toggle stock in Supabase:', error)
    }
  }

  // Add Item to Supabase
  const handleAddItem = async () => {
    if (!newItemName || !newItemPrice) {
      showToast('Enter food name & price')
      return
    }

    const itemPrice = parseFloat(newItemPrice) || 0
    const { data, error } = await supabase.from('menu_items').insert([{
      name: newItemName,
      price: itemPrice,
      is_available: true,
      image_url: newItemImg
    }]).select()

    if (!error && data && data.length > 0) {
      const created = data[0]
      setMenuItems(prev => [{ id: created.id, name: created.name, price: created.price, available: true, img: created.image_url }, ...prev])
      setNewItemName('')
      setNewItemPrice('')
      showToast('Food Added to Menu!')
    }
  }

  // Add Worker to Supabase
  const handleAddWorker = async () => {
    if (!newWorkerName || !newWorkerPhone) {
      showToast('Enter worker info')
      return
    }

    const { data, error } = await supabase.from('shop_workers').insert([{
      worker_name: newWorkerName,
      worker_phone: newWorkerPhone
    }]).select()

    if (!error && data && data.length > 0) {
      const created = data[0]
      setWorkers(prev => [{ id: created.id, name: created.worker_name, phone: created.worker_phone }, ...prev])
      setNewWorkerName('')
      setNewWorkerPhone('')
      showToast('Worker Added!')
    }
  }

  const incomingCount = orders.filter(o => o.status === 'incoming').length
  const validOrders = orders.filter(o => o.status !== 'cancelled')
  const totalOrdersCount = validOrders.length

  const instantOrdersCount = validOrders.filter(o => o.delivery_mode === 'instant').length
  const instantDeliveryFeesTotal = instantOrdersCount * 10

  const scheduledOrdersCount = validOrders.filter(o => o.delivery_mode !== 'instant').length
  const scheduledDeliveryFeesTotal = scheduledOrdersCount * 5

  const totalDeliveryFeesCollected = instantDeliveryFeesTotal + scheduledDeliveryFeesTotal
  const totalPlatformFeesToVaayu = totalOrdersCount * 5
  const totalAmountOwedToVaayu = totalDeliveryFeesCollected + totalPlatformFeesToVaayu

  const todayTotalCashCollected = validOrders.reduce((sum, o) => sum + (o.grand_total || getOrderBill(o).grandTotal), 0)
  const shopNetFoodEarnings = todayTotalCashCollected - totalAmountOwedToVaayu

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-28 max-w-[430px] mx-auto relative select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-black text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl flex items-center gap-2">
          <span>✨</span> {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="bg-white px-5 pt-6 pb-4 border-b border-gray-200 sticky top-0 z-30">
        <div className="flex justify-between items-center mb-2">
          <div>
            <p className="text-[12px] font-black text-green-700 uppercase tracking-widest">
              {user?.role === 'worker' ? 'WORKER PORTAL' : 'SHOP OWNER'}
            </p>
            <h1 className="text-[26px] font-black text-gray-900 leading-tight">{user?.name || 'Campus Bites Cafe'}</h1>
          </div>

          {/* Language Toggle */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {(['en', 'hi', 'ta'] as const).map((l) => (
              <button
                key={l}
                onClick={() => {
                  setLang(l)
                  triggerBeep()
                }}
                className={`px-2.5 py-1 rounded-lg font-black text-[11px] uppercase cursor-pointer ${
                  lang === l ? 'bg-green-700 text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {l === 'en' ? 'EN' : l === 'hi' ? 'हिंदी' : 'தமி'}
              </button>
            ))}
          </div>
        </div>

        {/* GIANT GO-LIVE BUTTON */}
        <button
          onClick={() => {
            const next = !isLiveToday
            setIsLiveToday(next)
            showToast(next ? t.shopOpen : t.shopClosed)
          }}
          className={`w-full h-14 rounded-2xl font-black text-[17px] tracking-wide text-white uppercase shadow-md transition-transform active:scale-[0.98] cursor-pointer flex items-center justify-center border-2 ${
            isLiveToday ? 'bg-green-600 border-green-700' : 'bg-red-600 border-red-700'
          }`}
        >
          {isLiveToday ? `${t.shopOpen} ${t.tapToClose}` : `${t.shopClosed} ${t.tapToOpen}`}
        </button>
      </div>

      {/* 2 Summary Cards */}
      <div className="grid grid-cols-2 gap-3 p-4">
        <div className={`rounded-2xl p-4 border ${incomingCount > 0 ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200'}`}>
          <p className="text-[12px] font-black uppercase text-gray-500">{t.newWaiting}</p>
          <p className={`text-[32px] font-black mt-0.5 ${incomingCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>{incomingCount}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200">
          <p className="text-[12px] font-black uppercase text-gray-500">{t.todayCash}</p>
          <p className="text-[32px] font-black text-gray-900 mt-0.5">₹{todayTotalCashCollected}</p>
        </div>
      </div>

      <div className="px-4 flex-1">
        {/* ── 1. ORDERS TAB ── */}
        {activeTab === 'orders' && (
          <div className="flex flex-col gap-4">
            <h2 className="text-[18px] font-black text-gray-900">{t.orders} ({orders.length})</h2>

            {loading ? (
              <div className="py-10 text-center text-xs text-gray-400 font-medium">Loading orders from Supabase...</div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-gray-200 shadow-sm">
                <span className="text-4xl block mb-2">📋</span>
                <p className="text-base font-bold text-gray-900">No orders yet today</p>
                <p className="text-xs text-gray-400 font-medium mt-1">New customer orders will appear here automatically.</p>
              </div>
            ) : (
              orders.map(order => {
                const timer = getTimerDetails(order.expire_at)
                const bill = getOrderBill(order)

                return (
                  <div key={order.id} className="bg-white rounded-3xl p-5 border-2 border-gray-300 shadow-md flex flex-col gap-3">
                    <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                      <div>
                        <span className="text-[28px] font-black text-gray-900 block leading-none">#{order.id}</span>
                        <span className="text-[20px] font-black text-green-700 mt-1 block">📍 {order.location}</span>
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        <span className="bg-gray-100 px-3 py-1.5 rounded-full text-2xl">
                          {order.payment_mode === 'cod' ? '💵' : '📱'}
                        </span>
                        <span className={`text-[12px] font-black px-3 py-1 rounded-full uppercase ${
                          order.status === 'incoming' ? 'bg-red-100 text-red-700' :
                          order.status === 'preparing' || order.status === 'accepted' ? 'bg-orange-100 text-orange-700' :
                          order.status === 'out_for_delivery' || order.status === 'delivering' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {order.status === 'incoming' ? '📥 NEW' :
                           order.status === 'preparing' || order.status === 'accepted' ? '🍳 COOK' :
                           order.status === 'out_for_delivery' || order.status === 'delivering' ? '🛵 ROAD' : '✅ DONE'}
                        </span>
                      </div>
                    </div>

                    {/* Progress Timer */}
                    {order.status === 'incoming' && (
                      <div className={`rounded-2xl p-3 border flex flex-col gap-1.5 ${timer.bgClass} ${timer.borderClass}`}>
                        <div className="flex justify-between items-center">
                          <span className={`text-[13px] font-black ${timer.textClass}`}>⏱️ {t.timeLeft}:</span>
                          <span className={`text-[18px] font-black font-mono ${timer.textClass}`}>{timer.timeStr}</span>
                        </div>
                        <div className="w-full h-3.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${timer.colorClass}`} style={{ width: `${Math.max(5, Math.min(100, timer.ratio * 100))}%` }} />
                        </div>
                      </div>
                    )}

                    {/* Delivery Mode Badge */}
                    {order.delivery_mode === 'instant' ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 flex justify-between items-center text-xs">
                        <span className="font-black text-blue-700 uppercase">{t.instant}</span>
                        <span className="font-bold text-blue-800">Within 15 Mins</span>
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-2.5 flex justify-between items-center text-xs">
                        <span className="font-black text-green-700 uppercase">{t.scheduled}</span>
                        <span className="font-bold text-green-800">{order.selected_slot_label || '12:00 PM – 2:00 PM'}</span>
                      </div>
                    )}

                    {/* Items & Fees Breakdown */}
                    <div className="bg-gray-50 rounded-2xl p-3 flex flex-col gap-2 border border-gray-200">
                      {Array.isArray(order.items) && order.items.map((it: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-[15px]">
                          <span className="font-black text-gray-900">{it.name} x {it.quantity || it.qty}</span>
                          <span className="font-black text-gray-900">₹{(it.price || 0) * (it.quantity || it.qty)}</span>
                        </div>
                      ))}

                      <div className="border-t border-gray-200 pt-2 flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-600">{t.subtotal}</span>
                          <span className="font-black text-gray-800">₹{bill.itemsSubtotal}</span>
                        </div>

                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-blue-700">
                            🛵 {t.deliveryFee} ({bill.isInstant ? '⚡ Instant ₹10' : '🟢 Scheduled ₹5'})
                          </span>
                          <span className="font-black text-blue-800">+₹{bill.deliveryFee}</span>
                        </div>

                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-purple-700">⚡ {t.platformFee}</span>
                          <span className="font-black text-purple-800">+₹{bill.platformFee}</span>
                        </div>

                        <div className="border-t border-gray-300 pt-2 mt-1 flex justify-between items-center">
                          <span className="text-[15px] font-black text-gray-900">{t.grandTotal}</span>
                          <span className="text-[20px] font-black text-green-700">₹{bill.grandTotal}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2.5 mt-1">
                      {order.status === 'incoming' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'accepted')}
                            className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-black text-[17px] uppercase rounded-2xl shadow-lg transition-transform active:scale-[0.98] cursor-pointer"
                          >
                            {t.accept} (₹{bill.grandTotal})
                          </button>

                          <button
                            onClick={() => handleUpdateStatus(order.id, 'cancelled', 'Shop declined order')}
                            className="w-full h-12 bg-red-100 hover:bg-red-200 text-red-700 font-black text-[14px] rounded-2xl cursor-pointer"
                          >
                            {t.decline}
                          </button>
                        </>
                      )}

                      {(order.status === 'accepted' || order.status === 'preparing') && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'out_for_delivery')}
                          className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white font-black text-[17px] uppercase rounded-2xl shadow-lg transition-transform active:scale-[0.98] cursor-pointer"
                        >
                          {t.markReady}
                        </button>
                      )}

                      {(order.status === 'out_for_delivery' || order.status === 'delivering') && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'delivered')}
                          className="w-full h-14 bg-green-700 hover:bg-green-800 text-white font-black text-[17px] uppercase rounded-2xl shadow-lg transition-transform active:scale-[0.98] cursor-pointer"
                        >
                          {t.markDelivered}
                        </button>
                      )}

                      {order.status === 'delivered' && (
                        <div className="w-full py-3 bg-green-50 rounded-2xl text-center">
                          <span className="text-green-800 font-black text-[14px]">{t.completed}</span>
                        </div>
                      )}

                      {order.status === 'cancelled' && (
                        <div className="w-full py-3 bg-red-50 rounded-2xl text-center">
                          <span className="text-red-700 font-black text-[14px]">{t.rejected}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ── 2. FOOD STOCK SCREEN ── */}
        {activeTab === 'menu' && (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-3xl p-5 border-2 border-gray-300 flex flex-col gap-4 shadow-sm">
              <h2 className="text-[18px] font-black text-gray-900">{t.addFood}</h2>
              
              <button
                onClick={() => showToast("Photo attached!")}
                className="w-full h-24 bg-green-50 border-2 border-dashed border-green-500 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-green-100 transition-colors"
              >
                <span className="text-3xl">📷</span>
                <span className="text-green-800 font-black text-[13px]">{t.photoButton}</span>
              </button>

              <input
                type="text"
                placeholder={t.namePlaceholder}
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-2xl px-4 h-14 text-[16px] font-bold text-gray-900 outline-none"
              />

              <input
                type="number"
                placeholder={t.pricePlaceholder}
                value={newItemPrice}
                onChange={e => setNewItemPrice(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-2xl px-4 h-14 text-[16px] font-bold text-gray-900 outline-none"
              />

              <button
                onClick={handleAddItem}
                className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-black text-[16px] rounded-2xl shadow-md cursor-pointer"
              >
                {t.saveFood}
              </button>
            </div>

            <h2 className="text-[18px] font-black text-gray-900 mt-2">{t.menu} ({menuItems.length})</h2>
            <div className="flex flex-col gap-3">
              {menuItems.map(item => (
                <div key={item.id} className="bg-white rounded-2xl p-4 border-2 border-gray-200 flex items-center justify-between gap-3 shadow-xs">
                  <img src={item.img} alt={item.name} className="w-16 h-16 rounded-xl object-cover" />

                  <div className="flex-1 min-w-0">
                    <h3 className="text-[16px] font-black text-gray-900">{item.name}</h3>
                    <p className="text-[15px] font-black text-green-700 mt-0.5">₹{item.price}</p>
                  </div>

                  <button
                    onClick={() => handleToggleStock(item.id, item.available)}
                    className={`px-5 h-12 rounded-2xl font-black text-[14px] uppercase text-white shadow-sm cursor-pointer border-2 ${
                      item.available ? 'bg-green-600 border-green-700' : 'bg-red-600 border-red-700'
                    }`}
                  >
                    {item.available ? t.inStock : t.soldOut}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 3. SETTINGS & VAAYU FINANCIAL VAULT ── */}
        {activeTab === 'settings' && (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-3xl p-5 border-2 border-purple-300 flex flex-col gap-4 shadow-sm">
              <h2 className="text-[17px] font-black text-purple-900 uppercase">{t.financialSummary}</h2>
              
              <div className="bg-purple-50 rounded-2xl p-4 border border-purple-200 flex flex-col gap-2.5">
                <div className="flex justify-between items-center pb-2 border-b border-purple-200 text-xs">
                  <span className="font-bold text-purple-800">{t.instantDeliveryTag}</span>
                  <span className="font-black text-purple-900">{instantOrdersCount} × ₹10 = ₹{instantDeliveryFeesTotal}</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-purple-200 text-xs">
                  <span className="font-bold text-purple-800">{t.scheduledDeliveryTag}</span>
                  <span className="font-black text-purple-900">{scheduledOrdersCount} × ₹5 = ₹{scheduledDeliveryFeesTotal}</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-purple-200 text-xs">
                  <span className="font-bold text-purple-800">{t.platformFeeTag}</span>
                  <span className="font-black text-purple-900">{totalOrdersCount} × ₹5 = ₹{totalPlatformFeesToVaayu}</span>
                </div>

                <div className="bg-purple-200/60 rounded-xl p-3 mt-1">
                  <p className="text-[12px] font-black text-purple-900 uppercase">{t.totalOwedToVaayu}</p>
                  <p className="text-[24px] font-black text-purple-950 mt-0.5">₹{totalAmountOwedToVaayu}</p>
                </div>

                <div className="bg-green-100 rounded-xl p-3 border border-green-300 mt-1">
                  <p className="text-[12px] font-black text-green-900 uppercase">{t.shopNetEarnings}</p>
                  <p className="text-[24px] font-black text-green-900 mt-0.5">₹{shopNetFoodEarnings}</p>
                </div>
              </div>
            </div>

            {/* Language Selector */}
            <div className="bg-white rounded-3xl p-5 border-2 border-gray-300 flex flex-col gap-3 shadow-sm">
              <h2 className="text-[16px] font-black text-gray-900">{t.language}</h2>
              
              <div className="flex flex-col gap-2">
                {[
                  { code: 'en', name: 'English' },
                  { code: 'hi', name: 'हिन्दी (Hindi)' },
                  { code: 'ta', name: 'தமிழ் (Tamil)' },
                ].map(l => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLang(l.code as any)
                      showToast(`Language set to ${l.name}`)
                    }}
                    className={`w-full h-14 rounded-2xl border-2 flex items-center justify-between px-4 font-black text-[16px] cursor-pointer ${
                      lang === l.code ? 'bg-green-50 border-green-600 text-green-800' : 'bg-gray-50 border-gray-200 text-gray-800'
                    }`}
                  >
                    <span>{l.name}</span>
                    {lang === l.code && <span className="text-green-700 text-lg">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Staff Worker Access */}
            <div className="bg-white rounded-3xl p-5 border-2 border-gray-300 flex flex-col gap-3 shadow-sm">
              <h2 className="text-[16px] font-black text-gray-900">{t.addWorker}</h2>
              <p className="text-[13px] text-gray-500 font-medium">{t.workerHelp}</p>

              <input
                type="text"
                placeholder={t.workerName}
                value={newWorkerName}
                onChange={e => setNewWorkerName(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-2xl px-4 h-14 text-[16px] font-bold text-gray-900 outline-none"
              />

              <input
                type="text"
                placeholder={t.workerPhone}
                value={newWorkerPhone}
                onChange={e => setNewWorkerPhone(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-2xl px-4 h-14 text-[16px] font-bold text-gray-900 outline-none"
              />

              <button
                onClick={handleAddWorker}
                className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-black text-[16px] rounded-2xl shadow-md cursor-pointer"
              >
                {t.saveWorker}
              </button>

              {workers.map(w => (
                <div key={w.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div>
                    <p className="font-bold text-gray-900 text-[14px]">{w.name}</p>
                    <p className="text-gray-500 text-[12px]">{w.phone}</p>
                  </div>
                  <button
                    onClick={async () => {
                      setWorkers(prev => prev.filter(x => x.id !== w.id))
                      await supabase.from('shop_workers').delete().eq('id', w.id)
                    }}
                    className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <button onClick={onSignOut} className="w-full h-14 bg-red-100 text-red-700 font-black text-[16px] rounded-2xl cursor-pointer">
              {t.logout}
            </button>
          </div>
        )}
      </div>

      {/* Sliding Bottom Nav Capsule */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40" style={{ width: 'calc(100% - 32px)', maxWidth: 390 }}>
        <div className="bg-white/95 backdrop-blur-md rounded-[28px] shadow-[0_8px_32px_rgba(0,0,0,0.14)] border border-white/60 p-1">
          <div className="flex items-center justify-around relative px-2 py-1.5">
            {[
              { id: 'orders', label: t.orders, icon: '📋' },
              { id: 'menu', label: t.menu, icon: '🍔' },
              { id: 'settings', label: t.settings, icon: '⚙️' },
            ].map(({ id, label, icon }) => {
              const isActive = activeTab === id
              return (
                <button
                  key={id}
                  onClick={() => {
                    triggerBeep()
                    setActiveTab(id as any)
                  }}
                  className="relative flex items-center gap-1.5 py-2.5 px-4 rounded-full overflow-hidden transition-colors cursor-pointer select-none"
                  style={{
                    backgroundColor: isActive ? '#1a3a2a' : 'transparent',
                    color: isActive ? '#ffffff' : '#6b7280'
                  }}
                >
                  <span className="text-base">{icon}</span>
                  {isActive && (
                    <span className="text-[14px] font-black text-white whitespace-nowrap">
                      {label}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
