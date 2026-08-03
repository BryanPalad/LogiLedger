import { Building2, KeyRound, ShieldCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type { CompanySession } from '../services/authService'

interface Props {
  company: CompanySession
  onChangePin: (currentPin: string, newPin: string) => Promise<void>
}

export function SettingsPage({ company, onChangePin }: Props) {
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const updatePin = (setter: (value: string) => void, value: string) => {
    setter(value.replace(/\D/g, '').slice(0, 6))
    setError('')
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!/^\d{6}$/.test(currentPin) || !/^\d{6}$/.test(newPin)) { setError('Current and new PINs must contain exactly six digits.'); return }
    if (newPin !== confirmPin) { setError('The new PIN confirmation does not match.'); return }
    setSaving(true)
    setError('')
    try {
      await onChangePin(currentPin, newPin)
      setCurrentPin(''); setNewPin(''); setConfirmPin('')
    } catch (changeError) {
      setError(changeError instanceof Error ? changeError.message : 'Unable to update the PIN.')
    } finally {
      setSaving(false)
    }
  }

  return <>
    <section className="management-page-heading">
      <span className="eyebrow">WORKSPACE SETTINGS</span>
      <h1>Settings</h1>
      <p>Review your workspace identity and update its private access PIN.</p>
    </section>
    <div className="settings-grid">
      <section className="settings-card">
        <header><span><Building2 size={19} /></span><div><h2>Company workspace</h2><p>The identity used to organize your logistics records.</p></div></header>
        <dl><div><dt>Company name</dt><dd>{company.name}</dd></div><div><dt>Workspace ID</dt><dd><code>{company.id}</code></dd></div></dl>
        <small>You can sign in using either the company name or workspace ID.</small>
      </section>
      <section className="settings-card">
        <header><span><KeyRound size={19} /></span><div><h2>Change access PIN</h2><p>Use a six-digit PIN that only trusted operators know.</p></div></header>
        <form className="settings-pin-form" onSubmit={submit}>
          <label><span>Current PIN</span><input type="password" inputMode="numeric" autoComplete="current-password" maxLength={6} value={currentPin} onChange={(event) => updatePin(setCurrentPin, event.target.value)} placeholder="••••••" /></label>
          <label><span>New six-digit PIN</span><input type="password" inputMode="numeric" autoComplete="new-password" maxLength={6} value={newPin} onChange={(event) => updatePin(setNewPin, event.target.value)} placeholder="••••••" /></label>
          <label><span>Confirm new PIN</span><input type="password" inputMode="numeric" autoComplete="new-password" maxLength={6} value={confirmPin} onChange={(event) => updatePin(setConfirmPin, event.target.value)} placeholder="••••••" /></label>
          {error && <span className="settings-error" role="alert">{error}</span>}
          <button className="primary-button" type="submit" disabled={saving || currentPin.length !== 6 || newPin.length !== 6 || confirmPin.length !== 6}>{saving ? 'Updating…' : <><ShieldCheck size={16} /> Update PIN</>}</button>
        </form>
      </section>
    </div>
  </>
}
