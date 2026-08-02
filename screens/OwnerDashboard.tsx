import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, Modal, Vibration, ActivityIndicator, Alert, ActionSheetIOS, Platform } from 'react-native'
import tw from 'twrnc'
import Svg, { Path, Circle, Line, Polyline } from 'react-native-svg'
import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'
import { supabase } from '../lib/supabase'
import { getCache, setCache } from '../lib/cache'
import OrderDetailsModal from '../components/OrderDetailsModal'

// Language Translations Dictionary for Low-Literacy Shop Owners
const i18n: Record<string, Record<string, string>> = {
  en: {
    orders: "Orders",
    menu: "Item Stock",
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
    addFood: "➕ ADD NEW ITEM",
    photoButton: "📷 TAP TO UPLOAD ITEM PHOTO",
    saveFood: "SAVE ITEM",
    namePlaceholder: "Item Name (e.g. Samosa, Notebook, Soda)",
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
    subtotal: "Items Subtotal",
    deliveryFee: "Delivery Fee",
    platformFee: "Platform Fee (Vaayu)",
    grandTotal: "TOTAL FROM CUSTOMER",
    financialSummary: "🏦 VAAYU FINANCIAL SETTLEMENT & RETURN VAULT",
    instantDeliveryTag: "⚡ Instant Delivery Fees (₹10/order)",
    scheduledDeliveryTag: "🟢 Scheduled Delivery Fees (₹5/order)",
    platformFeeTag: "🛵 Platform Fees Owed to Vaayu (₹5/order)",
    totalOwedToVaayu: "💸 CASH TO RETURN TO VAAYU",
    shopNetEarnings: "💰 SHOP NET ITEM EARNINGS",
  },
  hi: {
    orders: "आर्डर",
    menu: "सामान स्टॉक",
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
    addFood: "➕ नया सामान जोड़ें",
    photoButton: "📷 आइटम फोटो अपलोड करें",
    saveFood: "सामान सेव करें",
    namePlaceholder: "सामान का नाम (जैसे समोसा, कॉपी, सोडा)",
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
    subtotal: "सामग्री कुल",
    deliveryFee: "डिलिवरी शुल्क",
    platformFee: "वायु प्लेटफॉर्म शुल्क",
    grandTotal: "ग्राहक से कुल प्राप्त राशि",
    financialSummary: "🏦 वायु वित्तीय हिसाब और देय राशि",
    instantDeliveryTag: "⚡ तुरंत डिलिवरी शुल्क (₹10/आर्डर)",
    scheduledDeliveryTag: "🟢 निर्धारित डिलिवरी शुल्क (₹5/आर्डर)",
    platformFeeTag: "🛵 वायु प्लेटफॉर्म शुल्क (₹5/आर्डर)",
    totalOwedToVaayu: "💸 वायु को लौटाई जाने वाली कुल राशि",
    shopNetEarnings: "💰 दुकानदार की शुद्ध कमाई",
  },
  ta: {
    orders: "ஆர்டர்கள்",
    menu: "பொருட்கள் இருப்பு",
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
    addFood: "➕ புதிய பொருள் சேர்க்க",
    photoButton: "📷 பொருள் படம் சேர்க்க",
    saveFood: "பொருள் சேமிக்க",
    namePlaceholder: "பொருள் பெயர் (எ.கா சமோசா, நோட்டு)",
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

function IconOrders({ active }: { active: boolean }) {
  const c = active ? "#ffffff" : "#6b7280"
  return (
    <Svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <Polyline points="14 2 14 8 20 8" />
      <Line x1="16" y1="13" x2="8" y2="13" />
      <Line x1="16" y1="17" x2="8" y2="17" />
    </Svg>
  )
}

function IconMenu({ active }: { active: boolean }) {
  const c = active ? "#ffffff" : "#6b7280"
  return (
    <Svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5">
      <Path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </Svg>
  )
}

function IconSettings({ active }: { active: boolean }) {
  const c = active ? "#ffffff" : "#6b7280"
  return (
    <Svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5">
      <Circle cx="12" cy="12" r="3" />
      <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </Svg>
  )
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

  const [selectedOrderIdForDetails, setSelectedOrderIdForDetails] = useState<string | null>(null)

  const t = i18n[lang] || i18n['en']

  const triggerHaptic = () => {
    try { Vibration.vibrate(80); } catch {}
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

  const [toast, setToast] = useState<string | null>(null)
  const showToast = (msg: string) => {
    triggerHaptic()
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [showImagePickerModal, setShowImagePickerModal] = useState(false)

  // Upload local URI to Supabase Storage bucket 'product-images' with compression and return public URL
  const uploadImageToSupabase = async (uri: string): Promise<string | null> => {
    try {
      // 1. Compress & Resize image to max width 1080px (0.7 quality) for fast mobile uploading
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1080 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      )

      // 2. Fetch blob and retrieve actual content-type
      const response = await fetch(manipResult.uri)
      const blob = await response.blob()
      const contentType = blob.type || 'image/jpeg'
      const fileName = `item_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`
      const filePath = activeShopId ? `menu/${activeShopId}/${fileName}` : `menu/general/${fileName}`

      // 3. Upload to Supabase Storage bucket 'product-images'
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, blob, {
          contentType: contentType,
          upsert: true,
        })

      if (uploadError) {
        showToast('Upload failed: ' + uploadError.message)
        return null
      }

      // 4. Retrieve permanent public URL
      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      return publicUrlData.publicUrl
    } catch (err: any) {
      showToast('Upload error: ' + (err.message || 'Failed to process image'))
      return null
    }
  }

  // Camera Handler with runtime permission check & Supabase storage upload
  const handleLaunchCamera = async () => {
    setShowImagePickerModal(false)
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera access is required so shop owners can photograph food products for your store listing. Please grant camera permission in your device settings.',
          [{ text: 'OK' }]
        )
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri
        setIsUploadingPhoto(true)
        showToast('Uploading photo to cloud...')

        const publicUrl = await uploadImageToSupabase(selectedUri)
        setIsUploadingPhoto(false)

        if (publicUrl) {
          setNewItemImg(publicUrl)
          showToast('📷 Photo uploaded & attached!')
        } else {
          showToast('Upload failed, please try again')
        }
      }
    } catch (err: any) {
      setIsUploadingPhoto(false)
      showToast('Unable to open camera')
    }
  }

  // Gallery Fallback Handler with runtime permission check & Supabase storage upload
  const handleLaunchGallery = async () => {
    setShowImagePickerModal(false)
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Photo library access is required so shop owners can select food photos. Please grant photo library permission in your device settings.',
          [{ text: 'OK' }]
        )
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri
        setIsUploadingPhoto(true)
        showToast('Uploading photo to cloud...')

        const publicUrl = await uploadImageToSupabase(selectedUri)
        setIsUploadingPhoto(false)

        if (publicUrl) {
          setNewItemImg(publicUrl)
          showToast('🖼️ Photo uploaded & attached!')
        } else {
          showToast('Upload failed, please try again')
        }
      }
    } catch (err: any) {
      setIsUploadingPhoto(false)
      showToast('Unable to open gallery')
    }
  }

  const [activeShopId, setActiveShopId] = useState<string | null>(user?.shop_id || null)
  const [shopName, setShopName] = useState<string>(user?.shop_name || 'Campus Bites Cafe')

  // 1. Load Initial Real Data from Supabase & Subscribe to Realtime Updates
  useEffect(() => {
    async function loadShopData() {
      // 1. Instant Cache Hydration for 0ms Load Time
      const cachedOrders = await getCache<any[]>('owner_orders')
      const cachedMenu = await getCache<any[]>('owner_menu')
      if (cachedOrders) setOrders(cachedOrders)
      if (cachedMenu) setMenuItems(cachedMenu)
      if (cachedOrders || cachedMenu) setLoading(false)
      else setLoading(true)

      // Fetch Active Shop Details
      const targetShopId = activeShopId || user?.shop_id
      if (targetShopId) {
        const { data: currentShop } = await supabase.from('shops').select('id, name, is_open').eq('id', targetShopId).single()
        if (currentShop) {
          if (currentShop.name) setShopName(currentShop.name)
          if (currentShop.is_open !== undefined && currentShop.is_open !== null) {
            setIsLiveToday(currentShop.is_open)
          }
        }
      } else {
        const { data: shopsData } = await supabase.from('shops').select('id, name, is_open').limit(1)
        if (shopsData && shopsData.length > 0) {
          setActiveShopId(shopsData[0].id)
          setShopName(shopsData[0].name)
          if (shopsData[0].is_open !== undefined && shopsData[0].is_open !== null) {
            setIsLiveToday(shopsData[0].is_open)
          }
        }
      }

      // Fetch Orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (ordersData) {
        setOrders(ordersData)
        await setCache('owner_orders', ordersData, 300)
      }

      // Fetch Menu Items
      const { data: menuData } = await supabase
        .from('menu_items')
        .select('*')
        .order('created_at', { ascending: false })

      if (menuData) {
        const formattedMenu = menuData.map(m => ({
          id: m.id,
          name: m.name,
          price: m.price,
          available: m.is_available && (m.stock_quantity === undefined || m.stock_quantity === null || m.stock_quantity > 0),
          stockQuantity: m.stock_quantity ?? 10,
          image: m.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'
        }))
        setMenuItems(formattedMenu)
        await setCache('owner_menu', formattedMenu, 300)
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
      .channel('shop_orders_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        triggerHaptic()
        if (payload.eventType === 'INSERT') {
          setOrders(prev => [payload.new, ...prev])
          showToast(`🔔 New Order #${payload.new.id} Received!`)
        } else if (payload.eventType === 'UPDATE') {
          setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new : o))
        }
      })
      .subscribe()

    // Realtime Stock Subscription — updates menu item quantities in real-time after orders are placed
    const menuSub = supabase
      .channel('shop_menu_realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'menu_items' }, (payload) => {
        const updated = payload.new
        setMenuItems(prev => prev.map(item =>
          item.id === updated.id
            ? {
                ...item,
                stockQuantity: updated.stock_quantity ?? 0,
                available: updated.is_available && (updated.stock_quantity === undefined || updated.stock_quantity === null || updated.stock_quantity > 0),
              }
            : item
        ))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(ordersSub)
      supabase.removeChannel(menuSub)
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

  // Calculate bill breakdown per order
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

  // Real Database Order Status Update (Triggers Server-Side Push Notification!)
  const handleUpdateStatus = async (orderId: string, newStatus: string, reason?: string) => {
    triggerHaptic()
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus, cancel_reason: reason } : o))
    showToast(`Status updated to ${newStatus}`)

    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus, cancel_reason: reason })
      .eq('id', orderId)

    if (error) {
      console.error('[OwnerDashboard] Failed to update status in Supabase:', error)
    }
  }

  // Real-Time Manual Stock Quantity Increment/Decrement (+ / -) in Supabase
  const handleUpdateStockQuantity = async (itemId: string, delta: number) => {
    triggerHaptic()
    setMenuItems(prev => prev.map(i => {
      if (i.id === itemId) {
        const currentQty = i.stockQuantity ?? 10
        const newQty = Math.max(0, currentQty + delta)
        const isAvail = newQty > 0
        return { ...i, stockQuantity: newQty, available: isAvail }
      }
      return i
    }))

    const item = menuItems.find(i => i.id === itemId)
    const currentQty = item?.stockQuantity ?? 10
    const newQty = Math.max(0, currentQty + delta)
    const isAvail = newQty > 0

    const { error } = await supabase
      .from('menu_items')
      .update({ stock_quantity: newQty, is_available: isAvail })
      .eq('id', itemId)

    if (error) {
      console.error('[OwnerDashboard] Failed to update stock quantity in Supabase:', error)
    }
  }

  // Direct Manual Stock Quantity Typing Input in Supabase
  const handleDirectStockQuantityChange = async (itemId: string, text: string) => {
    const parsed = parseInt(text, 10)
    const newQty = isNaN(parsed) ? 0 : Math.max(0, parsed)
    const isAvail = newQty > 0

    setMenuItems(prev => prev.map(i => i.id === itemId ? { ...i, stockQuantity: newQty, available: isAvail } : i))

    const { error } = await supabase
      .from('menu_items')
      .update({ stock_quantity: newQty, is_available: isAvail })
      .eq('id', itemId)

    if (error) {
      console.error('[OwnerDashboard] Failed to set stock quantity in Supabase:', error)
    }
  }

  // Stock Toggle in Supabase
  const handleToggleStock = async (itemId: string, currentAvailable: boolean) => {
    triggerHaptic()
    const nextAvailable = !currentAvailable
    setMenuItems(prev => prev.map(i => i.id === itemId ? { ...i, available: nextAvailable } : i))

    const { error } = await supabase
      .from('menu_items')
      .update({ is_available: nextAvailable })
      .eq('id', itemId)

    if (error) {
      console.error('[OwnerDashboard] Failed to toggle stock in Supabase:', error)
    }
  }

  // Delete Item from Supabase & Local State
  const handleDeleteItem = async (itemId: string) => {
    triggerHaptic()
    Alert.alert(
      "Delete Item",
      "Are you sure you want to delete this item from your store menu?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setMenuItems(prev => prev.filter(i => i.id !== itemId))
            const { error } = await supabase.from('menu_items').delete().eq('id', itemId)
            if (error) {
              console.error('[OwnerDashboard] Failed to delete item:', error)
              showToast('Failed to delete item')
            } else {
              showToast('Item deleted from menu')
            }
          }
        }
      ]
    )
  }

  // Toggle Store Live/Closed in Supabase database
  const handleToggleStoreLive = async () => {
    triggerHaptic()
    const next = !isLiveToday
    setIsLiveToday(next)
    showToast(next ? t.shopOpen : t.shopClosed)

    if (activeShopId) {
      const { error } = await supabase
        .from('shops')
        .update({ is_open: next })
        .eq('id', activeShopId)

      if (error) {
        console.error('[OwnerDashboard] Failed to update store open status in Supabase:', error)
      }
    }
  }

  // Delete Entire Shop from Supabase & Sign Out
  const handleDeleteShop = () => {
    triggerHaptic()
    Alert.alert(
      "⚠️ DANGER: DELETE STORE PERMANENTLY",
      `Are you sure you want to permanently delete "${shopName}"? All menu items, active orders, and store listings will be permanently removed. This action CANNOT be undone!`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "PERMANENTLY DELETE STORE",
          style: "destructive",
          onPress: async () => {
            if (activeShopId) {
              await supabase.from('menu_items').delete().eq('shop_id', activeShopId)
              await supabase.from('shop_workers').delete().eq('shop_id', activeShopId)
              const { error } = await supabase.from('shops').delete().eq('id', activeShopId)
              if (error) {
                console.error('[OwnerDashboard] Error deleting shop:', error)
                showToast('Failed to delete store')
              } else {
                showToast('Store permanently deleted')
                setTimeout(() => onSignOut(), 1200)
              }
            } else {
              onSignOut()
            }
          }
        }
      ]
    )
  }

  // Add Item to Supabase
  const handleAddItem = async () => {
    if (!activeShopId) {
      showToast('Unable to identify your shop — please log out and back in')
      return
    }

    if (!newItemName.trim() || !newItemPrice.trim()) {
      showToast('Enter item name & price')
      return
    }

    const itemPrice = parseFloat(newItemPrice) || 0
    const { data, error } = await supabase.from('menu_items').insert([{
      shop_id: activeShopId,
      name: newItemName.trim(),
      price: itemPrice,
      is_available: true,
      stock_quantity: 10,
      image_url: newItemImg
    }]).select()

    if (!error && data && data.length > 0) {
      const created = data[0]
      setMenuItems(prev => [{ id: created.id, name: created.name, price: created.price, available: true, stockQuantity: 10, img: created.image_url }, ...prev])
      setNewItemName('')
      setNewItemPrice('')
      showToast('Item Added to Menu!')
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
    <View style={tw`flex-1 bg-gray-100`}>
      {toast && (
        <View style={tw`absolute top-4 left-4 right-4 z-50 bg-black rounded-2xl p-4 items-center shadow-xl`}>
          <Text style={tw`text-white font-black text-sm text-center`}>✨ {toast}</Text>
        </View>
      )}

      {/* Top Header */}
      <View style={tw`bg-white px-4 pt-8 pb-3 border-b border-gray-200`}>
        <View style={tw`flex-row justify-between items-center mb-1`}>
          <View style={tw`flex-1 mr-2`}>
            <Text style={tw`text-[11px] font-black text-green-700 uppercase tracking-widest`}>
              {user?.role === 'worker' ? 'WORKER PORTAL' : 'SHOP OWNER PORTAL'}
            </Text>
            <Text style={tw`text-[22px] font-black text-gray-900`} numberOfLines={1}>{shopName}</Text>
            <Text style={tw`text-[12px] font-bold text-gray-700`}>
              👤 {user?.name || user?.full_name || user?.email?.split('@')[0] || 'Owner'} {user?.phone_number ? `• 📱 ${user?.phone_number}` : ''}
            </Text>
          </View>

          {/* Quick Language Toggle */}
          <View style={tw`flex-row gap-1 bg-gray-100 p-1 rounded-xl`}>
            {(['en', 'hi', 'ta'] as const).map((l) => (
              <TouchableOpacity
                key={l}
                onPress={() => {
                  setLang(l)
                  triggerHaptic()
                }}
                style={[tw`px-2.5 py-1 rounded-lg`, lang === l ? tw`bg-green-700` : tw`bg-transparent`]}
              >
                <Text style={[tw`text-[11px] font-black uppercase`, lang === l ? tw`text-white` : tw`text-gray-600`]}>
                  {l === 'en' ? 'EN' : l === 'hi' ? 'हिंदी' : 'தமி'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* GIANT ZOMATO-STYLE DAILY GO-LIVE BUTTON */}
        <TouchableOpacity
          onPress={handleToggleStoreLive}
          activeOpacity={0.8}
          style={[
            tw`mt-3 w-full py-4 rounded-2xl items-center justify-center shadow-md border-2`,
            {
              backgroundColor: isLiveToday ? '#16a34a' : '#dc2626',
              borderColor: isLiveToday ? '#15803d' : '#b91c1c'
            }
          ]}
        >
          <Text style={tw`text-white text-[17px] font-black tracking-wide text-center uppercase`}>
            {isLiveToday ? `${t.shopOpen} ${t.tapToClose}` : `${t.shopClosed} ${t.tapToOpen}`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={tw`flex-row px-4 pt-4 gap-3`}>
        <View style={[tw`flex-1 rounded-2xl p-4 border`, incomingCount > 0 ? tw`bg-red-50 border-red-300` : tw`bg-white border-gray-200`]}>
          <Text style={tw`text-[12px] font-black uppercase text-gray-500`}>{t.newWaiting}</Text>
          <Text style={[tw`text-[32px] font-black mt-0.5`, incomingCount > 0 ? tw`text-red-600` : tw`text-gray-900`]}>{incomingCount}</Text>
        </View>

        <View style={tw`flex-1 bg-white rounded-2xl p-4 border border-gray-200`}>
          <Text style={tw`text-[12px] font-black uppercase text-gray-500`}>{t.todayCash}</Text>
          <Text style={tw`text-[32px] font-black text-gray-900 mt-0.5`}>₹{todayTotalCashCollected}</Text>
        </View>
      </View>

      {/* Delivery Fee Policy Banner */}
      <View style={tw`px-4 pt-3`}>
        <View style={tw`bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-3.5 flex-row items-center gap-3 shadow-xs`}>
          <Text style={tw`text-2xl`}>🛵</Text>
          <View style={tw`flex-1`}>
            <Text style={tw`text-[12px] font-black text-emerald-950 uppercase tracking-wide`}>
              DELIVERY FEE POLICY NOTE
            </Text>
            <Text style={tw`text-[11px] font-bold text-emerald-900 leading-tight mt-0.5`}>
              Free delivery on orders ≥ ₹150 applies <Text style={tw`font-black text-emerald-950 underline`}>ONLY to Scheduled Delivery</Text>. Instant Delivery carries standard fee regardless of order total.
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={tw`p-4 pb-36`}>
        {/* ── 1. ORDERS TAB ────── */}
        {activeTab === 'orders' && (
          <View style={tw`gap-4`}>
            <Text style={tw`text-[18px] font-black text-gray-900`}>{t.orders} ({orders.length})</Text>

            {loading ? (
              <View style={tw`py-12 items-center justify-center`}>
                <ActivityIndicator size="large" color="#8fda58" />
              </View>
            ) : orders.length === 0 ? (
              <View style={tw`bg-white rounded-3xl p-8 items-center justify-center text-center shadow-xs border border-gray-200`}>
                <Text style={tw`text-4xl mb-2`}>📋</Text>
                <Text style={tw`text-base font-bold text-gray-900`}>No orders yet today</Text>
                <Text style={tw`text-xs text-gray-400 font-medium mt-1`}>New customer orders will appear here automatically.</Text>
              </View>
            ) : (
              orders.map(order => {
                const timer = getTimerDetails(order.expire_at)
                const bill = getOrderBill(order)

                return (
                  <View key={order.id} style={tw`bg-white rounded-3xl p-5 border-2 border-gray-300 shadow-md gap-3`}>
                    <View style={tw`flex-row justify-between items-start border-b border-gray-100 pb-3`}>
                      <TouchableOpacity onPress={() => setSelectedOrderIdForDetails(order.id)} style={tw`flex-1 mr-2`}>
                        <View style={tw`flex-row items-center gap-2 mb-1`}>
                          <Text style={tw`text-[28px] font-black text-gray-900 leading-none`}>#{order.id}</Text>
                          <Text style={tw`text-[11px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-md`}>View Details ➔</Text>
                        </View>
                        <Text style={tw`text-[20px] font-black text-green-700 mt-1`}>📍 {order.location}</Text>
                      </TouchableOpacity>

                      <View style={tw`items-end gap-1.5`}>
                        <View style={tw`bg-gray-100 px-3 py-1.5 rounded-full`}>
                          <Text style={tw`text-2xl`}>{order.payment_mode === 'cod' ? '💵' : '📱'}</Text>
                        </View>
                        {/* Status Badge */}
                        <View style={[tw`px-3 py-1 rounded-full`, 
                          order.status !== 'delivered' && order.status !== 'cancelled' && (function() {
                            const now = new Date()
                            if (order.delivery_mode === 'instant' || !order.selected_slot_label) {
                              const createdAt = new Date(order.created_at || Date.now())
                              return now > new Date(createdAt.getTime() + 20 * 60 * 1000)
                            }
                            return false
                          })() ? tw`bg-red-500` :
                          order.status === 'incoming' ? tw`bg-blue-100` :
                          order.status === 'out_for_delivery' || order.status === 'preparing' || order.status === 'accepted' ? tw`bg-orange-100` :
                          order.status === 'ready_for_pickup' ? tw`bg-purple-100` :
                          order.status === 'delivered' ? tw`bg-green-100` : tw`bg-red-100`
                        ]}>
                          <Text style={[tw`text-[12px] font-black uppercase`,
                            order.status !== 'delivered' && order.status !== 'cancelled' && (function() {
                              const now = new Date()
                              if (order.delivery_mode === 'instant' || !order.selected_slot_label) {
                                const createdAt = new Date(order.created_at || Date.now())
                                return now > new Date(createdAt.getTime() + 20 * 60 * 1000)
                              }
                              return false
                            })() ? tw`text-white` :
                            order.status === 'incoming' ? tw`text-blue-700` :
                            order.status === 'out_for_delivery' || order.status === 'preparing' || order.status === 'accepted' ? tw`text-orange-700` :
                            order.status === 'ready_for_pickup' ? tw`text-purple-700` :
                            order.status === 'delivered' ? tw`text-green-700` : tw`text-red-700`
                          ]}>
                            {order.status !== 'delivered' && order.status !== 'cancelled' && (function() {
                              const now = new Date()
                              if (order.delivery_mode === 'instant' || !order.selected_slot_label) {
                                const createdAt = new Date(order.created_at || Date.now())
                                return now > new Date(createdAt.getTime() + 20 * 60 * 1000)
                              }
                              return false
                            })() ? '⚠️ LATE / OVERDUE' :
                             order.status === 'incoming' ? '📥 NEW ORDER' :
                             order.status === 'out_for_delivery' || order.status === 'preparing' || order.status === 'accepted' ? '🛵 OUT FOR DELIVERY' :
                             order.status === 'ready_for_pickup' ? '📍 COLLECT YOUR ORDER' :
                             order.status === 'delivered' ? '✅ DELIVERED' : '❌ CANCELLED'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Progress Timer — Shown ONLY for Instant Delivery while pending acceptance */}
                    {order.status === 'incoming' && order.delivery_mode === 'instant' && (
                      <View style={[tw`rounded-2xl p-3 border flex-col gap-1.5`, tw`${timer.bgClass} ${timer.borderClass}`]}>
                        <View style={tw`flex-row justify-between items-center`}>
                          <Text style={[tw`text-[13px] font-black`, tw`${timer.textClass}`]}>⏱️ {t.timeLeft} (15 Min Limit):</Text>
                          <Text style={[tw`text-[18px] font-black font-mono`, tw`${timer.textClass}`]}>{timer.timeStr}</Text>
                        </View>
                        <View style={tw`w-full h-3.5 bg-gray-200 rounded-full overflow-hidden`}>
                          <View style={[tw`h-full rounded-full`, tw`${timer.colorClass}`, { width: `${Math.max(5, Math.min(100, timer.ratio * 100))}%` }]} />
                        </View>
                      </View>
                    )}

                    {/* Delivery Mode Badge & Delivery Time Instruction */}
                    {order.delivery_mode === 'instant' ? (
                      <View style={tw`bg-blue-50 border border-blue-200 rounded-2xl p-3 flex-row items-center justify-between shadow-xs`}>
                        <View style={tw`flex-1 mr-2`}>
                          <Text style={tw`text-[12px] font-black text-blue-900 uppercase tracking-wide`}>⚡ INSTANT DELIVERY</Text>
                          <Text style={tw`text-[11px] font-bold text-blue-700 mt-0.5`}>Expected Delivery: 20 mins from order placement</Text>
                        </View>
                        <Text style={tw`text-[13px] font-black text-blue-800`}>20 MINS</Text>
                      </View>
                    ) : (
                      <View style={tw`bg-purple-50 border-2 border-purple-300 rounded-2xl p-3.5 flex-col gap-1.5 shadow-xs`}>
                        <View style={tw`flex-row items-center justify-between`}>
                          <View style={tw`flex-row items-center gap-1.5`}>
                            <Text style={tw`text-base`}>📅</Text>
                            <Text style={tw`text-[12px] font-black text-purple-950 uppercase tracking-wide`}>SCHEDULED DELIVERY SLOT</Text>
                          </View>
                          <View style={tw`bg-purple-600 rounded-lg px-2.5 py-1`}>
                            <Text style={tw`text-white font-black text-[12px]`}>
                              {order.selected_slot_label || '12:40 PM – 1:40 PM'}
                            </Text>
                          </View>
                        </View>

                        <Text style={tw`text-[12px] font-bold text-purple-950 leading-snug mt-1`}>
                          ⚠️ <Text style={tw`font-black underline`}>SHOP NOTICE:</Text> Please prepare and deliver this order to Main Gate <Text style={tw`font-black text-purple-950 underline`}>EXACTLY during slot time: {order.selected_slot_label || '12:40 PM – 1:40 PM'}</Text>.
                        </Text>
                      </View>
                    )}

                    {/* Items & Fees Breakdown */}
                    <View style={tw`bg-gray-50 rounded-2xl p-3 gap-2 border border-gray-200`}>
                      {Array.isArray(order.items) && order.items.map((it: any, idx: number) => (
                        <View key={idx} style={tw`flex-row justify-between items-center`}>
                          <Text style={tw`text-[15px] font-black text-gray-900`}>{it.name} x {it.quantity || it.qty}</Text>
                          <Text style={tw`text-[15px] font-black text-gray-900`}>₹{(it.price || 0) * (it.quantity || it.qty)}</Text>
                        </View>
                      ))}

                      <View style={tw`border-t border-gray-200 pt-2 gap-1.5`}>
                        <View style={tw`flex-row justify-between items-center`}>
                          <Text style={tw`text-[13px] font-bold text-gray-600`}>{t.subtotal}</Text>
                          <Text style={tw`text-[13px] font-black text-gray-800`}>₹{bill.itemsSubtotal}</Text>
                        </View>

                        <View style={tw`flex-row justify-between items-center`}>
                          <Text style={tw`text-[13px] font-bold text-blue-700`}>
                            🛵 {t.deliveryFee} ({bill.isInstant ? '⚡ Instant ₹10' : '🟢 Scheduled ₹5'})
                          </Text>
                          <Text style={tw`text-[13px] font-black text-blue-800`}>+₹{bill.deliveryFee}</Text>
                        </View>

                        <View style={tw`flex-row justify-between items-center`}>
                          <Text style={tw`text-[13px] font-bold text-purple-700`}>⚡ {t.platformFee}</Text>
                          <Text style={tw`text-[13px] font-black text-purple-800`}>+₹{bill.platformFee}</Text>
                        </View>

                        <View style={tw`border-t border-gray-300 pt-2 mt-1 flex-row justify-between items-center`}>
                          <Text style={tw`text-[15px] font-black text-gray-900`}>{t.grandTotal}</Text>
                          <Text style={tw`text-[20px] font-black text-green-700`}>₹{bill.grandTotal}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Action Buttons (Updates Status & Fires Push Notification!) */}
                    <View style={tw`gap-2.5 mt-1`}>
                      {order.status === 'incoming' && (
                        <>
                          <TouchableOpacity
                            onPress={() => handleUpdateStatus(order.id, 'accepted')}
                            style={tw`w-full h-14 bg-green-600 rounded-2xl items-center justify-center shadow-lg active:scale-95`}
                          >
                            <Text style={tw`text-white font-black text-[17px] uppercase`}>{t.accept} (₹{bill.grandTotal})</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => handleUpdateStatus(order.id, 'cancelled', 'Shop declined order')}
                            style={tw`w-full h-12 bg-red-100 rounded-2xl items-center justify-center active:scale-95`}
                          >
                            <Text style={tw`text-red-700 font-black text-[14px]`}>{t.decline}</Text>
                          </TouchableOpacity>
                        </>
                      )}

                      {(order.status === 'accepted' || order.status === 'preparing') && (
                        <TouchableOpacity
                          onPress={() => handleUpdateStatus(order.id, 'out_for_delivery')}
                          style={tw`w-full h-14 bg-orange-500 rounded-2xl items-center justify-center shadow-lg active:scale-95`}
                        >
                          <Text style={tw`text-white font-black text-[17px] uppercase`}>{t.markReady}</Text>
                        </TouchableOpacity>
                      )}

                      {(order.status === 'out_for_delivery' || order.status === 'delivering') && (
                        <TouchableOpacity
                          onPress={() => handleUpdateStatus(order.id, 'delivered')}
                          style={tw`w-full h-14 bg-green-700 rounded-2xl items-center justify-center shadow-lg active:scale-95`}
                        >
                          <Text style={tw`text-white font-black text-[17px] uppercase`}>{t.markDelivered}</Text>
                        </TouchableOpacity>
                      )}

                      {order.status === 'delivered' && (
                        <View style={tw`w-full py-3 bg-green-50 rounded-2xl items-center`}>
                          <Text style={tw`text-green-800 font-black text-[14px]`}>{t.completed}</Text>
                        </View>
                      )}

                      {order.status === 'cancelled' && (
                        <View style={tw`w-full py-3 bg-red-50 rounded-2xl items-center`}>
                          <Text style={tw`text-red-700 font-black text-[14px]`}>{t.rejected}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )
              })
            )}
          </View>
        )}

        {/* ── 2. FOOD STOCK SCREEN (Backed by Supabase menu_items) ────── */}
        {activeTab === 'menu' && (
          <View style={tw`gap-4`}>
            {/* Form */}
            <View style={tw`bg-white rounded-3xl p-5 border-2 border-gray-300 gap-4 shadow-sm`}>
              <Text style={tw`text-[18px] font-black text-gray-900`}>{t.addFood}</Text>
              
              {!activeShopId ? (
                <View style={tw`w-full p-3 bg-yellow-50 border border-yellow-200 rounded-2xl flex-row items-center gap-2.5`}>
                  <ActivityIndicator size="small" color="#d97706" />
                  <Text style={tw`text-[12px] font-bold text-yellow-900 flex-1`}>
                    Loading shop profile... Form disabled until shop ID resolves.
                  </Text>
                </View>
              ) : null}

              <TouchableOpacity
                onPress={() => setShowImagePickerModal(true)}
                disabled={isUploadingPhoto || !activeShopId}
                style={[tw`w-full h-24 bg-green-50 border-2 border-dashed border-green-500 rounded-2xl items-center justify-center gap-1 active:scale-95`, !activeShopId && tw`opacity-50`]}
              >
                {isUploadingPhoto ? (
                  <ActivityIndicator size="large" color="#16a34a" />
                ) : (
                  <>
                    <Text style={tw`text-3xl`}>📷</Text>
                    <Text style={tw`text-green-800 font-black text-[13px]`}>
                      {newItemImg && !newItemImg.includes('unsplash') ? '✅ PHOTO ATTACHED (TAP TO CHANGE)' : t.photoButton}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TextInput
                placeholder={t.namePlaceholder}
                value={newItemName}
                onChangeText={setNewItemName}
                editable={!!activeShopId}
                style={tw`bg-gray-50 border border-gray-200 rounded-2xl px-4 h-14 text-[16px] font-bold text-gray-900`}
              />

              <TextInput
                placeholder={t.pricePlaceholder}
                keyboardType="number-pad"
                value={newItemPrice}
                onChangeText={setNewItemPrice}
                editable={!!activeShopId}
                style={tw`bg-gray-50 border border-gray-200 rounded-2xl px-4 h-14 text-[16px] font-bold text-gray-900`}
              />

              <TouchableOpacity
                onPress={handleAddItem}
                disabled={!activeShopId}
                style={[tw`w-full h-14 bg-green-600 rounded-2xl items-center justify-center shadow-md active:scale-95`, !activeShopId && tw`opacity-50`]}
              >
                <Text style={tw`text-white font-black text-[16px]`}>{t.saveFood}</Text>
              </TouchableOpacity>
            </View>

            {/* List */}
            <Text style={tw`text-[18px] font-black text-gray-900 mt-2`}>{t.menu} ({menuItems.length})</Text>
            <View style={tw`gap-3`}>
              {menuItems.map(item => (
                <View key={item.id} style={tw`bg-white rounded-2xl p-4 border-2 border-gray-200 gap-3 shadow-xs`}>
                  <View style={tw`flex-row justify-between items-center gap-3`}>
                    <Image source={{ uri: item.img }} style={tw`w-16 h-16 rounded-xl`} resizeMode="cover" />

                    <View style={tw`flex-1 min-w-0`}>
                      <Text style={tw`text-[16px] font-black text-gray-900`}>{item.name}</Text>
                      <Text style={tw`text-[15px] font-black text-green-700 mt-0.5`}>₹{item.price}</Text>
                    </View>

                    <View style={tw`flex-row items-center gap-2`}>
                      <TouchableOpacity
                        onPress={() => handleToggleStock(item.id, item.available)}
                        activeOpacity={0.8}
                        style={[
                          tw`px-3.5 h-11 rounded-2xl items-center justify-center border-2 shadow-sm`,
                          item.available ? tw`bg-green-600 border-green-700` : tw`bg-red-600 border-red-700`
                        ]}
                      >
                        <Text style={tw`text-white font-black text-[12px] uppercase`}>
                          {item.available ? t.inStock : t.soldOut}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleDeleteItem(item.id)}
                        activeOpacity={0.7}
                        style={tw`w-11 h-11 bg-red-50 border-2 border-red-200 rounded-2xl items-center justify-center active:scale-95 shadow-xs`}
                      >
                        <Text style={tw`text-base`}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Manual Real-Time Stock Increment/Decrement Controls (+ and -) */}
                  <View style={tw`flex-row justify-between items-center bg-gray-50 p-2.5 rounded-xl border border-gray-200`}>
                    <Text style={tw`text-[13px] font-bold text-gray-700`}>Real-Time Stock Quantity:</Text>

                    <View style={tw`flex-row items-center gap-2`}>
                      <TouchableOpacity
                        onPress={() => handleUpdateStockQuantity(item.id, -1)}
                        style={tw`w-9 h-9 rounded-xl bg-red-500 items-center justify-center shadow-xs active:scale-95`}
                      >
                        <Text style={tw`text-white font-black text-xl`}>-</Text>
                      </TouchableOpacity>

                      <TextInput
                        keyboardType="number-pad"
                        value={String(item.stockQuantity ?? 0)}
                        onChangeText={(text) => handleDirectStockQuantityChange(item.id, text)}
                        scrollEnabled={false}
                        multiline={false}
                        textAlign="center"
                        maxLength={4}
                        style={tw`w-14 h-9 bg-white border border-gray-300 rounded-xl text-center text-[15px] font-black text-gray-900 p-0 items-center justify-center`}
                      />

                      <TouchableOpacity
                        onPress={() => handleUpdateStockQuantity(item.id, 1)}
                        style={tw`w-9 h-9 rounded-xl bg-green-600 items-center justify-center shadow-xs active:scale-95`}
                      >
                        <Text style={tw`text-white font-black text-xl`}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── 3. SETTINGS & VAAYU FINANCIAL BREAKDOWN VAULT ────── */}
        {activeTab === 'settings' && (
          <View style={tw`gap-4`}>
            {/* VAAYU FINANCIAL SETTLEMENT VAULT */}
            <View style={tw`bg-white rounded-3xl p-5 border-2 border-purple-300 gap-4 shadow-sm`}>
              <Text style={tw`text-[16px] font-black text-purple-900 uppercase`}>{t.financialSummary}</Text>
              
              <View style={tw`bg-purple-50 rounded-2xl p-4 border border-purple-200 gap-2.5`}>
                <View style={tw`flex-row justify-between items-center pb-2 border-b border-purple-200 flex-wrap gap-1`}>
                  <Text style={tw`text-[12px] font-bold text-purple-800 flex-1 min-w-[120px]`}>{t.instantDeliveryTag}</Text>
                  <Text style={tw`text-[13px] font-black text-purple-900 text-right`}>{instantOrdersCount} × ₹10 = ₹{instantDeliveryFeesTotal}</Text>
                </View>

                <View style={tw`flex-row justify-between items-center pb-2 border-b border-purple-200 flex-wrap gap-1`}>
                  <Text style={tw`text-[12px] font-bold text-purple-800 flex-1 min-w-[120px]`}>{t.scheduledDeliveryTag}</Text>
                  <Text style={tw`text-[13px] font-black text-purple-900 text-right`}>{scheduledOrdersCount} × ₹5 = ₹{scheduledDeliveryFeesTotal}</Text>
                </View>

                <View style={tw`flex-row justify-between items-center pb-2 border-b border-purple-200 flex-wrap gap-1`}>
                  <Text style={tw`text-[12px] font-bold text-purple-800 flex-1 min-w-[120px]`}>{t.platformFeeTag}</Text>
                  <Text style={tw`text-[13px] font-black text-purple-900 text-right`}>{totalOrdersCount} × ₹5 = ₹{totalPlatformFeesToVaayu}</Text>
                </View>

                <View style={tw`bg-purple-200/60 rounded-xl p-3 mt-1`}>
                  <Text style={tw`text-[12px] font-black text-purple-900 uppercase`}>{t.totalOwedToVaayu}</Text>
                  <Text style={tw`text-[22px] font-black text-purple-950 mt-0.5`}>₹{totalAmountOwedToVaayu}</Text>
                  <Text style={tw`text-[11px] font-bold text-purple-800 mt-1 flex-wrap`}>
                    (₹{totalDeliveryFeesCollected} Delivery + ₹{totalPlatformFeesToVaayu} Platform Fee)
                  </Text>
                </View>

                <View style={tw`bg-green-100 rounded-xl p-3 border border-green-300 mt-1`}>
                  <Text style={tw`text-[12px] font-black text-green-900 uppercase`}>{t.shopNetEarnings}</Text>
                  <Text style={tw`text-[22px] font-black text-green-900 mt-0.5`}>₹{shopNetFoodEarnings}</Text>
                  <Text style={tw`text-[11px] font-bold text-green-800 mt-1 flex-wrap`}>
                    Total Cash ₹{todayTotalCashCollected} - Vaayu Return ₹{totalAmountOwedToVaayu}
                  </Text>
                </View>
              </View>
            </View>

            {/* Language Selector */}
            <View style={tw`bg-white rounded-3xl p-5 border-2 border-gray-300 gap-3 shadow-sm`}>
              <Text style={tw`text-[16px] font-black text-gray-900`}>{t.language}</Text>
              
              <View style={tw`gap-2`}>
                {[
                  { code: 'en', name: 'English' },
                  { code: 'hi', name: 'हिन्दी (Hindi)' },
                  { code: 'ta', name: 'தமிழ் (Tamil)' },
                ].map(l => (
                  <TouchableOpacity
                    key={l.code}
                    onPress={() => {
                      setLang(l.code as any)
                      showToast(`Language set to ${l.name}`)
                    }}
                    style={[
                      tw`w-full h-14 rounded-2xl border-2 flex-row items-center px-4 justify-between`,
                      lang === l.code ? tw`bg-green-50 border-green-600` : tw`bg-gray-50 border-gray-200`
                    ]}
                  >
                    <Text style={[tw`text-[16px] font-black`, lang === l.code ? tw`text-green-800` : tw`text-gray-800`]}>{l.name}</Text>
                    {lang === l.code && <Text style={tw`text-green-700 font-black text-lg`}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Danger Zone: Permanent Store Deletion */}
            <View style={tw`bg-red-50 rounded-3xl p-5 border-2 border-red-300 gap-3 shadow-xs mt-2`}>
              <Text style={tw`text-[16px] font-black text-red-900 uppercase`}>⚠️ Danger Zone</Text>
              <Text style={tw`text-[12px] font-bold text-red-800 leading-tight`}>
                Permanently delete your shop listing, menu items, and store data from Vaayu.
              </Text>
              <TouchableOpacity
                onPress={handleDeleteShop}
                style={tw`w-full h-14 bg-red-600 rounded-2xl items-center justify-center shadow-md active:scale-95 mt-1`}
              >
                <Text style={tw`text-white font-black text-[15px]`}>Delete Shop Permanently</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={onSignOut} style={tw`w-full h-14 bg-red-100 rounded-2xl items-center justify-center mt-2`}>
              <Text style={tw`text-red-700 font-black text-[16px]`}>{t.logout}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Sliding Bottom Nav Capsule */}
      <View style={tw`absolute bottom-4 left-4 right-4 z-40`}>
        <View style={[tw`rounded-[28px] p-1 border shadow-xl`, { backgroundColor: 'rgba(255, 255, 255, 0.96)', borderColor: 'rgba(255, 255, 255, 0.6)' }]}>
          <View style={tw`flex-row items-center justify-around py-1 px-1`}>
            {[
              { id: 'orders', label: t.orders, Icon: IconOrders },
              { id: 'menu', label: t.menu, Icon: IconMenu },
              { id: 'settings', label: t.settings, Icon: IconSettings },
            ].map(({ id, label, Icon }) => {
              const isActive = activeTab === id
              return (
                <TouchableOpacity
                  key={id}
                  onPress={() => {
                    triggerHaptic()
                    setActiveTab(id as any)
                  }}
                  style={[
                    tw`flex-row items-center py-3 px-4 rounded-full`,
                    { backgroundColor: isActive ? '#1a3a2a' : 'transparent' }
                  ]}
                >
                  <Icon active={isActive} />
                  {isActive && (
                    <Text style={tw`text-[14px] font-black text-white ml-2`}>{label}</Text>
                  )}
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      </View>

      {/* Photo Source Action Sheet / Modal */}
      <Modal
        visible={showImagePickerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImagePickerModal(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowImagePickerModal(false)}
          style={tw`flex-1 bg-black/50 justify-end`}
        >
          <View style={tw`bg-white rounded-t-3xl p-6 gap-3`}>
            <Text style={tw`text-[18px] font-black text-gray-900 text-center mb-2`}>
              Select Product Photo Source
            </Text>

            <TouchableOpacity
              onPress={handleLaunchCamera}
              style={tw`w-full py-4 bg-green-600 rounded-2xl flex-row items-center justify-center gap-3 active:scale-95`}
            >
              <Text style={tw`text-xl`}>📷</Text>
              <Text style={tw`text-white font-black text-[16px]`}>Take Photo (Camera)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLaunchGallery}
              style={tw`w-full py-4 bg-purple-700 rounded-2xl flex-row items-center justify-center gap-3 active:scale-95`}
            >
              <Text style={tw`text-xl`}>🖼️</Text>
              <Text style={tw`text-white font-black text-[16px]`}>Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowImagePickerModal(false)}
              style={tw`w-full py-3 bg-gray-100 rounded-2xl items-center justify-center mt-1`}
            >
              <Text style={tw`text-gray-700 font-bold text-[14px]`}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Order Details Modal */}
      <OrderDetailsModal
        visible={!!selectedOrderIdForDetails}
        orderId={selectedOrderIdForDetails}
        onClose={() => setSelectedOrderIdForDetails(null)}
        isOwnerView
      />
    </View>
  )
}
