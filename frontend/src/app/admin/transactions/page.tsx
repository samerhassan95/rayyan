'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { useLanguage } from '../../../i18n/LanguageContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function AdminTransactions() {
  const { t, isRTL, language } = useLanguage()
  const [transactions, setTransactions] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Daily')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('')
  const [dateRange, setDateRange] = useState({
    start: '2025-01-01',
    end: '2026-12-31'
  })
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchData()
  }, [statusFilter, paymentTypeFilter, dateRange, currentPage, filter])

  const fetchData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')

      if (!token) {
        console.error('No token found - user needs to login');
        setLoading(false)
        return
      }

      const headers = { Authorization: `Bearer ${token}` }

      const transactionsResponse = await axios.get(`${API_URL}/api/transactions`, {
        headers,
        params: {
          status: statusFilter,
          paymentMethod: paymentTypeFilter,
          startDate: dateRange.start,
          endDate: dateRange.end,
          page: currentPage,
          limit: 10
        }
      })

      const analyticsResponse = await axios.get(`${API_URL}/api/transactions/analytics`, {
        headers,
        params: {
          period: filter.toLowerCase(),
          startDate: dateRange.start,
          endDate: dateRange.end
        }
      })

      setTransactions(transactionsResponse.data.transactions || [])
      setAnalytics(analyticsResponse.data || {})
    } catch (error: any) {
      console.error('❌ Error fetching data:', error)
      setTransactions([])
      setAnalytics({
        totalRevenue: 0,
        monthlyVolume: 0,
        failedTransactions: 0,
        revenueGrowth: 0,
        revenueData: []
      })
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setStatusFilter('')
    setPaymentTypeFilter('')
    setDateRange({ start: '2025-01-01', end: '2026-12-31' })
    setCurrentPage(1)
  }

  const exportReport = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }

      await axios.get(`${API_URL}/api/transactions/export`, {
        headers,
        params: {
          format: 'csv',
          status: statusFilter,
          paymentMethod: paymentTypeFilter,
          startDate: dateRange.start,
          endDate: dateRange.end
        }
      })

      const successDiv = document.createElement('div')
      successDiv.className = "fixed top-5 right-5 z-[9999] bg-gradient-to-br from-teal-600 to-teal-800 text-white px-6 py-4 rounded-lg shadow-lg text-sm font-medium"
      successDiv.textContent = t('export_initiated')
      document.body.appendChild(successDiv)
      setTimeout(() => document.body.removeChild(successDiv), 4000)

    } catch (error) {
      const errorDiv = document.createElement('div')
      errorDiv.className = "fixed top-5 right-5 z-[9999] bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg text-sm font-medium"
      errorDiv.textContent = t('export_failed')
      document.body.appendChild(errorDiv)
      setTimeout(() => document.body.removeChild(errorDiv), 4000)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-gray-500">{t('loading')}...</div>
  }

  return (
    <div className={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-semibold text-gray-900">
          {t('transactions_title')}
        </h1>
        <p className="text-gray-500">
          {t('transactions_desc')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
        {[
          { label: t('revenue'), val: `$${analytics.totalRevenue?.toLocaleString() || '0'}`, sub: t('vs_previous_30_days'), growth: analytics.revenueGrowth, icon: '📈' },
          { label: t('monthly_volume'), val: `$${analytics.monthlyVolume?.toLocaleString() || '0'}`, sub: t('processed_this_month'), growth: analytics.volumeGrowth, icon: '📊' },
          { label: t('failed_transactions'), val: `${analytics.failedTransactions || 0}%`, sub: `${t('industry_avg')}: 2.1%`, growth: analytics.failureChange, icon: '⚠️' }
        ].map((card, i) => (
          <div key={i} className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="mb-1 text-xs tracking-wider text-gray-500 uppercase">{card.label}</div>
                <div className="text-3xl font-bold text-gray-900">{card.val}</div>
                <div className="mt-1 text-xs text-gray-400">{card.icon} {card.sub}</div>
              </div>
              <div className={`text-xs font-semibold px-2 py-1 rounded ${card.growth >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                {card.growth >= 0 ? '+' : ''}{card.growth || 0}%
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Trends Chart */}
      <div className="p-6 mb-8 bg-white border border-gray-100 shadow-sm rounded-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">{t('revenue_trends')}</h3>
          <div className="flex gap-3">
            {['Daily', 'Weekly', 'Monthly'].map((p) => (
              <button
                key={p}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${filter === p ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                onClick={() => setFilter(p)}
              >
                {t(p.toLowerCase())}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-[340px]">
          {analytics.revenueData && analytics.revenueData.length > 0 ? (
            <div>
              <div className="h-[300px] bg-gradient-to-b from-slate-50 to-slate-100 rounded-lg flex items-end justify-around p-5 relative">
                {analytics.revenueData.map((data: any, index: number) => {
                  const maxRevenue = Math.max(...analytics.revenueData.map((r: any) => r.amount));
                  const height = maxRevenue > 0 ? (data.amount / maxRevenue) * 200 : 20;
                  const isLast = index === analytics.revenueData.length - 1;

                  return (
                    <div key={index} className="flex flex-col items-center gap-2">
                      <div
                        className={`w-10 rounded-t-md transition-all duration-300 relative group ${isLast ? 'bg-gradient-to-t from-teal-700 to-teal-500 shadow-teal-200 shadow-lg' : 'bg-gradient-to-t from-gray-300 to-gray-200'}`}
                        style={{ height: `${height}px` }}
                      >
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-600">
                          ${Math.round(data.amount / 1000)}k
                        </div>
                      </div>
                      <span className="text-xs font-medium text-gray-500">{data.date}</span>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between mt-4 text-xs text-gray-400">
                <span>{t('period')}: {t(filter.toLowerCase())}</span>
                <span>{t('total')}: ${analytics.revenueData.reduce((sum: number, item: any) => sum + item.amount, 0).toLocaleString()}</span>
              </div>
            </div>
          ) : (
            <div className="h-[300px] bg-slate-50 rounded-lg flex flex-col items-center justify-center gap-3 text-gray-400">
              <div className="text-5xl">📈</div>
              <div>{t('no_revenue_data')}</div>
              <div className="text-xs">{t('adjust_filters')}</div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="px-3 py-2 text-sm border border-gray-200 rounded-md outline-none focus:ring-2 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-400">{t('to')}</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="px-3 py-2 text-sm border border-gray-200 rounded-md outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <select
            className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-md outline-none focus:ring-2 focus:ring-teal-500"
            value={paymentTypeFilter}
            onChange={(e) => setPaymentTypeFilter(e.target.value)}
          >
            <option value="">{t('all_payment_types')}</option>
            <option value="credit_card">{t('credit_card')}</option>
            <option value="bank_transfer">{t('bank_transfer')}</option>
            <option value="digital_wallet">{t('digital_wallet')}</option>
            <option value="paypal">{t('paypal')}</option>
          </select>

          <select
            className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-md outline-none focus:ring-2 focus:ring-teal-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">{t('all_status')}</option>
            <option value="successful">{t('successful')}</option>
            <option value="pending">{t('pending')}</option>
            <option value="failed">{t('failed')}</option>
          </select>
        </div>

        <div className="flex gap-3">
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm text-gray-600 transition-colors bg-white border border-gray-200 rounded-md hover:bg-gray-50"
          >
            {t('clear_filters')}
          </button>
          <button
            onClick={exportReport}
            className="px-4 py-2 text-sm text-white transition-all rounded-md bg-gradient-to-r from-teal-600 to-teal-700 hover:shadow-md"
          >
            ↓ {t('export_report')}
          </button>
        </div>
      </div>

      <div className="mb-4 text-sm text-gray-500">
        {transactions.length > 0 ? (
          `${t('showing')} ${((currentPage - 1) * 10) + 1} ${t('to')} ${Math.min(currentPage * 10, analytics.totalTransactions || transactions.length)} ${t('of')} ${analytics.totalTransactions || transactions.length} ${t('results')}`
        ) : (
          t('no_transactions_found')
        )}
      </div>

      {/* Transactions Table */}
      <div className="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">{t('user_header')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">{t('amount_header')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">{t('date')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">{t('payment_method_header')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">{t('status')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 text-sm font-bold text-white bg-teal-600 rounded-full">
                        {transaction.user.initials}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{transaction.user.name}</div>
                        <div className="text-xs text-gray-400">{transaction.user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    ${transaction.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{transaction.date}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <span>💳</span> {transaction.paymentMethod}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${transaction.status === 'successful' ? 'bg-green-100 text-green-700' :
                        transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                      }`}>
                      {t(transaction.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="p-1 text-xl text-gray-400 hover:text-gray-600">⋯</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {transactions.length > 0 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            className="p-2 transition-colors border border-gray-200 rounded-md disabled:bg-gray-50 disabled:text-gray-300 hover:bg-gray-50"
          >
            ‹
          </button>

          {[...Array(Math.min(5, Math.ceil((analytics.totalTransactions || transactions.length) / 10)))].map((_, index) => {
            const pageNum = index + 1;
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-10 h-10 rounded-md text-sm font-medium transition-all ${currentPage === pageNum ? "bg-teal-600 text-white shadow-md shadow-teal-100" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            disabled={currentPage >= Math.ceil((analytics.totalTransactions || transactions.length) / 10)}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="p-2 transition-colors border border-gray-200 rounded-md disabled:bg-gray-50 disabled:text-gray-300 hover:bg-gray-50"
          >
            ›
          </button>
        </div>
      )}
    </div>
  )
}