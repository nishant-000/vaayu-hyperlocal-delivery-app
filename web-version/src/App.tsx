import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SignupScreen from './screens/SignupScreen'
import OwnerDashboard from './screens/OwnerDashboard'
import ProfileScreen from './screens/ProfileScreen'

// ── Figma Icons (SVG Components) ─────────────────────────────────────────────

function IconMapPin() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  )
}

function IconChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  )
}

function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )
}

function IconScan() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
      <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
      <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
      <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
      <line x1="7" y1="12" x2="17" y2="12"/>
    </svg>
  )
}

function IconCart() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/>
      <circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  )
}

function IconBell() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}

function IconHome({ active }: { active: boolean }) {
  const c = active ? '#ffffff' : '#6b7280'
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? c : 'none'} stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}

function IconBag({ active }: { active: boolean }) {
  const c = active ? '#ffffff' : '#6b7280'
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? c : 'none'} stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  )
}

function IconNavCart({ active }: { active: boolean }) {
  const c = active ? '#ffffff' : '#6b7280'
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? c : 'none'} stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/>
      <circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  )
}

function IconUser({ active }: { active: boolean }) {
  const c = active ? '#ffffff' : '#6b7280'
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? c : 'none'} stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

function IconStar() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="#f59e0b" stroke="none">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  )
}

function IconArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  )
}

function IconClock() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}

function IconPercent() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="5" x2="5" y2="19"/>
      <circle cx="6.5" cy="6.5" r="2.5"/>
      <circle cx="17.5" cy="17.5" r="2.5"/>
    </svg>
  )
}

function IconArrowLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
    </svg>
  )
}

// ── Mock Database ─────────────────────────────────────────────────────────────

const categories = [
  {
    id: 1,
    name: "Food",
    title: "FOOD",
    sub: "CANTEENS & CAFES",
    badge: "",
    img: "/assets/categories/food.jpg",
    isLarge: true,
  },
  {
    id: 2,
    name: "Grocery",
    title: "GROCERY",
    sub: "DAILY ESSENTIALS",
    badge: "FRESH & FAST",
    img: "/assets/categories/grocery.jpg",
    isLarge: true,
  },
  {
    id: 3,
    name: "Pharmacy",
    title: "PHARMACY",
    sub: "MEDICINES & CARE",
    badge: "CAMPUS HEALTH",
    img: "/assets/categories/pharmacy.jpg",
    isLarge: false,
  },
  {
    id: 5,
    name: "Stationery",
    title: "STATIONERY",
    sub: "BOOKS & LABS",
    badge: "EXAM SPECIALS",
    img: "/assets/categories/stationery.jpg",
    isLarge: false,
  },
  {
    id: 6,
    name: "Others",
    title: "OTHERS",
    sub: "SERVICES & MORE",
    badge: "CAMPUS PICKUP",
    img: "/assets/categories/others.jpg",
    isLarge: false,
  },
]

const deals = [
  { id: 1, title: '50% off your first order', sub: 'Valid till midnight · Use CAMPUS50', color: '#16a34a', accent: '#bbf7d0', img: 'https://images.unsplash.com/photo-1499778003268-cbafc6d08bab?w=400&h=240&fit=crop&auto=format' },
  { id: 2, title: 'Free delivery on ₹99+', sub: 'All grocery orders today', color: '#ea580c', accent: '#fed7aa', img: 'https://images.unsplash.com/photo-1579113800032-c38bd7635818?w=400&h=240&fit=crop&auto=format' },
  { id: 3, title: 'Late night special', sub: 'Orders after 10 PM · 30% off', color: '#7c3aed', accent: '#ede9fe', img: 'https://images.unsplash.com/photo-1547754070-c73f90c116b5?w=400&h=240&fit=crop&auto=format' },
]

