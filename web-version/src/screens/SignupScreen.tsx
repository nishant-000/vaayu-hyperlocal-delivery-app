import { useState } from 'react'

type Role = 'customer' | 'owner'
type Step = 'role' | 'details' | 'verify'

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 text-gray-500 font-semibold text-[13px] mb-6 cursor-pointer hover:text-gray-900 transition-colors">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
      Back
    </button>
  )
}

interface InputFieldProps {
  label: string
  placeholder: string
  type?: string
  value: string
  onChange: (v: string) => void
  hint?: string
  error?: string
}

function InputField({ label, placeholder, type = 'text', value, onChange, hint, error }: InputFieldProps) {
  return (
    <div className="flex flex-col gap-1.5 text-left">
      <label className="text-[12px] font-bold text-gray-600 uppercase tracking-wider">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-gray-100/90 rounded-2xl px-4 py-3.5 text-[14px] font-medium text-gray-800 placeholder-gray-400 outline-none focus:bg-white focus:ring-2 focus:ring-green-500/30 transition-all border border-transparent focus:border-green-500/40"
      />
      {error ? (
        <p className="text-[11px] text-red-500 font-semibold px-1">{error}</p>
      ) : hint ? (
        <p className="text-[11px] text-gray-400 font-medium px-1">{hint}</p>
      ) : null}
    </div>
  )
}

function PrimaryButton({ label, onClick, disabled = false }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full py-4 rounded-2xl text-[15px] font-black text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed"
      style={{ backgroundColor: disabled ? '#9ca3af' : '#1a3a2a' }}
    >
      {label}
      {!disabled && (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"/>
          <polyline points="12 5" y1="12" x2="19" y2="12"/>
        </svg>
      )}
    </button>
  )
}

