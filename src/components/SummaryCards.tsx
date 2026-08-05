import { Banknote, ChartNoAxesCombined, ChevronDown, CircleDollarSign, Truck, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { FuelLog, ShuttleService, Trip } from '../types'
import { formatPeso, getEstimatedProfit, getShuttleExpenses, getShuttleProfit, getTotalExpenses, getTotalRevenue } from '../utils/calculations'

interface Props { trips: Trip[]; fuelLogs?: FuelLog[]; shuttleRecords?: ShuttleService[] }

export function SummaryCards({ trips, fuelLogs = [], shuttleRecords = [] }: Props) {
  const [expensesOpen, setExpensesOpen] = useState(false)
  const expenseCardRef = useRef<HTMLElement>(null)
  const revenue = trips.reduce((sum, trip) => sum + getTotalRevenue(trip), 0) + shuttleRecords.reduce((sum, record) => sum + record.revenue, 0)
  const standaloneFuel = fuelLogs.reduce((sum, log) => sum + log.amount, 0)
  const expenses = trips.reduce((sum, trip) => sum + getTotalExpenses(trip), 0) + standaloneFuel + shuttleRecords.reduce((sum, record) => sum + getShuttleExpenses(record), 0)
  const profit = trips.reduce((sum, trip) => sum + getEstimatedProfit(trip), 0) + shuttleRecords.reduce((sum, record) => sum + getShuttleProfit(record), 0) - standaloneFuel
  const driverAndHelper = trips.reduce((sum, trip) => sum + trip.driverRate + trip.helperRate, 0) + shuttleRecords.reduce((sum, record) => sum + record.driverRate, 0)
  const gas = trips.reduce((sum, trip) => sum + trip.gasExpense, 0) + shuttleRecords.reduce((sum, record) => sum + record.gasExpense, 0) + standaloneFuel
  const toll = trips.reduce((sum, trip) => sum + trip.tollExpense, 0) + shuttleRecords.reduce((sum, record) => sum + record.tollExpense, 0)
  const otherCosts = trips.reduce((sum, trip) => sum + trip.parkingExpense + trip.foodExpense + trip.otherExpense, 0) + shuttleRecords.reduce((sum, record) => sum + record.parkingExpense + record.otherExpense, 0)
  const cards = [
    { label: 'Delivery Trips', value: trips.length.toLocaleString(), icon: Truck, tone: 'blue', breakdown: undefined },
    { label: 'Total Revenue', value: formatPeso(revenue), icon: CircleDollarSign, tone: 'violet', breakdown: undefined },
    { label: 'Total Expenses', value: formatPeso(expenses), icon: Banknote, tone: 'orange', breakdown: [
      { label: 'Driver + helper', value: formatPeso(driverAndHelper) },
      { label: 'Gas expenses', value: formatPeso(gas) },
      { label: 'Toll', value: formatPeso(toll) },
      { label: 'Other costs', value: formatPeso(otherCosts) },
    ] },
    { label: 'Estimated Profit', value: formatPeso(profit), icon: ChartNoAxesCombined, tone: profit < 0 ? 'red' : 'green', breakdown: undefined },
  ]

  useEffect(() => {
    if (!expensesOpen) return
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!expenseCardRef.current?.contains(event.target as Node)) setExpensesOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpensesOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [expensesOpen])

  return (
    <section className="summary-grid" aria-label="Revenue monitoring totals">
      {cards.map(({ label, value, icon: Icon, tone, breakdown }) => breakdown ? (
        <article className="summary-card expense-menu-card" key={label} ref={expenseCardRef}>
          <div className={`summary-icon ${tone}`}><Icon size={21} strokeWidth={2} /></div>
          <div className="summary-main"><p>{label}</p><strong>{value}</strong></div>
          <button className="expense-details-trigger" type="button" aria-expanded={expensesOpen} aria-controls="expense-breakdown-popover" onClick={() => setExpensesOpen((current) => !current)}>Details <ChevronDown size={13} className={expensesOpen ? 'open' : ''} /></button>
          {expensesOpen && <div className="expense-popover" id="expense-breakdown-popover" role="dialog" aria-label="Expense breakdown">
            <header><div><strong>Expense breakdown</strong><small>Total {value}</small></div><button type="button" onClick={() => setExpensesOpen(false)} aria-label="Close expense breakdown"><X size={15} /></button></header>
            <div>{breakdown.map((item) => <span key={item.label}><small>{item.label}</small><strong>{item.value}</strong></span>)}</div>
          </div>}
        </article>
      ) : (
        <article className="summary-card" key={label}>
          <div className={`summary-icon ${tone}`}><Icon size={21} strokeWidth={2} /></div>
          <div className="summary-main"><p>{label}</p><strong>{value}</strong></div>
        </article>
      ))}
    </section>
  )
}
