import { useState, useRef, useEffect } from 'react'

/* ── Photos from Zip ─────────────────────────────────────────────── */
const PHOTO = {
  delivery1: 'https://images.unsplash.com/photo-1695654390723-479197a8c4a3?w=800&h=1400&fit=crop&auto=format&q=85',
  delivery2: 'https://images.unsplash.com/photo-1572195577046-2f25894c06fc?w=800&h=1400&fit=crop&auto=format&q=85',
}

/* ── SVG Icons ───────────────────────────────────────────────────── */
const Ic = {
  Arrow: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
    </svg>
  ),
  Back: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6"/>
    </svg>
  ),
  Eye: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  EyeOff: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/>
    </svg>
  ),
  Mail: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  ),
  Store: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Check: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
}

/* ── Form Components ─────────────────────────────────────────────── */
function PasswordField({
  label, placeholder, value, onChange,
}: { label: string; placeholder?: string; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false)
  return (
    <div className="flex flex-col text-left">
      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#333', marginBottom: 6 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          className="field-input"
          type={show ? 'text' : 'password'}
          placeholder={placeholder ?? '••••••••'}
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ paddingRight: 44 }}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', display: 'flex', padding: 0 }}
        >
          {show ? <Ic.Eye /> : <Ic.EyeOff />}
        </button>
      </div>
    </div>
  )
}

function TextField({
  label, placeholder, value, onChange, type = 'text',
}: { label: string; placeholder?: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="flex flex-col text-left">
      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#333', marginBottom: 6 }}>{label}</label>
      <input
        type={type}
        className="field-input"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}

function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, height: 1, background: '#eee' }} />
      <span style={{ fontSize: 12, color: '#bbb', fontWeight: 500 }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: '#eee' }} />
    </div>
  )
}

/* ── 1. Onboarding Splash Screen ─────────────────────────────────── */
const SPLASH_SLIDES = [
  {
    photo: PHOTO.delivery1,
    tag: 'CAMPUS DELIVERY',
    headline: ['ORDER.', 'TRACK.', 'ARRIVE.'],
    sub: 'Get anything from shops delivered to your campus in minutes.',
  },
  {
    photo: PHOTO.delivery2,
    tag: 'PARTNER PORTAL',
    headline: ['GROW.', 'PARTNER.', 'EARN.'],
    sub: 'Register your shop and reach hundreds of hostel & campus customers daily.',
  },
]

