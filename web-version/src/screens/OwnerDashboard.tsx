import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const i18n: Record<string, Record<string, string>> = {
  en: {
    orders: "Orders",
    menu: "Food Stock",
    settings: "Settings",
    shopOpen: "SHOP IS OPEN FOR ORDERS (TAP TO CLOSE)",
    shopClosed: "SHOP IS CLOSED (TAP TO OPEN)",
    tapToClose: "(TAP TO CLOSE)",
    tapToOpen: "(TAP TO OPEN)",
    newWaiting: "NEW ORDERS WAITING",
    todayCash: "TODAY'S CASH",
    accept: "✅ ACCEPT ORDER",
    decline: "❌ DECLINE",
    markReady: "🚀 OUT FOR DELIVERY",
    markDelivered: "✓ DELIVERED",
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
    scheduled: "Scheduled Delivery",
    instant: "Instant Delivery",
    subtotal: "Items Subtotal",
    deliveryFee: "Delivery Fee",
    platformFee: "Platform Fee (Vaayu)",
    grandTotal: "TOTAL FROM CUSTOMER",
    financialSummary: "🏦 VAAYU FINANCIAL SETTLEMENT & RETURN VAULT",
    instantDeliveryTag: "⚡ Instant Delivery Fees (₹10/order)",
    scheduledDeliveryTag: "🟢 Scheduled Delivery Fees (₹5/order)",
    platformFeeTag: "Platform Fees Owed to Vaayu (₹5/order)",
    totalOwedToVaayu: "💸 CASH TO RETURN TO VAAYU",
    shopNetEarnings: "💰 SHOP NET FOOD EARNINGS",
  },
  hi: {
    orders: "आर्डर",
    menu: "खाना स्टॉक",
    settings: "सेटिंग्स",
    shopOpen: "दुकान चालू है (बंद करने के लिए दबाएं)",
    shopClosed: "दुकान बंद है (चालू करने के लिए दबाएं)",
    tapToClose: "(बंद करने के लिए दबाएं)",
    tapToOpen: "(चालू करने के लिए दबाएं)",
    newWaiting: "नए आर्डर प्रतिक्षा में",
    todayCash: "आज की कुल बिक्री",
    accept: "✅ स्वीकार करें",
    decline: "❌ मना करें",
    markReady: "रवाना करें (OUT FOR DELIVERY)",
    markDelivered: "✓ डिलिवर हो गया",
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
    scheduled: "निर्धारित आर्डर",
    instant: "तुरंत डिलिवरी",
    subtotal: "खाद्य सामग्री कुल",
    deliveryFee: "डिलिवरी शुल्क",
    platformFee: "वायु प्लेटफॉर्म शुल्क",
    grandTotal: "ग्राहक से कुल प्राप्त राशि",
    financialSummary: "🏦 वायु वित्तीय हिसाब और देय राशि",
    instantDeliveryTag: "⚡ तुरंत डिलिवरी शुल्क (₹10/आर्डर)",
    scheduledDeliveryTag: "🟢 निर्धारित डिलिवरी शुल्क (₹5/आर्डर)",
    platformFeeTag: "वायु प्लेटफॉर्म शुल्क (₹5/आर्डर)",
    totalOwedToVaayu: "💸 वायु को लौटाई जाने वाली कुल राशि",
    shopNetEarnings: "💰 दुकानदार की शुद्ध खाद्य कमाई",
  },
  ta: {
    orders: "ஆர்டர்கள்",
    menu: "உணவு இருப்பு",
    settings: "அமைப்புகள்",
    shopOpen: "கடை திறக்கப்பட்டுள்ளது (மூட தட்டவும்)",
    shopClosed: "கடை மூடப்பட்டுள்ளது (திறக்க தட்டவும்)",
    tapToClose: "(மூட தட்டவும்)",
    tapToOpen: "(திறக்க தட்டவும்)",
    newWaiting: "புதிய ஆர்டர்கள்",
    todayCash: "இன்றைய விற்பனை",
    accept: "✅ ஏற்றுக்கொள்",
    decline: "❌ நிராகரி",
    markReady: "தயார் (OUT FOR DELIVERY)",
    markDelivered: "✓ டெலிவரி செய்யப்பட்டது",
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
    scheduled: "திட்டமிடப்பட்ட ஆர்டர்",
    instant: "உடனடி டெலிவரி",
    subtotal: "உணவு மொத்தம்",
    deliveryFee: "டெலிவரி கட்டணம்",
    platformFee: "வாயு பிளாட்ஃபார்ம் கட்டணம்",
    grandTotal: "வாடிக்கையாளர் மொத்தம்",
    financialSummary: "🏦 வாயு நிதி கணக்கு விவரம்",
    instantDeliveryTag: "⚡ உடனடி டெலிவரி கட்டணம் (₹10/ஆர்டர்)",
    scheduledDeliveryTag: "🟢 திட்டமிடப்பட்ட டெலிவரி கட்டணம் (₹5/ஆர்டர்)",
    platformFeeTag: "வாயு கட்டணம் (₹5/ஆர்டர்)",
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
  const [itemSearchQuery, setItemSearchQuery] = useState('')

  // Header Hamburger & Dropdown state
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Expandable fees breakdown state per order
  const [othersExpanded, setOthersExpanded] = useState<Record<string, boolean>>({})

  // Pull to refresh gesture state
  const [pullY, setPullY] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef(0)
  const pulling = useRef(false)
  const THRESHOLD = 80

  const t = i18n[lang] || i18n['en']

  const triggerBeep = () => {
    try {
      if ('vibrate' in navigator) navigator.vibrate(100)
    } catch {}
  }

  // Close menu on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Real Database State (No Mock Data!)
  const [orders, setOrders] = useState<any[]>([])
  const [ordersFilter, setOrdersFilter] = useState<'active' | 'all'>('active')
  const [isAddItemOpen, setIsAddItemOpen] = useState(false)
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
  const loadShopData = async () => {
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

  useEffect(() => {
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

  // Pull-to-refresh Handlers
  const onTouchStart = (e: React.TouchEvent) => {
    if (scrollRef.current && scrollRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY
      pulling.current = true
    }
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (!pulling.current || isRefreshing) return
    const dy = e.touches[0].clientY - touchStartY.current
    if (dy > 0) {
      setPullY(Math.min(dy * 0.45, THRESHOLD))
    }
  }

  const onTouchEnd = () => {
    pulling.current = false
    if (pullY >= THRESHOLD) {
      setIsRefreshing(true)
      setPullY(THRESHOLD)
      loadShopData().then(() => {
        setIsRefreshing(false)
        setPullY(0)
        showToast('Orders Synced!')
      })
    } else {
      setPullY(0)
    }
  }

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
      ? order.items.reduce((s: number, i: any) => s + ((i.price || 0) * (i.quantity || i.qty || 1)), 0)
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
  const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled')
  const displayedOrders = ordersFilter === 'active' ? activeOrders : orders
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
    <div className="flex flex-col min-h-screen bg-[#f0f2f5] pb-28 max-w-[430px] mx-auto relative select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-black text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-xl flex items-center gap-2">
          <span>✨</span> {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="bg-white px-4 pt-5 pb-3 border-b border-gray-100 sticky top-0 z-30 shadow-xs">
        <div className="flex items-center justify-between">
          {/* Hamburger + Brand Title */}
          <div className="flex items-center gap-3" ref={menuRef}>
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-9 h-9 flex flex-col justify-center items-center gap-1.5 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors"
                aria-label="Open menu"
              >
                <span className={`block w-5 h-0.5 bg-gray-800 rounded-full transition-all duration-200 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                <span className={`block w-5 h-0.5 bg-gray-800 rounded-full transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
                <span className={`block w-5 h-0.5 bg-gray-800 rounded-full transition-all duration-200 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {menuOpen && (
                <div className="absolute top-11 mt-2.5 left-0 z-50 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                  <div className="bg-[#22a447] px-4 py-3">
                    <p className="text-[10px] font-bold text-green-100 tracking-widest uppercase">Shop Owner Portal</p>
                    <p className="text-lg font-extrabold text-white leading-tight">{user?.name || 'Campus Bites Cafe'}</p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('profile')
                      setMenuOpen(false)
                    }}
                    className="w-full px-4 py-3 border-b border-gray-100 flex items-center gap-2 text-left hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4 text-gray-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{user?.ownerName || user?.name || 'Shobha Singh'}</p>
                      <p className="text-xs text-gray-500">📱 {user?.phone || '7906651669'}</p>
                    </div>
                    <span className="text-xs font-bold text-[#22a447]">View ➔</span>
                  </button>
                  <div className="px-4 py-2 space-y-1">
                    {[
                      { icon: '📦', label: 'My Orders', tab: 'orders', filter: 'active' },
                      { icon: '📜', label: 'Old Orders', tab: 'orders', filter: 'all' },
                      { icon: '🏪', label: 'Shop Settings', tab: 'settings' },
                      { icon: '📊', label: 'Reports', action: () => showToast(`Reports: ${totalOrdersCount} Total Orders Today`) },
                      { icon: '🔔', label: 'Notifications', tab: 'notifications' },
                      { icon: '🚪', label: 'Logout', action: onSignOut },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => {
                          if (item.action) {
                            item.action()
                          } else {
                            if (item.tab) setActiveTab(item.tab as any)
                            if (item.filter) setOrdersFilter(item.filter as any)
                          }
                          setMenuOpen(false)
                        }}
                        className={`w-full flex items-center gap-3 px-2 py-2 text-sm hover:text-[#22a447] hover:bg-green-50 rounded-xl transition-colors ${
                          item.tab && activeTab === item.tab && (!item.filter || ordersFilter === item.filter) ? 'text-[#22a447] font-bold bg-green-50' : 'text-gray-700 font-medium'
                        }`}
                      >
                        <span className="text-base">{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center leading-tight">
              <span className="font-bold text-black tracking-wide" style={{ fontFamily: 'Outfit, sans-serif', fontSize: '16px', color: 'rgb(34, 164, 71)', textShadow: '0 0 8px rgba(34,164,71,0.6), 0 0 20px rgba(34,164,71,0.35)', animation: 'partnerPulse 2.5s ease-in-out infinite' }}>Partner Hub</span>
              <span className="text-[11px] font-bold text-gray-500 mt-0.5">{user?.shop_name || shopName || 'Royal Foods & Cafe'}</span>
            </div>
          </div>

          {/* Language Switcher Pill */}
          <div className="flex items-center bg-gray-100 rounded-full p-0.5 gap-0.5">
            {(['en', 'hi', 'ta'] as const).map((l) => (
              <button
                key={l}
                onClick={() => { setLang(l); triggerBeep() }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  lang === l
                    ? 'bg-[#22a447] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {l === 'hi' ? 'हिंदी' : l === 'ta' ? 'தமிழ்' : 'EN'}
              </button>
            ))}
          </div>
        </div>

        {/* Shop Status Toggle Button */}
        <button
          onClick={() => {
            const next = !isLiveToday
            setIsLiveToday(next)
            showToast(next ? t.shopOpen : t.shopClosed)
          }}
          className={`mt-4 w-full py-3.5 rounded-2xl font-extrabold text-sm tracking-wide flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer ${
            isLiveToday ? 'bg-[#22a447] text-white' : 'bg-red-500 text-white'
          }`}
        >
          <span className="text-base">{isLiveToday ? '🟢' : '🔴'}</span>
          {isLiveToday ? t.shopOpen : t.shopClosed}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 p-4">
        <div className={`rounded-2xl p-4 border ${incomingCount > 0 ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200'}`}>
          <p className="text-[12px] font-bold uppercase text-gray-500">{t.newWaiting}</p>
          <p className={`text-[32px] font-extrabold mt-0.5 ${incomingCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>{incomingCount}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200">
          <p className="text-[12px] font-bold uppercase text-gray-500">{t.todayCash}</p>
          <p className="text-[32px] font-extrabold text-gray-900 mt-0.5">₹{todayTotalCashCollected}</p>
        </div>
      </div>

      <div className="px-4 flex-1">
        {/* ── 1. ORDERS TAB ── */}
        {activeTab === 'orders' && (
          <div
            ref={scrollRef}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            className="flex flex-col gap-4 relative"
          >
            {/* Pull-to-refresh indicator */}
            <div
              className="flex items-center justify-center overflow-hidden transition-all duration-200"
              style={{ height: pullY > 0 || isRefreshing ? (isRefreshing ? 64 : pullY) : 0 }}
            >
              <div className={`flex flex-col items-center gap-1 py-2 ${pullY > 5 || isRefreshing ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
                <svg
                  className={`w-7 h-7 text-[#22a447] ${isRefreshing ? 'animate-spin' : 'transition-transform duration-150'}`}
                  style={{ transform: isRefreshing ? undefined : `rotate(${(pullY / THRESHOLD) * 360}deg)` }}
                  fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-xs font-bold text-[#22a447]">
                  {isRefreshing
                    ? 'Syncing orders...'
                    : pullY >= THRESHOLD
                    ? 'Release to refresh'
                    : 'Pull to refresh'}
                </span>
              </div>
            </div>

            {/* Orders Section Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{t.orders} ({displayedOrders.length})</h2>
              <button
                onClick={() => {
                  setIsRefreshing(true)
                  loadShopData().then(() => {
                    setIsRefreshing(false)
                    showToast('Orders Synced!')
                  })
                }}
                className="flex items-center gap-2 bg-green-50 border border-green-200 px-3.5 py-1.5 rounded-full shadow-xs cursor-pointer hover:bg-green-100 transition-all active:scale-95"
              >
                <span className="relative flex h-2.5 w-2.5 items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22a447] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22a447] animate-pulse"></span>
                </span>
                <span className="text-xs font-bold text-green-800 uppercase tracking-wide">
                  {isRefreshing ? 'Syncing...' : 'Live Sync'}
                </span>
              </button>
            </div>


            {loading ? (
              <div className="py-10 text-center text-xs text-gray-400 font-medium">Loading orders from Supabase...</div>
            ) : displayedOrders.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-gray-200 shadow-xs">
                <span className="text-4xl block mb-2">📋</span>
                <p className="text-base font-bold text-gray-900">
                  {ordersFilter === 'active' ? 'No existing active orders' : 'No orders yet today'}
                </p>
                <p className="text-xs text-gray-400 font-medium mt-1">
                  {ordersFilter === 'active' ? 'New ongoing customer orders will appear here automatically.' : 'New customer orders will appear here automatically.'}
                </p>
              </div>
            ) : (
              displayedOrders.map(order => {
                const timer = getTimerDetails(order.expire_at)
                const bill = getOrderBill(order)

                return (
                  <div
                    key={order.id}
                    className={`rounded-2xl shadow-xs border border-gray-100 overflow-hidden flex flex-col ${
                      order.delivery_mode === 'instant'
                        ? 'bg-gradient-to-b from-[#f97736] to-white'
                        : 'bg-gradient-to-b from-[#90D5FF] via-white to-white'
                    }`}
                  >
                    {/* Scheduled / Delivery Mode & Status */}
                    <div className="px-4 pt-4 pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xl">{order.delivery_mode === 'instant' ? '⚡' : '📅'}</span>
                          <span className="text-base font-bold text-gray-800">
                            {order.delivery_mode === 'instant' ? t.instant : t.scheduled}
                          </span>
                        </div>
                        <span className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap uppercase ${
                          order.status === 'delivered' ? 'bg-green-50 text-[#22a447] border border-green-200' :
                          order.status === 'incoming' ? 'bg-red-50 text-red-600 border border-red-200' :
                          order.status === 'preparing' || order.status === 'accepted' ? 'bg-orange-50 text-orange-600 border border-orange-200' :
                          'bg-purple-50 text-purple-600 border border-purple-200'
                        }`}>
                          {order.status === 'delivered' ? '✅ DELIVERED' :
                           order.status === 'incoming' ? '📥 NEW ORDER' :
                           order.status === 'preparing' || order.status === 'accepted' ? '🍳 PREPARING' :
                           '🚀 OUT FOR DELIVERY'}
                        </span>
                      </div>
                    </div>

                    <div className="h-px bg-gray-100 mx-4" />

                    {/* Customer Info & Phone Call Action Button */}
                    <div className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Customer</p>
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                          </svg>
                          <span className="text-sm font-semibold text-gray-800">{order.customer_name || order.user_name || 'Nishant singh'}</span>
                        </div>
                      </div>
                      <a
                        href={`tel:${order.customer_phone || order.user_phone || '7906651669'}`}
                        className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-800 active:scale-[0.97] transition-all cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                        </svg>
                        {order.customer_phone || order.user_phone || '7906651669'}
                      </a>
                    </div>

                    <div className="h-px bg-gray-100 mx-4" />

                    {/* Progress Timer */}
                    {order.status === 'incoming' && (
                      <div className={`mx-4 my-2 rounded-xl p-3 border flex flex-col gap-1.5 ${timer.bgClass} ${timer.borderClass}`}>
                        <div className="flex justify-between items-center">
                          <span className={`text-[12px] font-bold ${timer.textClass}`}>⏱️ {t.timeLeft}:</span>
                          <span className={`text-[16px] font-extrabold font-mono ${timer.textClass}`}>{timer.timeStr}</span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${timer.colorClass}`} style={{ width: `${Math.max(5, Math.min(100, timer.ratio * 100))}%` }} />
                        </div>
                      </div>
                    )}

                    {/* Delivery Time Slot Banner */}
                    <div className="mx-4 my-3 bg-green-50 border border-green-200 rounded-xl p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 shrink-0">
                          <svg className="w-3.5 h-3.5 text-[#22a447] shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 6v6l4 2"/>
                          </svg>
                          <span className="text-[11px] font-bold text-[#22a447] uppercase tracking-wider">DELIVERY TIME</span>
                        </div>
                        <div className="text-right flex-1 min-w-0">
                          <div className="text-xs sm:text-sm font-bold text-gray-900 leading-tight truncate">
                            {order.delivery_mode === 'instant' 
                              ? 'Within 15 Mins' 
                              : ((order.selected_slot_label || '8:00 PM – 9:00 PM').replace(/\s*\([^)]*\)/gi, '').trim())}
                          </div>
                          <div className="text-[10px] font-medium text-gray-500 mt-0.5 leading-tight truncate">
                            {order.delivery_mode === 'instant' 
                              ? '(Instant Slot)' 
                              : `(${order.slot_name || order.delivery_slot_name || ((order.selected_slot_label || '').toLowerCase().includes('dinner') || (order.selected_slot_label || '').includes('8:') || (order.selected_slot_label || '').includes('9:') ? 'Dinner Slot' : 'Lunch Slot')})`}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Items Breakdown & Fees Accordion */}
                    <div className={`mx-4 mb-3 border rounded-xl overflow-hidden ${
                      order.is_partially_accepted ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200 bg-white'
                    }`}>
                      {order.is_partially_accepted && (
                        <div className="px-3 py-2 flex items-center justify-between border-b border-yellow-200">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">⚠️</span>
                            <span className="text-[10px] font-bold text-yellow-700 uppercase tracking-wide">Partially Accepted</span>
                          </div>
                          <span className="text-[10px] font-semibold text-gray-500">Total Adjusted</span>
                        </div>
                      )}
                      <div className="px-3 py-2.5 bg-white space-y-2">
                        {Array.isArray(order.items) && order.items.map((it: any, idx: number) => {
                          const isOutOfStock = it.out_of_stock || (it.quantity === 0)
                          return (
                            <div key={idx} className="flex items-center justify-between">
                              {isOutOfStock ? (
                                <>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold text-red-500 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded uppercase">Out of Stock</span>
                                    <span className="text-xs text-gray-400 line-through">{it.name} × 0 (ordered {it.ordered_qty || 1})</span>
                                  </div>
                                  <span className="text-xs text-gray-400">₹0</span>
                                </>
                              ) : (
                                <>
                                  <span className="text-sm text-gray-800 font-medium">{it.name} × {it.quantity || it.qty || 1}</span>
                                  <span className="text-sm font-semibold text-gray-800">₹{(it.price || 0) * (it.quantity || it.qty || 1)}</span>
                                </>
                              )}
                            </div>
                          )
                        })}

                        <div className="h-px bg-gray-100" />

                        {/* Items Subtotal */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">{t.subtotal}</span>
                          <span className="text-xs font-semibold text-gray-700">₹{bill.itemsSubtotal}</span>
                        </div>

                        {/* Others Accordion */}
                        <div className="flex items-center justify-between py-1">
                          <button
                            onClick={() => setOthersExpanded(prev => ({ ...prev, [order.id]: !prev[order.id] }))}
                            className="flex items-center gap-1 text-xs text-gray-600 font-medium cursor-pointer hover:text-gray-900 transition-colors"
                          >
                            <span className="font-bold text-gray-800">Others</span>
                            <span className="text-[10px]">{othersExpanded[order.id] ? '▲' : '▼'}</span>
                            <span className="text-gray-400">(Delivery & Platform Fee)</span>
                          </button>
                          <span className="text-xs font-semibold text-gray-700">+₹{bill.deliveryFee + bill.platformFee}</span>
                        </div>

                        {othersExpanded[order.id] && (
                          <div className="pl-3 py-1 space-y-1.5 border-l-2 border-green-400 ml-1 my-1 text-xs transition-all">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500">Delivery Fee ({bill.isInstant ? 'Instant' : 'Scheduled'})</span>
                              <span className="font-semibold text-gray-700">₹{bill.deliveryFee}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500">Platform Fee (Vaayu)</span>
                              <span className={`font-semibold ${bill.isFreePlatformFee || bill.platformFee === 0 ? 'text-green-600 font-bold' : 'text-gray-700'}`}>
                                {bill.isFreePlatformFee || bill.platformFee === 0 ? 'FREE (₹0)' : `₹${bill.platformFee}`}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="h-px bg-gray-200" />

                        {/* Grand Total */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-gray-900 uppercase tracking-wide">{t.grandTotal}</span>
                          <span className="text-base font-extrabold text-gray-900">₹{bill.grandTotal}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="px-4 pb-4 space-y-2">
                      {order.status === 'incoming' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'accepted')}
                            className="flex-1 py-3.5 bg-[#22a447] text-white font-bold text-sm rounded-xl hover:bg-green-700 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
                          >
                            {t.accept} (₹{bill.grandTotal})
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'cancelled', 'Declined by shop')}
                            className="py-3.5 px-4 bg-red-100 text-red-700 font-bold text-sm rounded-xl hover:bg-red-200 transition-all cursor-pointer"
                          >
                            {t.decline}
                          </button>
                        </div>
                      )}

                      {(order.status === 'accepted' || order.status === 'preparing') && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'out_for_delivery')}
                          className="w-full py-3.5 bg-orange-500 text-white font-bold text-sm rounded-xl hover:bg-orange-600 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
                        >
                          {t.markReady}
                        </button>
                      )}

                      {(order.status === 'out_for_delivery' || order.status === 'delivering') && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'delivered')}
                          className="w-full py-3.5 bg-green-50 border-2 border-green-200 text-[#22a447] font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-green-100 active:scale-[0.98] transition-all cursor-pointer"
                        >
                          {t.markDelivered}
                        </button>
                      )}

                      {order.status === 'delivered' && (
                        <button className="w-full py-3.5 bg-green-50 border-2 border-green-200 text-[#22a447] font-bold text-sm rounded-xl flex items-center justify-center gap-2 cursor-default">
                          {t.completed}
                        </button>
                      )}

                      {order.status === 'cancelled' && (
                        <div className="w-full py-3 bg-red-50 rounded-xl text-center border border-red-200">
                          <span className="text-red-700 font-bold text-sm">{t.rejected}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ── 2. FOOD STOCK TAB ── */}
        {activeTab === 'menu' && (
          <div className="flex flex-col gap-4">
            {/* Add Item Collapsible Section */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs transition-all duration-300">
              <button
                onClick={() => setIsAddItemOpen(!isAddItemOpen)}
                className="w-full p-4 flex items-center justify-between bg-white cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base font-bold text-gray-900">{t.addFood}</span>
                </div>

                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                  isAddItemOpen ? 'bg-gray-100 text-gray-700' : 'bg-[#22a447] text-white shadow-xs'
                }`}>
                  <span className="text-lg font-bold leading-none">{isAddItemOpen ? '−' : '+'}</span>
                </div>
              </button>

              {isAddItemOpen && (
                <div className="p-5 pt-0 border-t border-gray-100 flex flex-col gap-4 transition-all duration-300">
                  <button
                    onClick={() => showToast("Photo attached!")}
                    className="w-full h-24 bg-green-50 border-2 border-dashed border-[#22a447] rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-green-100 transition-colors mt-4"
                  >
                    <span className="text-3xl">📷</span>
                    <span className="text-[#22a447] font-bold text-xs">{t.photoButton}</span>
                  </button>

                  <input
                    type="text"
                    placeholder={t.namePlaceholder}
                    value={newItemName}
                    onChange={e => setNewItemName(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 h-12 text-sm font-semibold text-gray-900 outline-none focus:border-[#22a447]"
                  />

                  <input
                    type="number"
                    placeholder={t.pricePlaceholder}
                    value={newItemPrice}
                    onChange={e => setNewItemPrice(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 h-12 text-sm font-semibold text-gray-900 outline-none focus:border-[#22a447]"
                  />

                  <button
                    onClick={() => {
                      handleAddItem()
                      if (newItemName.trim() && newItemPrice.trim()) setIsAddItemOpen(false)
                    }}
                    className="w-full h-12 bg-[#22a447] hover:bg-green-700 text-white font-bold text-sm rounded-xl shadow-xs cursor-pointer active:scale-[0.98] transition-all"
                  >
                    {t.saveFood}
                  </button>
                </div>
              )}
            </div>

            {/* Menu Items List & Search Bar */}
            {(() => {
              const filteredMenuItems = menuItems.filter(item => {
                if (!itemSearchQuery.trim()) return true
                const query = itemSearchQuery.toLowerCase().trim()
                const name = (item.name || '').toLowerCase()
                const category = (item.category || '').toLowerCase()
                return name.includes(query) || category.includes(query)
              })

              return (
                <div className="flex flex-col gap-3.5 mt-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-extrabold text-gray-900 uppercase tracking-wide">
                      {t.menu} ({filteredMenuItems.length}{itemSearchQuery.trim() ? ` / ${menuItems.length}` : ''})
                    </h2>
                  </div>

                  {/* Search Bar Input */}
                  <div className="bg-white rounded-2xl border border-gray-200 px-3.5 h-11 flex items-center gap-2 shadow-xs focus-within:border-[#22a447] transition-all">
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search menu items..."
                      value={itemSearchQuery}
                      onChange={e => setItemSearchQuery(e.target.value)}
                      className="flex-1 bg-transparent border-none text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400"
                    />
                    {itemSearchQuery.length > 0 && (
                      <button
                        onClick={() => setItemSearchQuery('')}
                        className="w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-600 cursor-pointer transition-colors"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-3">
                    {filteredMenuItems.length === 0 ? (
                      <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 shadow-xs">
                        <p className="text-sm font-bold text-gray-800">
                          {itemSearchQuery.trim() ? `No items matching "${itemSearchQuery}"` : 'No items yet'}
                        </p>
                        <p className="text-xs text-gray-400 font-medium mt-1">
                          {itemSearchQuery.trim() ? 'Try searching for another item name.' : 'Use the form above to add your first menu item.'}
                        </p>
                      </div>
                    ) : (
                      filteredMenuItems.map(item => (
                        <div key={item.id} className="bg-white rounded-2xl p-4 border border-gray-200 flex items-center justify-between gap-3 shadow-xs">
                          <img src={item.img} alt={item.name} className="w-14 h-14 rounded-xl object-cover" />

                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-gray-900">{item.name}</h3>
                            <p className="text-sm font-bold text-[#22a447] mt-0.5">₹{item.price}</p>
                          </div>

                          <button
                            onClick={() => handleToggleStock(item.id, item.available)}
                            className={`px-4 h-10 rounded-xl font-bold text-xs uppercase text-white shadow-xs cursor-pointer transition-all active:scale-[0.97] ${
                              item.available ? 'bg-[#22a447]' : 'bg-red-500'
                            }`}
                          >
                            {item.available ? t.inStock : t.soldOut}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* ── 3. SETTINGS & VAAYU FINANCIAL VAULT TAB ── */}
        {activeTab === 'settings' && (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl p-5 border border-purple-200 flex flex-col gap-4 shadow-xs">
              <h2 className="text-sm font-bold text-purple-900 uppercase tracking-wider">{t.financialSummary}</h2>
              
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200 flex flex-col gap-2.5">
                <div className="flex justify-between items-center pb-2 border-b border-purple-200 text-xs flex-wrap gap-1">
                  <span className="font-semibold text-purple-800 flex-1 min-w-[120px]">{t.instantDeliveryTag}</span>
                  <span className="font-bold text-purple-900 text-right">{instantOrdersCount} × ₹10 = ₹{instantDeliveryFeesTotal}</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-purple-200 text-xs flex-wrap gap-1">
                  <span className="font-semibold text-purple-800 flex-1 min-w-[120px]">{t.scheduledDeliveryTag}</span>
                  <span className="font-bold text-purple-900 text-right">{scheduledOrdersCount} × ₹5 = ₹{scheduledDeliveryFeesTotal}</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-purple-200 text-xs flex-wrap gap-1">
                  <span className="font-semibold text-purple-800 flex-1 min-w-[120px]">{t.platformFeeTag}</span>
                  <span className="font-bold text-purple-900 text-right">{totalOrdersCount} × ₹5 = ₹{totalPlatformFeesToVaayu}</span>
                </div>

                <div className="bg-purple-200/60 rounded-xl p-3 mt-1">
                  <p className="text-[11px] font-bold text-purple-900 uppercase">{t.totalOwedToVaayu}</p>
                  <p className="text-xl font-extrabold text-purple-950 mt-0.5">₹{totalAmountOwedToVaayu}</p>
                  <p className="text-[10px] font-semibold text-purple-800 mt-1">
                    (₹{totalDeliveryFeesCollected} Delivery + ₹{totalPlatformFeesToVaayu} Platform Fee)
                  </p>
                </div>

                <div className="bg-green-100 rounded-xl p-3 border border-green-300 mt-1">
                  <p className="text-[11px] font-bold text-green-900 uppercase">{t.shopNetEarnings}</p>
                  <p className="text-xl font-extrabold text-green-900 mt-0.5">₹{shopNetFoodEarnings}</p>
                  <p className="text-[10px] font-semibold text-green-800 mt-1">
                    Total Cash ₹{todayTotalCashCollected} - Vaayu Return ₹{totalAmountOwedToVaayu}
                  </p>
                </div>
              </div>
            </div>

            {/* Language Selector */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 flex flex-col gap-3 shadow-xs">
              <h2 className="text-sm font-bold text-gray-900">{t.language}</h2>
              
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
                    className={`w-full h-12 rounded-xl border flex items-center justify-between px-4 font-bold text-sm cursor-pointer ${
                      lang === l.code ? 'bg-green-50 border-[#22a447] text-[#22a447]' : 'bg-gray-50 border-gray-200 text-gray-800'
                    }`}
                  >
                    <span>{l.name}</span>
                    {lang === l.code && <span className="text-[#22a447] text-base">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Staff Worker Access */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 flex flex-col gap-3 shadow-xs">
              <h2 className="text-sm font-bold text-gray-900">{t.addWorker}</h2>
              <p className="text-xs text-gray-500 font-medium">{t.workerHelp}</p>

              <input
                type="text"
                placeholder={t.workerName}
                value={newWorkerName}
                onChange={e => setNewWorkerName(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 h-12 text-sm font-semibold text-gray-900 outline-none focus:border-[#22a447]"
              />

              <input
                type="text"
                placeholder={t.workerPhone}
                value={newWorkerPhone}
                onChange={e => setNewWorkerPhone(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 h-12 text-sm font-semibold text-gray-900 outline-none focus:border-[#22a447]"
              />

              <button
                onClick={handleAddWorker}
                className="w-full h-12 bg-[#22a447] hover:bg-green-700 text-white font-bold text-sm rounded-xl shadow-xs cursor-pointer"
              >
                {t.saveWorker}
              </button>

              {workers.map(w => (
                <div key={w.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div>
                    <p className="font-bold text-gray-900 text-xs">{w.name}</p>
                    <p className="text-gray-500 text-[11px]">{w.phone}</p>
                  </div>
                  <button
                    onClick={async () => {
                      setWorkers(prev => prev.filter(x => x.id !== w.id))
                      await supabase.from('shop_workers').delete().eq('id', w.id)
                    }}
                    className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-red-200"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <button onClick={onSignOut} className="w-full h-12 bg-red-100 text-red-700 font-bold text-sm rounded-xl cursor-pointer hover:bg-red-200">
              {t.logout}
            </button>
          </div>
        )}

        {/* ── 4. NOTIFICATIONS TAB ── */}
        {activeTab === 'notifications' && (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔔</span>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Store Notifications</h2>
                    <p className="text-xs text-gray-500">Live alerts and system updates</p>
                  </div>
                </div>
                <span className="bg-green-100 text-green-800 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase">Active</span>
              </div>

              <div className="h-px bg-gray-100 my-1" />

              <div className="flex flex-col gap-3">
                <div className="bg-green-50 p-3.5 rounded-2xl border border-green-200 flex items-start gap-3">
                  <span className="text-xl mt-0.5">📦</span>
                  <div>
                    <h3 className="text-xs font-bold text-green-900">Realtime Order Sync Online</h3>
                    <p className="text-xs text-green-700 mt-0.5">You will receive instant sound alerts for incoming student orders.</p>
                    <span className="text-[10px] font-semibold text-green-600 block mt-1">Just now</span>
                  </div>
                </div>

                <div className="bg-blue-50 p-3.5 rounded-2xl border border-blue-200 flex items-start gap-3">
                  <span className="text-xl mt-0.5">🏪</span>
                  <div>
                    <h3 className="text-xs font-bold text-blue-900">Store Status: {isLiveToday ? 'OPEN' : 'CLOSED'}</h3>
                    <p className="text-xs text-blue-700 mt-0.5">
                      {isLiveToday ? 'Your store is currently visible to all campus students.' : 'Your store is closed. Tap Go Live on top to open.'}
                    </p>
                    <span className="text-[10px] font-semibold text-blue-600 block mt-1">Today</span>
                  </div>
                </div>

                <div className="bg-purple-50 p-3.5 rounded-2xl border border-purple-200 flex items-start gap-3">
                  <span className="text-xl mt-0.5">💰</span>
                  <div>
                    <h3 className="text-xs font-bold text-purple-900">Vaayu Fee Exemption</h3>
                    <p className="text-xs text-purple-700 mt-0.5">Platform fee is waived on free tier orders. All delivery fees are retained by your store.</p>
                    <span className="text-[10px] font-semibold text-purple-600 block mt-1">Today</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 5. PROFILE TAB ── */}
        {activeTab === 'profile' && (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs flex flex-col gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center border-2 border-green-300 text-2xl">
                  👤
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-gray-900">
                    {user?.ownerName || user?.name || 'Shobha Singh'}
                  </h2>
                  <p className="text-xs font-bold text-[#22a447] mt-0.5">
                    🏪 {user?.shop_name || shopName || 'Royal Foods & Cafe'}
                  </p>
                </div>
              </div>

              <button
                onClick={onSignOut}
                className="w-full h-12 bg-red-50 border border-red-200 text-red-700 font-bold text-sm rounded-xl cursor-pointer hover:bg-red-100 transition-colors mt-1"
              >
                🚪 Sign Out of Partner Portal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sliding Bottom Nav Capsule */}
      <div className="fixed left-1/2 -translate-x-1/2 z-40" style={{ bottom: 'calc(2.5rem + env(safe-area-inset-bottom, 0px))', width: 'calc(100% - 32px)', maxWidth: 390 }}>
        <div className="bg-white/95 backdrop-blur-md rounded-[28px] shadow-[0_8px_32px_rgba(0,0,0,0.14)] border border-white/60 p-1">
          <div className="flex items-center justify-around relative px-2 py-1.5">
            {[
              { id: 'orders', label: t.orders, icon: '📋' },
              { id: 'menu', label: t.menu, icon: '🍔' },
              { id: 'settings', label: t.settings, icon: '⚙️' },
              { id: 'notifications', label: 'Notifications', icon: '🔔' },
            ].map(({ id, label, icon }) => {
              const isActive = activeTab === id
              return (
                <button
                  key={id}
                  onClick={() => {
                    triggerBeep()
                    setActiveTab(id as any)
                    if (id === 'orders') setOrdersFilter('active')
                  }}
                  className="relative flex items-center gap-1.5 py-2.5 px-4 rounded-full overflow-hidden transition-colors cursor-pointer select-none"
                  style={{
                    backgroundColor: isActive ? '#22a447' : 'transparent',
                    color: isActive ? '#ffffff' : '#6b7280'
                  }}
                >
                  <span className="text-base">{icon}</span>
                  {isActive && (
                    <span className="text-xs font-bold text-white whitespace-nowrap">
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
