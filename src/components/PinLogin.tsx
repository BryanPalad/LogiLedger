import { ArrowLeft, ArrowRight, Building2, Route, ShieldCheck } from 'lucide-react'
import { useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from 'react'
import type { CompanySession } from '../services/authService'

interface Props {
  mode: 'login' | 'signup'
  rememberedCompany: CompanySession
  onLogin: (pin: string, workspace?: string) => Promise<void>
  onSignup: (companyName: string, pin: string) => Promise<void>
  onModeChange: (mode: 'login' | 'signup') => void
  onBack: () => void
}

interface PinBoxesProps {
  id: string
  label: string
  digits: string[]
  onChange: (digits: string[]) => void
  invalid: boolean
  autoFocus?: boolean
}

function PinBoxes({ id, label, digits, onChange, invalid, autoFocus = false }: PinBoxesProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])
  const updateDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = digit
    onChange(next)
    if (digit && index < 5) inputRefs.current[index + 1]?.focus()
  }
  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) inputRefs.current[index - 1]?.focus()
    if (event.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus()
    if (event.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus()
  }
  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    event.preventDefault()
    onChange(Array.from({ length: 6 }, (_, index) => pasted[index] ?? ''))
    inputRefs.current[Math.min(pasted.length, 6) - 1]?.focus()
  }

  return <>
    <label id={`${id}-label`}>{label}</label>
    <div className="pin-inputs" onPaste={handlePaste} role="group" aria-labelledby={`${id}-label`}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => { inputRefs.current[index] = element }}
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          autoFocus={autoFocus && index === 0}
          value={digit}
          onChange={(event) => updateDigit(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onFocus={(event) => event.currentTarget.select()}
          aria-label={`${label} digit ${index + 1}`}
          aria-invalid={invalid}
        />
      ))}
    </div>
  </>
}

const emptyPin = () => ['', '', '', '', '', '']

export function PinLogin({ mode, rememberedCompany, onLogin, onSignup, onModeChange, onBack }: Props) {
  const [company, setCompany] = useState('')
  const [switchingWorkspace, setSwitchingWorkspace] = useState(false)
  const [digits, setDigits] = useState(emptyPin)
  const [confirmDigits, setConfirmDigits] = useState(emptyPin)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const pin = digits.join('')
  const confirmPin = confirmDigits.join('')
  const isSignup = mode === 'signup'

  const changeMode = (next: 'login' | 'signup') => {
    setError('')
    setDigits(emptyPin())
    setConfirmDigits(emptyPin())
    onModeChange(next)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if ((isSignup || switchingWorkspace) && company.trim().length < 2) { setError(isSignup ? 'Enter your logistics company name.' : 'Enter the company name or workspace ID.'); return }
    if (!/^\d{6}$/.test(pin)) { setError('Enter your six-digit access PIN.'); return }
    if (isSignup && pin !== confirmPin) { setError('The PIN confirmation does not match.'); return }
    setSubmitting(true)
    setError('')
    try {
      if (isSignup) await onSignup(company, pin)
      else await onLogin(pin, switchingWorkspace ? company : undefined)
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : `Unable to ${isSignup ? 'create the workspace' : 'sign in'}.`)
      setDigits(emptyPin())
      setConfirmDigits(emptyPin())
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className={`login-card ${isSignup ? 'signup-card' : ''}`}>
        <button className="login-back-button" type="button" onClick={onBack}><ArrowLeft size={15} /> Back to home</button>
        <div className="login-brand"><span><Route size={24} /></span><div><strong>LogiLedger</strong><small>LOGISTICS MONITORING</small></div></div>
        <span className="eyebrow">{isSignup ? 'CREATE YOUR WORKSPACE' : 'PRIVATE ACCESS'}</span>
        <h1>{isSignup ? 'Set up your company' : 'Welcome back'}</h1>
        <p>{isSignup ? 'Register your logistics business and choose a private six-digit PIN.' : <>Enter your six-digit PIN to open <strong>{rememberedCompany.name}</strong>.</>}</p>
        <form onSubmit={submit}>
          {(isSignup || switchingWorkspace) && <><label htmlFor="company-name">{isSignup ? 'Logistics company name' : 'Company name or workspace ID'}</label>
          <div className="auth-company-input"><Building2 size={17} /><input id="company-name" value={company} onChange={(event) => { setCompany(event.target.value); setError('') }} autoComplete="organization" placeholder={isSignup ? 'e.g. Z&L Palm Line Logistic' : 'Your company or workspace ID'} autoFocus /></div></>}
          <PinBoxes id="access-pin" label={isSignup ? 'Create a six-digit PIN' : 'Access PIN'} digits={digits} onChange={(value) => { setDigits(value); setError('') }} invalid={!!error} />
          {isSignup && <div className="confirm-pin"><PinBoxes id="confirm-pin" label="Confirm PIN" digits={confirmDigits} onChange={(value) => { setConfirmDigits(value); setError('') }} invalid={!!error} /></div>}
          {error && <span className="login-error" role="alert">{error}</span>}
          <button className="primary-button" type="submit" disabled={submitting || pin.length !== 6 || (isSignup && confirmPin.length !== 6)}>
            {submitting ? (isSignup ? 'Creating…' : 'Checking…') : <>{isSignup ? 'Create workspace' : 'Sign in'} <ArrowRight size={17} /></>}
          </button>
        </form>
        {!isSignup && <button className="switch-workspace-button" type="button" onClick={() => { setSwitchingWorkspace((value) => !value); setCompany(''); setError('') }}>{switchingWorkspace ? `Use ${rememberedCompany.name}` : 'Switch company workspace'}</button>}
        <div className="auth-mode-switch"><span>{isSignup ? 'Already have a workspace?' : 'New to LogiLedger?'}</span><button type="button" onClick={() => changeMode(isSignup ? 'login' : 'signup')}>{isSignup ? 'Sign in' : 'Create a company workspace'}</button></div>
        <div className="login-security"><ShieldCheck size={16} /><span>Protected with a secure, time-limited session</span></div>
      </section>
    </main>
  )
}
