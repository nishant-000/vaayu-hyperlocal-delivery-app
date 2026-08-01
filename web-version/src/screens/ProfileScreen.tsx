import { useState } from 'react'

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1624918479892-3e5df2910410?w=200&h=200&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&auto=format',
]

const stats = [
  { label: 'Orders', value: '24' },
  { label: 'Saved', value: '8' },
  { label: 'Reviews', value: '12' },
]

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  )
}

function BackHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center bg-white border-b border-gray-100 px-4 pt-6 pb-4">
      <button onClick={onBack} className="p-2 -ml-2 rounded-full bg-gray-100 mr-3 text-gray-700 hover:bg-gray-200 transition-colors">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
      </button>
      <h2 className="text-[20px] font-black text-gray-900">{title}</h2>
    </div>
  )
}

export default function ProfileScreen({ user, onSignOut }: { user: any; onSignOut: () => void }) {
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState(AVATAR_OPTIONS[0])
  const [showPhotoPicker, setShowPhotoPicker] = useState(false)

  // Edit profile state initialized directly from logged in user data without fake hardcoded fallbacks
  const [name, setName] = useState(user?.name || '')
  const [email] = useState(user?.email || '')
  const [phone, setPhone] = useState(user?.phone_number || '')
  const [hostel] = useState('IIIT Tiruchirappalli, Gate 1')

  // Security state
  const [currentPass, setCurrentPass] = useState('')
  const [newPass, setNewPass] = useState('')

  // Rating state
  const [rating, setRating] = useState(5)
  const [feedback, setFeedback] = useState('')

  // Toast alert
  const [toast, setToast] = useState<string | null>(null)
  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  // ── SUB-SCREENS ─────────────────────────────────────────────────────────────

  // 1. Edit Profile Screen
  if (activeModal === 'Edit profile') {
    return (
      <div className="flex flex-col min-h-full bg-gray-50">
        <BackHeader title="Edit Profile" onBack={() => setActiveModal(null)} />
        <div className="flex-1 p-4 pb-20 overflow-y-auto hide-scrollbar">
          <div className="flex flex-col items-center my-4">
            <button onClick={() => setShowPhotoPicker(true)} className="relative group cursor-pointer">
              <img src={avatarUrl} alt="Avatar" className="w-24 h-24 rounded-3xl mb-3 object-cover shadow-xs group-hover:opacity-90 transition-opacity" />
              <div className="absolute bottom-2 right-0 w-7 h-7 rounded-full bg-green-500 flex items-center justify-center border-2 border-white shadow text-white">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </div>
            </button>
            <button onClick={() => setShowPhotoPicker(true)} className="bg-green-50 px-4 py-2 rounded-full border border-green-200 text-[12px] font-bold text-green-700 hover:bg-green-100 transition-colors cursor-pointer">
              Change Photo
            </button>

            {/* Avatar Selector Drawer */}
            {showPhotoPicker && (
              <div className="w-full bg-white rounded-2xl p-4 mt-4 border border-green-100 shadow-xs flex flex-col items-center">
                <p className="text-[12px] font-bold text-gray-700 mb-3">Choose an Avatar</p>
                <div className="flex gap-3">
                  {AVATAR_OPTIONS.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setAvatarUrl(img)
                        setShowPhotoPicker(false)
                        showToast("Profile photo updated!")
                      }}
                      className={`rounded-2xl border-2 transition-transform hover:scale-105 cursor-pointer overflow-hidden ${avatarUrl === img ? 'border-green-500' : 'border-gray-100'}`}
                    >
                      <img src={img} alt="Option" className="w-12 h-12 object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl p-5 flex flex-col gap-4 shadow-xs mb-6">
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-[14px] font-medium text-gray-800 outline-none focus:border-green-500" />
            </div>

            {/* Read-Only College Email */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">College Email</label>
                <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] font-bold text-gray-500 flex items-center gap-1">🔒 Locked Domain</span>
              </div>
              <div className="bg-gray-100 border border-gray-200 rounded-2xl px-4 py-3 opacity-80 cursor-not-allowed">
                <p className="text-[14px] font-bold text-gray-600">{email}</p>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Phone Number</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-[14px] font-medium text-gray-800 outline-none focus:border-green-500" />
            </div>

            {/* Read-Only Default Delivery Location */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Default Delivery Location</label>
                <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] font-bold text-gray-500 flex items-center gap-1">🔒 Fixed Campus Address</span>
              </div>
              <div className="bg-gray-100 border border-gray-200 rounded-2xl px-4 py-3 opacity-80 cursor-not-allowed">
                <p className="text-[14px] font-bold text-gray-600">{hostel}</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              showToast("Profile details updated successfully!")
              setActiveModal(null)
            }}
            className="w-full py-4 rounded-2xl text-[15px] font-black text-white bg-[#1a3a2a] hover:bg-black transition-colors shadow-sm cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </div>
    )
  }

  // 2. Privacy & Security Screen (2FA Removed)
  if (activeModal === 'Privacy & security') {
    return (
      <div className="flex flex-col min-h-full bg-gray-50">
        <BackHeader title="Privacy & Security" onBack={() => setActiveModal(null)} />
        <div className="flex-1 p-4 pb-20 overflow-y-auto hide-scrollbar">
          <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Change Password</p>
          <div className="bg-white rounded-3xl p-5 flex flex-col gap-4 shadow-xs mb-6">
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Current Password</label>
              <input type="password" placeholder="Enter current password" value={currentPass} onChange={e => setCurrentPass(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-[14px] font-medium text-gray-800 outline-none focus:border-green-500" />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">New Password</label>
              <input type="password" placeholder="Min 6 characters" value={newPass} onChange={e => setNewPass(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-[14px] font-medium text-gray-800 outline-none focus:border-green-500" />
            </div>

            <button
              onClick={() => {
                showToast("Password updated successfully!")
                setCurrentPass('')
                setNewPass('')
              }}
              className="w-full py-3.5 rounded-2xl text-[14px] font-black text-white bg-[#1a3a2a] hover:bg-black transition-colors mt-2 cursor-pointer"
            >
              Update Password
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 3. Help & Support Screen
  if (activeModal === 'Help & support') {
    return (
      <div className="flex flex-col min-h-full bg-gray-50">
        <BackHeader title="Help & Support" onBack={() => setActiveModal(null)} />
        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-3xl bg-green-50 flex items-center justify-center mb-5 border border-green-100">
            <span className="text-4xl">✉️</span>
          </div>
          <h3 className="text-[22px] font-black text-gray-900 mb-2">Help & Support</h3>
          <p className="text-[13px] text-gray-400 font-medium mb-6 max-w-xs">
            Have questions, feedback, or need assistance with an order? Contact us directly via email:
          </p>

          <a
            href="mailto:vaayu.support@gmail.com"
            className="w-full bg-white border border-gray-200 rounded-3xl p-5 flex items-center justify-center gap-3 shadow-xs hover:border-green-500 transition-colors cursor-pointer text-decoration-none"
          >
            <span className="text-2xl">📧</span>
            <span className="text-[16px] font-black text-gray-900">vaayu.support@gmail.com</span>
          </a>
        </div>
      </div>
    )
  }

  // 4. Rate the App Modal
  if (activeModal === 'Rate the app') {
    return (
      <div className="flex flex-col min-h-full bg-gray-50">
        <BackHeader title="Rate Vaayu" onBack={() => setActiveModal(null)} />
        <div className="flex-1 p-6 flex flex-col items-center overflow-y-auto hide-scrollbar">
          <span className="text-5xl my-4">⭐</span>
          <h3 className="text-[22px] font-black text-gray-900 mb-1 text-center">Enjoying Vaayu?</h3>
          <p className="text-[13px] text-gray-400 font-medium text-center mb-6">Tap stars to give your rating</p>

          <div className="flex gap-3 mb-6">
            {[1, 2, 3, 4, 5].map(star => (
              <button key={star} onClick={() => setRating(star)} className="text-3xl cursor-pointer hover:scale-110 transition-transform">
                {star <= rating ? '⭐' : '☆'}
              </button>
            ))}
          </div>

          <textarea
            placeholder="Share your thoughts or suggestions..."
            rows={4}
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-[13px] text-gray-800 mb-6 outline-none focus:border-green-500 resize-none"
          />

          <button
            onClick={() => {
              showToast("Thank you for your feedback! ❤️")
              setActiveModal(null)
            }}
            className="w-full py-4 rounded-2xl text-[15px] font-black text-white bg-[#1a3a2a] hover:bg-black transition-colors shadow-sm cursor-pointer"
          >
            Submit Review
          </button>
        </div>
      </div>
    )
  }

  // 5. Terms & Privacy Screen
  if (activeModal === 'Terms & privacy') {
    return (
      <div className="flex flex-col min-h-full bg-gray-50">
        <BackHeader title="Terms & Privacy Policy" onBack={() => setActiveModal(null)} />
        <div className="flex-1 p-5 pb-20 overflow-y-auto hide-scrollbar">
          <div className="bg-white rounded-3xl p-5 flex flex-col gap-4 shadow-xs">
            <h4 className="text-[15px] font-black text-gray-900">1. Service Terms</h4>
            <p className="text-[12px] text-gray-600 font-medium leading-relaxed">
              CampusDeliver provides on-campus order fulfillment for students and partners at IIIT Tiruchirappalli. All orders must comply with institute conduct guidelines.
            </p>

            <h4 className="text-[15px] font-black text-gray-900 pt-2">2. Privacy Policy</h4>
            <p className="text-[12px] text-gray-600 font-medium leading-relaxed">
              Student data (roll numbers, emails) is strictly protected and only used for verifying campus membership and delivering orders to Gate 1.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── MAIN PROFILE SCREEN ──────────────────────────────────────────────────────

  const menuSections = [
    {
      title: 'Account',
      items: [
        { icon: '👤', label: 'Edit profile', sub: 'Name, phone, email' },
        { icon: '🔒', label: 'Privacy & security', sub: 'Password & security' },
      ],
    },
    {
      title: 'Support & Feedback',
      items: [
        { icon: '💬', label: 'Help & support', sub: 'FAQs & live chat' },
        { icon: '⭐', label: 'Rate the app', sub: 'Share your feedback' },
        { icon: '📄', label: 'Terms & privacy', sub: 'Official terms' },
      ],
    },
  ]

  return (
    <div className="flex flex-col min-h-full bg-gray-50 relative">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#1a3a2a] text-white px-5 py-2.5 rounded-full text-xs font-semibold shadow-xl">
          ✨ {toast}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-6 pb-4">
        <h1 className="text-[24px] font-black text-gray-900">Profile</h1>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar pb-24">
        {/* Profile card */}
        <div className="mx-4 mt-4 bg-white rounded-3xl p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative flex-none">
              <button onClick={() => setShowPhotoPicker(true)} className="relative group cursor-pointer">
                <img
                  src={avatarUrl}
                  alt={name}
                  className="w-20 h-20 rounded-2xl object-cover"
                />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow text-white">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </div>
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[18px] font-black text-gray-900">{name}</p>
              <p className="text-[12px] text-gray-400 font-medium">{email}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <p className="text-[11px] text-green-600 font-semibold">Campus verified</p>
              </div>
            </div>
          </div>

          {/* Avatar Selector Drawer on Main Card */}
          {showPhotoPicker && (
            <div className="w-full bg-white rounded-2xl p-4 mt-4 border border-green-100 shadow-xs flex flex-col items-center">
              <p className="text-[12px] font-bold text-gray-700 mb-3">Choose an Avatar</p>
              <div className="flex gap-3">
                {AVATAR_OPTIONS.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setAvatarUrl(img)
                      setShowPhotoPicker(false)
                      showToast("Profile photo updated!")
                    }}
                    className={`rounded-2xl border-2 transition-transform hover:scale-105 cursor-pointer overflow-hidden ${avatarUrl === img ? 'border-green-500' : 'border-gray-100'}`}
                  >
                    <img src={img} alt="Option" className="w-12 h-12 object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="flex mt-4 pt-4 border-t border-gray-100">
            {stats.map((s, i) => (
              <div key={s.label} className={`flex-1 text-center ${i < stats.length - 1 ? 'border-r border-gray-100' : ''}`}>
                <p className="text-[20px] font-black text-gray-900">{s.value}</p>
                <p className="text-[11px] text-gray-400 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Menu sections */}
        {menuSections.map(section => (
          <div key={section.title} className="mx-4 mt-3 bg-white rounded-3xl shadow-sm overflow-hidden">
            <p className="px-4 pt-3 pb-1 text-[11px] font-bold text-gray-400 uppercase tracking-widest">{section.title}</p>
            {section.items.map((item, i) => (
              <button
                key={item.label}
                onClick={() => setActiveModal(item.label)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors cursor-pointer ${i < section.items.length - 1 ? 'border-b border-gray-50' : ''}`}
              >
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-lg flex-none">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-gray-800">{item.label}</p>
                  {item.sub && <p className="text-[11px] text-gray-400 font-medium">{item.sub}</p>}
                </div>
                <ChevronRight />
              </button>
            ))}
          </div>
        ))}

        {/* Sign out */}
        <div className="mx-4 mt-4">
          <button
            onClick={onSignOut}
            className="w-full py-3.5 rounded-2xl text-[14px] font-bold text-red-500 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>

        <p className="text-center text-[11px] text-gray-300 font-medium mt-6">Vaayu · A hyper local delivery app</p>
      </div>
    </div>
  )
}