function SplashScreen({
  onContinue, onPartner, onRegister, initialPage = 0,
}: { onContinue: () => void; onPartner: () => void; onRegister: () => void; initialPage?: number }) {
  const [page, setPage] = useState(initialPage)
  const [animKey, setAnimKey] = useState(0)

  const dragRef = useRef({ startX: 0, dragging: false })
  const [dragOffset, setDragOffset] = useState(0)

  const goTo = (p: number) => {
    setPage(p)
    setAnimKey(k => k + 1)
    setDragOffset(0)
  }

  const onDown = (e: React.PointerEvent) => {
    dragRef.current = { startX: e.clientX, dragging: true }
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }
  const onMove = (e: React.PointerEvent) => {
    if (!dragRef.current.dragging) return
    setDragOffset(e.clientX - dragRef.current.startX)
  }
  const onUp = () => {
    if (!dragRef.current.dragging) return
    dragRef.current.dragging = false
    if (dragOffset < -50 && page < SPLASH_SLIDES.length - 1) goTo(page + 1)
    else if (dragOffset > 50 && page > 0) goTo(page - 1)
    else setDragOffset(0)
  }

  const slide = SPLASH_SLIDES[page]

  return (
    <div
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', cursor: 'grab', userSelect: 'none' }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
    >
      {/* Background image */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${slide.photo})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        transition: 'background-image 0.5s ease',
      }} />

      {/* Dark Gradient Overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 30%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.88) 100%)',
      }} />

      {/* Hero text */}
      <div key={animKey} style={{ position: 'absolute', bottom: page === 1 ? 230 : 175, left: 24, right: 24, textAlignment: 'left' }}>
        <div className="hero-text text-left" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#4ade80', fontFamily: 'Outfit, sans-serif', marginBottom: 14 }}>
          {slide.tag}
        </div>
        <div className="hero-text text-left" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 48, lineHeight: 0.95, color: '#fff', marginBottom: 16 }}>
          {slide.headline.map((line, i) => <div key={i}>{line}</div>)}
        </div>
        {page === 0 && (
          <div className="hero-sub text-left" style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, maxWidth: 280 }}>
            {slide.sub}
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div style={{ position: 'absolute', bottom: 32, left: 24, right: 24 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, alignItems: 'center' }}>
          {SPLASH_SLIDES.map((_, i) => (
            <div key={i} className={`dot${page === i ? ' active' : ''}`} onClick={() => goTo(i)} style={{ cursor: 'pointer' }} />
          ))}
        </div>

        <div className="hero-cta" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {page === 0 ? (
            <>
              <button className="btn-green" onClick={onContinue}>
                Continue <Ic.Arrow />
              </button>
              <button
                type="button"
                onClick={() => goTo(1)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.65)', fontSize: 13, fontFamily: 'Inter, sans-serif', textAlign: 'center', padding: '4px 0' }}
              >
                Shop Owner? <span style={{ color: '#4ade80', fontWeight: 600 }}>Partner Portal →</span>
              </button>
            </>
          ) : (
            <>
              <button className="btn-white-solid" onClick={onRegister}>
                <Ic.Store /> Register Your Shop
              </button>
              <button className="btn-white-outline" onClick={onPartner}>
                <Ic.Mail /> Partner Log In
              </button>
              <button
                type="button"
                onClick={() => goTo(0)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.65)', fontSize: 13, fontFamily: 'Inter, sans-serif', textAlign: 'center', padding: '4px 0' }}
              >
                Customer? <span style={{ color: '#4ade80', fontWeight: 600 }}>Customer Portal →</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── 2. Customer Login (Bottom Sheet) ────────────────────────────── */
function CustomerLogin({
  onBack, onSignUp, onLoginComplete,
}: { onBack: () => void; onSignUp: () => void; onLoginComplete: (user: any) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = () => {
    onLoginComplete({
      role: 'customer',
      name: email.split('@')[0] || 'Student',
      email: email || 'student@iiitt.ac.in',
      phone_number: '9876543210',
    })
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Top Section */}
      <div style={{ flex: '0 0 35%', position: 'relative' }}>
        <button
          onClick={onBack}
          style={{
            position: 'absolute', top: 24, left: 20, zIndex: 10,
            width: 36, height: 36, borderRadius: 50, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#fff',
          }}
        >
          <Ic.Back />
        </button>
      </div>

      {/* Bottom Sheet */}
      <div className="sheet sheet-enter flex-1 flex flex-col justify-between" style={{ height: '65%' }}>
        <div className="sheet-handle" />

        <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 28, color: '#0d2137', letterSpacing: '-0.02em', marginBottom: 2, textAlign: 'left' }}>
          Vaayu<span style={{ color: '#16a34a' }}>.</span>
        </div>

        <div className="stagger flex-1 flex flex-col justify-between py-2">
          <div className="text-left">
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 20, color: '#111', marginBottom: 2 }}>
              Welcome Back!
            </div>
            <div style={{ fontSize: 13, color: '#888', lineHeight: 1.4 }}>
              Log in to order from your favourite campus shops.
            </div>
          </div>

          <div className="flex flex-col gap-3 my-2 text-left">
            <TextField label="Username / College Email" placeholder="251420@iiitt.ac.in" value={email} onChange={setEmail} />
            <PasswordField label="Password" value={password} onChange={setPassword} />
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', cursor: 'pointer' }}>Forgot Password?</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <button className="btn-green" onClick={handleLogin}>Log In</button>
            <div style={{ textAlign: 'center', fontSize: 12.5, color: '#888' }}>
              {"Don't have an account? "}
              <span style={{ fontWeight: 700, color: '#16a34a', cursor: 'pointer' }} onClick={onSignUp}>Register here</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── 3. Partner Login (Bottom Sheet) ─────────────────────────────── */
function PartnerLogin({
  onBack, onLoginComplete,
}: { onBack: () => void; onLoginComplete: (user: any) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = () => {
    onLoginComplete({
      role: 'shop_owner',
      name: 'Shobha Singh',
      ownerName: 'Shobha Singh',
      shop_name: 'Royal Foods & Cafe',
      email: email || 'owner@royal-foods.com',
      phone: '7906651669',
      phone_number: '7906651669',
    })
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ flex: '0 0 35%', position: 'relative' }}>
        <button
          onClick={onBack}
          style={{
            position: 'absolute', top: 24, left: 20, zIndex: 10,
            width: 36, height: 36, borderRadius: 50, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#fff',
          }}
        >
          <Ic.Back />
        </button>
      </div>

      <div className="sheet sheet-enter flex-1 flex flex-col justify-between" style={{ height: '65%' }}>
        <div className="sheet-handle" />

        <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 28, color: '#0d2137', letterSpacing: '-0.02em', marginBottom: 2, textAlign: 'left' }}>
          Vaayu<span style={{ color: '#16a34a' }}>.</span>
        </div>

        <div className="stagger flex-1 flex flex-col justify-between py-2">
          <div className="text-left">
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 20, color: '#111', marginBottom: 2 }}>Welcome Back, Partner!</div>
            <div style={{ fontSize: 13, color: '#888', lineHeight: 1.4 }}>Log in to manage your shop and track orders.</div>
          </div>

          <div className="flex flex-col gap-3 my-2 text-left">
            <TextField label="Owner Email" placeholder="owner@royal-foods.com" value={email} onChange={setEmail} />
            <PasswordField label="Password" value={password} onChange={setPassword} />
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', cursor: 'pointer' }}>Forgot Password?</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <button className="btn-green" onClick={handleLogin}>Log In to Partner Portal</button>
            <Divider label="or" />
            <div style={{ textAlign: 'center', fontSize: 12.5, color: '#888' }}>
              New partner? <span style={{ fontWeight: 700, color: '#16a34a', cursor: 'pointer' }} onClick={onBack}>Register Your Shop</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── 4. Student Registration Screen ──────────────────────────────── */