export default function SignupScreen({ onDone }: { onDone: (userData: any) => void }) {
  const [step, setStep] = useState<Step>('role')
  const [role, setRole] = useState<Role>('customer')

  // Shared form inputs
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [college, setCollege] = useState('IIITT Campus')
  const [shopName, setShopName] = useState('')
  const [shopAddress, setShopAddress] = useState('IIIT Tiruchirappalli, Gate 1')
  const [category, setCategory] = useState('Food')
  const [customCategory, setCustomCategory] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agree, setAgree] = useState(false)

  // OTP State
  const [otp, setOtp] = useState(['', '', '', ''])

  const availableCategories = ['Food', 'Grocery', 'Pharmacy', 'Stationery', 'Others']
  const effectiveCategory = category === 'Others' ? customCategory.trim() : category

  const isCustomerValid = name.trim().length > 0 && email.trim().length > 0 && phone.trim().length === 10 && college.trim().length > 0 && password.length >= 6 && password === confirmPassword && agree
  const isOwnerValid = shopName.trim().length > 0 && email.trim().length > 0 && phone.trim().length === 10 && shopAddress.trim().length > 0 && effectiveCategory && password.length >= 6 && password === confirmPassword && agree

  const handleRoleSelect = (selectedRole: Role) => {
    setRole(selectedRole)
    setStep('details')
  }

  const handleOtpInput = (val: string, idx: number) => {
    if (!/^\d?$/.test(val)) return
    const nextOtp = [...otp]
    nextOtp[idx] = val
    setOtp(nextOtp)
    if (val && idx < 3) {
      document.getElementById(`otp-${idx + 1}`)?.focus()
    } else if (val && idx === 3) {
      const determinedRole = role === 'owner' ? 'shop_owner' : 'customer'
      onDone({
        role: determinedRole,
        name: determinedRole === 'customer' ? (name.trim() || email.split('@')[0]) : (shopName.trim() || name.trim() || email.split('@')[0]),
        email: email || (determinedRole === 'shop_owner' ? 'owner@campusbites.com' : 'student@iiitt.ac.in'),
        phone_number: phone.trim(),
        category: determinedRole === 'shop_owner' ? effectiveCategory : undefined
      })
    }
  }

  const handleOtpKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus()
    }
  }

  const isOtpFilled = otp.every(d => d !== '')

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      {/* ── 1. ROLE SELECTION STEP ── */}
      {step === 'role' && (
        <div className="flex flex-col flex-1 px-5 pt-16 pb-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl text-white font-bold bg-[#1a3a2a]">
              ⚡
            </div>
            <span className="text-[20px] font-black text-gray-900 tracking-tight">vaayu</span>
          </div>

          <h1 className="text-[28px] font-black text-gray-900 leading-tight mb-1 text-left">Join the campus<br/>community</h1>
          <p className="text-[14px] text-gray-400 font-medium mb-8 text-left">Choose how you'd like to use Vaayu.</p>

          <div className="flex flex-col gap-3 flex-1">
            <button
              onClick={() => handleRoleSelect('customer')}
              className={`p-5 rounded-3xl border-2 text-left flex gap-4 transition-all cursor-pointer ${
                role === 'customer' ? 'border-[#1a3a2a] bg-white' : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              <span className="text-3xl">🎓</span>
              <div>
                <h3 className="font-extrabold text-[16px] text-gray-900">I'm a Student</h3>
                <p className="text-[12px] text-gray-500 mt-1">Order food, groceries & essentials delivered to class or hostels.</p>
              </div>
            </button>

            <button
              onClick={() => handleRoleSelect('owner')}
              className={`p-5 rounded-3xl border-2 text-left flex gap-4 transition-all cursor-pointer ${
                role === 'owner' ? 'border-[#1a3a2a] bg-white' : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              <span className="text-3xl">🏪</span>
              <div>
                <h3 className="font-extrabold text-[16px] text-gray-900">I'm a Shop Owner</h3>
                <p className="text-[12px] text-gray-500 mt-1">List your store and accept student orders instantly.</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ── 2. ACCOUNT DETAILS STEP ── */}
      {step === 'details' && (
        <div className="flex flex-col flex-1 px-5 pt-14 pb-6 overflow-y-auto hide-scrollbar">
          <BackButton onClick={() => setStep('role')} />

          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center text-xl">
              {role === 'customer' ? '🎓' : '🏪'}
            </div>
            <span className="text-[12px] font-bold text-green-600 uppercase tracking-widest">
              {role === 'customer' ? 'Student account' : 'Shop Owner account'}
            </span>
          </div>

          <h1 className="text-[26px] font-black text-gray-900 leading-tight mb-1 text-left">
            {role === 'customer' ? 'Create your account' : 'List your shop'}
          </h1>
          <p className="text-[13px] text-gray-400 font-medium mb-6 text-left">Join Vaayu hyperlocal Delivery network.</p>

          <div className="flex flex-col gap-4">
            {role === 'customer' ? (
              <>
                <InputField label="Full Name" placeholder="e.g. Aditya Sharma" value={name} onChange={setName} />
                <InputField label="College Email" placeholder="e.g. 251420@iiitt.ac.in" type="email" value={email} onChange={setEmail} hint="Must be a valid student ID email" />
                <InputField label="Phone number" placeholder="9876543210" type="tel" value={phone} onChange={setPhone} />
                <InputField label="College / University" placeholder="IIITT Campus" value={college} onChange={setCollege} />
              </>
            ) : (
              <>
                <InputField label="Shop owner name" placeholder="e.g. Ramesh Kumar" value={name} onChange={setName} />
                <InputField label="Shop name" placeholder="e.g. Campus Bites Cafe" value={shopName} onChange={setShopName} />
                <InputField label="Contact Email" placeholder="e.g. owner@email.com" type="email" value={email} onChange={setEmail} />
                <InputField label="Owner Phone number" placeholder="9876543210" type="tel" value={phone} onChange={setPhone} />
                <InputField label="Shop Location" placeholder="IIIT Tiruchirappalli, Gate 1" value={shopAddress} onChange={setShopAddress} />

                {/* Category selector */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[12px] font-bold text-gray-600 uppercase tracking-wider">Shop category</label>
                  <div className="flex flex-wrap gap-2">
                    {availableCategories.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setCategory(c)
                          if (c !== 'Others') setCustomCategory('')
                        }}
                        className={`px-3.5 py-2 rounded-full text-[12px] font-bold transition-all border cursor-pointer ${
                          category === c ? 'bg-[#1a3a2a] text-white' : 'bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {category === 'Others' && (
                  <InputField label="Custom Category Name" placeholder="e.g. Laundry, Printing" value={customCategory} onChange={setCustomCategory} />
                )}
              </>
            )}

            <InputField label="Password" placeholder="Min. 6 characters" type="password" value={password} onChange={setPassword} />
            <InputField label="Confirm Password" placeholder="Retype password" type="password" value={confirmPassword} onChange={setConfirmPassword} error={confirmPassword && password !== confirmPassword ? "Passwords do not match" : undefined} />

            {/* Terms checkbox */}
            <div className="flex items-start gap-3 mt-4 cursor-pointer select-none" onClick={() => setAgree(!agree)}>
              <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${agree ? 'border-[#1a3a2a] bg-[#1a3a2a]' : 'border-gray-300'}`}>
                {agree && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </div>
              <p className="text-[12px] text-gray-500 font-medium leading-relaxed text-left">
                I agree to the <span className="text-green-600 font-bold">Terms of Service</span> and <span className="text-green-600 font-bold">Privacy Policy</span>.
              </p>
            </div>

            <div className="mt-6">
              <PrimaryButton
                label="Proceed to Verification"
                disabled={role === 'customer' ? !isCustomerValid : !isOwnerValid}
                onClick={() => setStep('verify')}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── 3. OTP VERIFICATION STEP ── */}
      {step === 'verify' && (
        <div className="flex flex-col flex-1 px-5 pt-20 pb-6">
          <BackButton onClick={() => setStep('details')} />

          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-xs bg-green-50">
            📧
          </div>
          <h1 className="text-[26px] font-black text-gray-900 leading-tight mb-2 text-left">Verify your<br/>email</h1>
          <p className="text-[13px] text-gray-400 font-medium mb-8 text-left">
            We sent a 4-digit code to your email address. Enter it below.
          </p>

          <div className="flex gap-3 justify-center mb-8">
            {otp.map((digit, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleOtpInput(e.target.value, i)}
                onKeyDown={e => handleOtpKeyDown(e, i)}
                className="w-16 h-16 text-center text-[24px] font-black rounded-2xl border-2 outline-none transition-all"
                style={{
                  borderColor: digit ? '#1a3a2a' : '#e5e7eb',
                  backgroundColor: digit ? '#f0fdf4' : '#f9fafb',
                  color: '#1a3a2a',
                }}
              />
            ))}
          </div>

          <PrimaryButton
            label="Verify & Enter App"
            disabled={!isOtpFilled}
            onClick={() => {
              onDone({
                role,
                name: role === 'customer' ? name : shopName,
                email,
                phone_number: phone,
                category: role === 'owner' ? effectiveCategory : undefined
              })
            }}
          />

          <p className="text-center text-[12px] text-gray-400 font-medium mt-4">
            Didn't receive it?{' '}
            <span className="text-green-600 font-bold cursor-pointer hover:underline">Resend code to email (30s)</span>
          </p>
        </div>
      )}
    </div>
  )
}
