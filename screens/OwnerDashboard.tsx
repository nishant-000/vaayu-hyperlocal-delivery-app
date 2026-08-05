import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, Modal, Vibration, ActivityIndicator, Alert, ActionSheetIOS, Platform, Linking } from 'react-native'
import tw from 'twrnc'
import Svg, { Path, Circle, Line, Polyline } from 'react-native-svg'
import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'
import { supabase } from '../lib/supabase'
import { getCache, setCache } from '../lib/cache'
import { fetchRemoteConfig, subscribeToRemoteConfig, AppConfig, DEFAULT_CONFIG } from '../lib/remoteConfig'
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
    markReady: "🛵 OUT FOR DELIVERY",
    markOutForDelivery: "🛵 OUT FOR DELIVERY",
    markCollectOrder: "📍 ASK TO COLLECT",
    markDelivered: "🎉 DELIVERED",
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
    instantDeliveryTag: "Instant Delivery Fees (₹10/order)",
    scheduledDeliveryTag: "Scheduled Delivery Fees (₹5/order)",
    platformFeeTag: "Platform Fees Owed to Vaayu (₹5/order)",
    totalOwedToVaayu: "💸 CASH TO RETURN TO VAAYU",
    shopNetEarnings: "💰 SHOP NET ITEM EARNINGS",
    shopBannerCardTitle: "🏪 STORE BANNER IMAGE",
    shopBannerCardSub: "This banner is shown to all students on the campus home screen.",
    changeBanner: "📷 CHANGE STORE BANNER PHOTO",
    bannerLiveBadge: "LIVE ON APP",
    storeSettingsTitle: "🏪 STORE SETTINGS & PROFILE",
    storeSettingsSub: "Update your store name, contact phone number, category, and delivery speed.",
    storeNameLabel: "STORE / SHOP NAME",
    storePhoneLabel: "CONTACT & WHATSAPP NUMBER",
    storeCategoryLabel: "STORE CATEGORY",
    storeDeliveryTimeLabel: "ESTIMATED DELIVERY TIME",
    ownerNameLabel: "SHOP OWNER FULL NAME",
    saveStoreSettings: "💾 SAVE STORE DETAILS",
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
    accept: "✅ स्वीकार करें",
    decline: "❌ मना करें",
    markReady: "🛵 रवाना करें (आउट फॉर डिलीवरी)",
    markOutForDelivery: "🛵 रवाना करें (आउट फॉर डिलीवरी)",
    markCollectOrder: "📍 पहुंच गए: कलेक्ट आर्डर",
    markDelivered: "🎉 आर्डर सौंप दिया (डिलिवर)",
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
    instantDeliveryTag: "तुरंत डिलिवरी शुल्क (₹10/आर्डर)",
    scheduledDeliveryTag: "निर्धारित डिलिवरी शुल्क (₹5/आर्डर)",
    platformFeeTag: "वायु प्लेटफॉर्म शुल्क (₹5/आर्डर)",
    totalOwedToVaayu: "💸 वायु को लौटाई जाने वाली कुल राशि",
    shopNetEarnings: "💰 दुकानदार की शुद्ध कमाई",
    shopBannerCardTitle: "🏪 दुकान का मुख्य बैनर फोटो",
    shopBannerCardSub: "यह फोटो सभी छात्रों और ग्राहकों को होम स्क्रीन पर दिखाई देती है।",
    changeBanner: "📷 मुख्य बैनर फोटो बदलें",
    bannerLiveBadge: "लाइव बैनर",
    storeSettingsTitle: "🏪 दुकान की जानकारी और सेटिंग्स",
    storeSettingsSub: "अपनी दुकान का नाम, मोबाइल नंबर, श्रेणी और डिलिवरी समय बदलें।",
    storeNameLabel: "दुकान का नाम",
    storePhoneLabel: "मोबाइल / व्हाट्सएप नंबर",
    storeCategoryLabel: "दुकान की श्रेणी",
    storeDeliveryTimeLabel: "डिलिवरी में लगने वाला समय",
    ownerNameLabel: "दुकानदार का पूरा नाम",
    saveStoreSettings: "💾 जानकारी सेव करें",
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
    markOutForDelivery: "🛵 டெலிவரிக்கு அனுப்பு",
    markCollectOrder: "📍 ஆர்டர் ஒப்படைக்க",
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
    instantDeliveryTag: "உடனடி டெலிவரி கட்டணம் (₹10/ஆர்டர்)",
    scheduledDeliveryTag: "திட்டமிடப்பட்ட டெலிவரி கட்டணம் (₹5/ஆர்டர்)",
    platformFeeTag: "வாயு கட்டணம் (₹5/ஆர்டர்)",
    totalOwedToVaayu: "💸 வாயுவிற்கு செலுத்த வேண்டிய தொகை",
    shopNetEarnings: "💰 கடை நிகர வருமானம்",
    shopBannerCardTitle: "🏪 கடை முகப்பு பேனர்",
    shopBannerCardSub: "இந்த புகைப்படம் அனைத்து மாணவர்களுக்கும் முகப்பு பக்கத்தில் தோன்றும்.",
    changeBanner: "📸 பேனர் புகைப்படத்தை மாற்றவும்",
    bannerLiveBadge: "நேரலை பேனர்",
    storeSettingsTitle: "🏪 கடை அமைப்புகள் மற்றும் விவரங்கள்",
    storeSettingsSub: "உங்கள் கடை பெயர், தொலைபேசி எண், வகை மற்றும் டெலிவரி நேரத்தை மாற்றவும்.",
    storeNameLabel: "கடை பெயர்",
    storePhoneLabel: "தொலைபேசி / வாட்ஸ்அப் எண்",
    storeCategoryLabel: "கடை வகை",
    storeDeliveryTimeLabel: "மதிப்பிடப்பட்ட டெலிவரி நேரம்",
    ownerNameLabel: "உரிமையாளர் பெயர்",
    saveStoreSettings: "💾 அமைப்புகளைச் சேமிக்கவும்",
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

function IconUser({ active }: { active: boolean }) {
  const c = active ? "#ffffff" : "#6b7280"
  return (
    <Svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5">
      <Circle cx="12" cy="8" r="4" />
      <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </Svg>
  )
}

const KNOWN_CATEGORIES = ['Food', 'Grocery', 'Pharmacy', 'Stationery', 'Others']

// DB stores category as lowercase or comma-separated (e.g. "food, others").
// Normalize to a single title-cased value for UI display and state.
function normalizeCategoryFromDB(raw: string): string[] {
  if (!raw) return ['Food']
  const parts = raw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  const result: string[] = []
  for (const part of parts) {
    const match = KNOWN_CATEGORIES.find(k => k.toLowerCase() === part)
    if (match) {
      if (!result.includes(match)) result.push(match)
    } else {
      const custom = part.charAt(0).toUpperCase() + part.slice(1)
      if (!result.includes(custom)) result.push(custom)
    }
  }
  return result.length > 0 ? result : ['Food']
}

interface OwnerDashboardProps {
  user: any
  onSignOut: () => void
}