const popularShops = [
  {
    id: 1,
    name: "Campus Bites",
    tag: "Burgers · Fast Food",
    rating: 4.8,
    time: "18 min",
    discount: "20% off",
    img: "https://images.unsplash.com/photo-1667329829058-ac191ba4a905?w=400&h=300&fit=crop&auto=format",
    badge: "Top Rated",
    upiId: "campusbites@ybl",
    items: [
      { id: "cb_1", name: "Spicy Paneer Burger", desc: "Crispy paneer patty with spicy cream and lettuce.", price: 120, img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100" },
      { id: "cb_2", name: "Salted French Fries", desc: "Golden salted fries, crispy outside, soft inside.", price: 80, img: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=100" },
      { id: "cb_3", name: "Loaded Cheese Pizza", desc: "Double mozzarella cheese on fresh marinara crust.", price: 180, img: "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=100" }
    ]
  },
  {
    id: 2,
    name: "Green Leaf Grocery",
    tag: "Grocery · Essentials",
    rating: 4.6,
    time: "12 min",
    discount: "Free delivery",
    img: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop&auto=format",
    badge: "Campus Pick",
    upiId: "greenleaf@paytm",
    items: [
      { id: "gl_1", name: "Fresh Bananas (1 Dozen)", desc: "Ripe sweet yellow bananas, farm fresh.", price: 60, img: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=100" },
      { id: "gl_2", name: "Instant Noodles Pack", desc: "Classic masala noodles (Pack of 4).", price: 56, img: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=100" },
      { id: "gl_3", name: "Full Cream Milk (1L)", desc: "Fresh pasteurized full cream milk brick.", price: 66, img: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=100" }
    ]
  },
  {
    id: 3,
    name: "The Brew House",
    tag: "Coffee · Snacks",
    rating: 4.9,
    time: "10 min",
    discount: "₹30 off",
    img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop&auto=format",
    badge: "New",
    upiId: "brewhouse@oksbi",
    items: [
      { id: "bh_1", name: "Iced Caramel Macchiato", desc: "Fresh espresso with caramel drizzle and milk.", price: 140, img: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=100" },
      { id: "bh_2", name: "Choco Chip Muffin", desc: "Soft muffin baked fresh with rich dark chocolate chips.", price: 70, img: "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=100" }
    ]
  },
  {
    id: 4,
    name: "Pharma Plus",
    tag: "Medicines · Health",
    rating: 4.5,
    time: "22 min",
    discount: "15% off",
    img: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop&auto=format",
    badge: "",
    upiId: "pharmaplus@ybl",
    items: [
      { id: "pp_1", name: "Pain Relief Tablets", desc: "Aspirin 500mg strips (10 tablets).", price: 40, img: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=100" },
      { id: "pp_2", name: "Waterproof Bandages", desc: "Pack of 20 sterile minor wound band-aids.", price: 50, img: "https://images.unsplash.com/photo-1599839619722-397514112236?w=100" }
    ]
  },
]

const localShops = [
  {
    id: 5,
    name: "Aditya General Store",
    tag: "Snacks · Beverages · Essentials",
    rating: 4.7,
    time: "8 min",
    img: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=300&h=180&fit=crop&auto=format",
    upiId: "adityastore@ybl",
    items: [
      { id: "ag_1", name: "Potato Chips Spicy", desc: "Crunchy salted spicy potato chips.", price: 20, img: "https://images.unsplash.com/photo-1566478989037-eec170784d20?w=100" },
      { id: "ag_2", name: "Cold Soda Can (300ml)", desc: "Sweet carbonated cola can.", price: 40, img: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=100" }
    ]
  },
  {
    id: 6,
    name: "Sharma Stationery",
    tag: "Books · Pens · Art Supplies",
    rating: 4.4,
    time: "14 min",
    img: "https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=300&h=180&fit=crop&auto=format",
    upiId: "sharmastat@oksbi",
    items: [
      { id: "ss_1", name: "Spiral Notebook A4", desc: "160 pages ruled college spiral bound book.", price: 90, img: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=100" },
      { id: "ss_2", name: "Gel Pens Blue (Pack of 5)", desc: "Fine tip quick dry smudge proof ink pens.", price: 50, img: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=100" }
    ]
  },
  {
    id: 7,
    name: "Quick Laundry Co.",
    tag: "Wash · Dry · Iron",
    rating: 4.6,
    time: "1 hr",
    img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=180&fit=crop&auto=format",
    upiId: "quicklaundry@paytm",
    items: [
      { id: "ql_1", name: "Wash & Fold (Per kg)", desc: "Standard detergent washing and machine tumble drying.", price: 80, img: "https://images.unsplash.com/photo-1545173168-9f1947e8b94b?w=100" },
      { id: "ql_2", name: "Steam Ironing (Per piece)", desc: "Crease-free premium steam press service.", price: 15, img: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=100" }
    ]
  },
]

const allShopsList = [...popularShops, ...localShops]

const navItems = [
  { id: 'home', label: 'Home', Icon: IconHome },
  { id: 'orders', label: 'Orders', Icon: IconBag },
  { id: 'cart', label: 'Cart', Icon: IconNavCart },
  { id: 'profile', label: 'Profile', Icon: IconUser },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [savedShops, setSavedShops] = useState<Set<number>>(new Set([3]))
  const [selectedShop, setSelectedShop] = useState<any>(null)
  
  // User Profile
  const [user, setUser] = useState<any>(null)

  // Cart State
  const [cartItems, setCartItems] = useState<any[]>([])
  const [cartShop, setCartShop] = useState<any>(null)

  // Orders State
  const [orders, setOrders] = useState<any[]>([
    {
      id: "ord_108429",
      shopName: "Campus Bites",
      items: [{ name: "Spicy Paneer Burger", quantity: 2, price: 120 }],
      total: 240,
      status: "delivered",
      paymentMethod: "cod",
      createdAt: Date.now() - 3600000 * 24
    }
  ])

  // Profile Address State (Default: IIIT Tiruchirappalli Gate 1)
  const [address, setAddress] = useState({
    area: "IIIT Tiruchirappalli",
    room: "Gate 1",
    landmark: "Sethurapatti, Trichy"
  })

  // Notifications Drawer State
  const [showNotifications, setShowNotifications] = useState(false)

  // Toast / Alert State
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 2500)
  }

  const toggleSave = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setSavedShops(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    showToast("Shop save state toggled!")
  }

  // Cart operations
  const addToCart = (item: any, shop: any) => {
    if (cartShop && cartShop.id !== shop.id) {
      if (window.confirm(`Your cart has items from ${cartShop.name}. Discard and add from ${shop.name}?`)) {
        setCartItems([{ ...item, quantity: 1 }])
        setCartShop(shop)
        showToast("Cart replaced successfully")
      }
      return
    }

    setCartShop(shop)
    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { ...item, quantity: 1 }]
    })
    showToast(`${item.name} added to cart!`)
  }

  const changeQuantity = (itemId: string, diff: number) => {
    setCartItems(prev => {
      const updated = prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity + diff } : i)
      const filtered = updated.filter(i => i.quantity > 0)
      if (filtered.length === 0) {
        setCartShop(null)
      }
      return filtered
    })
  }

  const placeOrder = () => {
    const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
    const deliveryFee = subtotal >= 150 ? 0 : 15
    const total = subtotal + deliveryFee
    
    const newOrder = {
      id: `ord_${Math.floor(100000 + Math.random() * 900000)}`,
      shopName: cartShop.name,
      items: [...cartItems],
      total,
      status: "pending",
      paymentMethod: "cod",
      createdAt: Date.now()
    }

    setOrders(prev => [newOrder, ...prev])
    setCartItems([])
    setCartShop(null)
    setActiveTab('orders')
    showToast("Order placed successfully via Cash on Delivery!")
  }

  // Simulate active order progression
  useEffect(() => {
    const pendingOrders = orders.filter(o => o.status === 'pending')
    if (pendingOrders.length > 0) {
      const timer = setTimeout(() => {
        setOrders(prev => prev.map(o => o.status === 'pending' ? { ...o, status: 'preparing' } : o))
        showToast("Merchant is preparing your order!")
      }, 5000)
      return () => clearTimeout(timer)
    }

    const preparingOrders = orders.filter(o => o.status === 'preparing')
    if (preparingOrders.length > 0) {
      const timer = setTimeout(() => {
        setOrders(prev => prev.map(o => o.status === 'preparing' ? { ...o, status: 'out_for_delivery' } : o))
        showToast("Order is out for delivery!")
      }, 7000)
      return () => clearTimeout(timer)
    }
  }, [orders])

  const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const isFreeDelivery = subtotal >= 150
  const deliveryFee = subtotal === 0 || isFreeDelivery ? 0 : 10
  const platformFee = subtotal === 0 ? 0 : 5
  const cartTotal = subtotal + deliveryFee + platformFee

  if (!user) {
    return (
      <div
        className="min-h-screen bg-gray-50 font-sans antialiased text-gray-900 selection:bg-green-100 selection:text-green-800"
        style={{ fontFamily: "'Inter', sans-serif", maxWidth: 430, margin: '0 auto', position: 'relative' }}
      >
        <SignupScreen onDone={(userData) => { setUser(userData); showToast("Welcome to Vaayu!") }} />
      </div>
    )
  }

  if (user.role === 'owner' || user.role === 'shop_owner' || user.role === 'worker') {
    return (
      <div
        className="min-h-screen bg-gray-50 font-sans antialiased text-gray-900 selection:bg-green-100 selection:text-green-800"
        style={{ fontFamily: "'Inter', sans-serif", maxWidth: 430, margin: '0 auto', position: 'relative' }}
      >
        <OwnerDashboard user={user} onSignOut={() => setUser(null)} />
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-gray-50 font-sans antialiased text-gray-900 selection:bg-green-100 selection:text-green-800"
      style={{ fontFamily: "'Inter', sans-serif", maxWidth: 430, margin: '0 auto', position: 'relative' }}
    >
      {/* ── Framer Motion Toast Alert ── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -25, scale: 0.9, x: "-50%" }}
            animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
            exit={{ opacity: 0, y: -25, scale: 0.9, x: "-50%" }}
            transition={{ type: "spring", stiffness: 450, damping: 28 }}
            className="fixed top-6 left-1/2 z-50 bg-[#1a3a2a] text-white px-5 py-2.5 rounded-full text-xs font-semibold shadow-2xl border border-green-800/40 backdrop-blur-md flex items-center gap-2 whitespace-nowrap"
          >
            <span className="text-sm">✨</span>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Framer Motion Campus Notifications Drawer ── */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex flex-col justify-end"
            onClick={() => setShowNotifications(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-t-3xl p-6 pb-28 border-t border-gray-100 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔔</span>
                  <h3 className="text-[20px] font-black text-gray-900">Campus Notifications</h3>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold hover:bg-gray-200 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-start gap-3">
                  <span className="text-2xl">🎉</span>
                  <div className="flex-1">
                    <p className="text-[14px] font-black text-gray-900 mb-0.5">Welcome to IIIT Tiruchirappalli!</p>
                    <p className="text-[12px] text-gray-600 font-medium leading-relaxed">
                      Official campus delivery is live for Gate 1 & Hostels.
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold mt-1">Just now</p>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex items-start gap-3">
                  <span className="text-2xl">🍔</span>
                  <div className="flex-1">
                    <p className="text-[14px] font-black text-gray-900 mb-0.5">Campus Bites Special Offer</p>
                    <p className="text-[12px] text-gray-600 font-medium leading-relaxed">
                      Get 20% off on all burgers & sides today with code CAMPUS20.
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold mt-1">2 hours ago</p>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex items-start gap-3">
                  <span className="text-2xl">⚡</span>
                  <div className="flex-1">
                    <p className="text-[14px] font-black text-gray-900 mb-0.5">15-Min Delivery Guarantee</p>
                    <p className="text-[12px] text-gray-600 font-medium leading-relaxed">
                      Groceries & essentials now deliver to Gate 1 in under 15 mins.
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold mt-1">Yesterday</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowNotifications(false)
                  showToast("All notifications marked as read")
                }}
                className="w-full py-4 rounded-2xl text-[15px] font-black text-white bg-[#1a3a2a] hover:bg-black transition-colors mt-5 mb-6 shadow-sm cursor-pointer"
              >
                Mark All as Read
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Top Chrome Header ── */}
      {!selectedShop && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white sticky top-0 z-30 border-b border-gray-100/80 shadow-xs backdrop-blur-md bg-white/95"
        >
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <button className="flex items-center gap-1.5 group active:scale-95 transition-transform">
              <span className="text-green-600 mt-0.5">
                <IconMapPin />
              </span>
              <div className="text-left">
                <p className="text-[10px] text-gray-400 font-medium tracking-wide uppercase leading-none mb-0.5">Delivering to</p>
                <div className="flex items-center gap-1">
                  <span className="text-[14px] font-bold text-gray-900">{address.area}, {address.room}</span>
                  <span className="text-gray-400 group-hover:text-gray-600 transition-colors"><IconChevronDown /></span>
                </div>
              </div>
            </button>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowNotifications(true)}
                className="relative text-gray-600 hover:text-gray-900 transition-colors p-1"
              >
                <IconBell />
                <span className="absolute top-0 right-0 w-4 h-4 bg-green-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center shadow-xs">3</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setActiveTab('cart')}
                className="relative text-gray-600 hover:text-gray-900 transition-colors p-1"
              >
                <IconCart />
                <AnimatePresence>
                  {cartItems.length > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute top-0 right-0 w-4 h-4 bg-orange-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center shadow-xs"
                    >
                      {cartItems.reduce((s, i) => s + i.quantity, 0)}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>

          {/* Search bar */}
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2 bg-gray-100/80 focus-within:bg-white focus-within:ring-2 focus-within:ring-green-500/20 focus-within:border-green-500/30 border border-transparent rounded-2xl px-4 py-2.5 transition-all">
              <span className="text-gray-400">
                <IconSearch />
              </span>
              <input
                type="text"
                placeholder="Search for food, shops, or items..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-[14px] text-gray-700 placeholder-gray-400 outline-none font-medium"
              />
              <span className="text-gray-400 cursor-pointer hover:text-gray-600">
                <IconScan />
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Framer Motion Animated Page Transitions ── */}
      <AnimatePresence mode="wait">
        {selectedShop ? (
          /* ── Shop Details Screen ── */
          <motion.div
            key={`shop_${selectedShop.id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="bg-white pb-32 min-h-screen"
          >
            {/* Shop cover photo */}
            <div className="relative h-56 w-full overflow-hidden">
              <motion.img
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4 }}
                src={selectedShop.img}
                alt={selectedShop.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedShop(null)}
                className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors z-10"
              >
                <IconArrowLeft />
              </motion.button>
              
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <div className="flex items-center gap-2">
                  <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">OPEN</span>
                  <div className="flex items-center gap-0.5 text-yellow-400">
                    <IconStar />
                    <span className="text-[12px] font-bold text-white ml-0.5">{selectedShop.rating}</span>
                  </div>
                </div>
                <h2 className="text-2xl font-black mt-1 leading-tight">{selectedShop.name}</h2>
                <p className="text-[12px] text-white/80 mt-0.5 font-medium">{selectedShop.tag} · {selectedShop.time} delivery</p>
              </div>
            </div>

            {/* Menu items listing */}
            <div className="p-4">
              <h3 className="text-[17px] font-bold text-gray-900 mb-4">Menu Items</h3>
              <motion.div
                initial="hidden"
                animate="show"
                variants={{
                  hidden: { opacity: 0 },
                  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
                }}
                className="flex flex-col gap-4"
              >
                {selectedShop.items?.map((item: any) => {
                  const qty = cartItems.find(i => i.id === item.id)?.quantity || 0
                  return (
                    <motion.div
                      key={item.id}
                      variants={{
                        hidden: { opacity: 0, y: 15 },
                        show: { opacity: 1, y: 0 }
                      }}
                      className="flex justify-between items-center gap-3 py-3 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex-1">
                        <p className="font-bold text-[15px] text-gray-900">{item.name}</p>
                        <p className="text-[12px] text-gray-400 mt-1 leading-tight">{item.desc}</p>
                        <p className="text-[14px] font-bold text-green-600 mt-2">₹{item.price}</p>
                      </div>

                      <div className="flex flex-col items-center">
                        <motion.img
                          whileHover={{ scale: 1.05 }}
                          src={item.img || selectedShop.img}
                          alt={item.name}
                          className="w-16 h-16 rounded-xl object-cover shadow-xs"
                        />
                        
                        <AnimatePresence mode="wait">
                          {qty > 0 ? (
                            <motion.div
                              key="qty-counter"
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              className="flex items-center bg-[#1a3a2a] text-white text-xs font-bold rounded-lg px-2.5 py-1 mt-2 gap-3 shadow-sm"
                            >
                              <motion.button whileTap={{ scale: 0.8 }} onClick={() => changeQuantity(item.id, -1)} className="font-bold text-lg leading-none">-</motion.button>
                              <span>{qty}</span>
                              <motion.button whileTap={{ scale: 0.8 }} onClick={() => addToCart(item, selectedShop)} className="font-bold text-lg leading-none">+</motion.button>
                            </motion.div>
                          ) : (
                            <motion.button
                              key="add-btn"
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.92 }}
                              onClick={() => addToCart(item, selectedShop)}
                              className="bg-white border border-[#1a3a2a] text-[#1a3a2a] text-[11px] font-bold rounded-lg px-4 py-1.5 mt-2 hover:bg-green-50 transition-colors shadow-xs"
                            >
                              ADD
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            </div>

            {/* Floating Cart Indicator inside Shop Details */}
            <AnimatePresence>
              {cartItems.length > 0 && cartShop?.id === selectedShop.id && (
                <motion.div
                  initial={{ opacity: 0, y: 40, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 40, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="fixed bottom-24 inset-x-4 bg-[#1a3a2a] rounded-2xl p-4 flex justify-between items-center text-white shadow-xl z-30 border border-green-800/30"
                >
                  <div>
                    <p className="text-xs text-white/80 font-medium">{cartItems.reduce((s, i) => s + i.quantity, 0)} Items added</p>
                    <p className="text-sm font-bold mt-0.5">₹{subtotal} plus delivery</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setSelectedShop(null); setActiveTab('cart') }}
                    className="bg-green-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 hover:bg-green-600 transition-colors shadow-sm"
                  >
                    View Cart <IconArrowRight />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* ── Regular Tab view rendering ── */
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="pb-32 overflow-y-auto"
          >
            {activeTab === 'home' && (
              /* ── Home Page Content ── */
              <div>
                {/* Welcome area */}
                <div className="px-4 pt-5 pb-4">
                  <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 }}
                    className="text-[11px] font-semibold text-green-600 uppercase tracking-widest mb-2"
                  >
                    Good evening, {user?.name || user?.email?.split('@')[0] || 'Student'} 👋
                  </motion.p>
                  <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-[28px] font-black text-gray-900 leading-tight tracking-tight"
                  >
                    Everything you need,{' '}
                    <span className="text-green-500">delivered fast.</span>
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="text-[13px] text-gray-500 mt-2 font-medium"
                  >
                    From campus to your door in minutes.
                  </motion.p>
                </div>

                {/* Deal banners */}
                <div className="mb-5">
                  <div className="flex overflow-x-auto hide-scrollbar gap-3 px-4 snap-x snap-mandatory py-1">
                    {deals.map(deal => (
                      <motion.div
                        key={deal.id}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 350, damping: 22 }}
                        className="flex-none w-[85vw] max-w-[340px] rounded-3xl overflow-hidden relative snap-start shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        style={{ backgroundColor: deal.color, minHeight: 140 }}
                      >
                        <img
                          src={deal.img}
                          alt={deal.title}
                          className="absolute inset-0 w-full h-full object-cover opacity-20"
                        />
                        <div className="relative z-10 p-5 flex flex-col justify-between h-full" style={{ minHeight: 140 }}>
                          <div
                            className="self-start text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs"
                            style={{ backgroundColor: deal.accent, color: deal.color }}
                          >
                            LIMITED OFFER
                          </div>
                          <div className="mt-6">
                            <p className="text-white font-black text-[20px] leading-tight">{deal.title}</p>
                            <p className="text-white/80 text-[12px] font-medium mt-1">{deal.sub}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Categories Grid (Custom Layout: Food & Grocery on Left, Pharma & Stationery on Right of Food) */}
                <div className="px-4 mb-6">
                  <div className="flex items-center justify-between mb-3.5">
                    <h2 className="text-[18px] font-black text-gray-900 tracking-tight">Browse by Category</h2>
                    {selectedCategory && (
                      <button onClick={() => setSelectedCategory(null)} className="text-[13px] font-bold text-green-600">
                        Show All
                      </button>
                    )}
                  </div>

                  {/* Row 1: Food on Left (Large), Pharmacy & Stationery on Right (Small Tabs) */}
                  <div className="flex gap-3 mb-3">
                    {/* Left: Food (Large Featured Card) */}
                    {(() => {
                      const food = categories.find(c => c.name === 'Food')!
                      const isSelected = selectedCategory === food.id
                      return (
                        <motion.button
                          key={food.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setSelectedCategory(isSelected ? null : food.id)}
                          className={`flex-1 relative bg-white rounded-3xl p-4 flex flex-col justify-between border text-left overflow-hidden transition-all h-[155px] ${
                            isSelected ? 'border-green-500 border-2' : 'border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <div className="z-10">
                            <p className="text-[16px] font-black text-gray-900 tracking-tight leading-tight mb-0.5">{food.title}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{food.sub}</p>
                            {food.badge && (
                              <span className="inline-block bg-orange-50 text-orange-600 text-[10px] font-black px-2 py-0.5 rounded-full border border-orange-100">
                                {food.badge}
                              </span>
                            )}
                          </div>
                          <img
                            src={food.img}
                            alt={food.title}
                            className="w-22 h-22 absolute bottom-1 right-1 object-contain pointer-events-none rounded-2xl"
                          />
                        </motion.button>
                      )
                    })()}

                    {/* Right: Stack of 2 Small Tabs (Pharmacy & Stationery) on Side of Food */}
                    <div className="w-[44%] flex flex-col gap-2.5">
                      {['Pharmacy', 'Stationery'].map(catName => {
                        const cat = categories.find(c => c.name === catName)!
                        const isSelected = selectedCategory === cat.id
                        return (
                          <motion.button
                            key={cat.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                            className={`flex-1 bg-white rounded-2xl p-2.5 flex items-center justify-between border text-left relative overflow-hidden transition-all ${
                              isSelected ? 'border-green-500 border-2' : 'border-gray-100 hover:border-gray-200'
                            }`}
                          >
                            <div className="z-10 flex-1 pr-1">
                              <p className="text-[12px] font-black text-gray-900 tracking-tight truncate">{cat.title}</p>
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-0.5 truncate">{cat.sub}</p>
                            </div>
                            <img
                              src={cat.img}
                              alt={cat.title}
                              className="w-10 h-10 object-contain rounded-lg flex-none"
                            />
                          </motion.button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Row 2: Grocery on Left (Large), Others on Right */}
                  <div className="flex gap-3">
                    {/* Left: Grocery (Featured Card) */}
                    {(() => {
                      const grocery = categories.find(c => c.name === 'Grocery')!
                      const isSelected = selectedCategory === grocery.id
                      return (
                        <motion.button
                          key={grocery.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setSelectedCategory(isSelected ? null : grocery.id)}
                          className={`flex-1 relative bg-white rounded-3xl p-4 flex flex-col justify-between border text-left overflow-hidden transition-all h-[110px] ${
                            isSelected ? 'border-green-500 border-2' : 'border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <div className="z-10">
                            <p className="text-[15px] font-black text-gray-900 tracking-tight leading-tight mb-0.5">{grocery.title}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{grocery.sub}</p>
                            {grocery.badge && (
                              <span className="inline-block bg-green-50 text-green-700 text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-green-100">
                                {grocery.badge}
                              </span>
                            )}
                          </div>
                          <img
                            src={grocery.img}
                            alt={grocery.title}
                            className="w-18 h-18 absolute bottom-1 right-1 object-contain pointer-events-none rounded-xl"
                          />
                        </motion.button>
                      )
                    })()}

                    {/* Right: Others (Small Tab) */}
                    {(() => {
                      const others = categories.find(c => c.name === 'Others')!
                      const isSelected = selectedCategory === others.id
                      return (
                        <motion.button
                          key={others.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setSelectedCategory(isSelected ? null : others.id)}
                          className={`w-[44%] relative bg-white rounded-3xl p-3.5 flex flex-col justify-between border text-left overflow-hidden transition-all h-[110px] ${
                            isSelected ? 'border-green-500 border-2' : 'border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <div className="z-10">
                            <p className="text-[13px] font-black text-gray-900 tracking-tight leading-tight mb-0.5">{others.title}</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{others.sub}</p>
                          </div>
                          <img
                            src={others.img}
                            alt={others.title}
                            className="w-14 h-14 absolute bottom-1 right-1 object-contain pointer-events-none rounded-xl"
                          />
                        </motion.button>
                      )
                    })()}
                  </div>
                </div>

                {/* Popular near you */}
                <div className="mb-6">
                  <div className="flex items-center justify-between px-4 mb-3">
                    <h2 className="text-[17px] font-bold text-gray-900">Popular near you</h2>
                  </div>
                  <div className="flex overflow-x-auto hide-scrollbar gap-3 px-4 snap-x py-1">
                    {popularShops.map(shop => (
                      <motion.div
                        key={shop.id}
                        whileHover={{ y: -4, scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 350, damping: 22 }}
                        onClick={() => setSelectedShop(shop)}
                        className="flex-none w-56 bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow snap-start cursor-pointer border border-gray-100"
                      >
                        <div className="relative h-36 overflow-hidden">
                          <img
                            src={shop.img}
                            alt={shop.name}
                            className="w-full h-full object-cover"
                          />
                          {shop.badge && (
                            <div className="absolute top-2.5 left-2.5 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                              {shop.badge}
                            </div>
                          )}
                          <motion.button
                            whileTap={{ scale: 1.4, rotate: 15 }}
                            onClick={(e) => toggleSave(shop.id, e)}
                            className="absolute top-2.5 right-2.5 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-xs hover:bg-white transition-colors"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill={savedShops.has(shop.id) ? '#16a34a' : 'none'} stroke={savedShops.has(shop.id) ? '#16a34a' : '#6b7280'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                            </svg>
                          </motion.button>
                          <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-black/40 to-transparent" />
                          <div className="absolute bottom-2 left-2.5 flex items-center gap-1 bg-orange-500/90 px-1.5 py-0.5 rounded-full">
                            <IconPercent />
                            <span className="text-white text-[10px] font-bold">{shop.discount}</span>
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="font-bold text-[14px] text-gray-900 truncate">{shop.name}</p>
                          <p className="text-[11px] text-gray-500 font-medium truncate mt-0.5">{shop.tag}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-0.5">
                              <IconStar />
                              <span className="text-[12px] font-bold text-gray-800">{shop.rating}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Local partner shops */}
                <div className="px-4 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-[17px] font-bold text-gray-900">Local partner shops</h2>
                  </div>
                  <div className="flex flex-col gap-3">
                    {localShops.map(shop => (
                      <motion.div
                        key={shop.id}
                        whileHover={{ y: -2, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 350, damping: 22 }}
                        onClick={() => setSelectedShop(shop)}
                        className="bg-white rounded-2xl overflow-hidden shadow-xs flex cursor-pointer hover:shadow-md transition-shadow border border-gray-100"
                      >
                        <div className="w-24 h-20 flex-none overflow-hidden">
                          <img
                            src={shop.img}
                            alt={shop.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 p-3 flex flex-col justify-between">
                          <div>
                            <p className="font-bold text-[14px] text-gray-900">{shop.name}</p>
                            <p className="text-[11px] text-gray-500 font-medium mt-0.5">{shop.tag}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-0.5">
                              <IconStar />
                              <span className="text-[12px] font-bold text-gray-800">{shop.rating}</span>
                            </div>
                            <span className="ml-auto text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Partner</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Campus info strip */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="mx-4 mb-6 bg-green-50/80 border border-green-100 rounded-2xl p-4 flex items-start gap-3 shadow-xs"
                >
                  <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center flex-none text-xl shadow-xs">🎓</div>
                  <div>
                    <p className="text-[13px] font-bold text-green-900">Campus verified shops only</p>
                    <p className="text-[11px] text-green-700 font-medium mt-0.5 leading-snug">All our partner stores are verified local businesses trusted by students.</p>
                  </div>
                </motion.div>
              </div>
            )}

            {activeTab === 'orders' && (
              /* ── Orders Tracking & History Screen ── */
              <div className="p-4">
                <h2 className="text-2xl font-black text-gray-900 mb-4">Your Orders</h2>
                
                <div className="flex flex-col gap-4">
                  {orders.map((ord) => (
                    <motion.div
                      key={ord.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-[16px] text-gray-900">{ord.shopName}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">ID: {ord.id}</p>
                        </div>
                        
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase shadow-xs ${
                          ord.status === 'pending' ? 'bg-orange-50 text-orange-600' :
                          ord.status === 'preparing' ? 'bg-blue-50 text-blue-600' :
                          ord.status === 'out_for_delivery' ? 'bg-purple-50 text-purple-600' :
                          'bg-green-50 text-green-600'
                        }`}>
                          {ord.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {/* Progression dots if active */}
                      {!['delivered', 'cancelled'].includes(ord.status) && (
                        <div className="flex items-center gap-2 mt-4 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                          </span>
                          <span className="text-[11px] font-bold text-gray-600">
                            {ord.status === 'pending' && 'Placed - Awaiting acceptance'}
                            {ord.status === 'preparing' && 'Preparing items...'}
                            {ord.status === 'out_for_delivery' && 'On the way to your room!'}
                          </span>
                        </div>
                      )}

                      <div className="mt-3 border-t border-gray-50 pt-3">
                        {ord.items.map((it: any, idx: number) => (
                          <p key={idx} className="text-xs text-gray-600">{it.quantity}x {it.name}</p>
                        ))}
                        <p className="text-sm font-bold mt-2">Total Bill: ₹{ord.total}</p>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          setCartItems(ord.items.map((i: any) => ({ ...i, id: `item_${Date.now()}` })))
                          setCartShop(allShopsList.find(s => s.name === ord.shopName) || popularShops[0])
                          setActiveTab('cart')
                          showToast("Items added back to cart!")
                        }}
                        className="mt-3 w-full border border-green-600 text-green-600 text-xs font-bold py-2 rounded-xl text-center hover:bg-green-50 transition-colors shadow-xs"
                      >
                        Reorder Items
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'cart' && (
              /* ── Cart & Checkout Screen ── */
              <div className="p-4">
                <h2 className="text-2xl font-black text-gray-900 mb-4">Your Cart</h2>
                
                {cartItems.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-16"
                  >
                    <span className="text-5xl inline-block">🛒</span>
                    <p className="font-bold text-gray-800 mt-4 text-base">Your cart is empty</p>
                    <p className="text-xs text-gray-400 mt-1">Select products from shops on home tab</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveTab('home')}
                      className="mt-6 bg-[#1a3a2a] text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md"
                    >
                      Go Shopping
                    </motion.button>
                  </motion.div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {/* Cart items with AnimatePresence */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                      <p className="font-bold text-gray-900 text-xs mb-3 uppercase tracking-wider">Items from {cartShop?.name}</p>
                      <AnimatePresence>
                        {cartItems.map((item) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0, x: -50 }}
                            transition={{ duration: 0.2 }}
                            className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-b-0 overflow-hidden"
                          >
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                              <p className="text-[11px] text-gray-400">₹{item.price} each</p>
                            </div>
                            <div className="flex items-center bg-[#1a3a2a] text-white text-xs font-bold rounded-lg px-2 py-0.5 gap-3 shadow-xs">
                              <motion.button whileTap={{ scale: 0.8 }} onClick={() => changeQuantity(item.id, -1)} className="font-bold text-base">-</motion.button>
                              <span>{item.quantity}</span>
                              <motion.button whileTap={{ scale: 0.8 }} onClick={() => changeQuantity(item.id, 1)} className="font-bold text-base">+</motion.button>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>

                    {/* Delivery Address */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                      <p className="font-bold text-gray-900 text-xs mb-3 uppercase tracking-wider">Hostel Delivery Details</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Hostel / Area</label>
                          <input
                            type="text"
                            value={address.area}
                            onChange={e => setAddress(prev => ({ ...prev, area: e.target.value }))}
                            className="w-full bg-gray-50 border border-gray-100 rounded-lg p-2 text-xs font-medium outline-none mt-1 focus:bg-white focus:ring-1 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Room / House</label>
                          <input
                            type="text"
                            value={address.room}
                            onChange={e => setAddress(prev => ({ ...prev, room: e.target.value }))}
                            className="w-full bg-gray-50 border border-gray-100 rounded-lg p-2 text-xs font-medium outline-none mt-1 focus:bg-white focus:ring-1 focus:ring-green-500"
                          />
                        </div>
                      </div>
                      <div className="mt-3">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Landmark / Notes</label>
                        <input
                          type="text"
                          value={address.landmark}
                          onChange={e => setAddress(prev => ({ ...prev, landmark: e.target.value }))}
                          className="w-full bg-gray-50 border border-gray-100 rounded-lg p-2 text-xs font-medium outline-none mt-1 focus:bg-white focus:ring-1 focus:ring-green-500"
                        />
                      </div>
                    </div>

                    {/* Payment Mode Banner */}
                    <div className="bg-[#f0fdf4] border border-[#dcfce7] rounded-2xl p-4 flex gap-3 shadow-xs">
                      <span className="text-xl">💵</span>
                      <div>
                        <p className="text-[13px] font-bold text-green-950">Cash / UPI on Delivery Only</p>
                        <p className="text-[11px] text-green-700 font-medium leading-relaxed mt-0.5">Pay the deliverer staff directly in cash or scan their UPI QR when the order reaches your room.</p>
                      </div>
                    </div>

                    {/* Pricing Breakdown */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                      <div className="flex justify-between text-xs text-gray-500 py-1">
                        <span>Item Subtotal</span>
                        <span>₹{subtotal}</span>
                      </div>
                      <div className="flex justify-between text-xs py-1">
                        <span className="text-gray-500">Delivery Fee</span>
                        <span className={isFreeDelivery ? "font-black text-green-600" : "text-gray-600"}>
                          {isFreeDelivery ? "🎉 FREE" : `₹${deliveryFee}`}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-purple-700 py-1 font-medium">
                        <span>Platform Fee (Vaayu)</span>
                        <span className="font-bold">₹{platformFee}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-gray-900 border-t border-gray-50 pt-2.5 mt-2">
                        <span>Total Bill</span>
                        <span>₹{cartTotal}</span>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={placeOrder}
                      className="w-full bg-[#1a3a2a] text-white font-bold py-3.5 rounded-2xl text-center shadow-lg hover:bg-black transition-colors"
                    >
                      Place Order (COD)
                    </motion.button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <ProfileScreen user={user} onSignOut={() => {
                setUser(null)
                setCartItems([])
                setCartShop(null)
              }} />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Framer Motion Sliding Bottom Nav Capsule ── */}
      <div className="fixed bottom-7 left-1/2 -translate-x-1/2 z-40" style={{ width: 'calc(100% - 32px)', maxWidth: 390 }}>
        <div className="bg-white/95 backdrop-blur-md rounded-[28px] shadow-[0_8px_32px_rgba(0,0,0,0.14)] border border-white/60 p-1">
          <div className="flex items-center justify-around relative px-2 py-1.5">
            {navItems.map(({ id, label, Icon }) => {
              const isActive = activeTab === id && !selectedShop
              return (
                <motion.button
                  key={id}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => { setSelectedShop(null); setActiveTab(id) }}
                  className="relative flex items-center gap-1.5 py-2 px-3.5 rounded-full overflow-hidden transition-colors cursor-pointer select-none"
                  style={{
                    backgroundColor: isActive ? '#1a3a2a' : 'transparent',
                    color: isActive ? '#ffffff' : '#6b7280'
                  }}
                >
                  {/* Sliding layout background indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabPill"
                      transition={{ type: "spring", stiffness: 450, damping: 30 }}
                      className="absolute inset-0 bg-[#1a3a2a] rounded-full z-0"
                    />
                  )}
                  <span className="relative z-10 flex items-center">
                    <Icon active={isActive} />
                  </span>
                  <AnimatePresence initial={false}>
                    {isActive && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                        className="relative z-10 text-[13px] font-bold text-white whitespace-nowrap overflow-hidden"
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