function StudentRegister({ onBack, onComplete }: { onBack: () => void; onComplete: (user: any) => void }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [agreed, setAgreed] = useState(false)
  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleRegister = () => {
    onComplete({
      role: 'customer',
      name: form.name.trim() || form.email.split('@')[0] || 'Student',
      email: form.email.trim() || 'student@iiitt.ac.in',
      phone_number: form.phone.trim() || '9876543210',
    })
  }

  return (
    <div style={{ width: '100%', height: '100%', background: '#fff', display: 'flex', flexDirection: 'column', padding: '0 20px', overflowY: 'auto' }}>
      <div style={{ paddingTop: 24, paddingBottom: 12, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button onClick={onBack} style={{ width: 34, height: 34, borderRadius: 50, background: '#f4f4f4', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#111', flexShrink: 0 }}>
          <Ic.Back />
        </button>
        <div className="text-left">
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#16a34a', fontFamily: 'Outfit, sans-serif' }}>CAMPUS DELIVERY</div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 20, color: '#0d2137', lineHeight: 1.1 }}>Student Registration</div>
        </div>
      </div>

      <p className="text-left" style={{ fontSize: 12, color: '#888', marginBottom: 12, lineHeight: 1.4, flexShrink: 0 }}>
        Use your official IIITT email (e.g. 251420@iiitt.ac.in) to join.
      </p>

      <div className="stagger flex-1 flex flex-col justify-between pb-8">
        <div className="flex flex-col gap-2.5">
          <TextField label="Full Name" placeholder="e.g. Aditya Sharma" value={form.name} onChange={set('name')} />
          <TextField label="College Email" placeholder="e.g. 251420@iiitt.ac.in" value={form.email} onChange={set('email')} />
          <TextField label="Phone Number" placeholder="e.g. 9876543210" value={form.phone} onChange={set('phone')} />
          <PasswordField label="Password" placeholder="Min 6 characters" value={form.password} onChange={set('password')} />
          <PasswordField label="Confirm Password" placeholder="Retype password" value={form.confirm} onChange={set('confirm')} />
        </div>

        <div className="flex flex-col gap-3 mt-4">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }} className="text-left">
            <div className={`checkbox${agreed ? ' on' : ''}`} onClick={() => setAgreed(a => !a)}>
              {agreed && <Ic.Check />}
            </div>
            <div style={{ fontSize: 11.5, color: '#777', lineHeight: 1.4 }}>
              I agree with the <span style={{ color: '#16a34a', fontWeight: 700, cursor: 'pointer' }}>Terms & Conditions</span> and <span style={{ color: '#16a34a', fontWeight: 700, cursor: 'pointer' }}>Privacy Policy</span>.
            </div>
          </div>
          <button className="btn-green" onClick={handleRegister} style={{ opacity: agreed ? 1 : 0.5, pointerEvents: agreed ? 'auto' : 'none' }}>
            Proceed to Verification <Ic.Arrow />
          </button>
          <div style={{ textAlign: 'center', fontSize: 12, color: '#888' }}>
            Have an account? <span style={{ fontWeight: 700, color: '#16a34a', cursor: 'pointer' }} onClick={onBack}>Log In</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── 5. Shop Registration Screen ─────────────────────────────────── */
function ShopRegister({ onBack, onComplete }: { onBack: () => void; onComplete: (user: any) => void }) {
  const [form, setForm] = useState({ shop: '', owner: '', phone: '', email: '', password: '', confirm: '' })
  const [cats, setCats] = useState<string[]>(['Food'])
  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }))
  const toggle = (c: string) => setCats(cs => cs.includes(c) ? cs.filter(x => x !== c) : [...cs, c])

  const handleRegister = () => {
    onComplete({
      role: 'shop_owner',
      name: form.owner.trim() || 'Shop Owner',
      ownerName: form.owner.trim() || 'Shop Owner',
      shop_name: form.shop.trim() || 'Campus Bites Cafe',
      email: form.email.trim() || 'owner@campusbites.com',
      phone: form.phone.trim() || '7906651669',
      phone_number: form.phone.trim() || '7906651669',
      category: cats.join(', '),
    })
  }

  return (
    <div style={{ width: '100%', height: '100%', background: '#fff', display: 'flex', flexDirection: 'column', padding: '0 20px', overflowY: 'auto' }}>
      <div style={{ paddingTop: 24, paddingBottom: 8, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button onClick={onBack} style={{ width: 34, height: 34, borderRadius: 50, background: '#f4f4f4', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#111', flexShrink: 0 }}>
          <Ic.Back />
        </button>
        <div className="text-left">
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#16a34a', fontFamily: 'Outfit, sans-serif' }}>PARTNER PROGRAM</div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 18, color: '#0d2137', lineHeight: 1.1 }}>Register Your Shop</div>
        </div>
      </div>

      <p className="text-left" style={{ fontSize: 11.5, color: '#888', marginBottom: 10, lineHeight: 1.4, flexShrink: 0 }}>
        Deliver directly to hostel & campus customers.
      </p>

      <div className="stagger flex-1 flex flex-col justify-between pb-8">
        <div className="flex flex-col gap-2">
          <TextField label="Shop Name" placeholder="e.g. Royal Foods & Cafe" value={form.shop} onChange={set('shop')} />
          <TextField label="Owner Full Name" placeholder="e.g. Shobha Singh" value={form.owner} onChange={set('owner')} />
          <TextField label="Owner Phone Number" placeholder="e.g. 7906651669" value={form.phone} onChange={set('phone')} />
          <TextField label="Contact Email" placeholder="e.g. owner@royal-foods.com" value={form.email} onChange={set('email')} />
          <div className="text-left">
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#333', marginBottom: 6 }}>Shop Categories</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['Food', 'Grocery', 'Pharmacy', 'Stationery', 'Others'].map(c => (
                <div key={c} className={`chip${cats.includes(c) ? ' active' : ''}`} onClick={() => toggle(c)}>{c}</div>
              ))}
            </div>
          </div>
          <PasswordField label="Password" placeholder="Min 6 characters" value={form.password} onChange={set('password')} />
          <PasswordField label="Confirm Password" placeholder="Retype password" value={form.confirm} onChange={set('confirm')} />
        </div>

        <div className="flex flex-col gap-2.5 mt-4">
          <button className="btn-green" onClick={handleRegister}>Proceed to Verification <Ic.Arrow /></button>
          <div style={{ textAlign: 'center', fontSize: 12, color: '#888' }}>
            Have a partner account? <span style={{ fontWeight: 700, color: '#16a34a', cursor: 'pointer' }} onClick={onBack}>Log In</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════ MAIN SIGNUP / LOGIN MODULE ══════════════════ */
type Screen = 'splash' | 'customer-login' | 'student-register' | 'shop-register' | 'partner-login'

export default function SignupScreen({ onDone }: { onDone: (userData: any) => void }) {
  const [screen, setScreen] = useState<Screen>('splash')
  const [splashPage, setSplashPage] = useState(0)

  const go = (s: Screen, returnPage = 0) => {
    setScreen(s)
    setSplashPage(returnPage)
  }

  return (
    <div className="relative w-full h-full min-h-[600px] overflow-hidden bg-white flex flex-col justify-center items-center">
      {/* Background photos */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${
          screen === 'shop-register' || screen === 'partner-login' || splashPage === 1
            ? PHOTO.delivery2
            : PHOTO.delivery1
        })`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        transition: 'background-image 0.5s ease',
      }} />

      {/* Screen Render */}
      <div className="relative w-full h-full z-10">
        {screen === 'splash' && (
          <SplashScreen
            onContinue={() => go('customer-login')}
            onPartner={() => go('partner-login', 1)}
            onRegister={() => go('shop-register', 1)}
            initialPage={splashPage}
          />
        )}
        {screen === 'customer-login' && (
          <CustomerLogin
            onBack={() => go('splash')}
            onSignUp={() => go('student-register')}
            onLoginComplete={onDone}
          />
        )}
        {screen === 'student-register' && (
          <StudentRegister
            onBack={() => go('customer-login')}
            onComplete={onDone}
          />
        )}
        {screen === 'shop-register' && (
          <ShopRegister
            onBack={() => go('splash', 1)}
            onComplete={onDone}
          />
        )}
        {screen === 'partner-login' && (
          <PartnerLogin
            onBack={() => go('splash', 1)}
            onLoginComplete={onDone}
          />
        )}
      </div>
    </div>
  )
}