export default function OwnerDashboard({ user, onSignOut }: OwnerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'settings' | 'profile'>('orders')
  const [isLiveToday, setIsLiveToday] = useState<boolean | null>(null)
  const [isShopStatusLoading, setIsShopStatusLoading] = useState(true)
  const [isTogglingStoreLive, setIsTogglingStoreLive] = useState(false)
  const [lang, setLang] = useState<'en' | 'hi' | 'ta'>('en')
  const [loading, setLoading] = useState(true)

  // Remote Config
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG)

  const [selectedOrderIdForDetails, setSelectedOrderIdForDetails] = useState<string | null>(null)

  const t = i18n[lang] || i18n['en']

  const triggerHaptic = () => {
    try { Vibration.vibrate(80); } catch {}
  }

  // Real Database State (No Mock Data!)
  const [orders, setOrders] = useState<any[]>([])
  const [menuItems, setMenuItems] = useState<any[]>([])
  const [workers, setWorkers] = useState<any[]>([])
  const [platformFees, setPlatformFees] = useState<any[]>([])
  const [promosList, setPromosList] = useState<any[]>([])

  // Form Inputs
  const [newWorkerName, setNewWorkerName] = useState('')
  const [newWorkerPhone, setNewWorkerPhone] = useState('')

  const [newItemName, setNewItemName] = useState('')
  const [newItemPrice, setNewItemPrice] = useState('')
  const [newItemImg, setNewItemImg] = useState('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200')
  const [shopBannerImg, setShopBannerImg] = useState<string>('https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400')
  const [isUpdatingBanner, setIsUpdatingBanner] = useState(false)
  const [imagePickerTarget, setImagePickerTarget] = useState<'item' | 'banner'>('item')

  const [toast, setToast] = useState<string | null>(null)
  const showToast = (msg: string) => {
    triggerHaptic()
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [showImagePickerModal, setShowImagePickerModal] = useState(false)

  // Partial Order Acceptance Modal State
  const [partialOrderModalVisible, setPartialOrderModalVisible] = useState(false)
  const [selectedOrderForPartial, setSelectedOrderForPartial] = useState<any>(null)
  const [partialItemQuantities, setPartialItemQuantities] = useState<Record<string, number>>({})
  const [partialReason, setPartialReason] = useState<string>('Some items out of stock')
  const [isSubmittingPartial, setIsSubmittingPartial] = useState(false)

  // Upload local URI to Supabase Storage bucket 'product-images' with compression and return public URL
  const uploadImageToSupabase = async (uri: string, target: 'item' | 'banner' = 'item'): Promise<string | null> => {
    try {
      // 1. Compress & Resize image and get base64 directly
      const resizeWidth = target === 'banner' ? 1200 : 1080
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: resizeWidth } }],
        { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      )

      if (!manipResult.base64) {
        throw new Error('Failed to process image data')
      }

      const prefix = target === 'banner' ? 'banner' : 'item'
      const fileName = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`
      const filePath = activeShopId ? `menu/${activeShopId}/${fileName}` : `menu/general/${fileName}`

      // 2. Decode base64 string to ArrayBuffer for reliable upload in React Native
      const { decode } = require('base64-arraybuffer')
      const arrayBuffer = decode(manipResult.base64)

      // 3. Upload to Supabase Storage bucket 'product-images'
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, arrayBuffer, {
          contentType: 'image/jpeg',
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
          'Camera access is required so shop owners can photograph food products and banners for your store listing. Please grant camera permission in your device settings.',
          [{ text: 'OK' }]
        )
        return
      }

      const isBanner = imagePickerTarget === 'banner'
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: isBanner ? [16, 9] : [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri

        if (isBanner) {
          setIsUpdatingBanner(true)
          showToast('Uploading store banner...')
          const publicUrl = await uploadImageToSupabase(selectedUri, 'banner')
          setIsUpdatingBanner(false)

          if (publicUrl && activeShopId) {
            setShopBannerImg(publicUrl)
            const { error } = await supabase
              .from('shops')
              .update({ image_url: publicUrl })
              .eq('id', activeShopId)

            if (error) {
              showToast('Banner upload error: ' + error.message)
            } else {
              showToast('🎉 Shop Banner Image Updated!')
            }
          }
        } else {
          setIsUploadingPhoto(true)
          showToast('Uploading photo to cloud...')
          const publicUrl = await uploadImageToSupabase(selectedUri, 'item')
          setIsUploadingPhoto(false)

          if (publicUrl) {
            setNewItemImg(publicUrl)
            showToast('📷 Photo uploaded & attached!')
          } else {
            showToast('Upload failed, please try again')
          }
        }
      }
    } catch (err: any) {
      setIsUploadingPhoto(false)
      setIsUpdatingBanner(false)
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
          'Photo library access is required so shop owners can select food photos and store banners. Please grant photo library permission in your device settings.',
          [{ text: 'OK' }]
        )
        return
      }

      const isBanner = imagePickerTarget === 'banner'
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: isBanner ? [16, 9] : [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri

        if (isBanner) {
          setIsUpdatingBanner(true)
          showToast('Uploading store banner...')
          const publicUrl = await uploadImageToSupabase(selectedUri, 'banner')
          setIsUpdatingBanner(false)

          if (publicUrl && activeShopId) {
            setShopBannerImg(publicUrl)
            const { error } = await supabase
              .from('shops')
              .update({ image_url: publicUrl })
              .eq('id', activeShopId)

            if (error) {
              showToast('Banner upload error: ' + error.message)
            } else {
              showToast('🎉 Shop Banner Image Updated!')
            }
          }
        } else {
          setIsUploadingPhoto(true)
          showToast('Uploading photo to cloud...')
          const publicUrl = await uploadImageToSupabase(selectedUri, 'item')
          setIsUploadingPhoto(false)

          if (publicUrl) {
            setNewItemImg(publicUrl)
            showToast('🖼️ Photo uploaded & attached!')
          } else {
            showToast('Upload failed, please try again')
          }
        }
      }
    } catch (err: any) {
      setIsUploadingPhoto(false)
      setIsUpdatingBanner(false)
      showToast('Unable to open gallery')
    }
  }

  const [activeShopId, setActiveShopId] = useState<string | null>(user?.shop_id || null)
  const [shopName, setShopName] = useState<string>(user?.shop_name || 'Campus Bites Cafe')
  const [shopPhone, setShopPhone] = useState<string>(user?.phone_number || '')
  const [shopCategory, setShopCategory] = useState<string[]>(['Food'])
  const [shopDeliveryTime, setShopDeliveryTime] = useState<string>('15-20 min')
  const [ownerFullName, setOwnerFullName] = useState<string>(user?.name || user?.full_name || '')

  // Edit fields for settings
  const [editShopName, setEditShopName] = useState<string>(user?.shop_name || '')
  const [editShopPhone, setEditShopPhone] = useState<string>(user?.phone_number || '')
  const [editShopCategory, setEditShopCategory] = useState<string[]>(['Food'])
  const [editShopDeliveryTime, setEditShopDeliveryTime] = useState<string>('15-20 min')
  const [editOwnerFullName, setEditOwnerFullName] = useState<string>(user?.name || user?.full_name || '')
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false)

  const [isSyncingOrders, setIsSyncingOrders] = useState<boolean>(false)
  const [customerProfiles, setCustomerProfiles] = useState<Record<string, { full_name?: string; phone_number?: string; email?: string }>>({})

  // Fetch fresh orders function with optional spinner
  const fetchFreshOrders = async (showSpinner = false, shopIdOverride?: string | null) => {
    const currentShopId = shopIdOverride !== undefined ? shopIdOverride : activeShopId
    if (!currentShopId) {
      setOrders([])
      setLoading(false)
      return
    }

    if (showSpinner) setIsSyncingOrders(true)
    try {
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*')
        .eq('shop_id', currentShopId)
        .order('created_at', { ascending: false })

      if (!error && ordersData) {
        setOrders(ordersData)
        await setCache(`owner_orders_${currentShopId}`, ordersData, 300)

        // Fetch customer profiles for direct customer phone contact & name lookup
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, user_id, full_name, phone_number, email')
        
        if (profilesData && profilesData.length > 0) {
          const map: Record<string, { full_name?: string; phone_number?: string; email?: string }> = {}
          profilesData.forEach((p: any) => {
            if (p.id) map[p.id] = p
            if (p.user_id) map[p.user_id] = p
            if (p.email) map[p.email.toLowerCase()] = p
          })
          setCustomerProfiles(prev => ({ ...prev, ...map }))
        }
      }
    } catch (err) {
      console.warn('[OwnerDashboard] Fetch orders error:', err)
    } finally {
      if (showSpinner) setIsSyncingOrders(false)
      setLoading(false)
    }
  }

  // 1. Load Initial Real Data from Supabase & Subscribe to Realtime Updates
  useEffect(() => {
    // Fetch initial config and subscribe (which automatically manages realtime promos & app_config)
    fetchRemoteConfig().then(setConfig)
    const unsubscribeConfig = subscribeToRemoteConfig(setConfig)

    // Initial fetch of promos table
    supabase.from('promos').select('*').then(({ data }) => {
      if (data) setPromosList(data)
    })

    async function loadShopData() {
      let targetShopId = user?.shop_id || activeShopId

      // If shop_id not directly in user object, strictly find shop owned by this specific user
      if (!targetShopId && user?.id) {
        const { data: userShop } = await supabase
          .from('shops')
          .select('id, name, is_open, phone, category, delivery_time, image_url')
          .or(`owner_id.eq.${user.id},owner_id.eq.${user?.user_id || ''}`)
          .maybeSingle()
        if (userShop) {
          targetShopId = userShop.id
          if (isMounted) {
            setActiveShopId(userShop.id)
            setShopName(userShop.name)
            setEditShopName(userShop.name)
            if (userShop.phone) {
              const phoneDigits = (userShop.phone || '').replace(/\D/g, '').slice(0, 10)
              setShopPhone(phoneDigits)
              setEditShopPhone(phoneDigits)
            }
            if (userShop.category) {
              const normalized = normalizeCategoryFromDB(userShop.category)
              setShopCategory(normalized)
              setEditShopCategory(normalized)
            }
            if (userShop.delivery_time) {
              setShopDeliveryTime(userShop.delivery_time)
              setEditShopDeliveryTime(userShop.delivery_time)
            }
            if (userShop.image_url) {
              setShopBannerImg(userShop.image_url)
            }
            if (userShop.is_open !== undefined && userShop.is_open !== null) {
              setIsLiveToday(userShop.is_open)
            }
          }
        }
      }

      if (targetShopId) {
        if (isMounted) setActiveShopId(targetShopId)

        // 1. Instant Cache Hydration for 0ms Load Time (Namespaced by shopId)
        const cachedOrders = await getCache<any[]>(`owner_orders_${targetShopId}`)
        const cachedMenu = await getCache<any[]>(`owner_menu_${targetShopId}`)
        if (isMounted) {
          if (cachedOrders) setOrders(cachedOrders)
          if (cachedMenu) setMenuItems(cachedMenu)
          if (cachedOrders || cachedMenu) setLoading(false)
          else setLoading(true)
        }

        // Fetch Shop Metadata
        const { data: currentShop } = await supabase
          .from('shops')
          .select('id, name, is_open, image_url, phone, category, delivery_time, owner_id')
          .eq('id', targetShopId)
          .maybeSingle()

        if (currentShop && isMounted) {
          if (currentShop.name) {
            setShopName(currentShop.name)
            setEditShopName(currentShop.name)
          }
          if (currentShop.phone) {
            const phoneDigits = (currentShop.phone || '').replace(/\D/g, '').slice(0, 10)
            setShopPhone(phoneDigits)
            setEditShopPhone(phoneDigits)
          }
          if (currentShop.category) {
            const normalized = normalizeCategoryFromDB(currentShop.category)
            setShopCategory(normalized)
            setEditShopCategory(normalized)
          }
          if (currentShop.delivery_time) {
            setShopDeliveryTime(currentShop.delivery_time)
            setEditShopDeliveryTime(currentShop.delivery_time)
          }
          if (currentShop.image_url) setShopBannerImg(currentShop.image_url)
          if (currentShop.is_open !== undefined && currentShop.is_open !== null) {
            setIsLiveToday(currentShop.is_open)
          } else {
            setIsLiveToday(false)
          }
          setIsShopStatusLoading(false)
        } else if (isMounted) {
          setIsShopStatusLoading(false)
        }

        // Fetch Owner Profile if available
        if (user?.id) {
          const { data: ownerProf } = await supabase
            .from('profiles')
            .select('full_name, phone_number')
            .or(`id.eq.${user.id},user_id.eq.${user.id}`)
            .maybeSingle()
          if (ownerProf && isMounted) {
            if (ownerProf.full_name) {
              setOwnerFullName(ownerProf.full_name)
              setEditOwnerFullName(ownerProf.full_name)
            }
            if (ownerProf.phone_number && !currentShop?.phone) {
              setShopPhone(ownerProf.phone_number)
              setEditShopPhone(ownerProf.phone_number)
            }
          }
        }

        // Fetch Fresh Orders for this Shop
        await fetchFreshOrders(false, targetShopId)

        // Fetch Menu Items strictly for this Shop
        const { data: menuData } = await supabase
          .from('menu_items')
          .select('*')
          .eq('shop_id', targetShopId)
          .order('created_at', { ascending: false })

        if (menuData && isMounted) {
          const formattedMenu = menuData.map(m => {
            const itemPhoto = m.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'
            return {
              id: m.id,
              name: m.name,
              price: m.price,
              available: m.is_available && (m.stock_quantity === undefined || m.stock_quantity === null || m.stock_quantity > 0),
              stockQuantity: m.stock_quantity ?? 10,
              img: itemPhoto,
              image: itemPhoto,
              image_url: itemPhoto
            }
          })
          setMenuItems(formattedMenu)
          await setCache(`owner_menu_${targetShopId}`, formattedMenu, 300)
        }

        // Fetch Shop Workers
        const { data: workersData } = await supabase
          .from('shop_workers')
          .select('*')
          .eq('shop_id', targetShopId)
          .order('created_at', { ascending: false })

        if (workersData && isMounted) {
          setWorkers(workersData.map(w => ({
            id: w.id,
            name: w.worker_name,
            phone: w.worker_phone
          })))
        }

        // Fetch Monthly Platform Fees
        const { data: feesData } = await supabase
          .from('platform_fee_payments')
          .select('*')
          .eq('shop_id', targetShopId)
          .order('month', { ascending: false })

        if (feesData && isMounted) {
          setPlatformFees(feesData)
        }
      } else {
        // No shop exists yet for this user
        if (isMounted) {
          setOrders([])
          setMenuItems([])
          setWorkers([])
          setShopName('New Store')
          setIsLiveToday(false)
          setIsShopStatusLoading(false)
          setLoading(false)
        }
      }

      if (isMounted) {
        setIsShopStatusLoading(false)
        setLoading(false)
      }
    }

    // Handle isMounted for cleanup safety
    let isMounted = true
    loadShopData()

    // Realtime Orders Subscription (Listens to INSERT, UPDATE, DELETE for this specific shop)
    const ordersSub = supabase
      .channel('shop_orders_realtime_v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        const orderShopId = (payload.new as any)?.shop_id || (payload.old as any)?.shop_id
        if (activeShopId && orderShopId && orderShopId !== activeShopId) {
          return // Ignore other shops' realtime orders
        }

        triggerHaptic()
        if (payload.eventType === 'INSERT') {
          setOrders(prev => {
            if (prev.some(o => o.id === payload.new.id)) return prev
            return [payload.new, ...prev]
          })
          showToast(`🔔 New Order #${payload.new.id} Received!`)
        } else if (payload.eventType === 'UPDATE') {
          setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new : o))
        } else if (payload.eventType === 'DELETE') {
          setOrders(prev => prev.filter(o => o.id !== (payload.old as any).id))
        }
      })
      .subscribe()

    // Realtime Stock Subscription — updates menu item quantities in real-time after orders are placed
    const menuSub = supabase
      .channel('shop_menu_realtime_v2')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'menu_items' }, (payload) => {
        const updated = payload.new
        setMenuItems(prev => prev.map(item =>
          item.id === updated.id
            ? {
                ...item,
                stockQuantity: updated.stock_quantity ?? 0,
                available: updated.is_available && (updated.stock_quantity === undefined || updated.stock_quantity === null || updated.stock_quantity > 0),
                img: updated.image_url || item.img,
                image: updated.image_url || item.image,
                image_url: updated.image_url || item.image_url,
              }
            : item
        ))
      })
      .subscribe()

    // Realtime Platform Fees Subscription
    const feesSub = supabase
      .channel('shop_fees_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'platform_fee_payments' }, (payload) => {
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          setPlatformFees(prev => {
            const exists = prev.find(f => f.id === payload.new.id)
            if (exists) {
              return prev.map(f => f.id === payload.new.id ? payload.new : f)
            }
            // If new, just add to top
            return [payload.new, ...prev].sort((a, b) => b.month.localeCompare(a.month))
          })
        }
      })
      .subscribe()

    // Background sync polling every 4 seconds for 100% guarantee
    const pollInterval = setInterval(() => {
      fetchFreshOrders(false)
    }, 4000)

    return () => {
      isMounted = false
      clearInterval(pollInterval)
      supabase.removeChannel(ordersSub)
      supabase.removeChannel(menuSub)
      supabase.removeChannel(feesSub)
      unsubscribeConfig()
    }
  }, [])

  // Timer Tick
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const isOrderLate = (order: any): boolean => {
    if (!order || order.status === 'delivered' || order.status === 'cancelled') return false
    const currentNow = new Date()
    if (order.delivery_mode === 'instant' || !order.selected_slot_label) {
      const createdAt = new Date(order.created_at || Date.now())
      return currentNow.getTime() > createdAt.getTime() + 20 * 60 * 1000
    }
    return false
  }

  const getCompactLocation = (fullLocation?: string): string => {
    if (!fullLocation) return 'Room'
    let loc = fullLocation.trim()
    // Strip campus base prefix (e.g. "IIIT Tiruchirappalli", "IIIT Trichy")
    loc = loc.replace(/^IIIT\s*(Tiruchirappalli|Trichy|Campus)?[,\s-]*/i, '').trim()
    // Strip trailing city/area suffix (e.g. "· Sethurapatti, Trichy", ", Sethurapatti")
    loc = loc.replace(/[·,]\s*(Sethurapatti|Trichy|Tiruchirappalli).*$/i, '').trim()
    // Clean up punctuation
    loc = loc.replace(/^[,\s·-]+|[,\s·-]+$/g, '').trim()
    return loc || 'Room'
  }

  const getExpectedDeliveryTime = (order: any): string => {
    if (!order) return ''
    if (order.delivery_mode === 'instant') {
      if (order.created_at) {
        try {
          const createdDate = new Date(order.created_at)
          const expectedDate = new Date(createdDate.getTime() + 20 * 60 * 1000)
          return expectedDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        } catch (_) {}
      }
      return 'Within 20 mins'
    }
    return order.selected_slot_label || '12:40 PM – 1:40 PM'
  }

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
    const deliveryFee = order.delivery_fee ?? (isInstant ? config.delivery_fee.instant : config.delivery_fee.scheduled)
    const appliedPromo = (order.applied_promo || '').trim().toUpperCase()
    
    // Check if applied promo is a platform fee waiver promo
    const isFreePlatformFee = 
      order.platform_fee === 0 ||
      ['FREEFEE', 'NOPLATFORM', 'FREEPLATFORM', 'ZEROFEES'].includes(appliedPromo) ||
      promosList.some(p => p.code?.toUpperCase() === appliedPromo && (p.discount_type === 'platform_fee' || p.discount_type === 'free_platform_fee')) ||
      config.promo_codes?.some(p => p.code?.toUpperCase() === appliedPromo && (p.discount_type === 'platform_fee' || p.discount_type === 'free_platform_fee'))

    const platformFee = isFreePlatformFee ? 0 : (order.platform_fee !== undefined && order.platform_fee !== null ? Number(order.platform_fee) : config.platform_fee)
    const promoDiscount = order.promo_discount || 0
    const itemsSubtotal = order.items_subtotal || (Array.isArray(order.items)
      ? order.items.reduce((s: number, i: any) => s + (i.price * i.quantity), 0)
      : 0)
    
    // If the promo was a free platform fee promo, the discount was the waived platform fee itself (platformFee = 0),
    // so we avoid double-deducting promoDiscount from grandTotal if platformFee is already 0.
    const effectiveDiscount = isFreePlatformFee ? 0 : promoDiscount
    const grandTotal = order.grand_total || Math.max(0, itemsSubtotal + deliveryFee + platformFee - effectiveDiscount)
    return { isInstant, itemsSubtotal, deliveryFee, platformFee, promoDiscount, appliedPromo, grandTotal, isFreePlatformFee }
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

  // Partial Order Acceptance Helpers
  const openPartialOrderModal = (order: any) => {
    setSelectedOrderForPartial(order)
    const initialQuantities: Record<string, number> = {}
    if (Array.isArray(order.items)) {
      order.items.forEach((it: any, idx: number) => {
        const idKey = it.id || it.name || `item_${idx}`
        initialQuantities[idKey] = it.quantity || it.qty || 1
      })
    }
    setPartialItemQuantities(initialQuantities)
    setPartialReason('Some items out of stock')
    setPartialOrderModalVisible(true)
  }

  const handlePartialItemQtyChange = (itemKey: string, delta: number, maxQty: number) => {
    triggerHaptic()
    setPartialItemQuantities(prev => {
      const current = prev[itemKey] !== undefined ? prev[itemKey] : maxQty
      const next = Math.max(0, Math.min(maxQty, current + delta))
      return { ...prev, [itemKey]: next }
    })
  }

  const calculatePartialTotals = (order: any, quantities: Record<string, number>) => {
    if (!order || !Array.isArray(order.items)) {
      return { newSubtotal: 0, deliveryFee: 0, platformFee: 0, newGrandTotal: 0, hasItems: false, isModified: false }
    }
    const isInstant = order.delivery_mode === 'instant'
    const appliedPromo = (order.applied_promo || '').trim().toUpperCase()
    const isFreePlatformFee = 
      order.platform_fee === 0 ||
      ['FREEFEE', 'NOPLATFORM', 'FREEPLATFORM', 'ZEROFEES'].includes(appliedPromo) ||
      promosList.some(p => p.code?.toUpperCase() === appliedPromo && (p.discount_type === 'platform_fee' || p.discount_type === 'free_platform_fee')) ||
      config.promo_codes?.some(p => p.code?.toUpperCase() === appliedPromo && (p.discount_type === 'platform_fee' || p.discount_type === 'free_platform_fee'))

    const platformFee = isFreePlatformFee ? 0 : (order.platform_fee !== undefined && order.platform_fee !== null ? Number(order.platform_fee) : config.platform_fee)

    let newSubtotal = 0
    let hasItems = false
    let isModified = false

    order.items.forEach((it: any, idx: number) => {
      const idKey = it.id || it.name || `item_${idx}`
      const origQty = it.original_quantity || it.quantity || it.qty || 1
      const currentQty = quantities[idKey] !== undefined ? quantities[idKey] : (it.quantity || it.qty || 1)
      if (currentQty < origQty) isModified = true
      if (currentQty > 0) hasItems = true
      newSubtotal += (it.price || 0) * currentQty
    })

    // Dynamically recalculate delivery fee based on the new partial subtotal
    let deliveryFee = isInstant ? config.delivery_fee.instant : config.delivery_fee.scheduled
    const freeDeliveryThreshold = config.free_delivery_threshold || 150
    if (!isInstant && newSubtotal >= freeDeliveryThreshold) {
      deliveryFee = 0
    }

    const promoDiscount = order.promo_discount || 0
    const effectiveDiscount = isFreePlatformFee ? 0 : promoDiscount
    const newGrandTotal = newSubtotal > 0 ? Math.max(0, newSubtotal + deliveryFee + platformFee - effectiveDiscount) : 0
    return { newSubtotal, deliveryFee, platformFee, promoDiscount, appliedPromo, newGrandTotal, hasItems, isModified }
  }

  const handleConfirmPartialOrder = async () => {
    if (!selectedOrderForPartial) return
    const { newSubtotal, deliveryFee, platformFee, newGrandTotal, hasItems } = calculatePartialTotals(selectedOrderForPartial, partialItemQuantities)

    if (!hasItems) {
      Alert.alert('No Items Selected', 'Please select at least 1 available item or decline the order if no items are available.')
      return
    }

    setIsSubmittingPartial(true)
    triggerHaptic()

    try {
      // Build updated items payload
      const updatedItems = selectedOrderForPartial.items.map((it: any, idx: number) => {
        const idKey = it.id || it.name || `item_${idx}`
        const origQty = it.original_quantity || it.quantity || it.qty || 1
        const acceptedQty = partialItemQuantities[idKey] !== undefined ? partialItemQuantities[idKey] : origQty
        return {
          ...it,
          quantity: acceptedQty,
          original_quantity: origQty,
          is_unavailable: acceptedQty === 0
        }
      })

      const updatePayload = {
        status: 'accepted',
        items: updatedItems,
        items_subtotal: newSubtotal,
        delivery_fee: deliveryFee,
        platform_fee: platformFee,
        grand_total: newGrandTotal,
        is_partial: true,
        partial_reason: partialReason || 'Some items out of stock'
      }

      // 1. Write to Supabase FIRST (before closing modal to prevent polling race)
      const { error } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', selectedOrderForPartial.id)

      if (error) {
        console.error('[OwnerDashboard] Failed to update partial order in Supabase:', error)
        Alert.alert('Update Failed', `Could not update the order: ${error.message}. Please try again.`)
        setIsSubmittingPartial(false)
        return
      }

      // 2. DB write succeeded — now update local state and close modal
      setOrders(prev => prev.map(o => o.id === selectedOrderForPartial.id ? { ...o, ...updatePayload } : o))
      setPartialOrderModalVisible(false)
      showToast(`Order #${selectedOrderForPartial.id} partially accepted! (₹${newGrandTotal})`)
    } catch (err) {
      console.error('[OwnerDashboard] Partial order error:', err)
      Alert.alert('Error', 'Something went wrong. Please try again.')
    } finally {
      setIsSubmittingPartial(false)
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
    if (isShopStatusLoading || isTogglingStoreLive) return
    triggerHaptic()
    const next = !(isLiveToday ?? false)
    setIsTogglingStoreLive(true)

    try {
      if (activeShopId) {
        const { error } = await supabase
          .from('shops')
          .update({ is_open: next })
          .eq('id', activeShopId)

        if (error) {
          console.error('[OwnerDashboard] Failed to update store open status in Supabase:', error)
          showToast('Failed to update shop status')
        } else {
          setIsLiveToday(next)
          showToast(next ? t.shopOpen : t.shopClosed)
        }
      } else {
        setIsLiveToday(next)
        showToast(next ? t.shopOpen : t.shopClosed)
      }
    } catch (e) {
      console.error('[OwnerDashboard] Toggle error:', e)
      showToast('Error updating shop status')
    } finally {
      setIsTogglingStoreLive(false)
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

  // Save Store Details & Profile to Supabase
  const handleSaveStoreDetails = async () => {
    if (!activeShopId) {
      showToast('Unable to identify shop ID')
      return
    }

    if (!editShopName.trim()) {
      Alert.alert('Store Name Required', 'Please enter a valid store name.')
      return
    }

    const digitsOnly = editShopPhone.trim().replace(/\D/g, '')
    if (!editShopPhone.trim() || digitsOnly.length !== 10) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid 10-digit phone number (digits only, no country code).')
      return
    }

    triggerHaptic()
    setIsSavingSettings(true)
    try {
      // 1. Update shops table
      const { error: shopError } = await supabase
        .from('shops')
        .update({
          name: editShopName.trim(),
          phone: digitsOnly,
          // Store category lowercase so HomeScreen category filter matches
          category: editShopCategory.join(', ').toLowerCase(),
        })
        .eq('id', activeShopId)

      if (shopError) {
        Alert.alert('Update Failed', shopError.message)
        setIsSavingSettings(false)
        return
      }

      // 2. Also update profiles table if owner profile exists
      if (user?.id) {
        await supabase
          .from('profiles')
          .update({
            full_name: editOwnerFullName.trim() || editShopName.trim(),
            phone_number: digitsOnly,
          })
          .or(`id.eq.${user.id},user_id.eq.${user.id}`)
      }

      // 3. Update local states
      setShopName(editShopName.trim())
      setShopPhone(digitsOnly)
      setEditShopPhone(digitsOnly)
      setShopCategory(editShopCategory)
      setOwnerFullName(editOwnerFullName.trim())

      showToast('🎉 Store details saved successfully!')
    } catch (err: any) {
      console.error('[OwnerDashboard] Save store details error:', err)
      Alert.alert('Error', err?.message || 'Could not save store details')
    } finally {
      setIsSavingSettings(false)
    }
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
      const createdItem = {
        id: created.id,
        name: created.name,
        price: created.price,
        available: true,
        stockQuantity: 10,
        img: created.image_url || newItemImg,
        image: created.image_url || newItemImg,
        image_url: created.image_url || newItemImg
      }
      setMenuItems(prev => [createdItem, ...prev])
      setNewItemName('')
      setNewItemPrice('')
      setNewItemImg('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200')
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
  const instantDeliveryFeesTotal = validOrders
    .filter(o => o.delivery_mode === 'instant')
    .reduce((sum, o) => sum + (o.delivery_fee ?? config.delivery_fee.instant), 0)

  const scheduledOrdersCount = validOrders.filter(o => o.delivery_mode !== 'instant').length
  const scheduledDeliveryFeesTotal = validOrders
    .filter(o => o.delivery_mode !== 'instant')
    .reduce((sum, o) => sum + (o.delivery_fee ?? config.delivery_fee.scheduled), 0)

  const totalDeliveryFeesCollected = instantDeliveryFeesTotal + scheduledDeliveryFeesTotal
  const totalPlatformFeesToVaayu = validOrders.reduce((sum, o) => {
    const bill = getOrderBill(o)
    return sum + (bill.isFreePlatformFee || bill.platformFee === 0 ? 0 : bill.platformFee)
  }, 0)
  // Shop owners keep delivery fees; they only return the collected platform fee to Vaayu.
  const totalAmountOwedToVaayu = totalPlatformFeesToVaayu

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
        {isShopStatusLoading || isLiveToday === null ? (
          <View
            style={[
              tw`mt-3 w-full py-4 rounded-2xl flex-row items-center justify-center gap-2 shadow-md border-2 bg-gray-800 border-gray-700`
            ]}
          >
            <ActivityIndicator size="small" color="#ffffff" />
            <Text style={tw`text-white text-[15px] font-black tracking-wide text-center uppercase`}>
              Fetching Shop Live Status...
            </Text>
          </View>
        ) : isTogglingStoreLive ? (
          <View
            style={[
              tw`mt-3 w-full py-4 rounded-2xl flex-row items-center justify-center gap-2 shadow-md border-2 bg-gray-800 border-gray-700`
            ]}
          >
            <ActivityIndicator size="small" color="#ffffff" />
            <Text style={tw`text-white text-[15px] font-black tracking-wide text-center uppercase`}>
              Updating Store Status...
            </Text>
          </View>
        ) : (
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
        )}
      </View>

      <ScrollView contentContainerStyle={tw`p-4 pb-36`}>
        {/* ── 1. ORDERS TAB ────── */}
        {activeTab === 'orders' && (
          <View style={tw`gap-4`}>
            <View style={tw`flex-row items-center justify-between`}>
              <Text style={tw`text-[18px] font-black text-gray-900`}>{t.orders} ({orders.length})</Text>
              <TouchableOpacity
                onPress={() => fetchFreshOrders(true)}
                disabled={isSyncingOrders}
                style={tw`flex-row items-center gap-1.5 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full`}
              >
                {isSyncingOrders ? (
                  <ActivityIndicator size="small" color="#16a34a" />
                ) : (
                  <View style={tw`w-2 h-2 rounded-full bg-green-500`} />
                )}
                <Text style={tw`text-[11px] font-black text-green-800 uppercase`}>
                  {isSyncingOrders ? 'Syncing...' : 'Live Sync 🟢'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Campus Base Delivery Header (Persistent across all orders) */}
            <View style={tw`bg-gray-50 border border-gray-200 rounded-2xl p-3 flex-row items-center justify-between`}>
              <View style={tw`flex-row items-center gap-2 flex-1 mr-2`}>
                <Text style={tw`text-base`}>🏫</Text>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-[10px] font-bold text-gray-400 uppercase tracking-widest`}>Campus Delivery Zone</Text>
                  <Text style={tw`text-[12px] font-semibold text-gray-800`} numberOfLines={1}>
                    IIIT Tiruchirappalli, Sethurapatti, Trichy
                  </Text>
                </View>
              </View>
              <View style={tw`bg-gray-200 px-2.5 py-1 rounded-full`}>
                <Text style={tw`text-gray-700 text-[10px] font-bold uppercase`}>Hyperlocal</Text>
              </View>
            </View>

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
                const late = isOrderLate(order)
                const currentStep = order.status === 'delivered' ? 3 : order.status === 'ready_for_pickup' ? 2 : (order.status === 'out_for_delivery' || order.status === 'delivering' || order.status === 'preparing') ? 1 : 0

                // Customer Contact & Location data
                const prof = customerProfiles[order.user_id] || (order.user_id ? customerProfiles[order.user_id.toLowerCase()] : null)
                const customerName = order.customer_name || prof?.full_name || 'Campus Student'
                const customerPhone = order.customer_phone || prof?.phone_number || ''
                const compactLoc = getCompactLocation(order.location)

                return (
                  <View key={order.id} style={tw`bg-white rounded-3xl p-4 border border-gray-200 shadow-sm gap-3`}>
                    {/* Top Row: Order ID, Drop Point & Status Badge */}
                    <View style={tw`flex-row justify-between items-start border-b border-gray-100 pb-3`}>
                      <View style={tw`flex-1 mr-2`}>
                        <View style={tw`flex-row items-center gap-2 mb-1 flex-wrap`}>
                          <Text style={tw`text-[22px] font-black text-gray-900 leading-none`}>#{order.id}</Text>
                          <TouchableOpacity 
                            onPress={() => setSelectedOrderIdForDetails(order.id)}
                            activeOpacity={0.7}
                            style={tw`bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md`}
                          >
                            <Text style={tw`text-[10px] font-bold text-gray-600`}>Details ➔</Text>
                          </TouchableOpacity>
                        </View>

                        {/* Delivery Mode Type (Instant vs Scheduled Delivery) & Promo Badge */}
                        <View style={tw`flex-row items-center gap-1.5 mt-0.5 flex-wrap`}>
                          <TouchableOpacity 
                            onPress={() => setSelectedOrderIdForDetails(order.id)}
                            activeOpacity={0.7}
                          >
                            {order.delivery_mode === 'instant' ? (
                              <Text style={tw`text-[13px] font-bold text-gray-700`}>
                                ⚡ Instant Delivery
                              </Text>
                            ) : (
                              <Text style={tw`text-[13px] font-bold text-gray-700`}>
                                📅 Scheduled Delivery
                              </Text>
                            )}
                          </TouchableOpacity>

                          {order.applied_promo && (
                            <View style={tw`bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-md flex-row items-center gap-1`}>
                              <Text style={tw`text-[10px] font-black text-emerald-800 uppercase`}>
                                🏷️ {order.applied_promo} (-₹{order.promo_discount || 0})
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>

                      {/* Right: Status Badge */}
                      <View style={tw`items-end shrink-0`}>
                        {/* Status Badge */}
                        <View style={[tw`px-2.5 py-1 rounded-full shrink-0`, 
                          late ? tw`bg-red-500` :
                          order.status === 'incoming' || order.status === 'pending' || order.status === 'accepted' ? tw`bg-blue-100` :
                          order.status === 'out_for_delivery' || order.status === 'delivering' || order.status === 'preparing' ? tw`bg-orange-100` :
                          order.status === 'ready_for_pickup' ? tw`bg-purple-100` :
                          order.status === 'delivered' ? tw`bg-green-100` : tw`bg-red-100`
                        ]}>
                          <Text style={[tw`text-[10px] font-black uppercase text-center`,
                            late ? tw`text-white` :
                            order.status === 'incoming' || order.status === 'pending' || order.status === 'accepted' ? tw`text-blue-700` :
                            order.status === 'out_for_delivery' || order.status === 'delivering' || order.status === 'preparing' ? tw`text-orange-700` :
                            order.status === 'ready_for_pickup' ? tw`text-purple-700` :
                            order.status === 'delivered' ? tw`text-green-700` : tw`text-red-700`
                          ]}>
                            {late ? '⚠️ OVERDUE' :
                             order.status === 'incoming' ? '📥 NEW ORDER' :
                             order.status === 'accepted' ? '📥 ACCEPTED' :
                             order.status === 'out_for_delivery' || order.status === 'delivering' || order.status === 'preparing' ? '🛵 OUT FOR DELIVERY' :
                             order.status === 'ready_for_pickup' ? '📍 COLLECT ORDER' :
                             order.status === 'delivered' ? '✅ DELIVERED' : '❌ CANCELLED'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Customer Contact & Direct Dial Button */}
                    <View style={tw`bg-gray-50 border border-gray-200 rounded-2xl p-3 flex-row items-center justify-between shadow-xs`}>
                      <View style={tw`flex-1 mr-2`}>
                        <Text style={tw`text-[10px] font-bold text-gray-400 uppercase tracking-wider`}>Customer</Text>
                        <Text style={tw`text-[14px] font-bold text-gray-900 mt-0.5`} numberOfLines={1}>👤 {customerName}</Text>
                      </View>

                      {customerPhone ? (
                        <TouchableOpacity
                          onPress={() => Linking.openURL(`tel:${customerPhone}`)}
                          activeOpacity={0.8}
                          style={tw`flex-row items-center gap-2 bg-gray-900 px-3.5 py-2 rounded-xl shadow-sm`}
                        >
                          <Text style={tw`text-base`}>📞</Text>
                          <View>
                            <Text style={tw`text-[9px] font-bold text-gray-300 uppercase tracking-widest leading-tight`}>TAP TO CALL</Text>
                            <Text style={tw`text-[14px] font-black text-white leading-none tracking-wide`}>{customerPhone}</Text>
                          </View>
                        </TouchableOpacity>
                      ) : (
                        <View style={tw`bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200`}>
                          <Text style={tw`text-[11px] font-medium text-gray-400`}>📞 No Phone</Text>
                        </View>
                      )}
                    </View>

                    {/* Checkpoint Stepper Visualizer (Order Confirmed -> Out for Delivery -> Collect Order -> Delivered) */}
                    <View style={tw`bg-gray-50 rounded-2xl p-2.5 border border-gray-200`}>
                      <View style={tw`flex-row items-center justify-between mb-1.5`}>
                        <Text style={tw`text-[9px] font-bold uppercase tracking-widest text-gray-400`}>Order Checkpoint</Text>
                        <Text style={[tw`text-[10px] font-bold uppercase`, {
                          color: order.status === 'delivered' ? '#16a34a' : order.status === 'ready_for_pickup' ? '#9333ea' : (order.status === 'out_for_delivery' || order.status === 'delivering' || order.status === 'preparing') ? '#ea580c' : '#2563eb'
                        }]}>
                          {order.status === 'delivered' ? 'Delivered' : order.status === 'ready_for_pickup' ? 'Collect Order' : (order.status === 'out_for_delivery' || order.status === 'delivering' || order.status === 'preparing') ? 'Out for Delivery' : 'Order Confirmed'}
                        </Text>
                      </View>
                      <View style={tw`flex-row items-center`}>
                        {['Order Confirmed', 'Out for Delivery', 'Collect Order', 'Delivered'].map((step, i) => {
                          const done = i < currentStep
                          const active = i === currentStep
                          return (
                            <View key={step} style={tw`flex-1 items-center`}>
                              <View style={tw`flex-row items-center w-full`}>
                                {i > 0 && <View style={[tw`flex-1 h-0.5`, { backgroundColor: done || active ? '#8fda58' : '#e5e7eb' }]} />}
                                <View
                                  style={[
                                    tw`w-3.5 h-3.5 rounded-full items-center justify-center`,
                                    {
                                      backgroundColor: done ? '#8fda58' : active ? '#1a3a2a' : '#e5e7eb',
                                    }
                                  ]}
                                >
                                  {done && (
                                    <Svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                      <Polyline points="20 6 9 17 4 12"/>
                                    </Svg>
                                  )}
                                  {active && <View style={tw`w-1 h-1 rounded-full bg-[#8fda58]`} />}
                                </View>
                                {i < 3 && <View style={[tw`flex-1 h-0.5`, { backgroundColor: done ? '#8fda58' : '#e5e7eb' }]} />}
                              </View>
                              <Text style={[tw`text-[8px] font-medium mt-1 text-center`, { color: done || active ? '#1f2937' : '#9ca3af' }]}>{step}</Text>
                            </View>
                          )
                        })}
                      </View>
                    </View>

                    {/* Progress Timer — Shown ONLY for Instant Delivery while pending acceptance */}
                    {order.status === 'incoming' && order.delivery_mode === 'instant' && (
                      <View style={[tw`rounded-2xl p-2.5 border flex-col gap-1`, tw`${timer.bgClass} ${timer.borderClass}`]}>
                        <View style={tw`flex-row justify-between items-center`}>
                          <Text style={[tw`text-[12px] font-black`, tw`${timer.textClass}`]}>⏱️ {t.timeLeft} (15m Limit):</Text>
                          <Text style={[tw`text-[15px] font-black font-mono`, tw`${timer.textClass}`]}>{timer.timeStr}</Text>
                        </View>
                        <View style={tw`w-full h-2.5 bg-gray-200 rounded-full overflow-hidden`}>
                          <View style={[tw`h-full rounded-full`, tw`${timer.colorClass}`, { width: `${Math.max(5, Math.min(100, timer.ratio * 100))}%` }]} />
                        </View>
                      </View>
                    )}

                    {/* Expected Delivery Time or Slot Box */}
                    {order.delivery_mode === 'instant' ? (
                      <View style={tw`bg-gray-50 border border-gray-200 rounded-2xl p-3 flex-row items-center justify-between shadow-xs`}>
                        <View style={tw`flex-1 mr-2`}>
                          <Text style={tw`text-[10px] font-bold text-gray-400 uppercase tracking-widest`}>Expected Delivery Time</Text>
                          <Text style={tw`text-[13px] font-semibold text-gray-800 mt-0.5`}>
                            Deliver by {getExpectedDeliveryTime(order)} <Text style={tw`text-[11px] text-gray-500 font-normal`}>(within 20 mins)</Text>
                          </Text>
                        </View>
                        <View style={tw`bg-gray-200 px-2.5 py-1 rounded-xl`}>
                          <Text style={tw`text-gray-800 font-bold text-[11px]`}>By {getExpectedDeliveryTime(order)}</Text>
                        </View>
                      </View>
                    ) : (
                      <View style={tw`bg-gray-50 border border-gray-200 rounded-2xl p-3 flex-row items-center justify-between shadow-xs`}>
                        <View style={tw`flex-1 mr-2`}>
                          <Text style={tw`text-[10px] font-bold text-gray-400 uppercase tracking-widest`}>Scheduled Delivery Slot</Text>
                          <Text style={tw`text-[13px] font-semibold text-gray-800 mt-0.5`}>
                            {order.selected_slot_label || '12:40 PM – 1:40 PM'}
                          </Text>
                          <Text style={tw`text-[11px] text-gray-500 font-normal mt-0.5`}>Deliver to drop point during this scheduled slot window</Text>
                        </View>
                        <View style={tw`bg-gray-200 px-2.5 py-1 rounded-xl`}>
                          <Text style={tw`text-gray-800 font-bold text-[11px]`}>SLOT TIME</Text>
                        </View>
                      </View>
                    )}

                    {/* Items & Fees Breakdown */}
                    <View style={tw`bg-gray-50 rounded-2xl p-3 gap-2 border border-gray-200`}>
                      {order.is_partial && (
                        <View style={tw`bg-amber-100 border border-amber-300 rounded-xl px-2.5 py-1 flex-row items-center justify-between mb-1`}>
                          <Text style={tw`text-[11px] font-black text-amber-900 uppercase tracking-wide`}>⚠️ Partially Accepted</Text>
                          <Text style={tw`text-[10px] font-bold text-amber-800`}>Total Adjusted</Text>
                        </View>
                      )}

                      {Array.isArray(order.items) && order.items.map((it: any, idx: number) => {
                        const isUnavailable = it.is_unavailable || it.quantity === 0
                        const qty = it.quantity !== undefined ? it.quantity : (it.qty || 0)
                        return (
                          <View key={idx} style={[tw`flex-row justify-between items-center`, isUnavailable ? tw`opacity-50` : {}]}>
                            <View style={tw`flex-row items-center gap-1.5 flex-1 mr-2`}>
                              {isUnavailable && (
                                <View style={tw`bg-red-100 px-1 py-0.2 rounded`}>
                                  <Text style={tw`text-[9px] font-black text-red-700`}>OUT OF STOCK</Text>
                                </View>
                              )}
                              <Text style={[tw`text-[13px] font-medium text-gray-800`, isUnavailable ? tw`line-through text-gray-400` : {}]}>
                                {it.name} × {qty}
                                {it.original_quantity && it.original_quantity !== qty ? ` (ordered ${it.original_quantity})` : ''}
                              </Text>
                            </View>
                            <Text style={[tw`text-[13px] font-semibold text-gray-800`, isUnavailable ? tw`line-through text-gray-400` : {}]}>
                              ₹{isUnavailable ? 0 : (it.price || 0) * qty}
                            </Text>
                          </View>
                        )
                      })}

                      <View style={tw`border-t border-gray-200 pt-2 gap-1`}>
                        <View style={tw`flex-row justify-between items-center`}>
                          <Text style={tw`text-[12px] font-normal text-gray-500`}>{t.subtotal}</Text>
                          <Text style={tw`text-[12px] font-semibold text-gray-700`}>₹{bill.itemsSubtotal}</Text>
                        </View>

                        <View style={tw`flex-row justify-between items-center`}>
                          <Text style={tw`text-[12px] font-normal text-gray-500`}>
                            {t.deliveryFee} ({bill.isInstant ? 'Instant ₹10' : 'Scheduled ₹5'})
                          </Text>
                          <Text style={tw`text-[12px] font-semibold text-gray-700`}>+₹{bill.deliveryFee}</Text>
                        </View>

                        <View style={tw`flex-row justify-between items-center`}>
                          <Text style={tw`text-[12px] font-normal text-gray-500`}>{t.platformFee}</Text>
                          <Text style={[tw`text-[12px] font-semibold`, bill.isFreePlatformFee || bill.platformFee === 0 ? tw`text-green-600 font-bold` : tw`text-gray-700`]}>
                            {bill.isFreePlatformFee || bill.platformFee === 0 ? 'FREE (₹0)' : `+₹${bill.platformFee}`}
                          </Text>
                        </View>

                        {bill.promoDiscount > 0 && (
                          <View style={tw`flex-row justify-between items-center bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200`}>
                            <Text style={tw`text-[12px] font-bold text-emerald-800`}>
                              🏷️ Promo Discount {bill.appliedPromo ? `(${bill.appliedPromo})` : ''}
                            </Text>
                            <Text style={tw`text-[12px] font-black text-emerald-800`}>-₹{bill.promoDiscount}</Text>
                          </View>
                        )}

                        <View style={tw`border-t border-gray-300 pt-1.5 mt-0.5 flex-row justify-between items-center`}>
                          <Text style={tw`text-[13px] font-bold text-gray-900`}>{t.grandTotal}</Text>
                          <Text style={tw`text-[16px] font-black text-gray-900`}>₹{bill.grandTotal}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Action Buttons (Transitions through: Prepaid -> Out for Delivery -> Collect Order -> Delivered) */}
                    <View style={tw`gap-2 mt-0.5`}>
                      {order.status === 'incoming' && (
                        <>
                          <TouchableOpacity
                            onPress={() => handleUpdateStatus(order.id, 'accepted')}
                            style={tw`w-full py-3.5 bg-green-600 rounded-2xl items-center justify-center shadow-md active:scale-95 px-2`}
                          >
                            <Text style={tw`text-white font-black text-[12px] uppercase text-center tracking-tight`}>
                              {t.accept} (₹{bill.grandTotal})
                            </Text>
                          </TouchableOpacity>

                          {/* Accept Partial Order Option */}
                          <TouchableOpacity
                            onPress={() => openPartialOrderModal(order)}
                            style={tw`w-full py-3 bg-amber-50 border border-amber-300 rounded-2xl flex-row items-center justify-center gap-2 active:scale-95 px-2`}
                          >
                            <Text style={tw`text-amber-800 font-black text-[12px] uppercase text-center tracking-tight`}>
                              ✏️ Accept Partial Order
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => handleUpdateStatus(order.id, 'cancelled', 'Shop declined order')}
                            style={tw`w-full py-3 bg-red-100 rounded-2xl items-center justify-center active:scale-95 px-2`}
                          >
                            <Text style={tw`text-red-700 font-black text-[12px] uppercase text-center tracking-tight`}>
                              {t.decline}
                            </Text>
                          </TouchableOpacity>
                        </>
                      )}

                      {(order.status === 'accepted' || order.status === 'preparing') && (
                        <TouchableOpacity
                          onPress={() => handleUpdateStatus(order.id, 'out_for_delivery')}
                          style={tw`w-full py-3.5 bg-orange-500 rounded-2xl items-center justify-center shadow-md active:scale-95 px-2`}
                        >
                          <Text style={tw`text-white font-black text-[12px] uppercase text-center tracking-tight`}>
                            {t.markOutForDelivery}
                          </Text>
                        </TouchableOpacity>
                      )}

                      {(order.status === 'out_for_delivery' || order.status === 'delivering') && (
                        <TouchableOpacity
                          onPress={() => handleUpdateStatus(order.id, 'ready_for_pickup')}
                          style={tw`w-full py-3.5 bg-purple-600 rounded-2xl items-center justify-center shadow-md active:scale-95 px-2`}
                        >
                          <Text style={tw`text-white font-black text-[12px] uppercase text-center tracking-tight`}>
                            {t.markCollectOrder}
                          </Text>
                        </TouchableOpacity>
                      )}

                      {order.status === 'ready_for_pickup' && (
                        <TouchableOpacity
                          onPress={() => handleUpdateStatus(order.id, 'delivered')}
                          style={tw`w-full py-3.5 bg-green-700 rounded-2xl items-center justify-center shadow-md active:scale-95 px-2`}
                        >
                          <Text style={tw`text-white font-black text-[13px] uppercase text-center tracking-tight`}>
                            {t.markDelivered}
                          </Text>
                        </TouchableOpacity>
                      )}

                      {order.status === 'delivered' && (
                        <View style={tw`w-full py-3 bg-green-50 rounded-2xl items-center border border-green-200`}>
                          <Text style={tw`text-green-800 font-black text-[13px]`}>{t.completed}</Text>
                        </View>
                      )}

                      {order.status === 'cancelled' && (
                        <View style={tw`w-full py-3 bg-red-50 rounded-2xl items-center border border-red-200`}>
                          <Text style={tw`text-red-700 font-black text-[13px]`}>{t.rejected}</Text>
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
          <View style={tw`gap-3`}>
            {/* Store Banner */}
            <View style={tw`bg-white rounded-2xl p-4 border border-gray-200 gap-3`}>
              <View style={tw`flex-row justify-between items-center`}>
                <Text style={tw`text-[14px] font-black text-gray-900 uppercase tracking-wide`}>Store Banner</Text>
                <Text style={tw`text-[11px] font-bold text-gray-400 uppercase`}>Live on App</Text>
              </View>
              <View style={tw`w-full h-36 rounded-xl overflow-hidden bg-gray-100`}>
                <Image source={{ uri: shopBannerImg }} style={tw`w-full h-full`} resizeMode="cover" />
                {isUpdatingBanner && (
                  <View style={tw`absolute inset-0 bg-black/50 items-center justify-center`}>
                    <ActivityIndicator size="small" color="#ffffff" />
                  </View>
                )}
              </View>
              <TouchableOpacity
                onPress={() => { setImagePickerTarget('banner'); setShowImagePickerModal(true) }}
                disabled={isUpdatingBanner || !activeShopId}
                style={[tw`w-full h-11 bg-gray-900 rounded-xl items-center justify-center active:opacity-70`, (!activeShopId || isUpdatingBanner) && tw`opacity-40`]}
              >
                <Text style={tw`text-white font-bold text-[13px]`}>Change Banner Photo</Text>
              </TouchableOpacity>
            </View>

            {/* Add Item Form */}
            <View style={tw`bg-white rounded-2xl p-4 border border-gray-200 gap-3`}>
              <Text style={tw`text-[14px] font-black text-gray-900 uppercase tracking-wide`}>Add New Item</Text>

              {!activeShopId && (
                <View style={tw`flex-row items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200`}>
                  <ActivityIndicator size="small" color="#6b7280" />
                  <Text style={tw`text-[12px] font-medium text-gray-500 flex-1`}>Loading shop...</Text>
                </View>
              )}

              {/* Photo Area */}
              {newItemImg && !newItemImg.includes('unsplash') ? (
                <View style={tw`w-full rounded-xl overflow-hidden bg-gray-100 border border-gray-200 relative`}>
                  <Image source={{ uri: newItemImg }} style={tw`w-full h-36`} resizeMode="cover" />
                  <View style={tw`absolute bottom-2 left-2 right-2 flex-row gap-2`}>
                    <TouchableOpacity
                      onPress={() => { setImagePickerTarget('item'); setShowImagePickerModal(true) }}
                      disabled={isUploadingPhoto || !activeShopId}
                      style={tw`flex-1 bg-black/70 py-2 rounded-lg items-center justify-center active:opacity-70`}
                    >
                      <Text style={tw`text-white text-[12px] font-bold`}>Change Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => { setNewItemImg('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'); showToast('Photo removed') }}
                      style={tw`bg-black/70 px-3 py-2 rounded-lg items-center justify-center active:opacity-70`}
                    >
                      <Text style={tw`text-white text-[12px] font-bold`}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => { setImagePickerTarget('item'); setShowImagePickerModal(true) }}
                  disabled={isUploadingPhoto || !activeShopId}
                  style={[tw`w-full h-20 bg-gray-50 border border-dashed border-gray-300 rounded-xl items-center justify-center gap-1 active:opacity-70`, !activeShopId && tw`opacity-40`]}
                >
                  {isUploadingPhoto ? (
                    <View style={tw`items-center gap-1`}>
                      <ActivityIndicator size="small" color="#6b7280" />
                      <Text style={tw`text-gray-500 text-[11px] font-medium`}>Uploading...</Text>
                    </View>
                  ) : (
                    <>
                      <Text style={tw`text-gray-400 font-bold text-[13px]`}>Add Photo (optional)</Text>
                      <Text style={tw`text-gray-300 text-[11px]`}>Camera or Gallery</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              <TextInput
                placeholder={t.namePlaceholder}
                placeholderTextColor="#6b7280"
                value={newItemName}
                onChangeText={setNewItemName}
                editable={!!activeShopId}
                style={tw`bg-gray-50 border border-gray-200 rounded-xl px-4 h-12 text-[15px] font-medium text-gray-900`}
              />
              <TextInput
                placeholder={t.pricePlaceholder}
                placeholderTextColor="#6b7280"
                keyboardType="number-pad"
                value={newItemPrice}
                onChangeText={setNewItemPrice}
                editable={!!activeShopId}
                style={tw`bg-gray-50 border border-gray-200 rounded-xl px-4 h-12 text-[15px] font-medium text-gray-900`}
              />
              <TouchableOpacity
                onPress={handleAddItem}
                disabled={!activeShopId}
                style={[tw`w-full h-12 bg-gray-900 rounded-xl items-center justify-center active:opacity-70`, !activeShopId && tw`opacity-40`]}
              >
                <Text style={tw`text-white font-bold text-[14px]`}>Add to Menu</Text>
              </TouchableOpacity>
            </View>


            {/* Menu Items List */}
            <Text style={tw`text-[14px] font-black text-gray-900 uppercase tracking-wide`}>Menu Items ({menuItems.length})</Text>
            {loading ? (
              <View style={tw`py-10 items-center`}>
                <ActivityIndicator size="large" color="#374151" />
              </View>
            ) : menuItems.length === 0 ? (
              <View style={tw`bg-white rounded-2xl p-8 items-center border border-gray-200`}>
                <Text style={tw`text-[15px] font-bold text-gray-700`}>No items yet</Text>
                <Text style={tw`text-[12px] text-gray-400 mt-1`}>Use the form above to add your first menu item.</Text>
              </View>
            ) : (
              <View style={tw`gap-2`}>
                {menuItems.map(item => (
                  <View key={item.id} style={tw`bg-white rounded-2xl border border-gray-200 overflow-hidden`}>
                    <View style={tw`flex-row items-center gap-3 p-3`}>
                      <Image
                        source={{ uri: item.img || item.image || item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200' }}
                        style={tw`w-14 h-14 rounded-lg bg-gray-100`}
                        resizeMode="cover"
                      />
                      <View style={tw`flex-1 min-w-0`}>
                        <Text style={tw`text-[15px] font-bold text-gray-900`} numberOfLines={1}>{item.name}</Text>
                        <Text style={tw`text-[14px] font-bold text-gray-600 mt-0.5`}>Rs. {item.price}</Text>
                      </View>
                      <View style={tw`flex-row items-center gap-2`}>
                        <TouchableOpacity
                          onPress={() => handleToggleStock(item.id, item.available)}
                          style={[
                            tw`px-3 h-9 rounded-lg items-center justify-center border`,
                            item.available
                              ? tw`bg-gray-900 border-gray-900`
                              : tw`bg-white border-gray-300`
                          ]}
                        >
                          <Text style={[
                            tw`font-bold text-[11px] uppercase`,
                            item.available ? tw`text-white` : tw`text-gray-500`
                          ]}>
                            {item.available ? 'In Stock' : 'Sold Out'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteItem(item.id)}
                          style={tw`w-9 h-9 bg-gray-100 rounded-lg items-center justify-center active:opacity-70`}
                        >
                          <Text style={tw`text-gray-500 text-[13px] font-bold`}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={tw`flex-row justify-between items-center px-3 pb-3 gap-3`}>
                      <Text style={tw`text-[12px] font-medium text-gray-500`}>Qty:</Text>
                      <View style={tw`flex-row items-center gap-2`}>
                        <TouchableOpacity
                          onPress={() => handleUpdateStockQuantity(item.id, -1)}
                          style={tw`w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 items-center justify-center active:opacity-70`}
                        >
                          <Text style={tw`text-gray-700 font-bold text-base`}>−</Text>
                        </TouchableOpacity>
                        <TextInput
                          keyboardType="number-pad"
                          value={String(item.stockQuantity ?? 0)}
                          onChangeText={(text) => handleDirectStockQuantityChange(item.id, text)}
                          scrollEnabled={false}
                          multiline={false}
                          textAlign="center"
                          maxLength={4}
                          style={tw`w-12 h-8 bg-gray-50 border border-gray-200 rounded-lg text-center text-[14px] font-bold text-gray-900 p-0`}
                        />
                        <TouchableOpacity
                          onPress={() => handleUpdateStockQuantity(item.id, 1)}
                          style={tw`w-8 h-8 rounded-lg bg-gray-900 border border-gray-900 items-center justify-center active:opacity-70`}
                        >
                          <Text style={tw`text-white font-bold text-base`}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── 3. SETTINGS & VAAYU FINANCIAL BREAKDOWN VAULT ────── */}
        {activeTab === 'settings' && (
          <View style={tw`gap-3`}>
            {/* VAAYU FINANCIAL SETTLEMENT VAULT */}
            <View style={tw`bg-white rounded-3xl p-5 border-2 border-purple-300 gap-4 shadow-sm`}>
              <Text style={tw`text-[16px] font-black text-purple-900 uppercase`}>{t.financialSummary}</Text>
              
              <View style={tw`bg-purple-50 rounded-2xl p-4 border border-purple-200 gap-2.5`}>
                <View style={tw`flex-row justify-between items-center pb-2 border-b border-purple-200 flex-wrap gap-1`}>
                  <Text style={tw`text-[12px] font-bold text-purple-800 flex-1 min-w-[120px]`}>{t.instantDeliveryTag.replace('10', config.delivery_fee.instant.toString())}</Text>
                  <Text style={tw`text-[13px] font-black text-purple-900 text-right`}>₹{instantDeliveryFeesTotal}</Text>
                </View>

                <View style={tw`flex-row justify-between items-center pb-2 border-b border-purple-200 flex-wrap gap-1`}>
                  <Text style={tw`text-[12px] font-bold text-purple-800 flex-1 min-w-[120px]`}>{t.scheduledDeliveryTag.replace('5', config.delivery_fee.scheduled.toString())}</Text>
                  <Text style={tw`text-[13px] font-black text-purple-900 text-right`}>₹{scheduledDeliveryFeesTotal}</Text>
                </View>

                <View style={tw`flex-row justify-between items-center pb-2 border-b border-purple-200 flex-wrap gap-1`}>
                  <Text style={tw`text-[12px] font-bold text-purple-800 flex-1 min-w-[120px]`}>{t.platformFeeTag.replace('5', config.platform_fee.toString())}</Text>
                  <Text style={tw`text-[13px] font-black text-purple-900 text-right`}>₹{totalPlatformFeesToVaayu}</Text>
                </View>

                <View style={tw`bg-purple-200/60 rounded-xl p-3 mt-1`}>
                  <Text style={tw`text-[12px] font-black text-purple-900 uppercase`}>{t.totalOwedToVaayu}</Text>
                  <Text style={tw`text-[22px] font-black text-purple-950 mt-0.5`}>₹{totalAmountOwedToVaayu}</Text>
                  <Text style={tw`text-[11px] font-bold text-purple-800 mt-1 flex-wrap`}>
                    (Platform Fee Only, Shop Keeps Delivery Fee)
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

            {/* Monthly Platform Fees */}
            <View style={tw`bg-white rounded-2xl p-4 border border-gray-200 gap-3`}>
              <Text style={tw`text-[13px] font-black text-gray-900 uppercase tracking-wide`}>Monthly Platform Fees</Text>
              
              {platformFees.length === 0 ? (
                <Text style={tw`text-[12px] text-gray-500 font-medium`}>No monthly records found yet.</Text>
              ) : (
                <View style={tw`gap-2`}>
                  {platformFees.map((fee, idx) => (
                    <View key={fee.id || idx} style={tw`bg-gray-50 p-3 rounded-xl border border-gray-100 flex-row justify-between items-center`}>
                      <View>
                        <Text style={tw`text-[14px] font-black text-gray-900`}>{fee.month}</Text>
                        <Text style={tw`text-[11px] font-bold text-gray-500`}>{fee.order_count} Orders</Text>
                      </View>
                      <View style={tw`items-end`}>
                        <Text style={tw`text-[15px] font-black text-gray-900 mb-1`}>₹{fee.platform_fee_total}</Text>
                        {fee.paid ? (
                          <View style={tw`bg-green-100 px-2 py-0.5 rounded-full border border-green-200`}>
                            <Text style={tw`text-[10px] font-black text-green-700 uppercase`}>PAID</Text>
                          </View>
                        ) : (
                          <View style={tw`bg-red-100 px-2 py-0.5 rounded-full border border-red-200`}>
                            <Text style={tw`text-[10px] font-black text-red-700 uppercase`}>UNPAID</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Language */}
            <View style={tw`bg-white rounded-2xl p-4 border border-gray-200 gap-2`}>
              <Text style={tw`text-[13px] font-black text-gray-900 uppercase tracking-wide`}>Language</Text>
              <View style={tw`flex-row gap-2`}>
                {[
                  { code: 'en', name: 'English' },
                  { code: 'hi', name: 'हिन्दी' },
                  { code: 'ta', name: 'தமிழ்' },
                ].map(l => (
                  <TouchableOpacity
                    key={l.code}
                    onPress={() => { setLang(l.code as any); showToast(`Language: ${l.name}`) }}
                    style={[
                      tw`flex-1 h-10 rounded-xl border items-center justify-center`,
                      lang === l.code ? tw`bg-gray-900 border-gray-900` : tw`bg-white border-gray-200`
                    ]}
                  >
                    <Text style={[tw`text-[13px] font-bold`, lang === l.code ? tw`text-white` : tw`text-gray-700`]}>{l.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Danger Zone */}
            <View style={tw`bg-white rounded-2xl p-4 border border-gray-200 gap-2`}>
              <Text style={tw`text-[13px] font-black text-gray-900 uppercase tracking-wide`}>Danger Zone</Text>
              <Text style={tw`text-[12px] text-gray-500`}>Permanently delete your shop, menu items, and all data.</Text>
              <TouchableOpacity
                onPress={handleDeleteShop}
                style={tw`w-full h-11 bg-white border border-gray-300 rounded-xl items-center justify-center active:opacity-70 mt-1`}
              >
                <Text style={tw`text-gray-700 font-bold text-[13px]`}>Delete Store Permanently</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={onSignOut} style={tw`w-full h-11 bg-gray-100 rounded-xl items-center justify-center`}>
              <Text style={tw`text-gray-700 font-bold text-[14px]`}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'profile' && (
          <View style={tw`gap-3`}>
            <View style={tw`bg-white rounded-2xl border border-gray-200 overflow-hidden`}>
              {/* Header */}
              <View style={tw`items-center py-6 px-4 bg-gray-50 border-b border-gray-100 gap-1.5`}>
                <View style={tw`w-16 h-16 rounded-2xl bg-gray-900 items-center justify-center mb-1`}>
                  <Text style={tw`text-2xl font-black text-white`}>
                    {(editOwnerFullName || editShopName || 'S').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={tw`text-[17px] font-black text-gray-900`}>{shopName}</Text>
                <Text style={tw`text-[12px] text-gray-400 font-medium`}>{user?.email || ''}</Text>
                <View style={tw`flex-row gap-2 flex-wrap justify-center mt-0.5`}>
                  {shopPhone ? (
                    <Text style={tw`text-[11px] font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full`}>{shopPhone}</Text>
                  ) : null}
                  {shopCategory && shopCategory.length > 0 ? (
                    <Text style={tw`text-[11px] font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full`}>{shopCategory.join(', ')}</Text>
                  ) : null}
                </View>
              </View>

              {/* Form Fields */}
              <View style={tw`p-4 gap-3`}>
                <View style={tw`gap-1.5`}>
                  <Text style={tw`text-[11px] font-bold text-gray-400 uppercase tracking-wide`}>Store Name</Text>
                  <TextInput
                    value={editShopName}
                    onChangeText={setEditShopName}
                    placeholder="e.g. Campus Bites Cafe"
                    placeholderTextColor="#d1d5db"
                    style={tw`bg-gray-50 border border-gray-200 rounded-xl px-4 h-12 text-[15px] font-medium text-gray-900`}
                  />
                </View>

                <View style={tw`gap-1.5`}>
                  <Text style={tw`text-[11px] font-bold text-gray-400 uppercase tracking-wide`}>Owner Name</Text>
                  <TextInput
                    value={editOwnerFullName}
                    onChangeText={setEditOwnerFullName}
                    placeholder="e.g. Rajesh Kumar"
                    placeholderTextColor="#d1d5db"
                    style={tw`bg-gray-50 border border-gray-200 rounded-xl px-4 h-12 text-[15px] font-medium text-gray-900`}
                  />
                </View>

                <View style={tw`gap-1.5`}>
                  <View style={tw`flex-row justify-between items-center`}>
                    <Text style={tw`text-[11px] font-bold text-gray-400 uppercase tracking-wide`}>Phone Number</Text>
                    <Text style={[
                      tw`text-[11px] font-bold`,
                      editShopPhone.replace(/\D/g, '').length === 10 ? tw`text-gray-900` : tw`text-gray-300`
                    ]}>{editShopPhone.replace(/\D/g, '').length}/10</Text>
                  </View>
                  <TextInput
                    value={editShopPhone}
                    onChangeText={(text) => setEditShopPhone(text.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile number"
                    placeholderTextColor="#d1d5db"
                    keyboardType="number-pad"
                    maxLength={10}
                    style={tw`bg-gray-50 border border-gray-200 rounded-xl px-4 h-12 text-[15px] font-medium text-gray-900`}
                  />
                </View>

                <View style={tw`gap-1.5`}>
                  <Text style={tw`text-[11px] font-bold text-gray-400 uppercase tracking-wide`}>Category</Text>
                  <View style={tw`flex-row flex-wrap gap-2`}>
                    {['Food', 'Grocery', 'Pharmacy', 'Stationery', 'Others'].map((cat) => {
                      const isSelected = editShopCategory.some(c => c.toLowerCase() === cat.toLowerCase())
                      return (
                        <TouchableOpacity
                          key={cat}
                          onPress={() => {
                            triggerHaptic();
                            if (isSelected) {
                              if (editShopCategory.length > 1) {
                                setEditShopCategory(editShopCategory.filter(c => c.toLowerCase() !== cat.toLowerCase()))
                              } else {
                                showToast('You must select at least one category')
                              }
                            } else {
                              setEditShopCategory([...editShopCategory, cat])
                            }
                          }}
                          style={[
                            tw`px-3 h-9 rounded-lg border items-center justify-center active:opacity-70`,
                            isSelected ? tw`bg-gray-900 border-gray-900` : tw`bg-white border-gray-200`
                          ]}
                        >
                          <Text style={[tw`text-[12px] font-bold`, isSelected ? tw`text-white` : tw`text-gray-600`]}>{cat}</Text>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleSaveStoreDetails}
                  disabled={isSavingSettings || !activeShopId}
                  style={[
                    tw`w-full h-12 bg-gray-900 rounded-xl items-center justify-center flex-row gap-2 mt-1 active:opacity-70`,
                    (isSavingSettings || !activeShopId) && tw`opacity-40`
                  ]}
                >
                  {isSavingSettings ? (
                    <>
                      <ActivityIndicator size="small" color="#ffffff" />
                      <Text style={tw`text-white font-bold text-[14px]`}>Saving...</Text>
                    </>
                  ) : (
                    <Text style={tw`text-white font-bold text-[14px]`}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Sliding Bottom Nav Capsule */}
      <View style={tw`absolute bottom-4 left-4 right-4 z-40`}>
        <View style={[tw`rounded-[28px] p-1 border shadow-xl`, { backgroundColor: 'rgba(255, 255, 255, 0.96)', borderColor: 'rgba(255, 255, 255, 0.6)' }]}>
          <View style={tw`flex-row items-center justify-around py-1 px-1`}>
            {([
              { id: 'orders', label: t.orders, Icon: IconOrders },
              { id: 'menu', label: t.menu, Icon: IconMenu },
              { id: 'settings', label: t.settings, Icon: IconSettings },
              { id: 'profile', label: 'Profile', Icon: IconUser },
            ] as const).map(({ id, label, Icon }) => {
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
              {imagePickerTarget === 'banner' ? 'Select Store Banner Photo Source' : 'Select Product Photo Source'}
            </Text>

            <TouchableOpacity
              onPress={handleLaunchCamera}
              style={tw`w-full py-4 bg-green-600 rounded-2xl flex-row items-center justify-center gap-3 active:scale-95`}
            >
              <Text style={tw`text-xl`}>📷</Text>
              <Text style={tw`text-white font-black text-[16px]`}>
                {imagePickerTarget === 'banner' ? 'Take Banner Photo (Camera)' : 'Take Photo (Camera)'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLaunchGallery}
              style={tw`w-full py-4 bg-purple-700 rounded-2xl flex-row items-center justify-center gap-3 active:scale-95`}
            >
              <Text style={tw`text-xl`}>🖼️</Text>
              <Text style={tw`text-white font-black text-[16px]`}>
                {imagePickerTarget === 'banner' ? 'Choose Banner from Gallery' : 'Choose from Gallery'}
              </Text>
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

      {/* Partial Order Acceptance Modal */}
      <Modal
        visible={partialOrderModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => !isSubmittingPartial && setPartialOrderModalVisible(false)}
      >
        <View style={tw`flex-1 bg-black/60 justify-end`}>
          <View style={tw`bg-white rounded-t-3xl max-h-[88%] flex-col overflow-hidden`}>
            {/* Header */}
            <View style={tw`p-5 border-b border-gray-100 flex-row justify-between items-center bg-gray-50`}>
              <View style={tw`flex-1 mr-2`}>
                <View style={tw`flex-row items-center gap-2`}>
                  <Text style={tw`text-[18px] font-black text-gray-900`}>
                    Accept Partial Order
                  </Text>
                  <View style={tw`bg-amber-100 px-2 py-0.5 rounded-full`}>
                    <Text style={tw`text-amber-800 text-[10px] font-black`}>#{selectedOrderForPartial?.id}</Text>
                  </View>
                </View>
                <Text style={tw`text-[11px] text-gray-500 font-medium mt-0.5`}>
                  Adjust available item quantities. Total bill updates automatically.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => !isSubmittingPartial && setPartialOrderModalVisible(false)}
                style={tw`w-8 h-8 rounded-full bg-gray-200 items-center justify-center`}
              >
                <Text style={tw`text-gray-600 font-black text-sm`}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Scrollable Item List */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`p-5 gap-3`}>
              <Text style={tw`text-[11px] font-black uppercase tracking-widest text-gray-400`}>
                Ordered Items ({Array.isArray(selectedOrderForPartial?.items) ? selectedOrderForPartial.items.length : 0})
              </Text>

              {Array.isArray(selectedOrderForPartial?.items) && selectedOrderForPartial.items.map((it: any, idx: number) => {
                const idKey = it.id || it.name || `item_${idx}`
                const maxQty = it.original_quantity || it.quantity || it.qty || 1
                const currentQty = partialItemQuantities[idKey] !== undefined ? partialItemQuantities[idKey] : maxQty
                const isZero = currentQty === 0
                const isPartial = currentQty > 0 && currentQty < maxQty

                return (
                  <View
                    key={idKey}
                    style={[
                      tw`p-3.5 rounded-2xl border flex-row items-center justify-between`,
                      isZero
                        ? tw`bg-red-50/60 border-red-200`
                        : isPartial
                        ? tw`bg-amber-50/60 border-amber-200`
                        : tw`bg-gray-50 border-gray-200`
                    ]}
                  >
                    <View style={tw`flex-1 mr-3`}>
                      <View style={tw`flex-row items-center gap-1.5 flex-wrap mb-0.5`}>
                        <Text style={[tw`text-[14px] font-bold`, isZero ? tw`line-through text-gray-400` : tw`text-gray-900`]}>
                          {it.name}
                        </Text>
                        {isZero && (
                          <View style={tw`bg-red-100 px-1.5 py-0.5 rounded`}>
                            <Text style={tw`text-[9px] font-black text-red-700 uppercase`}>Out of stock</Text>
                          </View>
                        )}
                        {isPartial && (
                          <View style={tw`bg-amber-100 px-1.5 py-0.5 rounded`}>
                            <Text style={tw`text-[9px] font-black text-amber-800 uppercase`}>Partial ({currentQty}/{maxQty})</Text>
                          </View>
                        )}
                      </View>
                      <Text style={tw`text-[12px] font-semibold text-gray-500`}>
                        ₹{it.price || 0} each <Text style={tw`font-normal text-gray-400`}>· Ordered: {maxQty}</Text>
                      </Text>
                    </View>

                    {/* Quantity Stepper Controls */}
                    <View style={tw`flex-row items-center gap-2 bg-white px-2 py-1.5 rounded-xl border border-gray-200 shadow-2xs`}>
                      <TouchableOpacity
                        onPress={() => handlePartialItemQtyChange(idKey, -1, maxQty)}
                        style={tw`w-7 h-7 rounded-lg bg-gray-100 items-center justify-center active:bg-gray-200`}
                      >
                        <Text style={tw`text-gray-800 font-black text-base`}>-</Text>
                      </TouchableOpacity>

                      <Text style={[tw`text-[15px] font-black min-w-[20px] text-center`, isZero ? tw`text-red-600` : tw`text-gray-900`]}>
                        {currentQty}
                      </Text>

                      <TouchableOpacity
                        onPress={() => handlePartialItemQtyChange(idKey, 1, maxQty)}
                        disabled={currentQty >= maxQty}
                        style={[tw`w-7 h-7 rounded-lg items-center justify-center`, currentQty >= maxQty ? tw`bg-gray-50 opacity-40` : tw`bg-gray-100 active:bg-gray-200`]}
                      >
                        <Text style={tw`text-gray-800 font-black text-base`}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )
              })}

              {/* Note / Reason Presets */}
              <View style={tw`mt-2`}>
                <Text style={tw`text-[11px] font-black uppercase tracking-widest text-gray-400 mb-1.5`}>
                  Note for Customer
                </Text>
                <View style={tw`flex-row gap-1.5 flex-wrap mb-2`}>
                  {['Some items out of stock', 'Limited quantity available', 'Replaced with available items'].map(reason => (
                    <TouchableOpacity
                      key={reason}
                      onPress={() => setPartialReason(reason)}
                      style={[
                        tw`px-2.5 py-1 rounded-full border`,
                        partialReason === reason ? tw`bg-amber-100 border-amber-400` : tw`bg-gray-100 border-gray-200`
                      ]}
                    >
                      <Text style={[tw`text-[11px] font-bold`, partialReason === reason ? tw`text-amber-900` : tw`text-gray-600`]}>
                        {reason}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  value={partialReason}
                  onChangeText={setPartialReason}
                  placeholder="Optional custom note to customer..."
                  placeholderTextColor="#9ca3af"
                  style={tw`bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[12px] text-gray-800`}
                />
              </View>

              {/* Live Recalculated Bill Summary */}
              {(() => {
                const totals = calculatePartialTotals(selectedOrderForPartial, partialItemQuantities)
                return (
                  <View style={tw`bg-gray-900 rounded-2xl p-4 gap-1.5 mt-2`}>
                    <Text style={tw`text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1`}>
                      Live Updated Bill Summary
                    </Text>

                    <View style={tw`flex-row justify-between items-center`}>
                      <Text style={tw`text-[12px] text-gray-300`}>Updated Items Subtotal</Text>
                      <View style={tw`flex-row items-center gap-1.5`}>
                        {totals.isModified && selectedOrderForPartial?.items_subtotal && (
                          <Text style={tw`text-[12px] text-gray-500 line-through`}>₹{selectedOrderForPartial.items_subtotal}</Text>
                        )}
                        <Text style={tw`text-[13px] font-black text-white`}>₹{totals.newSubtotal}</Text>
                      </View>
                    </View>

                    <View style={tw`flex-row justify-between items-center`}>
                      <Text style={tw`text-[12px] text-gray-300`}>Delivery Fee</Text>
                      <Text style={tw`text-[12px] font-bold text-gray-300`}>+₹{totals.deliveryFee}</Text>
                    </View>

                    <View style={tw`flex-row justify-between items-center`}>
                      <Text style={tw`text-[12px] text-gray-300`}>Platform Fee</Text>
                      <Text style={tw`text-[12px] font-bold text-gray-300`}>+₹{totals.platformFee}</Text>
                    </View>

                    {totals.promoDiscount > 0 && (
                      <View style={tw`flex-row justify-between items-center bg-gray-800 px-2.5 py-1.5 rounded-xl border border-emerald-500/30`}>
                        <Text style={tw`text-[12px] font-bold text-emerald-400`}>
                          🏷️ Promo Discount {totals.appliedPromo ? `(${totals.appliedPromo})` : ''}
                        </Text>
                        <Text style={tw`text-[12px] font-black text-emerald-400`}>-₹{totals.promoDiscount}</Text>
                      </View>
                    )}

                    <View style={tw`border-t border-gray-700 pt-2 mt-1 flex-row justify-between items-center`}>
                      <Text style={tw`text-[14px] font-black text-white`}>New Total from Customer</Text>
                      <Text style={tw`text-[18px] font-black text-[#8fda58]`}>₹{totals.newGrandTotal}</Text>
                    </View>
                  </View>
                )
              })()}
            </ScrollView>

            {/* Bottom Confirm Button */}
            <View style={tw`p-5 border-t border-gray-100 bg-white gap-2`}>
              {(() => {
                const totals = calculatePartialTotals(selectedOrderForPartial, partialItemQuantities)
                return (
                  <TouchableOpacity
                    onPress={handleConfirmPartialOrder}
                    disabled={!totals.hasItems || isSubmittingPartial}
                    style={[
                      tw`w-full py-4 rounded-2xl items-center justify-center shadow-md`,
                      !totals.hasItems ? tw`bg-gray-300` : tw`bg-green-600 active:scale-98`
                    ]}
                  >
                    {isSubmittingPartial ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={tw`text-white font-black text-[15px] uppercase`}>
                        ✅ Accept Partial Order (₹{totals.newGrandTotal})
                      </Text>
                    )}
                  </TouchableOpacity>
                )
              })()}

              <TouchableOpacity
                onPress={() => !isSubmittingPartial && setPartialOrderModalVisible(false)}
                style={tw`w-full py-2.5 items-center justify-center`}
              >
                <Text style={tw`text-gray-500 font-bold text-[13px]`}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
