import {
  ArrowRight,
  BarChart3,
  Check,
  Fuel,
  MapPinned,
  Route,
  ShieldCheck,
  Truck,
  Users,
} from 'lucide-react'

interface Props {
  onSignIn: () => void
  onCreateAccount: () => void
}

const features = [
  {
    icon: BarChart3,
    title: 'See the numbers clearly',
    description: 'Review revenue, expenses, profit, and trip activity from one focused dashboard.',
  },
  {
    icon: MapPinned,
    title: 'Keep every route organized',
    description: 'Record pick-ups, drop-offs, distance estimates, driver hours, and route details.',
  },
  {
    icon: Fuel,
    title: 'Know your fleet costs',
    description: 'Compare truck consumption, trip fuel costs, and pump purchases made outside a trip.',
  },
]

export function LandingPage({ onSignIn, onCreateAccount }: Props) {
  const scrollToFeatures = () => document.getElementById('landing-features')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div className="landing-page">
      <header className="landing-header">
        <a className="landing-brand" href="#landing-top" aria-label="LogiLedger home">
          <span><Route size={22} /></span>
          <div><strong>LogiLedger</strong><small>LOGISTICS MONITORING</small></div>
        </a>
        <nav aria-label="Landing page navigation">
          <button className="landing-nav-link" type="button" onClick={scrollToFeatures}>Features</button>
          <button className="landing-nav-link" type="button" onClick={onSignIn}>Sign in</button>
          <button className="primary-button landing-header-cta" type="button" onClick={onCreateAccount}>Create workspace <ArrowRight size={16} /></button>
        </nav>
      </header>

      <main id="landing-top" className="landing-main">
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <span className="landing-kicker"><i /> Built for everyday logistics operations</span>
            <h1>Know every trip.<br /><em>Understand every peso.</em></h1>
            <p>One simple workspace for monitoring routes, revenue, fleet costs, crew activity, and estimated profit.</p>
            <div className="landing-hero-actions">
              <button className="primary-button landing-primary-cta" type="button" onClick={onCreateAccount}>Create your workspace <ArrowRight size={18} /></button>
              <button className="secondary-button landing-secondary-cta" type="button" onClick={scrollToFeatures}>See what it tracks</button>
            </div>
            <div className="landing-assurance">
              <span><Check size={14} /> Separate company workspace</span>
              <span><ShieldCheck size={14} /> Private PIN access</span>
            </div>
          </div>

          <div className="landing-product" aria-label="Revenue monitoring dashboard preview">
            <div className="landing-product-topbar">
              <div><span /><span /><span /></div>
              <small>Operations overview</small>
              <i />
            </div>
            <div className="landing-product-body">
              <aside>
                <div className="landing-mini-brand"><Route size={16} /></div>
                <span className="active"><BarChart3 size={14} /></span>
                <span><Truck size={14} /></span>
                <span><Users size={14} /></span>
                <span><MapPinned size={14} /></span>
              </aside>
              <div className="landing-dashboard-preview">
                <div className="landing-preview-heading"><div><small>OPERATIONS OVERVIEW</small><strong>Dashboard</strong></div><span>+ New Trip</span></div>
                <div className="landing-preview-metrics">
                  <article><small>Total trips</small><strong>28</strong></article>
                  <article><small>Total revenue</small><strong>₱184,250</strong></article>
                  <article><small>Total expenses</small><strong>₱119,480</strong></article>
                  <article><small>Est. profit</small><strong>₱64,770</strong></article>
                </div>
                <div className="landing-preview-panels">
                  <article className="landing-chart-card">
                    <div><strong>Financial performance</strong><small>Revenue and expenses</small></div>
                    <div className="landing-chart-bars" aria-hidden="true">
                      {[38, 51, 45, 70, 62, 88].map((height, index) => (
                        <span key={height}><i style={{ height: `${height}%` }} /><b style={{ height: `${Math.max(height - 18, 15)}%` }} /><small>{['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'][index]}</small></span>
                      ))}
                    </div>
                  </article>
                  <article className="landing-glance-card">
                    <strong>At a glance</strong>
                    <span><small>Trips completed</small><b>28</b></span>
                    <span><small>Average profit / trip</small><b>₱2,313</b></span>
                    <span><small>Recorded distance</small><b>3,842 km</b></span>
                  </article>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="landing-features" className="landing-features">
          <div className="landing-section-heading">
            <span className="eyebrow">ONE OPERATIONS WORKSPACE</span>
            <h2>The essentials, without the clutter.</h2>
            <p>Keep the information your team needs close at hand—from the first pick-up to the final expense.</p>
          </div>
          <div className="landing-feature-grid">
            {features.map(({ icon: Icon, title, description }) => (
              <article key={title}>
                <span><Icon size={21} /></span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-security-strip">
          <div><ShieldCheck size={22} /><span><strong>Private by design</strong><small>Protected with six-digit PIN access and a time-limited session.</small></span></div>
          <div><Truck size={22} /><span><strong>Built around your operation</strong><small>Manage trips, crew, saved locations, trucks, and fuel records.</small></span></div>
          <div><Route size={22} /><span><strong>Ready when you are</strong><small>Your operational records stay securely stored in Cloudflare D1.</small></span></div>
        </section>

        <section className="landing-final-cta">
          <span className="eyebrow">BUILT FOR LOGISTICS OPERATORS</span>
          <h2>Your operations, finally in one place.</h2>
          <p>Open the private workspace to review your latest trips and financial performance.</p>
          <button className="primary-button landing-primary-cta" type="button" onClick={onCreateAccount}>Create your workspace <ArrowRight size={18} /></button>
        </section>
      </main>

      <footer className="landing-footer">
        <span>LogiLedger</span>
        <small>Logistics revenue monitoring</small>
      </footer>
    </div>
  )
}
